import { adminCopy } from "@/lib/admin-copy";
import {
  advisorRankJustification,
  advisorScoreBreakdown,
  casesForVerifiedCloses,
  sortPublicAdvisors,
  toPublicAdvisorCard,
  type AdvisorScoreBreakdown,
  type PublicAdvisorCard,
} from "@/lib/advisor-directory";
import { verifiedCloseCounts } from "@/server/advisoryEngagement";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type AdminAdvisorRow = {
  id: string;
  name: string;
  email: string;
  businessName: string;
  sectors: string[];
  listed: boolean;
  place: number | null;
  total: number;
  breakdown: AdvisorScoreBreakdown | null;
  justification: string;
  verified: boolean;
  isNew: boolean;
  /** Same card the marketplace renders, when the profile is complete enough to list. */
  card: PublicAdvisorCard | null;
};

function personName(name: string, lastName: string | null): string {
  return [name, lastName ?? ""]
    .filter((part) => part.trim().length > 0)
    .join(" ");
}

export async function listAdminAdvisors(
  user: CurrentUser,
  since?: Date,
): Promise<AdminAdvisorRow[] | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const advisors = await prisma.user.findMany({
    where: { role: "advisor" },
    select: {
      id: true,
      name: true,
      lastName: true,
      email: true,
      createdAt: true,
      advisorProfile: {
        select: {
          userId: true,
          businessName: true,
          nif: true,
          postalCode: true,
          description: true,
          sectors: true,
          services: true,
          closedOperations: true,
          verifiedAt: true,
        },
      },
    },
  });
  const ids = advisors.map((advisor) => advisor.id);
  const [messages, closes] = await Promise.all([
    ids.length === 0
      ? Promise.resolve([])
      : prisma.engagementMessage.findMany({
          where: { author: "advisor", engagement: { advisorId: { in: ids } } },
          select: { body: true, engagement: { select: { advisorId: true } } },
        }),
    verifiedCloseCounts(ids),
  ]);
  const bodies = new Map<string, string[]>();

  for (const message of messages) {
    const advisorId = message.engagement.advisorId;

    if (!advisorId) {
      continue;
    }

    const current = bodies.get(advisorId) ?? [];
    current.push(message.body);
    bodies.set(advisorId, current);
  }

  const breakdownById = new Map<string, AdvisorScoreBreakdown>();
  const cards: PublicAdvisorCard[] = [];

  for (const advisor of advisors) {
    if (!advisor.advisorProfile) {
      continue;
    }

    const card = toPublicAdvisorCard(advisor.advisorProfile);

    if (!card) {
      continue;
    }

    card.cases = casesForVerifiedCloses(closes.get(card.id) ?? 0);
    cards.push(card);
    breakdownById.set(
      card.id,
      advisorScoreBreakdown(card, bodies.get(card.id) ?? []),
    );
  }

  const ranked = sortPublicAdvisors(
    cards,
    "recommended",
    (id) => breakdownById.get(id)?.reliability ?? 100,
  );
  const placeById = new Map(ranked.map((card, index) => [card.id, index + 1]));
  const total = ranked.length;

  return advisors
    .map((advisor) => {
      const card = cards.find((item) => item.id === advisor.id) ?? null;
      const breakdown = card ? (breakdownById.get(card.id) ?? null) : null;
      const place = card ? (placeById.get(card.id) ?? null) : null;

      return {
        id: advisor.id,
        name: personName(advisor.name, advisor.lastName),
        email: advisor.email,
        businessName: advisor.advisorProfile?.businessName.trim() ?? "",
        sectors: advisor.advisorProfile?.sectors ?? [],
        listed: card !== null,
        verified: advisor.advisorProfile?.verifiedAt != null,
        isNew: since ? advisor.createdAt > since : false,
        card,
        place,
        total,
        breakdown,
        justification:
          breakdown && place !== null
            ? advisorRankJustification(place, total, breakdown)
            : adminCopy.advisorOut,
      };
    })
    .sort((left, right) => {
      if (left.place === null && right.place === null) {
        return left.name.localeCompare(right.name, "es");
      }

      if (left.place === null) {
        return 1;
      }

      if (right.place === null) {
        return -1;
      }

      return left.place - right.place;
    });
}
