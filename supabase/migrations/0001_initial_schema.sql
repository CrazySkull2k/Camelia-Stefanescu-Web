create extension if not exists pgcrypto;
create extension if not exists btree_gist;
create extension if not exists pg_trgm;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum ('owner', 'staff_admin', 'editor');
  end if;

  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
  end if;

  if not exists (select 1 from pg_type where typname = 'appointment_sync_status') then
    create type public.appointment_sync_status as enum ('pending', 'synced', 'needs_retry', 'failed');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.role_memberships (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.admin_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role)
);

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users (id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  slug text not null unique,
  title text not null,
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages (id) on delete cascade,
  section_key text not null,
  section_type text not null,
  sort_order integer not null default 1,
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (page_id, section_key)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_name text not null,
  storage_path text not null unique,
  kind text,
  alt_text text,
  owner_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 1,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_offerings (
  id text primary key,
  category_id text not null references public.service_categories (id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  notes text,
  price_amount numeric(10, 2) not null default 0,
  currency_code text not null default 'RON',
  duration_minutes integer,
  is_bookable boolean not null default true,
  is_visible boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blog_categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  category_id text references public.blog_categories (id) on delete set null,
  slug text not null unique,
  title text not null,
  excerpt text,
  content_json jsonb not null default '{}'::jsonb,
  content_html text,
  cover_image_path text,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  normalized_name text not null,
  email text,
  normalized_email text,
  phone text,
  normalized_phone text,
  birth_date date,
  sex text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.appointment_resources (
  id text primary key,
  name text not null,
  google_calendar_id text,
  timezone text not null default 'Europe/Bucharest',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  resource_id text not null references public.appointment_resources (id) on delete restrict,
  service_offering_id text references public.service_offerings (id) on delete set null,
  status public.appointment_status not null default 'pending',
  sync_status public.appointment_sync_status not null default 'pending',
  timezone text not null default 'Europe/Bucharest',
  source text not null default 'public_site',
  is_first_visit boolean not null default false,
  start_at timestamptz not null,
  end_at timestamptz not null,
  patient_notes text,
  admin_notes text,
  requested_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  google_calendar_id text,
  google_event_id text,
  last_synced_at timestamptz,
  sync_error text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (start_at < end_at)
);

create table if not exists public.appointment_status_history (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  old_status public.appointment_status,
  new_status public.appointment_status not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.appointment_sync_jobs (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  action text not null,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  payload_hash text,
  last_error text,
  scheduled_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.form_definitions (
  id text primary key,
  name text not null,
  description text,
  is_active boolean not null default true
);

create table if not exists public.form_versions (
  id text primary key,
  definition_id text not null references public.form_definitions (id) on delete cascade,
  schema_json jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  definition_id text not null references public.form_definitions (id) on delete restrict,
  version_id text not null references public.form_versions (id) on delete restrict,
  patient_id uuid not null references public.patients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  status text not null default 'submitted',
  payload_json jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.form_submissions (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  patient_id uuid references public.patients (id) on delete cascade,
  document_type text not null,
  storage_bucket text not null,
  storage_path text not null unique,
  checksum_sha256 text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  recipient_email text not null,
  related_entity_type text not null,
  related_entity_id text not null,
  provider_message_id text,
  provider_payload jsonb,
  status text not null,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rate_limit_events (
  id bigint generated always as identity primary key,
  endpoint_key text not null,
  hashed_identifier text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_site_sections_page_order on public.site_sections (page_id, sort_order);
create index if not exists idx_blog_posts_status_published on public.blog_posts (status, published_at desc);
create index if not exists idx_patients_email on public.patients (normalized_email);
create index if not exists idx_patients_phone on public.patients (normalized_phone);
create index if not exists idx_patients_name_trgm on public.patients using gin (normalized_name gin_trgm_ops);
create index if not exists idx_appointments_start_status on public.appointments (start_at, status);
create index if not exists idx_appointments_patient on public.appointments (patient_id);
create index if not exists idx_appointments_google_event on public.appointments (google_event_id);
create unique index if not exists idx_appointments_google_event_unique on public.appointments (google_event_id) where google_event_id is not null;
create index if not exists idx_sync_jobs_status_schedule on public.appointment_sync_jobs (status, scheduled_at);
create index if not exists idx_form_submissions_patient on public.form_submissions (patient_id, submitted_at desc);
create index if not exists idx_rate_limit_events_lookup on public.rate_limit_events (endpoint_key, created_at desc);

alter table public.appointments
  drop constraint if exists appointments_no_overlap;

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    resource_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
  where (status in ('pending', 'confirmed', 'completed'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.has_any_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.role_memberships
    where user_id = auth.uid()
      and role::text = any(required_roles)
  );
$$;

alter table public.profiles enable row level security;
alter table public.role_memberships enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.site_pages enable row level security;
alter table public.site_sections enable row level security;
alter table public.media_assets enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_offerings enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.patients enable row level security;
alter table public.appointment_resources enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_status_history enable row level security;
alter table public.appointment_sync_jobs enable row level security;
alter table public.form_definitions enable row level security;
alter table public.form_versions enable row level security;
alter table public.form_submissions enable row level security;
alter table public.generated_documents enable row level security;
alter table public.email_messages enable row level security;
alter table public.rate_limit_events enable row level security;

drop policy if exists "Public can read published pages" on public.site_pages;
create policy "Public can read published pages"
on public.site_pages for select
using (is_published = true);

drop policy if exists "Public can read published sections" on public.site_sections;
create policy "Public can read published sections"
on public.site_sections for select
using (is_published = true);

drop policy if exists "Public can read visible service categories" on public.service_categories;
create policy "Public can read visible service categories"
on public.service_categories for select
using (is_visible = true);

drop policy if exists "Public can read visible services" on public.service_offerings;
create policy "Public can read visible services"
on public.service_offerings for select
using (is_visible = true);

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
on public.blog_posts for select
using (status = 'published');

drop policy if exists "Public can read blog categories" on public.blog_categories;
create policy "Public can read blog categories"
on public.blog_categories for select
using (true);

drop policy if exists "Admins manage content tables" on public.site_pages;
create policy "Admins manage content tables"
on public.site_pages for all
using (public.has_any_role(array['owner','staff_admin','editor']))
with check (public.has_any_role(array['owner','staff_admin','editor']));

drop policy if exists "Admins manage sections" on public.site_sections;
create policy "Admins manage sections"
on public.site_sections for all
using (public.has_any_role(array['owner','staff_admin','editor']))
with check (public.has_any_role(array['owner','staff_admin','editor']));

drop policy if exists "Admins manage media assets" on public.media_assets;
create policy "Admins manage media assets"
on public.media_assets for all
using (public.has_any_role(array['owner','staff_admin','editor']))
with check (public.has_any_role(array['owner','staff_admin','editor']));

drop policy if exists "Editors manage services" on public.service_categories;
create policy "Editors manage services"
on public.service_categories for all
using (public.has_any_role(array['owner','staff_admin','editor']))
with check (public.has_any_role(array['owner','staff_admin','editor']));

drop policy if exists "Editors manage offerings" on public.service_offerings;
create policy "Editors manage offerings"
on public.service_offerings for all
using (public.has_any_role(array['owner','staff_admin','editor']))
with check (public.has_any_role(array['owner','staff_admin','editor']));

drop policy if exists "Editors manage blog categories" on public.blog_categories;
create policy "Editors manage blog categories"
on public.blog_categories for all
using (public.has_any_role(array['owner','staff_admin','editor']))
with check (public.has_any_role(array['owner','staff_admin','editor']));

drop policy if exists "Editors manage blog posts" on public.blog_posts;
create policy "Editors manage blog posts"
on public.blog_posts for all
using (public.has_any_role(array['owner','staff_admin','editor']))
with check (public.has_any_role(array['owner','staff_admin','editor']));

drop policy if exists "Admins manage patients" on public.patients;
create policy "Admins manage patients"
on public.patients for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Admins manage resources" on public.appointment_resources;
create policy "Admins manage resources"
on public.appointment_resources for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Admins manage appointments" on public.appointments;
create policy "Admins manage appointments"
on public.appointments for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Admins manage appointment history" on public.appointment_status_history;
create policy "Admins manage appointment history"
on public.appointment_status_history for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Admins manage appointment sync jobs" on public.appointment_sync_jobs;
create policy "Admins manage appointment sync jobs"
on public.appointment_sync_jobs for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Admins manage form definitions" on public.form_definitions;
create policy "Admins manage form definitions"
on public.form_definitions for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Admins manage form versions" on public.form_versions;
create policy "Admins manage form versions"
on public.form_versions for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Admins manage form submissions" on public.form_submissions;
create policy "Admins manage form submissions"
on public.form_submissions for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Admins manage generated docs" on public.generated_documents;
create policy "Admins manage generated docs"
on public.generated_documents for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Admins manage email messages" on public.email_messages;
create policy "Admins manage email messages"
on public.email_messages for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Admins manage rate limits" on public.rate_limit_events;
create policy "Admins manage rate limits"
on public.rate_limit_events for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

insert into storage.buckets (id, name, public)
values
  ('site-media', 'site-media', true),
  ('blog-covers', 'blog-covers', true),
  ('generated-pdfs', 'generated-pdfs', false)
on conflict (id) do nothing;

drop policy if exists "Public read site media" on storage.objects;
create policy "Public read site media"
on storage.objects for select
using (bucket_id in ('site-media', 'blog-covers'));

drop policy if exists "Admins manage public media" on storage.objects;
create policy "Admins manage public media"
on storage.objects for all
using (
  bucket_id in ('site-media', 'blog-covers')
  and public.has_any_role(array['owner','staff_admin','editor'])
)
with check (
  bucket_id in ('site-media', 'blog-covers')
  and public.has_any_role(array['owner','staff_admin','editor'])
);

drop policy if exists "Admins manage generated pdfs" on storage.objects;
create policy "Admins manage generated pdfs"
on storage.objects for all
using (
  bucket_id = 'generated-pdfs'
  and public.has_any_role(array['owner','staff_admin'])
)
with check (
  bucket_id = 'generated-pdfs'
  and public.has_any_role(array['owner','staff_admin'])
);
