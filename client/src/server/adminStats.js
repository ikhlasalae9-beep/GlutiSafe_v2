const SUPABASE_REST_PATH = '/rest/v1';
const STORAGE_WARNING = 'Base de donnees non configuree. Ajoutez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans Vercel.';
const FREE_AI_MESSAGES_LIMIT = 5;

export async function getRequesterPackAccess({ requesterToken } = {}) {
  const config = requireSupabaseConfig();
  const user = await requireAuthenticatedUser(config, requesterToken);
  const profile = await readProfile(config, user.id);
  const effective = profile ? effectivePack(profile) : { status: 'free', type: 'none' };
  const premium = effective.status === 'active' && ['monthly', 'yearly'].includes(effective.type) && effective.endAt && new Date(effective.endAt).getTime() > Date.now();

  return { config, user, profile, premium, effective };
}

export async function assertCanUseAiAssistant({ requesterToken } = {}) {
  const access = await getRequesterPackAccess({ requesterToken });
  if (access.premium) return { ...access, limited: false, used: 0, limit: FREE_AI_MESSAGES_LIMIT };

  const usage = await readAiMessageUsage(access.config, access.user.id);
  if (usage.message_count >= FREE_AI_MESSAGES_LIMIT) {
    const error = new Error('Vous avez atteint la limite gratuite de 5 messages IA. Passez à un pack premium pour continuer à utiliser l’assistant IA.');
    error.status = 429;
    throw error;
  }

  return { ...access, limited: true, used: usage.message_count, limit: FREE_AI_MESSAGES_LIMIT, usage };
}

export async function incrementFreeAiAssistantUsage({ requesterToken } = {}) {
  const access = await getRequesterPackAccess({ requesterToken });
  if (access.premium) return { limited: false };

  const usage = await readAiMessageUsage(access.config, access.user.id);
  const nextCount = Number(usage.message_count || 0) + 1;
  const nowIso = new Date().toISOString();

  if (usage.id) {
    await supabaseRequest(access.config, 'ai_message_usage', {
      method: 'PATCH',
      query: { id: `eq.${usage.id}` },
      headers: { Prefer: 'return=minimal' },
      body: { message_count: nextCount, updated_at: nowIso },
    });
  } else {
    await supabaseRequest(access.config, 'ai_message_usage', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: { user_id: access.user.id, message_count: nextCount, period_start: nowIso, updated_at: nowIso },
    });
  }

  return { limited: true, used: nextCount, limit: FREE_AI_MESSAGES_LIMIT };
}

export async function readAdminStats({ requesterToken } = {}) {
  const config = getSupabaseConfig();

  if (!config) {
    return {
      usersCount: 0,
      scansCount: 0,
      platformStatus: 'Base de donnees non configuree',
      mainAdmin: 'Admin',
      storageWarning: STORAGE_WARNING,
    };
  }

  await requireAdmin(config, requesterToken);

  const [usersCount, scansCount, mainAdmin] = await Promise.all([
    readSupabaseCount(config, 'profiles'),
    readSupabaseCount(config, 'analyses'),
    readMainAdmin(config),
  ]);

  return { usersCount, scansCount, platformStatus: 'Active', mainAdmin };
}

export async function createManualPackRequest({ requesterToken, packType }) {
  const config = requireSupabaseConfig();
  const user = await requireAuthenticatedUser(config, requesterToken);
  const normalizedPackType = normalizePackType(packType);

  if (!normalizedPackType) {
    const error = new Error('Pack invalide.');
    error.status = 400;
    throw error;
  }

  await rejectPendingSubscriptions(config, user.id);

  const nowIso = new Date().toISOString();
  const paymentRows = await supabaseRequest(config, 'payments', {
    method: 'POST',
    query: { select: '*' },
    headers: { Prefer: 'return=representation' },
    body: {
      user_id: user.id,
      provider: 'manual',
      method: 'manual',
      pack_type: normalizedPackType,
      amount: packAmount(normalizedPackType),
      currency: 'MAD',
      status: 'pending',
      raw_payload: { source: 'packs_page', requested_at: nowIso },
    },
  });

  await supabaseRequest(config, 'subscriptions', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: {
      user_id: user.id,
      pack_name: normalizedPackType,
      status: 'pending',
      start_date: null,
      end_date: null,
    },
  });

  await updateProfile(config, user.id, {
    pack_status: 'pending',
    pack_type: normalizedPackType,
    pack_start_at: null,
    pack_end_at: null,
  });

  return { status: 'pending', payment: Array.isArray(paymentRows) ? paymentRows[0] : paymentRows };
}

