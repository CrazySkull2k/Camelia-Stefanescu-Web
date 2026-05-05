create table if not exists public.pricing_sections (
  id text primary key,
  category_id text not null references public.service_categories (id) on delete cascade,
  slug text not null,
  title text,
  description text,
  sort_order integer not null default 1,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (category_id, slug)
);

alter table public.pricing_sections enable row level security;

alter table public.service_offerings
  add column if not exists pricing_section_id text references public.pricing_sections (id) on delete set null;

alter table public.service_offerings
  add column if not exists cta_label text;

alter table public.service_offerings
  add column if not exists feature_bullets text[] not null default '{}'::text[];

create index if not exists pricing_sections_category_sort_idx
  on public.pricing_sections (category_id, sort_order);

create index if not exists service_offerings_category_sort_idx
  on public.service_offerings (category_id, sort_order);

create index if not exists service_offerings_pricing_section_sort_idx
  on public.service_offerings (pricing_section_id, sort_order)
  where pricing_section_id is not null;

drop policy if exists "Public can read visible pricing sections" on public.pricing_sections;
create policy "Public can read visible pricing sections"
on public.pricing_sections for select
using (is_visible = true);

drop policy if exists "Editors manage pricing sections" on public.pricing_sections;
create policy "Editors manage pricing sections"
on public.pricing_sections for all
using (public.has_any_role(array['owner','staff_admin','editor']))
with check (public.has_any_role(array['owner','staff_admin','editor']));

update public.service_offerings
set feature_bullets = regexp_split_to_array(description, E'\\s*\\|\\s*'),
    updated_at = timezone('utc', now())
where description is not null
  and cardinality(feature_bullets) = 0;

update public.service_offerings
set cta_label = 'Programează',
    updated_at = timezone('utc', now())
where is_bookable = true
  and cta_label is null;

insert into public.service_categories (id, slug, name, description, sort_order, is_visible)
values
  (
    'diagnoza-celulara',
    'diagnoza-celulara',
    'Diagnoza Celulară',
    'Descoperă și înțelege mai bine sănătatea ta prin analiză celulară.',
    1,
    true
  ),
  (
    'nutritie',
    'nutritie',
    'Nutriție',
    'Construiește un stil de viață sănătos prin nutriție echilibrată.',
    2,
    true
  ),
  (
    'terapie-shockwave',
    'terapie-shockwave',
    'Terapie Shockwave',
    'Pachete pentru terapia cu unde de șoc',
    3,
    true
  )
on conflict (id) do update
set slug = excluded.slug,
    name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_visible = excluded.is_visible,
    updated_at = timezone('utc', now());

insert into public.pricing_sections (id, category_id, slug, title, description, sort_order, is_visible)
values
  (
    'diagnoza-celulara-default',
    'diagnoza-celulara',
    'default',
    null,
    null,
    1,
    true
  ),
  (
    'nutritie-default',
    'nutritie',
    'default',
    null,
    null,
    1,
    true
  ),
  (
    'terapie-shockwave-default',
    'terapie-shockwave',
    'default',
    null,
    null,
    1,
    true
  )
on conflict (id) do update
set category_id = excluded.category_id,
    slug = excluded.slug,
    title = excluded.title,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_visible = excluded.is_visible,
    updated_at = timezone('utc', now());

update public.service_offerings
set is_visible = false,
    is_bookable = false,
    updated_at = timezone('utc', now())
where category_id in ('diagnoza-celulara', 'nutritie', 'terapie-shockwave');

