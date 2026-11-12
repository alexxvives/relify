import { describe, expect, it } from "vitest";
import { contractCan, contractNext, contractStage, isPdfBytes } from "@/lib/sale-contract";

describe("sale contract stage", () => {
  it("derives the stage from the latest version", () => {
    expect(contractStage(null)).toBe("upload");
    expect(contractStage({ status: "review" })).toBe("review");
    expect(contractStage({ status: "changes" })).toBe("changes");
    expect(contractStage({ status: "accepted" })).toBe("signing");
    expect(contractStage({ status: "signed" })).toBe("signed");
  });

  it("tells each party whose turn it is", () => {
    const base = { buyerSigned: false, sellerSigned: false };
    expect(contractNext({ ...base, party: "seller", stage: "upload" }).who).toBe("you");
    expect(contractNext({ ...base, party: "buyer", stage: "upload" }).who).toBe("other");
    expect(contractNext({ ...base, party: "buyer", stage: "review" }).who).toBe("you");
    expect(contractNext({ ...base, party: "advisor", stage: "changes" }).who).toBe("you");
    expect(contractNext({ party: "buyer", stage: "signing", buyerSigned: true, sellerSigned: false }).who).toBe("other");
    expect(contractNext({ party: "seller", stage: "signing", buyerSigned: true, sellerSigned: false }).who).toBe("you");
    expect(contractNext({ ...base, party: "seller", stage: "signed" }).who).toBe("none");
  });

  it("only lets the right party act", () => {
    const base = { buyerSigned: false, sellerSigned: false };
    expect(contractCan({ ...base, party: "buyer", stage: "upload" }).upload).toBe(false);
    expect(contractCan({ ...base, party: "advisor", stage: "changes" }).upload).toBe(true);
    expect(contractCan({ ...base, party: "seller", stage: "signing" }).upload).toBe(false);
    expect(contractCan({ ...base, party: "seller", stage: "review" }).review).toBe(false);
    expect(contractCan({ ...base, party: "advisor", stage: "signing" }).sign).toBe(false);
    expect(contractCan({ party: "buyer", stage: "signing", buyerSigned: true, sellerSigned: false }).sign).toBe(false);
  });

  it("recognises PDF bytes", () => {
    expect(isPdfBytes(new TextEncoder().encode("%PDF-1.7"))).toBe(true);
    expect(isPdfBytes(new TextEncoder().encode("hello"))).toBe(false);
  });
});
