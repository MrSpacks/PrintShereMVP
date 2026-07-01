import { NextResponse } from "next/server";

import {
  listLinkedProviders,
  unlinkOAuthProvider,
} from "@/lib/auth/oauth/resolve-google-sign-in";
import { getSession } from "@/lib/auth/session";
import { isOAuthProvider } from "@/types/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = await listLinkedProviders(session.userId);
  return NextResponse.json({ providers });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const provider =
    body && typeof body === "object"
      ? (body as { provider?: unknown }).provider
      : undefined;

  if (typeof provider !== "string" || !isOAuthProvider(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  try {
    await unlinkOAuthProvider(session.userId, provider);
    const providers = await listLinkedProviders(session.userId);
    return NextResponse.json({ providers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unlink failed";
    if (message === "CANNOT_UNLINK_LAST_AUTH_METHOD") {
      return NextResponse.json(
        { error: "CANNOT_UNLINK_LAST_AUTH_METHOD" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Unlink failed" }, { status: 400 });
  }
}
