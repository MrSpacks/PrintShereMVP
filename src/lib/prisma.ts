import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Neon усыпляет compute при простое; пробуждение занимает несколько секунд,
 * а дефолтный connect_timeout Prisma — 5 с. Без запаса первый запрос после
 * простоя падает с "Can't reach database server". Добавляем таймаут,
 * если он не задан явно в DATABASE_URL.
 */
function withConnectTimeout(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "15");
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "15");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

const databaseUrl = withConnectTimeout(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
