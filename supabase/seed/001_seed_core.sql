insert into public.appointment_resources (id, name, google_calendar_id, timezone, is_active)
values ('primary-resource', 'Cabinet principal', null, 'Europe/Bucharest', true)
on conflict (id) do update
set name = excluded.name,
    timezone = excluded.timezone,
    is_active = excluded.is_active;

insert into public.form_definitions (id, name, description, is_active)
values ('nutrition-intake', 'Chestionar evaluare nutritionala', 'Formularul de prima vizita', true)
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active;

insert into public.form_versions (id, definition_id, schema_json, is_published)
values ('nutrition-intake-v1', 'nutrition-intake', '{}'::jsonb, true)
on conflict (id) do update
set schema_json = excluded.schema_json,
    is_published = excluded.is_published;
