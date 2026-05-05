import { SetupNotice } from "@/components/admin/setup-notice";
import { hasServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils/dates";

export default async function MediaPage() {
  if (!hasServerEnv()) {
    return <SetupNotice />;
  }

  const supabase = createSupabaseAdminClient();
  const { data: assets } = await supabase
    .from("media_assets")
    .select("id, bucket_name, storage_path, alt_text, kind, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="admin-card p-6">
        <h2 className="text-xl font-semibold text-[var(--admin-text)]">Biblioteca media</h2>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">
          Biblioteca foloseste `media_assets` pentru evidenta si `/api/uploads/sign` pentru
          upload securizat in bucket-urile publice.
        </p>
      </div>

      <div className="admin-card overflow-hidden p-4">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Bucket</th>
              <th>Fisier</th>
              <th>Alt text</th>
              <th>Tip</th>
              <th>Creat</th>
            </tr>
          </thead>
          <tbody>
            {assets?.length ? (
              assets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.bucket_name}</td>
                  <td>{asset.storage_path}</td>
                  <td>{asset.alt_text ?? "—"}</td>
                  <td>{asset.kind ?? "—"}</td>
                  <td>{formatDateTime(asset.created_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-sm text-[var(--admin-muted)]" colSpan={5}>
                  Nu exista active inregistrate inca.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
