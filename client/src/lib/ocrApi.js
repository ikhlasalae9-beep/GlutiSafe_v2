import { API_URL } from '../config/api.js';
import { supabase } from './supabaseClient.js';

export async function extractTextWithEasyOCR(file) {
  if (!file) {
    throw new Error('Aucune image sélectionnée.');
  }

  console.log('[READING] file name:', file.name);
  console.log('[READING] original size:', file.size);

  let variants;
  try {
    variants = await prepareImageVariantsForReading(file);
  } catch (error) {
    console.error('[READING] failed:', error);
    throw new Error("Impossible de préparer l'image pour la lecture. Essayez une autre photo ou saisissez les ingrédients manuellement.");
  }

  let lastPayload = null;
  let serviceError = null;

  for (const variant of variants) {
    try {
      const payload = await readVariant(variant);
      const text = String(payload.text || '').replace(/\s+/g, ' ').trim();
      console.log('[READING] variant used:', variant.name);
      console.log('[READING] extracted text length:', text.length);
      console.log('[READING] extracted text preview:', text.slice(0, 200));
      lastPayload = { ...payload, text, variantUsed: variant.name };
      if (text.length >= 5) return lastPayload;
    } catch (error) {
      serviceError = error;
      console.error('[READING] failed:', error);
      if (error.isServiceError) break;
    }
  }

  if (serviceError?.isServiceError) throw serviceError;

  const error = new Error("Nous n’avons pas pu lire suffisamment de texte sur cette image. Essayez une photo plus proche et plus nette, ou saisissez les ingrédients manuellement.");
  error.code = 'READING_TEXT_TOO_SHORT';
  error.guidance = shouldSuggestCloserPhoto(file, variants[0]?.dimensions) ? 'Essayez de prendre une photo plus proche de la liste des ingrédients.' : '';
  error.payload = lastPayload;
  throw error;
}

async function readVariant(variant) {
  let response;
  try {
    const token = await getAccessToken();
    response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ base64Image: await fileToDataUrl(variant.file) }),
    });
  } catch (error) {
    const nextError = new Error("Le service de lecture de l’étiquette est momentanément indisponible. Vous pouvez réessayer ou saisir les ingrédients manuellement.");
    nextError.isServiceError = true;
    nextError.cause = error;
    throw nextError;
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    const nextError = new Error("Le service de lecture de l’étiquette est momentanément indisponible. Vous pouvez réessayer ou saisir les ingrédients manuellement.");
    nextError.isServiceError = true;
    nextError.cause = error;
    throw nextError;
  }

  if (!response.ok) {
    const nextError = new Error(payload.message || payload.error || "Le service de lecture de l’étiquette est momentanément indisponible. Vous pouvez réessayer ou saisir les ingrédients manuellement.");
    nextError.isServiceError = true;
    throw nextError;
  }

  if (!payload.success) {
    return { ...payload, text: '' };
  }

  return payload;
}

export async function prepareImageForReading(file, options = {}) {
  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  console.log('[READING] image dimensions:', sourceWidth, sourceHeight);

  const maxWidth = 2000;
  const scaleDown = sourceWidth > maxWidth ? maxWidth / sourceWidth : 1;
  const scaleUp = Math.max(sourceWidth, sourceHeight) < 900 ? 2 : 1;
  const scale = scaleDown < 1 ? scaleDown : scaleUp;
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);

  if (options.grayscale || options.contrast || options.sharpen || options.threshold) {
    applyImageAdjustments(ctx, width, height, options);
  }

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
  const name = `${stripExtension(file.name || 'label')}-${options.name || 'prepared'}.jpg`;
  return {
    file: new File([blob], name, { type: 'image/jpeg' }),
    dimensions: { width, height, sourceWidth, sourceHeight },
  };
}

async function prepareImageVariantsForReading(file) {
  const base = await prepareImageForReading(file, { name: 'resized' });
  const grayscale = await prepareImageForReading(file, { name: 'grayscale-contrast', grayscale: true, contrast: 1.28 });
  const sharpened = await prepareImageForReading(file, { name: 'sharpened-contrast', grayscale: true, contrast: 1.35, sharpen: true });
  const threshold = await prepareImageForReading(file, { name: 'threshold', grayscale: true, contrast: 1.25, threshold: true });

  return [
    { name: 'A original/resized', file: base.file, dimensions: base.dimensions },
    { name: 'B grayscale contrast', file: grayscale.file, dimensions: grayscale.dimensions },
    { name: 'C sharpen contrast', file: sharpened.file, dimensions: sharpened.dimensions },
    { name: 'D black-white threshold', file: threshold.file, dimensions: threshold.dimensions },
  ];
}

async function getAccessToken() {
  if (!supabase) return '';
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error("Impossible de préparer l'image pour la lecture."));
    reader.readAsDataURL(file);
  });
}

function applyImageAdjustments(ctx, width, height, options) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const contrast = Number(options.contrast || 1);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    if (options.grayscale || options.threshold) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    }

    r = clamp((r - 128) * contrast + 128);
    g = clamp((g - 128) * contrast + 128);
    b = clamp((b - 128) * contrast + 128);

    if (options.threshold) {
      const value = (r + g + b) / 3 > 150 ? 255 : 0;
      r = value;
      g = value;
      b = value;
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);
  if (options.sharpen) sharpenCanvas(ctx, width, height);
}

function sharpenCanvas(ctx, width, height) {
  const src = ctx.getImageData(0, 0, width, height);
  const out = ctx.createImageData(width, height);
  const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const side = 3;
  const half = 1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      for (let c = 0; c < 3; c += 1) {
        let sum = 0;
        for (let cy = 0; cy < side; cy += 1) {
          for (let cx = 0; cx < side; cx += 1) {
            const scy = Math.min(height - 1, Math.max(0, y + cy - half));
            const scx = Math.min(width - 1, Math.max(0, x + cx - half));
            const srcOffset = (scy * width + scx) * 4 + c;
            sum += src.data[srcOffset] * weights[cy * side + cx];
          }
        }
        out.data[(y * width + x) * 4 + c] = clamp(sum);
      }
      out.data[(y * width + x) * 4 + 3] = src.data[(y * width + x) * 4 + 3];
    }
  }

  ctx.putImageData(out, 0, 0);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de charger l'image."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Impossible de préparer l'image."));
    }, type, quality);
  });
}

function shouldSuggestCloserPhoto(file, dimensions) {
  if (!dimensions) return true;
  return file.size > 1_500_000 || Math.max(dimensions.sourceWidth, dimensions.sourceHeight) > 1800;
}

function stripExtension(name) {
  return String(name).replace(/\.[^.]+$/, '');
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
