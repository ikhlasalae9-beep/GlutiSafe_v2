create table if not exists public.pack_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_request_id uuid references public.payment_requests(id) on delete set null,
  pack_type text not null check (pack_type in ('monthly', 'yearly')),
  amount numeric,
  currency text default 'MAD',
  receipt_number text unique,
  customer_name text,
  customer_email text,
  payment_method text,
  pack_start_at timestamptz,
  pack_end_at timestamptz,
  pdf_path text,
  email_sent boolean default false,
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz default now()
);

alter table public.pack_receipts
  add column if not exists email_error text;

alter table public.pack_receipts enable row level security;

drop policy if exists "Users can read own pack receipts" on public.pack_receipts;
create policy "Users can read own pack receipts"
on public.pack_receipts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read all pack receipts" on public.pack_receipts;
create policy "Admins can read all pack receipts"
on public.pack_receipts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can insert pack receipts" on public.pack_receipts;
create policy "Admins can insert pack receipts"
on public.pack_receipts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update pack receipts" on public.pack_receipts;
create policy "Admins can update pack receipts"
on public.pack_receipts
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

insert into storage.buckets (id, name, public)
values ('pack-receipts', 'pack-receipts', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read own receipt PDFs" on storage.objects;
create policy "Users can read own receipt PDFs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pack-receipts'
  and name like ('receipts/' || auth.uid()::text || '/%')
);

drop policy if exists "Admins can read all receipt PDFs" on storage.objects;
create policy "Admins can read all receipt PDFs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pack-receipts'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can manage receipt PDFs" on storage.objects;
create policy "Admins can manage receipt PDFs"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'pack-receipts'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'pack-receipts'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
