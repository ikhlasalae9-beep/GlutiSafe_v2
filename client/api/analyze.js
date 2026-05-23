import { analyzeIngredients } from './_lib/glutenRules.js';
import { allowPostOnly, readJsonBody } from './_lib/request.js';

export default async function handler(req, res) {
  if (allowPostOnly(req, res)) return;

  const { text = '' } = await readJsonBody(req);
  return res.status(200).json(analyzeIngredients(text));
}
