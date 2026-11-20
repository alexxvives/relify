import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { advisorCopy } from "@/lib/advisor-copy";
import { advisorProfileChecks, blankAdvisorProfile } from "@/lib/advisor-profile";
import { engagementCopy } from "@/lib/engagement-copy";
import { advisorCompanyView, advisorNdaOutcome } from "@/lib/engagement";

const read = (path: string) => readFileSync(path, "utf8");

describe("S35 advisor access", () => {
  it("opens a seller-hired company only after the advisor's own NDA", () => {
    expect(advisorCompanyView({ hiredByInvestor: false, advisorSigned: false, investorSigned: false })).toBe("public");
    expect(advisorCompanyView({ hiredByInvestor: false, advisorSigned: true, investorSigned: false })).toBe("seller");
    expect(advisorCompanyView({ hiredByInvestor: true, advisorSigned: true, investorSigned: false })).toBe("public");
    expect(
      advisorNdaOutcome({ isAdvisor: true, hiredByInvestor: false, ownsEngagement: true, alreadySigned: false, depositPaid: false }),
    ).toEqual({ ok: false, code: "deposit" });
  });

  it("drops the seller-folders note and the encargo subscription block", () => {
    expect(Object.keys(engagementCopy)).not.toContain("figuresSellerShared");
    expect(Object.keys(engagementCopy)).not.toContain("subscriptionBody");
    expect(read("src/components/advisor/advisor-engagement-forms.tsx")).not.toMatch(/AdvisorSubscriptionStep/);
  });
});

describe("S35 subscription gates the listing", () => {
  it("is a mandatory Inicio step", () => {
    expect(advisorProfileChecks({ ...blankAdvisorProfile(), subscribed: true }).subscription).toBe(true);
    expect(advisorProfileChecks(blankAdvisorProfile()).subscription).toBe(false);
    expect(advisorCopy.profileSubscription).toMatch(/49 €/);
  });

  it("filters unsubscribed advisors server-side", () => {
    expect(read("src/lib/server/list-public-advisors.ts")).toMatch(/advisorInbox: true/);
    expect(read("src/lib/server/advisory-engagement.ts")).toMatch(/advisorIsListed\(profile\) && \(await inboxPaid\(userId\)\)/);
  });
});
