import { dealPipeline, processFlags, type DealStep } from "@/lib/deal-pipeline";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";

export type AdminConnectionRow = {
  id: string;
  slug: string;
  codename: string;
  region: string;
  accepted: boolean;
  closed: boolean;
  steps: DealStep[];
  isNew: boolean;
  /** Set only on the winning access of a completed sale (LOI accepted on a project with a success fee). */
  soldPriceCents: number | null;
};

export async function listAdminConnections(
  user: CurrentUser,
  since?: Date,
): Promise<AdminConnectionRow[] | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const connections = await prisma.projectAccess.findMany({
    where: { cancelledAt: null },
    orderBy: { requestedAt: "desc" },
    select: {
      id: true,
      investorId: true,
      requestedAt: true,
      sellerAcceptedAt: true,
      ndaAcceptedAt: true,
      loiAcceptedAt: true,
      diligencePassedAt: true,
      project: {
        select: {
          slug: true,
          codename: true,
          region: true,
          successFee: { select: { id: true, closedPriceCents: true } },
          dataRoomGrants: { select: { investorId: true } },
          messages: { select: { investorId: true, kind: true } },
        },
      },
    },
  });

  return connections.map((connection) => {
    const accepted =
      connection.sellerAcceptedAt !== null || connection.ndaAcceptedAt !== null;
    const messages = connection.project.messages.filter(
      (message) => message.investorId === connection.investorId,
    );
    const steps = accepted
      ? dealPipeline(
          "advisor",
          processFlags({
            accepted: true,
            nda: connection.ndaAcceptedAt !== null,
            questions: messages.some((message) => message.kind === "question"),
            meeting: messages.some((message) => message.kind === "meeting"),
            offer: messages.some((message) => message.kind === "offer"),
            loiAccepted: connection.loiAcceptedAt !== null,
            roomShared: connection.project.dataRoomGrants.some(
              (grant) => grant.investorId === connection.investorId,
            ),
            passedDiligence: connection.diligencePassedAt !== null,
            closed: connection.project.successFee !== null,
          }),
        )
      : [];

    return {
      id: connection.id,
      slug: connection.project.slug,
      codename: connection.project.codename,
      region: connection.project.region,
      accepted,
      closed: connection.project.successFee !== null,
      steps,
      isNew: since ? connection.requestedAt > since : false,
      soldPriceCents:
        connection.project.successFee && connection.loiAcceptedAt !== null
          ? connection.project.successFee.closedPriceCents
          : null,
    };
  });
}
