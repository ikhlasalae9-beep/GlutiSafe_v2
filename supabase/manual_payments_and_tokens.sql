create extension if not exists pgcrypto;

create table if not exists public.payment_settings (
  id boolean primary key default true,
  rib_holder text default '',
  bank_name text default '',
  rib_number text default '',
  cashplus_full_name text default '',
  cashplus_phone text default '',
  cashplus_city text default '',
  payment_note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint payment_settings_singleton check (id)
);

create table if not exists public.pack_settings (
  id boolean primary key default true,
  free_tokens integer not null default 5,
  free_reset_hours integer not null default 24 check (free_reset_hours in (5, 24, 168)),
  monthly_tokens integer not null default 100,
  yearly_tokens integer not null default 1500,
  monthly_price_mad numeric not null default 29,
  yearly_price_mad numeric not null default 249,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint pack_settings_singleton check (id)
);

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_type text not null default 'none' check (pack_type in ('none', 'monthly', 'yearly')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  tokens_used integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, pack_type, period_start)
);

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_type text not null check (pack_type in ('monthly', 'yearly')),
  payment_method text not null check (payment_method in ('rib', 'cashplus')),
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  user_note text,
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.payment_settings (id) values (true)
on conflict (id) do nothing;

insert into public.pack_settings (id, free_tokens, free_reset_hours, monthly_tokens, yearly_tokens, monthly_price_mad, yearly_price_mad)
values (true, 5, 24, 100, 1500, 29, 249)
on conflict (id) do nothing;

alter table public.profiles
  alter column pack_status set default 'free',
  alter column pack_type set default 'none';

update public.profiles
set
  pack_status = coalesce(nullif(pack_status, ''), 'free'),
  pack_type = coalesce(nullif(pack_type, ''), 'none')
where pack_status is null
   or pack_status = ''
   or pack_type is null
   or pack_type = '';

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_payment_settings_updated_at on public.payment_settings;
create trigger set_payment_settings_updated_at before update on public.payment_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_pack_settings_updated_at on public.pack_settings;
create trigger set_pack_settings_updated_at before update on public.pack_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_usage_counters_updated_at on public.usage_counters;
create trigger set_usage_counters_updated_at before update on public.usage_counters
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_requests_updated_at on public.payment_requests;
create trigger set_payment_requests_updated_at before update on public.payment_requests
for each row execute function public.set_updated_at();

create or replace function public.request_manual_pack(
  requested_pack_type text,
  requested_payment_method text,
  requested_user_note text default ''
)
returns public.payment_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.payment_requests;
  request_amount numeric;
begin
  if auth.uid() is null then
    raise exception 'Session introuvable.';
  end if;

  if requested_pack_type not in ('monthly', 'yearly') then
    raise exception 'Pack invalide.';
  end if;

  if requested_payment_method not in ('rib', 'cashplus') then
    raise exception 'Methode de paiement invalide.';
  end if;

  update public.payment_requests
  set status = 'rejected', rejected_at = now()
  where user_id = auth.uid()
    and status = 'pending';

  select case
    when requested_pack_type = 'yearly' then yearly_price_mad
    else monthly_price_mad
  end
  into request_amount
  from public.pack_settings
  where id = true;

  insert into public.payment_requests (user_id, pack_type, payment_method, amount, status, user_note)
  values (auth.uid(), requested_pack_type, requested_payment_method, request_amount, 'pending', nullif(requested_user_note, ''))
  returning * into request_row;

  update public.profiles
  set pack_status = 'pending',
      pack_type = requested_pack_type,
      pack_start_at = null,
      pack_end_at = null
  where id = auth.uid();

  return request_row;
end;
$$;

create or replace function public.confirm_payment_request(request_id uuid)
returns public.payment_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.payment_requests;
  start_at timestamptz := now();
  end_at timestamptz;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Acces refuse.';
  end if;

  select * into request_row
  from public.payment_requests
  where id = request_id
  for update;

  if request_row.id is null then
    raise exception 'Demande introuvable.';
  end if;

  end_at := start_at + case when request_row.pack_type = 'yearly' then interval '365 days' else interval '30 days' end;

  update public.payment_requests
  set status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = start_at
  where id = request_id
  returning * into request_row;

  update public.profiles
  set pack_status = 'active',
      pack_type = request_row.pack_type,
      pack_start_at = start_at,
      pack_end_at = end_at
  where id = request_row.user_id;

  insert into public.subscriptions (user_id, status, pack_name, start_date, end_date, activated_by)
  values (request_row.user_id, 'active', request_row.pack_type, start_at, end_at, auth.uid());

  return request_row;
end;
$$;

create or replace function public.reject_payment_request(request_id uuid)
returns public.payment_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.payment_requests;
  has_active boolean;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Acces refuse.';
  end if;

  update public.payment_requests
  set status = 'rejected', rejected_at = now()
  where id = request_id
  returning * into request_row;

  if request_row.id is null then
    raise exception 'Demande introuvable.';
  end if;

  select exists (
    select 1 from public.profiles
    where id = request_row.user_id
      and pack_status = 'active'
      and pack_end_at > now()
  ) into has_active;

  if not has_active then
    update public.profiles
    set pack_status = 'free',
        pack_type = 'none',
        pack_start_at = null,
        pack_end_at = null
    where id = request_row.user_id;
  end if;

  return request_row;
end;
$$;

