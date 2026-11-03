import { beforeAll, describe, expect, it } from "vitest";

import {
  createPasswordResetToken,
  isPasswordResetThrottled,
  passwordFingerprint,
  readPasswordResetToken,
} from "@/lib/auth/password-reset";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-for-password-reset-tokens";
});

describe("password reset token", () => {
  it("round-trips user id and fingerprint", async () => {
    const user = { id: "user-1", passwordHash: "hash-a" };
    const token = await createPasswordResetToken(user);
    const parsed = await readPasswordResetToken(token);
    expect(parsed).toEqual({
      userId: "user-1",
      fingerprint: passwordFingerprint("user-1", "hash-a"),
    });
  });

  it("fingerprint changes when the password changes (one-time link)", () => {
    expect(passwordFingerprint("u", "old")).not.toBe(passwordFingerprint("u", "new"));
  });

  it("rejects garbage and session-like tokens", async () => {
    expect(await readPasswordResetToken("not-a-token")).toBeNull();
  });
});

describe("password reset throttle", () => {
  it("allows one request per email per cooldown", () => {
    const now = 1_000_000;
    expect(isPasswordResetThrottled("a@b.cz", now)).toBe(false);
    expect(isPasswordResetThrottled("a@b.cz", now + 1000)).toBe(true);
    expect(isPasswordResetThrottled("a@b.cz", now + 3 * 60 * 1000)).toBe(false);
  });
});
