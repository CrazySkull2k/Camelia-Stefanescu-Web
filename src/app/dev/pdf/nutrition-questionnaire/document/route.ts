import { NextResponse } from "next/server";

import { renderNutritionQuestionnairePdf } from "@/modules/pdf/questionnaire-pdf";
import {
  getNutritionQuestionnairePreviewData,
  normalizeNutritionQuestionnairePreviewVariant,
} from "@/modules/pdf/nutrition-questionnaire-preview";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const variant = normalizeNutritionQuestionnairePreviewVariant(
      new URL(request.url).searchParams.get("variant") ?? undefined,
    );
    const preview = getNutritionQuestionnairePreviewData(variant);
    const pdfBuffer = await renderNutritionQuestionnairePdf(preview);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition":
          'inline; filename="nutrition-questionnaire-preview.pdf"',
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nu am putut genera preview-ul PDF.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
