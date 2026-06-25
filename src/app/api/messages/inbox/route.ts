import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { InboxMessageItem, InboxResponse } from "@/types/inbox";
import { getOrdersViewRole } from "@/types/user";

function truncate(text: string, max = 80): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
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

    let orderWhere = {};
    const viewRole = getOrdersViewRole(user);

    if (viewRole === "customer") {
      orderWhere = { customerId: user.id };
    } else if (viewRole === "maker") {
      const makerId = user.makerId;
      if (!makerId) {
        return NextResponse.json({ items: [], totalUnread: 0 } satisfies InboxResponse);
      }
      orderWhere = { makerId };
    }

    const orders = await prisma.order.findMany({
      where: orderWhere,
      include: {
        maker: { select: { name: true } },
        customer: { select: { name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          include: { sender: { select: { id: true, name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const receipts = await prisma.orderReadReceipt.findMany({
      where: { userId: user.id },
    });

    const receiptByOrder = new Map(
      receipts.map((receipt) => [receipt.orderId, receipt.lastReadAt])
    );

    const items: InboxMessageItem[] = [];
    let totalUnread = 0;

    for (const order of orders) {
      const lastReadAt = receiptByOrder.get(order.id) ?? new Date(0);

      const unreadMessages = order.messages.filter(
        (message) =>
          message.senderId !== user.id && message.createdAt > lastReadAt
      );

      if (unreadMessages.length === 0) continue;

      const latest = unreadMessages[0];
      const counterpartyName =
        viewRole === "maker"
          ? (order.customer?.name ?? "Host")
          : order.maker.name;

      totalUnread += unreadMessages.length;

      items.push({
        orderId: order.id,
        fileName: order.fileName,
        counterpartyName,
        messageId: latest.id,
        preview: truncate(latest.body),
        senderName: latest.sender.name,
        createdAt: latest.createdAt.toISOString(),
        unreadCount: unreadMessages.length,
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ items, totalUnread } satisfies InboxResponse);
  } catch (error) {
    console.error("[GET /api/messages/inbox]", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}
