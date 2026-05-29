import { getCurrentProfile } from './auth.js';
import { canRunAnalysis, getPackSettings, getUsageInfo } from './packAccess.js';

export async function assertCanAnalyze() {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error('Connectez-vous pour lancer une analyse.');
  }

  const usage = await canRunAnalysis(profile.id);
  if (!usage.allowed) {
    const error = new Error(usage.message || 'Vous avez utilise tous vos tokens. Reessayez apres la reinitialisation ou passez a un pack premium.');
    error.usage = usage;
    throw error;
  }

  return usage;
}

export async function getTokenSnapshot(profileOverride) {
  const profile = profileOverride || (await getCurrentProfile());
  if (!profile) return null;
  const settings = await getPackSettings();
  return getUsageInfo(profile.id, profile, settings);
}

export function formatTokenReset(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
