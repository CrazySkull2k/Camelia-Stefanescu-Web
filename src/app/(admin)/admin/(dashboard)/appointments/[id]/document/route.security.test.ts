import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApplyRateLimit = vi.fn();
const mockWriteSecurityAuditEvent = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockStreamPrivateStorageFile = vi.fn();
const mockGetCurrentSessionUser = vi.fn();
const mockGetOptionalOwnerAdminUser = vi.fn();
const mockEq = vi.fn();
const mockQueryBuilder = {
  eq: mockEq,
  maybeSingle: mockMaybeSingle,
};

vi.mock("@/lib/env/server", () => ({
  hasServerEnv: () => true,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  applyRateLimit: mockApplyRateLimit,
}));

vi.mock("@/lib/http/private-file-response", () => ({
  streamPrivateStorageFile: mockStreamPrivateStorageFile,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/modules/audit/security", () => ({
  getRequestAuditContext: () => ({
    ip: "127.0.0.1",
    userAgent: "vitest",
  }),
  writeSecurityAuditEvent: mockWriteSecurityAuditEvent,
}));

vi.mock("@/modules/auth/guards", () => ({
  getCurrentSessionUser: mockGetCurrentSessionUser,
  getOptionalOwnerAdminUser: mockGetOptionalOwnerAdminUser,
}));

describe("admin appointment document route hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockEq.mockReturnValue(mockQueryBuilder);
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it("redirects unauthenticated admins to login", async () => {
    mockGetCurrentSessionUser.mockResolvedValue(null);
    mockGetOptionalOwnerAdminUser.mockResolvedValue(null);

    const { GET } = await import(
      "@/app/(admin)/admin/(dashboard)/appointments/[id]/document/route"
    );
    const response = await GET(
      new Request("https://example.com/admin/appointments/test/document"),
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/admin/login");
  });

  it("returns 404 for authenticated non-owner admins", async () => {
    mockGetCurrentSessionUser.mockResolvedValue({ id: "staff-1" });
    mockGetOptionalOwnerAdminUser.mockResolvedValue(null);

    const { GET } = await import(
      "@/app/(admin)/admin/(dashboard)/appointments/[id]/document/route"
    );
    const response = await GET(
      new Request("https://example.com/admin/appointments/test/document"),
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      },
    );

    expect(response.status).toBe(404);
  });

  it("streams inline for owner admins without redirecting to storage", async () => {
    mockGetCurrentSessionUser.mockResolvedValue({ id: "owner-1" });
    mockGetOptionalOwnerAdminUser.mockResolvedValue({ id: "owner-1" });
    mockMaybeSingle.mockResolvedValue({
      data: {
        generated_documents: {
          storage_bucket: "private",
          storage_path: "appointments/a1/intake.pdf",
        },
        id: "appointment-1",
      },
    });
    mockStreamPrivateStorageFile.mockResolvedValue(
      new Response("pdf", { status: 200 }),
    );

    const { GET } = await import(
      "@/app/(admin)/admin/(dashboard)/appointments/[id]/document/route"
    );
    const response = await GET(
      new Request("https://example.com/admin/appointments/test/document"),
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
