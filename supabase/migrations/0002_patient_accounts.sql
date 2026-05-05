alter table public.patients
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

create unique index if not exists idx_patients_auth_user_unique
  on public.patients (auth_user_id)
  where auth_user_id is not null;

drop policy if exists "Users view own profile" on public.profiles;
create policy "Users view own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Patients view own record" on public.patients;
create policy "Patients view own record"
on public.patients for select
using (auth.uid() = auth_user_id);

drop policy if exists "Patients update own record" on public.patients;
create policy "Patients update own record"
on public.patients for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);
