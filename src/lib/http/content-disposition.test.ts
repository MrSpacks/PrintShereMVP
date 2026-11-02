import { describe, expect, it } from "vitest";

import { attachmentContentDisposition } from "./content-disposition";

describe("attachmentContentDisposition", () => {
  it("оставляет ASCII-имя как есть", () => {
    expect(attachmentContentDisposition("model.stl")).toBe(
      "attachment; filename=\"model.stl\"; filename*=UTF-8''model.stl"
    );
  });

  it("чешские и кириллические имена дают валидный заголовок", () => {
    for (const name of ["součástka.stl", "деталь.stl", "díl (2).obj"]) {
      const header = attachmentContentDisposition(name);
      expect(() => new Headers({ "Content-Disposition": header })).not.toThrow();
      const encoded = header.split("filename*=UTF-8''")[1];
      expect(decodeURIComponent(encoded)).toBe(name);
    }
    expect(attachmentContentDisposition("součástka.stl")).toContain(
      'filename="soucastka.stl"'
    );
  });

  it("экранирует кавычки и переводы строк", () => {
    const header = attachmentContentDisposition('a"b\r\nc.stl');
    expect(header).toContain('filename="a_b__c.stl"');
    expect(() => new Headers({ "Content-Disposition": header })).not.toThrow();
  });
});
