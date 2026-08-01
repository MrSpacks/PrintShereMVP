import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { requireOwnedMaker } from "@/lib/maker/require-maker";
import { geocodeAddress } from "@/lib/geocoding/nominatim";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

interface UpdateWorkshopPayload {
  workshopName?: string;
  address?: string;
}

function isValidPayload(body: unknown): body is UpdateWorkshopPayload {
  if (!body || typeof body !== "object") return false;
  const p = body as Record<string, unknown>;
  
  const hasWorkshopName = p.workshopName === undefined || typeof p.workshopName === "string";
  const hasAddress = p.address === undefined || typeof p.address === "string";
  
  return hasWorkshopName && hasAddress;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maker = await requireOwnedMaker(params.id, session.userId);
  if (!maker) {
    return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
  }

  const body: unknown = await request.json();
  
  if (!isValidPayload(body)) {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }

  const updates: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  } = {};

  if (body.workshopName !== undefined) {
    const trimmed = body.workshopName.trim();
    if (trimmed.length < 2) {
      return NextResponse.json(
        { error: "Workshop name must be at least 2 characters" },
        { status: 400 }
      );
    }
    updates.name = trimmed;
  }

  if (body.address !== undefined) {
    const trimmed = body.address.trim();
    if (trimmed.length < 5) {
      return NextResponse.json(
        { error: "Address must be at least 5 characters" },
        { status: 400 }
      );
    }

    const location = await geocodeAddress(trimmed);
    if (!location) {
      return NextResponse.json(
        { error: "Could not locate this address. Check spelling." },
        { status: 422 }
      );
    }

    updates.address = location.displayName;
    updates.latitude = location.latitude;
    updates.longitude = location.longitude;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const updated = await prisma.maker.update({
    where: { id: maker.id },
    data: updates,
  });

  return NextResponse.json({
    success: true,
    workshop: {
      id: updated.id,
      name: updated.name,
      address: updated.address,
      latitude: updated.latitude,
      longitude: updated.longitude,
    },
  });
}
