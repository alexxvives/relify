import { advisorReliability, sortPublicAdvisors, toPublicAdvisorCard, type PublicAdvisorCard } from "@/lib/advisor-directory";
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
  const messages =
    ids.length === 0
      ? []
      : await prisma.engagementMessage.findMany({
          where: { author: "advisor", engagement: { advisorId: { in: ids } } },
          select: { body: true, engagement: { select: { advisorId: true } } },
        });
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
