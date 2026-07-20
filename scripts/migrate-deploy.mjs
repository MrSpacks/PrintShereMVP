import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { setTimeout } from "node:timers/promises";

/**
 * migrate deploy для shared Neon:
 * - локально: DATABASE_URL из .env.local
 * - Vercel: DATABASE_URL уже в process.env
 */
const hasEnvLocal = existsSync(".env.local");
const command = hasEnvLocal
  ? "npx dotenv-cli -e .env.local -- prisma migrate deploy"
  : "npx prisma migrate deploy";

const maxAttempts = 3;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    execSync(command, { stdio: "inherit" });
    break;
  } catch {
    if (attempt === maxAttempts) {
      process.exit(1);
    }
    console.warn(`[migrate-deploy] attempt ${attempt} failed, retry in 5s…`);
    await setTimeout(5000);
  }
}
