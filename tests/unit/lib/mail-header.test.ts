import { describe, expect, it } from "vitest";
import { sanitizeMailHeader } from "@/lib/mail-header";

describe("sanitizeMailHeader", () => {
  it("strips CR/LF so a subject cannot inject headers", () => {
    expect(sanitizeMailHeader("Hola\r\nBcc: evil@example.com")).toBe("Hola Bcc: evil@example.com");
    expect(sanitizeMailHeader(" Informe 2024 \n ")).toBe("Informe 2024");
    expect(sanitizeMailHeader("a".repeat(300)).length).toBe(255);
  });
});
