import { randomUUID } from "crypto";

import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import {
  attachSessionCookie,
  createSessionToken,
} from "@/lib/auth/session";
import {
  hashPassword,
  isValidEmail,
  isValidPassword,
} from "@/lib/auth/password";
import { mapPrismaUser } from "@/lib/users/map-user";
import { prisma } from "@/lib/prisma";

interface SignupBody {
  name: string;
  email: string;
  password: string;
}

function isSignupBody(body: unknown): body is SignupBody {
  if (!body || typeof body !== "object") return false;
  const payload = body as Record<string, unknown>;
  return (
    typeof payload.name === "string" &&
    typeof payload.email === "string" &&
    typeof payload.password === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isSignupBody(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const name = body.name.trim();
    const email = body.email.trim().toLowerCase();

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
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

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        id: `user-${randomUUID()}`,
        name,
        email,
        passwordHash,
        role: UserRole.customer,
      },
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
    console.error("[POST /api/auth/signup]", error);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
