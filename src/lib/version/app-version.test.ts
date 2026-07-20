import { describe, expect, it } from "vitest";

import { isNewerAppVersion } from "./app-version";

describe("isNewerAppVersion", () => {
  it("не предлагает обновление при одинаковой версии", () => {
    expect(isNewerAppVersion("dpl_abc", "dpl_abc")).toBe(false);
  });

  it("предлагает обновление при новом деплое", () => {
    expect(isNewerAppVersion("dpl_old", "dpl_new")).toBe(true);
  });

  it("игнорирует dev-сборки", () => {
    expect(isNewerAppVersion("dev", "dpl_new")).toBe(false);
    expect(isNewerAppVersion("dpl_old", "dev")).toBe(false);
  });
});
