import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { get, put } from "@vercel/blob";

import {
  getOrderBlobPathname,
  isVercelBlobUrl,
  sanitizeOrderFileName,
  toOrderFileDownloadUrl,
} from "@/lib/orders/order-file-paths";

export {
  getOrderBlobPathname,
  isAllowedOrderBlobPathname,
  isVercelBlobUrl,
  pathnameMatchesOrderFile,
  toOrderFileDownloadUrl,
} from "@/lib/orders/order-file-paths";

const ORDERS_STORAGE_DIR = path.join(process.cwd(), "storage", "orders");
const MAX_MODEL_FILE_BYTES = 50 * 1024 * 1024;

export function isOrderBlobStorageEnabled(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.VERCEL_OIDC_TOKEN ||
      process.env.BLOB_STORE_ID
  );
}

export function getOrderFileAbsolutePath(orderId: string, fileName: string): string {
  return path.join(
    ORDERS_STORAGE_DIR,
    orderId,
    sanitizeOrderFileName(fileName)
  );
}

export async function saveOrderModelFile(
  orderId: string,
  fileName: string,
  data: Buffer | File
): Promise<string> {
  if (data instanceof File && data.size > MAX_MODEL_FILE_BYTES) {
    throw new Error("File exceeds maximum size");
  }

  if (isOrderBlobStorageEnabled()) {
    const blob = await put(getOrderBlobPathname(orderId, fileName), data, {
      access: "private",
      contentType: "application/octet-stream",
      multipart: true,
    });
    return blob.url;
  }

  const absolutePath = getOrderFileAbsolutePath(orderId, fileName);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer =
    data instanceof File ? Buffer.from(await data.arrayBuffer()) : data;

  if (buffer.byteLength > MAX_MODEL_FILE_BYTES) {
    throw new Error("File exceeds maximum size");
  }

  await writeFile(absolutePath, buffer);
  return toOrderFileDownloadUrl(orderId);
}

export async function readOrderModelFile(
  fileUrl: string,
  fileName: string,
  orderId: string
): Promise<{ buffer: Buffer; contentType: string }> {
  if (isVercelBlobUrl(fileUrl)) {
    const result = await get(fileUrl, { access: "private" });
    if (!result?.stream) {
      throw new Error("Blob not found");
    }

    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: result.blob?.contentType ?? "application/octet-stream",
    };
  }

  const absolutePath = getOrderFileAbsolutePath(orderId, fileName);
  const buffer = await readFile(absolutePath);
  return { buffer, contentType: "application/octet-stream" };
}
