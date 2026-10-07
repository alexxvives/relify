import { publicProjectSelect, type PublicProjectCard } from "@/lib/public-project";
import { toMandateView } from "@/lib/sale-mandate";
import { prisma } from "@/server/db";

export type MandateCard = PublicProjectCard & {
  status: "draft" | "pending" | "published";
  feeRecorded: boolean;
  owned: boolean;
};

export async function listSaleMandates(advisorId: string): Promise<MandateCard[]> {
  const rows = await prisma.saleMandate.findMany({
    where: { advisorId },
    select: {
      project: {
        select: {
          ...publicProjectSelect,
          status: true,
          ownerId: true,
          successFee: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    ...toMandateView(row.project),
    status: row.project.status,
    feeRecorded: row.project.successFee !== null,
    owned: row.project.ownerId === advisorId,
  }));
}
