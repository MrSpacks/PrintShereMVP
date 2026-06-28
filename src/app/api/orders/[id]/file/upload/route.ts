import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import {
  isOrderBlobStorageEnabled,
  pathnameMatchesOrderFile,
} from "@/lib/orders/order-file-storage";
import {
  getOrderAccess,
  isOrderCustomer,
  notFound,
  unauthorized,
} from "@/lib/orders/require-order-access";
import { prisma } from "@/lib/prisma";

const MAX_MODEL_FILE_BYTES = 50 * 1024 * 1024;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  if (!isOrderBlobStorageEnabled()) {
    return NextResponse.json(
      { error: "Blob uploads are not configured" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return notFound();

  // User session only for client token generation — not for Blob callbacks.
  if (body.type === "blob.generate-client-token") {
    const access = await getOrderAccess(params.id);
    if (!access) return unauthorized();
    if (!isOrderCustomer(access)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathnameMatchesOrderFile(params.id, pathname, order.fileName)) {
          throw new Error("Upload path does not match order file name");
        }

        if (order.fileUrl) {
          throw new Error("Model file already uploaded");
        }

        return {
          maximumSizeInBytes: MAX_MODEL_FILE_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ orderId: params.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload ?? "{}") as {
          orderId?: string;
        };
        if (payload.orderId !== params.id) {
          throw new Error("Upload token payload mismatch");
        }

        await prisma.order.updateMany({
          where: { id: params.id, fileUrl: null },
          data: { fileUrl: blob.url },
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[POST /api/orders/[id]/file/upload]", error);
    const message =
      error instanceof Error ? error.message : "Blob upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
