create table if not exists public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blog_post_tags (
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  tag_id uuid not null references public.blog_tags (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, tag_id)
);

create index if not exists idx_blog_post_tags_tag_id
on public.blog_post_tags (tag_id);

alter table public.blog_tags enable row level security;
alter table public.blog_post_tags enable row level security;

drop policy if exists "Public can read blog tags" on public.blog_tags;
create policy "Public can read blog tags"
on public.blog_tags for select
using (true);

drop policy if exists "Public can read blog post tags" on public.blog_post_tags;
create policy "Public can read blog post tags"
on public.blog_post_tags for select
using (true);

drop policy if exists "Editors manage blog tags" on public.blog_tags;
create policy "Editors manage blog tags"
on public.blog_tags for all
using (public.has_any_role(array['owner','staff_admin','editor']))
with check (public.has_any_role(array['owner','staff_admin','editor']));

drop policy if exists "Editors manage blog post tags" on public.blog_post_tags;
create policy "Editors manage blog post tags"
on public.blog_post_tags for all
using (public.has_any_role(array['owner','staff_admin','editor']))
with check (public.has_any_role(array['owner','staff_admin','editor']));

insert into public.blog_categories (id, slug, name, sort_order)
values
  ('nutritie', 'nutritie', 'Nutritie', 1),
  ('diagnoza-celulara', 'diagnoza-celulara', 'Diagnoza celulara', 2),
  ('wellness', 'wellness', 'Wellness', 3)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());
