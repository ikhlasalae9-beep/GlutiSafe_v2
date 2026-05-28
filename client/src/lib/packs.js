import { requireSupabaseClient } from './supabaseClient.js';

export const DEFAULT_PACK_SETTINGS = {
  free_tokens: 5,
  free_reset_hours: 24,
  monthly_tokens: 100,
  yearly_tokens: 1500,
  monthly_price_mad: 29,
  yearly_price_mad: 249,
};

export const DEFAULT_PAYMENT_SETTINGS = {
  rib_holder: '',
  bank_name: '',
  rib_number: '',
  cashplus_full_name: '',
  cashplus_phone: '',
  cashplus_city: '',
  payment_note: '',
};

export const PACKS = [
  {
    id: 'free',
    packType: 'none',
    title: 'Gratuit',
    displayName: 'Pack Gratuit',
    badge: 'Gratuit',
    priceKey: null,
    cadence: '',
    scansKey: 'free_tokens',
    features: ['Tokens gratuits renouvelables', 'Historique limité aux 3 dernières analyses', 'OCR de base', 'Détection gluten'],
    cta: 'Pack actuel',
  },
  {
    id: 'monthly',
    packType: 'monthly',
    title: 'Mensuel',
    displayName: 'Pack Mensuel',
    badge: 'Premium',
    priceKey: 'monthly_price_mad',
    cadence: '/ 30 jours',
    scansKey: 'monthly_tokens',
    features: ['OCR avancé', 'Détection gluten', 'Explication IA', 'Assistant IA', 'Historique complet', 'Images produits dans l’historique', 'Plus de tokens'],
    cta: 'Demander ce pack',
  },
  {
    id: 'yearly',
    packType: 'yearly',
    title: 'Annuel',
    displayName: 'Pack Annuel',
    badge: 'Meilleur choix',
    priceKey: 'yearly_price_mad',
    cadence: '/ 365 jours',
    scansKey: 'yearly_tokens',
    features: ['OCR avancé', 'Détection gluten', 'Explication IA', 'Assistant IA', 'Historique complet', 'Images produits dans l’historique', 'Plus de tokens'],
    cta: 'Demander ce pack',
    highlighted: true,
  },
];

export const PAYMENT_METHODS = [
  { id: 'rib', label: 'Paiement par RIB' },
  { id: 'cashplus', label: 'Paiement par CashPlus' },
];

export function normalizePackStatus(value) {
  const status = String(value || '').trim();
  return status || 'free';
}

export function normalizePackType(value) {
  const type = String(value || '').trim();
  return type || 'none';
}

export function getPackByType(packType) {
  const normalized = normalizePackType(packType);
  return PACKS.find((pack) => pack.packType === normalized) || PACKS[0];
}

export function getCurrentPack(profile = {}) {
  const status = getEffectivePackStatus(profile);
  const type = normalizePackType(profile.packType || profile.pack_type);

  if (status === 'active' && type !== 'none') return getPackByType(type);
  return PACKS[0];
}

export function getPackDisplayName(packStatus, packType) {
  const status = normalizePackStatus(packStatus);
  const type = normalizePackType(packType);

  if (status === 'blocked') return 'Utilisateur bloque';
  if (status === 'expired') return 'Pack expire';
  if (status === 'pending') return 'Demande en attente';
  if (status === 'active') return getPackByType(type).displayName;
  return PACKS[0].displayName;
}

export function getPackStatusLabel(packStatus) {
  const status = normalizePackStatus(packStatus);
  const labels = {
    free: 'Gratuit',
    pending: 'En attente',
    active: 'Actif',
    expired: 'Expire',
    blocked: 'Bloque',
  };
  return labels[status] || labels.free;
}

export function getPackTypeLabel(packType, packStatus = 'free') {
  const status = normalizePackStatus(packStatus);
  const type = normalizePackType(packType);
  if (status !== 'active') return PACKS[0].title;
  return getPackByType(type).title;
}

export function getPackAmountDh(packType, settings = DEFAULT_PACK_SETTINGS) {
  if (packType === 'yearly') return Number(settings.yearly_price_mad ?? DEFAULT_PACK_SETTINGS.yearly_price_mad);
  if (packType === 'monthly') return Number(settings.monthly_price_mad ?? DEFAULT_PACK_SETTINGS.monthly_price_mad);
  return 0;
}

export function getEffectivePackStatus(profile = {}) {
  const status = normalizePackStatus(profile.packStatus || profile.pack_status);
  const endAt = profile.packEndAt || profile.pack_end_at;

  if (status === 'active' && endAt) {
    const end = new Date(endAt);
    if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) return 'expired';
  }

  return status;
}

