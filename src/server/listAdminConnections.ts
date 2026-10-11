import { dealPipeline, processFlags, type DealStep } from "@/lib/deal-pipeline";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

const when = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" });

export type AdminConnectionRow = {
  id: string;
  codename: string;
  region: string;
  investorEmail: string;
  accepted: boolean;
  closed: boolean;
  when: string;
  steps: DealStep[];
};

export async function listAdminConnections(user: CurrentUser): Promise<AdminConnectionRow[] | null> {
  if (!user.onboarded || user.role !== "admin") {
    return null;
  }

  const connections = await prisma.projectAccess.findMany({
    orderBy: { requestedAt: "desc" },
    select: {
      id: true,
      investorId: true,
      requestedAt: true,
      sellerAcceptedAt: true,
      ndaAcceptedAt: true,
      loiAcceptedAt: true,
      diligencePassedAt: true,
      investor: { select: { email: true } },
      project: {
        select: {
          codename: true,
          region: true,
          successFee: { select: { id: true } },
          dataRoomGrants: { select: { investorId: true } },
          messages: { select: { investorId: true, kind: true } },
        },
      },
    },
  });

  return connections.map((connection) => {
    const accepted = connection.sellerAcceptedAt !== null || connection.ndaAcceptedAt !== null;
    const messages = connection.project.messages.filter((message) => message.investorId === connection.investorId);
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
            roomShared: connection.project.dataRoomGrants.some((grant) => grant.investorId === connection.investorId),
            passedDiligence: connection.diligencePassedAt !== null,
            closed: connection.project.successFee !== null,
          }),
        )
      : [];

    return {
      id: connection.id,
      codename: connection.project.codename,
      region: connection.project.region,
      investorEmail: connection.investor.email,
      accepted,
      closed: connection.project.successFee !== null,
      when: when.format(connection.sellerAcceptedAt ?? connection.requestedAt),
      steps,
    };
  });
}
