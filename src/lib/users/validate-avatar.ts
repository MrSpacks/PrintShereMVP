const AVATAR_MAX_BYTES = 300_000;
const AVATAR_DATA_URL_PATTERN =
  /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;

export function isValidAvatarUrl(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (trimmed.length === 0) return true;

  const match = trimmed.match(AVATAR_DATA_URL_PATTERN);
  if (!match) return false;

  try {
    const bytes = Buffer.from(match[2], "base64");
    return bytes.length > 0 && bytes.length <= AVATAR_MAX_BYTES;
  } catch {
    return false;
  }
}

export function normalizeAvatarUrl(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
