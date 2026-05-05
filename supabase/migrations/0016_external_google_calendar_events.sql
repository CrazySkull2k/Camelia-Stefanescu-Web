create table if not exists public.external_calendar_events (
  id uuid primary key default gen_random_uuid(),
  google_calendar_id text not null,
  google_event_id text not null,
  google_etag text,
  ical_uid text,
  status text not null default 'active',
  summary text not null,
  description text,
  location text,
  html_link text,
  event_type text,
  transparency text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'Europe/Bucharest',
  is_all_day boolean not null default false,
  last_seen_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint external_calendar_events_status_check
    check (status in ('active', 'cancelled'))
);

create unique index if not exists external_calendar_events_google_event_unique
  on public.external_calendar_events (google_calendar_id, google_event_id);

create index if not exists external_calendar_events_active_time_idx
  on public.external_calendar_events (start_at, end_at)
  where archived_at is null and status = 'active';

create table if not exists public.google_calendar_watch_state (
  id uuid primary key default gen_random_uuid(),
  calendar_id text not null unique,
  channel_id text,
  channel_token text,
  resource_id text,
  resource_uri text,
  expiration_at timestamptz,
  sync_token text,
  last_message_number bigint,
  last_notification_at timestamptz,
  last_full_sync_at timestamptz,
  last_incremental_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.external_calendar_events enable row level security;
alter table public.google_calendar_watch_state enable row level security;

drop policy if exists "Admins manage external calendar events" on public.external_calendar_events;
create policy "Admins manage external calendar events"
on public.external_calendar_events for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Admins manage google calendar watch state" on public.google_calendar_watch_state;
create policy "Admins manage google calendar watch state"
on public.google_calendar_watch_state for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));
