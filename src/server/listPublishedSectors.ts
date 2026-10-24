import { cnaeSection, groupSectorBooks, type IndustrySector } from "@/lib/cnae-section";
import { prisma } from "@/server/db";

/**
 * Companies for sale (published, not yet sold) grouped by CNAE section and sized by asking price.
 * Uses the principal CNAE, falling back to the first secondary one so no listed company is left out.
 * The `revenueCents` field of the treemap rows carries the asking price.
 */
export async function listPublishedSectors(): Promise<IndustrySector[]> {
  const projects = await prisma.project.findMany({
    where: { status: "published", successFee: null },
    select: {
      slug: true,
      codename: true,
      askingPriceCents: true,
      cnaes: { select: { code: true, role: true, position: true } },
    },
  });

  return groupSectorBooks(
    projects.flatMap((project) => {
      const ordered = [...project.cnaes].sort(
        (left, right) => Number(right.role === "principal") - Number(left.role === "principal") || left.position - right.position,
      );
      const code = ordered.find((cnae) => cnaeSection(cnae.code))?.code;
      return code ? [{ code, slug: project.slug, codename: project.codename, revenueCents: project.askingPriceCents }] : [];
    }),
  );
}
