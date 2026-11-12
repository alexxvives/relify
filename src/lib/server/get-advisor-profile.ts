import { advisorSectors, type AdvisorSectorId } from "@/lib/advisor-sectors";
import {
  blankAdvisorProfile,
  corporateIsComplete,
  readStoredOperations,
  readStoredServices,
  type AdvisorProfileView,
} from "@/lib/advisor-profile";
import { prisma } from "@/lib/db";

function isSectorId(id: string): id is AdvisorSectorId {
  return advisorSectors.some((sector) => sector.id === id);
}

export async function getAdvisorProfile(
  userId: string,
): Promise<AdvisorProfileView> {
  const row = await prisma.advisorProfile.findUnique({
    where: { userId },
  });

  if (!row) {
    return blankAdvisorProfile();
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
  };
  profile.corporateComplete = corporateIsComplete(profile);

  return profile;
}
