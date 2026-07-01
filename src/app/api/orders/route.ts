import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { isPrinterType } from "@/lib/makers/maker-pricing";
import { mapOrder, mapOrderForViewer } from "@/lib/orders/map-order";
import { calculateOrderPricing } from "@/lib/orders/order-pricing";
import { prisma } from "@/lib/prisma";
import { MOCK_ZASILKOVNA_POINTS } from "@/data/zasilkovna-points";
import type { CreateOrderPayload } from "@/types/order";
import type { DeliveryMethod } from "@/types/delivery";
import {
  canAccessOrdersListView,
  parseOrdersListView,
  type OrdersListView,
} from "@/types/user";

const DELIVERY_METHODS = new Set<string>(["pickup", "zasilkovna"]);
const MOCK_POINT_IDS = new Set(MOCK_ZASILKOVNA_POINTS.map((point) => point.id));

function isValidOrderPayload(body: unknown): body is CreateOrderPayload {
  if (!body || typeof body !== "object") return false;

  const payload = body as Record<string, unknown>;

  return (
    typeof payload.makerId === "string" &&
    typeof payload.fileName === "string" &&
    typeof payload.weightGrams === "number" &&
    payload.weightGrams > 0 &&
    typeof payload.widthMm === "number" &&
    typeof payload.heightMm === "number" &&
    typeof payload.depthMm === "number" &&
    typeof payload.deliveryMethod === "string" &&
    DELIVERY_METHODS.has(payload.deliveryMethod) &&
    (payload.zasilkovnaPointId === undefined ||
      typeof payload.zasilkovnaPointId === "string") &&
    (payload.zasilkovnaPointLabel === undefined ||
      typeof payload.zasilkovnaPointLabel === "string") &&
    typeof payload.printerType === "string" &&
    isPrinterType(payload.printerType)
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { _count: { select: { ownedMakers: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workshopCount = user._count.ownedMakers;
    const userAccess = { makerId: user.makerId, workshopCount };
    const requestedView = parseOrdersListView(
      request.nextUrl.searchParams.get("view")
    );
    const listView: OrdersListView =
      requestedView && canAccessOrdersListView(userAccess, requestedView)
        ? requestedView
        : "customer";

    let where = {};

    if (listView === "customer") {
      where = { customerId: user.id };
    } else {
      const makerId = user.makerId;
      if (!makerId) {
        return NextResponse.json({ orders: [], view: listView });
      }
      where = { makerId };
    }

    const orders = await prisma.order.findMany({
      where,
      include: { maker: true, customer: true },
      orderBy: { createdAt: "desc" },
    });

    const viewerRole = listView === "maker" ? "maker" : "customer";

    return NextResponse.json({
      orders: orders.map((order) => mapOrderForViewer(order, viewerRole)),
      view: listView,
    });
  } catch (error) {
    console.error("[GET /api/orders]", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Log in to place an order" },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();

    if (!isValidOrderPayload(body)) {
      return NextResponse.json(
        { error: "Invalid order payload" },
        { status: 400 }
      );
    }

    const maker = await prisma.maker.findUnique({
      where: { id: body.makerId },
    });

    if (!maker) {
      return NextResponse.json({ error: "Maker not found" }, { status: 404 });
    }

    if (maker.ownerUserId === session.userId) {
      return NextResponse.json(
        { error: "Cannot order from your own workshop" },
        { status: 409 }
      );
    }

    if (maker.status !== "available") {
      return NextResponse.json(
        { error: "Maker is not available" },
        { status: 409 }
      );
    }

    if (!maker.printerTypes.includes(body.printerType)) {
      return NextResponse.json(
        { error: "Maker does not offer this print technology" },
        { status: 400 }
      );
    }

    const deliveryMethod = body.deliveryMethod as DeliveryMethod;

    if (deliveryMethod === "zasilkovna") {
      if (!body.zasilkovnaPointId || !MOCK_POINT_IDS.has(body.zasilkovnaPointId)) {
        return NextResponse.json(
          { error: "Select a Zásilkovna pickup point" },
          { status: 400 }
        );
      }
    }

    const pricing = await calculateOrderPricing(
      maker,
      body.weightGrams,
      deliveryMethod,
      body.printerType
    );

    if (
      maker.minOrderPriceCzk > 0 &&
      pricing.printCostCzk < maker.minOrderPriceCzk
    ) {
      return NextResponse.json(
        {
          error: `Minimum print order for this maker is ${maker.minOrderPriceCzk} CZK`,
        },
        { status: 400 }
      );
    }

    const point = MOCK_ZASILKOVNA_POINTS.find(
      (entry) => entry.id === body.zasilkovnaPointId
    );

    const order = await prisma.order.create({
      data: {
        makerId: body.makerId,
        customerId: session.userId,
        fileName: body.fileName.trim(),
        weightGrams: body.weightGrams,
        widthMm: body.widthMm,
        heightMm: body.heightMm,
        depthMm: body.depthMm,
        printerType: body.printerType,
        printCostCzk: pricing.printCostCzk,
        platformFeeCzk: pricing.platformFeeCzk,
        customerTotalCzk: pricing.customerTotalCzk,
        deliveryMethod,
        deliveryPriceCzk: pricing.deliveryPriceCzk,
        zasilkovnaPointId:
          deliveryMethod === "zasilkovna" ? body.zasilkovnaPointId : null,
        zasilkovnaPointLabel:
          deliveryMethod === "zasilkovna"
            ? (body.zasilkovnaPointLabel ?? point?.label ?? null)
            : null,
      },
      include: { maker: true, customer: true },
    });

    return NextResponse.json(mapOrder(order), { status: 201 });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
