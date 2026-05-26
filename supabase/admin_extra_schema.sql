alter table public.analyses
add column if not exists product_name text,
add column if not exists image_path text;

insert into storage.buckets (id, name, public)
values ('analysis-images', 'analysis-images', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can upload their own analysis images" on storage.objects;
create policy "Users can upload their own analysis images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'analysis-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can read their own analysis images" on storage.objects;
create policy "Users can read their own analysis images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'analysis-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own analysis images" on storage.objects;
create policy "Users can delete their own analysis images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'analysis-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
