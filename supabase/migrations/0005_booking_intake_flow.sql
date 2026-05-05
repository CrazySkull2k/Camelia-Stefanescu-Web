do $$
begin
  if not exists (select 1 from pg_type where typname = 'intake_status') then
    create type public.intake_status as enum ('not_required', 'required_pending', 'submitted');
  end if;
end $$;

create table if not exists public.clinic_settings (
  singleton boolean primary key default true,
  require_manual_appointment_confirmation boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (singleton = true)
);

insert into public.clinic_settings (singleton, require_manual_appointment_confirmation)
values (true, false)
on conflict (singleton) do nothing;

alter table public.clinic_settings enable row level security;

drop policy if exists "Admins manage clinic settings" on public.clinic_settings;
create policy "Admins manage clinic settings"
on public.clinic_settings for all
using (public.has_any_role(array['owner','staff_admin']))
with check (public.has_any_role(array['owner','staff_admin']));

alter table public.appointments
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_email_normalized text,
  add column if not exists contact_phone text,
  add column if not exists public_reference_code_hash text,
  add column if not exists public_reference_code_hint text,
  add column if not exists public_reference_sent_at timestamptz,
  add column if not exists intake_status public.intake_status not null default 'not_required',
  add column if not exists intake_submitted_at timestamptz,
  add column if not exists intake_submission_id uuid references public.form_submissions (id) on delete set null,
  add column if not exists intake_document_id uuid references public.generated_documents (id) on delete set null;

update public.appointments
set
  contact_name = coalesce(contact_name, patients.full_name),
  contact_email = coalesce(contact_email, patients.email),
  contact_email_normalized = coalesce(contact_email_normalized, patients.normalized_email),
  contact_phone = coalesce(contact_phone, patients.phone),
  intake_status = case
    when is_first_visit then 'required_pending'::public.intake_status
    else 'not_required'::public.intake_status
  end
from public.patients
where patients.id = public.appointments.patient_id
  and (
    public.appointments.contact_name is null
    or public.appointments.contact_email is null
    or public.appointments.contact_email_normalized is null
    or public.appointments.contact_phone is null
    or public.appointments.intake_status is null
  );

create index if not exists idx_appointments_contact_email
  on public.appointments (contact_email_normalized);

create index if not exists idx_appointments_intake_status
  on public.appointments (intake_status, start_at desc);

create unique index if not exists idx_appointments_reference_code_hash_unique
  on public.appointments (public_reference_code_hash)
  where public_reference_code_hash is not null;

drop policy if exists "Patients view own appointments" on public.appointments;
create policy "Patients view own appointments"
on public.appointments for select
using (
  exists (
    select 1
    from public.patients
    where patients.id = appointments.patient_id
      and patients.auth_user_id = auth.uid()
  )
);

drop policy if exists "Patients view own form submissions" on public.form_submissions;
create policy "Patients view own form submissions"
on public.form_submissions for select
using (
  exists (
    select 1
    from public.patients
    where patients.id = form_submissions.patient_id
      and patients.auth_user_id = auth.uid()
  )
);

drop policy if exists "Patients view own generated documents" on public.generated_documents;
create policy "Patients view own generated documents"
on public.generated_documents for select
using (
  exists (
    select 1
    from public.patients
    where patients.id = generated_documents.patient_id
      and patients.auth_user_id = auth.uid()
  )
);
