import { NextResponse } from "next/server";

import { log } from "@/lib/utils/logger";
import {
  recordGoogleCalendarNotification,
  runGoogleCalendarIncrementalSync,
} from "@/modules/google-calendar-sync/service";

export async function POST(request: Request) {
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

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    log("error", "Google Calendar webhook sync failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
