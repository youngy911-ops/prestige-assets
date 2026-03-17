-- Phase 2: private photos Storage bucket + Storage RLS + extraction_stale flag

-- Create private photos bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Storage RLS: users can upload only to their own prefix ({userId}/{assetId}/{filename})
create policy "users_upload_own_photos"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: users can read only their own photos
create policy "users_read_own_photos"
  on storage.objects for select
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: users can delete only their own photos
create policy "users_delete_own_photos"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add extraction_stale flag to assets table
alter table public.assets
  add column if not exists extraction_stale boolean not null default false;
