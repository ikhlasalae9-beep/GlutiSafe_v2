const OCR_API_URL = import.meta.env.VITE_OCR_API_URL || 'http://localhost:8000';

export async function extractTextWithEasyOCR(file) {
  if (!file) {
    throw new Error('Aucune image sélectionnée.');
  }

  const formData = new FormData();
  formData.append('image', file);

  let response;
  try {
    response = await fetch(`${OCR_API_URL}/ocr/extract`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error('Le service OCR EasyOCR est indisponible. Vous pouvez saisir les ingrédients manuellement.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Réponse OCR invalide. Vous pouvez saisir les ingrédients manuellement.');
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Impossible d'extraire le texte avec EasyOCR. Vous pouvez saisir les ingrédients manuellement.");
  }

  return {
    ...payload,
    text: String(payload.text || '').replace(/\s+/g, ' ').trim(),
  };
}
