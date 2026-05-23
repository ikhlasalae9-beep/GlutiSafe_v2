import { createChatCompletion } from './aiService.js';

const EXPLANATION_SYSTEM_PROMPT =
  'You are the GlutiSafe assistant. Explain the already-decided gluten scan result in simple French. Keep it short and practical. Do not change the verdict.';

const fallbackExplanations = {
  CONTAINS_GLUTEN:
    'Des ingrédients liés au gluten ont été détectés. Ce produit est donc à éviter ou à vérifier attentivement si vous suivez un régime sans gluten. Vérifiez toujours l’étiquette officielle et les mentions du fabricant.',
  POSSIBLE_RISK:
    'Certains termes peuvent indiquer un risque de traces ou de contamination croisée. Le produit nécessite une vérification plus attentive. Consultez les mentions officielles du fabricant avant consommation.',
  NO_GLUTEN_DETECTED:
    'Aucun mot à risque lié au gluten n’a été détecté dans le texte analysé. Cela ne garantit pas que le produit est certifié sans gluten. Vérifiez toujours l’étiquette officielle et les informations du fabricant.',
  INSUFFICIENT_INFO:
    'Le texte analysé n’est pas suffisant pour donner un résultat fiable. Essayez avec une photo plus claire ou saisissez manuellement la liste complète des ingrédients. Vérifiez toujours l’étiquette officielle.',
};

function fallbackExplanation(status) {
  return fallbackExplanations[status] || fallbackExplanations.INSUFFICIENT_INFO;
}

export async function generateExplanation({ analysis, text = '' }) {
  if (!analysis?.status) {
    return fallbackExplanation('INSUFFICIENT_INFO');
  }

  try {
    const prompt = [
      `Verdict fixe: ${analysis.label} (${analysis.status})`,
      `Mots directs détectés: ${(analysis.detectedWords || []).join(', ') || 'aucun'}`,
      `Mots possibles détectés: ${(analysis.possibleWords || []).join(', ') || 'aucun'}`,
      `Texte analysé: ${String(text || '').slice(0, 900)}`,
    ].join('\n');

    return (
      (await createChatCompletion({
        messages: [
          { role: 'system', content: EXPLANATION_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        maxTokens: 180,
      })) || fallbackExplanation(analysis.status)
    );
  } catch {
    return fallbackExplanation(analysis.status);
  }
}
