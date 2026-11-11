import { describe, expect, it } from "vitest";
import { pdfFontkit } from "./pdf-fontkit";

describe("pdfFontkit", () => {
  it("exposes create for pdf-lib embedFont", () => {
    expect(typeof pdfFontkit().create).toBe("function");
  });
});
