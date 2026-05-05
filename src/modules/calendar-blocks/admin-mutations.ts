import "server-only";

import { hasGoogleCalendarEnv } from "@/lib/env/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizePlainText } from "@/lib/validation/sanitize";
import { fromBucharestDateTime } from "@/lib/utils/dates";
import { writeAuditLog } from "@/modules/audit/service";
import {
  createOrUpdateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getGoogleCalendarConflictRange,
} from "@/modules/calendar/service";
import { listExternalCalendarBlockingRanges } from "@/modules/external-calendar-events/service";
import {
  getBucharestDateValue,
  getWorkingWindowForDate,
  timeToMinutes,
  type ClinicAppointmentSchedule,
} from "@/modules/settings/schedule";
import { getClinicSettings } from "@/modules/settings/service";

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

const calendarBlockTypeSchema = z.enum(["admin", "clinic_work", "personal", "unavailable"]);
const calendarBlockColorSchema = z.enum(["cream", "peach", "sage", "stone"]);
const calendarBlockTimeModeSchema = z.enum(["all_day", "custom"]);
const dateValueSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeValueSchema = z.string().regex(/^\d{2}:\d{2}$/);
const optionalIdSchema = z.string().uuid().optional();

type CalendarBlockMutationErrorResponse = {
  code: string;
  internalMessage: string;
  message: string;
  status: number;
};

class CalendarBlockMutationError extends Error {
  readonly code: string;
  readonly publicMessage: string;
  readonly status: number;

  constructor(input: {
    code: string;
    internalMessage?: string;
    message: string;
    status: number;
  }) {
    super(input.internalMessage ?? input.message);
    this.code = input.code;
    this.name = "CalendarBlockMutationError";
    this.publicMessage = input.message;
    this.status = input.status;
  }
}

type ResolvedCalendarBlockRange = {
  dateKey: string;
  endAt: Date;
  endTime: string;
  startAt: Date;
  startTime: string;
};

function createMutationError(input: {
  code: string;
  internalMessage?: string;
  message: string;
  status: number;
}) {
  return new CalendarBlockMutationError(input);
}

function parseDateKeys(rawDates: string) {
  const uniqueDateKeys = Array.from(
    new Set(
      rawDates
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => dateValueSchema.parse(value)),
    ),
  );

  if (!uniqueDateKeys.length) {
    throw createMutationError({
      code: "missing_dates",
      message: "Alege cel putin o zi pentru block.",
      status: 400,
    });
  }

  return uniqueDateKeys.sort((left, right) => left.localeCompare(right));
}

function resolveRangeForDate(input: {
  dateKey: string;
  endTimeRaw: string;
  schedule: ClinicAppointmentSchedule;
  startTimeRaw: string;
  timeMode: z.infer<typeof calendarBlockTimeModeSchema>;
}): ResolvedCalendarBlockRange {
  const workingWindow = getWorkingWindowForDate(input.dateKey, input.schedule);

  if (!workingWindow) {
    throw createMutationError({
      code: "outside_working_hours",
      message: "Una dintre zile nu are program activ in setarile cabinetului.",
      status: 400,
    });
  }

  const startTime =
    input.timeMode === "all_day" ? workingWindow.start : timeValueSchema.parse(input.startTimeRaw);
  const endTime =
    input.timeMode === "all_day" ? workingWindow.end : timeValueSchema.parse(input.endTimeRaw);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes ||
    startMinutes < workingWindow.startMinutes ||
    endMinutes > workingWindow.endMinutes
  ) {
    throw createMutationError({
      code: "invalid_range",
      message: "Alege un interval valid din programul cabinetului.",
      status: 400,
    });
  }

  const startAt = fromBucharestDateTime(input.dateKey, startTime);
  const endAt = fromBucharestDateTime(input.dateKey, endTime);

  return {
    dateKey: input.dateKey,
    endAt,
    endTime,
    startAt,
    startTime,
  };
}

