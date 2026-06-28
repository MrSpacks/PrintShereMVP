import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import {
  getOrderBlobPathname,
  isAllowedOrderBlobPathname,
  isOrderBlobStorageEnabled,
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

  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  if (!isOrderCustomer(access)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return notFound();

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAllowedOrderBlobPathname(params.id, pathname)) {
          throw new Error("Invalid upload path");
        }

        const expectedPath = getOrderBlobPathname(params.id, order.fileName);
        if (pathname !== expectedPath) {
          throw new Error("Upload path does not match order file name");
        }

        if (order.fileUrl) {
          throw new Error("Model file already uploaded");
        }

        return {
          allowedContentTypes: [
            "application/octet-stream",
            "model/stl",
            "application/sla",
            "application/vnd.ms-pki.stl",
            "text/plain",
            "model/obj",
            "application/obj",
          ],
          maximumSizeInBytes: MAX_MODEL_FILE_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ orderId: params.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload ?? "{}") as { orderId?: string };
        if (payload.orderId !== params.id) {
          throw new Error("Upload token payload mismatch");
        }

        await prisma.order.update({
          where: { id: params.id },
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
