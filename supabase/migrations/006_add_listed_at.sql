-- Add listed_at to track when a listing was posted on StreetEasy
alter table public.listing_matches add column if not exists listed_at timestamptz;

-- Add RLS read policy for scraper_runs so authenticated users can see their own runs
-- (via the monitor they own)
create policy "read own runs" on public.scraper_runs
  for select using (
    exists (
      select 1 from public.monitors
      where monitors.id = scraper_runs.monitor_id
        and monitors.user_id = auth.uid()
    )
  );
