# Fortress hardening

This document is the production baseline for the Camelia deployment after the Phase 1 and Phase 2 fortress hardening work.

## Application controls already enforced

- Admin access requires all of the following:
  - Google-authenticated Supabase session
  - allowlisted email from `ADMIN_ALLOWED_GOOGLE_EMAILS`
  - role membership in `role_memberships`
  - TOTP MFA with an `aal2` session for admin pages, admin APIs, document previews, and uploads
- Sensitive admin and patient document routes are streamed server-side and audited.
- Public auth, booking, lookup, upload, webhook, and cron surfaces now use atomic Postgres rate limiting through `public.enforce_rate_limit(...)`.
- Security-sensitive cookies now use explicit `SameSite`, `Secure`, and `__Host-` naming where compatible.
- Security events are written into `security_audit_events`.
- Production CSP is now designed for strict mode:
  - no `unsafe-inline` in production
  - nonce-driven dynamic surfaces for `admin`, `account`, and booking
  - SRI enabled for App Router bundles
  - public exact-design runtime injection removed from live routes
- Admin now includes a read-only `/admin/security` observability page for security audit events, rate-limit activity, and calendar sync issues.
- Patient-owned tables now use stricter patient-scoped RLS with `FORCE ROW LEVEL SECURITY`.

## Required rollout steps

### 1. Run the new database migration

Apply both migrations before deploying the app code:

- `supabase/migrations/0018_fortress_hardening.sql`
- `supabase/migrations/0019_fortress_phase2_rls.sql`

### 2. Rotate and separate production secrets

Generate new secrets locally:

```bash
node scripts/generate-security-secrets.mjs
```

Rotate these values in the production secret manager or `/etc/camelia/new-app.env`:

- `SUPABASE_SERVICE_ROLE_KEY`
- `QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY`
- `APPOINTMENT_RESUME_SECRET`
- `CRON_SECRET`
- `RESEND_WEBHOOK_SECRET`
- `GOOGLE_CALENDAR_WEBHOOK_TOKEN`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` if the Google service account key is reissued

Never reuse `SUPABASE_SERVICE_ROLE_KEY` as an application cookie secret or HMAC secret.

### 3. Lock down Supabase Auth

- Keep only the providers you actually use enabled.
- Restrict redirect URLs to the real deployment hosts:
  - `https://public.example.com`
  - `https://account.example.com`
  - `https://admin.example.com`
- Keep at least two `owner` admins enrolled in TOTP MFA before enforcing the admin rollout.
- Validate that invited users land on the intended password setup flow.

### 4. Deploy behind the reverse proxy

Use `ops/nginx/camelia-fortress.conf` as the baseline. Replace:

- `public.example.com`
- `account.example.com`
- `admin.example.com`
- certificate paths

Install the shared snippet as `/etc/nginx/snippets/camelia-next-proxy.conf`.

### 5. Harden the VPS host

- Disable SSH password logins.
- Allow SSH only with keys.
- Use a non-root deploy user.
- Enable `fail2ban` with the templates under `ops/fail2ban/`.
- Open only `22`, `80`, and `443` at the firewall level.
- Enable unattended security updates.
- Run the app with the provided `ops/systemd/camelia-next.service` baseline.

## Admin MFA rollout

1. Deploy the migration and app code.
2. Confirm that at least two owner accounts can log in with Google.
3. Visit `/admin`, complete enrollment at `/admin/mfa`, and verify that the session is elevated.
4. Confirm that removing the TOTP factor or dropping back to `aal1` redirects the session back to `/admin/mfa`.

## Backup and recovery baseline

- Database:
  - enable daily backups in Supabase
  - keep a manual restore drill every month
- Storage:
  - back up private buckets containing generated PDFs and patient analyses
  - verify that restores preserve object paths referenced by the database
- Secrets:
  - keep a written rotation procedure
  - test secret rotation for cron, webhook, and questionnaire encryption keys in staging first

## Restore drill cadence

Run a formal restore drill at least once per month:

1. Restore the latest database backup into a disposable environment.
2. Restore a sample from private storage buckets:
   - `generated-pdfs`
   - `patient-analyses`
3. Verify that:
   - patient-owned rows are still readable only by the correct patient account
   - admin document preview routes still stream files correctly
   - appointment reference codes still resolve through lookup
4. Destroy the disposable environment after validation and note the restore timestamp.

## Secret rotation cadence

- Rotate `CRON_SECRET`, `RESEND_WEBHOOK_SECRET`, and `GOOGLE_CALENDAR_WEBHOOK_TOKEN` every 90 days or immediately after any webhook incident.
- Rotate `APPOINTMENT_RESUME_SECRET` and `QUESTIONNAIRE_PAYLOAD_ENCRYPTION_KEY` every 180 days, with a staging rehearsal first.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` immediately after any host compromise, leaked backup, or suspicious admin activity.
- Re-issue `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` whenever the Google service account access path changes or after incident response.

## Incident checklist

### Suspected admin compromise

1. Remove the compromised user from `role_memberships`.
2. Rotate `ADMIN_ALLOWED_GOOGLE_EMAILS` if the domain or mailbox policy changed.
3. Revoke active Supabase sessions.
4. Rotate operational secrets listed above.
5. Review `security_audit_events` for:
   - `mfa.*`
   - `webhook.*`
   - `cron.*`
   - `lookup.*`
   - `patient.*`
   - `admin.*`

### Webhook or cron abuse

1. Rotate `CRON_SECRET`, `RESEND_WEBHOOK_SECRET`, and `GOOGLE_CALENDAR_WEBHOOK_TOKEN`.
2. Review the last blocked and failed audit events.
3. Re-check proxy rate limits and host-based routing.

## Post-incident validation checklist

After secrets are rotated or access is restored:

1. Confirm `/admin` still redirects non-`aal2` sessions to `/admin/mfa`.
2. Confirm `/admin/security` loads and shows fresh events.
3. Confirm patient booking, lookup, account login, and analysis upload still work.
4. Confirm private document preview routes return `no-store` responses.
5. Confirm Google Calendar sync can recover from `needs_retry` without new auth errors.
6. Confirm webhook endpoints reject invalid signatures and accept valid ones.

## Validation after every production deploy

Run:

```bash
npm run typecheck
npm run lint
npm run test:security
npm run build
```

Then verify:

- admin Google login redirects non-`aal2` sessions to `/admin/mfa`
- patient booking still works without extra UX friction
- patient document previews still stream inline
- webhook and cron routes still authenticate correctly
