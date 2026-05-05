import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApplyRateLimit = vi.fn();
const mockWriteSecurityAuditEvent = vi.fn();
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockStreamPrivateStorageFile = vi.fn();

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

describe("patient analysis download route hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it("returns 404 for unauthorized or missing analysis ids", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null });

    const { GET } = await import(
      "@/app/(account)/cont/analize/document/[id]/download/route"
    );
    const response = await GET(
      new Request("https://example.com/cont/analize/document/test/download"),
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      },
    );

    expect(response.status).toBe(404);
  });
});
