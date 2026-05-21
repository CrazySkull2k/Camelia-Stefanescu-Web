function getFirstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function normalizeProtocol(value: string | null) {
  const protocol = getFirstHeaderValue(value);
  return protocol ? protocol.replace(/:$/, "") : null;
}

function getForwardedHost(request: Request) {
  return (
    getFirstHeaderValue(request.headers.get("x-forwarded-host")) ??
    getFirstHeaderValue(request.headers.get("host"))
  );
}

export function getRequestOrigin(request: Request) {
  const internalUrl = new URL(request.url);
  const protocol =
    normalizeProtocol(request.headers.get("x-forwarded-proto")) ??
    internalUrl.protocol.replace(/:$/, "");
  const host = getForwardedHost(request) ?? internalUrl.host;

  return `${protocol}://${host}`;
}

export function getRequestUrl(request: Request) {
  const internalUrl = new URL(request.url);
  return new URL(`${internalUrl.pathname}${internalUrl.search}`, getRequestOrigin(request));
}

export function buildRequestUrl(request: Request, path: string) {
  return new URL(path, getRequestOrigin(request));
}
