import type { CreateOrderPayload, OrderResponse } from "@/types/order";
import type { DeliveryChoice } from "@/types/delivery";
import type { ModelData } from "@/types/model";
import type { Maker, PrinterType } from "@/types/maker";
import { getOrderBlobPathname } from "@/lib/orders/order-file-paths";

export function buildOrderPayload(
  maker: Maker,
  model: ModelData,
  delivery: DeliveryChoice,
  printerType: PrinterType
): CreateOrderPayload {
  const { stats, fileName } = model;

  return {
    makerId: maker.id,
    fileName,
    weightGrams: stats.weightGrams,
    widthMm: stats.dimensions.width,
    heightMm: stats.dimensions.height,
    depthMm: stats.dimensions.depth,
    deliveryMethod: delivery.method,
    zasilkovnaPointId: delivery.zasilkovnaPointId,
    zasilkovnaPointLabel: delivery.zasilkovnaPointLabel,
    printerType,
  };
}

export async function fetchZasilkovnaQuote(
  makerId: string,
  weightGrams: number
): Promise<number> {
  const response = await fetch("/api/delivery/zasilkovna/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ makerId, weightGrams }),
  });

  if (!response.ok) {
    throw new Error("Failed to calculate Zásilkovna delivery");
  }

  const data = (await response.json()) as { priceCzk: number };
  return data.priceCzk;
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
