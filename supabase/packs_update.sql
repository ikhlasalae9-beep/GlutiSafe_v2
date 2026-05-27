alter table public.profiles
  add column if not exists pack_status text default 'free',
  add column if not exists pack_type text default 'none',
  add column if not exists pack_start_at timestamptz,
  add column if not exists pack_end_at timestamptz;

update public.profiles
set
  pack_status = coalesce(nullif(pack_status, ''), 'free'),
  pack_type = coalesce(nullif(pack_type, ''), 'none')
where pack_status is null
   or pack_status = ''
   or pack_type is null
   or pack_type = '';

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
