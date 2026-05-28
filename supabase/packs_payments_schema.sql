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

alter table public.payments
  add column if not exists provider text default 'manual',
  add column if not exists provider_payment_id text,
  add column if not exists pack_type text,
  add column if not exists currency text default 'MAD',
  add column if not exists raw_payload jsonb default '{}'::jsonb;

alter table public.payments drop constraint if exists payments_provider_check;
alter table public.payments add constraint payments_provider_check check (provider in ('manual'));

alter table public.payments drop constraint if exists payments_pack_type_check;
alter table public.payments add constraint payments_pack_type_check check (pack_type is null or pack_type in ('monthly','yearly'));

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check check (status in ('created','pending','captured','confirmed','failed','rejected'));

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
