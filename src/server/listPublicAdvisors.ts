import { advisorReliability, casesForVerifiedCloses, sortPublicAdvisors, toPublicAdvisorCard, type PublicAdvisorCard } from "@/lib/advisor-directory";
import { verifiedCloseCounts } from "@/server/advisoryEngagement";
import { prisma } from "@/server/db";

export async function listPublicAdvisors(): Promise<PublicAdvisorCard[]> {
  const rows = await prisma.advisorProfile.findMany({
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
  });
  const cards: PublicAdvisorCard[] = [];

  for (const row of rows) {
    const card = toPublicAdvisorCard(row);

    if (card) {
      cards.push(card);
    }
  }

  const ids = cards.map((card) => card.id);
  const [messages, closes] = await Promise.all([
    ids.length === 0
      ? Promise.resolve([])
      : prisma.engagementMessage.findMany({
          where: { author: "advisor", engagement: { advisorId: { in: ids } } },
          select: { body: true, engagement: { select: { advisorId: true } } },
        }),
    verifiedCloseCounts(ids),
  ]);

  for (const card of cards) {
    card.cases = casesForVerifiedCloses(closes.get(card.id) ?? 0);
  }
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

  return sortPublicAdvisors(cards, "recommended", (id) => advisorReliability(bodies.get(id) ?? []));
}
