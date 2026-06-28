const BLOCK_DAY_OPTIONS = [1, 7, 30] as const;

export type BlockDurationDays = (typeof BLOCK_DAY_OPTIONS)[number];

export const ADMIN_BLOCK_DAY_OPTIONS = BLOCK_DAY_OPTIONS;

export function isUserCurrentlyBlocked(
  blockedUntil: Date | string | null | undefined
): boolean {
  if (!blockedUntil) return false;
  return new Date(blockedUntil) > new Date();
}

export function computeBlockedUntil(days: number): Date {
  const until = new Date();
  until.setDate(until.getDate() + days);
  return until;
}

export function parseBlockDays(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const days = Math.floor(value);
  if (days < 1 || days > 365) return null;
  return days;
}

export function isValidBlockDays(value: number): boolean {
  return parseBlockDays(value) !== null;
}
