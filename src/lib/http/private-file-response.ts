type StorageDownloadClient = {
  storage: {
    from(bucket: string): {
      download(path: string): Promise<{
        data: Blob | null;
        error: { message?: string } | null;
      }>;
    };
  };
};

function sanitizeFallbackFilename(filename: string, fallback: string) {
  return (
    filename
      .replace(/[^\w.\- ]+/g, "")
      .trim()
      .slice(0, 120) || fallback
  );
}

export function buildContentDisposition(input: {
  disposition: "attachment" | "inline";
  fallbackName: string;
  filename: string;
}) {
  const fallback = sanitizeFallbackFilename(input.filename, input.fallbackName);
  const safeFilename = input.filename.replace(/"/g, "");

  return `${input.disposition}; filename="${fallback.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`;
}

export async function streamPrivateStorageFile(input: {
  bucket: string;
  contentType?: string | null;
  disposition: "attachment" | "inline";
  fallbackName: string;
  filename: string;
  path: string;
  supabase: StorageDownloadClient;
}) {
  const download = await input.supabase.storage
    .from(input.bucket)
    .download(input.path);

  if (download.error || !download.data) {
    return null;
  }

  return new Response(download.data, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": buildContentDisposition({
        disposition: input.disposition,
        fallbackName: input.fallbackName,
        filename: input.filename,
      }),
      "Content-Length": String(download.data.size),
      "Content-Type":
        input.contentType ??
        download.data.type ??
        "application/octet-stream",
    },
  });
}
