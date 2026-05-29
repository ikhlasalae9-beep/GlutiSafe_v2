import { API_URL } from '../config/api.js';
import { cleanSupabaseError, getCurrentProfile } from './auth.js';
import {
  describeCurrentPack,
  getEffectivePackStatus,
  getPackDisplayName,
  getPackSettings,
  getPackStatusLabel,
  getPackTypeLabel,
  getPaymentSettings,
  normalizePackStatus,
  normalizePackType,
} from './packs.js';
import { SUPABASE_URL, isSupabaseConfigured, requireSupabaseClient } from './supabaseClient.js';

const DASHBOARD_LIMITS = {
  users: 500,
  analyses: 1000,
  subscriptions: 500,
  paymentRequests: 500,
};

export async function fetchAdminDashboard() {
  const client = requireSupabaseClient();

  const profile = await getCurrentProfile();
  if (profile?.role !== 'admin') {
    throw new Error("Accès refusé. Ce compte n'est pas administrateur.");
  }

  const [profilesResult, analysesResult, subscriptionsResult, paymentRequestsResult, pendingRequestsCountResult, packSettings, paymentSettings] = await Promise.all([
    client
      .from('profiles')
      .select('id, full_name, email, role, pack_status, pack_type, pack_start_at, pack_end_at, created_at')
      .order('created_at', { ascending: false })
      .limit(DASHBOARD_LIMITS.users),
    client
      .from('analyses')
      .select(
        'id, user_id, input_type, ocr_text, status, label, detected_words, possible_words, safe_claims, confidence, explanation, product_name, image_path, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(DASHBOARD_LIMITS.analyses),
    fetchOptionalSubscriptions(client),
    fetchOptionalPaymentRequests(client),
    fetchPendingPaymentRequestsCount(client),
    getPackSettings(),
    getPaymentSettings(),
  ]);

  const firstError = [profilesResult, analysesResult].find((result) => result.error)?.error;
  if (firstError) {
    throw new Error(cleanSupabaseError(firstError) || 'Impossible de charger les données admin.');
  }

  const users = (profilesResult.data || []).map(normalizeAdminUser);
  const userById = new Map(users.map((user) => [user.id, user]));
  const requestProfiles = await fetchProfilesForRequests(client, paymentRequestsResult.data || []);
  requestProfiles.forEach((requestProfile) => {
    userById.set(requestProfile.id, normalizeAdminUser(requestProfile));
  });
  const analyses = (analysesResult.data || []).map((analysis) => normalizeAdminAnalysis(analysis, userById));
  const subscriptions = (subscriptionsResult.data || []).map((subscription) => normalizeSubscription(subscription, userById));
  const payments = (paymentRequestsResult.data || []).map((payment) => normalizePaymentRequest(payment, userById));
  const pendingPaymentRequests = payments.filter((payment) => payment.status === 'pending');
  const mainAdmin = users.find((user) => user.role === 'admin');
  const scanStats = buildScanStats(analyses);
  const activeMonthlyCount = users.filter((user) => user.packStatus === 'active' && user.packType === 'monthly').length;
  const activeYearlyCount = users.filter((user) => user.packStatus === 'active' && user.packType === 'yearly' && isFutureDate(user.packEndAt)).length;
  const freeUsersCount = users.filter((user) => user.packStatus === 'free').length;
  const pendingPaymentRequestsCount = pendingRequestsCountResult.count || 0;

  console.log('pending payment requests', pendingPaymentRequests);
  console.log('pending payment requests count', pendingPaymentRequestsCount);

  return {
    admin: profile,
    users,
    analyses,
    subscriptions,
    payments,
    pendingPaymentRequests,
    packSettings,
    paymentSettings,
    usersCount: users.length,
    freeUsersCount,
    pendingPaymentRequestsCount,
    activeMonthlyCount,
    activeYearlyCount,
    scansCount: analyses.length,
    platformStatus: 'Active',
    mainAdmin: mainAdmin?.name || mainAdmin?.email || 'Admin',
    latestUsers: users.slice(0, 8),
    latestAnalyses: analyses.slice(0, 8),
    latestPendingRequests: pendingPaymentRequests.slice(0, 5),
    packDistribution: buildPackDistribution(users, pendingPaymentRequestsCount),
    scanStats,
    aiUsage: buildAiUsage(analyses),
    settings: {
      supabaseConfigured: isSupabaseConfigured,
      supabaseUrl: SUPABASE_URL,
      apiUrl: API_URL || 'Same-origin Vercel API',
      ocrMode: API_URL ? 'Backend OCR API' : 'Vercel OCR API',
      platformStatus: 'Active',
    },
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

  return readAdminActionResponse(response);
}

export async function deleteAdminUser(userId, { deleteAnalyses = false } = {}) {
  const client = requireSupabaseClient();
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Session admin introuvable.');
  }

  const response = await fetch(`${API_URL}/api/admin/delete-user`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, deleteAnalyses }),
  });

  return readAdminActionResponse(response);
}

