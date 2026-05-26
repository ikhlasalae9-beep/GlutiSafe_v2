import { getCurrentUser } from './auth.js';
import { requireSupabaseClient } from './supabaseClient.js';

export function textPreview(text = '') {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > 130 ? `${clean.slice(0, 130)}...` : clean;
}

export async function getHistory() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await requireSupabaseClient()
    .from('analyses')
    .select('id, input_type, ocr_text, status, label, detected_words, possible_words, safe_claims, confidence, explanation, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message || "Impossible de charger l'historique.");
  return (data || []).map(normalizeAnalysisRow);
}

export async function saveAnalysis(entry) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Connectez-vous pour sauvegarder cette analyse.');
  }

  if (entry.id) return entry;

  const analysis = entry.analysis || {};
  const payload = {
    user_id: user.id,
    input_type: entry.inputType || 'manual',
    ocr_text: entry.fullText || entry.text || '',
    status: analysis.status || '',
    label: analysis.label || '',
    detected_words: analysis.detectedWords || [],
    possible_words: analysis.possibleWords || [],
    safe_claims: analysis.safeClaims || [],
    confidence: analysis.confidence || '',
    explanation: entry.explanation || '',
  };

  const { data, error } = await requireSupabaseClient().from('analyses').insert(payload).select('id').single();
  if (error) throw new Error(error.message || "Impossible d'enregistrer l'analyse.");

  return { ...entry, id: data.id, createdAt: new Date().toISOString() };
}

export async function deleteAnalysis(id) {
  const { error } = await requireSupabaseClient().from('analyses').delete().eq('id', id);
  if (error) throw new Error(error.message || "Impossible de supprimer l'analyse.");
  return getHistory();
}

export async function clearHistory() {
  return [];
}

export function getAnalysisStatus(item = {}) {
  return String(item.analysis?.status || item.analysis?.label || item.status || '').trim().toLowerCase();
}

export function isSafeHistoryItem(item) {
  const status = getAnalysisStatus(item);
  return status === 'safe' || status === 'no_gluten_detected' || status.includes('no gluten') || status.includes('safe');
}

export function isAlertHistoryItem(item) {
  const status = getAnalysisStatus(item);
  return status === 'danger' || status === 'contains_gluten' || status.includes('gluten detected') || status.includes('danger');
}

function normalizeAnalysisRow(row = {}) {
  return {
    id: row.id,
    createdAt: row.created_at,
    inputType: row.input_type || 'manual',
    fullText: row.ocr_text || '',
    textPreview: textPreview(row.ocr_text || ''),
    explanation: row.explanation || '',
    analysis: {
      status: row.status || '',
      label: row.label || row.status || 'Analyse',
      detectedWords: row.detected_words || [],
      possibleWords: row.possible_words || [],
      safeClaims: row.safe_claims || [],
      confidence: row.confidence || '',
    },
  };
}
