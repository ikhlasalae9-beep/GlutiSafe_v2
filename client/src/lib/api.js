import { API_URL } from '../config/api.js';

async function request(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Le serveur GlutiSafe ne répond pas correctement.');
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

export function sendChatbotMessage({ message, context }) {
  return request('/api/chatbot/message', { message, context: context || {} });
}
