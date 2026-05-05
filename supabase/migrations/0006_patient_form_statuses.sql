create table if not exists public.patient_form_statuses (
  patient_id uuid not null references public.patients (id) on delete cascade,
  definition_id text not null references public.form_definitions (id) on delete cascade,
  completed_version_id text references public.form_versions (id) on delete set null,
  latest_submission_id uuid references public.form_submissions (id) on delete set null,
  latest_document_id uuid references public.generated_documents (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (patient_id, definition_id)
);

create index if not exists idx_patient_form_statuses_definition
  on public.patient_form_statuses (definition_id, completed_version_id);

create index if not exists idx_patient_form_statuses_latest_document
  on public.patient_form_statuses (latest_document_id);

alter table public.patient_form_statuses enable row level security;

drop policy if exists "Admins manage patient form statuses" on public.patient_form_statuses;
create policy "Admins manage patient form statuses"
on public.patient_form_statuses for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

drop policy if exists "Patients view own form statuses" on public.patient_form_statuses;
create policy "Patients view own form statuses"
on public.patient_form_statuses for select
using (
  exists (
    select 1
    from public.patients
    where patients.id = patient_form_statuses.patient_id
      and patients.auth_user_id = auth.uid()
  )
);

with latest_submissions as (
  select distinct on (form_submissions.patient_id, form_submissions.definition_id)
    form_submissions.patient_id,
    form_submissions.definition_id,
    form_submissions.version_id,
    form_submissions.id as submission_id,
    generated_documents.id as document_id,
    form_submissions.submitted_at
  from public.form_submissions
  left join public.generated_documents
    on generated_documents.submission_id = form_submissions.id
  where form_submissions.status = 'submitted'
  order by
    form_submissions.patient_id,
    form_submissions.definition_id,
    form_submissions.submitted_at desc,
    form_submissions.id desc
)
insert into public.patient_form_statuses (
  patient_id,
  definition_id,
  completed_version_id,
  latest_submission_id,
  latest_document_id,
  completed_at
)
select
  latest_submissions.patient_id,
  latest_submissions.definition_id,
  latest_submissions.version_id,
  latest_submissions.submission_id,
  latest_submissions.document_id,
  latest_submissions.submitted_at
from latest_submissions
on conflict (patient_id, definition_id) do update
set
  completed_version_id = excluded.completed_version_id,
  latest_submission_id = excluded.latest_submission_id,
  latest_document_id = excluded.latest_document_id,
  completed_at = excluded.completed_at,
  updated_at = timezone('utc', now());

update public.appointments
set
  intake_status = 'not_required'::public.intake_status,
  updated_at = timezone('utc', now())
from public.patient_form_statuses
join public.form_versions
  on form_versions.id = patient_form_statuses.completed_version_id
where appointments.patient_id = patient_form_statuses.patient_id
  and patient_form_statuses.definition_id = 'nutrition-intake'
  and form_versions.definition_id = 'nutrition-intake'
  and form_versions.is_published = true
  and appointments.intake_status = 'required_pending'::public.intake_status
  and appointments.status in ('pending', 'confirmed')
  and appointments.start_at > timezone('utc', now());
