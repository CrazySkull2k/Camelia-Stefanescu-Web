create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text not null unique,
  source_path text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_newsletter_subscribers_status_created
on public.newsletter_subscribers (status, created_at desc);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Admins manage newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins manage newsletter subscribers"
on public.newsletter_subscribers for all
using (public.has_any_role(array['owner','staff_admin','editor']))
with check (public.has_any_role(array['owner','staff_admin','editor']));
