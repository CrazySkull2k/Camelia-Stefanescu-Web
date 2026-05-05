import "server-only";

import { randomUUID } from "node:crypto";

import { addMonths, formatISO, subMonths } from "date-fns";

import {
  getGoogleCalendarEnv,
  hasGoogleCalendarEnv,
} from "@/lib/env/server";
import { getPublicSiteUrl } from "@/lib/env/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fromBucharestDateTime } from "@/lib/utils/dates";
import { log } from "@/lib/utils/logger";
import { sanitizePlainText } from "@/lib/validation/sanitize";
import {
  type GoogleCalendarEvent,
  listGoogleCalendarSyncEvents,
  stopGoogleCalendarChannel,
  watchGoogleCalendarEvents,
} from "@/modules/calendar/service";

type WatchStateRow = {
  calendar_id: string;
  channel_id: string | null;
  channel_token: string | null;
  expiration_at: string | null;
  id: string;
  last_message_number: number | null;
  resource_id: string | null;
  sync_token: string | null;
};

const DEFAULT_SYNC_MONTHS_BACK = 6;
const DEFAULT_SYNC_MONTHS_FORWARD = 12;
const CHANNEL_RENEWAL_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const CHANNEL_EXPIRATION_MS = 6 * 24 * 60 * 60 * 1000;

function isMissingWatcherTables(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "42P01" ||
    error?.message
      ?.toLowerCase()
      .includes('relation "google_calendar_watch_state"') ||
    error?.message?.toLowerCase().includes('relation "external_calendar_events"')
  );
}

function isExpiredSyncTokenError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: number; response?: { status?: number } };
  return candidate.code === 410 || candidate.response?.status === 410;
}

function getSyncWindow() {
  const now = new Date();
  return {
    from: subMonths(now, DEFAULT_SYNC_MONTHS_BACK),
    to: addMonths(now, DEFAULT_SYNC_MONTHS_FORWARD),
  };
}

function getWebhookAddress() {
  return `${getPublicSiteUrl().replace(/\/$/, "")}/api/google-calendar/webhook`;
}

function getEventBoundary(
  value: { date?: string | null; dateTime?: string | null } | undefined,
) {
  if (value?.dateTime) {
    return new Date(value.dateTime);
  }

  if (value?.date) {
    return fromBucharestDateTime(value.date, "00:00");
  }

  return null;
}

function getEventRange(event: GoogleCalendarEvent) {
  const start = getEventBoundary(event.start);
  const end = getEventBoundary(event.end);

  if (!start || !end || end <= start) {
    return null;
  }

  return {
    end,
    isAllDay: Boolean(event.start?.date && event.end?.date),
    start,
    timezone:
      event.start?.timeZone ?? event.end?.timeZone ?? "Europe/Bucharest",
  };
}

function shouldIgnoreGoogleEvent(event: GoogleCalendarEvent) {
  return (
    event.transparency === "transparent" ||
    event.eventType === "birthday" ||
    event.eventType === "workingLocation"
  );
}

async function getWatchState(calendarId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("google_calendar_watch_state")
    .select(
      "id, calendar_id, channel_id, channel_token, resource_id, expiration_at, sync_token, last_message_number",
    )
    .eq("calendar_id", calendarId)
    .maybeSingle();

  if (error) {
    if (isMissingWatcherTables(error)) {
      throw new Error(
        "Lipseste migrarea pentru Google Calendar watcher. Ruleaza migrarea 0016_external_google_calendar_events.sql.",
      );
    }

    throw new Error(error.message);
  }

  return data as WatchStateRow | null;
}

async function upsertWatchState(input: Partial<WatchStateRow> & {
  calendar_id: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("google_calendar_watch_state")
    .upsert(
      {
        calendar_id: input.calendar_id,
        channel_id: input.channel_id,
        channel_token: input.channel_token,
        expiration_at: input.expiration_at,
        last_message_number: input.last_message_number,
        resource_id: input.resource_id,
        sync_token: input.sync_token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "calendar_id" },
    )
    .select(
      "id, calendar_id, channel_id, channel_token, resource_id, expiration_at, sync_token, last_message_number",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nu am putut salva watcher state.");
  }

  return data as WatchStateRow;
}

async function updateWatchState(calendarId: string, values: Record<string, unknown>) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("google_calendar_watch_state")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("calendar_id", calendarId);

  if (error) {
    throw new Error(error.message);
  }
}

