import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { isModeratorUser } from "@/types/user";

export async function requireModeratorUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !isModeratorUser(user)) return null;

  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
