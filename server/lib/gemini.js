import { GoogleGenAI } from '@google/genai';

const EXPLANATION_PROMPT =
  'You are the GlutiSafe assistant. Explain the result in simple French. The verdict is already decided by the rule engine and must not be changed. Do not give medical diagnosis. Do not claim the product is certified gluten-free. Remind the user to verify the official label and manufacturer information. Keep the explanation between 2 and 4 short sentences.';

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function getModel() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

function cleanGeminiText(value = '') {
  return String(value)
    .replace(/^```(?:json|text)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

export async function explainWithGemini({ analysis, text }) {
  const ai = getGeminiClient();
  const prompt = [
    EXPLANATION_PROMPT,
    '',
    `Verdict fixe: ${analysis.label} (${analysis.status})`,
    `Mots directs détectés: ${(analysis.detectedWords || []).join(', ') || 'aucun'}`,
    `Mots possibles détectés: ${(analysis.possibleWords || []).join(', ') || 'aucun'}`,
    `Message du moteur de règles: ${analysis.message || ''}`,
    `Texte analysé: ${String(text || '').slice(0, 1400)}`,
  ].join('\n');

  const response = await ai.models.generateContent({
    model: getModel(),
    contents: prompt,
    config: {
      temperature: 0.2,
      maxOutputTokens: 180,
    },
  });

  return cleanGeminiText(response.text || '');
}
