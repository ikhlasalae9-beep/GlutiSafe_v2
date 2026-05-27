export const PACKS = [
  {
    id: 'free',
    packType: 'none',
    title: 'Gratuit',
    displayName: 'Pack Free',
    badge: 'Gratuit',
    price: '0 DH',
    cadence: '',
    paypalAmount: null,
    scans: '5 scans / mois',
    features: ['5 scans / mois', 'Historique limité', 'OCR de base', 'Détection gluten'],
    cta: 'Commencer gratuitement',
  },
  {
    id: 'monthly',
    packType: 'monthly',
    title: 'Mensuel',
    displayName: 'Pack Mensuel',
    badge: 'Premium',
    price: '29 DH',
    cadence: '/ mois',
    paypalAmount: '2.99 USD',
    scans: '100 scans / mois',
    features: ['100 scans / mois', 'Historique complet', 'Explication IA', "Images produits dans l’historique"],
    cta: 'Choisir Mensuel',
  },
  {
    id: 'yearly',
    packType: 'yearly',
    title: 'Annuel',
    displayName: 'Pack Annuel',
    badge: 'Meilleur choix',
    price: '249 DH',
    cadence: '/ an',
    paypalAmount: '24.99 USD',
    scans: '1500 scans / an',
    features: ['1500 scans / an', 'Historique complet', 'Explication IA', 'Meilleur choix'],
    cta: 'Choisir Annuel',
    highlighted: true,
  },
];

export const PAYMENT_METHODS = [
  { id: 'paypal', label: 'Payer avec PayPal' },
  { id: 'cmi', label: 'Payer par carte bancaire CMI' },
  { id: 'manual', label: 'Paiement manuel' },
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
  const status = normalizePackStatus(profile.packStatus || profile.pack_status);
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

export function getPackAmountDh(packType) {
  return packType === 'yearly' ? 249 : packType === 'monthly' ? 29 : 0;
}
