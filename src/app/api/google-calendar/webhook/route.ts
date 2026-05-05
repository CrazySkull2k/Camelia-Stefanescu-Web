import { NextResponse } from "next/server";

import { log } from "@/lib/utils/logger";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import {
  recordGoogleCalendarNotification,
  runGoogleCalendarIncrementalSync,
} from "@/modules/google-calendar-sync/service";

export async function POST(request: Request) {
  const auditContext = getRequestAuditContext(request);
  const channelId = request.headers.get("x-goog-channel-id");
  const channelToken = request.headers.get("x-goog-channel-token");
  const messageNumber = request.headers.get("x-goog-message-number");
  const resourceId = request.headers.get("x-goog-resource-id");
  const resourceState = request.headers.get("x-goog-resource-state");

  try {
    const notification = await recordGoogleCalendarNotification({
      channelId,
      channelToken,
      messageNumber,
      resourceId,
    });

    if (!notification.ok) {
      await writeSecurityAuditEvent({
        action: "webhook.google_calendar",
        entityType: "google_calendar_watch",
        ip: auditContext.ip,
        metadata: {
          channelId,
          reason: notification.reason,
          resourceId,
          resourceState,
        },
        result: "blocked",
        surface: "system",
        userAgent: auditContext.userAgent,
      });

      log("warn", "Rejected Google Calendar webhook notification", {
        channelId,
        reason: notification.reason,
        resourceId,
      });

      return NextResponse.json({ ok: false }, { status: 403 });
    }

    if (resourceState !== "sync") {
      await runGoogleCalendarIncrementalSync();
    }

    await writeSecurityAuditEvent({
      action: "webhook.google_calendar",
      entityType: "google_calendar_watch",
      ip: auditContext.ip,
      metadata: {
        channelId,
        resourceId,
        resourceState,
      },
      result: "allowed",
      surface: "system",
      userAgent: auditContext.userAgent,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "webhook.google_calendar",
      entityType: "google_calendar_watch",
      ip: auditContext.ip,
      metadata: {
        channelId,
        reason: error instanceof Error ? error.message : String(error),
        resourceId,
        resourceState,
      },
      result: "failed",
      surface: "system",
      userAgent: auditContext.userAgent,
    });

    log("error", "Google Calendar webhook sync failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
