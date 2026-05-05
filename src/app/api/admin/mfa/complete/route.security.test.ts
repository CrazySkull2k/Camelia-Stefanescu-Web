import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAssertAllowedOrigin = vi.fn();
const mockApplyRateLimit = vi.fn();
const mockGetOptionalAdminAal2User = vi.fn();
const mockWriteSecurityAuditEvent = vi.fn();

vi.mock("@/lib/security/origin", () => ({
  assertAllowedOrigin: mockAssertAllowedOrigin,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  applyRateLimit: mockApplyRateLimit,
}));

vi.mock("@/modules/auth/guards", () => ({
  getOptionalAdminAal2User: mockGetOptionalAdminAal2User,
}));

vi.mock("@/modules/audit/security", () => ({
  getRequestAuditContext: () => ({
    ip: "127.0.0.1",
    userAgent: "vitest",
  }),
  writeSecurityAuditEvent: mockWriteSecurityAuditEvent,
}));

describe("admin MFA completion hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockAssertAllowedOrigin.mockReturnValue(undefined);
  });

  it("blocks invalid admin origins", async () => {
    mockAssertAllowedOrigin.mockImplementation(() => {
      throw new Error("invalid-origin");
    });

    const { POST } = await import("@/app/api/admin/mfa/complete/route");
    const response = await POST(
      new Request("https://example.com/api/admin/mfa/complete", {
        headers: {
          origin: "https://evil.example",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(mockWriteSecurityAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "mfa.admin.complete",
        result: "blocked",
      }),
    );
  });

  it("returns 403 when the admin session is not aal2", async () => {
    mockGetOptionalAdminAal2User.mockResolvedValue(null);

    const { POST } = await import("@/app/api/admin/mfa/complete/route");
    const response = await POST(
      new Request("https://example.com/api/admin/mfa/complete", {
        headers: {
          origin: "https://admin.example.com",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    expect(mockApplyRateLimit).not.toHaveBeenCalled();
  });

  it("audits successful aal2 completion", async () => {
    mockGetOptionalAdminAal2User.mockResolvedValue({ id: "admin-1" });

    const { POST } = await import("@/app/api/admin/mfa/complete/route");
    const response = await POST(
      new Request("https://example.com/api/admin/mfa/complete", {
        headers: {
          origin: "https://admin.example.com",
          "x-forwarded-for": "10.0.0.5",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(mockApplyRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "admin-1:10.0.0.5",
        key: "admin:mfa:complete",
      }),
    );
    expect(mockWriteSecurityAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "mfa.admin.complete",
        actorUserId: "admin-1",
        result: "allowed",
      }),
    );
  });
});
