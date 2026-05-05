import { NextResponse } from "next/server";

import { log } from "@/lib/utils/logger";
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
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { message: "Cron secret invalid sau lipsa.", ok: false },
      { status: 401 },
    );
  }

  try {
    const result = await runGoogleCalendarWatcherMaintenance();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    log("error", "Google Calendar cron sync failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { message: "Nu am putut sincroniza Google Calendar.", ok: false },
      { status: 500 },
    );
  }
}
