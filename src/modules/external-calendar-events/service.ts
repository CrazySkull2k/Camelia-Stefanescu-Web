import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/logger";

export type ExternalCalendarEvent = {
  archivedAt: string | null;
  description: string | null;
  endAt: string;
  eventType: string | null;
  googleCalendarId: string;
  googleEventId: string;
  htmlLink: string | null;
  id: string;
  isAllDay: boolean;
  location: string | null;
  startAt: string;
  status: "active" | "cancelled";
  summary: string;
  timezone: string;
  transparency: string | null;
};

type ExternalCalendarEventRow = {
  archived_at: string | null;
  description: string | null;
  end_at: string;
  event_type: string | null;
  google_calendar_id: string;
  google_event_id: string;
  html_link: string | null;
  id: string;
  is_all_day: boolean;
  location: string | null;
  start_at: string;
  status: "active" | "cancelled";
  summary: string;
  timezone: string;
  transparency: string | null;
};

function isMissingExternalCalendarEventsTable(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "42P01" ||
    error.message?.toLowerCase().includes('relation "external_calendar_events"')
  );
}

function mapExternalCalendarEvent(
  row: ExternalCalendarEventRow,
): ExternalCalendarEvent {
  return {
    archivedAt: row.archived_at,
    description: row.description,
    endAt: row.end_at,
    eventType: row.event_type,
    googleCalendarId: row.google_calendar_id,
    googleEventId: row.google_event_id,
    htmlLink: row.html_link,
    id: row.id,
    isAllDay: row.is_all_day,
    location: row.location,
    startAt: row.start_at,
    status: row.status,
    summary: row.summary,
    timezone: row.timezone,
    transparency: row.transparency,
  };
}

export async function listExternalCalendarEvents(input: {
  from: Date;
  includeArchived?: boolean;
  to: Date;
}) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("external_calendar_events")
    .select(
      "id, google_calendar_id, google_event_id, status, summary, description, location, html_link, event_type, transparency, start_at, end_at, timezone, is_all_day, archived_at",
    )
    .lt("start_at", input.to.toISOString())
    .gt("end_at", input.from.toISOString())
    .order("start_at", { ascending: true });

  if (!input.includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingExternalCalendarEventsTable(error)) {
      log("warn", "external_calendar_events table is missing; Google manual imports are disabled until migration runs", {
        code: error.code,
        message: error.message,
      });
      return [];
    }

    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as ExternalCalendarEventRow[]).map(
    mapExternalCalendarEvent,
  );
}

export async function listExternalCalendarBlockingRanges(input: {
  from: Date;
  to: Date;
}) {
  const events = await listExternalCalendarEvents(input);

  return events
    .filter((event) => event.status === "active")
    .map((event) => ({
      end: new Date(event.endAt),
      id: event.id,
      start: new Date(event.startAt),
      title: event.summary,
    }));
}
