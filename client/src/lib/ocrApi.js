import { API_URL } from '../config/api.js';
import { supabase } from './supabaseClient.js';

export async function extractTextWithEasyOCR(file) {
  if (!file) {
    throw new Error('Aucune image sélectionnée.');
  }

  let response;
  try {
    const token = await getAccessToken();
    response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ base64Image: await fileToDataUrl(file) }),
    });
  } catch {
    throw new Error('Le service OCR est indisponible. Vous pouvez saisir les ingrédients manuellement.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Réponse OCR invalide. Vous pouvez saisir les ingrédients manuellement.');
  }

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.message || payload.error || "Impossible d'extraire le texte. Vous pouvez saisir les ingrédients manuellement.",
    );
  }

  return {
    ...payload,
    text: String(payload.text || '').replace(/\s+/g, ' ').trim(),
  };
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
    reader.onerror = () => reject(new Error("Impossible de préparer l'image pour l'OCR."));
    reader.readAsDataURL(file);
  });
}
