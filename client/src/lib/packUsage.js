import { getCurrentProfile } from './auth.js';
import { getPackLimit, getPackSettings, normalizePackType } from './packs.js';
import { requireSupabaseClient } from './supabaseClient.js';

export async function assertCanAnalyze() {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error('Connectez-vous pour lancer une analyse.');
  }

  const snapshot = await getTokenSnapshot(profile);
  if (!snapshot.allowed) {
    throw new Error(snapshot.message);
  }

  return snapshot;
}

export async function consumeAnalysisToken() {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc('consume_scan_token');

  if (error) {
    throw new Error(error.message || 'Impossible de comptabiliser le token.');
  }

  return normalizeTokenSnapshot(data);
}

export async function getTokenSnapshot(profileOverride) {
  const profile = profileOverride || (await getCurrentProfile());
  if (!profile) return null;

  const client = requireSupabaseClient();
  const { data, error } = await client.rpc('get_token_snapshot');

  if (!error && data) {
    return normalizeTokenSnapshot(data);
  }

  const settings = await getPackSettings();
  const limit = getPackLimit(profile, settings);
  if (limit.blocked) {
    return { allowed: false, message: limit.message, remaining: 0, limit: 0, used: 0, profile };
  }

  return {
    allowed: true,
    message: '',
    remaining: limit.scans,
    limit: limit.scans,
    used: 0,
    periodEnd: profile.packEndAt || null,
    packStatus: profile.packStatus,
    packType: normalizePackType(profile.packType),
    premium: limit.premium,
    profile,
  };
}

export function normalizeTokenSnapshot(value = {}) {
  return {
    allowed: Boolean(value.allowed ?? true),
    message: value.message || '',
    used: Number(value.tokens_used ?? value.used ?? 0),
    limit: Number(value.token_limit ?? value.limit ?? 0),
    remaining: Number(value.tokens_remaining ?? value.remaining ?? 0),
    periodStart: value.period_start || value.periodStart || null,
    periodEnd: value.period_end || value.periodEnd || null,
    packStatus: value.pack_status || value.packStatus || 'free',
    packType: value.pack_type || value.packType || 'none',
    premium: Boolean(value.premium),
  };
}

export function formatTokenReset(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
