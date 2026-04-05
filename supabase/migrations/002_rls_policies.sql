alter table public.profiles        enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.monitors        enable row level security;
alter table public.seen_listings   enable row level security;
alter table public.listing_matches enable row level security;
alter table public.scraper_runs    enable row level security;

-- Profiles
create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

-- Subscriptions
create policy "own subscription" on public.subscriptions
  for all using (auth.uid() = user_id);

-- Monitors
create policy "own monitors" on public.monitors
  for all using (auth.uid() = user_id);

-- Matches
create policy "own matches" on public.listing_matches
  for all using (auth.uid() = user_id);

-- These tables are service_role only (written by API routes with service key)
-- RLS is enabled but no authenticated user policies → service_role bypasses RLS
