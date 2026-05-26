import { cleanSupabaseError } from './auth.js';
import { API_URL } from '../config/api.js';
import { requireSupabaseClient } from './supabaseClient.js';

const ADMIN_STATS_ERROR = 'Impossible de charger les statistiques admin.';

export async function fetchAdminDashboard() {
  const client = requireSupabaseClient();

  const [usersCountResult, scansCountResult, usersResult, analysesResult, analysisStatusResult, mainAdminResult] = await Promise.all([
    client.from('profiles').select('id', { count: 'exact', head: true }),
    client.from('analyses').select('id', { count: 'exact', head: true }),
    client
      .from('profiles')
      .select('id, full_name, email, role, pack_status, pack_type, pack_end_at, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    client
      .from('analyses')
      .select('id, user_id, input_type, status, label, confidence, created_at')
      .order('created_at', { ascending: false })
      .limit(12),
    client.from('analyses').select('status'),
    client.from('profiles').select('full_name,email').eq('role', 'admin').order('created_at', { ascending: true }).limit(1).maybeSingle(),
  ]);

  const firstError = [usersCountResult, scansCountResult, usersResult, analysesResult, analysisStatusResult, mainAdminResult].find((result) => result.error)?.error;
  if (firstError) {
    throw new Error(cleanSupabaseError(firstError) || ADMIN_STATS_ERROR);
  }

  const userById = new Map((usersResult.data || []).map((user) => [user.id, normalizeAdminUser(user)]));

  return {
    usersCount: usersCountResult.count || 0,
    scansCount: scansCountResult.count || 0,
    platformStatus: 'Active',
    mainAdmin: mainAdminResult.data?.full_name || mainAdminResult.data?.email || 'Admin',
    users: (usersResult.data || []).map(normalizeAdminUser),
    latestAnalyses: (analysesResult.data || []).map((analysis) => normalizeAdminAnalysis(analysis, userById)),
    scanStats: buildScanStats(analysisStatusResult.data || []),
  };
}

export async function runAdminUserAction(userId, action, body = {}) {
  const client = requireSupabaseClient();
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Session admin introuvable.');
  }

  const response = await fetch(`${API_URL}/api/admin/users/${userId}/${action}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Action admin impossible.');
  }

  return payload;
}

export async function fetchAdminStats() {
  const dashboard = await fetchAdminDashboard();
  return {
    usersCount: dashboard.usersCount,
    scansCount: dashboard.scansCount,
    platformStatus: dashboard.platformStatus,
    mainAdmin: dashboard.mainAdmin,
  };
}

function normalizeAdminUser(profile = {}) {
  return {
    id: profile.id,
    name: profile.full_name || profile.email?.split('@')[0] || 'Utilisateur',
    email: profile.email || '',
    role: profile.role || 'user',
    packStatus: profile.pack_status || 'free',
    packType: profile.pack_type || 'none',
    packEndAt: profile.pack_end_at || null,
    createdAt: profile.created_at || null,
  };
}

function normalizeAdminAnalysis(analysis = {}, userById = new Map()) {
  const profile = userById.get(analysis.user_id);
  return {
    id: analysis.id,
    inputType: analysis.input_type || 'manual',
    status: analysis.status || '',
    label: analysis.label || analysis.status || 'Analyse',
    confidence: analysis.confidence || '',
    createdAt: analysis.created_at || null,
    userName: profile?.name || profile?.email || 'Utilisateur',
  };
}

function buildScanStats(rows = []) {
  const counts = rows.reduce((acc, row) => {
    const status = row.status || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}
