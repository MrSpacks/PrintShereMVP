import { randomUUID } from "crypto";

import { UserRole } from "@prisma/client";
import type { User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { OAuthMode, OAuthProvider } from "@/types/oauth";

export type OAuthResolveError =
  | "EMAIL_MISMATCH"
  | "PROVIDER_ALREADY_LINKED"
  | "ACCOUNT_BLOCKED"
  | "LINK_SESSION_MISMATCH"
  | "USER_NOT_FOUND";

export class OAuthResolveFailure extends Error {
  constructor(public readonly code: OAuthResolveError) {
    super(code);
  }
}

interface ResolveOAuthSignInParams {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name?: string;
  picture?: string;
  mode: OAuthMode;
  linkUserId?: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function assertUserNotBlocked(user: User): Promise<void> {
  if (user.blockedUntil && user.blockedUntil > new Date()) {
    throw new OAuthResolveFailure("ACCOUNT_BLOCKED");
  }

  if (user.blockedUntil && user.blockedUntil <= new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { blockedUntil: null },
    });
  }
}

async function upsertProviderAccount(
  userId: string,
  provider: OAuthProvider,
  providerAccountId: string
) {
  const existing = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: { provider, providerAccountId },
    },
  });

  if (existing && existing.userId !== userId) {
    throw new OAuthResolveFailure("PROVIDER_ALREADY_LINKED");
  }

  if (existing) {
    return existing;
  }

  return prisma.account.create({
    data: {
      id: `account-${randomUUID()}`,
      userId,
      provider,
      providerAccountId,
    },
  });
}

async function maybeUpdateAvatar(user: User, picture?: string) {
  if (!picture || user.avatarUrl) return user;

  return prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: picture },
  });
}

export async function resolveOAuthSignIn(
  params: ResolveOAuthSignInParams
): Promise<User> {
  const email = normalizeEmail(params.email);
  const displayName = params.name?.trim() || email.split("@")[0] || "User";

  if (params.mode === "link") {
    if (!params.linkUserId) {
      throw new OAuthResolveFailure("LINK_SESSION_MISMATCH");
    }

    const user = await prisma.user.findUnique({
      where: { id: params.linkUserId },
    });

    if (!user) {
      throw new OAuthResolveFailure("USER_NOT_FOUND");
    }

    // Logged-in user explicitly links a provider — email need not match account email
    // (e.g. Seznam registration + personal Gmail). Login-mode auto-link still requires match.
    await assertUserNotBlocked(user);
    await upsertProviderAccount(
      user.id,
      params.provider,
      params.providerAccountId
    );
    return maybeUpdateAvatar(user, params.picture);
  }

  const linkedAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: params.provider,
        providerAccountId: params.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (linkedAccount) {
    await assertUserNotBlocked(linkedAccount.user);
    return maybeUpdateAvatar(linkedAccount.user, params.picture);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await assertUserNotBlocked(existingUser);
    await upsertProviderAccount(
      existingUser.id,
      params.provider,
      params.providerAccountId
    );
    return maybeUpdateAvatar(existingUser, params.picture);
  }

  const created = await prisma.user.create({
    data: {
      id: `user-${randomUUID()}`,
      email,
      name: displayName,
      avatarUrl: params.picture ?? null,
      passwordHash: null,
      role: UserRole.customer,
    },
  });

  await upsertProviderAccount(
    created.id,
    params.provider,
    params.providerAccountId
  );
  return created;
}

export async function listLinkedProviders(userId: string): Promise<string[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { provider: true },
    orderBy: { provider: "asc" },
  });

  return accounts.map((account) => account.provider);
}

export async function unlinkOAuthProvider(
  userId: string,
  provider: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });

  if (!user) {
    throw new OAuthResolveFailure("USER_NOT_FOUND");
  }

  const account = user.accounts.find((entry) => entry.provider === provider);
  if (!account) return;

  const hasPassword = Boolean(user.passwordHash);
  const remainingProviders = user.accounts.filter(
    (entry) => entry.provider !== provider
  );

  if (!hasPassword && remainingProviders.length === 0) {
    throw new Error("CANNOT_UNLINK_LAST_AUTH_METHOD");
  }

  await prisma.account.delete({ where: { id: account.id } });
}
