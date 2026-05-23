import { analyzeIngredients } from './_lib/glutenRules.js';
import { allowPostOnly, readJsonBody } from './_lib/request.js';

const DEFAULT_OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image';
const MAX_BASE64_IMAGE_LENGTH = 5_500_000;
const OCR_TEXT_EMPTY_RESPONSE = {
  success: false,
  error: 'OCR_TEXT_EMPTY',
  message: 'Aucun texte clair n’a été détecté. Réessayez avec une photo plus nette.',
};

export default async function handler(req, res) {
  if (allowPostOnly(req, res)) return;

  const body = await readJsonBody(req);
  const image = String(body.base64Image || body.image || '').trim();

  if (image) {
    const ocrResult = await extractTextWithOcrSpace(image);

    if (!ocrResult.success) {
      return res.status(ocrResult.status || 200).json(ocrResult.payload);
    }

    const analysis = analyzeIngredients(ocrResult.text);
    return res.status(200).json({
      success: true,
      text: ocrResult.text,
      engine: 'OCR.space',
      analysis,
    });
  }

  const { text = '' } = body;
  return res.status(200).json(analyzeIngredients(text));
}

async function extractTextWithOcrSpace(base64Image) {
  const apiKey = String(process.env.OCR_SPACE_API_KEY || '').trim();
  const apiUrl = String(process.env.OCR_SPACE_API_URL || DEFAULT_OCR_SPACE_API_URL).trim();

  console.log('[vercel-ocr] config', {
    ocrSpaceApiKey: Boolean(apiKey),
    apiUrl,
  });

  if (!apiKey) {
    return {
      success: false,
      status: 503,
      payload: {
        success: false,
        error: 'OCR_SPACE_API_KEY_MISSING',
        message: 'Le service OCR est momentanément indisponible.',
      },
    };
  }

  if (!isDataImage(base64Image)) {
    return {
      success: false,
      status: 400,
      payload: {
        success: false,
        error: 'OCR_INVALID_IMAGE',
        message: 'Image invalide. Réessayez avec une autre photo.',
      },
    };
  }

  if (base64Image.length > MAX_BASE64_IMAGE_LENGTH) {
    return {
      success: false,
      status: 413,
      payload: {
        success: false,
        error: 'OCR_IMAGE_TOO_LARGE',
        message: 'Image trop lourde. Réessayez avec une photo plus légère.',
      },
    };
  }

  const form = new URLSearchParams();
  form.set('apikey', apiKey);
  form.set('language', 'fre');
  form.set('isOverlayRequired', 'false');
  form.set('detectOrientation', 'true');
  form.set('scale', 'true');
  form.set('OCREngine', '2');
  form.set('base64Image', base64Image);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    const payload = await readOcrSpaceResponse(response);
    const parsedText = String(payload?.ParsedResults?.[0]?.ParsedText || '').replace(/\s+/g, ' ').trim();

    console.log('[vercel-ocr] response', {
      status: response.status,
      textLength: parsedText.length,
      isErroredOnProcessing: Boolean(payload?.IsErroredOnProcessing),
    });

    if (!response.ok || payload?.IsErroredOnProcessing) {
      return {
        success: false,
        status: response.ok ? 502 : response.status,
        payload: {
          success: false,
          error: 'OCR_SPACE_API_FAILURE',
          message: cleanOcrSpaceError(payload) || 'Le service OCR est momentanément indisponible.',
        },
      };
    }

    if (!parsedText) {
      return {
        success: false,
        status: 200,
        payload: OCR_TEXT_EMPTY_RESPONSE,
      };
    }

    return {
      success: true,
      text: parsedText,
    };
  } catch (error) {
    console.error('[vercel-ocr] request failed', {
      message: error?.message,
    });

    return {
      success: false,
      status: 503,
      payload: {
        success: false,
        error: 'OCR_SPACE_NETWORK_ERROR',
        message: 'Le service OCR est momentanément indisponible.',
      },
    };
  }
}

async function readOcrSpaceResponse(response) {
  const rawBody = await response.text();

  try {
    return rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return null;
  }
}

function cleanOcrSpaceError(payload) {
  const errorMessage = payload?.ErrorMessage;
  if (Array.isArray(errorMessage)) return errorMessage.filter(Boolean).join(' ');
  return typeof errorMessage === 'string' ? errorMessage : '';
}

function isDataImage(value) {
  return /^data:image\/(png|jpe?g|webp|bmp);base64,/i.test(value);
}
