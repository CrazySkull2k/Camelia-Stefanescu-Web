import Link from "next/link";
import { notFound } from "next/navigation";

import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { resolveStoredQuestionnairePayload } from "@/lib/security/encrypted-payload";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils/dates";
import { requireOwnerAdminUser } from "@/modules/auth/guards";

type FormDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FormDetailPage({ params }: FormDetailPageProps) {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  await requireOwnerAdminUser();

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: submission } = await supabase
    .from("form_submissions")
    .select(
      "id, submitted_at, status, payload_json, payload_encrypted, patient_id, appointment_id, patients(full_name), generated_documents(id, storage_bucket, storage_path)",
    )
    .eq("id", id)
    .single();

  if (!submission) {
    notFound();
  }

  const generatedDocument = Array.isArray(submission.generated_documents)
    ? submission.generated_documents[0]
    : submission.generated_documents;
  const documentHref =
    generatedDocument?.storage_bucket && generatedDocument.storage_path
      ? `/admin/forms/${submission.id}/document`
      : null;

  let payloadPreview: unknown = {};
  let payloadPreviewError: string | null = null;

  try {
    payloadPreview = resolveStoredQuestionnairePayload({
      payloadEncrypted: submission.payload_encrypted,
      payloadJson: submission.payload_json,
    });
  } catch (error) {
    payloadPreviewError =
      error instanceof Error
        ? error.message
        : "Nu am putut decripta payload-ul evaluarii nutritionale.";
  }

  return (
    <div className="admin-card p-6">
      <h2 className="text-2xl font-semibold text-[var(--admin-text)]">
        Evaluare nutritionala #{submission.id}
      </h2>
      <p className="mt-2 text-sm text-[var(--admin-muted)]">
        Pacient: {(submission.patients as { full_name?: string } | null)?.full_name ?? "Pacient"}
        {" · "}Status: {submission.status}
        {" · "}Data: {formatDateTime(submission.submitted_at)}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {submission.patient_id ? (
          <Link className="admin-btn" href={`/admin/patients/${submission.patient_id}`}>
            Deschide pacientul
          </Link>
        ) : null}
        {submission.appointment_id ? (
          <Link className="admin-btn" href={`/admin/appointments/${submission.appointment_id}`}>
            Deschide programarea
          </Link>
        ) : null}
        {documentHref ? (
          <a className="admin-btn" href={documentHref} rel="noreferrer" target="_blank">
            Deschide PDF
          </a>
        ) : null}
      </div>
      <pre className="mt-6 overflow-auto rounded-3xl bg-slate-950/95 p-5 text-xs text-slate-100">
        {payloadPreviewError ?? JSON.stringify(payloadPreview, null, 2)}
      </pre>
    </div>
  );
}
