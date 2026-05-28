create extension if not exists pgcrypto;

create table if not exists public.ai_message_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  message_count int default 0,
  period_start timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ai_message_usage_user_id_idx
on public.ai_message_usage (user_id);

alter table public.ai_message_usage enable row level security;

drop policy if exists "Users can read own ai message usage" on public.ai_message_usage;
create policy "Users can read own ai message usage"
on public.ai_message_usage for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Admins can read all ai message usage" on public.ai_message_usage;
create policy "Admins can read all ai message usage"
on public.ai_message_usage for select
to authenticated
using (public.is_admin(auth.uid()));

grant select on public.ai_message_usage to authenticated;
