import { NextResponse } from "next/server";
import { Resend } from "resend";

import { getResendEnv, hasResendEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!hasResendEnv()) {
    return NextResponse.json({ ok: true });
  }

  const env = getResendEnv();
  const payload = await request.text();

  if (!env.RESEND_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY) as Resend & {
      webhooks: {
        verify(input: {
          payload: string;
          headers: { id: string; timestamp: string; signature: string };
          webhookSecret: string;
        }): { type: string; data?: unknown };
      };
    };
    const event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
    });

    const supabase = createSupabaseAdminClient();
    const relatedMessageId =
      "data" in event && event.data && typeof event.data === "object"
        ? String((event.data as { email_id?: string }).email_id ?? "")
        : "";

    if (relatedMessageId) {
      await supabase
        .from("email_messages")
        .update({
          status: event.type,
          provider_payload: event,
        })
        .eq("provider_message_id", relatedMessageId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid webhook",
      },
      { status: 400 },
    );
  }
}
