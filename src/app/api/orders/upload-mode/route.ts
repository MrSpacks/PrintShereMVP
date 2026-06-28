import { NextResponse } from "next/server";

import { isOrderBlobStorageEnabled } from "@/lib/orders/order-file-storage";

export async function GET() {
  return NextResponse.json({
    mode: isOrderBlobStorageEnabled() ? "blob-client" : "server",
  });
}
