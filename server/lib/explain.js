import { explainWithGemini } from './gemini.js';

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
    if (!process.env.GEMINI_API_KEY) {
      return fallbackExplanation(analysis.status);
    }

    return (await explainWithGemini({ analysis, text })) || fallbackExplanation(analysis.status);
  } catch {
    return fallbackExplanation(analysis.status);
  }
}
