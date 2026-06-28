import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/types/user";

export async function requireAdminUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !isAdminUser(user)) return null;

  return user;
}

export async function requireAdminOrModeratorUser() {
  return requireAdminUser();
}

export function adminUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
