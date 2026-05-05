create table if not exists public.security_audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users (id) on delete set null,
  surface text not null,
  action text not null,
  result text not null,
  entity_type text,
  entity_id text,
  hashed_ip text,
  hashed_user_agent text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_security_audit_events_surface_action_created
  on public.security_audit_events (surface, action, created_at desc);

create index if not exists idx_security_audit_events_actor_created
  on public.security_audit_events (actor_user_id, created_at desc);

create index if not exists idx_rate_limit_events_enforcement
  on public.rate_limit_events (endpoint_key, hashed_identifier, created_at desc);

alter table public.security_audit_events enable row level security;
