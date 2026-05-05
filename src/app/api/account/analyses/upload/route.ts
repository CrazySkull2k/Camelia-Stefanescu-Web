import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import {
  InvalidOriginError,
  InvalidUploadError,
  RateLimitExceededError,
} from "@/lib/security/errors";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { log } from "@/lib/utils/logger";
import { uploadPatientAnalysis } from "@/modules/patients/analyses";
import {
  getRequestAuditContext,
  writeSecurityAuditEvent,
} from "@/modules/audit/security";
import { getCurrentPatientAccount } from "@/modules/patients/account";

function buildAnalysesRedirect(request: Request, categoryKey: string, input?: {
  error?: string | null;
  uploaded?: boolean;
}) {
  const url = new URL("/cont/analize", request.url);
  url.searchParams.set("tab", "incarcare");
  url.searchParams.set("category", categoryKey);

  if (input?.uploaded) {
    url.searchParams.set("uploaded", "1");
  }

  if (input?.error) {
    url.searchParams.set("error", input.error);
  }

  return url;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const categoryKey = String(formData.get("categoryKey") ?? "");
  const auditContext = getRequestAuditContext(request);

  try {
    assertAllowedOrigin(request.headers.get("origin"), "account");
  } catch (error) {
    await writeSecurityAuditEvent({
      action: "patient.analysis.upload",
      entityType: "patient_analysis_upload",
      ip: auditContext.ip,
      metadata: {
        categoryKey,
        reason: error instanceof Error ? error.message : "origin-mismatch",
      },
      result: "blocked",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.redirect(
      buildAnalysesRedirect(request, categoryKey, {
        error: error instanceof Error ? error.message : "Cerere invalida.",
      }),
      { status: 303 },
    );
  }

  const { user, patient } = await getCurrentPatientAccount();

  if (!user || !patient) {
    return NextResponse.redirect(
      new URL("/cont/autentificare?redirectTo=/cont/analize", request.url),
      { status: 303 },
    );
  }

  try {
    await applyRateLimit({
      identifier: `${user.id}:${request.headers.get("x-forwarded-for") ?? "local"}`,
      key: "account:analyses:upload",
      max: 10,
      windowMs: 10 * 60 * 1000,
    });

    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new InvalidUploadError("Alege un fisier inainte de incarcare.");
    }

    await uploadPatientAnalysis({
      categoryKey,
      file,
      patientId: patient.id,
      userId: user.id,
    });

    await writeSecurityAuditEvent({
      action: "patient.analysis.upload",
      actorUserId: user.id,
      entityType: "patient_analysis_upload",
      ip: auditContext.ip,
      metadata: {
        categoryKey,
        contentType: file.type || null,
        fileSize: file.size,
      },
      result: "allowed",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    revalidatePath("/cont/analize");

    return NextResponse.redirect(
      buildAnalysesRedirect(request, categoryKey, {
        uploaded: true,
      }),
      { status: 303 },
    );
  } catch (error) {
    log("error", "Failed to upload patient analysis through BFF route", {
      categoryKey,
      error: error instanceof Error ? error.message : String(error),
      patientId: patient.id,
      userId: user.id,
    });

    await writeSecurityAuditEvent({
      action: "patient.analysis.upload",
      actorUserId: user.id,
      entityType: "patient_analysis_upload",
      ip: auditContext.ip,
      metadata: {
        categoryKey,
        reason: error instanceof Error ? error.message : String(error),
      },
      result:
        error instanceof InvalidOriginError || error instanceof RateLimitExceededError
          ? "blocked"
          : error instanceof InvalidUploadError
            ? "failed"
            : "failed",
      surface: "account",
      userAgent: auditContext.userAgent,
    });

    return NextResponse.redirect(
      buildAnalysesRedirect(request, categoryKey, {
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut incarca analiza.",
      }),
      { status: 303 },
    );
  }
}
