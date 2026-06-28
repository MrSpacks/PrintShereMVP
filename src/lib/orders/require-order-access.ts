import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  hasMakerAccess,
  isAdminUser,
  isModeratorUser,
  type UserRole,
} from "@/types/user";

type OrderWithCustomer = {
  id: string;
  customerId: string | null;
  makerId: string;
  customer: { id: string; name: string } | null;
  maker: { id: string; name: string };
};

async function userOwnsMaker(userId: string, makerId: string): Promise<boolean> {
  const maker = await prisma.maker.findFirst({
    where: { id: makerId, ownerUserId: userId },
    select: { id: true },
  });
  return Boolean(maker);
}

export async function getOrderAccess(orderId: string) {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { _count: { select: { ownedMakers: true } } },
  });

  if (!user) return null;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      maker: true,
      customer: { select: { id: true, name: true } },
    },
  });

  if (!order) return null;

  if (hasMakerAccess(user) && (await userOwnsMaker(user.id, order.makerId))) {
    return {
      user,
      order: order as OrderWithCustomer,
      viewerRole: "maker" as UserRole,
    };
  }

  if (order.customerId === user.id) {
    return {
      user,
      order: order as OrderWithCustomer,
      viewerRole: "customer" as UserRole,
    };
  }

  if (isAdminUser(user)) {
    return {
      user,
      order: order as OrderWithCustomer,
      viewerRole: "admin" as UserRole,
    };
  }

  if (isModeratorUser(user)) {
    return {
      user,
      order: order as OrderWithCustomer,
      viewerRole: "moderator" as UserRole,
    };
  }

  return null;
}

export type OrderAccess = NonNullable<Awaited<ReturnType<typeof getOrderAccess>>>;

/** Customer on this order (uses viewerRole, not legacy user.role). */
export function isOrderCustomer(access: OrderAccess): boolean {
  return (
    access.viewerRole === "customer" &&
    access.order.customerId === access.user.id
  );
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound() {
  return NextResponse.json({ error: "Order not found" }, { status: 404 });
}
