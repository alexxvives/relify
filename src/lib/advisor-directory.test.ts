import { describe, expect, it } from "vitest";
import {
  advisorMessageLeavesPlatform,
  advisorQuality,
  advisorRank,
  advisorRankJustification,
  advisorReliability,
  advisorScoreBreakdown,
  filterPublicAdvisors,
  privateAdvisorFields,
  publicAdvisorFields,
  selectedEngagementCompany,
  sortPublicAdvisors,
  toPublicAdvisorCard,
} from "./advisor-directory";

const complete = {
  userId: "advisor-1",
  businessName: "Navarro Asesores",
  nif: "B12345674",
  postalCode: "28001",
  description: "Asesoría fiscal y de compraventa con más de veinte años de experiencia en pymes.",
  sectors: ["N"],
  services: [{ serviceType: "DUE_DILIGENCE", priceFromCents: 100_000, priceToCents: 200_000 }],
};

describe("toPublicAdvisorCard", () => {
  it("lists a finished profile without the NIF, the email, or documents", () => {
    const card = toPublicAdvisorCard(complete);

    expect(card?.description).toContain("compraventa");
    expect(card?.sectors).toEqual(["Actividades profesionales, científicas y técnicas"]);
    expect(card?.services[0]?.title).toBe("Due Diligence");
    expect(card?.services[0]?.fromCents).toBe(100_000);
    expect(card?.cases).toEqual([]);
    expect(JSON.stringify(card)).not.toContain("Navarro");
    expect(publicAdvisorFields).toEqual(["userId", "description", "sectors", "services", "cases"]);

    for (const key of privateAdvisorFields) {
      expect(card).not.toHaveProperty(key);
    }
  });

  it("filters the directory by sector and service, and keeps the firm name off the card", () => {
    const card = toPublicAdvisorCard(complete);
    expect(card).not.toBeNull();
    if (!card) {
      return;
    }
    expect(filterPublicAdvisors([card], { sector: "Hostelería", service: "" })).toHaveLength(0);
    expect(filterPublicAdvisors([card], { sector: "", service: "Due Diligence" })).toHaveLength(1);
    expect(filterPublicAdvisors([card], { sector: "", service: "Valoración de empresas" })).toHaveLength(0);
    expect(JSON.stringify(card)).not.toContain("Navarro");
  });

  it("ranks a proven advisor above one that takes the chat off the platform, and sorts price separately", () => {
    const proven = toPublicAdvisorCard({
      ...complete,
      userId: "proven",
      closedOperations: [
        {
          name: "Caso",
          closingDate: "2024-06-01",
          sectorId: "I",
          revenueCents: 100,
          ebitdaCents: 20,
          enterpriseValueCents: 400,
        },
      ],
    });
    const leaky = toPublicAdvisorCard({ ...complete, userId: "leaky" });
    const dear = toPublicAdvisorCard({
      ...complete,
      userId: "dear",
      services: [{ serviceType: "DUE_DILIGENCE", priceFromCents: 900_000, priceToCents: 1_200_000 }],
    });
    expect(proven).not.toBeNull();
    expect(leaky).not.toBeNull();
    expect(dear).not.toBeNull();
    if (!proven || !leaky || !dear) {
      return;
    }

    expect(advisorReliability([])).toBe(100);
    expect(advisorReliability(["Te escribo a irene@example.com"])).toBe(70);
    expect(advisorReliability(["612345678"])).toBe(70);
    expect(advisorReliability(["Mi móvil es 612 345 678"])).toBe(45);
    expect(advisorReliability(["Seguimos por WhatsApp"])).toBe(75);
    expect(advisorReliability(["irene@example.com y luego por WhatsApp al 612345678"])).toBe(15);
    expect(advisorQuality(proven)).toBeGreaterThan(advisorQuality(leaky));
    expect(advisorRank(proven, 40)).toBeLessThan(advisorRank(leaky, 100));

    const reliability = (id: string) => (id === "leaky" ? 40 : 100);
    expect(sortPublicAdvisors([leaky, proven], "recommended", reliability).map((card) => card.id)).toEqual(["proven", "leaky"]);
    expect(sortPublicAdvisors([dear, leaky], "price-asc").map((card) => card.id)).toEqual(["leaky", "dear"]);
    expect(sortPublicAdvisors([leaky, dear], "price-desc").map((card) => card.id)).toEqual(["dear", "leaky"]);
    expect(advisorMessageLeavesPlatform("Seguimos por WhatsApp")).toBe(true);
    expect(advisorMessageLeavesPlatform("Te escribo a irene@example.com")).toBe(true);
    expect(advisorMessageLeavesPlatform("Mi móvil es 612 345 678")).toBe(true);
    expect(advisorMessageLeavesPlatform("Hola, me interesan estos servicios: Due Diligence.")).toBe(false);

    const breakdown = advisorScoreBreakdown(proven, ["irene@example.com"]);
    expect(breakdown.cases).toBe(16);
    expect(breakdown.email).toBe(true);
    expect(breakdown.reliability).toBe(70);
    expect(advisorRankJustification(1, 2, breakdown)).toContain("Puesto 1 de 2");
    expect(advisorRankJustification(1, 2, breakdown)).toContain("un correo");
  });

  it("preselects the only company, or the company opened from a process", () => {
    const companies = [
      { slug: "proyecto-cala" },
      { slug: "proyecto-duna" },
    ];
    expect(selectedEngagementCompany(companies, "proyecto-duna")).toBe("proyecto-duna");
    expect(selectedEngagementCompany(companies, "otra")).toBe("");
    expect(selectedEngagementCompany([{ slug: "proyecto-cala" }], undefined)).toBe("proyecto-cala");
    expect(selectedEngagementCompany([], "proyecto-cala")).toBe("");
  });

  it("hides a half-finished profile", () => {
    expect(toPublicAdvisorCard({ ...complete, businessName: "No" })).toBeNull();
    expect(toPublicAdvisorCard({ ...complete, services: [] })).toBeNull();
  });
});
