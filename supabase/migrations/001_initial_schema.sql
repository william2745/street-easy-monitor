-- Profiles (auto-created on auth.users insert)
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  created_at    timestamptz default now()
);

-- Subscriptions (synced from Stripe webhooks)
create table public.subscriptions (
  id                    text primary key,
  user_id               uuid not null references public.profiles(id) on delete cascade,
  status                text not null,
  plan                  text not null default 'free',
  stripe_customer_id    text not null,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean default false,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Monitors
create table public.monitors (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  name                text not null,
  is_active           boolean default true,
  neighborhoods       text[] not null,
  bedrooms            int[],
  min_price           int,
  max_price           int not null,
  no_fee              boolean default false,
  pet_friendly        boolean default false,
  laundry_in_unit     boolean default false,
  laundry_in_building boolean default false,
  last_run_at         timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Deduplication: tracks listing IDs we've already alerted on per monitor
create table public.seen_listings (
  id            bigint generated always as identity primary key,
  monitor_id    uuid not null references public.monitors(id) on delete cascade,
  listing_id    text not null,
  first_seen_at timestamptz default now(),
  unique (monitor_id, listing_id)
);

-- Match history
create table public.listing_matches (
  id            uuid primary key default gen_random_uuid(),
  monitor_id    uuid not null references public.monitors(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  listing_id    text not null,
  title         text,
  address       text,
  neighborhood  text,
  bedrooms      int,
  price         int,
  no_fee        boolean,
  pet_friendly  boolean,
  has_laundry   boolean,
  image_url     text,
  listing_url   text not null,
  alert_sent    boolean default false,
  alert_sent_at timestamptz,
  found_at      timestamptz default now()
);

-- Scraper audit log
create table public.scraper_runs (
  id              uuid primary key default gen_random_uuid(),
  monitor_id      uuid not null references public.monitors(id) on delete cascade,
  apify_run_id    text,
  status          text,
  listings_found  int default 0,
  new_matches     int default 0,
  started_at      timestamptz default now(),
  finished_at     timestamptz
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