export async function assertCanUserAnalyze({ requesterToken }) {
  const config = requireSupabaseConfig();
  {
    const user = await requireAuthenticatedUser(config, requesterToken);
    const profile = await readProfile(config, user.id);
    const settings = await readPackSettings(config);

    if (!profile) {
      const error = new Error('Profil introuvable.');
      error.status = 404;
      throw error;
    }

    const effective = effectivePack(profile);
    if (effective.status === 'blocked') {
      const error = new Error("Votre compte est bloque. Contactez l'administration.");
      error.status = 403;
      throw error;
    }

    const freeResetHours = [5, 24, 168].includes(Number(settings.free_reset_hours)) ? Number(settings.free_reset_hours) : 24;
    const monthlyResetHours = [24, 168].includes(Number(settings.monthly_reset_hours)) ? Number(settings.monthly_reset_hours) : 24;
    const yearlyResetHours = [168, 720].includes(Number(settings.yearly_reset_hours)) ? Number(settings.yearly_reset_hours) : 168;
    const isPaid = effective.status === 'active' && ['monthly', 'yearly'].includes(effective.type) && effective.endAt && new Date(effective.endAt).getTime() > Date.now();
    const limit = isPaid
      ? effective.type === 'yearly'
        ? Number(settings.yearly_tokens || 1500)
        : Number(settings.monthly_tokens || 100)
      : Number(settings.free_tokens || 5);
    const resetHours = isPaid && effective.type === 'monthly' ? monthlyResetHours : isPaid && effective.type === 'yearly' ? yearlyResetHours : freeResetHours;
    const startIso = new Date(Date.now() - resetHours * 60 * 60 * 1000).toISOString();
    const count = await countUserAnalyses(config, user.id, startIso, null);

    if (count >= limit) {
      const error = new Error(
        isPaid && effective.type === 'monthly'
          ? 'Vous avez utilisé tous vos tokens du Pack Mensuel. Vos tokens seront renouvelés selon votre période de réinitialisation.'
          : isPaid && effective.type === 'yearly'
            ? 'Vous avez utilisé tous vos tokens du Pack Annuel. Vos tokens seront renouvelés selon votre période de réinitialisation.'
          : 'Vous avez utilise tous vos tokens. Reessayez apres la reinitialisation ou passez a un pack premium.',
      );
      error.status = 429;
      throw error;
    }

    return { allowed: true, used: count, remaining: limit - count, limit };
  }
  const user = await requireAuthenticatedUser(config, requesterToken);
  const profile = await readProfile(config, user.id);

  if (!profile) {
    const error = new Error('Profil introuvable.');
    error.status = 404;
    throw error;
  }

  const effective = effectivePack(profile);
  if (effective.status === 'blocked') {
    const error = new Error('Votre compte est bloqué. Contactez l’administration.');
    error.status = 403;
    throw error;
  }

  const limit = scanLimit(effective);
  const count = await countUserAnalyses(config, user.id, periodStart(effective));

  if (count >= limit) {
    const error = new Error(limitMessage(effective, limit));
    error.status = 429;
    throw error;
  }

  return { allowed: true, used: count, remaining: limit - count, limit };
}

export async function activateUserPack({ requesterToken, userId, packType }) {
  const config = requireSupabaseConfig();
  const admin = await requireAdmin(config, requesterToken);
  const normalizedPackType = normalizePackType(packType) || 'monthly';
  const now = new Date();
  const end = addPackDuration(now, normalizedPackType);

  const profile = await updateProfile(config, userId, {
    pack_status: 'active',
    pack_type: normalizedPackType,
    pack_start_at: now.toISOString(),
    pack_end_at: end.toISOString(),
  });

  await supabaseRequest(config, 'subscriptions', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: {
      user_id: userId,
      pack_name: normalizedPackType,
      status: 'active',
      start_date: now.toISOString(),
      end_date: end.toISOString(),
      activated_by: admin.id,
    },
  });

  return { profile };
}