export function getPackLimit(profile = {}, settings = DEFAULT_PACK_SETTINGS) {
  const status = getEffectivePackStatus(profile);
  const type = normalizePackType(profile.packType || profile.pack_type);

  if (status === 'blocked') return { blocked: true, message: "Votre compte est bloque. Contactez l'administration." };
  if (status === 'active' && type === 'monthly') return { scans: Number(settings.monthly_tokens || 100), history: Infinity, premium: true };
  if (status === 'active' && type === 'yearly') return { scans: Number(settings.yearly_tokens || 1500), history: Infinity, premium: true };
  return { scans: Number(settings.free_tokens || 5), history: 3, premium: false };
}

export function describeCurrentPack(profile = {}) {
  const status = getEffectivePackStatus(profile);
  const type = normalizePackType(profile.packType || profile.pack_type);
  const endAt = profile.packEndAt || profile.pack_end_at;
  const endLabel = formatDate(endAt);

  if (status === 'blocked') return 'Compte bloque';
  if (status === 'pending') return 'Demande en attente';
  if (status === 'expired') return 'Pack expire';
  if (status === 'active' && type === 'monthly') return `Pack Mensuel actif jusqu'au ${endLabel}`;
  if (status === 'active' && type === 'yearly') return `Pack Annuel actif jusqu'au ${endLabel}`;
  return 'Pack Gratuit';
}

export async function getPackSettings() {
  const client = requireSupabaseClient();
  const { data, error } = await client.from('pack_settings').select('*').limit(1).maybeSingle();
  if (error) return DEFAULT_PACK_SETTINGS;
  return normalizePackSettings(data);
}

export async function getPaymentSettings() {
  const client = requireSupabaseClient();
  const { data, error } = await client.from('payment_settings').select('*').limit(1).maybeSingle();
  if (error) return DEFAULT_PAYMENT_SETTINGS;
  return { ...DEFAULT_PAYMENT_SETTINGS, ...(data || {}) };
}

export async function updatePackSettings(settings) {
  const client = requireSupabaseClient();
  const payload = normalizePackSettings(settings);
  const existing = await client.from('pack_settings').select('id').limit(1).maybeSingle();
  const query = existing.data?.id !== undefined
    ? client.from('pack_settings').update(payload).eq('id', existing.data.id)
    : client.from('pack_settings').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error) throw new Error(error.message || 'Impossible de sauvegarder les packs.');
  return normalizePackSettings(data);
}

export async function updatePaymentSettings(settings) {
  const client = requireSupabaseClient();
  const payload = { ...DEFAULT_PAYMENT_SETTINGS, ...settings };
  const existing = await client.from('payment_settings').select('id').limit(1).maybeSingle();
  const query = existing.data?.id !== undefined
    ? client.from('payment_settings').update(payload).eq('id', existing.data.id)
    : client.from('payment_settings').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error) throw new Error(error.message || 'Impossible de sauvegarder les parametres de paiement.');
  return { ...DEFAULT_PAYMENT_SETTINGS, ...data };
}

export function normalizePackSettings(settings = {}) {
  return {
    free_tokens: numberOrDefault(settings.free_tokens, DEFAULT_PACK_SETTINGS.free_tokens),
    free_reset_hours: [5, 24, 168].includes(Number(settings.free_reset_hours)) ? Number(settings.free_reset_hours) : 24,
    monthly_tokens: numberOrDefault(settings.monthly_tokens, DEFAULT_PACK_SETTINGS.monthly_tokens),
    yearly_tokens: numberOrDefault(settings.yearly_tokens, DEFAULT_PACK_SETTINGS.yearly_tokens),
    monthly_price_mad: numberOrDefault(settings.monthly_price_mad, DEFAULT_PACK_SETTINGS.monthly_price_mad),
    yearly_price_mad: numberOrDefault(settings.yearly_price_mad, DEFAULT_PACK_SETTINGS.yearly_price_mad),
  };
}

export function formatPackPrice(pack, settings) {
  const amount = pack.priceKey ? Number(settings?.[pack.priceKey] ?? DEFAULT_PACK_SETTINGS[pack.priceKey]) : 0;
  return `${amount} DH`;
}

export function formatPackTokens(pack, settings) {
  const tokens = Number(settings?.[pack.scansKey] ?? DEFAULT_PACK_SETTINGS[pack.scansKey]);
  if (pack.id === 'free') return `${tokens} tokens / ${formatResetDuration(settings?.free_reset_hours || 24)}`;
  return `${tokens} tokens`;
}

export function formatResetDuration(hours) {
  const value = Number(hours);
  if (value === 5) return '5 heures';
  if (value === 168) return '7 jours';
  return '24 heures';
}

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}
