import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hasMakerAccess, isAdminRole, type UserRole } from "@/types/user";

type OrderWithCustomer = {
  id: string;
  customerId: string | null;
  makerId: string;
  customer: { id: string; name: string } | null;
  maker: { id: string; name: string };
};

export async function getOrderAccess(orderId: string) {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
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

  if (order.customerId === user.id) {
    return {
      user,
      order: order as OrderWithCustomer,
      viewerRole: "customer" as UserRole,
    };
  }

  if (hasMakerAccess(user) && user.makerId === order.makerId) {
    return {
      user,
      order: order as OrderWithCustomer,
      viewerRole: "maker" as UserRole,
    };
  }

  if (isAdminRole(user.role)) {
    return {
      user,
      order: order as OrderWithCustomer,
      viewerRole: "admin" as UserRole,
    };
  }

  return null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound() {
  return NextResponse.json({ error: "Order not found" }, { status: 404 });
}
