create table if not exists public.login_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  status text default 'pending' check (status in ('pending','verified','expired')),
  attempts int default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz default now()
);

alter table public.login_verifications enable row level security;

drop policy if exists "users read own login verifications" on public.login_verifications;
create policy "users read own login verifications"
on public.login_verifications
for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "users insert own login verifications" on public.login_verifications;
create policy "users insert own login verifications"
on public.login_verifications
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users update own login verifications" on public.login_verifications;
create policy "users update own login verifications"
on public.login_verifications
for update
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

create table if not exists public.trusted_login_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_token_hash text not null,
  device_label text,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  last_used_at timestamptz
);

alter table public.trusted_login_devices enable row level security;

drop policy if exists "users manage own trusted devices" on public.trusted_login_devices;
create policy "users manage own trusted devices"
on public.trusted_login_devices
for all
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

notify pgrst, 'reload schema';
