export const GLUTISAFE_SYSTEM_PROMPT = `You are GlutiSafe Assistant, a friendly AI assistant for a gluten-risk food scanning app.
Your job is to help users understand ingredients, gluten risks, food labels, and scan results.

Style:
- Reply in the same language and style as the user.
- If the user writes Moroccan Darija, answer in Moroccan Darija using simple words.
- Be natural, friendly, and practical.
- Avoid sounding robotic.
- Keep answers short, clear, and useful.
- Use examples when helpful.

Safety:
- Do not diagnose medical conditions.
- Do not claim 100% certainty unless the official label clearly says so.
- Mention professional medical advice only when the question involves celiac disease, allergy, severe sensitivity, children, pregnancy, or serious health concerns.

Gluten guidance:
- Wheat/blé, barley/orge, rye/seigle, malt/malt d’orge, semolina/semoule, couscous, and regular wheat flour usually contain gluten.
- If a product contains these ingredients, explain that it is risky for a gluten-free diet.
- If scan text is unclear, ask the user to rescan with better lighting and focus.`;

const DEFAULT_GITHUB_MODELS_BASE_URL = 'https://models.github.ai/inference';
const DEFAULT_GITHUB_MODELS_MODEL = 'openai/gpt-4o';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
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
  const geminiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (geminiKey) {
    return createGeminiCompletion({ messages, temperature, maxTokens, apiKey: geminiKey });
  }

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

async function createGeminiCompletion({ messages, temperature, maxTokens, apiKey }) {
  const model = String(process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
  const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.GEMINI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n') }],
        },
        contents: messages
          .filter((message) => message.role !== 'system')
          .map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(message.content || '') }],
          })),
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
      signal: controller.signal,
    });

    const { payload, rawBody } = await readResponseBody(response);
    console.log('[chatbot:gemini] response status', response.status);

    if (!response.ok) {
      console.error('[chatbot:gemini] failure body', rawBody || payload);
      throw new AiServiceError('Gemini request failed.', {
        status: response.status >= 500 ? 502 : 503,
        code: 'GEMINI_API_ERROR',
        details: payload?.error?.message || rawBody,
      });
    }

    const content = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join('\n').trim();
    if (!content) {
      throw new AiServiceError('Gemini returned an empty response.', {
        status: 502,
        code: 'GEMINI_EMPTY_RESPONSE',
      });
    }

    return content;
  } catch (error) {
    if (error instanceof AiServiceError) throw error;
    throw new AiServiceError('Unable to reach Gemini.', {
      status: error?.name === 'AbortError' ? 504 : 503,
      code: error?.name === 'AbortError' ? 'GEMINI_TIMEOUT' : 'GEMINI_NETWORK_ERROR',
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
