alter table public.site_sections
add column if not exists draft_content jsonb,
add column if not exists draft_updated_at timestamptz,
add column if not exists published_at timestamptz;

update public.site_sections
set published_at = coalesce(published_at, updated_at, created_at)
where is_published = true
  and published_at is null;

create index if not exists idx_site_sections_draft_updated
on public.site_sections (draft_updated_at desc)
where draft_content is not null;
