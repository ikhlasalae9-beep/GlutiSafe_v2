create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text default 'user' check (role in ('user','admin')),
  pack_status text default 'free' check (pack_status in ('free','pending','active','expired','blocked')),
  pack_type text default 'none' check (pack_type in ('none','monthly','yearly','trial')),
  pack_start_at timestamptz,
  pack_end_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  alter column pack_status set default 'free',
  alter column pack_type set default 'none';

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  input_type text,
  ocr_text text,
  status text,
  label text,
  detected_words jsonb default '[]'::jsonb,
  possible_words jsonb default '[]'::jsonb,
  safe_claims jsonb default '[]'::jsonb,
  confidence text,
  explanation text,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  pack_name text,
  status text default 'pending' check (status in ('pending','active','expired','rejected')),
  start_date timestamptz,
  end_date timestamptz,
  activated_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text default 'manual' check (provider in ('paypal','cmi','manual')),
  provider_payment_id text,
  pack_type text check (pack_type in ('monthly','yearly')),
  amount numeric,
  currency text default 'MAD',
  method text,
  status text default 'pending' check (status in ('created','pending','captured','confirmed','failed','rejected')),
  proof_url text,
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payments
  add column if not exists provider text default 'manual',
  add column if not exists provider_payment_id text,
  add column if not exists pack_type text,
  add column if not exists currency text default 'MAD',
  add column if not exists raw_payload jsonb default '{}'::jsonb;

alter table public.payments drop constraint if exists payments_provider_check;
alter table public.payments add constraint payments_provider_check check (provider in ('paypal','cmi','manual'));
alter table public.payments drop constraint if exists payments_pack_type_check;
alter table public.payments add constraint payments_pack_type_check check (pack_type is null or pack_type in ('monthly','yearly'));
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check check (status in ('created','pending','captured','confirmed','failed','rejected'));

update public.profiles
set
  pack_status = coalesce(nullif(pack_status, ''), 'free'),
  pack_type = coalesce(nullif(pack_type, ''), 'none')
where pack_status is null
   or pack_status = ''
   or pack_type is null
   or pack_type = '';

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, pack_status, pack_type, pack_start_at, pack_end_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    'user',
    'free',
    'none',
    null,
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

drop policy if exists "Users can select their own profile" on public.profiles;
create policy "Users can select their own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "Admins can select all profiles" on public.profiles;
create policy "Admins can select all profiles"
on public.profiles for select
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Users can insert their own analyses" on public.analyses;
create policy "Users can insert their own analyses"
on public.analyses for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can select their own analyses" on public.analyses;
create policy "Users can select their own analyses"
on public.analyses for select
using (auth.uid() = user_id);

drop policy if exists "Users can delete their own analyses" on public.analyses;
create policy "Users can delete their own analyses"
on public.analyses for delete
using (auth.uid() = user_id);

drop policy if exists "Admins can select all analyses" on public.analyses;
create policy "Admins can select all analyses"
on public.analyses for select
using (public.is_admin(auth.uid()));

drop policy if exists "Users can select their own subscriptions" on public.subscriptions;
create policy "Users can select their own subscriptions"
on public.subscriptions for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert pending subscription requests" on public.subscriptions;
create policy "Users can insert pending subscription requests"
on public.subscriptions for insert
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Admins can select all subscriptions" on public.subscriptions;
create policy "Admins can select all subscriptions"
on public.subscriptions for select
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update all subscriptions" on public.subscriptions;
create policy "Admins can update all subscriptions"
on public.subscriptions for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Users can insert their own payments" on public.payments;
create policy "Users can insert their own payments"
on public.payments for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can select their own payments" on public.payments;
create policy "Users can select their own payments"
on public.payments for select
using (auth.uid() = user_id);

drop policy if exists "Admins can select all payments" on public.payments;
create policy "Admins can select all payments"
on public.payments for select
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update all payments" on public.payments;
create policy "Admins can update all payments"
on public.payments for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
