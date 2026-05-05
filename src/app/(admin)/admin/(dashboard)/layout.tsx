import { AdminShell } from "@/components/admin/admin-shell";
import { hasServerEnv } from "@/lib/env/server";
import { requireAdminUser } from "@/modules/auth/guards";

function getDisplayName(user: Awaited<ReturnType<typeof requireAdminUser>>) {
  const metadataName = String(
    user?.user_metadata.full_name ?? user?.user_metadata.name ?? "",
  ).trim();

  if (metadataName) {
    return metadataName;
  }

  if (user?.email) {
    return user.email.split("@")[0] ?? "Dr. Stefanescu";
  }

  return "Dr. Stefanescu";
}

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let adminUserPreview:
    | {
        avatarUrl?: string | null;
        displayName: string;
        email?: string | null;
      }
    | null = null;

  if (hasServerEnv()) {
    const user = await requireAdminUser();
    adminUserPreview = {
      avatarUrl:
        typeof user.user_metadata.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : typeof user.user_metadata.picture === "string"
            ? user.user_metadata.picture
            : null,
      displayName: getDisplayName(user),
      email: user.email ?? null,
    };
  }

  return <AdminShell adminUser={adminUserPreview}>{children}</AdminShell>;
}
