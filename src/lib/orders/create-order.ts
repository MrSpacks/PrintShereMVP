import type { CreateOrderPayload, OrderResponse } from "@/types/order";
import type { DeliveryChoice } from "@/types/delivery";
import type { ModelData } from "@/types/model";
import type { Maker, PrinterType } from "@/types/maker";
import { LEGAL_DOCS_VERSION } from "@/lib/legal/constants";
import { getMakerQuoteWeightGrams } from "@/lib/map/pricing";
import { getOrderBlobPathname } from "@/lib/orders/order-file-paths";

export function buildOrderPayload(
  maker: Maker,
  model: ModelData,
  delivery: DeliveryChoice,
  printerType: PrinterType,
  consents: {
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
    acceptedCustomManufacture: boolean;
  }
): CreateOrderPayload {
  const { stats, fileName } = model;
  const weightGrams =
    getMakerQuoteWeightGrams(stats.volumeCm3, maker, printerType) ??
    stats.weightGrams;

  return {
    makerId: maker.id,
    fileName,
    weightGrams,
    widthMm: stats.dimensions.width,
    heightMm: stats.dimensions.height,
    depthMm: stats.dimensions.depth,
    deliveryMethod: delivery.method === "delivery" ? "delivery" : "pickup",
    printerType,
    acceptedTerms: consents.acceptedTerms,
    acceptedPrivacy: consents.acceptedPrivacy,
    acceptedCustomManufacture: consents.acceptedCustomManufacture,
    legalDocsVersion: LEGAL_DOCS_VERSION,
  };
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<OrderResponse> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Failed to create order");
  }

  return response.json() as Promise<OrderResponse>;
}

export async function uploadOrderModelFile(
  orderId: string,
  file: File,
  orderFileName?: string
): Promise<void> {
  const modeResponse = await fetch("/api/orders/upload-mode");
  const modeData = (await modeResponse.json()) as { mode?: string };
  const blobFileName = orderFileName ?? file.name;

  if (modeData.mode === "blob-client") {
    const { upload } = await import("@vercel/blob/client");
    const pathname = getOrderBlobPathname(orderId, blobFileName);

    let blob;
    try {
      blob = await upload(pathname, file, {
        access: "private",
        handleUploadUrl: `/api/orders/${orderId}/file/upload`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Blob upload failed";
      throw new Error(message);
    }

    const confirmResponse = await fetch(`/api/orders/${orderId}/file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl: blob.url }),
    });

    if (!confirmResponse.ok) {
      const body = (await confirmResponse.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(body?.error ?? "Failed to confirm model upload");
    }

    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/orders/${orderId}/file`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Failed to upload model file");
  }
}
