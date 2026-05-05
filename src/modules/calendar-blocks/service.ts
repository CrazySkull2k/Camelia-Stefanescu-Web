import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/logger";

export type CalendarBlockType = "admin" | "clinic_work" | "personal" | "unavailable";
export type CalendarBlockColor = "cream" | "peach" | "sage" | "stone";

export type CalendarBlock = {
  archivedAt: string | null;
  blockType: CalendarBlockType;
  blocksAvailability: boolean;
  color: CalendarBlockColor;
  createdAt: string;
  description: string | null;
  endAt: string;
  googleCalendarId: string | null;
  googleEventId: string | null;
  id: string;
  lastSyncedAt: string | null;
  startAt: string;
  syncError: string | null;
  syncStatus: "failed" | "needs_retry" | "pending" | "synced";
  timezone: string;
  title: string;
  updatedAt: string;
};

type CalendarBlockRow = {
  archived_at: string | null;
  block_type: CalendarBlockType;
  blocks_availability: boolean;
  color: CalendarBlockColor;
  created_at: string;
  description: string | null;
  end_at: string;
  google_calendar_id?: string | null;
  google_event_id?: string | null;
  id: string;
  last_synced_at?: string | null;
  start_at: string;
  sync_error?: string | null;
  sync_status?: "failed" | "needs_retry" | "pending" | "synced";
  timezone: string;
  title: string;
  updated_at: string;
};

function isMissingCalendarBlocksTable(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.message?.toLowerCase().includes('relation "calendar_blocks"')
  );
}

function isMissingCalendarBlockSyncColumns(error: { code?: string; message?: string }) {
  return (
    error.code === "42703" &&
    /calendar_blocks\.(google_calendar_id|google_event_id|sync_status|sync_error|last_synced_at)/i.test(
      error.message ?? "",
    )
  );
}

function mapCalendarBlock(row: CalendarBlockRow): CalendarBlock {
  return {
    archivedAt: row.archived_at,
    blockType: row.block_type,
    blocksAvailability: row.blocks_availability,
    color: row.color,
    createdAt: row.created_at,
    description: row.description,
    endAt: row.end_at,
    googleCalendarId: row.google_calendar_id ?? null,
    googleEventId: row.google_event_id ?? null,
    id: row.id,
    lastSyncedAt: row.last_synced_at ?? null,
    startAt: row.start_at,
    syncError: row.sync_error ?? null,
    syncStatus: row.sync_status ?? "pending",
    timezone: row.timezone,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

export async function listCalendarBlocks(input: {
  from: Date;
  includeArchived?: boolean;
  to: Date;
}) {
  const supabase = createSupabaseAdminClient();
  function baseQuery(selectColumns: string) {
    let query = supabase
      .from("calendar_blocks")
      .select(selectColumns)
      .lt("start_at", input.to.toISOString())
      .gt("end_at", input.from.toISOString())
      .order("start_at", { ascending: true });

    if (!input.includeArchived) {
      query = query.is("archived_at", null);
    }

    return query;
  }

  const selectWithSync =
    "id, title, description, block_type, start_at, end_at, timezone, color, blocks_availability, google_calendar_id, google_event_id, sync_status, sync_error, last_synced_at, created_at, updated_at, archived_at";
  const legacySelect =
    "id, title, description, block_type, start_at, end_at, timezone, color, blocks_availability, created_at, updated_at, archived_at";

  const { data, error } = await baseQuery(selectWithSync);

  if (error && isMissingCalendarBlockSyncColumns(error)) {
    log("warn", "calendar_blocks Google sync columns are missing; run migration 0015_calendar_blocks_google_sync.sql", {
      code: error.code,
      message: error.message,
    });

    const fallbackResult = await baseQuery(legacySelect);

    if (fallbackResult.error) {
      throw new Error(fallbackResult.error.message);
    }

    return ((fallbackResult.data ?? []) as unknown as CalendarBlockRow[]).map(
      mapCalendarBlock,
    );
  }

  if (error) {
    if (isMissingCalendarBlocksTable(error)) {
      log("warn", "calendar_blocks table is missing; calendar blocks are disabled until migration runs", {
        code: error.code,
        message: error.message,
      });
      return [];
    }

    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as CalendarBlockRow[]).map(mapCalendarBlock);
}

export async function listAvailabilityBlockingRanges(input: {
  from: Date;
  to: Date;
}) {
  const blocks = await listCalendarBlocks({
    from: input.from,
    to: input.to,
  });

  return blocks
    .filter((block) => block.blocksAvailability)
    .map((block) => ({
      end: new Date(block.endAt),
      id: block.id,
      start: new Date(block.startAt),
      title: block.title,
    }));
}
