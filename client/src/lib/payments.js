import { getPackByType } from './packs.js';
import { requireSupabaseClient } from './supabaseClient.js';

export async function createManualPackRequest({ profile, packType, paymentMethod, userNote = '' }) {
  const client = requireSupabaseClient();
  const pack = getPackByType(packType);

  if (!profile?.id) {
    throw new Error('Connectez-vous pour demander un pack.');
  }

  if (!['monthly', 'yearly'].includes(pack.packType)) {
    throw new Error('Pack invalide.');
  }

  if (!['rib', 'cashplus'].includes(paymentMethod)) {
    throw new Error('Choisissez RIB ou CashPlus.');
  }

  const { data, error } = await client.rpc('request_manual_pack', {
    requested_pack_type: pack.packType,
    requested_payment_method: paymentMethod,
    requested_user_note: String(userNote || '').trim(),
  });

  if (error) {
    throw new Error(error.message || 'Impossible de creer la demande de paiement.');
  }

  return data;
}

export async function getMyPaymentRequests() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('payment_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];
  return data || [];
}
