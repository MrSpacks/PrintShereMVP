import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ORDERS_STORAGE_DIR = path.join(process.cwd(), "storage", "orders");

export function getOrderFileAbsolutePath(
  orderId: string,
  fileName: string
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(ORDERS_STORAGE_DIR, orderId, safeName);
}

export async function saveOrderModelFile(
  orderId: string,
  fileName: string,
  buffer: Buffer
): Promise<string> {
  const absolutePath = getOrderFileAbsolutePath(orderId, fileName);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return `/api/orders/${orderId}/file`;
}