export async function runAdminPaymentAction(paymentId, action) {
  const client = requireSupabaseClient();
  const payment = await readPaymentRequest(client, paymentId);
  if (!payment) throw new Error('Demande de paiement introuvable.');

  if (action === 'confirm') {
    const { data: authData } = await client.auth.getUser();
    const adminId = authData.user?.id || null;
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + (payment.pack_type === 'yearly' ? 365 : 30));

    const { error: paymentError } = await client
      .from('payment_requests')
      .update({ status: 'confirmed', confirmed_by: adminId, confirmed_at: now.toISOString(), updated_at: now.toISOString() })
      .eq('id', paymentId);
    if (paymentError) throw new Error(paymentError.message || 'Confirmation paiement impossible.');

    const { error: profileError } = await client
      .from('profiles')
      .update({
        pack_status: 'active',
        pack_type: payment.pack_type,
        pack_start_at: now.toISOString(),
        pack_end_at: end.toISOString(),
      })
      .eq('id', payment.user_id);
    if (profileError) throw new Error(profileError.message || 'Activation pack impossible.');

    await client.from('subscriptions').insert({
      user_id: payment.user_id,
      status: 'active',
      pack_name: payment.pack_type,
      start_date: now.toISOString(),
      end_date: end.toISOString(),
      activated_by: adminId,
    });

    return { confirmed: true };
  }

  if (action === 'reject') {
    const nowIso = new Date().toISOString();
    const { error: paymentError } = await client.from('payment_requests').update({ status: 'rejected', updated_at: nowIso }).eq('id', paymentId);
    if (paymentError) throw new Error(paymentError.message || 'Rejet paiement impossible.');

    const { data: activeProfile } = await client
      .from('profiles')
      .select('id')
      .eq('id', payment.user_id)
      .eq('pack_status', 'active')
      .gt('pack_end_at', nowIso)
      .maybeSingle();

    if (!activeProfile) {
      await client
        .from('profiles')
        .update({ pack_status: 'free', pack_type: 'none', pack_start_at: null, pack_end_at: null })
        .eq('id', payment.user_id);
    }

    return { rejected: true };
  }

  throw new Error('Action paiement inconnue.');
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

async function readAdminActionResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Action admin impossible.');
  }

  return payload;
}

