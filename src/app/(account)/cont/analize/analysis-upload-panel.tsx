"use client";

import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  ShieldPlus,
  UploadCloud,
  X,
} from "lucide-react";

import type {
  AnalysisUploadCategory,
  AnalysisUploadGroup,
} from "@/content/patient-portal-content";

type AnalysisUpload = {
  id: string;
  categoryKey: string;
  categoryLabel: string;
  originalFilename: string;
  contentType: string | null;
  fileSize: number;
  createdAt: string;
  previewHref: string;
  downloadHref: string;
};

type AnalysisUploadPanelProps = {
  groups: AnalysisUploadGroup[];
  uploads: AnalysisUpload[];
  error?: string;
  uploaded?: string;
  initialCategoryKey?: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isPdfUpload(upload: AnalysisUpload) {
  return (
    upload.contentType?.toLowerCase().includes("pdf") ||
    upload.originalFilename.toLowerCase().endsWith(".pdf")
  );
}

function isImageUpload(upload: AnalysisUpload) {
  const filename = upload.originalFilename.toLowerCase();

  return (
    upload.contentType?.toLowerCase().startsWith("image/") ||
    filename.endsWith(".jpg") ||
    filename.endsWith(".jpeg") ||
    filename.endsWith(".png") ||
    filename.endsWith(".webp")
  );
}

function getAllCategories(groups: AnalysisUploadGroup[]) {
  return groups.flatMap((group) =>
    group.categories.map((category) => ({
      ...category,
      groupKey: group.key,
      groupTitle: group.title,
    })),
  );
}

function UploadedFiles({
  uploads,
  compact = false,
  onPreview,
}: {
  uploads: AnalysisUpload[];
  compact?: boolean;
  onPreview: (upload: AnalysisUpload) => void;
}) {
  if (!uploads.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[#b1b3a9]/30 bg-white px-5 py-5 text-sm leading-7 text-[#5e6058]">
        Nu exista fisiere incarcate pentru aceasta categorie.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {uploads.slice(0, compact ? 5 : 10).map((upload) => (
        <article
          key={upload.id}
          className="rounded-[1.35rem] border border-[#b1b3a9]/10 bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#252c28] text-white">
              <FileText className="h-4 w-4 !text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#31332c]">
                {upload.originalFilename}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#797c73]">
                {upload.categoryLabel} - {formatFileSize(upload.fileSize)} -{" "}
                {new Date(upload.createdAt).toLocaleDateString("ro-RO")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                aria-label={`Vezi ${upload.originalFilename}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#252c28] text-white transition hover:bg-[#1d221f]"
                onClick={() => onPreview(upload)}
                title="Vezi analiza"
                type="button"
              >
                <Eye className="h-4 w-4 !text-white" />
              </button>
              <a
                aria-label={`Descarca ${upload.originalFilename}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#252c28] text-white transition hover:bg-[#1d221f]"
                href={upload.downloadHref}
                rel="noreferrer"
                title="Descarca analiza"
              >
                <Download className="h-4 w-4 !text-white" />
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function FilePreviewOverlay({
  upload,
  onClose,
}: {
  upload: AnalysisUpload | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!upload) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, upload]);

  if (!upload) {
    return null;
  }

  const isPdf = isPdfUpload(upload);
  const isImage = isImageUpload(upload);

  return (
    <div
      aria-label="Viewer analiza"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-[#0e0e0c]/80 p-3 backdrop-blur-sm md:p-6"
      role="dialog"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#fbf9f4] shadow-[0px_24px_60px_rgba(14,14,12,0.35)]">
        <header className="flex flex-col gap-4 border-b border-[#b1b3a9]/20 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#797c73]">
              Preview document
            </p>
            <h2 className="mt-1 truncate font-serif text-2xl italic text-[#31332c] md:text-3xl">
              {upload.originalFilename}
            </h2>
            <p className="mt-1 text-xs text-[#797c73]">
              {upload.categoryLabel} - {formatFileSize(upload.fileSize)} -{" "}
              {new Date(upload.createdAt).toLocaleDateString("ro-RO")}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#252c28] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d221f]"
              href={upload.downloadHref}
            >
              <Download className="h-4 w-4 !text-white" />
              Descarca
            </a>
            <button
              aria-label="Inchide preview"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#efeee6] text-[#31332c] transition hover:bg-[#e2e3d9]"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-[#efeee6] p-3 md:p-5">
          <div className="flex h-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-white">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`Preview ${upload.originalFilename}`}
                className="h-full max-h-full w-full max-w-full object-contain"
                src={upload.previewHref}
              />
            ) : isPdf ? (
              <iframe
                className="h-full w-full border-0"
                src={upload.previewHref}
                title={`Preview ${upload.originalFilename}`}
              />
            ) : (
              <div className="max-w-md px-6 text-center">
                <FileText className="mx-auto h-12 w-12 text-[#735a42]" />
                <h3 className="mt-4 font-serif text-2xl italic text-[#31332c]">
                  Preview indisponibil
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#5e6058]">
                  Tipul acestui fisier nu poate fi afisat direct in browser.
                  Poti descarca documentul pentru verificare.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryUploadForm({ categoryKey }: { categoryKey: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function syncFileList(fileList: FileList | null) {
    const file = fileList?.[0] ?? null;

    if (!file) {
      return;
    }

    setSelectedFile(file);

    if (inputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      inputRef.current.files = dataTransfer.files;
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.currentTarget.files?.[0] ?? null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    syncFileList(event.dataTransfer.files);
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleDropzoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFilePicker();
    }
  }

  return (
    <form action="/api/account/analyses/upload" className="mt-8" method="post">
      <input name="categoryKey" type="hidden" value={categoryKey} />
      <input
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="sr-only"
        name="file"
        onChange={handleInputChange}
        ref={inputRef}
        required
        type="file"
      />

      <div
        className={`rounded-[1.75rem] border p-5 transition ${
          dragging
            ? "border-[#735a42]/45 bg-[#fff7f3] shadow-[0px_16px_32px_rgba(101,77,53,0.1)]"
            : "border-[#b1b3a9]/12 bg-[#f5f4ed]"
        }`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={handleDropzoneKeyDown}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[#735a42]">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-[#31332c]">
                Trage fisierul aici sau alege din calculator
              </p>
              <p className="mt-1 max-w-xl text-sm leading-7 text-[#5e6058]">
                Acceptam PDF, JPG, PNG sau WebP. Limita maxima este 15 MB per
                fisier.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#31332c] shadow-[0px_8px_20px_rgba(49,51,44,0.04)] transition hover:bg-[#fff7f3]"
                  onClick={openFilePicker}
                  type="button"
                >
                  Alege fisier
                </button>
                <span className="min-w-0 rounded-full bg-white/70 px-4 py-2 text-sm text-[#5e6058]">
                  {selectedFile ? selectedFile.name : "Niciun fisier selectat"}
                </span>
              </div>
            </div>
          </div>

          <button
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#252c28] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1d221f]"
            type="submit"
          >
            Incarca
          </button>
        </div>
      </div>
    </form>
  );
}

function CompactCategoryButton({
  category,
  active,
  uploadCount,
  onClick,
}: {
  category: AnalysisUploadCategory & { groupKey: string; groupTitle: string };
  active: boolean;
  uploadCount: number;
  onClick: () => void;
}) {
  const isSpecific = category.groupKey === "specifice";

  return (
    <button
      className={`group flex w-full items-center gap-3 rounded-[1rem] border px-3.5 py-3 text-left transition ${
        active
          ? "border-[#f0cfb0] bg-[#ffdcbd] shadow-[0px_10px_20px_rgba(101,77,53,0.08)]"
          : "border-[#b1b3a9]/10 bg-white hover:bg-[#fff7f3]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          uploadCount
            ? "bg-[#3f6a4b]"
            : active
              ? "bg-[#735a42]"
              : "bg-[#b1b3a9]"
        }`}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#31332c]">
          {category.label}
        </span>
        {isSpecific ? (
          <span className="mt-1 inline-flex rounded-full bg-[#f9f3ea] px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-[#735a42]">
            (Specific)
          </span>
        ) : null}
      </span>
      <span
        className={`inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-[0.68rem] font-semibold ${
          uploadCount
            ? "bg-[#edf6ee] text-[#3f6a4b]"
            : "bg-[#efeee6] text-[#5e6058]"
        }`}
        title={uploadCount ? `${uploadCount} fisier(e)` : "Nicio incarcare"}
      >
        {uploadCount}
      </span>
    </button>
  );
}

export function AnalysisUploadPanel({
  groups,
  uploads,
  error,
  uploaded,
  initialCategoryKey,
}: AnalysisUploadPanelProps) {
  const categories = useMemo(() => getAllCategories(groups), [groups]);
  const uploadsByCategory = useMemo(
    () =>
      uploads.reduce<Record<string, AnalysisUpload[]>>((acc, upload) => {
        acc[upload.categoryKey] = [...(acc[upload.categoryKey] ?? []), upload];
        return acc;
      }, {}),
    [uploads],
  );
  const initialCategory =
    categories.find((category) => category.key === initialCategoryKey) ??
    categories[0];
  const [activeCategoryKey, setActiveCategoryKey] = useState(
    initialCategory?.key ?? "",
  );
  const [previewUpload, setPreviewUpload] = useState<AnalysisUpload | null>(
    null,
  );
  const activeCategory =
    categories.find((category) => category.key === activeCategoryKey) ??
    initialCategory;
  const activeUploads = activeCategory
    ? (uploadsByCategory[activeCategory.key] ?? [])
    : [];

  if (!activeCategory) {
    return null;
  }

  return (
    <>
      <div className="grid gap-8 xl:grid-cols-[minmax(18rem,0.78fr)_minmax(0,1.22fr)]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-[#f5f4ed] p-5 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
              Categorii analize
            </p>
            <div className="mt-5 space-y-5">
              {groups.map((group) => (
                <div key={group.key}>
                  <div className="mb-2 flex items-center justify-between gap-3 px-1">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#797c73]">
                      {group.key === "specifice" ? "Specifice" : "Obligatorii"}
                    </p>
                    <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#9e9d99]">
                      {group.categories.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.categories.map((category) => {
                      const enrichedCategory = {
                        ...category,
                        groupKey: group.key,
                        groupTitle: group.title,
                      };

                      return (
                        <CompactCategoryButton
                          active={activeCategory.key === category.key}
                          category={enrichedCategory}
                          key={category.key}
                          onClick={() => setActiveCategoryKey(category.key)}
                          uploadCount={
                            uploadsByCategory[category.key]?.length ?? 0
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#b1b3a9]/10 bg-[#f9f3ea] p-6 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffdcbd] text-[#654d35]">
                <ShieldPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
                  Documente private
                </p>
                <h3 className="mt-1 font-serif text-2xl text-[#31332c]">
                  Acces securizat
                </h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[#5e6058]">
              Fisierele sunt salvate in storage privat si pot fi accesate doar
              prin rute securizate din contul tau.
            </p>
          </div>
        </aside>

        <main className="space-y-6">
          {uploaded ? (
            <div className="flex items-center gap-3 rounded-[1.5rem] border border-[#cfe3d1] bg-[#edf6ee] px-5 py-4 text-sm font-semibold text-[#3f6a4b]">
              <CheckCircle2 className="h-5 w-5" />
              Analiza a fost incarcata cu succes.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-[1.5rem] border border-[#f0b8ad] bg-[#fff3f2] px-5 py-4 text-sm font-semibold text-[#94494a]">
              {error}
            </div>
          ) : null}

          <section className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-8 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
                  {activeCategory.groupTitle}
                </p>
                <h2 className="mt-3 font-serif text-4xl italic leading-none text-[#31332c]">
                  {activeCategory.label}
                </h2>
                {activeCategory.description ? (
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5e6058]">
                    {activeCategory.description}
                  </p>
                ) : null}
              </div>
              <span
                className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                  activeUploads.length
                    ? "bg-[#edf6ee] text-[#3f6a4b]"
                    : "bg-[#efeee6] text-[#5e6058]"
                }`}
              >
                {activeUploads.length
                  ? `${activeUploads.length} fisier(e) incarcate`
                  : "In asteptare"}
              </span>
            </div>

            <CategoryUploadForm categoryKey={activeCategory.key} />
          </section>

          <section className="rounded-[2rem] border border-[#b1b3a9]/10 bg-[#fbf9f4] p-7 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
              Fisiere pentru categoria selectata
            </p>
            <div className="mt-5">
              <UploadedFiles
                onPreview={setPreviewUpload}
                uploads={activeUploads}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#b1b3a9]/10 bg-white p-7 shadow-[0px_12px_32px_rgba(49,51,44,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#797c73]">
              Incarcate recent
            </p>
            <div className="mt-5">
              <UploadedFiles
                compact
                onPreview={setPreviewUpload}
                uploads={uploads}
              />
            </div>
          </section>
        </main>
      </div>

      <FilePreviewOverlay
        onClose={() => setPreviewUpload(null)}
        upload={previewUpload}
      />
    </>
  );
}
