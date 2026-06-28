import { randomUUID } from "crypto";

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
import { createWorkshopForUser } from "@/lib/makers/create-workshop";
import {
  parseWorkshopPrinters,
  validateWorkshopPrinters,
} from "@/lib/makers/validate-printers";
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
    typeof payload.address === "string" &&
    Array.isArray(payload.printers)
  );
}

/**
 * Регистрация мейкера: аккаунт + первая мастерская с принтерами.
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
    const printers = parseWorkshopPrinters(body.printers);

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

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!isValidPassword(body.password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
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
    const userId = `user-${randomUUID()}`;

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          id: userId,
          name,
          email,
          passwordHash,
        },
      });

      await createWorkshopForUser(tx, {
        ownerUserId: created.id,
        workshopName,
        address,
        printers,
      });

      return tx.user.findUniqueOrThrow({
        where: { id: created.id },
        include: { _count: { select: { ownedMakers: true } } },
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
    if (error instanceof Error && error.message === "GEOCODE_FAILED") {
      return NextResponse.json(
        { error: "Could not locate this address. Check spelling." },
        { status: 422 }
      );
    }

    console.error("[POST /api/auth/signup/maker]", error);
    return NextResponse.json(
      { error: "Maker registration failed" },
      { status: 500 }
    );
  }
}
