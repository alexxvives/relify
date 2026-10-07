import { describe, expect, it } from "vitest";
import { keepPercent, keepSignedEuro, keepUnsignedEuro, keepYear } from "./numeric-input";
import { formatNationalPhone } from "./phone-countries";

describe("numeric input", () => {
  it("keeps euros as digits and a comma", () => {
    expect(keepUnsignedEuro("1.250.000")).toBe("1250000");
    expect(keepUnsignedEuro("abc12,509")).toBe("12,50");
    expect(keepUnsignedEuro("00012")).toBe("12");
    expect(keepSignedEuro("-1.250,5")).toBe("-1250,5");
    expect(keepSignedEuro("-")).toBe("-");
    expect(keepSignedEuro("12-3")).toBe("123");
  });

  it("keeps a percent up to 100", () => {
    expect(keepPercent("40.5")).toBe("40,5");
    expect(keepPercent("101")).toBe("100");
    expect(keepPercent("100,5")).toBe("100");
    expect(keepPercent("8a")).toBe("8");
    expect(keepYear("20a26")).toBe("2026");
  });

  it("groups a phone number with dashes", () => {
    expect(formatNationalPhone("ES", "612345678")).toBe("612-345-678");
    expect(formatNationalPhone("ES", "6123")).toBe("612-3");
    expect(formatNationalPhone("US", "2025550143")).toBe("202-555-0143");
  });
});
