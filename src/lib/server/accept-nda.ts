import { ndaAgreement, signerName, spanishDate } from "@/lib/deal-documents";
import { storeSignedDocumentQuietly } from "@/lib/server/signed-documents";
import { incomingNdaNotice, ndaAcceptedNotice } from "@/lib/notifications";
import { platformTermsCopy } from "@/lib/platform-terms";
import { signatureBytes, signatureJpeg } from "@/lib/signature-image";
import {
  accessMessage,
  acceptNdaOutcome,
  ndaAccessGate,
  type ProjectAccessInput,
} from "@/lib/project-access";
import { personName } from "@/lib/project-message";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { recordNotification } from "@/lib/server/record-notification";
import type { ProjectAccessResult } from "@/lib/server/request-project-access";

export async function acceptNda(
  user: CurrentUser,
  input: ProjectAccessInput,
  signatureValue: unknown,
): Promise<ProjectAccessResult> {
  const project = await prisma.project.findFirst({
    where: { slug: input.slug },
    select: {
      id: true,
      status: true,
      codename: true,
      region: true,
      ownerId: true,
      slug: true,
    },
  });

  const existing = project
    ? await prisma.projectAccess.findUnique({
        where: {
          projectId_investorId: { projectId: project.id, investorId: user.id },
        },
        select: {
          id: true,
          ndaAcceptedAt: true,
          sellerAcceptedAt: true,
          cancelledAt: true,
        },
      })
    : null;

  const outcome = acceptNdaOutcome({
    onboarded: user.onboarded,
    role: user.role,
    projectStatus: project?.status ?? null,
    requested: existing !== null,
    sellerMatched: existing !== null && existing.sellerAcceptedAt !== null,
    alreadyAccepted: existing !== null && existing.ndaAcceptedAt !== null,
  });

  if (!outcome.ok || !project || !existing || existing.cancelledAt !== null) {
    return {
      ok: false,
      message: accessMessage(outcome.ok ? "missing" : outcome.code),
    };
  }

  const signature = outcome.stamp ? signatureJpeg(signatureValue) : null;

  if (outcome.stamp && !signature) {
    return { ok: false, message: platformTermsCopy.signRequired };
  }

  const acceptedAt = existing.ndaAcceptedAt ?? new Date();

  if (outcome.stamp && signature) {
    await prisma.projectAccess.update({
      where: { id: existing.id },
      data: {
        ndaAcceptedAt: acceptedAt,
        ndaSignature: signatureBytes(signature),
        // t93: freeze the wording signed, like the LOI body; later copy edits never change a signed NDA.
        ndaText: ndaAgreement({
          buyerName: signerName(user.name, user.lastName),
          codename: project.codename,
          region: project.region,
          dateLabel: spanishDate(acceptedAt),
        }),
      },
    });
    await storeSignedDocumentQuietly("nda", existing.id);
    const href = `/proyectos/${project.slug}`;
    const investorNotice = ndaAcceptedNotice(project.codename);
    await recordNotification({ userId: user.id, ...investorNotice, href });

    if (project.ownerId && project.ownerId !== user.id) {
      const sellerNotice = incomingNdaNotice(
        project.codename,
        personName(user.name, user.lastName),
      );
      await recordNotification({
        userId: project.ownerId,
        ...sellerNotice,
        href: "/mi-empresa/procesos",
      });
    }
  }

  const gate = ndaAccessGate({
    onboarded: user.onboarded,
    role: user.role,
    projectStatus: project.status,
    ndaAcceptedAt: acceptedAt,
  });

  if (!gate.ok) {
    return { ok: false, message: accessMessage(gate.code) };
  }

  return { ok: true };
}
