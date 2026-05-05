import "server-only";

import { calendar_v3, google } from "googleapis";

import {
  getGoogleCalendarEnv,
  hasGoogleCalendarEnv,
} from "@/lib/env/server";
import { fromBucharestDateTime } from "@/lib/utils/dates";
import { log } from "@/lib/utils/logger";

type GoogleBusyRange = {
  id: string | null;
  eventType: string | null;
  start: Date;
  end: Date;
  summary: string | null;
  transparency: string | null;
};

export type GoogleCalendarEvent = calendar_v3.Schema$Event;

function getCalendarClient() {
  const env = getGoogleCalendarEnv();
  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

export async function createOrUpdateGoogleCalendarEvent(input: {
  eventId?: string | null;
  summary: string;
  description: string;
  startAt: string;
  endAt: string;
  status?: string;
}) {
  const env = getGoogleCalendarEnv();
  const calendar = getCalendarClient();

  const eventPayload = {
    summary: `${input.status === "pending" ? "[Cerere] " : ""}${input.summary}`,
    description: input.description,
    start: {
      dateTime: input.startAt,
      timeZone: "Europe/Bucharest",
    },
    end: {
      dateTime: input.endAt,
      timeZone: "Europe/Bucharest",
    },
  };

  if (input.eventId) {
    const { data } = await calendar.events.update({
      calendarId: env.GOOGLE_CALENDAR_ID,
      eventId: input.eventId,
      requestBody: eventPayload,
    });

    return data;
  }

  const { data } = await calendar.events.insert({
    calendarId: env.GOOGLE_CALENDAR_ID,
    requestBody: eventPayload,
  });

  return data;
}

export async function deleteGoogleCalendarEvent(eventId: string) {
  const env = getGoogleCalendarEnv();
  const calendar = getCalendarClient();
  await calendar.events.delete({
    calendarId: env.GOOGLE_CALENDAR_ID,
    eventId,
  });
}

export async function watchGoogleCalendarEvents(input: {
  address: string;
  channelId: string;
  expirationMs?: number;
  token: string;
}) {
  const env = getGoogleCalendarEnv();
  const calendar = getCalendarClient();
  const { data } = await calendar.events.watch({
    calendarId: env.GOOGLE_CALENDAR_ID,
    requestBody: {
      address: input.address,
      expiration: input.expirationMs ? String(input.expirationMs) : undefined,
      id: input.channelId,
      token: input.token,
      type: "web_hook",
    },
  });

  return data;
}

export async function stopGoogleCalendarChannel(input: {
  channelId: string;
  resourceId: string;
}) {
  const calendar = getCalendarClient();
  await calendar.channels.stop({
    requestBody: {
      id: input.channelId,
      resourceId: input.resourceId,
    },
  });
}

export async function listGoogleCalendarSyncEvents(input: {
  pageToken?: string | null;
  syncToken?: string | null;
  timeMax?: string;
  timeMin?: string;
}) {
  const env = getGoogleCalendarEnv();
  const calendar = getCalendarClient();
  const request: calendar_v3.Params$Resource$Events$List = {
    calendarId: env.GOOGLE_CALENDAR_ID,
    maxResults: 2500,
    pageToken: input.pageToken ?? undefined,
    showDeleted: true,
    singleEvents: true,
  };

  if (input.syncToken) {
    request.syncToken = input.syncToken;
  } else {
    request.orderBy = "startTime";
    request.timeMax = input.timeMax;
    request.timeMin = input.timeMin;
  }

  const { data } = await calendar.events.list(request);
  return data;
}

function eventBoundary(value: { dateTime?: string | null; date?: string | null } | undefined) {
  if (value?.dateTime) {
    return new Date(value.dateTime);
  }

  if (value?.date) {
    return fromBucharestDateTime(value.date, "00:00");
  }

  return null;
}

export async function getGoogleCalendarEventRanges(input: {
  startAt: string;
  endAt: string;
}): Promise<GoogleBusyRange[]> {
  const env = getGoogleCalendarEnv();
  const calendar = getCalendarClient();
  const { data } = await calendar.events.list({
    calendarId: env.GOOGLE_CALENDAR_ID,
    timeMin: input.startAt,
    timeMax: input.endAt,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  return (data.items ?? []).reduce<GoogleBusyRange[]>((accumulator, event) => {
    if (event.status === "cancelled") {
      return accumulator;
    }

    if (event.transparency === "transparent") {
      return accumulator;
    }

    if (event.eventType === "workingLocation" || event.eventType === "birthday") {
      return accumulator;
    }

    const start = eventBoundary(event.start);
    const end = eventBoundary(event.end);

    if (!start || !end) {
      return accumulator;
    }

    accumulator.push({
      id: event.id ?? null,
      eventType: event.eventType ?? null,
      start,
      end,
      summary: event.summary ?? null,
      transparency: event.transparency ?? null,
    });

    return accumulator;
  }, []);
}

export async function getGoogleCalendarBusyRanges(input: {
  startAt: string;
  endAt: string;
}): Promise<GoogleBusyRange[]> {
  return getGoogleCalendarEventRanges(input);
}

export async function getGoogleCalendarConflictRange(input: {
  startAt: string;
  endAt: string;
  excludeEventId?: string;
}) {
  if (!hasGoogleCalendarEnv()) {
    return null;
  }

  const busyRanges = await getGoogleCalendarEventRanges(input);
  const requestedStart = new Date(input.startAt);
  const requestedEnd = new Date(input.endAt);

  const conflict = busyRanges.find((range) => {
    if (!range) {
      return false;
    }

    if (input.excludeEventId && range.id === input.excludeEventId) {
      return false;
    }

    return requestedStart < range.end && requestedEnd > range.start;
  });

  if (conflict) {
    log("warn", "Google Calendar conflict detected", {
      endAt: input.endAt,
      eventId: conflict.id,
      eventType: conflict.eventType,
      excludeEventId: input.excludeEventId ?? null,
      startAt: input.startAt,
      summary: conflict.summary,
      transparency: conflict.transparency,
    });
  }

  return conflict ?? null;
}

export async function hasGoogleCalendarConflict(input: {
  startAt: string;
  endAt: string;
  excludeEventId?: string;
}) {
  return Boolean(await getGoogleCalendarConflictRange(input));
}
