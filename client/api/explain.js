import { generateExplanation } from './_lib/explain.js';
import { allowPostOnly, readJsonBody } from './_lib/request.js';

export default async function handler(req, res) {
  if (allowPostOnly(req, res)) return;

  const payload = await readJsonBody(req);
  const analysis = payload.analysis || {
    status: payload.status,
    label: payload.label,
    detectedWords: payload.detectedWords || [],
    possibleWords: payload.possibleWords || [],
    confidence: payload.confidence,
    message: payload.message,
  };

  const explanation = await generateExplanation({ analysis, text: payload.text || '' });
  return res.status(200).json({ explanation });
}
