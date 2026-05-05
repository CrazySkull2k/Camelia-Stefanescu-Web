import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import { submitNutritionQuestionnaire } from "@/modules/forms/service";

type FormSubmitRouteProps = {
  params: Promise<{ formKey: string }>;
};

export async function POST(request: Request, { params }: FormSubmitRouteProps) {
  const auditContext = getRequestAuditContext(request);

  try {
    assertAllowedOrigin(request.headers.get("origin"), "public");

    const { formKey } = await params;
    if (formKey !== "nutrition-intake") {
      return NextResponse.json({ ok: false, error: "Formular inexistent." }, { status: 404 });
    }

    await applyRateLimit({
      key: "forms:nutrition-intake",
      identifier: request.headers.get("x-forwarded-for") ?? "local",
      max: 5,
      windowMs: 15 * 60 * 1000,
    });

    const formData = await request.formData();
    const result = await submitNutritionQuestionnaire(formData);

    await writeSecurityAuditEvent({
      action: "form.nutrition_intake.submit",
      entityId: result.submissionId,
      entityType: "form_submission",
      ip: auditContext.ip,
      result: "allowed",
      surface: "public",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "form.nutrition_intake.submit",
      entityType: "form_submission",
      ip: auditContext.ip,
      metadata: {
        reason: error instanceof Error ? error.message : String(error),
      },
      result:
        error instanceof Error && error.name === "InvalidOriginError"
          ? "blocked"
          : error instanceof Error && error.name === "RateLimitExceededError"
            ? "blocked"
            : "failed",
      surface: "public",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Nu am putut salva formularul.",
      },
      { status: 400 },
    );
  }
}
