import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { mapOrder } from "@/lib/orders/map-order";
import { prisma } from "@/lib/prisma";
import type { CreateOrderPayload } from "@/types/order";
import type { DeliveryMethod } from "@/types/delivery";

const DELIVERY_METHODS = new Set<string>(["pickup", "zasilkovna"]);

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
    typeof payload.printCostCzk === "number" &&
    payload.printCostCzk >= 0 &&
    typeof payload.deliveryMethod === "string" &&
    DELIVERY_METHODS.has(payload.deliveryMethod) &&
    typeof payload.deliveryPriceCzk === "number" &&
    payload.deliveryPriceCzk >= 0 &&
    (payload.zasilkovnaPointId === undefined ||
      typeof payload.zasilkovnaPointId === "string")
  );
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let where = {};

    if (user.role === "customer") {
      where = { customerId: user.id };
    } else if (user.role === "maker") {
      if (!user.makerId) {
        return NextResponse.json({ orders: [] });
      }
      where = { makerId: user.makerId };
    }

    const orders = await prisma.order.findMany({
      where,
      include: { maker: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      orders: orders.map(mapOrder),
      role: user.role,
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

    if (maker.status !== "available") {
      return NextResponse.json(
        { error: "Maker is not available" },
        { status: 409 }
      );
    }

    if (
      maker.minOrderPriceCzk > 0 &&
      body.printCostCzk < maker.minOrderPriceCzk
    ) {
      return NextResponse.json(
        {
          error: `Minimum print order for this maker is ${maker.minOrderPriceCzk} CZK`,
        },
        { status: 400 }
      );
    }

    const deliveryMethod = body.deliveryMethod as DeliveryMethod;

    if (deliveryMethod === "pickup" && body.deliveryPriceCzk !== 0) {
      return NextResponse.json(
        { error: "Pickup orders must have zero delivery price" },
        { status: 400 }
      );
    }

    if (deliveryMethod === "zasilkovna" && body.deliveryPriceCzk <= 0) {
      return NextResponse.json(
        { error: "Zásilkovna delivery price is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        makerId: body.makerId,
        customerId: (await getSession())?.userId ?? null,
        fileName: body.fileName,
        weightGrams: body.weightGrams,
        widthMm: body.widthMm,
        heightMm: body.heightMm,
        depthMm: body.depthMm,
        printCostCzk: body.printCostCzk,
        deliveryMethod,
        deliveryPriceCzk: body.deliveryPriceCzk,
        zasilkovnaPointId: body.zasilkovnaPointId ?? null,
      },
      include: { maker: true },
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