async function eventExistsInManagedTables(input: {
  eventId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const [appointmentsResult, blocksResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id")
      .eq("google_event_id", input.eventId)
      .limit(1),
    supabase
      .from("calendar_blocks")
      .select("id")
      .eq("google_event_id", input.eventId)
      .limit(1),
  ]);

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message);
  }

  if (
    blocksResult.error &&
    !/google_calendar_id|google_event_id|schema cache/i.test(
      blocksResult.error.message,
    )
  ) {
    throw new Error(blocksResult.error.message);
  }

  return Boolean(appointmentsResult.data?.length || blocksResult.data?.length);
}

async function archiveExternalGoogleEvent(input: {
  calendarId: string;
  eventId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("external_calendar_events")
    .update({
      archived_at: now,
      last_seen_at: now,
      status: "cancelled",
      updated_at: now,
    })
    .eq("google_calendar_id", input.calendarId)
    .eq("google_event_id", input.eventId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertExternalGoogleEvent(event: GoogleCalendarEvent) {
  const env = getGoogleCalendarEnv();

  if (!event.id) {
    return { action: "skipped" as const };
  }

  const baseIdentity = {
    calendarId: env.GOOGLE_CALENDAR_ID,
    eventId: event.id,
  };

  const isManagedEvent = await eventExistsInManagedTables(baseIdentity);
  if (isManagedEvent) {
    await archiveExternalGoogleEvent(baseIdentity);
    return { action: "ignored-managed" as const };
  }

  if (event.status === "cancelled") {
    await archiveExternalGoogleEvent(baseIdentity);
    return { action: "cancelled" as const };
  }

  if (shouldIgnoreGoogleEvent(event)) {
    await archiveExternalGoogleEvent(baseIdentity);
    return { action: "ignored" as const };
  }

  const range = getEventRange(event);
  if (!range) {
    return { action: "skipped" as const };
  }

  const now = new Date().toISOString();
  const summary = sanitizePlainText(event.summary ?? "Programare externa");
  const description = sanitizePlainText(event.description ?? "") || null;
  const location = sanitizePlainText(event.location ?? "") || null;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("external_calendar_events").upsert(
    {
      archived_at: null,
      description,
      end_at: range.end.toISOString(),
      event_type: event.eventType ?? null,
      google_calendar_id: env.GOOGLE_CALENDAR_ID,
      google_etag: event.etag ?? null,
      google_event_id: event.id,
      html_link: event.htmlLink ?? null,
      ical_uid: event.iCalUID ?? null,
      is_all_day: range.isAllDay,
      last_seen_at: now,
      location,
      start_at: range.start.toISOString(),
      status: "active",
      summary: summary || "Programare externa",
      timezone: range.timezone,
      transparency: event.transparency ?? null,
      updated_at: now,
    },
    { onConflict: "google_calendar_id,google_event_id" },
  );

  if (error) {
    if (isMissingWatcherTables(error)) {
      throw new Error(
        "Lipseste migrarea pentru evenimente externe Google Calendar.",
      );
    }

    throw new Error(error.message);
  }

  return { action: "upserted" as const };
}

export async function runGoogleCalendarFullSync() {
  if (!hasGoogleCalendarEnv()) {
    return { imported: 0, mode: "full" as const, skipped: true };
  }

  const env = getGoogleCalendarEnv();
  const { from, to } = getSyncWindow();
  let pageToken: string | null | undefined;
  let nextSyncToken: string | null | undefined;
  let imported = 0;

  do {
    const data = await listGoogleCalendarSyncEvents({
      pageToken,
      timeMax: formatISO(to),
      timeMin: formatISO(from),
    });

    for (const event of data.items ?? []) {
      const result = await upsertExternalGoogleEvent(event);
      if (result.action === "upserted") {
        imported += 1;
      }
    }

    pageToken = data.nextPageToken;
    nextSyncToken = data.nextSyncToken;
  } while (pageToken);

  await updateWatchState(env.GOOGLE_CALENDAR_ID, {
    last_error: null,
    last_full_sync_at: new Date().toISOString(),
    sync_token: nextSyncToken ?? null,
  });

  return { imported, mode: "full" as const, skipped: false };
}

export async function runGoogleCalendarIncrementalSync() {
  if (!hasGoogleCalendarEnv()) {
    return { imported: 0, mode: "incremental" as const, skipped: true };
  }

  const env = getGoogleCalendarEnv();
  const state = await getWatchState(env.GOOGLE_CALENDAR_ID);

  if (!state?.sync_token) {
    return runGoogleCalendarFullSync();
  }

  let pageToken: string | null | undefined;
  let nextSyncToken: string | null | undefined;
  let imported = 0;

  try {
    do {
      const data = await listGoogleCalendarSyncEvents({
        pageToken,
        syncToken: state.sync_token,
      });

      for (const event of data.items ?? []) {
        const result = await upsertExternalGoogleEvent(event);
        if (result.action === "upserted") {
          imported += 1;
        }
      }

      pageToken = data.nextPageToken;
      nextSyncToken = data.nextSyncToken;
    } while (pageToken);
  } catch (error) {
    if (isExpiredSyncTokenError(error)) {
      log("warn", "Google Calendar sync token expired; running full sync");
      await updateWatchState(env.GOOGLE_CALENDAR_ID, {
        sync_token: null,
      });
      return runGoogleCalendarFullSync();
    }

    await updateWatchState(env.GOOGLE_CALENDAR_ID, {
      last_error: error instanceof Error ? error.message : "Unknown sync error",
    });
    throw error;
  }

  await updateWatchState(env.GOOGLE_CALENDAR_ID, {
    last_error: null,
    last_incremental_sync_at: new Date().toISOString(),
    sync_token: nextSyncToken ?? state.sync_token,
  });

  return { imported, mode: "incremental" as const, skipped: false };
}

export async function ensureGoogleCalendarWatchChannel(input?: {
  forceRenew?: boolean;
}) {
  if (!hasGoogleCalendarEnv()) {
    return { ok: false as const, reason: "missing-google-env" };
  }

  const env = getGoogleCalendarEnv();
  const currentState = await getWatchState(env.GOOGLE_CALENDAR_ID);
  const expiresAt = currentState?.expiration_at
    ? new Date(currentState.expiration_at).getTime()
    : 0;
  const shouldRenew =
    input?.forceRenew ||
    !currentState?.channel_id ||
    !currentState.resource_id ||
    !expiresAt ||
    expiresAt - Date.now() < CHANNEL_RENEWAL_THRESHOLD_MS;

  if (!shouldRenew) {
    return {
      channelId: currentState.channel_id,
      expiresAt: currentState.expiration_at,
      ok: true as const,
      renewed: false,
    };
  }

  if (currentState?.channel_id && currentState.resource_id) {
    await stopGoogleCalendarChannel({
      channelId: currentState.channel_id,
      resourceId: currentState.resource_id,
    }).catch((error) => {
      log("warn", "Failed to stop old Google Calendar watch channel", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });
  }

  const channelId = randomUUID();
  const channelToken =
    process.env.GOOGLE_CALENDAR_WEBHOOK_TOKEN || randomUUID();
  const expirationMs = Date.now() + CHANNEL_EXPIRATION_MS;
  const channel = await watchGoogleCalendarEvents({
    address: getWebhookAddress(),
    channelId,
    expirationMs,
    token: channelToken,
  });

  const expirationAt = channel.expiration
    ? new Date(Number(channel.expiration)).toISOString()
    : new Date(expirationMs).toISOString();

  await upsertWatchState({
    calendar_id: env.GOOGLE_CALENDAR_ID,
    channel_id: channel.id ?? channelId,
    channel_token: channel.token ?? channelToken,
    expiration_at: expirationAt,
    last_message_number: null,
    resource_id: channel.resourceId ?? null,
    sync_token: currentState?.sync_token ?? null,
  });

  return {
    channelId: channel.id ?? channelId,
    expiresAt: expirationAt,
    ok: true as const,
    renewed: true,
  };
}

export async function recordGoogleCalendarNotification(input: {
  channelId: string | null;
  channelToken: string | null;
  messageNumber: string | null;
  resourceId: string | null;
}) {
  if (!hasGoogleCalendarEnv()) {
    return { ok: false as const, reason: "missing-google-env" };
  }

  const env = getGoogleCalendarEnv();
  const state = await getWatchState(env.GOOGLE_CALENDAR_ID);

  if (
    !state ||
    !input.channelId ||
    !input.resourceId ||
    state.channel_id !== input.channelId ||
    state.resource_id !== input.resourceId ||
    state.channel_token !== input.channelToken
  ) {
    return { ok: false as const, reason: "invalid-channel" };
  }

  const messageNumber = Number(input.messageNumber);
  const nextMessageNumber = Number.isFinite(messageNumber)
    ? messageNumber
    : state.last_message_number;

  await updateWatchState(env.GOOGLE_CALENDAR_ID, {
    last_message_number: nextMessageNumber,
    last_notification_at: new Date().toISOString(),
  });

  return { ok: true as const };
}

export async function runGoogleCalendarWatcherMaintenance() {
  const watch = await ensureGoogleCalendarWatchChannel();
  const sync = await runGoogleCalendarIncrementalSync();

  return { sync, watch };
}
