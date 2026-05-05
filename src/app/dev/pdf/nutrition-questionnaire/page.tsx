import Link from "next/link";
import { notFound } from "next/navigation";

import { normalizeNutritionQuestionnairePreviewVariant } from "@/modules/pdf/nutrition-questionnaire-preview";

const previewVariants = {
  default: {
    cta: "Preview standard",
    description:
      "Payload-ul moderat actual, bun pentru o citire editoriala rapida.",
    label: "Standard",
  },
  stress: {
    cta: "Preview stress test",
    description:
      "Payload foarte incarcat, cu multe randuri si texte lungi, pentru a vedea unde cedeaza designul.",
    label: "Stress test",
  },
} as const;

export default async function NutritionQuestionnairePdfPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string | string[] | undefined }>;
}) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const selectedVariant = normalizeNutritionQuestionnairePreviewVariant(
    resolvedSearchParams.variant,
    "stress",
  );
  const documentHref = `/dev/pdf/nutrition-questionnaire/document?variant=${selectedVariant}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-stone-50 px-6 py-10 text-stone-900">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
          Dev Preview
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900">
          Preview PDF: Chestionar evaluare nutritionala
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-stone-600">
          Ruta asta foloseste exact renderer-ul PDF nou, cu un payload local de test.
          Nu scrie in baza de date si nu atinge flow-ul real de submit.
        </p>
        <div className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
          Varianta activa: {previewVariants[selectedVariant].label}
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {(Object.entries(previewVariants) as Array<
          [keyof typeof previewVariants, (typeof previewVariants)[keyof typeof previewVariants]]
        >).map(([variant, config]) => {
          const isActive = variant === selectedVariant;

          return (
            <Link
              className={`rounded-[24px] border px-5 py-4 transition ${
                isActive
                  ? "border-stone-900 bg-stone-900 text-white shadow-[0_18px_40px_rgba(28,25,23,0.14)]"
                  : "border-stone-200 bg-white text-stone-800 hover:border-stone-400"
              }`}
              href={`/dev/pdf/nutrition-questionnaire?variant=${variant}`}
              key={variant}
            >
              <p className="text-sm font-semibold tracking-tight">{config.cta}</p>
              <p
                className={`mt-1 text-sm leading-6 ${
                  isActive ? "text-stone-200" : "text-stone-600"
                }`}
              >
                {config.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
          href={documentHref}
          target="_blank"
        >
          Deschide PDF-ul intr-un tab nou
        </Link>
        <a
          className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-500 hover:text-stone-900"
          href={documentHref}
        >
          Incarca direct documentul
        </a>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_24px_60px_rgba(28,25,23,0.08)]">
        <iframe
          className="h-[1200px] w-full bg-white"
          src={documentHref}
          title="Preview PDF chestionar nutritional"
        />
      </section>
    </main>
  );
}
