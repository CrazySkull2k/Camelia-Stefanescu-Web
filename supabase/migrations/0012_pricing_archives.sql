alter table public.service_categories
  add column if not exists archived_at timestamptz;

alter table public.pricing_sections
  add column if not exists archived_at timestamptz;

alter table public.service_offerings
  add column if not exists archived_at timestamptz;

create index if not exists service_categories_archive_sort_idx
  on public.service_categories (archived_at, sort_order);

create index if not exists pricing_sections_archive_category_sort_idx
  on public.pricing_sections (archived_at, category_id, sort_order);

create index if not exists service_offerings_archive_category_sort_idx
  on public.service_offerings (archived_at, category_id, sort_order);

create index if not exists service_offerings_archive_section_sort_idx
  on public.service_offerings (archived_at, pricing_section_id, sort_order)
  where pricing_section_id is not null;
