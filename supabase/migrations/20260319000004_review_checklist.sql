-- Phase 4: Checklist state for missing-information tracking
alter table public.assets
  add column if not exists checklist_state jsonb not null default '{}';
