alter table public.clinic_settings
  add column if not exists appointment_schedule jsonb not null default
    '{
      "monday": { "enabled": true, "start": "11:00", "end": "20:00" },
      "tuesday": { "enabled": true, "start": "11:00", "end": "20:00" },
      "wednesday": { "enabled": true, "start": "11:00", "end": "20:00" },
      "thursday": { "enabled": true, "start": "11:00", "end": "20:00" },
      "friday": { "enabled": true, "start": "11:00", "end": "20:00" },
      "saturday": { "enabled": false, "start": "11:00", "end": "15:00" },
      "sunday": { "enabled": false, "start": "11:00", "end": "15:00" }
    }'::jsonb;

update public.clinic_settings
set appointment_schedule = coalesce(
  appointment_schedule,
  '{
    "monday": { "enabled": true, "start": "11:00", "end": "20:00" },
    "tuesday": { "enabled": true, "start": "11:00", "end": "20:00" },
    "wednesday": { "enabled": true, "start": "11:00", "end": "20:00" },
    "thursday": { "enabled": true, "start": "11:00", "end": "20:00" },
    "friday": { "enabled": true, "start": "11:00", "end": "20:00" },
    "saturday": { "enabled": false, "start": "11:00", "end": "15:00" },
    "sunday": { "enabled": false, "start": "11:00", "end": "15:00" }
  }'::jsonb
);
