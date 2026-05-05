import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/middleware";

type AppSurface = "admin" | "account" | "public";

function resolveSurface(pathname: string): AppSurface {
  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  if (pathname.startsWith("/cont")) {
    return "account";
  }

  return "public";
}

function normalizeHost(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function getRequestedHost(request: NextRequest) {
  return normalizeHost(
    request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      request.nextUrl.host,
  );
}

function getExpectedHostForSurface(surface: AppSurface) {
  if (surface === "admin") {
    return normalizeHost(process.env.ADMIN_HOSTNAME);
  }

  if (surface === "account") {
    return normalizeHost(process.env.ACCOUNT_HOSTNAME);
  }

  return null;
}

function matchesHost(requestHost: string | null, expectedHost: string | null) {
  if (!requestHost || !expectedHost) {
    return true;
  }

  return requestHost === expectedHost || requestHost.startsWith(`${expectedHost}:`);
}

function buildSurfaceRedirect(request: NextRequest, host: string) {
  const url = request.nextUrl.clone();
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedProto) {
    url.protocol = `${forwardedProto.replace(/:$/, "")}:`;
  }

  url.host = host;
  return url;
}

function isSameOriginFrameAllowed(surface: AppSurface, pathname: string) {
  return surface === "admin" && /^\/admin\/content\/[^/]+\/preview$/.test(pathname);
}

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function joinDirectiveSources(sources: Array<string | null | undefined>) {
  return Array.from(new Set(sources.filter(Boolean))).join(" ");
}

function buildContentSecurityPolicy(surface: AppSurface, pathname: string) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const supabaseOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const sameOriginFrameAllowed = isSameOriginFrameAllowed(surface, pathname);
  const scriptSrc = joinDirectiveSources([
    "'self'",
    "'unsafe-inline'",
    isDevelopment ? "'unsafe-eval'" : null,
    surface === "public" ? "https://challenges.cloudflare.com" : null,
  ]);
  const connectSrc = joinDirectiveSources([
    "'self'",
    surface === "public" ? "https://challenges.cloudflare.com" : null,
    isDevelopment ? "http:" : null,
    isDevelopment ? "https:" : null,
    isDevelopment ? "ws:" : null,
    isDevelopment ? "wss:" : null,
  ]);
  const imgSrc = joinDirectiveSources([
    "'self'",
    "data:",
    "blob:",
    "https://lh3.googleusercontent.com",
    supabaseOrigin,
  ]);
  const mediaSrc = joinDirectiveSources([
    "'self'",
    "blob:",
    surface === "public" ? "data:" : null,
    supabaseOrigin,
  ]);
  const frameSrc = joinDirectiveSources([
    "'self'",
    surface === "public" ? "https://challenges.cloudflare.com" : null,
    surface === "public" ? "https://www.youtube-nocookie.com" : null,
  ]);
  const basePolicy = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src ${imgSrc}`,
    `connect-src ${connectSrc}`,
    `frame-src ${frameSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    `frame-ancestors ${sameOriginFrameAllowed ? "'self'" : "'none'"}`,
    "form-action 'self'",
  ];

  basePolicy.push(`media-src ${mediaSrc}`);

  return basePolicy.join("; ");
}

function applySurfaceSecurityHeaders(response: NextResponse, surface: AppSurface, pathname: string) {
  const sameOriginFrameAllowed = isSameOriginFrameAllowed(surface, pathname);
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(surface, pathname));
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");
  response.headers.set("Origin-Agent-Cluster", "?1");
  response.headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  response.headers.set("Referrer-Policy", surface === "public" ? "strict-origin-when-cross-origin" : "no-referrer");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", sameOriginFrameAllowed ? "SAMEORIGIN" : "DENY");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  if (surface === "admin" || surface === "account") {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  }
}

export async function proxy(request: NextRequest) {
  const surface = resolveSurface(request.nextUrl.pathname);
  const expectedHost = getExpectedHostForSurface(surface);
  const requestedHost = getRequestedHost(request);

  if (expectedHost && !matchesHost(requestedHost, expectedHost)) {
    return NextResponse.redirect(buildSurfaceRedirect(request, expectedHost));
  }

  const response = await updateSupabaseSession(request);
  const finalResponse =
    response instanceof NextResponse ? response : NextResponse.next({ request });

  finalResponse.headers.set("x-camelia-surface", surface);
  applySurfaceSecurityHeaders(finalResponse, surface, request.nextUrl.pathname);
  return finalResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|legacy/).*)"],
};
