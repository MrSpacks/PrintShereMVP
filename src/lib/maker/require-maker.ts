import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function requireMakerUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      maker: {
        include: { filaments: { orderBy: [{ printerType: "asc" }, { material: "asc" }] } },
      },
    },
  });

  if (!user || user.role !== "maker" || !user.maker) {
    return null;
  }

  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Maker access only" }, { status: 403 });
}
