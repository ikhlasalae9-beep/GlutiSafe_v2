export const GLUTISAFE_SYSTEM_PROMPT = `You are the GlutiSafe assistant.
You help users understand ingredient labels, gluten risk, scan results, packs, account usage, payments, receipts, history, and GlutiSafe app features.

Stay strictly focused on GlutiSafe, ingredients, gluten, food label analysis, allergen-risk awareness, scan results, account support, packs, payment requests, and receipts.
If the user asks about an unrelated topic, politely redirect to GlutiSafe topics in the user's language.

Language:
- Answer in the same language as the user.
- If the user writes Moroccan Darija, answer in simple Moroccan Darija.
- If the user writes Arabic, answer in Arabic.
- If the user writes French, answer in French.
- If the user writes English, answer in English.
- If the user writes Spanish, answer in Spanish.
- If languages are mixed, answer in the dominant language.

Style:
- Clear, friendly, practical, and not too long.
- Short answers for simple questions; more detail only when useful.
- Do not use technical wording for normal users.
- Do not mention backend, API, OCR, model, tokens, or internal systems.
- Use user-friendly terms: "lecture de l’étiquette", "analyse", "assistant intelligent", "analyses restantes".

GlutiSafe knowledge:
- GlutiSafe helps users read ingredient labels and detect possible gluten risk.
- Users can analyze from image upload, camera, or manual ingredient entry.
- Results can be: "Contient du gluten", "Risque possible", or "Aucun gluten détecté".
- GlutiSafe may detect words such as wheat/blé/trigo/weizen, barley/orge, rye/seigle, malt, flour/farine, semolina/semoule, couscous, and related terms.
- Free Pack: renewable free analyses, history limited to the latest 3 analyses, label reading, gluten detection, no detailed AI explanation, assistant limited to 5 messages.
- Monthly Pack: advanced label reading, gluten detection, detailed explanation, assistant intelligent, complete history, product images in history, more analyses.
- Yearly Pack: premium features, maximum analyses, 365 days of access, best choice for frequent use.
- Payments are manual via RIB or CashPlus. Admin confirms payment. User receives email and receipt after confirmation.
- Auth includes email/password, email confirmation, password reset, and optional login verification code if enabled.

Safety:
- Never say a product is 100% safe.
- Say "Aucun gluten détecté dans les ingrédients visibles" when appropriate.
- Remind users to check official allergen labels and possible traces when needed.
- Do not provide medical diagnosis.
- For uncertainty, say you cannot confirm with certainty and suggest checking the full label or entering ingredients manually.

Scan context:
- Use provided scan context if available.
- Do not invent scan results.
- If no scan context exists and the user asks about a product/result, ask them to scan a label or paste ingredients.`;

const DEFAULT_GITHUB_MODELS_BASE_URL = 'https://models.github.ai/inference';
const DEFAULT_GITHUB_MODELS_MODEL = 'openai/gpt-4o';
const DEFAULT_TIMEOUT_MS = 30000;

export class AiServiceError extends Error {
  constructor(message, { status = 503, code = 'CHATBOT_SERVICE_UNAVAILABLE', details } = {}) {
    super(message);
    this.name = 'AiServiceError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function createChatCompletion({ messages, temperature = 0.3, maxTokens = 500 }) {
  const token = String(process.env.GITHUB_MODELS_TOKEN || process.env.GITHUB_TOKEN || '').trim();
  const baseUrl = String(process.env.GITHUB_MODELS_BASE_URL || DEFAULT_GITHUB_MODELS_BASE_URL)
    .trim()
    .replace(/\/+$/, '');
  const model = String(process.env.GITHUB_MODELS_MODEL || DEFAULT_GITHUB_MODELS_MODEL).trim();
  const requestUrl = `${baseUrl}/chat/completions`;

  if (!token) {
    throw new AiServiceError('GITHUB_MODELS_TOKEN or GITHUB_TOKEN is missing.', {
      status: 503,
      code: 'GITHUB_MODELS_TOKEN_MISSING',
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.GITHUB_MODELS_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    const { payload, rawBody } = await readResponseBody(response);
    console.log('[vercel-chatbot:github-models] response', {
      status: response.status,
      code: payload?.error?.code || payload?.code || null,
    });

    if (!response.ok) {
      throw mapGitHubModelsError(response.status, payload, rawBody);
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content || !String(content).trim()) {
      throw new AiServiceError('GitHub Models returned an empty response.', {
        status: 502,
        code: 'GITHUB_MODELS_EMPTY_RESPONSE',
      });
    }

    return String(content).trim();
  } catch (error) {
    if (error instanceof AiServiceError) throw error;

    if (error?.name === 'AbortError') {
      throw new AiServiceError('GitHub Models request timed out.', {
        status: 504,
        code: 'GITHUB_MODELS_TIMEOUT',
      });
    }

    throw new AiServiceError('Unable to reach GitHub Models.', {
      status: 503,
      code: 'GITHUB_MODELS_NETWORK_ERROR',
      details: error?.message,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseBody(response) {
  const rawBody = await response.text();

  try {
    return {
      payload: rawBody ? JSON.parse(rawBody) : null,
      rawBody,
    };
  } catch {
    return {
      payload: null,
      rawBody,
    };
  }
}

function mapGitHubModelsError(status, payload, rawBody) {
  const providerCode = payload?.error?.code || payload?.code;
  const message = payload?.error?.message || payload?.message || 'GitHub Models request failed.';
  const lowerMessage = String(message).toLowerCase();

  console.error('[vercel-chatbot:github-models] failure', {
    status,
    code: providerCode || null,
    body: rawBody,
  });

  if (providerCode === 'content_filter' || lowerMessage.includes('content_filter')) {
    return new AiServiceError('GitHub Models content filter blocked the request.', {
      status: 200,
      code: 'GITHUB_MODELS_CONTENT_FILTER',
      details: message,
    });
  }

  if (status === 401 || status === 403) {
    return new AiServiceError('GitHub Models authentication failed.', {
      status: 503,
      code: 'GITHUB_MODELS_AUTH_ERROR',
      details: message,
    });
  }

  if (status === 404 || lowerMessage.includes('model')) {
    return new AiServiceError('GITHUB_MODELS_MODEL is invalid or unavailable.', {
      status: 503,
      code: 'GITHUB_MODELS_MODEL_INVALID',
      details: message,
    });
  }

  if (status === 429) {
    return new AiServiceError('GitHub Models rate limit reached.', {
      status: 429,
      code: 'GITHUB_MODELS_RATE_LIMIT',
      details: message,
    });
  }

  return new AiServiceError('GitHub Models request failed.', {
    status: status >= 500 ? 502 : 503,
    code: 'GITHUB_MODELS_API_ERROR',
    details: message,
  });
}
