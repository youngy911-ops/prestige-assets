-- Phase 3: AI extraction result and inspection notes columns
alter table public.assets
  add column if not exists extraction_result jsonb,
  add column if not exists inspection_notes  text;