insert into public.service_offerings (
  id,
  category_id,
  pricing_section_id,
  slug,
  name,
  description,
  notes,
  cta_label,
  feature_bullets,
  price_amount,
  currency_code,
  duration_minutes,
  is_bookable,
  is_visible,
  sort_order
)
values
  (
    'diagnoza-globala',
    'diagnoza-celulara',
    'diagnoza-celulara-default',
    'sedinta-de-diagnoza-globala',
    'Ședință de Diagnoză Globală',
    'Măsurarea stării inițiale a funcțiilor organelor și sistemelor corpului | Tratament | Evaluarea răspunsului organismului la tratamentul aplicat',
    'Durata 90 min',
    'Programează',
    array[
      'Măsurarea stării inițiale a funcțiilor organelor și sistemelor corpului',
      'Tratament',
      'Evaluarea răspunsului organismului la tratamentul aplicat'
    ]::text[],
    900,
    'RON',
    90,
    true,
    true,
    1
  ),
  (
    'diagnoza-intermediara',
    'diagnoza-celulara',
    'diagnoza-celulara-default',
    'sedinta-diagnoza-intermediara',
    'Ședință Diagnoză Intermediară',
    'Este folosită la jumătatea programelor de tratament de 6–12 ședințe pentru evaluarea rezultatelor intermediare',
    null,
    'Programează',
    array[
      'Este folosită la jumătatea programelor de tratament de 6–12 ședințe pentru evaluarea rezultatelor intermediare'
    ]::text[],
    750,
    'RON',
    null,
    true,
    true,
    2
  ),
  (
    'tratament-mitoplus',
    'diagnoza-celulara',
    'diagnoza-celulara-default',
    'sedinta-tratament-mitoplus',
    'Ședință Tratament Mitoplus',
    'Tratament specializat în cazul unei patologii cunoscute, după efectuarea diagnozei globale și verificarea stării funcțiilor organelor și a sistemelor corpului',
    null,
    'Programează',
    array[
      'Tratament specializat în cazul unei patologii cunoscute, după efectuarea diagnozei globale și verificarea stării funcțiilor organelor și a sistemelor corpului'
    ]::text[],
    350,
    'RON',
    null,
    true,
    true,
    3
  ),
  (
    'program-complex-8-sedinte',
    'diagnoza-celulara',
    'diagnoza-celulara-default',
    'programe-complexe-de-tratament-8-sedinte',
    'Programe complexe de tratament',
    'Se alege programul necesar după efectuarea diagnozei globale și verificarea stării funcțiilor organelor și a sistemelor corpului',
    '8 ședințe + 1 diagnoză intermediară',
    'Programează',
    array[
      'Se alege programul necesar după efectuarea diagnozei globale și verificarea stării funcțiilor organelor și a sistemelor corpului'
    ]::text[],
    2900,
    'RON',
    null,
    true,
    true,
    4
  ),
  (
    'program-complex-12',
    'diagnoza-celulara',
    'diagnoza-celulara-default',
    'programe-complexe-de-tratament-12-sedinte',
    'Programe complexe de tratament',
    'Se alege programul necesar după efectuarea diagnozei globale și verificarea stării funcțiilor organelor și a sistemelor corpului',
    '12 ședințe + 2 diagnoze intermediare',
    'Programează',
    array[
      'Se alege programul necesar după efectuarea diagnozei globale și verificarea stării funcțiilor organelor și a sistemelor corpului'
    ]::text[],
    4400,
    'RON',
    null,
    true,
    true,
    5
  ),
  (
    'recalibrarea-raspunsului-hormonal',
    'nutritie',
    'nutritie-default',
    'recalibrarea-raspunsului-hormonal-program-de-nutritie-online',
    'Recalibrarea Răspunsului Hormonal - program de nutritie online',
    'Online | 8 ședințe individuale prin Zoom, WhatsApp sau telefon, stabilite de comun acord la interval de 2 săptămâni una de cealaltă. | Suport prin e-mail nelimitat – răspunsuri și întrebări despre orice problemă legată de nutriție. | Suport de program: fișă jurnal de nutriție, fișă grupe alimentare.',
    '4 luni',
    'Programează',
    array[
      'Online',
      '8 ședințe individuale prin Zoom, WhatsApp sau telefon, stabilite de comun acord la interval de 2 săptămâni una de cealaltă.',
      'Suport prin e-mail nelimitat – răspunsuri și întrebări despre orice problemă legată de nutriție.',
      'Suport de program: fișă jurnal de nutriție, fișă grupe alimentare.'
    ]::text[],
    2300,
    'RON',
    null,
    true,
    true,
    1
  ),
  (
    'evaluare-globala',
    'nutritie',
    'nutritie-default',
    'evaluare-globala-diagnoza-celulara-analiza-nutritionala-complexa',
    'Evaluare globală diagnoză celulară + analiză nutrițională complexă',
    'Diagnoză globală cu detectarea deficiențelor de funcționare celulară | Evaluare nutrițională / chestionar | Verificare compoziție corporală – interpretare | Verificare și interpretare analize de laborator',
    'Ședință (120 min)',
    'Programează',
    array[
      'Diagnoză globală cu detectarea deficiențelor de funcționare celulară',
      'Evaluare nutrițională / chestionar',
      'Verificare compoziție corporală – interpretare',
      'Verificare și interpretare analize de laborator'
    ]::text[],
    1200,
    'RON',
    120,
    true,
    true,
    2
  ),
  (
    'nutritie-clinica',
    'nutritie',
    'nutritie-default',
    'nutritie-clinica',
    'Nutriție clinică',
    'Evaluare nutrițională / chestionar | Verificare și interpretare analize de laborator | Analiză compoziție corporală – interpretare | Analiză comportament alimentar | Stabilire obiective | Personalizare plan alimentar / patologie',
    'Ședință',
    'Programează',
    array[
      'Evaluare nutrițională / chestionar',
      'Verificare și interpretare analize de laborator',
      'Analiză compoziție corporală – interpretare',
      'Analiză comportament alimentar',
      'Stabilire obiective',
      'Personalizare plan alimentar / patologie'
    ]::text[],
    350,
    'RON',
    60,
    true,
    true,
    3
  ),
  (
    'nutritie-sportiva',
    'nutritie',
    'nutritie-default',
    'nutritie-sportiva',
    'Nutriție sportivă',
    'Evaluare nutrițională / chestionar | Verificare și interpretare analize de laborator | Analiză compoziție corporală – interpretare | Analiză comportament alimentar | Stabilire obiective | Personalizare plan alimentar / sport practicat | Schemă personalizată de administrare suplimente',
    'Ședință',
    'Programează',
    array[
      'Evaluare nutrițională / chestionar',
      'Verificare și interpretare analize de laborator',
      'Analiză compoziție corporală – interpretare',
      'Analiză comportament alimentar',
      'Stabilire obiective',
      'Personalizare plan alimentar / sport practicat',
      'Schemă personalizată de administrare suplimente'
    ]::text[],
    350,
    'RON',
    60,
    true,
    true,
    4
  ),
  (
    'nutritie-la-cabinet',
    'nutritie',
    'nutritie-default',
    'nutritie-la-cabinet-recalibrarea-raspunsului-hormonal',
    'Nutriție la cabinet – Recalibrarea Răspunsului Hormonal',
    'Evaluare nutrițională / chestionar | Cântărire, IMC | Verificare compoziție corporală – interpretare | Verificare și interpretare analize de laborator | Explicații despre principiile programului | Stabilire obiective | Personalizare plan alimentar | Fișă jurnal + grupe alimentare + farfurie demonstrativă | Verificare zilnică pe e-mail a jurnalului (2 săptămâni)',
    'Ședință',
    'Programează',
    array[
      'Evaluare nutrițională / chestionar',
      'Cântărire, IMC',
      'Verificare compoziție corporală – interpretare',
      'Verificare și interpretare analize de laborator',
      'Explicații despre principiile programului',
      'Stabilire obiective',
      'Personalizare plan alimentar',
      'Fișă jurnal + grupe alimentare + farfurie demonstrativă',
      'Verificare zilnică pe e-mail a jurnalului (2 săptămâni)'
    ]::text[],
    350,
    'RON',
    60,
    true,
    true,
    5
  ),
  (
    'detox-fiziologic',
    'nutritie',
    'nutritie-default',
    'recalibrarea-raspunsului-hormonal-stimulare-metabolica-detox-fiziologic',
    'Recalibrarea Răspunsului Hormonal – Stimulare Metabolică / Detox Fiziologic',
    'Program de nutriție pentru slăbire la cabinet | Ședință inițială: evaluare + analize + BIA + diagnoză + stimulare metabolică | 6 ședințe nutriție la 2 săptămâni | 3 ședințe stimulare metabolică la 4 săptămâni | Personalizare plan alimentar',
    'Program',
    'Programează',
    array[
      'Program de nutriție pentru slăbire la cabinet',
      'Ședință inițială: evaluare + analize + BIA + diagnoză + stimulare metabolică',
      '6 ședințe nutriție la 2 săptămâni',
      '3 ședințe stimulare metabolică la 4 săptămâni',
      'Personalizare plan alimentar'
    ]::text[],
    3500,
    'RON',
    null,
    true,
    true,
    6
  ),
  (
    'diagnoza-metabolism',
    'nutritie',
    'nutritie-default',
    'diagnoza-stare-de-sanatate-si-sisteme-care-influenteaza-metabolismul',
    'Diagnoză stare de sănătate și sisteme care influențează metabolismul',
    'Durata 90 min',
    'Ședință (90 min)',
    'Programează',
    array['Durata 90 min']::text[],
    900,
    'RON',
    90,
    true,
    true,
    7
  ),
  (
    'sedinta-terapie-shockwave',
    'terapie-shockwave',
    'terapie-shockwave-default',
    'sedinta-terapie-shockwave',
    'Sedinta terapie shockwave',
    'Aplicare locală unde de șoc | Recomandari post sedinta | Interval recomandat 7-10 zile',
    '8–15 min',
    'Programează',
    array[
      'Aplicare locală unde de șoc',
      'Recomandari post sedinta',
      'Interval recomandat 7-10 zile'
    ]::text[],
    375,
    'RON',
    15,
    true,
    true,
    1
  ),
  (
    'pachet-shockwave-start',
    'terapie-shockwave',
    'terapie-shockwave-default',
    'pachet-shockwave-start',
    'Pachet shockwave start',
    'Protocol afectiuni acute: 3 ședințe la 7–10 zile | Re-evaluare scurta la fiecare sedinta | Recomandari post sedinta',
    '3 ședințe',
    'Programează',
    array[
      'Protocol afectiuni acute: 3 ședințe la 7–10 zile',
      'Re-evaluare scurta la fiecare sedinta',
      'Recomandari post sedinta'
    ]::text[],
    1050,
    'RON',
    null,
    true,
    true,
    2
  ),
  (
    'pachet-shockwave-intensiv',
    'terapie-shockwave',
    'terapie-shockwave-default',
    'pachet-shockwave-intensiv',
    'Pachet shockwave intensiv',
    'Protocol extins pentru afectiuni cronice | Monitorizare progres (durere, mobilitate) | Recomandari post sedinta',
    '6 ședințe',
    'Programează',
    array[
      'Protocol extins pentru afectiuni cronice',
      'Monitorizare progres (durere, mobilitate)',
      'Recomandari post sedinta'
    ]::text[],
    1980,
    'RON',
    null,
    true,
    true,
    3
  ),
  (
    'sedinta-shockwave-celulita-o-zona',
    'terapie-shockwave',
    'terapie-shockwave-default',
    'sedinta-shockwave-celulita-o-zona',
    'Sedinta shockwave celulita o zona',
    'Protocol variabil 3-5 sedinte in functie de gradul celulitei | Monitorizare progres | Recomandari post sedinta',
    'Per zona',
    'Programează',
    array[
      'Protocol variabil 3-5 sedinte in functie de gradul celulitei',
      'Monitorizare progres',
      'Recomandari post sedinta'
    ]::text[],
    550,
    'RON',
    null,
    true,
    true,
    4
  ),
  (
    'sedinta-shockwave-disfunctie-erectila',
    'terapie-shockwave',
    'terapie-shockwave-default',
    'sedinta-shockwave-disfunctie-erectila-boala-peyronie',
    'Sedinta shockwave disfunctie erectila / boala Peyronie',
    'Protocol 5-6 sedinte | Monitorizare progres | Recomandari individuale',
    'Per sedinta',
    'Programează',
    array[
      'Protocol 5-6 sedinte',
      'Monitorizare progres',
      'Recomandari individuale'
    ]::text[],
    400,
    'RON',
    null,
    true,
    true,
    5
  ),
  (
    'sedinta-shockwave-contractura-dupuytren',
    'terapie-shockwave',
    'terapie-shockwave-default',
    'sedinta-shockwave-contractura-dupuytren',
    'Sedinta shockwave contractura Dupuytren',
    'Protocol 5-6 sedinte | Monitorizare progres | Recomandari individuale',
    'Per sedinta',
    'Programează',
    array[
      'Protocol 5-6 sedinte',
      'Monitorizare progres',
      'Recomandari individuale'
    ]::text[],
    400,
    'RON',
    null,
    true,
    true,
    6
  )
on conflict (id) do update
set category_id = excluded.category_id,
    pricing_section_id = excluded.pricing_section_id,
    slug = excluded.slug,
    name = excluded.name,
    description = excluded.description,
    notes = excluded.notes,
    cta_label = excluded.cta_label,
    feature_bullets = excluded.feature_bullets,
    price_amount = excluded.price_amount,
    currency_code = excluded.currency_code,
    duration_minutes = excluded.duration_minutes,
    is_bookable = excluded.is_bookable,
    is_visible = excluded.is_visible,
    sort_order = excluded.sort_order,
    updated_at = timezone('utc', now());
