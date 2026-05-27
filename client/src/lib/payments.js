import { getPackAmountDh, getPackByType } from './packs.js';
import { requireSupabaseClient } from './supabaseClient.js';

export async function createManualPackRequest({ profile, packType }) {
  const client = requireSupabaseClient();
  const pack = getPackByType(packType);

  if (!profile?.id) {
    throw new Error('Connectez-vous pour demander un pack.');
  }

  if (!['monthly', 'yearly'].includes(pack.packType)) {
    throw new Error('Pack invalide.');
  }

  const amount = getPackAmountDh(pack.packType);
  const now = new Date().toISOString();

  const paymentPayload = {
    user_id: profile.id,
    provider: 'manual',
    method: 'manual',
    pack_type: pack.packType,
    amount,
    currency: 'MAD',
    status: 'pending',
    raw_payload: {
      source: 'packs_page',
      requested_at: now,
      display_price: pack.price,
    },
  };

  const payment = await insertPaymentWithFallback(client, paymentPayload);

  const { error: subscriptionError } = await client.from('subscriptions').insert({
    user_id: profile.id,
    pack_name: pack.packType,
    status: 'pending',
    start_date: null,
    end_date: null,
  });

  if (subscriptionError) {
    throw new Error(cleanPaymentError(subscriptionError));
  }

  return payment;
}

async function insertPaymentWithFallback(client, paymentPayload) {
  const { data, error } = await client.from('payments').insert(paymentPayload).select('id,status').single();

  if (!error) return data;

  if (!isMissingPaymentColumnError(error)) {
    throw new Error(cleanPaymentError(error));
  }

  const { data: fallbackData, error: fallbackError } = await client
    .from('payments')
    .insert({
      user_id: paymentPayload.user_id,
      amount: paymentPayload.amount,
      method: paymentPayload.provider,
      status: 'pending',
      proof_url: `pack:${paymentPayload.pack_type}`,
    })
    .select('id,status')
    .single();

  if (fallbackError) {
    throw new Error(cleanPaymentError(fallbackError));
  }

  return fallbackData;
}

function isMissingPaymentColumnError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('column') && (message.includes('provider') || message.includes('pack_type') || message.includes('raw_payload'));
}

function cleanPaymentError(error) {
  if (String(error?.message || '').toLowerCase().includes('row-level security')) {
    return 'Demande refusee par les regles de securite Supabase.';
  }

  return error?.message || 'Impossible de creer la demande de paiement.';
}
