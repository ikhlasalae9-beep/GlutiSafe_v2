import { requireSupabaseClient } from './supabaseClient.js';

const ANALYSIS_IMAGES_BUCKET = 'analysis-images';

export async function uploadAnalysisImage(file, userId) {
  if (!file || !userId) return null;

  const safeFileName = createSafeFileName(file.name || 'product-image.jpg');
  const path = `${userId}/${Date.now()}-${safeFileName}`;
  const { error } = await requireSupabaseClient().storage.from(ANALYSIS_IMAGES_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(error.message || "Impossible d'enregistrer l'image.");
  return path;
}

export async function getSignedAnalysisImageUrl(path) {
  if (!path) return '';

  const { data, error } = await requireSupabaseClient().storage.from(ANALYSIS_IMAGES_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw new Error(error.message || "Impossible de charger l'image.");
  return data?.signedUrl || '';
}

export async function deleteAnalysisImage(path) {
  if (!path) return;

  const { error } = await requireSupabaseClient().storage.from(ANALYSIS_IMAGES_BUCKET).remove([path]);
  if (error) throw new Error(error.message || "Impossible de supprimer l'image.");
}

function createSafeFileName(fileName) {
  const clean = String(fileName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return clean || 'product-image.jpg';
}
