alter table public.monitors
  add column if not exists scan_interval int not null default 1440,
  add column if not exists amenities text[] not null default '{}';
