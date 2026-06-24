import { randomUUID } from "crypto";

import { MakerStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  attachSessionCookie,
  createSessionToken,
} from "@/lib/auth/session";
import {
  hashPassword,
  isValidEmail,
  isValidPassword,
} from "@/lib/auth/password";
import { geocodeAddress } from "@/lib/geocoding/nominatim";
import { DEFAULT_NEW_MAKER_RATING } from "@/lib/makers/capabilities";
import { mapPrismaUser } from "@/lib/users/map-user";
import { prisma } from "@/lib/prisma";
import type { MakerSignupPayload } from "@/types/auth";

function isMakerSignupBody(body: unknown): body is MakerSignupPayload {
  if (!body || typeof body !== "object") return false;
  const payload = body as Record<string, unknown>;
  return (
    typeof payload.name === "string" &&
    typeof payload.email === "string" &&
    typeof payload.password === "string" &&
    typeof payload.workshopName === "string" &&
    typeof payload.address === "string"
  );
}

/**
 * Простая регистрация мейкера: аккаунт + мастерская на карте.
 * Материалы, цены и лимиты настраиваются в личном кабинете.
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isMakerSignupBody(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const name = body.name.trim();
    const email = body.email.trim().toLowerCase();
    const workshopName = body.workshopName.trim();
    const address = body.address.trim();

    if (name.length < 2 || workshopName.length < 2) {
      return NextResponse.json(
        { error: "Name and workshop name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (address.length < 5) {
      return NextResponse.json(
        { error: "Enter a full workshop address" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!isValidPassword(body.password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const location = await geocodeAddress(address);
    if (!location) {
      return NextResponse.json(
        { error: "Could not locate this address. Check spelling." },
        { status: 422 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(body.password);
    const makerId = `maker-${randomUUID()}`;
    const userId = `user-${randomUUID()}`;

    const user = await prisma.$transaction(async (tx) => {
      await tx.maker.create({
        data: {
          id: makerId,
          name: workshopName,
          address: location.displayName,
          latitude: location.latitude,
          longitude: location.longitude,
          rating: DEFAULT_NEW_MAKER_RATING,
          pricePerGramCzk: 5,
          minOrderPriceCzk: 0,
          printerTypes: ["fdm"],
          status: MakerStatus.available,
        },
      });

      return tx.user.create({
        data: {
          id: userId,
          name,
          email,
          passwordHash,
          role: UserRole.maker,
          makerId,
        },
      });
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json(
      { user: mapPrismaUser(user) },
      { status: 201 }
    );

    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("[POST /api/auth/signup/maker]", error);
    return NextResponse.json(
      { error: "Maker registration failed" },
      { status: 500 }
    );
  }
}
