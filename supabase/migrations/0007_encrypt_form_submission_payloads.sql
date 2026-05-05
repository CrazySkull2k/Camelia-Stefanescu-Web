alter table public.form_submissions
  add column if not exists payload_encrypted jsonb,
  add column if not exists payload_encrypted_at timestamptz,
  add column if not exists payload_encryption_key_id text;

comment on column public.form_submissions.payload_json is
  'Legacy/plain fallback payload. New nutrition intake submissions should store sensitive answers in payload_encrypted.';

comment on column public.form_submissions.payload_encrypted is
  'Application-level encrypted questionnaire payload envelope.';

comment on column public.form_submissions.payload_encrypted_at is
  'Timestamp when the questionnaire payload was encrypted by the application.';

comment on column public.form_submissions.payload_encryption_key_id is
  'Application key identifier used for payload encryption and future rotation.';
