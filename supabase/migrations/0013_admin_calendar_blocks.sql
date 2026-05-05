create table if not exists public.calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  block_type text not null default 'unavailable',
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'Europe/Bucharest',
  color text not null default 'peach',
  blocks_availability boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  constraint calendar_blocks_valid_range check (end_at > start_at),
  constraint calendar_blocks_type_check check (
    block_type in ('unavailable', 'clinic_work', 'admin', 'personal')
  ),
  constraint calendar_blocks_color_check check (
    color in ('peach', 'sage', 'stone', 'cream')
  )
);

create index if not exists calendar_blocks_range_idx
  on public.calendar_blocks (archived_at, start_at, end_at);

create index if not exists calendar_blocks_availability_range_idx
  on public.calendar_blocks (blocks_availability, archived_at, start_at, end_at);

alter table public.calendar_blocks enable row level security;

drop policy if exists "Admins manage calendar blocks" on public.calendar_blocks;
create policy "Admins manage calendar blocks"
  on public.calendar_blocks for all
  using (public.has_any_role(array['owner','staff_admin']))
  with check (public.has_any_role(array['owner','staff_admin']));
