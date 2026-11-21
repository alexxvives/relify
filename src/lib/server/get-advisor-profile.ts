import { advisorSectors, type AdvisorSectorId } from "@/lib/advisor-sectors";
import {
  blankAdvisorProfile,
  identityIsComplete,
  readStoredOperations,
  readStoredServices,
  type AdvisorProfileView,
} from "@/lib/advisor-profile";
import { prisma } from "@/lib/db";
import { launchFreeMode } from "@/lib/launch-mode";

function isSectorId(id: string): id is AdvisorSectorId {
  return advisorSectors.some((sector) => sector.id === id);
}

export async function getAdvisorProfile(
  userId: string,
): Promise<AdvisorProfileView> {
  const [row, billing] = await Promise.all([
    prisma.advisorProfile.findUnique({ where: { userId } }),
    prisma.billingCustomer.findUnique({ where: { userId }, select: { advisorInbox: true } }),
  ]);
  // S43: the free launch counts as subscribed (no Stripe, no billing row).
  const subscribed = launchFreeMode() || billing?.advisorInbox === true;

  if (!row) {
    return { ...blankAdvisorProfile(), subscribed };
  }

  const sectors = row.sectors.filter(isSectorId);
  const profile: AdvisorProfileView = {
    businessName: row.businessName,
    nif: row.nif,
    postalCode: row.postalCode,
    description: row.description,
    sectors,
    services: readStoredServices(row.services),
    operations: readStoredOperations(row.closedOperations),
    dealsAnswered: row.dealsAnswered,
    corporateComplete: false,
    subscribed,
  };
  profile.corporateComplete = identityIsComplete(profile);

  return profile;
}
