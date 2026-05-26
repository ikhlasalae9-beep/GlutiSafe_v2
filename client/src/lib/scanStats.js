import { saveAnalysis } from './history.js';

export async function logCompletedScan({ result, text, inputType, productName, imageFile }) {
  if (!result?.analysis) return null;

  try {
    return await saveAnalysis({
      inputType,
      fullText: text,
      analysis: result.analysis,
      explanation: result.explanation,
      productName,
      imageFile,
    });
  } catch {
    // Anonymous users may still analyze products. Failed persistence must not
    // break the OCR/AI analysis flow.
    return null;
  }
}
