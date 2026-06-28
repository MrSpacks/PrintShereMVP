import { NextResponse } from "next/server";
import type { Maker, MakerFilament, MakerPrinter, User } from "@prisma/client";

import type { Prisma } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hasMakerAccess } from "@/types/user";

const makerInclude = {
  filaments: { orderBy: [{ printerType: "asc" }, { material: "asc" }] },
  printers: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.MakerInclude;

export type MakerSessionUser = User & {
  maker: Maker & {
    filaments: MakerFilament[];
    printers: MakerPrinter[];
  };
  _count?: { ownedMakers: number };
};

export async function requireMakerUser(): Promise<MakerSessionUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      maker: { include: makerInclude },
      _count: { select: { ownedMakers: true } },
    },
  });

  if (!user || !hasMakerAccess(user)) {
    return null;
  }

  if (!user.maker) {
    const firstOwned = await prisma.maker.findFirst({
      where: { ownerUserId: user.id },
      orderBy: { createdAt: "asc" },
      include: makerInclude,
    });

    if (!firstOwned) return null;

    await prisma.user.update({
      where: { id: user.id },
      data: { makerId: firstOwned.id },
    });

    return {
      ...user,
      makerId: firstOwned.id,
      maker: firstOwned,
    };
  }

  return user as MakerSessionUser;
}

export async function requireOwnedMaker(makerId: string, userId: string) {
  return prisma.maker.findFirst({
    where: { id: makerId, ownerUserId: userId },
    include: makerInclude,
  });
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Maker access only" }, { status: 403 });
}
