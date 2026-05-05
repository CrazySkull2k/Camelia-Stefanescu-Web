import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSupabaseSession: vi.fn(async () => NextResponse.next()),
}));

describe("surface CSP hardening", () => {
  it("keeps admin preview as the only same-origin iframe exception", async () => {
    const { proxy } = await import("@/proxy");

    const previewResponse = await proxy(
      new NextRequest("https://example.com/admin/content/home/preview"),
    );
    const adminResponse = await proxy(
      new NextRequest("https://example.com/admin/appointments"),
    );

    expect(previewResponse.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(adminResponse.headers.get("x-frame-options")).toBe("DENY");
  });

  it("does not use broad https/wss wildcards on admin CSP", async () => {
    const { proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://example.com/admin/appointments"),
    );
    const csp = response.headers.get("content-security-policy") ?? "";

    expect(csp).not.toContain("connect-src 'self' https: wss:");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
