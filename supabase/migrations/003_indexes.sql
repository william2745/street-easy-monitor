create index on public.monitors (user_id, is_active);
create index on public.seen_listings (monitor_id, listing_id);
create index on public.listing_matches (monitor_id, found_at desc);
create index on public.subscriptions (user_id, status);
