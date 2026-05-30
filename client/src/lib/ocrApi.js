import { API_URL } from '../config/api.js';
import { supabase } from './supabaseClient.js';

const LABEL_READING_TIMEOUT_MS = 20_000;

export async function extractTextWithEasyOCR(file, options = {}) {
  if (!file) {
    throw new Error('Aucune image selectionnee.');
  }

  console.log('[READING] file name:', file.name);
  console.log('[READING] original size:', file.size);

  let baseVariant;
  try {
    console.time('[ANALYSE] image_prepare');
    baseVariant = await prepareImageForReading(file, { name: 'prepared' });
    console.timeEnd('[ANALYSE] image_prepare');
  } catch (error) {
    safeTimeEnd('[ANALYSE] image_prepare');
    console.error('[READING] failed:', error);
    throw new Error("Impossible de preparer l'image pour la lecture. Essayez une autre photo ou saisissez les ingredients manuellement.");
  }

  const variants = [{ name: 'normal', file: baseVariant.file, dimensions: baseVariant.dimensions }];
  let lastPayload = null;
  let serviceError = null;

  try {
    console.time('[ANALYSE] label_reading');
    const payload = await readVariant(variants[0], options);
    const text = normalizeExtractedText(payload.text);
    lastPayload = logReadingPayload(payload, text, variants[0]);
    if (text.length >= 5) {
      console.timeEnd('[ANALYSE] label_reading');
      return lastPayload;
    }

    const enhanced = await prepareImageForReading(file, { name: 'enhanced', grayscale: true, contrast: 1.3, quality: 0.88 });
    variants.push({ name: 'enhanced contrast', file: enhanced.file, dimensions: enhanced.dimensions });
    const retryPayload = await readVariant(variants[1], options);
    const retryText = normalizeExtractedText(retryPayload.text);
    lastPayload = logReadingPayload(retryPayload, retryText, variants[1]);
    if (retryText.length >= 5) {
      console.timeEnd('[ANALYSE] label_reading');
      return lastPayload;
    }
  } catch (error) {
    serviceError = error;
    console.error('[READING] failed:', error);
  } finally {
    safeTimeEnd('[ANALYSE] label_reading');
  }

  if (serviceError?.isTimeout) throw serviceError;
  if (serviceError?.isServiceError || serviceError?.name === 'AbortError') throw serviceError;

  const error = new Error("Nous n'avons pas pu lire suffisamment de texte sur cette image. Essayez une photo plus proche et plus nette, ou saisissez les ingredients manuellement.");
  error.code = 'READING_TEXT_TOO_SHORT';
  error.guidance = shouldSuggestCloserPhoto(file, variants[0]?.dimensions) ? "Essayez de prendre une photo plus proche de la liste des ingredients." : '';
  error.payload = lastPayload;
  throw error;
}

export async function prepareImageForReading(file, options = {}) {
  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  console.log('[READING] image dimensions:', sourceWidth, sourceHeight);

  let scale = 1;
  if (sourceWidth > 1800) {
    scale = 1800 / sourceWidth;
  } else if (sourceWidth < 900) {
    scale = 1200 / sourceWidth;
  }

  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);

  if (options.grayscale || options.contrast) {
    applyImageAdjustments(ctx, width, height, options);
  }

  const blob = await canvasToBlob(canvas, 'image/jpeg', options.quality || 0.9);
  const name = `${stripExtension(file.name || 'label')}-${options.name || 'prepared'}.jpg`;
  console.log('[READING] processed size:', blob.size);

  return {
    file: new File([blob], name, { type: 'image/jpeg' }),
    dimensions: { width, height, sourceWidth, sourceHeight },
  };
}

async function readVariant(variant, options = {}) {
  let response;
  try {
    const token = await getAccessToken();
    response = await fetchWithTimeout(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ base64Image: await fileToDataUrl(variant.file) }),
      signal: options.signal,
    }, LABEL_READING_TIMEOUT_MS);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    if (error.isTimeout) {
      const nextError = new Error("Lecture de l'etiquette trop longue. Essayez une photo plus nette ou passez a la saisie manuelle.");
      nextError.isTimeout = true;
      throw nextError;
    }
    const nextError = new Error("Le service de lecture de l'etiquette est momentanement indisponible. Vous pouvez reessayer ou saisir les ingredients manuellement.");
    nextError.isServiceError = true;
    nextError.cause = error;
    throw nextError;
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    const nextError = new Error("Le service de lecture de l'etiquette est momentanement indisponible. Vous pouvez reessayer ou saisir les ingredients manuellement.");
    nextError.isServiceError = true;
    nextError.cause = error;
    throw nextError;
  }

  if (!response.ok) {
    const nextError = new Error(payload.message || payload.error || "Le service de lecture de l'etiquette est momentanement indisponible. Vous pouvez reessayer ou saisir les ingredients manuellement.");
    nextError.isServiceError = true;
    throw nextError;
  }

  if (!payload.success) {
    return { ...payload, text: '' };
  }

  return payload;
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), timeoutMs);
  const signal = init.signal ? mergeAbortSignals(init.signal, timeoutController.signal) : timeoutController.signal;

  try {
    return await fetch(url, { ...init, signal });
  } catch (error) {
    if (timeoutController.signal.aborted && !init.signal?.aborted) {
      const timeoutError = new Error('Label reading timed out.');
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function mergeAbortSignals(primary, secondary) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (primary.aborted || secondary.aborted) {
    controller.abort();
  } else {
    primary.addEventListener('abort', abort, { once: true });
    secondary.addEventListener('abort', abort, { once: true });
  }
  return controller.signal;
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
    reader.onerror = () => reject(new Error("Impossible de preparer l'image pour la lecture."));
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
    if (options.grayscale) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    }

    data[i] = clamp((r - 128) * contrast + 128);
    data[i + 1] = clamp((g - 128) * contrast + 128);
    data[i + 2] = clamp((b - 128) * contrast + 128);
  }

  ctx.putImageData(imageData, 0, 0);
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
      else reject(new Error("Impossible de preparer l'image."));
    }, type, quality);
  });
}

function shouldSuggestCloserPhoto(file, dimensions) {
  if (!dimensions) return true;
  return file.size > 1_500_000 || Math.max(dimensions.sourceWidth, dimensions.sourceHeight) > 1800;
}

function logReadingPayload(payload, text, variant) {
  console.log('[READING] variant used:', variant.name);
  console.log('[READING] processed size:', variant.file.size);
  console.log('[READING] extracted text length:', text.length);
  console.log('[READING] extracted text preview:', text.slice(0, 200));
  return { ...payload, text, variantUsed: variant.name };
}

function normalizeExtractedText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function safeTimeEnd(label) {
  try {
    console.timeEnd(label);
  } catch {
    // Development-only timing guard.
  }
}

function stripExtension(name) {
  return String(name).replace(/\.[^.]+$/, '');
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