create or replace function public.current_usage_period(
  profile_row public.profiles,
  settings_row public.pack_settings
)
returns table (pack_type text, period_start timestamptz, period_end timestamptz, token_limit integer, premium boolean)
language plpgsql
stable
as $$
declare
  now_value timestamptz := now();
  reset_hours integer := coalesce(settings_row.free_reset_hours, 24);
  epoch_start timestamptz := '2024-01-01 00:00:00+00';
  bucket_count numeric;
begin
  if profile_row.pack_status = 'active'
     and profile_row.pack_type in ('monthly', 'yearly')
     and profile_row.pack_end_at > now_value then
    pack_type := profile_row.pack_type;
    period_start := coalesce(profile_row.pack_start_at, now_value);
    period_end := profile_row.pack_end_at;
    token_limit := case when profile_row.pack_type = 'yearly' then settings_row.yearly_tokens else settings_row.monthly_tokens end;
    premium := true;
    return next;
    return;
  end if;

  bucket_count := floor(extract(epoch from (now_value - epoch_start)) / (reset_hours * 3600));
  pack_type := 'none';
  period_start := epoch_start + make_interval(hours => (bucket_count::int * reset_hours));
  period_end := period_start + make_interval(hours => reset_hours);
  token_limit := settings_row.free_tokens;
  premium := false;
  return next;
end;
$$;

create or replace function public.get_token_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  settings_row public.pack_settings;
  period_row record;
  counter_row public.usage_counters;
  used_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Session introuvable.';
  end if;

  select * into profile_row from public.profiles where id = auth.uid();
  select * into settings_row from public.pack_settings where id = true;

  if profile_row.pack_status = 'blocked' then
    return jsonb_build_object(
      'allowed', false,
      'message', 'Votre compte est bloque. Contactez l''administration.',
      'tokens_used', 0,
      'token_limit', 0,
      'tokens_remaining', 0,
      'pack_status', 'blocked',
      'pack_type', coalesce(profile_row.pack_type, 'none')
    );
  end if;

  select * into period_row from public.current_usage_period(profile_row, settings_row);

  insert into public.usage_counters (user_id, pack_type, period_start, period_end, tokens_used)
  values (auth.uid(), period_row.pack_type, period_row.period_start, period_row.period_end, 0)
  on conflict (user_id, pack_type, period_start) do update
    set period_end = excluded.period_end
  returning * into counter_row;

  used_count := coalesce(counter_row.tokens_used, 0);

  return jsonb_build_object(
    'allowed', used_count < period_row.token_limit,
    'message', case
      when used_count >= period_row.token_limit and period_row.premium = false then 'Vous avez utilise tous vos tokens gratuits. Reessayez apres la reinitialisation ou passez a un pack premium.'
      when used_count >= period_row.token_limit then 'Vous avez atteint la limite de tokens de votre pack.'
      else ''
    end,
    'tokens_used', used_count,
    'token_limit', period_row.token_limit,
    'tokens_remaining', greatest(period_row.token_limit - used_count, 0),
    'period_start', period_row.period_start,
    'period_end', period_row.period_end,
    'pack_status', case when period_row.premium then 'active' else coalesce(profile_row.pack_status, 'free') end,
    'pack_type', period_row.pack_type,
    'premium', period_row.premium
  );
end;
$$;

create or replace function public.consume_scan_token()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  snapshot jsonb;
  counter_id uuid;
begin
  snapshot := public.get_token_snapshot();

  if coalesce((snapshot ->> 'allowed')::boolean, false) = false then
    raise exception '%', snapshot ->> 'message';
  end if;

  select id into counter_id
  from public.usage_counters
  where user_id = auth.uid()
    and pack_type = snapshot ->> 'pack_type'
    and period_start = (snapshot ->> 'period_start')::timestamptz
  limit 1;

  update public.usage_counters
  set tokens_used = tokens_used + 1
  where id = counter_id;

  return public.get_token_snapshot();
end;
$$;

alter table public.payment_settings enable row level security;
alter table public.pack_settings enable row level security;
alter table public.usage_counters enable row level security;
alter table public.payment_requests enable row level security;

drop policy if exists "Everyone can read payment settings" on public.payment_settings;
create policy "Everyone can read payment settings"
on public.payment_settings for select
to authenticated
using (true);

drop policy if exists "Admins can update payment settings" on public.payment_settings;
create policy "Admins can update payment settings"
on public.payment_settings for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Everyone can read pack settings" on public.pack_settings;
create policy "Everyone can read pack settings"
on public.pack_settings for select
to authenticated
using (true);

drop policy if exists "Admins can update pack settings" on public.pack_settings;
create policy "Admins can update pack settings"
on public.pack_settings for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Users can read own usage counters" on public.usage_counters;
create policy "Users can read own usage counters"
on public.usage_counters for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can read own payment requests" on public.payment_requests;
create policy "Users can read own payment requests"
on public.payment_requests for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can create own payment requests" on public.payment_requests;
create policy "Users can create own payment requests"
on public.payment_requests for insert
to authenticated
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Admins can update payment requests" on public.payment_requests;
create policy "Admins can update payment requests"
on public.payment_requests for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant select on public.payment_settings, public.pack_settings to authenticated;
grant select on public.usage_counters, public.payment_requests to authenticated;
grant insert on public.payment_requests to authenticated;
grant all on public.payment_settings, public.pack_settings, public.payment_requests, public.usage_counters to authenticated;
grant execute on function public.request_manual_pack(text, text, text) to authenticated;
grant execute on function public.confirm_payment_request(uuid) to authenticated;
grant execute on function public.reject_payment_request(uuid) to authenticated;
grant execute on function public.get_token_snapshot() to authenticated;
grant execute on function public.consume_scan_token() to authenticated;
