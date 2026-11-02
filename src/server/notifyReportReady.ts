import { readSiteUrl } from "@/lib/env";
import { reportReadyEmail } from "@/lib/email/messages";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { sendMail } from "@/server/mailer";
import { ownerContact, ownerHome } from "@/server/ownerContact";

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
      years: { where: { kind: "closed" }, select: { year: true, salesCents: true }, orderBy: { year: "asc" } },
    },
  });

  if (!project) return { ok: false, message: "No encontramos la empresa." };
  if (!project.sabiImportedAt)
    return { ok: false, message: "Importa primero el SABI de esta empresa." };

  const owner = await ownerContact(project.ownerId);
  if (!owner)
    return {
      ok: false,
      message: "Esta empresa no tiene un vendedor al que avisar.",
    };

  const companyName = project.legalName.trim() || project.codename;
  const url = new URL(ownerHome(owner.role), readSiteUrl()).toString();
  const sent = await sendMail({
    to: owner.email,
    tag: "report-ready",
    notice: true,
    ...reportReadyEmail(owner.firstName, companyName, url, {
      sales: project.years.flatMap((row) => (row.salesCents === null ? [] : [{ year: row.year, cents: Number(row.salesCents) }])),
    }),
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
