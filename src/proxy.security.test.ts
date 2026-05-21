import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSupabaseSession: vi.fn(async () => NextResponse.next()),
}));

describe("surface CSP hardening", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

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

  it("redirects account subdomain root into the patient dashboard", async () => {
    vi.stubEnv("ACCOUNT_HOSTNAME", "cont.example.com");

    const { proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://cont.example.com/"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://cont.example.com/cont/dashboard",
    );
  });

  it("keeps public pages canonical on the public host instead of the account host", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.stubEnv("ACCOUNT_HOSTNAME", "cont.example.com");

    const { proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://cont.example.com/programare?service=nutritie"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/programare?service=nutritie",
    );
  });

  it("keeps account routes on the account host", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.stubEnv("ACCOUNT_HOSTNAME", "cont.example.com");

    const { proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://cont.example.com/cont/dashboard"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-camelia-surface")).toBe("account");
  });

  it("redirects admin subdomain root into the admin panel", async () => {
    vi.stubEnv("ADMIN_HOSTNAME", "admin.example.com");

    const { proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://admin.example.com/"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://admin.example.com/admin");
  });
});
