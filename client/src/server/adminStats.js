const SUPABASE_REST_PATH = '/rest/v1';
const STORAGE_WARNING =
  'Base de données non configurée. Ajoutez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans Vercel.';

export async function readAdminStats({ requesterToken } = {}) {
  const config = getSupabaseConfig();

  if (!config) {
    return {
      usersCount: 0,
      scansCount: 0,
      platformStatus: 'Base de données non configurée',
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

  return {
    usersCount,
    scansCount,
    platformStatus: 'Active',
    mainAdmin,
  };
}

export async function activateUserPack({ requesterToken, userId, packType }) {
  const config = requireSupabaseConfig();
  const admin = await requireAdmin(config, requesterToken);
  const normalizedPackType = packType === 'yearly' ? 'yearly' : 'monthly';
  const now = new Date();
  const end = new Date(now);

  if (normalizedPackType === 'yearly') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

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
  const profile = await updateProfile(config, userId, {
    pack_status: 'expired',
    pack_type: 'none',
    pack_end_at: new Date().toISOString(),
  });

  return { profile };
}

export async function blockUser({ requesterToken, userId }) {
  const config = requireSupabaseConfig();
  await requireAdmin(config, requesterToken);
  const profile = await updateProfile(config, userId, {
    pack_status: 'blocked',
    pack_type: 'none',
  });

  return { profile };
}

export async function unblockUser({ requesterToken, userId }) {
  const config = requireSupabaseConfig();
  await requireAdmin(config, requesterToken);
  const profile = await updateProfile(config, userId, {
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
  const profile = await updateProfile(config, userId, {
    role: 'admin',
  });

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

  await updatePayment(config, paymentId, { status: 'confirmed' });

  const now = new Date();
  const end = new Date(now);
  if (packType === 'yearly') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

  const profile = await updateProfile(config, payment.user_id, {
    pack_status: 'active',
    pack_type: packType,
    pack_start_at: now.toISOString(),
    pack_end_at: end.toISOString(),
  });

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

  return { confirmed: true, profile };
}

export async function rejectPayment({ requesterToken, paymentId }) {
  const config = requireSupabaseConfig();
  await requireAdmin(config, requesterToken);
  const payment = await updatePayment(config, paymentId, { status: 'rejected' });
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
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
  });

  if (!authResponse.ok && authResponse.status !== 404) {
    const error = new Error('La suppression complète du compte Auth nécessite une action serveur sécurisée.');
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

async function requireAdmin(config, requesterToken) {
  const cleanToken = cleanText(requesterToken);
  if (!cleanToken) {
    const error = new Error('Session admin introuvable.');
    error.status = 401;
    throw error;
  }

  const userResponse = await fetch(`${config.url}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey || config.serviceRoleKey,
      Authorization: `Bearer ${cleanToken}`,
    },
  });

  if (!userResponse.ok) {
    const error = new Error('Session admin invalide.');
    error.status = 401;
    throw error;
  }

  const authUser = await userResponse.json();
  const profile = await readProfile(config, authUser.id);

  if (profile?.role !== 'admin') {
    const error = new Error("Accès refusé. Ce compte n'est pas administrateur.");
    error.status = 403;
    throw error;
  }

  return profile;
}

async function readMainAdmin(config) {
  const rows = await supabaseRequest(config, 'profiles', {
    method: 'GET',
    query: {
      select: 'full_name,email',
      role: 'eq.admin',
      order: 'created_at.asc',
      limit: '1',
    },
  });

  const admin = Array.isArray(rows) ? rows[0] : null;
  return admin?.full_name || admin?.email || 'Admin';
}

async function readProfile(config, userId) {
  const rows = await supabaseRequest(config, 'profiles', {
    method: 'GET',
    query: {
      select: 'id,role,email,full_name',
      id: `eq.${userId}`,
      limit: '1',
    },
  });

  return Array.isArray(rows) ? rows[0] : null;
}

async function updateProfile(config, userId, body) {
  const rows = await supabaseRequest(config, 'profiles', {
    method: 'PATCH',
    query: {
      id: `eq.${userId}`,
      select: 'id,full_name,email,role,pack_status,pack_type,pack_start_at,pack_end_at',
    },
    headers: { Prefer: 'return=representation' },
    body,
  });

  return Array.isArray(rows) ? rows[0] : null;
}

async function readPayment(config, paymentId) {
  const rows = await supabaseRequest(config, 'payments', {
    method: 'GET',
    query: {
      select: '*',
      id: `eq.${paymentId}`,
      limit: '1',
    },
  });

  return Array.isArray(rows) ? rows[0] : null;
}

async function updatePayment(config, paymentId, body) {
  const rows = await supabaseRequest(config, 'payments', {
    method: 'PATCH',
    query: {
      id: `eq.${paymentId}`,
      select: '*',
    },
    headers: { Prefer: 'return=representation' },
    body,
  });

  return Array.isArray(rows) ? rows[0] : null;
}

function normalizePaymentPackType(payment) {
  const direct = cleanText(payment?.pack_type);
  if (direct === 'monthly' || direct === 'yearly') return direct;

  const legacy = cleanText(payment?.proof_url).replace(/^pack:/, '');
  if (legacy === 'monthly' || legacy === 'yearly') return legacy;
  return '';
}

async function readSupabaseCount(config, table) {
  const response = await fetch(buildSupabaseUrl(config, table, { select: 'id' }), {
    method: 'GET',
    headers: supabaseHeaders(config, {
      Prefer: 'count=exact',
      Range: '0-0',
    }),
  });

  if (!response.ok) {
    throw new Error(`Impossible de lire le compteur ${table}.`);
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
    const error = new Error(`Supabase request failed for ${table}.`);
    error.status = response.status;
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

function parseContentRangeCount(contentRange) {
  const count = Number(String(contentRange || '').split('/').pop());
  return Number.isFinite(count) ? count : 0;
}

function cleanText(value) {
  return String(value || '').trim();
}
