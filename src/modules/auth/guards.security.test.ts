import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockGetAuthenticatorAssuranceLevel = vi.fn();
const mockMembershipEq = vi.fn();
const mockMembershipSelect = vi.fn();
const mockMembershipFrom = vi.fn();

vi.mock("@/lib/env/server", () => ({
  hasServerEnv: () => true,
}));

vi.mock("@/lib/security/admin-allowlist", () => ({
  hasConfiguredAdminAllowlist: vi.fn(() => true),
  isAdminEmailAllowlisted: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: mockGetUser,
      mfa: {
        getAuthenticatorAssuranceLevel: mockGetAuthenticatorAssuranceLevel,
      },
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: mockMembershipFrom,
  }),
}));

describe("admin guards hardening", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const allowlist = await import("@/lib/security/admin-allowlist");
    vi.mocked(allowlist.hasConfiguredAdminAllowlist).mockReturnValue(true);
    vi.mocked(allowlist.isAdminEmailAllowlisted).mockReturnValue(true);

    mockMembershipEq.mockResolvedValue({
      data: [{ role: "owner" }],
    });
    mockMembershipSelect.mockReturnValue({ eq: mockMembershipEq });
    mockMembershipFrom.mockReturnValue({ select: mockMembershipSelect });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          app_metadata: { provider: "google", providers: ["google"] },
          email: "owner@example.com",
          id: "user-1",
          identities: [{ provider: "google" }],
        },
      },
    });
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: {
        currentAuthenticationMethods: [{ method: "totp" }],
        currentLevel: "aal2",
        nextLevel: "aal2",
      },
    });
  });

  it("denies admin access when email is not allowlisted", async () => {
    const allowlist = await import("@/lib/security/admin-allowlist");
    vi.mocked(allowlist.isAdminEmailAllowlisted).mockReturnValue(false);

    const { getOptionalAdminUser } = await import("@/modules/auth/guards");

    await expect(getOptionalAdminUser()).resolves.toBeNull();
  });

  it("denies owner-only PHI access to non-owner roles", async () => {
    mockMembershipEq.mockResolvedValue({
      data: [{ role: "staff_admin" }],
    });

    const { getOptionalOwnerAdminUser } = await import("@/modules/auth/guards");

    await expect(getOptionalOwnerAdminUser()).resolves.toBeNull();
  });

  it("denies aal2-only access when the admin session is not elevated", async () => {
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: {
        currentAuthenticationMethods: [],
        currentLevel: "aal1",
        nextLevel: "aal2",
      },
    });

    const { getOptionalAdminAal2User } = await import("@/modules/auth/guards");

    await expect(getOptionalAdminAal2User()).resolves.toBeNull();
  });

  it("allows aal2-only access when the admin session is elevated", async () => {
    const { getOptionalAdminAal2User } = await import("@/modules/auth/guards");

    await expect(getOptionalAdminAal2User()).resolves.toMatchObject({
      id: "user-1",
    });
  });
});
