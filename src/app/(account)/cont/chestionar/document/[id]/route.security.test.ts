import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApplyRateLimit = vi.fn();
const mockWriteSecurityAuditEvent = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockStreamPrivateStorageFile = vi.fn();
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

vi.mock("@/modules/patients/account", () => ({
  getCurrentPatientAccount: vi.fn().mockResolvedValue({
    patient: { id: "patient-1" },
    user: { id: "user-1" },
  }),
}));

describe("patient questionnaire preview route hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockEq.mockReturnValue(mockQueryBuilder);
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it("streams through same-origin response instead of redirecting to storage", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "document-1",
        storage_bucket: "private",
        storage_path: "patients/p1/doc.pdf",
      },
    });
    mockStreamPrivateStorageFile.mockResolvedValue(
      new Response("pdf", {
        headers: {
          "Content-Type": "application/pdf",
        },
        status: 200,
      }),
    );

    const { GET } = await import(
      "@/app/(account)/cont/chestionar/document/[id]/route"
    );
    const response = await GET(
      new Request("https://example.com/cont/chestionar/document/test"),
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(mockStreamPrivateStorageFile).toHaveBeenCalled();
  });
});
