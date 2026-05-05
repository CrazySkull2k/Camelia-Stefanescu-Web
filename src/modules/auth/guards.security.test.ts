import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
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
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: mockMembershipFrom,
  }),
}));

describe("admin guards hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

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
});
