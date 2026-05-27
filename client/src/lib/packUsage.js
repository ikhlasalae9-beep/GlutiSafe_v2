import { getCurrentProfile } from './auth.js';
import { getPackLimit, getPackPeriodStart } from './packs.js';
import { requireSupabaseClient } from './supabaseClient.js';

export async function assertCanAnalyze() {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error('Connectez-vous pour lancer une analyse.');
  }

  const limit = getPackLimit(profile);
  if (limit.blocked) {
    throw new Error(limit.message);
  }

  const count = await countAnalysesSince(profile.id, getPackPeriodStart(profile));

  if (count >= limit.scans) {
    if (profile.packStatus === 'free') {
      throw new Error('Vous avez atteint la limite de 5 scans du Pack Gratuit ce mois-ci. Passez à un pack premium pour continuer.');
    }

    if (profile.packStatus === 'expired') {
      throw new Error('Votre pack est expiré. Passez à un pack premium pour continuer.');
    }

    throw new Error(`Vous avez atteint la limite de ${limit.scans} scans pour votre pack.`);
  }

  return { profile, used: count, remaining: limit.scans - count, limit };
}

export async function countAnalysesSince(userId, startIso) {
  const client = requireSupabaseClient();
  const { count, error } = await client
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startIso);

  if (error) throw new Error(error.message || 'Impossible de vérifier votre limite de scans.');
  return count || 0;
}
