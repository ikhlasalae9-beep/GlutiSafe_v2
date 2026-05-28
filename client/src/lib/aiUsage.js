import { requireSupabaseClient } from './supabaseClient.js';

export const FREE_AI_MESSAGES_LIMIT = 5;

export async function getMyAiMessageUsage(userId) {
  if (!userId) return { used: 0, limit: FREE_AI_MESSAGES_LIMIT };

  const { data, error } = await requireSupabaseClient()
    .from('ai_message_usage')
    .select('message_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { used: 0, limit: FREE_AI_MESSAGES_LIMIT };
  return { used: Number(data?.message_count || 0), limit: FREE_AI_MESSAGES_LIMIT };
}
