import { Router } from 'express';
import { GLUTISAFE_SYSTEM_PROMPT, createChatCompletion } from '../lib/aiService.js';

const router = Router();
const MAX_MESSAGE_LENGTH = 1200;
const CHATBOT_CONTENT_FILTER_REPLY =
  'Je ne peux pas répondre à cette demande telle qu’elle est formulée. Reformulez votre question autour des ingrédients, du gluten ou du résultat de scan.';
const SERVICE_UNAVAILABLE_MESSAGE = 'Le service d’assistance est momentanément indisponible.';

router.post('/chatbot/message', async (req, res) => {
  const { message, context = {} } = req.body || {};
  const cleanMessage = String(message || '').trim();
  const safeContext =
    context && typeof context === 'object' && !Array.isArray(context)
      ? context
      : {};

  if (!cleanMessage) {
    return res.status(400).json({
      error: 'MESSAGE_REQUIRED',
      message: 'Le message est obligatoire.',
    });
  }

  if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      error: 'MESSAGE_TOO_LONG',
      message: 'Le message est trop long.',
    });
  }

  if (isGreeting(cleanMessage)) {
    return res.json({ reply: greetingReply(cleanMessage) });
  }

  try {
    const reply = await createChatCompletion({
      messages: [
        { role: 'system', content: GLUTISAFE_SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(cleanMessage, safeContext) },
      ],
      temperature: 0.3,
      maxTokens: 500,
    });

    return res.json({ reply });
  } catch (error) {
    console.error('[chatbot:route] provider error', {
      code: error.code,
      status: error.status,
      message: error.message,
      details: error.details,
    });

    if (error.code === 'GITHUB_MODELS_CONTENT_FILTER') {
      return res.json({ reply: CHATBOT_CONTENT_FILTER_REPLY });
    }

    return res.status(error.status || 503).json({
      error: 'CHATBOT_SERVICE_UNAVAILABLE',
      message: SERVICE_UNAVAILABLE_MESSAGE,
    });
  }
});

function buildUserPrompt(message, context = {}) {
  const safeContext =
    context && typeof context === 'object' && !Array.isArray(context)
      ? context
      : {};
  const includeContext = hasMeaningfulScanContext(safeContext);

  if (!includeContext) {
    return [
      'User message:',
      truncateText(message, MAX_MESSAGE_LENGTH),
      '',
      'No scan context is available.',
      'Reply in the same language and style as the user. If they ask about a product or result, ask them to scan a label or paste ingredients.',
    ].join('\n');
  }

  const verdict = safeContext.verdict || safeContext.lastScanResult?.status || safeContext.lastScanResult?.label || 'none';
  const productName = safeContext.productName || safeContext.lastScanResult?.productName || 'none';
  const userPack = safeContext.userPack || safeContext.packType || safeContext.packStatus || 'unknown';
  const ingredients = truncateText(safeContext.ingredients || safeContext.detectedText || safeContext.text || safeContext.lastScanResult?.text || '', 700) || 'none';
  const riskyIngredients = safeContext.detectedRiskyIngredients?.length
    ? safeContext.detectedRiskyIngredients.join(', ')
    : safeContext.lastScanResult?.detectedWords?.join(', ') || 'none';
  const possibleRisks = safeContext.warnings?.length
    ? safeContext.warnings.join(', ')
    : safeContext.lastScanResult?.possibleWords?.join(', ') || 'none';

  return [
    'User message:',
    truncateText(message, MAX_MESSAGE_LENGTH),
    '',
    'Scan context:',
    `- Product name: ${truncateText(productName, 120)}`,
    `- Verdict: ${truncateText(verdict, 120)}`,
    `- Ingredients: ${ingredients}`,
    `- Risky ingredients: ${truncateText(riskyIngredients, 300)}`,
    `- Possible risks: ${truncateText(possibleRisks, 300)}`,
    `- User pack: ${truncateText(userPack, 120)}`,
    '',
    'Use this context only if it helps. Reply in the same language and style as the user. Explain briefly and carefully. Never say the product is 100% safe.',
  ].join('\n');
}

function hasMeaningfulScanContext(context) {
  return Boolean(
    context.verdict ||
      context.productName ||
      context.ingredients ||
      context.detectedText ||
      context.text ||
      context.lastScanResult ||
      context.detectedRiskyIngredients?.length ||
      context.warnings?.length,
  );
}

function isScanRelated(message) {
  const normalized = normalizeText(message);
  const keywords = [
    'scan',
    'resultat',
    'résultat',
    'ingredients',
    'ingrédient',
    'ingredient',
    'gluten',
    'risque',
    'produit',
    'label',
    'etiquette',
    'étiquette',
    'detecte',
    'détecté',
    'safe',
    'danger',
    'analyse',
    'ocr',
    'شرح',
    'نتيجة',
  ];

  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)));
}

function isGreeting(message) {
  const normalized = normalizeText(message);
  return ['salam', 'slam', 'salamo', 'السلام', 'bonjour', 'salut', 'hello', 'hi'].includes(normalized);
}

function greetingReply(message) {
  const normalized = normalizeText(message);

  if (['salam', 'slam', 'salamo', 'السلام'].includes(normalized)) {
    return 'Salam 👋 ana assistant GlutiSafe. Sowlni 3la les ingrédients, gluten, wla résultat dyal scan.';
  }

  if (['bonjour', 'salut'].includes(normalized)) {
    return 'Bonjour 👋 Comment puis-je vous aider avec les ingrédients, le gluten ou votre résultat de scan ?';
  }

  return 'Hi 👋 I’m GlutiSafe Assistant. Ask me about ingredients, gluten, or your scan result.';
}

function truncateText(value, maxLength) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength)}...` : clean;
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?!.,،؛:]+/g, '')
    .replace(/\s+/g, ' ');
}

export default router;
