import { API_URL } from '../config/api.js';
import { supabase } from './supabaseClient.js';

async function request(path, body) {
  const token = await getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.message || 'Le serveur GlutiSafe ne r?pond pas correctement.');
    error.code = payload.error || '';
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export function analyzeText(text) {
  return request('/api/analyze', { text });
}

export function explainAnalysis(payload) {
  return request('/api/explain', payload);
}

export function fullAnalysis(text) {
  return request('/api/full-analysis', { text });
}

async function getAccessToken() {
  if (!supabase) return '';
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

export function sendChatbotMessage({ message, context }) {
  return request('/api/chatbot/message', { message, context: context || {} });
}
