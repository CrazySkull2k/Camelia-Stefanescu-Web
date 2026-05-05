import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminMfaGate } from "@/components/admin/admin-mfa-gate";
import { writeSecurityAuditEvent } from "@/modules/audit/security";
import {
  getAdminAuthAssurance,
  requireAdminUser,
} from "@/modules/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminMfaPage() {
  const user = await requireAdminUser();
  const assurance = await getAdminAuthAssurance();

  if (assurance.isAal2) {
    redirect("/admin");
  }

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  await writeSecurityAuditEvent({
    action: "mfa.admin.required",
    actorUserId: user.id,
    entityType: "auth",
    ip,
    metadata: {
      currentLevel: assurance.currentLevel,
      nextLevel: assurance.nextLevel,
    },
    result: "blocked",
    surface: "admin",
    userAgent: requestHeaders.get("user-agent"),
  });

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4 py-12">
      <AdminMfaGate
        canElevateToAal2={assurance.canElevateToAal2}
        currentLevel={assurance.currentLevel}
        email={user.email ?? null}
      />
    </div>
  );
}