async function assertRangeAvailable(input: {
  endAt: Date;
  excludeBlockId?: string;
  excludeGoogleEventId?: string | null;
  startAt: Date;
}) {
  const supabase = createSupabaseAdminClient();
  const startIso = input.startAt.toISOString();
  const endIso = input.endAt.toISOString();

  const { data: overlappingAppointments, error: appointmentError } = await supabase
    .from("appointments")
    .select("id", { head: false })
    .lt("start_at", endIso)
    .gt("end_at", startIso)
    .in("status", ["pending", "confirmed", "completed"])
    .limit(1);

  if (appointmentError) {
    throw createMutationError({
      code: "appointments_lookup_failed",
      internalMessage: appointmentError.message,
      message: "Nu am putut verifica programarile existente.",
      status: 500,
    });
  }

  if (overlappingAppointments?.length) {
    throw createMutationError({
      code: "appointment_overlap",
      message: "Intervalul selectat se suprapune peste o programare existenta.",
      status: 400,
    });
  }

  let blocksQuery = supabase
    .from("calendar_blocks")
    .select("id", { head: false })
    .lt("start_at", endIso)
    .gt("end_at", startIso)
    .is("archived_at", null)
    .limit(1);

  if (input.excludeBlockId) {
    blocksQuery = blocksQuery.neq("id", input.excludeBlockId);
  }

  const { data: overlappingBlocks, error: blockError } = await blocksQuery;

  if (blockError) {
    throw createMutationError({
      code: "blocks_lookup_failed",
      internalMessage: blockError.message,
      message: "Nu am putut verifica block-urile existente.",
      status: 500,
    });
  }

  if (overlappingBlocks?.length) {
    throw createMutationError({
      code: "block_overlap",
      message: "Intervalul selectat se suprapune peste un alt block din calendar.",
      status: 400,
    });
  }

  const externalBlockingRanges = await listExternalCalendarBlockingRanges({
    from: input.startAt,
    to: input.endAt,
  });

  if (
    externalBlockingRanges.some(
      (range) => input.startAt < range.end && input.endAt > range.start,
    )
  ) {
    throw createMutationError({
      code: "external_overlap",
      message: "Intervalul selectat este deja ocupat in Google Calendar.",
      status: 400,
    });
  }

  if (hasGoogleCalendarEnv()) {
    const googleConflict = await getGoogleCalendarConflictRange({
      endAt: endIso,
      excludeEventId: input.excludeGoogleEventId ?? undefined,
      startAt: startIso,
    });

    if (googleConflict) {
      throw createMutationError({
        code: "google_overlap",
        message: `Intervalul este deja ocupat in Google Calendar${googleConflict.summary ? ` de \"${googleConflict.summary}\"` : "."}`,
        status: 400,
      });
    }
  }
}

export function getCalendarBlockMutationErrorResponse(
  error: unknown,
): CalendarBlockMutationErrorResponse {
  if (error instanceof CalendarBlockMutationError) {
    return {
      code: error.code,
      internalMessage: error.message,
      message: error.publicMessage,
      status: error.status,
    };
  }

  if (error instanceof z.ZodError) {
    const message = error.issues[0]?.message ?? "Datele trimise nu sunt valide.";

    return {
      code: "validation_error",
      internalMessage: message,
      message,
      status: 400,
    };
  }

  return {
    code: "unknown_error",
    internalMessage: error instanceof Error ? error.message : String(error),
    message: "Nu am putut salva block-ul. Verifica datele si incearca din nou.",
    status: 500,
  };
}

