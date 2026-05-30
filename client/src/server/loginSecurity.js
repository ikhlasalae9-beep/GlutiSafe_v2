import { createHash, randomBytes, randomInt } from 'node:crypto';
import { sendLoginVerificationEmail } from './email.js';

const SUPABASE_REST_PATH = '/rest/v1';
const CODE_TTL_MS = 10 * 60 * 1000;
const TRUSTED_DEVICE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function checkTrustedLoginDevice({ requesterToken, deviceToken }) {
  const config = requireSupabaseConfig();
  const user = await requireAuthenticatedUser(config, requesterToken);
  const cleanToken = cleanText(deviceToken);
  if (!cleanToken) return { trusted: false };

  const tokenHash = secureHash(cleanToken);
  const rows = await supabaseRequest(config, 'trusted_login_devices', {
    method: 'GET',
    query: {
      select: 'id,expires_at',
      user_id: `eq.${user.id}`,
      device_token_hash: `eq.${tokenHash}`,
      expires_at: `gt.${new Date().toISOString()}`,
      limit: '1',
    },
  });
  const device = Array.isArray(rows) ? rows[0] : null;
  if (!device) return { trusted: false };

  await supabaseRequest(config, 'trusted_login_devices', {
    method: 'PATCH',
    query: { id: `eq.${device.id}` },
    headers: { Prefer: 'return=minimal' },
    body: { last_used_at: new Date().toISOString() },
  });

  return { trusted: true, expiresAt: device.expires_at };
}

export async function sendLoginVerificationCode({ requesterToken }) {
  const config = requireSupabaseConfig();
  const user = await requireAuthenticatedUser(config, requesterToken);
  const email = cleanText(user.email);
  if (!email) {
    const error = new Error('Adresse e-mail introuvable.');
    error.status = 400;
    throw error;
  }

  const latest = await readLatestPendingVerification(config, user.id);
  if (latest && Date.now() - new Date(latest.created_at).getTime() < RESEND_COOLDOWN_MS) {
    return { sent: true, cooldown: true, email: maskEmail(email), message: 'Un code a déjà été envoyé.' };
  }

  await expirePendingVerifications(config, user.id);
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await supabaseRequest(config, 'login_verifications', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: {
      user_id: user.id,
      email,
      code_hash: secureHash(code),
      status: 'pending',
      attempts: 0,
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    },
  });

  try {
    await sendLoginVerificationEmail({ to: email, code });
  } catch (error) {
    console.error('[login-security] email failed', { message: error.message });
    await expirePendingVerifications(config, user.id).catch(() => {});
    const nextError = new Error("Impossible d'envoyer le code pour le moment. Réessayez dans un instant.");
    nextError.status = 503;
    throw nextError;
  }

  return { sent: true, email: maskEmail(email) };
}

export async function verifyLoginCode({ requesterToken, code, rememberDevice, deviceLabel }) {
  const config = requireSupabaseConfig();
  const user = await requireAuthenticatedUser(config, requesterToken);
  const cleanCode = cleanText(code).replace(/\D/g, '');
  if (!/^\d{6}$/.test(cleanCode)) {
    const error = new Error('Code incorrect. Veuillez réessayer.');
    error.status = 400;
    error.reason = 'wrong_code';
    throw error;
  }

  const verification = await readLatestPendingVerification(config, user.id);
  if (!verification) {
    const error = new Error('Code expiré. Demandez un nouveau code.');
    error.status = 400;
    error.reason = 'expired';
    throw error;
  }

  if (new Date(verification.expires_at).getTime() <= Date.now()) {
    await updateVerification(config, verification.id, { status: 'expired' });
    const error = new Error('Code expiré. Demandez un nouveau code.');
    error.status = 400;
    error.reason = 'expired';
    throw error;
  }

  if (Number(verification.attempts || 0) >= MAX_ATTEMPTS) {
    const error = new Error('Trop de tentatives. Demandez un nouveau code.');
    error.status = 429;
    error.reason = 'too_many_attempts';
    throw error;
  }

  if (secureHash(cleanCode) !== verification.code_hash) {
    const attempts = Number(verification.attempts || 0) + 1;
    await updateVerification(config, verification.id, { attempts, status: attempts >= MAX_ATTEMPTS ? 'expired' : 'pending' });
    const error = new Error(attempts >= MAX_ATTEMPTS ? 'Trop de tentatives. Demandez un nouveau code.' : 'Code incorrect. Veuillez réessayer.');
    error.status = attempts >= MAX_ATTEMPTS ? 429 : 400;
    error.reason = attempts >= MAX_ATTEMPTS ? 'too_many_attempts' : 'wrong_code';
    throw error;
  }

  await updateVerification(config, verification.id, { status: 'verified', verified_at: new Date().toISOString() });

  if (!rememberDevice) return { verified: true };

  const deviceToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TRUSTED_DEVICE_TTL_MS).toISOString();
  await supabaseRequest(config, 'trusted_login_devices', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: {
      user_id: user.id,
      device_token_hash: secureHash(deviceToken),
      device_label: cleanText(deviceLabel) || 'Navigateur actuel',
      expires_at: expiresAt,
      last_used_at: new Date().toISOString(),
    },
  });

  return { verified: true, deviceToken, expiresAt };
}

