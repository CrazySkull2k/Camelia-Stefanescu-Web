alter table public.calendar_blocks
  add column if not exists google_calendar_id text,
  add column if not exists google_event_id text,
  add column if not exists sync_status text not null default 'pending',
  add column if not exists sync_error text,
  add column if not exists last_synced_at timestamptz;

alter table public.calendar_blocks
  drop constraint if exists calendar_blocks_sync_status_check;

alter table public.calendar_blocks
  add constraint calendar_blocks_sync_status_check
  check (sync_status in ('pending', 'synced', 'needs_retry', 'failed'));

create index if not exists calendar_blocks_google_event_idx
  on public.calendar_blocks (google_event_id)
  where google_event_id is not null;
