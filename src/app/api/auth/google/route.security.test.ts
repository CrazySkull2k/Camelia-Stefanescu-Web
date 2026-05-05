import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  InvalidOriginError,
  RateLimitExceededError,
} from "@/lib/security/errors";

const mockAssertAllowedOrigin = vi.fn();
const mockApplyRateLimit = vi.fn();
const mockWriteSecurityAuditEvent = vi.fn();

vi.mock("@/lib/env/server", () => ({
  hasSupabaseEnv: () => true,
}));

vi.mock("@/lib/security/origin", () => ({
  assertAllowedOrigin: mockAssertAllowedOrigin,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  applyRateLimit: mockApplyRateLimit,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseMutableServerClient: async () => ({
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { url: "https://accounts.google.com/o/oauth2/v2/auth" },
        error: null,
      }),
    },
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
  getCurrentSessionUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/utils/logger", () => ({
  log: vi.fn(),
}));

describe("google auth init hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rejects invalid origins", async () => {
    mockAssertAllowedOrigin.mockImplementation(() => {
      throw new InvalidOriginError("Origin mismatch.");
    });

    const { POST } = await import("@/app/api/auth/google/route");
    const response = await POST(
      new Request("https://example.com/api/auth/google", {
        body: JSON.stringify({ redirectTo: "/admin" }),
        headers: {
          "Content-Type": "application/json",
          origin: "https://evil.example",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 429 when auth init is rate limited", async () => {
    mockAssertAllowedOrigin.mockImplementation(() => {});
    mockApplyRateLimit.mockRejectedValue(
      new RateLimitExceededError("Prea multe incercari."),
    );

    const { POST } = await import("@/app/api/auth/google/route");
    const response = await POST(
      new Request("https://example.com/api/auth/google", {
        body: JSON.stringify({ redirectTo: "/admin" }),
        headers: {
          "Content-Type": "application/json",
          origin: "https://example.com",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(429);
  });
});
