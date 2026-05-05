create or replace function public.enforce_rate_limit(
  p_endpoint_key text,
  p_hashed_identifier text,
  p_max integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_window_start timestamptz;
  v_current_count integer;
begin
  if coalesce(trim(p_endpoint_key), '') = '' then
    raise exception 'endpoint_key is required';
  end if;

  if coalesce(trim(p_hashed_identifier), '') = '' then
    raise exception 'hashed_identifier is required';
  end if;

  if coalesce(p_max, 0) <= 0 then
    raise exception 'max must be positive';
  end if;

  v_window_start := v_now - make_interval(secs => greatest(coalesce(p_window_seconds, 0), 1));

  perform pg_advisory_xact_lock(hashtextextended(p_endpoint_key || ':' || p_hashed_identifier, 0));

  select count(*)
  into v_current_count
  from public.rate_limit_events
  where endpoint_key = p_endpoint_key
    and hashed_identifier = p_hashed_identifier
    and created_at >= v_window_start;

  if v_current_count >= p_max then
    return false;
  end if;

  insert into public.rate_limit_events (
    endpoint_key,
    hashed_identifier,
    created_at
  )
  values (
    p_endpoint_key,
    p_hashed_identifier,
    v_now
  );

  return true;
end;
$$;

revoke all on function public.enforce_rate_limit(text, text, integer, integer) from public;
revoke all on function public.enforce_rate_limit(text, text, integer, integer) from anon;
revoke all on function public.enforce_rate_limit(text, text, integer, integer) from authenticated;
grant execute on function public.enforce_rate_limit(text, text, integer, integer) to service_role;
