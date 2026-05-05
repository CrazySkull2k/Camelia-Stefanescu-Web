export type SignedUploadResponse = {
  bucket?: string;
  error?: string;
  ok: boolean;
  publicPath?: string;
  signedUrl?: string;
  storagePath?: string;
  token?: string;
};

async function uploadFileToSignedUrl(file: File, signedUrl: string) {
  const response = await fetch(signedUrl, {
    body: file,
    headers: {
      "cache-control": "max-age=3600",
      "content-type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    method: "PUT",
  });

  if (response.ok) {
    return;
  }

  const body = await response.text().catch(() => "");
  throw new Error(body || "Nu am putut incarca fisierul in storage.");
}

export async function uploadPublicFileWithSignedUrl({
  altText,
  file,
  folder,
  kind,
}: {
  altText?: string;
  file: File;
  folder: "blog-covers" | "site-media";
  kind: string;
}) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Te rog incarca doar fisiere imagine.");
  }

  const signResponse = await fetch("/api/uploads/sign", {
    body: JSON.stringify({ filename: file.name, folder }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const signed = (await signResponse.json()) as SignedUploadResponse;

  if (
    !signResponse.ok ||
    !signed.ok ||
    !signed.bucket ||
    !signed.signedUrl ||
    !signed.storagePath
  ) {
    throw new Error(signed.error ?? "Nu am putut pregati upload-ul.");
  }

  await uploadFileToSignedUrl(file, signed.signedUrl);

  const publicPath = signed.publicPath ?? `${signed.bucket}/${signed.storagePath}`;
  const completeResponse = await fetch("/api/uploads/complete", {
    body: JSON.stringify({
      altText,
      bucket: signed.bucket,
      kind,
      publicPath,
      storagePath: signed.storagePath,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const completed = (await completeResponse.json()) as SignedUploadResponse;

  if (!completeResponse.ok || !completed.ok) {
    throw new Error(
      completed.error ?? "Imaginea a fost incarcata, dar nu a putut fi salvata.",
    );
  }

  return publicPath;
}
