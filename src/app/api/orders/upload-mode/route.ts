import { NextResponse } from "next/server";

import {
  getBlobReadWriteToken,
  isClientBlobUploadEnabled,
  isServerBlobStorageEnabled,
} from "@/lib/orders/blob-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasReadWriteToken = Boolean(getBlobReadWriteToken());

  return NextResponse.json({
    mode: isClientBlobUploadEnabled() ? "blob-client" : "server",
    hasReadWriteToken,
    hasBlobStoreLink: isServerBlobStorageEnabled(),
  });
}
