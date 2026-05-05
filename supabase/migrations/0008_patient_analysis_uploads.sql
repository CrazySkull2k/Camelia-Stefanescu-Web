create table if not exists public.patient_analysis_uploads (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  uploaded_by uuid references auth.users (id) on delete set null,
  category_key text not null,
  category_label text not null,
  original_filename text not null,
  content_type text,
  file_size bigint not null default 0,
  storage_bucket text not null default 'patient-analyses',
  storage_path text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_patient_analysis_uploads_patient_category
  on public.patient_analysis_uploads (patient_id, category_key, created_at desc);

alter table public.patient_analysis_uploads enable row level security;

drop policy if exists "Admins manage patient analysis uploads" on public.patient_analysis_uploads;
create policy "Admins manage patient analysis uploads"
on public.patient_analysis_uploads for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Patients view own analysis uploads" on public.patient_analysis_uploads;
create policy "Patients view own analysis uploads"
on public.patient_analysis_uploads for select
using (
  exists (
    select 1
    from public.patients
    where patients.id = patient_analysis_uploads.patient_id
      and patients.auth_user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('patient-analyses', 'patient-analyses', false)
on conflict (id) do update
set public = false;

drop policy if exists "Admins manage patient analysis files" on storage.objects;
create policy "Admins manage patient analysis files"
on storage.objects for all
using (
  bucket_id = 'patient-analyses'
  and public.has_any_role(array['owner','staff_admin'])
)
with check (
  bucket_id = 'patient-analyses'
  and public.has_any_role(array['owner','staff_admin'])
);

drop policy if exists "Patients view own analysis files" on storage.objects;
create policy "Patients view own analysis files"
on storage.objects for select
using (
  bucket_id = 'patient-analyses'
  and exists (
    select 1
    from public.patients
    where patients.auth_user_id = auth.uid()
      and storage.objects.name like ('patients/' || patients.id::text || '/%')
  )
);
