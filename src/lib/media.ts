const PUBLIC_STORAGE_PREFIX = /^(site-media|blog-covers)\//;

export function resolvePublicMediaUrl(path?: string | null) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path) || path.startsWith("/")) {
    return path;
  }

  if (PUBLIC_STORAGE_PREFIX.test(path) && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
  }

  return `/${path.replace(/^\/+/, "")}`;
}
