import { NextResponse } from "next/server";

import { assertAllowedOrigin } from "@/lib/security/origin";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { submitNutritionQuestionnaire } from "@/modules/forms/service";

type FormSubmitRouteProps = {
  params: Promise<{ formKey: string }>;
};

export async function POST(request: Request, { params }: FormSubmitRouteProps) {
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
    await submitNutritionQuestionnaire(formData);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Nu am putut salva formularul.",
      },
      { status: 400 },
    );
  }
}
