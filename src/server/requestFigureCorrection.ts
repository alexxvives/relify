import { readSiteUrl } from "@/lib/env";
import { figureCorrectionEmail, figureCorrectionMaxLength } from "@/lib/figure-correction-email";
import { prisma } from "@/server/db";
import { sendMail } from "@/server/mailer";

/** t76: the seller cannot edit loaded figures; they propose a correction and the team applies it. */
export async function requestFigureCorrection(
  user: { id: string; name: string | null; email: string },
  projectId: string,
  message: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const text = message.trim();
  if (text.length < 10) {
    return { ok: false, message: "Cuéntanos qué cifra hay que corregir y el valor correcto." };
  }
  if (text.length > figureCorrectionMaxLength) {
    return { ok: false, message: `Máximo ${figureCorrectionMaxLength} caracteres.` };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { slug: true, legalName: true, codename: true },
  });
  if (!project) {
    return { ok: false, message: "No encontramos tu empresa." };
  }

  const { to, ...mail } = figureCorrectionEmail({
    companyName: project.legalName || project.codename,
    ownerName: user.name ?? "",
    ownerEmail: user.email,
    message: text,
    adminUrl: new URL(`/admin/empresas/${project.slug}`, readSiteUrl()).toString(),
  });
  const result = await sendMail({ to, tag: "figure-correction", ...mail });
  if (result.status !== "sent") {
    return { ok: false, message: "No hemos podido enviarlo. Inténtalo de nuevo en unos minutos." };
  }
  return { ok: true };
}