export async function expireUserPack({ requesterToken, userId }) {
  const config = requireSupabaseConfig();
  await requireAdmin(config, requesterToken);
  const nowIso = new Date().toISOString();

  const profile = await updateProfile(config, userId, {
    pack_status: 'expired',
    pack_type: 'none',
    pack_end_at: nowIso,
  });

  await updateSubscriptions(config, {
    userId,
    fromStatus: 'active',
    body: { status: 'expired', end_date: nowIso },
  });

  return { profile };
}

export async function blockUser({ requesterToken, userId }) {
  const config = requireSupabaseConfig();
  await requireAdmin(config, requesterToken);
  const profile = await updateProfile(config, userId, { pack_status: 'blocked', pack_type: 'none' });
  return { profile };
}

export async function unblockUser({ requesterToken, userId }) {
  const config = requireSupabaseConfig();
  await requireAdmin(config, requesterToken);

  const hasActive = await userHasActivePack(config, userId);
  const profile = hasActive
    ? await readProfile(config, userId)
    : await updateProfile(config, userId, {
        pack_status: 'free',
        pack_type: 'none',
        pack_start_at: null,
        pack_end_at: null,
      });

  return { profile };
}

export async function makeUserAdmin({ requesterToken, userId }) {
  const config = requireSupabaseConfig();
  await requireAdmin(config, requesterToken);
  const profile = await updateProfile(config, userId, { role: 'admin' });
  return { profile };
}

export async function confirmPayment({ requesterToken, paymentId }) {
  const config = requireSupabaseConfig();
  const admin = await requireAdmin(config, requesterToken);
  const payment = await readPayment(config, paymentId);

  if (!payment) {
    const error = new Error('Paiement introuvable.');
    error.status = 404;
    throw error;
  }

  const packType = normalizePaymentPackType(payment);
  if (!packType) {
    const error = new Error('Type de pack manquant pour ce paiement.');
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const end = addPackDuration(now, packType);

  await updatePayment(config, paymentId, { status: 'confirmed' });

  const profile = await updateProfile(config, payment.user_id, {
    pack_status: 'active',
    pack_type: packType,
    pack_start_at: now.toISOString(),
    pack_end_at: end.toISOString(),
  });

  const updated = await updateSubscriptions(config, {
    userId: payment.user_id,
    packName: packType,
    fromStatus: 'pending',
    body: {
      status: 'active',
      start_date: now.toISOString(),
      end_date: end.toISOString(),
      activated_by: admin.id,
    },
  });

  if (!updated) {
    await supabaseRequest(config, 'subscriptions', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: {
        user_id: payment.user_id,
        pack_name: packType,
        status: 'active',
        start_date: now.toISOString(),
        end_date: end.toISOString(),
        activated_by: admin.id,
      },
    });
  }

  return { confirmed: true, profile };
}

export async function rejectPayment({ requesterToken, paymentId }) {
  const config = requireSupabaseConfig();
  await requireAdmin(config, requesterToken);
  const payment = await readPayment(config, paymentId);

  if (!payment) {
    const error = new Error('Paiement introuvable.');
    error.status = 404;
    throw error;
  }

  const packType = normalizePaymentPackType(payment);
  await updatePayment(config, paymentId, { status: 'rejected' });
  await updateSubscriptions(config, {
    userId: payment.user_id,
    packName: packType || undefined,
    fromStatus: 'pending',
    body: { status: 'rejected' },
  });

  if (!(await userHasActivePack(config, payment.user_id))) {
    await updateProfile(config, payment.user_id, {
      pack_status: 'free',
      pack_type: 'none',
      pack_start_at: null,
      pack_end_at: null,
    });
  }

  return { rejected: true, payment };
}

