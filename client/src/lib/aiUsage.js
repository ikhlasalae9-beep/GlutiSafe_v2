import { requireSupabaseClient } from './supabaseClient.js';

export const FREE_AI_MESSAGES_LIMIT = 5;

export async function getMyAiMessageUsage(userId) {
  const client = requireSupabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  const user = authData?.user;

  if (authError || !user?.id || (userId && userId !== user.id)) return { used: 0, limit: FREE_AI_MESSAGES_LIMIT };

  const { data, error } = await client
    .from('ai_message_usage')
    .select('message_count')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { used: 0, limit: FREE_AI_MESSAGES_LIMIT };
  return { used: Number(data?.message_count || 0), limit: FREE_AI_MESSAGES_LIMIT };
}