async function readLatestPendingVerification(config, userId) {
  const rows = await supabaseRequest(config, 'login_verifications', {
    method: 'GET',
    query: {
      select: 'id,code_hash,attempts,expires_at,created_at',
      user_id: `eq.${userId}`,
      status: 'eq.pending',
      order: 'created_at.desc',
      limit: '1',
    },
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function expirePendingVerifications(config, userId) {
  await supabaseRequest(config, 'login_verifications', {
    method: 'PATCH',
    query: { user_id: `eq.${userId}`, status: 'eq.pending' },
    headers: { Prefer: 'return=minimal' },
    body: { status: 'expired' },
  });
}

function updateVerification(config, id, body) {
  return supabaseRequest(config, 'login_verifications', {
    method: 'PATCH',
    query: { id: `eq.${id}` },
    headers: { Prefer: 'return=minimal' },
    body,
  });
}

function secureHash(value) {
  const secret = cleanText(process.env.LOGIN_CODE_SECRET);
  if (!secret) {
    const error = new Error('LOGIN_CODE_SECRET missing');
    error.status = 503;
    throw error;
  }
  return createHash('sha256').update(`${value}${secret}`).digest('hex');
}

function getSupabaseConfig() {
  const url = cleanText(process.env.SUPABASE_URL);
  const anonKey = cleanText(process.env.SUPABASE_ANON_KEY);
  const serviceRoleKey = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/+$/, ''), anonKey, serviceRoleKey };
}

function requireSupabaseConfig() {
  const config = getSupabaseConfig();
  if (!config) {
    const error = new Error('Base de donnees non configuree.');
    error.status = 503;
    throw error;
  }
  return config;
}

async function requireAuthenticatedUser(config, requesterToken) {
  const cleanToken = cleanText(requesterToken);
  if (!cleanToken) {
    const error = new Error('Session introuvable.');
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey || config.serviceRoleKey,
      Authorization: `Bearer ${cleanToken}`,
    },
  });

  if (!response.ok) {
    const error = new Error('Session invalide.');
    error.status = 401;
    throw error;
  }

  return response.json();
}

async function supabaseRequest(config, table, { method, query = {}, headers = {}, body } = {}) {
  const response = await fetch(buildSupabaseUrl(config, table, query), {
    method,
    headers: supabaseHeaders(config, headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    const error = new Error(`Supabase request failed for ${table}.`);
    error.status = response.status;
    error.details = details;
    throw error;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function buildSupabaseUrl(config, table, query = {}) {
  const url = new URL(`${config.url}${SUPABASE_REST_PATH}/${table}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });
  return url;
}

function supabaseHeaders(config, extraHeaders = {}) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
}

function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');
  if (!name || !domain) return email;
  return `${name[0]}***@${domain}`;
}

function cleanText(value) {
  return String(value || '').trim();
}
