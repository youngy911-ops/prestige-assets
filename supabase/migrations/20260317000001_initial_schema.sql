-- assets table
create table public.assets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  branch        text not null,
  asset_type    text not null,
  asset_subtype text not null,
  fields        jsonb not null default '{}',
  status        text not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Enable RLS immediately — no data written without policy
alter table public.assets enable row level security;

-- RLS policy: users can only access their own records
create policy "users_own_assets"
  on public.assets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger to keep updated_at current
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger assets_updated_at
  before update on public.assets
  for each row execute procedure public.handle_updated_at();

-- asset_photos table
create table public.asset_photos (
  id            uuid primary key default gen_random_uuid(),
  asset_id      uuid not null references public.assets(id) on delete cascade,
  storage_path  text not null,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.asset_photos enable row level security;

-- RLS via join to assets: user can only access photos belonging to their assets
create policy "users_own_asset_photos"
  on public.asset_photos
  for all
  using (
    exists (
      select 1 from public.assets
      where assets.id = asset_photos.asset_id
        and assets.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.assets
      where assets.id = asset_photos.asset_id
        and assets.user_id = auth.uid()
    )
  );
