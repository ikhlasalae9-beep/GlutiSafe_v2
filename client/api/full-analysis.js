import { analyzeIngredients } from './_lib/glutenRules.js';
import { generateExplanation } from './_lib/explain.js';
import { allowPostOnly, readJsonBody } from './_lib/request.js';

export default async function handler(req, res) {
  if (allowPostOnly(req, res)) return;

  const { text = '' } = await readJsonBody(req);
  const analysis = analyzeIngredients(text);
  const explanation = await generateExplanation({ analysis, text });
  return res.status(200).json({ analysis, explanation });
}
