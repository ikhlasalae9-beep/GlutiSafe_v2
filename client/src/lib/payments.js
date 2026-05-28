import { getPackAmountDh, getPackByType, getPackSettings } from './packs.js';
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

  const settings = await getPackSettings();
  const { data, error } = await client
    .from('payment_requests')
    .insert({
      user_id: profile.id,
      pack_type: pack.packType,
      payment_method: paymentMethod,
      amount: getPackAmountDh(pack.packType, settings),
      status: 'pending',
      user_note: String(userNote || '').trim() || null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Impossible de creer la demande de paiement.');
  }

  await client
    .from('profiles')
    .update({
      pack_status: 'pending',
      pack_type: pack.packType,
      pack_start_at: null,
      pack_end_at: null,
    })
    .eq('id', profile.id);

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