async function fetchOptionalSubscriptions(client) {
  const result = await client
    .from('subscriptions')
    .select('id, user_id, pack_name, status, start_date, end_date, activated_by, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(DASHBOARD_LIMITS.subscriptions);

  if (result.error) {
    return { data: [], error: null, unavailable: true };
  }

  return result;
}

async function fetchOptionalPaymentRequests(client) {
  const pendingResult = await client
    .from('payment_requests')
    .select('id, user_id, pack_type, payment_method, amount, status, user_note, admin_note, confirmed_by, confirmed_at, created_at, updated_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(DASHBOARD_LIMITS.paymentRequests);

  const rejectedResult = await client
    .from('payment_requests')
    .select('id, user_id, pack_type, payment_method, amount, status, user_note, admin_note, confirmed_by, confirmed_at, created_at, updated_at')
    .eq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(100);

  if (pendingResult.error && rejectedResult.error) {
    return { data: [], error: null, unavailable: true };
  }

  return { data: [...(pendingResult.data || []), ...(rejectedResult.data || [])], error: null };
}

async function fetchPendingPaymentRequestsCount(client) {
  const { count, error } = await client
    .from('payment_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return { count: error ? 0 : count || 0, error: null };
}

async function fetchProfilesForRequests(client, requests = []) {
  const userIds = [...new Set(requests.map((request) => request.user_id).filter(Boolean))];
  if (userIds.length === 0) return [];

  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, role, pack_status, pack_type, pack_start_at, pack_end_at, created_at')
    .in('id', userIds);

  if (error) return [];
  return data || [];
}

async function readPaymentRequest(client, paymentId) {
  const { data, error } = await client.from('payment_requests').select('*').eq('id', paymentId).maybeSingle();
  if (error) throw new Error(error.message || 'Demande de paiement introuvable.');
  return data;
}

function normalizeAdminUser(profile = {}) {
  const packStatus = normalizePackStatus(profile.pack_status);
  const packType = normalizePackType(profile.pack_type);
  const effectivePackStatus = getEffectivePackStatus({ packStatus, packType, packEndAt: profile.pack_end_at });

  return {
    id: profile.id,
    name: profile.full_name || profile.email?.split('@')[0] || 'Utilisateur',
    email: profile.email || '',
    role: profile.role || 'user',
    packStatus: effectivePackStatus,
    rawPackStatus: packStatus,
    packType,
    packDisplayName: getPackDisplayName(effectivePackStatus, packType),
    packStatusLabel: getPackStatusLabel(effectivePackStatus),
    packTypeLabel: getPackTypeLabel(packType, effectivePackStatus),
    packStartAt: profile.pack_start_at || null,
    packEndAt: profile.pack_end_at || null,
    packDescription: describeCurrentPack({ packStatus: effectivePackStatus, packType, packEndAt: profile.pack_end_at }),
    createdAt: profile.created_at || null,
  };
}

function normalizeAdminAnalysis(analysis = {}, userById = new Map()) {
  const user = userById.get(analysis.user_id);

  return {
    id: analysis.id,
    userId: analysis.user_id,
    userName: user?.name || 'Utilisateur',
    userEmail: user?.email || '',
    productName: analysis.product_name || 'Produit sans nom',
    imagePath: analysis.image_path || '',
    inputType: analysis.input_type || 'manual',
    ocrText: analysis.ocr_text || '',
    status: analysis.status || 'UNKNOWN',
    label: analysis.label || analysis.status || 'Analyse',
    detectedWords: normalizeArray(analysis.detected_words),
    possibleWords: normalizeArray(analysis.possible_words),
    safeClaims: normalizeArray(analysis.safe_claims),
    confidence: analysis.confidence || '',
    explanation: analysis.explanation || '',
    createdAt: analysis.created_at || null,
  };
}

function normalizeSubscription(subscription = {}, userById = new Map()) {
  const user = userById.get(subscription.user_id);

  return {
    id: subscription.id,
    userId: subscription.user_id,
    userName: user?.name || 'Utilisateur',
    userEmail: user?.email || '',
    packName: getPackTypeLabel(subscription.pack_name, ['monthly', 'yearly'].includes(subscription.pack_name) ? 'active' : 'free'),
    status: subscription.status || 'pending',
    startDate: subscription.start_date || null,
    endDate: subscription.end_date || null,
    createdAt: subscription.created_at || null,
  };
}

function normalizePaymentRequest(payment = {}, userById = new Map()) {
  const user = userById.get(payment.user_id);
  const packType = normalizePackType(payment.pack_type);

  return {
    id: payment.id,
    userId: payment.user_id,
    userName: user?.name || 'Utilisateur',
    userEmail: user?.email || '',
    provider: payment.payment_method || 'manual',
    paymentMethod: payment.payment_method || 'manual',
    packType,
    packLabel: getPackTypeLabel(packType, 'active'),
    amount: payment.amount ?? null,
    currency: 'MAD',
    status: payment.status || 'pending',
    userNote: payment.user_note || '',
    adminNote: payment.admin_note || '',
    confirmedBy: payment.confirmed_by || null,
    confirmedAt: payment.confirmed_at || null,
    rejectedAt: payment.rejected_at || null,
    createdAt: payment.created_at || null,
    updatedAt: payment.updated_at || null,
  };
}

function buildPackDistribution(users = [], pendingRequestsCount = 0) {
  return [
    { label: 'Free', value: users.filter((user) => user.packStatus === 'free').length },
    { label: 'Pending', value: pendingRequestsCount },
    { label: 'Monthly active', value: users.filter((user) => user.packStatus === 'active' && user.packType === 'monthly').length },
    { label: 'Yearly active', value: users.filter((user) => user.packStatus === 'active' && user.packType === 'yearly' && isFutureDate(user.packEndAt)).length },
    { label: 'Expired', value: users.filter((user) => user.packStatus === 'expired').length },
    { label: 'Blocked', value: users.filter((user) => user.packStatus === 'blocked').length },
  ];
}

function buildScanStats(analyses = []) {
  const statusCounts = countBy(analyses, (analysis) => analysis.status || 'UNKNOWN');
  const scansByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
  const scansPerDay = Object.entries(countBy(analyses, (analysis) => toDayKey(analysis.createdAt)))
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const topDetectedWords = Object.entries(
    analyses.flatMap((analysis) => analysis.detectedWords || []).reduce((acc, word) => {
      const key = String(word || '').trim();
      if (key) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const mostCommonResult = scansByStatus.sort((a, b) => b.count - a.count)[0]?.status || '-';
  const usersWithScans = new Set(analyses.map((analysis) => analysis.userId).filter(Boolean)).size;

  return {
    scansByStatus,
    scansPerDay,
    topDetectedWords,
    mostCommonResult,
    lastScanDate: analyses[0]?.createdAt || null,
    glutenCount: statusCounts.CONTAINS_GLUTEN || 0,
    possibleRiskCount: statusCounts.POSSIBLE_RISK || 0,
    noGlutenCount: statusCounts.NO_GLUTEN_DETECTED || 0,
    averageScansPerUser: usersWithScans ? analyses.length / usersWithScans : 0,
  };
}

function buildAiUsage(analyses = []) {
  const withExplanation = analyses.filter((analysis) => String(analysis.explanation || '').trim());
  const usageByDay = Object.entries(countBy(withExplanation, (analysis) => toDayKey(analysis.createdAt)))
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    explanationsGenerated: withExplanation.length,
    analysesWithExplanation: withExplanation.length,
    latestAiUse: withExplanation[0]?.createdAt || null,
    provider: 'GPT-4o',
    providerSubtitle: 'OpenAI / GitHub Models',
    model: 'GPT-4o',
    usageByDay,
    latestExplanations: withExplanation.slice(0, 8),
    detailedTrackingEnabled: false,
  };
}

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) || 'Inconnu';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toDayKey(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? 'Inconnu' : date.toISOString().slice(0, 10);
}

function isFutureDate(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}
