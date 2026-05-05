import Link from "next/link";

import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils/dates";
import { requireOwnerAdminUser } from "@/modules/auth/guards";

function formatFormStatusLabel(value: string) {
  if (value === "submitted") return "Trimis";
  if (value === "draft") return "Ciorna";
  if (value === "reviewed") return "Revizuit";
  return value;
}

export default async function FormsPage() {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  await requireOwnerAdminUser();

  const supabase = createSupabaseAdminClient();
  const { data: forms } = await supabase
    .from("form_submissions")
    .select("id, submitted_at, status, patients(full_name)")
    .order("submitted_at", { ascending: false })
    .limit(100);

  return (
    <div className="admin-card overflow-hidden p-4">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Pacient</th>
            <th>Status</th>
            <th>Data</th>
            <th>Detalii</th>
          </tr>
        </thead>
        <tbody>
          {forms?.map((form) => (
            <tr key={form.id}>
              <td>{(form.patients as { full_name?: string } | null)?.full_name ?? "Pacient"}</td>
              <td>{formatFormStatusLabel(form.status)}</td>
              <td>{formatDateTime(form.submitted_at)}</td>
              <td>
                <Link href={`/admin/forms/${form.id}`}>Deschide</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
