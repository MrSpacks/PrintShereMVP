import { NextResponse } from "next/server";

import {
  getOrderAccess,
  notFound,
  unauthorized,
} from "@/lib/orders/require-order-access";
import { prisma } from "@/lib/prisma";
import type { OrderMessage } from "@/types/order";

interface RouteParams {
  params: { id: string };
}

function mapMessage(
  record: {
    id: string;
    orderId: string;
    senderId: string;
    body: string;
    createdAt: Date;
    sender: { name: string; role: string };
  },
  viewerUserId: string
): OrderMessage {
  return {
    id: record.id,
    orderId: record.orderId,
    senderId: record.senderId,
    senderName: record.sender.name,
    senderRole: record.sender.role as OrderMessage["senderRole"],
    body: record.body,
    createdAt: record.createdAt.toISOString(),
    isOwn: record.senderId === viewerUserId,
  };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  const messages = await prisma.orderMessage.findMany({
    where: { orderId: params.id },
    include: { sender: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    messages: messages.map((message) =>
      mapMessage(message, access.user.id)
    ),
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  const access = await getOrderAccess(params.id);
  if (!access) return unauthorized();

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const text = (body as { body?: unknown }).body;
    if (typeof text !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const trimmed = text.trim();
    if (trimmed.length < 1 || trimmed.length > 2000) {
      return NextResponse.json(
        { error: "Message must be 1–2000 characters" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) return notFound();

    const message = await prisma.orderMessage.create({
      data: {
        orderId: params.id,
        senderId: access.user.id,
        body: trimmed,
      },
      include: { sender: { select: { name: true, role: true } } },
    });

    return NextResponse.json(
      { message: mapMessage(message, access.user.id) },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/orders/[id]/messages]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
