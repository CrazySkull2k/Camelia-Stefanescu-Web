import "server-only";

import { notFound, redirect } from "next/navigation";

import { hasServerEnv } from "@/lib/env/server";
import { hasConfiguredAdminAllowlist, isAdminEmailAllowlisted } from "@/lib/security/admin-allowlist";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ADMIN_ROLES = new Set(["owner", "staff_admin", "editor"]);
const OWNER_ADMIN_ROLES = new Set(["owner"]);

type AdminMembershipRow = {
  role: string;
};

function isGoogleIdentityUser(user: NonNullable<Awaited<ReturnType<typeof getCurrentSessionUser>>>) {
  const providers = Array.isArray(user.app_metadata.providers)
    ? user.app_metadata.providers
    : [];

  if (providers.includes("google")) {
    return true;
  }

  if (user.app_metadata.provider === "google") {
    return true;
  }

  return Array.isArray(user.identities)
    ? user.identities.some((identity) => identity.provider === "google")
    : false;
}

async function getMembershipsForUser(userId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { data: memberships } = await adminSupabase
    .from("role_memberships")
    .select("role")
    .eq("user_id", userId);

  return (memberships ?? []) as AdminMembershipRow[];
}

async function getResolvedAdminAccess() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return {
      memberships: [] as AdminMembershipRow[],
      user: null,
    };
  }

  if (!hasConfiguredAdminAllowlist() || !isAdminEmailAllowlisted(user.email)) {
    return {
      memberships: [] as AdminMembershipRow[],
      user: null,
    };
  }

  if (!isGoogleIdentityUser(user)) {
    return {
      memberships: [] as AdminMembershipRow[],
      user: null,
    };
  }

  const memberships = await getMembershipsForUser(user.id);
  return {
    memberships,
    user,
  };
}

export async function getCurrentSessionUser() {
  if (!hasServerEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentAdminUser() {
  if (!hasServerEnv()) {
    return null;
  }

  const { memberships, user } = await getResolvedAdminAccess();

  if (!user) {
    redirect("/admin/login");
  }

  if (!memberships?.some((membership) => ADMIN_ROLES.has(membership.role))) {
    return null;
  }

  return user;
}

export async function getOptionalAdminUser() {
  const { memberships, user } = await getResolvedAdminAccess();
  if (!user) {
    return null;
  }

  if (!memberships?.some((membership) => ADMIN_ROLES.has(membership.role))) {
    return null;
  }

  return user;
}

export async function requireAdminUser() {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/admin/login?error=Contul%20autentificat%20nu%20are%20acces%20admin.");
  }

  return user;
}

export async function getOptionalOwnerAdminUser() {
  const { memberships, user } = await getResolvedAdminAccess();
  if (!user) {
    return null;
  }

  if (!memberships.some((membership) => OWNER_ADMIN_ROLES.has(membership.role))) {
    return null;
  }

  return user;
}

export async function requireOwnerAdminUser() {
  const user = await getOptionalOwnerAdminUser();

  if (!user) {
    notFound();
  }

  return user;
}
