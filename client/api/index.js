import {
  activateUserPack,
  assertCanUseAiAssistant,
  assertCanUserAnalyze,
  blockUser,
  confirmPayment,
  createManualPackRequest,
  deleteUserAccount,
  expireUserPack,
  getRequesterPackAccess,
  incrementFreeAiAssistantUsage,
  makeUserAdmin,
  readAdminStats,
  rejectPayment,
  resendReceiptEmail,
  testEmail,
  unblockUser,
} from '../src/server/adminStats.js';
import { GLUTISAFE_SYSTEM_PROMPT, createChatCompletion } from '../src/server/aiService.js';
import { generateExplanation } from '../src/server/explain.js';
import { analyzeIngredients } from '../src/server/glutenRules.js';
import { readJsonBody } from '../src/server/request.js';

const DEFAULT_OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image';
const MAX_BASE64_IMAGE_LENGTH = 5_500_000;
const MAX_MESSAGE_LENGTH = 1200;
const OCR_TEXT_EMPTY_RESPONSE = {
  success: false,
  error: 'OCR_TEXT_EMPTY',
  message: 'Aucun texte clair n’a été détecté. Réessayez avec une photo plus nette.',
};
const CHATBOT_CONTENT_FILTER_REPLY =
  'Je ne peux pas répondre à cette demande telle qu’elle est formulée. Reformulez votre question autour des ingrédients, du gluten ou du résultat de scan.';
const SERVICE_UNAVAILABLE_MESSAGE = 'Le service d’assistance est momentanément indisponible.';

export default async function handler(req, res) {
  const pathname = getRequestPath(req);

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      return res.status(200).json({ status: 'ok', service: 'glutisafe-vercel-api' });
    }

    if (req.method === 'GET' && pathname === '/api/admin/stats') {
      return res.status(200).json(await readAdminStats({ requesterToken: readBearerToken(req) }));
    }

    if (req.method === 'POST' && pathname === '/api/analyze') {
      return handleAnalyze(req, res);
    }

    if (req.method === 'POST' && pathname === '/api/full-analysis') {
      return handleFullAnalysis(req, res);
    }

    if (req.method === 'POST' && pathname === '/api/explain') {
      return handleExplain(req, res);
    }

    if (req.method === 'POST' && pathname === '/api/chatbot/message') {
      return handleChatbot(req, res);
    }

    if (req.method === 'POST' && pathname === '/api/test-email') {
      const body = await readJsonBody(req);
      return sendAdminResult(res, testEmail({ requesterToken: readBearerToken(req), to: body.to }));
    }

    if (req.method === 'POST' && pathname === '/api/admin/delete-user') {
      return handleDeleteUser(req, res);
    }

    if (req.method === 'POST' && pathname === '/api/packs/manual-request') {
      const body = await readJsonBody(req);
      return sendApiResult(res, createManualPackRequest({ requesterToken: readBearerToken(req), packType: body.pack_type || body.packType }));
    }

    const adminUserMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/([^/]+)$/);
    if (req.method === 'POST' && adminUserMatch) {
      return handleAdminUserAction(req, res, decodeURIComponent(adminUserMatch[1]), adminUserMatch[2]);
    }

    const adminPaymentMatch = pathname.match(/^\/api\/admin\/payments\/([^/]+)\/([^/]+)$/);
    if (req.method === 'POST' && adminPaymentMatch) {
      return handleAdminPaymentAction(req, res, decodeURIComponent(adminPaymentMatch[1]), adminPaymentMatch[2]);
    }

    const adminReceiptMatch = pathname.match(/^\/api\/admin\/receipts\/([^/]+)\/resend$/);
    if (req.method === 'POST' && adminReceiptMatch) {
      return sendAdminResult(res, resendReceiptEmail({ requesterToken: readBearerToken(req), receiptId: decodeURIComponent(adminReceiptMatch[1]) }));
    }

    if (req.method === 'POST' && pathname === '/api/admin/activate-pack') {
      const body = await readJsonBody(req);
      return sendAdminResult(res, activateUserPack({ requesterToken: readBearerToken(req), userId: body.userId, packType: body.pack_type || body.packType }));
    }

    if (req.method === 'POST' && pathname === '/api/admin/expire-pack') {
      const body = await readJsonBody(req);
      return sendAdminResult(res, expireUserPack({ requesterToken: readBearerToken(req), userId: body.userId }));
    }

    if (req.method === 'POST' && pathname === '/api/admin/block-user') {
      const body = await readJsonBody(req);
      return sendAdminResult(res, blockUser({ requesterToken: readBearerToken(req), userId: body.userId }));
    }

    return res.status(404).json({ error: 'API_ROUTE_NOT_FOUND', message: `Route ${pathname} introuvable.` });
  } catch (error) {
    console.error('[vercel-api] request failed', { pathname, method: req.method, message: error.message });
    return res.status(error.status || 503).json({
      error: 'API_UNAVAILABLE',
      message: error.message || 'Service API indisponible.',
    });
  }
}

