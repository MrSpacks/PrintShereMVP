import type { CreateOrderPayload, OrderResponse } from "@/types/order";
import type { DeliveryChoice } from "@/types/delivery";
import type { ModelData } from "@/types/model";
import type { Maker } from "@/types/maker";

export function buildOrderPayload(
  maker: Maker,
  model: ModelData,
  delivery: DeliveryChoice
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
  file: File
): Promise<void> {
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