export async function deleteUserAccount({ requesterToken, userId, deleteAnalyses = false }) {
  const config = requireSupabaseConfig();
  await requireAdmin(config, requesterToken);

  if (deleteAnalyses) {
    await supabaseRequest(config, 'analyses', {
      method: 'DELETE',
      query: { user_id: `eq.${userId}` },
      headers: { Prefer: 'return=minimal' },
    });
  }

  await supabaseRequest(config, 'profiles', {
    method: 'DELETE',
    query: { id: `eq.${userId}` },
    headers: { Prefer: 'return=minimal' },
  });

  const authResponse = await fetch(`${config.url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}` },
  });

  if (!authResponse.ok && authResponse.status !== 404) {
    const error = new Error('La suppression complete du compte Auth necessite une action serveur securisee.');
    error.status = authResponse.status;
    throw error;
  }

  return { deleted: true };
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
    const error = new Error(STORAGE_WARNING);
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

async function requireAdmin(config, requesterToken) {
  const authUser = await requireAuthenticatedUser(config, requesterToken);
  const profile = await readProfile(config, authUser.id);
  if (profile?.role !== 'admin') {
    const error = new Error("Acces refuse. Ce compte n'est pas administrateur.");
    error.status = 403;
    throw error;
  }
  return profile;
}

async function readMainAdmin(config) {
  const rows = await supabaseRequest(config, 'profiles', {
    method: 'GET',
    query: { select: 'full_name,email', role: 'eq.admin', order: 'created_at.asc', limit: '1' },
  });
  const admin = Array.isArray(rows) ? rows[0] : null;
  return admin?.full_name || admin?.email || 'Admin';
}

