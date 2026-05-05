import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { prerender } from "react-dom/static";
import type { ReactElement } from "react";

import { NutritionQuestionnaireMeasurementTemplate } from "@/components/pdf/nutrition-questionnaire-measurement-template";
import { NutritionQuestionnaireSimplePdfTemplate } from "@/components/pdf/nutrition-questionnaire-simple-template";
import { NutritionQuestionnairePdfTemplate } from "@/components/pdf/nutrition-questionnaire-template";
import {
  measureQuestionnairePdfLayout,
  renderHtmlToPdf,
} from "@/modules/pdf/browser";
import {
  buildNutritionQuestionnairePdfDocumentModel,
  buildNutritionQuestionnairePdfModel,
} from "@/modules/pdf/nutrition-questionnaire-pdf-model";
import { paginateNutritionQuestionnairePdfDocument } from "@/modules/pdf/nutrition-questionnaire-pagination";

export type NutritionQuestionnairePdfVariant = "styled" | "simple";

type EmbeddedFontSource = {
  family: string;
  fileName: string;
  style: "normal" | "italic";
  weight: number;
};

const embeddedFonts: EmbeddedFontSource[] = [
  {
    family: "Newsreader PDF",
    fileName: "newsreader-latin-ext-400-normal.woff2",
    style: "normal",
    weight: 400,
  },
  {
    family: "Newsreader PDF",
    fileName: "newsreader-latin-ext-400-italic.woff2",
    style: "italic",
    weight: 400,
  },
  {
    family: "Newsreader PDF",
    fileName: "newsreader-latin-ext-500-normal.woff2",
    style: "normal",
    weight: 500,
  },
  {
    family: "Newsreader PDF",
    fileName: "newsreader-latin-ext-500-italic.woff2",
    style: "italic",
    weight: 500,
  },
  {
    family: "Newsreader PDF",
    fileName: "newsreader-latin-ext-600-normal.woff2",
    style: "normal",
    weight: 600,
  },
  {
    family: "Manrope PDF",
    fileName: "manrope-latin-ext-400-normal.woff2",
    style: "normal",
    weight: 400,
  },
  {
    family: "Manrope PDF",
    fileName: "manrope-latin-ext-500-normal.woff2",
    style: "normal",
    weight: 500,
  },
  {
    family: "Manrope PDF",
    fileName: "manrope-latin-ext-600-normal.woff2",
    style: "normal",
    weight: 600,
  },
  {
    family: "Manrope PDF",
    fileName: "manrope-latin-ext-700-normal.woff2",
    style: "normal",
    weight: 700,
  },
];

let cachedFontFacesPromise: Promise<string> | null = null;

async function streamToString(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: string[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      return chunks.join("");
    }

    chunks.push(Buffer.from(value).toString("utf8"));
  }
}

function resolveFontPath(fileName: string) {
  const packageName = fileName.startsWith("newsreader")
    ? "@fontsource/newsreader"
    : "@fontsource/manrope";

  return join(process.cwd(), "node_modules", packageName, "files", fileName);
}

async function getEmbeddedFontFacesCss() {
  if (cachedFontFacesPromise) {
    return cachedFontFacesPromise;
  }

  cachedFontFacesPromise = Promise.all(
    embeddedFonts.map(async (font) => {
      const fileBuffer = await readFile(resolveFontPath(font.fileName));
      const dataUri = `data:font/woff2;base64,${fileBuffer.toString("base64")}`;

      return `
        @font-face {
          font-family: "${font.family}";
          src: url("${dataUri}") format("woff2");
          font-style: ${font.style};
          font-weight: ${font.weight};
          font-display: swap;
        }
      `;
    }),
  ).then((rules) => rules.join("\n"));

  return cachedFontFacesPromise;
}

async function renderTemplateToHtml(template: ReactElement) {
  const { prelude } = await prerender(template);
  return "<!DOCTYPE html>" + (await streamToString(prelude));
}

export async function renderNutritionQuestionnairePdf(input: {
  patientName: string;
  payload: Record<string, unknown>;
  reference: string;
  submittedAt: string;
  variant?: NutritionQuestionnairePdfVariant;
}) {
  const fontFacesCss = await getEmbeddedFontFacesCss();

  if (input.variant === "simple") {
    const model = buildNutritionQuestionnairePdfModel({
      patientName: input.patientName,
      payload: input.payload,
      reference: input.reference,
      submittedAt: input.submittedAt,
    });
    const html = await renderTemplateToHtml(
      <NutritionQuestionnaireSimplePdfTemplate
        fontFacesCss={fontFacesCss}
        model={model}
      />,
    );

    return renderHtmlToPdf(html);
  }

  const documentModel = buildNutritionQuestionnairePdfDocumentModel({
    patientName: input.patientName,
    payload: input.payload,
    reference: input.reference,
    submittedAt: input.submittedAt,
  });
  const measurementHtml = await renderTemplateToHtml(
    <NutritionQuestionnaireMeasurementTemplate
      fontFacesCss={fontFacesCss}
      model={documentModel}
    />,
  );
  const measurements = await measureQuestionnairePdfLayout(measurementHtml);
  const model = paginateNutritionQuestionnairePdfDocument(
    documentModel,
    measurements,
  );
  const html = await renderTemplateToHtml(
    <NutritionQuestionnairePdfTemplate fontFacesCss={fontFacesCss} model={model} />,
  );

  return renderHtmlToPdf(html);
}
