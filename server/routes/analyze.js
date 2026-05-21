import { Router } from 'express';
import { analyzeIngredients } from '../lib/glutenRules.js';
import { generateExplanation } from '../lib/explain.js';

const router = Router();

router.post('/analyze', (req, res) => {
  const { text = '' } = req.body || {};
  res.json(analyzeIngredients(text));
});

router.post('/explain', async (req, res) => {
  const payload = req.body || {};
  const analysis = payload.analysis || {
    status: payload.status,
    label: payload.label,
    detectedWords: payload.detectedWords || [],
    possibleWords: payload.possibleWords || [],
    confidence: payload.confidence,
    message: payload.message,
  };

  const explanation = await generateExplanation({ analysis, text: payload.text || '' });
  res.json({ explanation });
});

router.post('/full-analysis', async (req, res) => {
  const { text = '' } = req.body || {};
  const analysis = analyzeIngredients(text);
  const explanation = await generateExplanation({ analysis, text });
  res.json({ analysis, explanation });
});

export default router;
