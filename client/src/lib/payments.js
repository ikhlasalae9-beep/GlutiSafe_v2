import { API_URL } from '../config/api.js';
import { getPackByType } from './packs.js';
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

  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Connectez-vous pour demander un pack.');
  }

  const response = await fetch(`${API_URL}/api/packs/manual-request`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pack_type: pack.packType }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Impossible de créer la demande de paiement.');
  }

  return payload;
}
