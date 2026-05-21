import { afterEach, describe, expect, it, vi } from "vitest";

import { InvalidOriginError } from "@/lib/security/errors";
import { assertAllowedOrigin } from "@/lib/security/origin";

describe("origin allowlist", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows the www alias for the public site", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://cameliastefanescu.ro");

    expect(() =>
      assertAllowedOrigin("https://www.cameliastefanescu.ro", "public"),
    ).not.toThrow();
  });

  it("allows account origin for booking endpoints without allowing admin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://cameliastefanescu.ro");
    vi.stubEnv("ACCOUNT_HOSTNAME", "cont.cameliastefanescu.ro");
    vi.stubEnv("ADMIN_HOSTNAME", "admin.cameliastefanescu.ro");

    expect(() =>
      assertAllowedOrigin(
        "https://cont.cameliastefanescu.ro",
        "public-or-account",
      ),
    ).not.toThrow();
    expect(() =>
      assertAllowedOrigin(
        "https://admin.cameliastefanescu.ro",
        "public-or-account",
      ),
    ).toThrow(InvalidOriginError);
  });
});
