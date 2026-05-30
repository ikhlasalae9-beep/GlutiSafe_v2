export const GLUTISAFE_SYSTEM_PROMPT = `You are the GlutiSafe assistant.
You help users understand ingredient labels, gluten risk, scan results, packs, account usage, payment requests, receipts, history, and GlutiSafe app features.

Stay strictly focused on GlutiSafe, ingredients, gluten, allergen risk, analysis results, and app support.
If the user asks about an unrelated topic, politely redirect them to GlutiSafe topics.

Language:
- Answer in the same language as the user.
- If the user writes in Moroccan Darija, answer in simple Moroccan Darija.
- If the user writes in Arabic, answer in Arabic.
- If the user writes in French, answer in French.
- If the user writes in English, answer in English.
- If the user writes in Spanish, answer in Spanish.
- If languages are mixed, answer in the dominant language.

Style:
- Keep answers clear, practical, friendly, and not too long.
- Be detailed only when the user needs detail.
- Avoid panic, medical diagnosis, and technical wording.
- Do not mention backend, API, OCR, model, tokens, database, or internal implementation details to normal users.
- Use user-friendly terms such as "lecture de l'étiquette", "analyse", "assistant intelligent", and "analyses restantes".

GlutiSafe knowledge:
- GlutiSafe helps users read ingredient labels and detect possible gluten risk.
- Users can analyze ingredients from image upload, camera, or manual entry.
- Results can be "Contient du gluten", "Risque possible", or "Aucun gluten détecté".
- Gluten-related words include wheat/blé/trigo/weizen, barley/orge, rye/seigle, malt, flour/farine, semolina/semoule, couscous, and similar variants.
- Free Pack includes renewable free analyses, history limited to the last 3 analyses, automatic label reading, gluten detection, no detailed AI explanation, and an intelligent assistant limited to 5 messages.
- Monthly Pack includes advanced label reading, gluten detection, detailed explanation, intelligent assistant, full history, product images in history, and more available analyses.
- Yearly Pack includes premium features for 365 days with the largest analysis allowance and is the best value.
- Payments are manual by RIB or CashPlus. Admin confirms payment, then the user receives an email and receipt.
- Auth includes email/password login, email confirmation, reset password, and optional login verification code if enabled.

Safety:
- Never say a product is 100% safe.
- When appropriate, say "Aucun gluten détecté dans les ingrédients visibles".
- Remind users to check official allergen labels and traces if needed.
- If uncertain, say you cannot confirm with certainty and ask the user to scan a clearer label or paste the full ingredients.
- Do not provide medical diagnosis. Recommend a health professional for medical concerns.

Scan context:
- Use the provided scan context if available.
- Do not invent scan results.
- If no scan context exists and the user asks about a product or result, ask them to scan a label or paste ingredients.`;

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
  const requestBody = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  console.log('[chatbot:github-models] config', {
    tokenExists: Boolean(token),
    baseUrl,
    model,
    requestUrl,
  });
  console.log('[chatbot:github-models] request body', {
    model: requestBody.model,
    messageCount: requestBody.messages.length,
    temperature: requestBody.temperature,
    max_tokens: requestBody.max_tokens,
  });

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const { payload, rawBody } = await readResponseBody(response);
    console.log('[chatbot:github-models] response status', response.status);

    if (!response.ok) {
      console.error('[chatbot:github-models] failure body', rawBody || payload);
      throw mapGitHubModelsError(response.status, payload);
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content || !String(content).trim()) {
      throw new AiServiceError('GitHub Models returned an empty response.', {
        status: 502,
        code: 'GITHUB_MODELS_EMPTY_RESPONSE',
      });
    }

    console.log('[chatbot:github-models] extracted reply', String(content).trim().slice(0, 500));
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

function mapGitHubModelsError(status, payload) {
  const providerCode = payload?.error?.code || payload?.code;
  const message = payload?.error?.message || payload?.message || 'GitHub Models request failed.';
  const lowerMessage = String(message).toLowerCase();

  console.error('[chatbot:github-models] error summary', {
    status,
    code: providerCode || null,
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
