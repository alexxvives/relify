import { emailSiteUrl } from "@/lib/env";
import { reportReadyEmail } from "@/lib/email/messages";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/server/mailer";
import { ownerContact, ownerHome } from "@/lib/server/owner-contact";

export type NotifyReportResult = { ok: true } | { ok: false; message: string };

/**
 * t73b: admin-only, manual "informe financiero listo" email to the company's owner.
 * Only after a SABI import; records who sent it and when, only if the send went through.
 */
export async function notifyReportReady(
  admin: CurrentUser,
  projectId: string,
): Promise<NotifyReportResult> {
  if (admin.role !== "admin") {
    return {
      ok: false,
      message: "Solo un administrador puede enviar este aviso.",
    };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      legalName: true,
      codename: true,
      sabiImportedAt: true,
      reportNotifiedAt: true,
    },
  });

  if (!project) return { ok: false, message: "No encontramos la empresa." };
  if (!project.sabiImportedAt)
    return { ok: false, message: "Importa primero el SABI de esta empresa." };
  if (project.reportNotifiedAt)
    return { ok: false, message: "Ya se avisó al vendedor." };

  const owner = await ownerContact(project.ownerId);
  if (!owner)
    return {
      ok: false,
      message: "Esta empresa no tiene un vendedor al que avisar.",
    };

  const companyName = project.legalName.trim() || project.codename;
  const url = new URL(ownerHome(owner.role), emailSiteUrl()).toString();
  const sent = await sendMail({
    to: owner.email,
    tag: "report-ready",
    ...reportReadyEmail(owner.firstName, companyName, url),
  });

  if (sent.status !== "sent") {
    return {
      ok: false,
      message:
        "No se ha podido enviar el correo. Inténtalo de nuevo en unos minutos.",
    };
  }

  await prisma.project.update({
    where: { id: project.id },
    data: { reportNotifiedAt: new Date(), reportNotifiedById: admin.id },
  });

  return { ok: true };
}