async function handleAnalyze(req, res) {
  await enforceAnalyzeLimitIfAuthenticated(req);
  const body = await readJsonBody(req);
  const image = String(body.base64Image || body.image || '').trim();

  if (image) {
    const ocrResult = await extractTextWithOcrSpace(image);

    if (!ocrResult.success) {
      return res.status(ocrResult.status || 200).json(ocrResult.payload);
    }

    return res.status(200).json({
      success: true,
      text: ocrResult.text,
      engine: 'OCR.space',
      analysis: analyzeIngredients(ocrResult.text),
    });
  }

  return res.status(200).json(analyzeIngredients(body.text || ''));
}

async function handleFullAnalysis(req, res) {
  await enforceAnalyzeLimitIfAuthenticated(req);
  const access = await getOptionalRequesterPackAccess(req);
  const { text = '' } = await readJsonBody(req);
  const analysis = analyzeIngredients(text);
  if (!access || !access.premium) {
    return res.status(200).json({ analysis, explanation: '', explanationAvailable: false });
  }
  const explanation = await generateExplanation({ analysis, text });
  return res.status(200).json({ analysis, explanation, explanationAvailable: true });
}

async function enforceAnalyzeLimitIfAuthenticated(req) {
  const token = readBearerToken(req);
  if (!token) return;
  await assertCanUserAnalyze({ requesterToken: token });
}

async function handleExplain(req, res) {
  const access = await getOptionalRequesterPackAccess(req);
  if (!access || !access.premium) {
    return res.status(403).json({
      error: 'AI_EXPLANATION_PREMIUM_ONLY',
      message: 'L’explication IA est disponible avec le Pack Mensuel ou Annuel.',
    });
  }

  const payload = await readJsonBody(req);
  const analysis = payload.analysis || {
    status: payload.status,
    label: payload.label,
    detectedWords: payload.detectedWords || [],
    possibleWords: payload.possibleWords || [],
    confidence: payload.confidence,
    message: payload.message,
  };

  const explanation = await generateExplanation({ analysis, text: payload.text || '' });
  return res.status(200).json({ explanation });
}

async function handleChatbot(req, res) {
  const { message, context = {} } = await readJsonBody(req);
  const cleanMessage = String(message || '').trim();
  const safeContext = context && typeof context === 'object' && !Array.isArray(context) ? context : {};
  const requesterToken = readBearerToken(req);
  let aiAccess = null;

  if (!cleanMessage) {
    return res.status(400).json({ error: 'MESSAGE_REQUIRED', message: 'Le message est obligatoire.' });
  }

  if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: 'MESSAGE_TOO_LONG', message: 'Le message est trop long.' });
  }

  try {
    aiAccess = await assertCanUseAiAssistant({ requesterToken });
  } catch (error) {
    return res.status(error.status || 401).json({
      error: error.status === 429 ? 'FREE_AI_LIMIT_REACHED' : 'AI_ASSISTANT_UNAVAILABLE',
      message: error.message || 'Connectez-vous pour utiliser l’assistant IA.',
    });
  }

  if (isGreeting(cleanMessage)) {
    await incrementFreeAiAssistantUsage({ requesterToken });
    return res.status(200).json({ reply: greetingReply(cleanMessage) });
  }

  try {
    const reply = await createChatCompletion({
      messages: [
        { role: 'system', content: GLUTISAFE_SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(cleanMessage, safeContext) },
      ],
      temperature: 0.3,
      maxTokens: 500,
    });

    if (aiAccess?.limited) {
      await incrementFreeAiAssistantUsage({ requesterToken });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('[vercel-chatbot:route] provider error', {
      code: error.code,
      status: error.status,
      message: error.message,
      details: error.details,
    });

    if (error.code === 'GITHUB_MODELS_CONTENT_FILTER') {
      return res.status(200).json({ reply: CHATBOT_CONTENT_FILTER_REPLY });
    }

    return res.status(error.status || 503).json({
      error: 'CHATBOT_SERVICE_UNAVAILABLE',
      message: SERVICE_UNAVAILABLE_MESSAGE,
    });
  }
}

