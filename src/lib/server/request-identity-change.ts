import { emailSiteUrl } from "@/lib/env";
import { identityChangeEmail, readIdentityChange } from "@/lib/identity-change-email";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/server/mailer";

/** t79: legal name / NIF are locked after verification; the seller asks the team (info@) to change them. */
export async function requestIdentityChange(
  user: { id: string; name: string | null; email: string },
  projectId: string,
  input: { field: string; current: string; correct: string; reason: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = readIdentityChange(input);
  if (!parsed.ok) {
    return parsed;
  }
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { slug: true, codename: true },
  });
  if (!project) {
    return { ok: false, message: "No encontramos tu empresa." };
  }
  const { to, ...mail } = identityChangeEmail({
    request: parsed.request,
    codename: project.codename,
    ownerName: user.name ?? "",
    ownerEmail: user.email,
    adminUrl: new URL(`/admin/empresas/${project.slug}`, emailSiteUrl()).toString(),
  });
  const result = await sendMail({ to, tag: "identity-change", ...mail });
  if (result.status !== "sent") {
    return { ok: false, message: "No hemos podido enviarlo. Inténtalo de nuevo en unos minutos." };
  }
  return { ok: true };
}
