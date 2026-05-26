import { saveAnalysis } from './history.js';

export async function logCompletedScan({ result, text, inputType }) {
  if (!result?.analysis) return null;

  try {
    return await saveAnalysis({
      inputType,
      fullText: text,
      analysis: result.analysis,
      explanation: result.explanation,
    });
  } catch {
    // Anonymous users may still analyze products. Failed persistence must not
    // break the OCR/Gemini analysis flow.
    return null;
  }
}
