import { toPublicAdvisorCard, type PublicAdvisorCard } from "@/lib/advisor-directory";
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
    },
    orderBy: { businessName: "asc" },
  });
  const cards: PublicAdvisorCard[] = [];

  for (const row of rows) {
    const card = toPublicAdvisorCard(row);

    if (card) {
      cards.push(card);
    }
  }

  return cards;
}
