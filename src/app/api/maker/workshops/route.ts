import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { createWorkshopForUser } from "@/lib/makers/create-workshop";
import { mapPrismaMakerProfile, mapWorkshopSummary } from "@/lib/makers/map-maker";
import {
  parseWorkshopPrinters,
  validateWorkshopPrinters,
} from "@/lib/makers/validate-printers";
import { mapPrismaUser } from "@/lib/users/map-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, makerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workshops = await prisma.maker.findMany({
    where: { ownerUserId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, status: true },
  });

  return NextResponse.json({
    workshops: workshops.map((workshop) =>
      mapWorkshopSummary(workshop, user.makerId)
    ),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const workshopName =
      typeof body.workshopName === "string" ? body.workshopName.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const printers = parseWorkshopPrinters(body.printers);

    if (workshopName.length < 2) {
      return NextResponse.json(
        { error: "Workshop name is too short" },
        { status: 400 }
      );
    }

    if (address.length < 5) {
      return NextResponse.json(
        { error: "Enter a full workshop address" },
        { status: 400 }
      );
    }

    if (!printers) {
      return NextResponse.json(
        { error: "Add at least one printer with technology" },
        { status: 400 }
      );
    }

    const printerError = validateWorkshopPrinters(printers);
    if (printerError) {
      return NextResponse.json({ error: printerError }, { status: 400 });
    }

    const maker = await prisma.$transaction((tx) =>
      createWorkshopForUser(tx, {
        ownerUserId: session.userId,
        workshopName,
        address,
        printers,
      })
    );

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      include: { _count: { select: { ownedMakers: true } } },
    });

    return NextResponse.json(
      {
        profile: mapPrismaMakerProfile(maker),
        user: mapPrismaUser(user),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "GEOCODE_FAILED") {
      return NextResponse.json(
        { error: "Could not locate this address. Check spelling." },
        { status: 422 }
      );
    }

    console.error("[POST /api/maker/workshops]", error);
    return NextResponse.json(
      { error: "Failed to create workshop" },
      { status: 500 }
    );
  }
}
