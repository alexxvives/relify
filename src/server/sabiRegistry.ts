import { readSabiRegistry, type SabiRegistry } from "@/lib/sabi/registry";
import { toSabiYear } from "@/lib/sabi/insights";
import { prisma } from "@/server/db";

export {
  readSabiRegistry,
  sabiRegistryIsEmpty,
  type SabiRegistry,
} from "@/lib/sabi/registry";

export const sabiRegistrySelect = {
  directors: true,
  shareholdings: true,
  subsidiaries: true,
  audits: true,
  banks: true,
  activityCodes: true,
} as const;

const sabiYearSelect = {
  year: true,
  months: true,
  employees: true,
  ratios: true,
  salesCents: true,
  operatingRevenueCents: true,
  suppliesCents: true,
  staffCostsCents: true,
  ebitdaCents: true,
  ebitCents: true,
  financialResultCents: true,
  profitBeforeTaxCents: true,
  netResultCents: true,
  totalAssetsCents: true,
  nonCurrentAssetsCents: true,
  currentAssetsCents: true,
  cashCents: true,
  equityCents: true,
  nonCurrentLiabilitiesCents: true,
  currentLiabilitiesCents: true,
  longTermDebtCents: true,
  shortTermDebtCents: true,
  workingCapitalCents: true,
} as const;

export async function getSabiRegistry(
  projectId: string,
): Promise<SabiRegistry | null> {
  const [project, years] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: sabiRegistrySelect,
    }),
    prisma.projectYear.findMany({
      where: { projectId, dataSource: "sabi" },
      orderBy: { year: "asc" },
      select: sabiYearSelect,
    }),
  ]);
  return project
    ? { ...readSabiRegistry(project), years: years.map(toSabiYear) }
    : null;
}
