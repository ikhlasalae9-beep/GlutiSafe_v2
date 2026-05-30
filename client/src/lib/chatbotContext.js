import { getCurrentProfile, getCurrentUser } from './auth.js';
import { requireSupabaseClient } from './supabaseClient.js';
import { CHATBOT_CONTEXT_KEY } from './userScopedState.js';

export async function getCurrentUserChatbotContext() {
  const user = await getCurrentUser();
  if (!user?.id) return {};

  const profile = await getCurrentProfile().catch(() => null);
  const storedContext = readStoredScanContext(user.id);
  if (storedContext) {
    return withUserProfileContext(storedContext, user, profile);
  }

  const latestScan = await loadLatestScanForUser(user.id);
  if (!latestScan) {
    return withUserProfileContext({ user_id: user.id }, user, profile);
  }

  return withUserProfileContext(
    {
      user_id: user.id,
      productName: latestScan.product_name || 'Produit sans nom',
      ingredients: latestScan.ocr_text || '',
      detectedText: latestScan.ocr_text || '',
      verdict: latestScan.status || latestScan.label || '',
      detectedRiskyIngredients: latestScan.detected_words || [],
      warnings: latestScan.possible_words || [],
      lastScanResult: {
        user_id: latestScan.user_id,
        productName: latestScan.product_name || 'Produit sans nom',
        status: latestScan.status || '',
        label: latestScan.label || '',
        text: latestScan.ocr_text || '',
        detectedWords: latestScan.detected_words || [],
        possibleWords: latestScan.possible_words || [],
      },
    },
    user,
    profile,
  );
}

function readStoredScanContext(userId) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(CHATBOT_CONTEXT_KEY) || 'null');
    if (!stored || stored.user_id !== userId) {
      sessionStorage.removeItem(CHATBOT_CONTEXT_KEY);
      return null;
    }

    if (stored.lastScanResult?.user_id && stored.lastScanResult.user_id !== userId) {
      sessionStorage.removeItem(CHATBOT_CONTEXT_KEY);
      return null;
    }

    return stored;
  } catch {
    sessionStorage.removeItem(CHATBOT_CONTEXT_KEY);
    return null;
  }
}

async function loadLatestScanForUser(userId) {
  const { data, error } = await requireSupabaseClient()
    .from('analyses')
    .select('id, user_id, ocr_text, status, label, detected_words, possible_words, product_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data || null;
}

function withUserProfileContext(context, user, profile) {
  return {
    ...context,
    user_id: user.id,
    userPack: profile?.packType || 'none',
    packStatus: profile?.packStatus || 'free',
  };
}
