/** Client uploads (handleUpload) require a read-write token — OIDC is not enough. */
export function getBlobReadWriteToken(): string | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token || undefined;
}

export function isClientBlobUploadEnabled(): boolean {
  return Boolean(getBlobReadWriteToken());
}

/** Server-side put/get may use OIDC on Vercel when the store is linked. */
export function isServerBlobStorageEnabled(): boolean {
  return Boolean(
    getBlobReadWriteToken() ||
      process.env.VERCEL_OIDC_TOKEN ||
      process.env.BLOB_STORE_ID
  );
}
