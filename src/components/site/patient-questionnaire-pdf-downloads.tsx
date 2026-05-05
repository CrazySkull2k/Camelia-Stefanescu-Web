'use client'

import { useState } from "react";

type PatientQuestionnairePdfDownloadsProps = {
  submissionId: string;
};

type DownloadVariant = "styled" | "simple";

function getDownloadUrl(submissionId: string, variant: DownloadVariant) {
  return `/cont/chestionar/submission/${submissionId}/pdf?variant=${variant}&download=1`;
}

function getButtonLabel(
  variant: DownloadVariant,
  activeVariant: DownloadVariant | null,
) {
  if (activeVariant !== variant) {
    return variant === "styled" ? "Descarca PDF stilizat" : "Descarca PDF simplu";
  }

  return variant === "styled"
    ? "Se genereaza PDF-ul stilizat..."
    : "Se genereaza PDF-ul simplu...";
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) {
    return null;
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = disposition.match(/filename="([^"]+)"/i);
  if (basicMatch?.[1]) {
    return basicMatch[1];
  }

  return null;
}

export function PatientQuestionnairePdfDownloads({
  submissionId,
}: PatientQuestionnairePdfDownloadsProps) {
  const [activeVariant, setActiveVariant] = useState<DownloadVariant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDownload(variant: DownloadVariant) {
    if (activeVariant) {
      return;
    }

    setActiveVariant(variant);
    setErrorMessage(null);

    try {
      const response = await fetch(getDownloadUrl(submissionId, variant), {
        credentials: "same-origin",
        method: "GET",
      });

      const contentType = response.headers.get("Content-Type") ?? "";
      if (!response.ok || !contentType.toLowerCase().includes("application/pdf")) {
        throw new Error("PDF generation failed");
      }

      const filename =
        getFilenameFromDisposition(response.headers.get("Content-Disposition")) ??
        `chestionar-evaluare-nutritionala-${variant === "styled" ? "stilizat" : "simplu"}.pdf`;

      const pdfBlob = await response.blob();
      const objectUrl = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setErrorMessage(
        "PDF-ul nu a putut fi generat acum. Te rog incearca din nou peste cateva secunde.",
      );
    } finally {
      setActiveVariant(null);
    }
  }

  const isBusy = activeVariant !== null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5f5e5e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#535252] disabled:cursor-wait disabled:opacity-85"
          disabled={isBusy}
          onClick={() => void handleDownload("styled")}
        >
          {activeVariant === "styled" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
          ) : null}
          <span>{getButtonLabel("styled", activeVariant)}</span>
        </button>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#b1b3a9]/20 bg-white px-6 py-3 text-sm font-semibold text-[#31332c] transition hover:bg-[#fff7f3] disabled:cursor-wait disabled:opacity-70"
          disabled={isBusy}
          onClick={() => void handleDownload("simple")}
        >
          {activeVariant === "simple" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#b1b3a9]/35 border-t-[#5f5e5e]" />
          ) : null}
          <span>{getButtonLabel("simple", activeVariant)}</span>
        </button>
      </div>

      {isBusy ? (
        <p className="text-sm text-[#5e6058]">
          Pregatim fisierul pentru descarcare. Poate dura cateva secunde.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="text-sm text-[#8a4332]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
