import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "./safe-redirect";

describe("getSafeRedirectPath", () => {
  it("пропускает обычные относительные пути", () => {
    expect(getSafeRedirectPath("/orders")).toBe("/orders");
    expect(getSafeRedirectPath("/orders/abc?tab=chat#m1")).toBe(
      "/orders/abc?tab=chat#m1"
    );
  });

  it("возвращает / для пустых и абсолютных адресов", () => {
    expect(getSafeRedirectPath(null)).toBe("/");
    expect(getSafeRedirectPath("")).toBe("/");
    expect(getSafeRedirectPath("https://evil.example")).toBe("/");
    expect(getSafeRedirectPath("//evil.example")).toBe("/");
  });

  it("блокирует обход через обратный слеш и управляющие символы", () => {
    expect(getSafeRedirectPath("/\\evil.example")).toBe("/");
    expect(getSafeRedirectPath("/\\/evil.example")).toBe("/");
    expect(getSafeRedirectPath("/\t/evil.example")).toBe("/");
    expect(getSafeRedirectPath("/\n/evil.example")).toBe("/");
  });

  it("результат всегда остаётся на нашем домене", () => {
    for (const raw of ["/\\evil.example", "/orders", "/%2F%2Fevil.example"]) {
      const url = new URL(getSafeRedirectPath(raw), "https://3dprintshare.xyz");
      expect(url.host).toBe("3dprintshare.xyz");
    }
  });
});
