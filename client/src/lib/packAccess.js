import { getCurrentProfile } from './auth.js';
import { DEFAULT_PACK_SETTINGS, getEffectivePackStatus, normalizePackSettings, normalizePackType } from './packs.js';
import { requireSupabaseClient } from './supabaseClient.js';

const TOKEN_LIMIT_MESSAGE = 'Vous avez utilisé toutes vos analyses gratuites.';
const MONTHLY_TOKEN_LIMIT_MESSAGE = 'Vous avez utilisé toutes vos analyses du Pack Mensuel. Vos analyses seront renouvelées selon votre période de renouvellement.';
const YEARLY_TOKEN_LIMIT_MESSAGE = 'Vous avez utilisé toutes vos analyses du Pack Annuel. Vos analyses seront renouvelées selon votre période de renouvellement.';

export function normalizeProfilePack(profile = {}) {
  const status = getEffectivePackStatus(profile);
  const type = normalizePackType(profile.packType || profile.pack_type);
  const startAt = profile.packStartAt || profile.pack_start_at || null;
  const endAt = profile.packEndAt || profile.pack_end_at || null;

  if (status === 'blocked') return { status: 'blocked', type: 'none', startAt: null, endAt: null, active: false };
  if (status === 'active' && ['monthly', 'yearly'].includes(type)) return { status: 'active', type, startAt, endAt, active: true };
  return { status: status === 'expired' ? 'expired' : 'free', type: 'none', startAt: null, endAt: null, active: false };
}

export async function getPackSettings() {
  const client = requireSupabaseClient();
  const { data, error } = await client.from('pack_settings').select('*').limit(1).maybeSingle();
  if (error || !data) return DEFAULT_PACK_SETTINGS;
  return normalizePackSettings(data);
}

export async function getUsageInfo(userId, profile, settings) {
  const pack = normalizeProfilePack(profile);

  if (pack.status === 'blocked') {
    return {
      allowed: false,
      message: "Votre compte est bloque. Contactez l'administration.",
      used: 0,
      limit: 0,
      remaining: 0,
      packStatus: 'blocked',
      packType: 'none',
      packEndAt: null,
      periodStart: null,
      periodEnd: null,
      isPaid: false,
    };
  }

  const now = new Date();
  const freeResetHours = [5, 24, 168].includes(Number(settings.free_reset_hours)) ? Number(settings.free_reset_hours) : 24;
  const monthlyResetHours = [24, 168].includes(Number(settings.monthly_reset_hours)) ? Number(settings.monthly_reset_hours) : 24;
  const yearlyResetHours = [168, 720].includes(Number(settings.yearly_reset_hours)) ? Number(settings.yearly_reset_hours) : 168;
  let packStatus = 'free';
  let packType = 'none';
  let limit = Number(settings.free_tokens || DEFAULT_PACK_SETTINGS.free_tokens);
  let periodEnd = new Date(now.getTime() + freeResetHours * 60 * 60 * 1000).toISOString();
  let periodStart = new Date(now.getTime() - freeResetHours * 60 * 60 * 1000).toISOString();
  let isPaid = false;
  let message = TOKEN_LIMIT_MESSAGE;
  let resetAt = null;

  if (pack.active && pack.endAt && new Date(pack.endAt).getTime() > now.getTime()) {
    packStatus = 'active';
    packType = pack.type;
    isPaid = true;
    if (pack.type === 'monthly') {
      limit = Number(settings.monthly_tokens || DEFAULT_PACK_SETTINGS.monthly_tokens);
      periodStart = new Date(now.getTime() - monthlyResetHours * 60 * 60 * 1000).toISOString();
      periodEnd = new Date(now.getTime() + monthlyResetHours * 60 * 60 * 1000).toISOString();
      message = MONTHLY_TOKEN_LIMIT_MESSAGE;
    } else {
      limit = Number(settings.yearly_tokens || DEFAULT_PACK_SETTINGS.yearly_tokens);
      periodStart = new Date(now.getTime() - yearlyResetHours * 60 * 60 * 1000).toISOString();
      periodEnd = new Date(now.getTime() + yearlyResetHours * 60 * 60 * 1000).toISOString();
      message = YEARLY_TOKEN_LIMIT_MESSAGE;
    }
  }

  const [used, earliestAnalysisAt] = await Promise.all([
    countAnalyses(userId, periodStart, null),
    packStatus === 'free' ? getEarliestAnalysisAt(userId, periodStart) : Promise.resolve(null),
  ]);
  if (packStatus === 'free' && earliestAnalysisAt) {
    resetAt = new Date(new Date(earliestAnalysisAt).getTime() + freeResetHours * 60 * 60 * 1000).toISOString();
    periodEnd = resetAt;
  }
  const remaining = Math.max(limit - used, 0);

  return {
    allowed: remaining > 0,
    message: remaining > 0 ? '' : message,
    used,
    limit,
    remaining,
    packStatus,
    packType,
    packEndAt: isPaid ? pack.endAt : null,
    periodStart,
    periodEnd,
    resetAt,
    isPaid,
  };
}

export async function canRunAnalysis(userId) {
  const profile = await getCurrentProfile();
  if (!profile || profile.id !== userId) {
    return { allowed: false, message: 'Connectez-vous pour lancer une analyse.' };
  }

  const settings = await getPackSettings();
  return getUsageInfo(userId, profile, settings);
}

async function countAnalyses(userId, startIso, endIso) {
  let query = requireSupabaseClient()
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startIso);

  if (endIso) query = query.lte('created_at', endIso);

  const { count, error } = await query;
  if (error) throw new Error(error.message || 'Impossible de verifier votre limite de scans.');
  return count || 0;
}

async function getEarliestAnalysisAt(userId, startIso) {
  const { data, error } = await requireSupabaseClient()
    .from('analyses')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', startIso)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message || 'Impossible de verifier votre reinitialisation.');
  return data?.created_at || null;
}
