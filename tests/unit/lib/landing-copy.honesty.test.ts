import { describe, expect, it } from "vitest";
import { authCopy } from "@/lib/auth-copy";
import { activityItems, landingCopy } from "@/lib/landing-copy";
import { waitlistCopy } from "@/lib/waitlist";

const publicCopy = JSON.stringify({
  home: landingCopy.home,
  confidentiality: landingCopy.confidentiality,
  activity: landingCopy.activity,
  footer: landingCopy.footer,
  title: landingCopy.title,
  description: landingCopy.description,
  waitlist: waitlistCopy,
  stageBody: authCopy.stageBody,
  stagePoints: authCopy.stagePoints,
  roleCards: authCopy.roleCards,
  activityItems,
});

const banned = [
  "120 días",
  "100 días",
  "20 días",
  "4.000",
  "mapa se llena",
  "primer día ya",
  "antes de que se llene",
  "de 120",
  "empresas rentables",
  "El mercado en marcha",
];

describe("public landing copy", () => {
  it("does not claim unverifiable numbers, timelines or a live market", () => {
    for (const phrase of banned) {
      expect(publicCopy.includes(phrase), phrase).toBe(false);
    }
  });
});
