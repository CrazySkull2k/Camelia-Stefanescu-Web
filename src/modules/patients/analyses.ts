import "server-only";

import { randomUUID } from "node:crypto";

import { analysisUploadCategories } from "@/content/patient-portal-content";
import { InvalidUploadError } from "@/lib/security/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizePlainText } from "@/lib/validation/sanitize";

export type PatientAnalysisUpload = {
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

type PatientAnalysisUploadRecord = {
  id: string;
  category_key: string;
  category_label: string;
  original_filename: string;
  content_type: string | null;
  file_size: number;
  created_at: string;
};

type AcceptedUploadFormat = {
  contentType: string;
  extensions: string[];
  matchesSignature: (buffer: Buffer) => boolean;
};

const ANALYSES_BUCKET = "patient-analyses";
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_UPLOAD_FORMATS: AcceptedUploadFormat[] = [
  {
    contentType: "application/pdf",
    extensions: [".pdf"],
    matchesSignature: (buffer) =>
      buffer.length >= 5 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46 &&
      buffer[4] === 0x2d,
  },
  {
    contentType: "image/jpeg",
    extensions: [".jpg", ".jpeg"],
    matchesSignature: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    contentType: "image/png",
    extensions: [".png"],
    matchesSignature: (buffer) =>
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a,
  },
  {
    contentType: "image/webp",
    extensions: [".webp"],
    matchesSignature: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

function getUploadCategory(categoryKey: string) {
  return analysisUploadCategories.find(
    (category) => category.key === categoryKey,
  );
}

function sanitizeFilename(filename: string) {
  const sanitized = sanitizePlainText(filename)
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);

  return sanitized || "analiza";
}

function getExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf(".");
  return lastDotIndex >= 0 ? filename.slice(lastDotIndex).toLowerCase() : "";
}

function detectUploadFormat(buffer: Buffer) {
  return ACCEPTED_UPLOAD_FORMATS.find((format) =>
    format.matchesSignature(buffer),
  );
}

function validateUploadFile(input: { file: File; buffer: Buffer }) {
  if (!input.file.size) {
    throw new InvalidUploadError("Alege un fisier inainte de incarcare.");
  }

  if (input.file.size > MAX_FILE_SIZE_BYTES) {
    throw new InvalidUploadError("Fisierul este prea mare. Limita este 15 MB.");
  }

  const detectedFormat = detectUploadFormat(input.buffer);

  if (!detectedFormat) {
    throw new InvalidUploadError(
      "Sunt acceptate doar fisiere PDF, JPG, PNG sau WebP.",
    );
  }

  const extension = getExtension(input.file.name);

  if (!detectedFormat.extensions.includes(extension)) {
    throw new InvalidUploadError(
      "Extensia fisierului nu corespunde tipului detectat.",
    );
  }

  if (
    input.file.type &&
    input.file.type.toLowerCase() !== detectedFormat.contentType
  ) {
    throw new InvalidUploadError(
      "Tipul declarat al fisierului nu corespunde continutului incarcat.",
    );
  }

  return detectedFormat;
}

function mapUpload(record: PatientAnalysisUploadRecord) {
  return {
    id: record.id,
    categoryKey: record.category_key,
    categoryLabel: record.category_label,
    originalFilename: record.original_filename,
    contentType: record.content_type,
    fileSize: record.file_size,
    createdAt: record.created_at,
    previewHref: `/cont/analize/document/${record.id}`,
    downloadHref: `/cont/analize/document/${record.id}/download`,
  } satisfies PatientAnalysisUpload;
}

export async function listPatientAnalysisUploads(patientId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("patient_analysis_uploads")
    .select(
      "id, category_key, category_label, original_filename, content_type, file_size, created_at",
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PatientAnalysisUploadRecord[]).map((record) =>
    mapUpload(record),
  );
}

export async function uploadPatientAnalysis(input: {
  patientId: string;
  userId: string;
  categoryKey: string;
  file: File;
}) {
  const category = getUploadCategory(input.categoryKey);

  if (!category) {
    throw new InvalidUploadError("Categoria de analize nu este valida.");
  }

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const detectedFormat = validateUploadFile({
    buffer,
    file: input.file,
  });

  const supabase = createSupabaseAdminClient();
  const safeFilename = sanitizeFilename(input.file.name);
  const storagePath = `patients/${input.patientId}/${category.key}/${randomUUID()}-${safeFilename}`;
  const upload = await supabase.storage
    .from(ANALYSES_BUCKET)
    .upload(storagePath, buffer, {
      contentType: detectedFormat.contentType,
      upsert: false,
    });

  if (upload.error) {
    throw new Error(upload.error.message);
  }

  const insert = await supabase
    .from("patient_analysis_uploads")
    .insert({
      patient_id: input.patientId,
      uploaded_by: input.userId,
      category_key: category.key,
      category_label: category.label,
      original_filename: input.file.name,
      content_type: detectedFormat.contentType,
      file_size: input.file.size,
      storage_bucket: ANALYSES_BUCKET,
      storage_path: storagePath,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data) {
    await supabase.storage.from(ANALYSES_BUCKET).remove([storagePath]);
    throw new Error(insert.error?.message ?? "Nu am putut salva analiza.");
  }

  return String(insert.data.id);
}