async function getOptionalRequesterPackAccess(req) {
  const token = readBearerToken(req);
  if (!token) return null;
  try {
    return await getRequesterPackAccess({ requesterToken: token });
  } catch {
    return null;
  }
}

async function handleDeleteUser(req, res) {
  const body = await readJsonBody(req);
  return sendAdminResult(
    res,
    deleteUserAccount({
      requesterToken: readBearerToken(req),
      userId: body.userId,
      deleteAnalyses: Boolean(body.deleteAnalyses),
    }),
  );
}

async function handleAdminUserAction(req, res, userId, action) {
  const body = await readJsonBody(req);
  const requesterToken = readBearerToken(req);
  const actions = {
    'activate-pack': () => activateUserPack({ requesterToken, userId, packType: body.pack_type || body.packType }),
    'expire-pack': () => expireUserPack({ requesterToken, userId }),
    block: () => blockUser({ requesterToken, userId }),
    unblock: () => unblockUser({ requesterToken, userId }),
    'make-admin': () => makeUserAdmin({ requesterToken, userId }),
  };

  if (!actions[action]) {
    return res.status(404).json({ error: 'ADMIN_ACTION_NOT_FOUND', message: 'Action admin introuvable.' });
  }

  return sendAdminResult(res, actions[action]());
}

async function handleAdminPaymentAction(req, res, paymentId, action) {
  const requesterToken = readBearerToken(req);
  const actions = {
    confirm: () => confirmPayment({ requesterToken, paymentId }),
    reject: () => rejectPayment({ requesterToken, paymentId }),
  };

  if (!actions[action]) {
    return res.status(404).json({ error: 'ADMIN_PAYMENT_ACTION_NOT_FOUND', message: 'Action paiement introuvable.' });
  }

  return sendAdminResult(res, actions[action]());
}

async function sendAdminResult(res, promise) {
  try {
    return res.status(200).json(await promise);
  } catch (error) {
    console.error('[vercel-admin] action failed', { message: error.message });
    return res.status(error.status || 503).json({
      error: 'ADMIN_ACTION_UNAVAILABLE',
      message: error.message || 'Action admin impossible.',
    });
  }
}

async function sendApiResult(res, promise) {
  try {
    return res.status(200).json(await promise);
  } catch (error) {
    console.error('[vercel-api] action failed', { message: error.message, details: error.details });
    return res.status(error.status || 503).json({
      error: 'API_ACTION_UNAVAILABLE',
      message: error.message || 'Action impossible.',
    });
  }
}

async function extractTextWithOcrSpace(base64Image) {
  const apiKey = String(process.env.OCR_SPACE_API_KEY || '').trim();
  const apiUrl = String(process.env.OCR_SPACE_API_URL || DEFAULT_OCR_SPACE_API_URL).trim();

  if (!apiKey) {
    return {
      success: false,
      status: 503,
      payload: { success: false, error: 'OCR_SPACE_API_KEY_MISSING', message: 'Le service OCR est momentanément indisponible.' },
    };
  }

  if (!isDataImage(base64Image)) {
    return {
      success: false,
      status: 400,
      payload: { success: false, error: 'OCR_INVALID_IMAGE', message: 'Image invalide. Réessayez avec une autre photo.' },
    };
  }

  if (base64Image.length > MAX_BASE64_IMAGE_LENGTH) {
    return {
      success: false,
      status: 413,
      payload: { success: false, error: 'OCR_IMAGE_TOO_LARGE', message: 'Image trop lourde. Réessayez avec une photo plus légère.' },
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    const payload = await readTextJson(response);
    const parsedText = String(payload?.ParsedResults?.[0]?.ParsedText || '').replace(/\s+/g, ' ').trim();

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
      return { success: false, status: 200, payload: OCR_TEXT_EMPTY_RESPONSE };
    }

    return { success: true, text: parsedText };
  } catch (error) {
    console.error('[vercel-ocr] request failed', { message: error?.message });
    return {
      success: false,
      status: 503,
      payload: { success: false, error: 'OCR_SPACE_NETWORK_ERROR', message: 'Le service OCR est momentanément indisponible.' },
    };
  }
}

