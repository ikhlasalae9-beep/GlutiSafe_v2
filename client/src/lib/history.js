import { getStoredUser } from './auth.js';

export function getHistoryKey(user = getStoredUser()) {
  return user?.email ? `history_${user.email}` : null;
}

export function textPreview(text = '') {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > 130 ? `${clean.slice(0, 130)}...` : clean;
}

export function getHistory(user = getStoredUser()) {
  const historyKey = getHistoryKey(user);
  if (!historyKey) return [];

  try {
    return JSON.parse(localStorage.getItem(historyKey) || '[]');
  } catch {
    return [];
  }
}

export function saveAnalysis(entry) {
  const historyKey = getHistoryKey();
  if (!historyKey) {
    throw new Error('You must be signed in to save analysis history.');
  }

  const nextEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    inputType: entry.inputType || 'manual',
    textPreview: entry.textPreview || textPreview(entry.fullText || ''),
    ...entry,
  };
  const next = [nextEntry, ...getHistory()].slice(0, 50);
  localStorage.setItem(historyKey, JSON.stringify(next));
  return nextEntry;
}

export function deleteAnalysis(id) {
  const historyKey = getHistoryKey();
  if (!historyKey) return [];

  const next = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(historyKey, JSON.stringify(next));
  return next;
}

export function clearHistory() {
  const historyKey = getHistoryKey();
  if (historyKey) localStorage.removeItem(historyKey);
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
