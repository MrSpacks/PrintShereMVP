import { NextResponse } from "next/server";

import {
  hashPassword,
  isValidEmail,
  isValidPassword,
  verifyPassword,
} from "@/lib/auth/password";
import {
  attachSessionCookie,
  createSessionToken,
  getSession,
} from "@/lib/auth/session";
import { geocodeAddress } from "@/lib/geocoding/nominatim";
import { listLinkedProviders } from "@/lib/auth/oauth/resolve-google-sign-in";
import { mapPrismaUser } from "@/lib/users/map-user";
import {
  isValidAvatarUrl,
  normalizeAvatarUrl,
} from "@/lib/users/validate-avatar";
import { prisma } from "@/lib/prisma";
import { hasMakerAccess } from "@/types/user";
import type { ProfileResponse } from "@/types/profile";

interface UpdateProfileBody {
  name?: string;
  email?: string;
  address?: string;
  avatarUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

function isUpdateProfileBody(body: unknown): body is UpdateProfileBody {
  if (!body || typeof body !== "object") return false;
  const payload = body as Record<string, unknown>;

  if (payload.name !== undefined && typeof payload.name !== "string") {
    return false;
  }
  if (payload.email !== undefined && typeof payload.email !== "string") {
    return false;
  }
  if (payload.address !== undefined && typeof payload.address !== "string") {
    return false;
  }
  if (
    payload.avatarUrl !== undefined &&
    payload.avatarUrl !== null &&
    typeof payload.avatarUrl !== "string"
  ) {
    return false;
  }
  if (
    payload.currentPassword !== undefined &&
    typeof payload.currentPassword !== "string"
  ) {
    return false;
  }
  if (
    payload.newPassword !== undefined &&
    typeof payload.newPassword !== "string"
  ) {
    return false;
  }

  return true;
}

function resolveProfileAddress(
  user: { address: string | null; role: string; maker: { address: string } | null }
): string {
  if (user.maker) {
    return user.maker.address;
  }
  return user.address ?? "";
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { maker: { select: { address: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const linkedProviders = await listLinkedProviders(user.id);

    return NextResponse.json({
      user: mapPrismaUser(user),
      address: resolveProfileAddress(user),
      hasPassword: Boolean(user.passwordHash),
      linkedProviders,
    } satisfies ProfileResponse);
  } catch (error) {
    console.error("[GET /api/profile]", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!isUpdateProfileBody(body)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { maker: { select: { id: true, address: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData: {
      name?: string;
      email?: string;
      avatarUrl?: string | null;
      address?: string | null;
      passwordHash?: string;
    } = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (name.length < 2) {
        return NextResponse.json(
          { error: "Name must be at least 2 characters" },
          { status: 400 }
        );
      }
      userData.name = name;
    }

    if (body.email !== undefined) {
      const email = body.email.trim().toLowerCase();
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }

      if (email !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          return NextResponse.json(
            { error: "Email is already registered" },
            { status: 409 }
          );
        }
        userData.email = email;
      }
    }

    let makerAddressUpdated = false;

    if (body.address !== undefined) {
      const address = body.address.trim();

      if (address.length > 0 && address.length < 5) {
        return NextResponse.json(
          { error: "Address is too short" },
          { status: 400 }
        );
      }

      if (hasMakerAccess(user)) {
        if (!user.maker) {
          return NextResponse.json(
            { error: "Maker profile not found" },
            { status: 404 }
          );
        }

        if (address.length < 5) {
          return NextResponse.json(
            { error: "Address is too short" },
            { status: 400 }
          );
        }

        const location = await geocodeAddress(address);
        if (!location) {
          return NextResponse.json(
            { error: "Could not locate address on the map" },
            { status: 422 }
          );
        }

        await prisma.maker.update({
          where: { id: user.maker.id },
          data: {
            address: location.displayName,
            latitude: location.latitude,
            longitude: location.longitude,
          },
        });
        makerAddressUpdated = true;
      } else {
        userData.address = address.length === 0 ? null : address;
      }
    }

    if (body.avatarUrl !== undefined) {
      if (!isValidAvatarUrl(body.avatarUrl)) {
        return NextResponse.json(
          { error: "Invalid avatar image" },
          { status: 400 }
        );
      }
      userData.avatarUrl = normalizeAvatarUrl(body.avatarUrl);
    }

    const wantsPasswordChange =
      Boolean(body.newPassword) || Boolean(body.currentPassword);

    if (wantsPasswordChange) {
      if (!body.newPassword) {
        return NextResponse.json(
          { error: "New password is required" },
          { status: 400 }
        );
      }

      if (!isValidPassword(body.newPassword)) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      if (user.passwordHash) {
        if (!body.currentPassword) {
          return NextResponse.json(
            { error: "Current password is required" },
            { status: 400 }
          );
        }

        const passwordValid = await verifyPassword(
          body.currentPassword,
          user.passwordHash
        );

        if (!passwordValid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 401 }
          );
        }
      }

      userData.passwordHash = await hashPassword(body.newPassword);
    }

    if (
      Object.keys(userData).length === 0 &&
      !makerAddressUpdated
    ) {
      const linkedProviders = await listLinkedProviders(user.id);
      return NextResponse.json({
        user: mapPrismaUser(user),
        address: resolveProfileAddress(user),
        hasPassword: Boolean(user.passwordHash),
        linkedProviders,
      } satisfies ProfileResponse);
    }

    let updated =
      Object.keys(userData).length > 0
        ? await prisma.user.update({
            where: { id: user.id },
            data: userData,
            include: { maker: { select: { address: true } } },
          })
        : await prisma.user.findUnique({
            where: { id: user.id },
            include: { maker: { select: { address: true } } },
          });

    if (!updated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (makerAddressUpdated) {
      updated = await prisma.user.findUnique({
        where: { id: user.id },
        include: { maker: { select: { address: true } } },
      });

      if (!updated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const token = await createSessionToken({
      userId: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    });

    const linkedProviders = await listLinkedProviders(updated.id);

    const response = NextResponse.json({
      user: mapPrismaUser(updated),
      address: resolveProfileAddress(updated),
      hasPassword: Boolean(updated.passwordHash),
      linkedProviders,
    } satisfies ProfileResponse);

    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("[PATCH /api/profile]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
