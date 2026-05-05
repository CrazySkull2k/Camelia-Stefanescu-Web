import { redirect } from "next/navigation";

import { PatientAccountShell } from "@/components/site/patient-account-shell";
import { hasSupabaseEnv } from "@/lib/env/server";
import { getCurrentPatientAccount } from "@/modules/patients/account";

function resolveDisplayName(input: {
  patientName?: string | null;
  userEmail?: string | null;
  metadataName?: string | null;
}) {
  if (input.patientName?.trim()) {
    return input.patientName.trim();
  }

  if (input.metadataName?.trim()) {
    return input.metadataName.trim();
  }

  if (input.userEmail) {
    return input.userEmail.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Pacient";
  }

  return "Pacient";
}

function resolveAvatarUrl(user: Awaited<ReturnType<typeof getCurrentPatientAccount>>["user"]) {
  if (!user) {
    return null;
  }

  const avatar =
    user.user_metadata.avatar_url ??
    user.user_metadata.picture ??
    user.user_metadata.photo_url;

  return typeof avatar === "string" && avatar.trim() ? avatar : null;
}

export default async function PatientAccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!hasSupabaseEnv()) {
    redirect("/cont/autentificare?error=Supabase%20nu%20este%20configurat.");
  }

  const { user, patient } = await getCurrentPatientAccount();

  if (!user) {
    redirect("/cont/autentificare?redirectTo=/cont/dashboard");
  }

  return (
    <PatientAccountShell
      avatarUrl={resolveAvatarUrl(user)}
      displayName={resolveDisplayName({
        patientName: patient?.full_name ?? null,
        userEmail: user.email ?? null,
        metadataName: String(
          user.user_metadata.full_name ?? user.user_metadata.name ?? "",
        ),
      })}
      email={user.email ?? null}
    >
      {children}
    </PatientAccountShell>
  );
}
