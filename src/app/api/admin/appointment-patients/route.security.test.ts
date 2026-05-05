import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApplyRateLimit = vi.fn();
const mockSearchAdminPatients = vi.fn();
const mockGetCurrentSessionUser = vi.fn();
const mockGetOptionalOwnerAdminAal2User = vi.fn();

vi.mock("@/modules/auth/guards", () => ({
  getCurrentSessionUser: mockGetCurrentSessionUser,
  getOptionalOwnerAdminAal2User: mockGetOptionalOwnerAdminAal2User,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  applyRateLimit: mockApplyRateLimit,
}));

vi.mock("@/modules/appointments/admin-wizard", () => ({
  createAdminPatientForAppointmentWizard: vi.fn(),
  searchAdminAppointmentPatientsForWizard: mockSearchAdminPatients,
}));

vi.mock("@/lib/security/origin", () => ({
  assertAllowedOrigin: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/utils/logger", () => ({
  log: vi.fn(),
}));

describe("admin appointment patient search hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSearchAdminPatients.mockResolvedValue({ data: [], ok: true });
  });

  it("returns 401 when there is no admin session", async () => {
    mockGetCurrentSessionUser.mockResolvedValue(null);
    mockGetOptionalOwnerAdminAal2User.mockResolvedValue(null);

    const { GET } = await import("@/app/api/admin/appointment-patients/route");
    const response = await GET(
      new Request("https://example.com/api/admin/appointment-patients?q=ana"),
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when admin is authenticated but not owner", async () => {
    mockGetCurrentSessionUser.mockResolvedValue({ id: "staff-1" });
    mockGetOptionalOwnerAdminAal2User.mockResolvedValue(null);

    const { GET } = await import("@/app/api/admin/appointment-patients/route");
    const response = await GET(
      new Request("https://example.com/api/admin/appointment-patients?q=ana"),
    );

    expect(response.status).toBe(404);
  });
});
