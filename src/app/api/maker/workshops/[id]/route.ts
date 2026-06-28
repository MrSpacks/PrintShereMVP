import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { requireOwnedMaker } from "@/lib/maker/require-maker";
import { deleteMakerWorkshop } from "@/lib/users/delete-account";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maker = await requireOwnedMaker(params.id, session.userId);
  if (!maker) {
    return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { makerId: maker.id },
  });

  return NextResponse.json({ success: true, activeMakerId: maker.id });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maker = await requireOwnedMaker(params.id, session.userId);
  if (!maker) {
    return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
  }

  try {
    await prisma.$transaction((tx) =>
      deleteMakerWorkshop(tx, maker.id, session.userId)
    );

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      include: { _count: { select: { ownedMakers: true } } },
    });

    return NextResponse.json({
      success: true,
      activeMakerId: user.makerId,
      workshopCount: user._count.ownedMakers,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "WORKSHOP_HAS_ORDERS") {
      return NextResponse.json(
        { error: "Workshop has order history and cannot be deleted" },
        { status: 409 }
      );
    }

    console.error("[DELETE /api/maker/workshops/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete workshop" },
      { status: 500 }
    );
  }
}