async function readTextJson(response) {
  const rawBody = await response.text();

  try {
    return rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return null;
  }
}

function getRequestPath(req) {
  const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
  return url.pathname.replace(/\/+$/, '') || '/';
}

function readBearerToken(req) {
  return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

function cleanOcrSpaceError(payload) {
  const errorMessage = payload?.ErrorMessage;
  if (Array.isArray(errorMessage)) return errorMessage.filter(Boolean).join(' ');
  return typeof errorMessage === 'string' ? errorMessage : '';
}

function isDataImage(value) {
  return /^data:image\/(png|jpe?g|webp|bmp);base64,/i.test(value);
}

function buildUserPrompt(message, context = {}) {
  const safeContext = context && typeof context === 'object' && !Array.isArray(context) ? context : {};
  const includeContext = hasMeaningfulScanContext(safeContext) && isScanRelated(message);

  if (!includeContext) {
    return ['User message:', truncateText(message, MAX_MESSAGE_LENGTH), '', 'Reply in the same language and style as the user.'].join('\n');
  }

  const verdict = safeContext.verdict || safeContext.lastScanResult?.status || safeContext.lastScanResult?.label || 'none';
  const ingredients = truncateText(safeContext.ingredients || safeContext.lastScanResult?.text || '', 500) || 'none';
  const riskyIngredients = safeContext.detectedRiskyIngredients?.length
    ? safeContext.detectedRiskyIngredients.join(', ')
    : safeContext.lastScanResult?.detectedWords?.join(', ') || 'none';

  return [
    'User message:',
    truncateText(message, MAX_MESSAGE_LENGTH),
    '',
    'Scan context:',
    `- Verdict: ${truncateText(verdict, 120)}`,
    `- Ingredients: ${ingredients}`,
    `- Risky ingredients: ${truncateText(riskyIngredients, 300)}`,
    '',
    'Reply in the same language and style as the user. Explain briefly and carefully.',
  ].join('\n');
}

function hasMeaningfulScanContext(context) {
  return Boolean(
    context.verdict ||
      context.ingredients ||
      context.lastScanResult ||
      context.detectedRiskyIngredients?.length ||
      context.warnings?.length,
  );
}

function isScanRelated(message) {
  const normalized = normalizeText(message);
  const keywords = [
    'scan',
    'resultat',
    'résultat',
    'ingredients',
    'ingrédient',
    'ingredient',
    'gluten',
    'risque',
    'produit',
    'label',
    'etiquette',
    'étiquette',
    'detecte',
    'détecté',
    'safe',
    'danger',
    'analyse',
    'ocr',
    'شرح',
    'نتيجة',
  ];

  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)));
}

function isGreeting(message) {
  const normalized = normalizeText(message);
  return ['salam', 'slam', 'salamo', 'السلام', 'bonjour', 'salut', 'hello', 'hi'].includes(normalized);
}

function greetingReply(message) {
  const normalized = normalizeText(message);

  if (['salam', 'slam', 'salamo', 'السلام'].includes(normalized)) {
    return 'Salam, ana assistant GlutiSafe. Sowlni 3la les ingrédients, gluten, wla résultat dyal scan.';
  }

  if (['bonjour', 'salut'].includes(normalized)) {
    return 'Bonjour. Comment puis-je vous aider avec les ingrédients, le gluten ou votre résultat de scan ?';
  }

  return "Hi. I'm GlutiSafe Assistant. Ask me about ingredients, gluten, or your scan result.";
}

function truncateText(value, maxLength) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength)}...` : clean;
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?!.,،؛:]+/g, '')
    .replace(/\s+/g, ' ');
}
