export function sanitizeOrderFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getOrderBlobPathname(orderId: string, fileName: string): string {
  return `orders/${orderId}/${sanitizeOrderFileName(fileName)}`;
}

export function pathnameMatchesOrderFile(
  orderId: string,
  pathname: string,
  orderFileName: string
): boolean {
  if (!isAllowedOrderBlobPathname(orderId, pathname)) {
    return false;
  }

  const expected = getOrderBlobPathname(orderId, orderFileName);
  if (pathname === expected) return true;

  const uploadedBase = pathname.slice(`orders/${orderId}/`.length);
  return uploadedBase === sanitizeOrderFileName(orderFileName);
}

export function toOrderFileDownloadUrl(orderId: string): string {
  return `/api/orders/${orderId}/file`;
}

export function isVercelBlobUrl(fileUrl: string): boolean {
  return fileUrl.includes(".blob.vercel-storage.com");
}

export function isAllowedOrderBlobPathname(
  orderId: string,
  pathname: string
): boolean {
  const prefix = `orders/${orderId}/`;
  return pathname.startsWith(prefix) && pathname.length > prefix.length;
}
