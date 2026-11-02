import { decodeJwt, decodeProtectedHeader, exportPKCS8, generateKeyPair } from "jose";
import { beforeAll, describe, expect, it } from "vitest";

import { createAppleClientSecret, parseAppleUserName } from "./apple";
import { pickVerifiedPrimaryEmail } from "./github";
import { createOAuthState, isOAuthNonceValid, verifyOAuthState } from "./state";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-for-oauth-state-0123456789";
});

describe("pickVerifiedPrimaryEmail", () => {
  it("берёт основной подтверждённый e-mail", () => {
    expect(
      pickVerifiedPrimaryEmail([
        { email: "old@example.com", primary: false, verified: true },
        { email: "main@example.com", primary: true, verified: true },
      ])
    ).toBe("main@example.com");
  });

  it("не принимает неподтверждённый основной e-mail", () => {
    expect(
      pickVerifiedPrimaryEmail([
        { email: "victim@example.com", primary: true, verified: false },
        { email: "other@example.com", primary: false, verified: true },
      ])
    ).toBeNull();
  });
});

describe("parseAppleUserName", () => {
  it("собирает имя из первого входа", () => {
    expect(
      parseAppleUserName('{"name":{"firstName":"Jana","lastName":"Nováková"}}')
    ).toBe("Jana Nováková");
  });

  it("возвращает undefined без данных или при мусоре", () => {
    expect(parseAppleUserName(null)).toBeUndefined();
    expect(parseAppleUserName("not json")).toBeUndefined();
    expect(parseAppleUserName('{"email":"a@b.c"}')).toBeUndefined();
  });
});

describe("createAppleClientSecret", () => {
  it("подписывает ES256 JWT с нужными claims", async () => {
    const { privateKey } = await generateKeyPair("ES256", { extractable: true });
    const secret = await createAppleClientSecret({
      clientId: "xyz.3dprintshare.web",
      teamId: "TEAM123456",
      keyId: "KEY1234567",
      privateKey: await exportPKCS8(privateKey),
    });

    expect(decodeProtectedHeader(secret)).toMatchObject({
      alg: "ES256",
      kid: "KEY1234567",
    });
    const claims = decodeJwt(secret);
    expect(claims).toMatchObject({
      iss: "TEAM123456",
      sub: "xyz.3dprintshare.web",
      aud: "https://appleid.apple.com",
    });
    expect((claims.exp ?? 0) - (claims.iat ?? 0)).toBeLessThanOrEqual(300);
  });
});

describe("OAuth state", () => {
  it("сохраняет провайдера и чистит next", async () => {
    const token = await createOAuthState({
      provider: "github",
      mode: "login",
      next: "/\\evil.example",
      nonce: "nonce-1",
    });
    expect(await verifyOAuthState(token)).toEqual({
      provider: "github",
      mode: "login",
      next: "/",
      userId: undefined,
      nonce: "nonce-1",
    });
  });

  it("требует совпадения nonce из state и cookie", () => {
    const state = { provider: "google", mode: "login", next: "/", nonce: "abc-123" } as const;
    expect(isOAuthNonceValid(state, "abc-123")).toBe(true);
    expect(isOAuthNonceValid(state, "abc-124")).toBe(false);
    expect(isOAuthNonceValid(state, "abc")).toBe(false);
    expect(isOAuthNonceValid(state, null)).toBe(false);
  });

  it("отклоняет подделанный state", async () => {
    expect(await verifyOAuthState("not-a-jwt")).toBeNull();
  });
});
