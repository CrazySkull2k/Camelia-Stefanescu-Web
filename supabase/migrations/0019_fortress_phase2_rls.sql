alter table public.profiles force row level security;
alter table public.patients force row level security;
alter table public.appointments force row level security;
alter table public.form_submissions force row level security;
alter table public.generated_documents force row level security;
alter table public.patient_form_statuses force row level security;
alter table public.patient_analysis_uploads force row level security;

drop policy if exists "Users view own profile" on public.profiles;
create policy "Users view own profile"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Patients view own record" on public.patients;
create policy "Patients view own record"
on public.patients
for select
to authenticated
using (auth_user_id = (select auth.uid()));

drop policy if exists "Patients update own record" on public.patients;
create policy "Patients update own record"
on public.patients
for update
to authenticated
using (auth_user_id = (select auth.uid()))
with check (auth_user_id = (select auth.uid()));

drop policy if exists "Patients view own appointments" on public.appointments;
create policy "Patients view own appointments"
on public.appointments
for select
to authenticated
using (
  exists (
    select 1
    from public.patients
    where patients.id = appointments.patient_id
      and patients.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Patients view own form submissions" on public.form_submissions;
create policy "Patients view own form submissions"
on public.form_submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.patients
    where patients.id = form_submissions.patient_id
      and patients.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Patients view own generated documents" on public.generated_documents;
create policy "Patients view own generated documents"
on public.generated_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.patients
    where patients.id = generated_documents.patient_id
      and patients.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Patients view own form statuses" on public.patient_form_statuses;
create policy "Patients view own form statuses"
on public.patient_form_statuses
for select
to authenticated
using (
  exists (
    select 1
    from public.patients
    where patients.id = patient_form_statuses.patient_id
      and patients.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Patients view own analysis uploads" on public.patient_analysis_uploads;
create policy "Patients view own analysis uploads"
on public.patient_analysis_uploads
for select
to authenticated
using (
  exists (
    select 1
    from public.patients
    where patients.id = patient_analysis_uploads.patient_id
      and patients.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Patients view own analysis files" on storage.objects;
create policy "Patients view own analysis files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'patient-analyses'
  and exists (
    select 1
    from public.patients
    where patients.auth_user_id = (select auth.uid())
      and storage.objects.name like ('patients/' || patients.id::text || '/%')
  )
);
