import { GLUTISAFE_SYSTEM_PROMPT, createChatCompletion } from '../_lib/aiService.js';
import { allowPostOnly, readJsonBody } from '../_lib/request.js';

const MAX_MESSAGE_LENGTH = 1200;
const CHATBOT_CONTENT_FILTER_REPLY =
  'Je ne peux pas répondre à cette demande telle qu’elle est formulée. Reformulez votre question autour des ingrédients, du gluten ou du résultat de scan.';
const SERVICE_UNAVAILABLE_MESSAGE = 'Le service d’assistance est momentanément indisponible.';

export default async function handler(req, res) {
  if (allowPostOnly(req, res)) return;

  const { message, context = {} } = await readJsonBody(req);
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
    return res.status(200).json({ reply: greetingReply(cleanMessage) });
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

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('[vercel-chatbot:route] provider error', {
      code: error.code,
      status: error.status,
      message: error.message,
      details: error.details,
    });

    if (error.code === 'GITHUB_MODELS_CONTENT_FILTER') {
      return res.status(200).json({ reply: CHATBOT_CONTENT_FILTER_REPLY });
    }

    return res.status(error.status || 503).json({
      error: 'CHATBOT_SERVICE_UNAVAILABLE',
      message: SERVICE_UNAVAILABLE_MESSAGE,
    });
  }
}

function buildUserPrompt(message, context = {}) {
  const safeContext =
    context && typeof context === 'object' && !Array.isArray(context)
      ? context
      : {};
  const includeContext = hasMeaningfulScanContext(safeContext) && isScanRelated(message);

  if (!includeContext) {
    return [
      'User message:',
      truncateText(message, MAX_MESSAGE_LENGTH),
      '',
      'Reply in the same language and style as the user.',
    ].join('\n');
  }

  const verdict = safeContext.verdict || safeContext.lastScanResult?.status || safeContext.lastScanResult?.label || 'none';
  const ingredients = truncateText(safeContext.ingredients || safeContext.lastScanResult?.text || '', 500) || 'none';
  const riskyIngredients = safeContext.detectedRiskyIngredients?.length
    ? safeContext.detectedRiskyIngredients.join(', ')
    : safeContext.lastScanResult?.detectedWords?.join(', ') || 'none';

  return [
    'User message:',
    truncateText(message, MAX_MESSAGE_LENGTH),
    '',
    'Scan context:',
    `- Verdict: ${truncateText(verdict, 120)}`,
    `- Ingredients: ${ingredients}`,
    `- Risky ingredients: ${truncateText(riskyIngredients, 300)}`,
    '',
    'Reply in the same language and style as the user. Explain briefly and carefully.',
  ].join('\n');
}

function hasMeaningfulScanContext(context) {
  return Boolean(
    context.verdict ||
      context.ingredients ||
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