async function readProfile(config, userId) {
  const rows = await supabaseRequest(config, 'profiles', {
    method: 'GET',
    query: { select: '*', id: `eq.${userId}`, limit: '1' },
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function readPackSettings(config) {
  const rows = await supabaseRequest(config, 'pack_settings', {
    method: 'GET',
    query: { select: '*', limit: '1' },
  }).catch(() => []);
  const settings = Array.isArray(rows) ? rows[0] || {} : {};
  return {
    free_tokens: Number(settings.free_tokens || 5),
    free_reset_hours: Number(settings.free_reset_hours || 24),
    monthly_tokens: Number(settings.monthly_tokens || 100),
    monthly_reset_hours: Number(settings.monthly_reset_hours || 24),
    monthly_ai_messages_limit: Number(settings.monthly_ai_messages_limit || 100),
    yearly_tokens: Number(settings.yearly_tokens || 1500),
    yearly_reset_hours: Number(settings.yearly_reset_hours || 168),
    yearly_ai_messages_limit: Number(settings.yearly_ai_messages_limit || 500),
  };
}

async function readAiMessageUsage(config, userId) {
  const rows = await supabaseRequest(config, 'ai_message_usage', {
    method: 'GET',
    query: { select: 'id,user_id,message_count,period_start', user_id: `eq.${userId}`, order: 'created_at.desc', limit: '1' },
  }).catch((error) => {
    error.message = 'La limite Assistant IA n’est pas configuree. Ajoutez la table ai_message_usage.';
    throw error;
  });

  const row = Array.isArray(rows) ? rows[0] : null;
  return row || { id: null, user_id: userId, message_count: 0 };
}

async function updateProfile(config, userId, body) {
  const rows = await supabaseRequest(config, 'profiles', {
    method: 'PATCH',
    query: { id: `eq.${userId}`, select: '*' },
    headers: { Prefer: 'return=representation' },
    body,
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function readPayment(config, paymentId) {
  const rows = await supabaseRequest(config, 'payments', {
    method: 'GET',
    query: { select: '*', id: `eq.${paymentId}`, limit: '1' },
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function updatePayment(config, paymentId, body) {
  const rows = await supabaseRequest(config, 'payments', {
    method: 'PATCH',
    query: { id: `eq.${paymentId}`, select: '*' },
    headers: { Prefer: 'return=representation' },
    body,
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function rejectPendingSubscriptions(config, userId) {
  await updateSubscriptions(config, {
    userId,
    fromStatus: 'pending',
    body: { status: 'rejected' },
  });
}

async function updateSubscriptions(config, { userId, packName, fromStatus, body }) {
  const query = { user_id: `eq.${userId}`, select: 'id' };
  if (packName) query.pack_name = `eq.${packName}`;
  if (fromStatus) query.status = `eq.${fromStatus}`;

  const rows = await supabaseRequest(config, 'subscriptions', {
    method: 'PATCH',
    query,
    headers: { Prefer: 'return=representation' },
    body,
  });
  return Array.isArray(rows) ? rows.length : 0;
}

async function userHasActivePack(config, userId) {
  const rows = await supabaseRequest(config, 'profiles', {
    method: 'GET',
    query: { select: 'id', id: `eq.${userId}`, pack_status: 'eq.active', limit: '1' },
  });
  return Array.isArray(rows) && rows.length > 0;
}

async function readSupabaseCount(config, table) {
  const response = await fetch(buildSupabaseUrl(config, table, { select: 'id' }), {
    method: 'GET',
    headers: supabaseHeaders(config, { Prefer: 'count=exact', Range: '0-0' }),
  });
  if (!response.ok) throw new Error(`Impossible de lire le compteur ${table}.`);
  return parseContentRangeCount(response.headers.get('content-range'));
}

async function countUserAnalyses(config, userId, startIso, endIso) {
  const query = { select: 'id', user_id: `eq.${userId}`, created_at: `gte.${startIso}` };
  const response = await fetch(buildSupabaseUrl(config, 'analyses', query), {
    method: 'GET',
    headers: supabaseHeaders(config, { Prefer: 'count=exact', Range: '0-0' }),
  });

  if (!response.ok) {
    const error = new Error('Impossible de verifier votre limite de scans.');
    error.status = response.status;
    throw error;
  }

  return parseContentRangeCount(response.headers.get('content-range'));
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

function normalizePackType(packType) {
  const value = cleanText(packType);
  return value === 'yearly' || value === 'monthly' ? value : '';
}

function normalizePaymentPackType(payment) {
  return normalizePackType(payment?.pack_type) || normalizePackType(cleanText(payment?.proof_url).replace(/^pack:/, ''));
}

function packAmount(packType) {
  return packType === 'yearly' ? 249 : 29;
}

function addPackDuration(start, packType) {
  const end = new Date(start);
  end.setDate(end.getDate() + (packType === 'yearly' ? 365 : 30));
  return end;
}

function effectivePack(profile) {
  const status = cleanText(profile.pack_status) || 'free';
  const type = cleanText(profile.pack_type) || 'none';
  const endAt = profile.pack_end_at;

  if (status === 'active' && endAt) {
    const end = new Date(endAt);
    if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) {
      return { status: 'expired', type, startAt: profile.pack_start_at, endAt };
    }
  }

  return { status, type, startAt: profile.pack_start_at, endAt };
}

function scanLimit(pack) {
  if (pack.status === 'active' && pack.type === 'monthly') return 100;
  if (pack.status === 'active' && pack.type === 'yearly') return 1500;
  return 5;
}

function periodStart(pack) {
  if (pack.status === 'active' && pack.startAt) {
    const start = new Date(pack.startAt);
    if (!Number.isNaN(start.getTime())) return start.toISOString();
  }

  const now = new Date();
  if (pack.status === 'active' && pack.type === 'yearly') {
    return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  }

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function limitMessage(pack, limit) {
  if (pack.status === 'expired') return 'Votre pack est expiré. Passez à un pack premium pour continuer.';
  if (pack.status !== 'active') return 'Vous avez atteint la limite de 5 scans du Pack Gratuit ce mois-ci. Passez à un pack premium pour continuer.';
  return `Vous avez atteint la limite de ${limit} scans pour votre pack.`;
}

function parseContentRangeCount(contentRange) {
  const count = Number(String(contentRange || '').split('/').pop());
  return Number.isFinite(count) ? count : 0;
}

function cleanText(value) {
  return String(value || '').trim();
}
