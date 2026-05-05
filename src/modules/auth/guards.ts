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

type AssuranceLevel = "aal1" | "aal2" | null;

type AuthenticationMethod = {
  method?: string;
  timestamp?: number;
};

export type AdminAuthAssurance = {
  canElevateToAal2: boolean;
  currentAuthenticationMethods: AuthenticationMethod[];
  currentLevel: AssuranceLevel;
  isAal2: boolean;
  nextLevel: AssuranceLevel;
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

function normalizeAssuranceLevel(value: unknown): AssuranceLevel {
  return value === "aal1" || value === "aal2" ? value : null;
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

export async function getAdminAuthAssurance(): Promise<AdminAuthAssurance> {
  if (!hasServerEnv()) {
    return {
      canElevateToAal2: false,
      currentAuthenticationMethods: [],
      currentLevel: null,
      isAal2: false,
      nextLevel: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error || !data) {
    return {
      canElevateToAal2: false,
      currentAuthenticationMethods: [],
      currentLevel: null,
      isAal2: false,
      nextLevel: null,
    };
  }

  const currentLevel = normalizeAssuranceLevel(data.currentLevel);
  const nextLevel = normalizeAssuranceLevel(data.nextLevel);

  return {
    canElevateToAal2: nextLevel === "aal2",
    currentAuthenticationMethods: Array.isArray(data.currentAuthenticationMethods)
      ? (data.currentAuthenticationMethods as AuthenticationMethod[])
      : [],
    currentLevel,
    isAal2: currentLevel === "aal2",
    nextLevel,
  };
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

export async function getOptionalAdminAal2User() {
  const user = await getOptionalAdminUser();
  if (!user) {
    return null;
  }

  const assurance = await getAdminAuthAssurance();
  if (!assurance.isAal2) {
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

export async function requireAdminAal2User() {
  const user = await requireAdminUser();
  const assurance = await getAdminAuthAssurance();

  if (!assurance.isAal2) {
    redirect("/admin/mfa");
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

export async function getOptionalOwnerAdminAal2User() {
  const user = await getOptionalOwnerAdminUser();
  if (!user) {
    return null;
  }

  const assurance = await getAdminAuthAssurance();
  if (!assurance.isAal2) {
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

export async function requireOwnerAdminAal2User() {
  const user = await getOptionalOwnerAdminUser();

  if (!user) {
    notFound();
  }

  const assurance = await getAdminAuthAssurance();
  if (!assurance.isAal2) {
    redirect("/admin/mfa");
  }

  return user;
}
