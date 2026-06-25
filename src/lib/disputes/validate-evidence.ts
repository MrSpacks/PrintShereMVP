import { isValidAvatarUrl } from "@/lib/users/validate-avatar";

const MAX_EVIDENCE_IMAGES = 3;

export function validateEvidenceUrls(urls: unknown): string[] {
  if (urls === undefined) return [];
  if (!Array.isArray(urls)) {
    throw new Error("Invalid evidence");
  }

  if (urls.length > MAX_EVIDENCE_IMAGES) {
    throw new Error("Too many images");
  }

  const validated: string[] = [];

  for (const url of urls) {
    if (!isValidAvatarUrl(url) || typeof url !== "string" || !url.trim()) {
      throw new Error("Invalid evidence image");
    }
    validated.push(url.trim());
  }

  return validated;
}
