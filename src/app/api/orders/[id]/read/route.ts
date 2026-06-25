import { NextResponse } from "next/server";

import {
  getOrderAccess,
  unauthorized,
} from "@/lib/orders/require-order-access";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

export async function POST(_request: Request, { params }: RouteParams) {
  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  await prisma.orderReadReceipt.upsert({
    where: {
      userId_orderId: {
        userId: access.user.id,
        orderId: params.id,
      },
    },
    create: {
      userId: access.user.id,
      orderId: params.id,
      lastReadAt: new Date(),
    },
    update: {
      lastReadAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
