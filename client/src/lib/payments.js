import { getPackAmountDh, getPackByType, getPackSettings } from './packs.js';
import { requireSupabaseClient } from './supabaseClient.js';

export async function createManualPackRequest({ profile, packType, paymentMethod, userNote = '' }) {
  const client = requireSupabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  const user = authData?.user;
  const pack = getPackByType(packType);

  if (authError || !user?.id) {
    throw new Error('Connectez-vous pour demander un pack.');
  }

  if (profile?.id && profile.id !== user.id) {
    throw new Error('Session utilisateur invalide.');
  }

  if (!['monthly', 'yearly'].includes(pack.packType)) {
    throw new Error('Pack invalide.');
  }

  if (!['rib', 'cashplus'].includes(paymentMethod)) {
    throw new Error('Choisissez RIB ou CashPlus.');
  }

  const { data: existingPending, error: existingError } = await client
    .from('payment_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message || 'Impossible de verifier vos demandes en attente.');
  }

  if (existingPending) {
    throw new Error('Vous avez deja une demande en attente.');
  }

  const settings = await getPackSettings();
  const { data, error } = await client
    .from('payment_requests')
    .insert({
      user_id: user.id,
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
    .eq('id', user.id);

  return data;
}

export async function getMyPaymentRequests() {
  const client = requireSupabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  const user = authData?.user;

  if (authError || !user?.id) {
    throw new Error('Connectez-vous pour consulter vos demandes.');
  }

  const { data, error } = await client
    .from('payment_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];
  return data || [];
}