export async function saveAdminCalendarBlock(input: {
  adminUserId: string;
  formData: FormData;
}) {
  const id = optionalIdSchema.parse(getText(input.formData, "id").trim() || undefined);
  const dateKeys = parseDateKeys(getText(input.formData, "dates"));
  const timeMode = calendarBlockTimeModeSchema.parse(getText(input.formData, "time_mode"));
  const title = sanitizePlainText(getText(input.formData, "title")).trim();
  const description = sanitizePlainText(getText(input.formData, "description")).trim() || null;
  const blockType = calendarBlockTypeSchema.parse(getText(input.formData, "block_type"));
  const color = calendarBlockColorSchema.parse(getText(input.formData, "color"));
  const startTimeRaw = getText(input.formData, "start_time");
  const endTimeRaw = getText(input.formData, "end_time");

  if (!title) {
    throw createMutationError({
      code: "missing_title",
      message: "Titlul block-ului este obligatoriu.",
      status: 400,
    });
  }

  if (id && dateKeys.length !== 1) {
    throw createMutationError({
      code: "edit_requires_single_date",
      message: "Editarea unui block se face pentru o singura zi.",
      status: 400,
    });
  }

  const clinicSettings = await getClinicSettings();
  const supabase = createSupabaseAdminClient();
  const existingBlock = id
    ? await supabase
        .from("calendar_blocks")
        .select("id, google_event_id")
        .eq("id", id)
        .is("archived_at", null)
        .maybeSingle()
    : null;

  if (id && (existingBlock?.error || !existingBlock?.data)) {
    throw createMutationError({
      code: "missing_block",
      internalMessage: existingBlock?.error?.message,
      message: "Block-ul selectat nu mai exista.",
      status: 404,
    });
  }

  const ranges = dateKeys.map((dateKey) =>
    resolveRangeForDate({
      dateKey,
      endTimeRaw,
      schedule: clinicSettings.appointmentSchedule,
      startTimeRaw,
      timeMode,
    }),
  );

  for (const range of ranges) {
    await assertRangeAvailable({
      endAt: range.endAt,
      excludeBlockId: id,
      excludeGoogleEventId: existingBlock?.data?.google_event_id ?? null,
      startAt: range.startAt,
    });
  }

  const now = new Date().toISOString();
  const savedIds: string[] = [];

  for (const range of ranges) {
    const payload = {
      archived_at: null,
      block_type: blockType,
      blocks_availability: true,
      color,
      description,
      end_at: range.endAt.toISOString(),
      start_at: range.startAt.toISOString(),
      timezone: "Europe/Bucharest",
      title,
      updated_at: now,
    };

    const result = id
      ? await supabase
          .from("calendar_blocks")
          .update(payload)
          .eq("id", id)
          .select("id, google_event_id")
          .single()
      : await supabase
          .from("calendar_blocks")
          .insert({
            ...payload,
            created_at: now,
          })
          .select("id, google_event_id")
          .single();

    if (result.error || !result.data) {
      throw createMutationError({
        code: "save_failed",
        internalMessage: result.error?.message,
        message: "Nu am putut salva block-ul.",
        status: 500,
      });
    }

    const savedId = String(result.data.id);
    savedIds.push(savedId);

    if (hasGoogleCalendarEnv()) {
      try {
        const googleEvent = await createOrUpdateGoogleCalendarEvent({
          description: [
            `Tip: ${blockType}`,
            `Ocupare disponibilitate: Da`,
            description ? `Detalii: ${description}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          endAt: range.endAt.toISOString(),
          eventId: result.data.google_event_id ?? undefined,
          startAt: range.startAt.toISOString(),
          summary: title,
        });

        await supabase
          .from("calendar_blocks")
          .update({
            google_calendar_id: process.env.GOOGLE_CALENDAR_ID ?? null,
            google_event_id: googleEvent.id ?? result.data.google_event_id ?? null,
            last_synced_at: new Date().toISOString(),
            sync_error: null,
            sync_status: "synced",
            updated_at: new Date().toISOString(),
          })
          .eq("id", savedId);
      } catch (error) {
        await supabase
          .from("calendar_blocks")
          .update({
            last_synced_at: new Date().toISOString(),
            sync_error: error instanceof Error ? error.message : String(error),
            sync_status: "needs_retry",
            updated_at: new Date().toISOString(),
          })
          .eq("id", savedId);

        throw createMutationError({
          code: "google_sync_failed",
          internalMessage: error instanceof Error ? error.message : String(error),
          message: "Block-ul a fost salvat local, dar sincronizarea cu Google Calendar a esuat.",
          status: 500,
        });
      }
    }

    await writeAuditLog({
      action: id ? "calendar-block-updated" : "calendar-block-created",
      actorId: input.adminUserId,
      after: {
        blockType,
        color,
        dateKey: getBucharestDateValue(range.startAt),
        description,
        endTime: range.endTime,
        startTime: range.startTime,
        title,
      },
      entityId: savedId,
      entityType: "calendar_block",
    });
  }

  return savedIds;
}

export async function archiveCalendarBlockMutation(input: {
  actorId: string;
  formData: FormData;
}) {
  const id = getText(input.formData, "id");
  const parsedId = z.string().uuid().parse(id);
  const supabase = createSupabaseAdminClient();
  const archivedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("calendar_blocks")
    .update({
      archived_at: archivedAt,
      updated_at: archivedAt,
    })
    .eq("id", parsedId)
    .select("id, title, google_event_id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nu am putut arhiva blocul.");
  }

  if (data.google_event_id) {
    await deleteGoogleCalendarEvent(data.google_event_id);
    await supabase
      .from("calendar_blocks")
      .update({
        google_event_id: null,
        last_synced_at: new Date().toISOString(),
        sync_error: null,
        sync_status: "synced",
      })
      .eq("id", parsedId);
  }

  await writeAuditLog({
    action: "calendar-block-archived",
    actorId: input.actorId,
    after: { archivedAt, title: data.title ?? null },
    entityId: String(data.id),
    entityType: "calendar_block",
  });

  return { id: parsedId };
}
