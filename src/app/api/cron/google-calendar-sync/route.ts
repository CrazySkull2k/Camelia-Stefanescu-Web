import { NextResponse } from "next/server";

import { log } from "@/lib/utils/logger";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import { runGoogleCalendarWatcherMaintenance } from "@/modules/google-calendar-sync/service";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-cron-secret");

  return authorization === `Bearer ${secret}` || cronSecret === secret;
}

export async function POST(request: Request) {
  const auditContext = getRequestAuditContext(request);

  if (!isAuthorized(request)) {
    await writeSecurityAuditEvent({
      action: "cron.google_calendar_sync",
      entityType: "google_calendar_watch",
      ip: auditContext.ip,
      metadata: {
        reason: "invalid-secret",
      },
      result: "blocked",
      surface: "system",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.json(
      { message: "Cron secret invalid sau lipsa.", ok: false },
      { status: 401 },
    );
  }

  try {
    const result = await runGoogleCalendarWatcherMaintenance();
    await writeSecurityAuditEvent({
      action: "cron.google_calendar_sync",
      entityType: "google_calendar_watch",
      ip: auditContext.ip,
      metadata: {
        ok: true,
      },
      result: "allowed",
      surface: "system",
      userAgent: auditContext.userAgent,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "cron.google_calendar_sync",
      entityType: "google_calendar_watch",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : "Unknown error",
      },
      result: "failed",
      surface: "system",
      userAgent: auditContext.userAgent,
    });

    log("error", "Google Calendar cron sync failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { message: "Nu am putut sincroniza Google Calendar.", ok: false },
      { status: 500 },
    );
  }
}
