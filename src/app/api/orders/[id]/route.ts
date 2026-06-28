import { NextResponse } from "next/server";

import {
  mapOrderForViewer,
  ORDER_DETAIL_INCLUDE,
} from "@/lib/orders/map-order";
import {
  calculatePlatformFeeCzk,
  getCustomerTotalCzk,
} from "@/lib/orders/order-pricing";
import {
  canEditOrderTerms,
  canPerformOrderAction,
  getNextStatusForAction,
} from "@/lib/orders/order-workflow";
import {
  getOrderAccess,
  notFound,
  unauthorized,
} from "@/lib/orders/require-order-access";
import { prisma } from "@/lib/prisma";
import type { OrderAction, UpdateOrderPayload } from "@/types/order";

const PRINT_QUALITIES = new Set<string>(["draft", "standard", "high"]);
const ORDER_ACTIONS = new Set<string>([
  "propose_terms",
  "accept_terms",
  "pay",
  "start_printing",
  "mark_shipped",
  "confirm_receipt",
  "cancel",
]);

interface RouteParams {
  params: { id: string };
}

function isOrderAction(value: string): value is OrderAction {
  return ORDER_ACTIONS.has(value);
}

export async function GET(_request: Request, { params }: RouteParams) {
  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  const full = await prisma.order.findUnique({
    where: { id: params.id },
    include: ORDER_DETAIL_INCLUDE,
  });

  if (!full) return notFound();

  return NextResponse.json({
    order: mapOrderForViewer(full, access.viewerRole),
    viewerRole: access.viewerRole,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payload = body as UpdateOrderPayload;
    const order = await prisma.order.findUnique({ where: { id: params.id } });

    if (!order) return notFound();

    const data: Record<string, unknown> = {};
    const editingTerms =
      payload.weightGrams !== undefined ||
      payload.printCostCzk !== undefined ||
      payload.printQuality !== undefined;

    if (editingTerms && !canEditOrderTerms(order.status)) {
      return NextResponse.json(
        { error: "Order terms can no longer be edited" },
        { status: 409 }
      );
    }

    if (payload.weightGrams !== undefined) {
      if (payload.weightGrams <= 0) {
        return NextResponse.json({ error: "Invalid weight" }, { status: 400 });
      }
      data.weightGrams = payload.weightGrams;
    }

    let nextPrintCost = order.printCostCzk;

    if (payload.printCostCzk !== undefined) {
      if (payload.printCostCzk < 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }
      if (access.viewerRole !== "maker" && access.viewerRole !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      nextPrintCost = payload.printCostCzk;
      data.printCostCzk = payload.printCostCzk;
    }

    if (payload.printQuality !== undefined) {
      if (!PRINT_QUALITIES.has(payload.printQuality)) {
        return NextResponse.json({ error: "Invalid quality" }, { status: 400 });
      }
      data.printQuality = payload.printQuality;
    }

    if (editingTerms) {
      const platformFeeCzk = calculatePlatformFeeCzk(nextPrintCost);
      data.platformFeeCzk = platformFeeCzk;
      data.customerTotalCzk = getCustomerTotalCzk({
        printCostCzk: nextPrintCost,
        platformFeeCzk,
        deliveryPriceCzk: order.deliveryPriceCzk,
      });
    }

    if (payload.action !== undefined) {
      if (!isOrderAction(payload.action)) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      if (
        !canPerformOrderAction(
          order.status,
          payload.action,
          access.viewerRole
        )
      ) {
        return NextResponse.json(
          { error: "Action not allowed in current state" },
          { status: 409 }
        );
      }

      if (payload.action === "cancel") {
        const isCustomer =
          access.viewerRole === "customer" &&
          order.customerId === access.user.id;
        const isMaker =
          access.viewerRole === "maker" &&
          access.user.makerId === order.makerId;
        if (!isCustomer && !isMaker && access.viewerRole !== "admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      data.status = getNextStatusForAction(payload.action);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data,
      include: ORDER_DETAIL_INCLUDE,
    });

    return NextResponse.json({
      order: mapOrderForViewer(updated, access.viewerRole),
    });
  } catch (error) {
    console.error("[PATCH /api/orders/[id]]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
