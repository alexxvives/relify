import { agreementPdf } from "@/lib/agreement-pdf";
import { ndaAgreement, spanishDate } from "@/lib/deal-documents";
import { jpegSize } from "@/lib/signature-image";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/getCurrentUser";

export async function GET(_request: Request, context: { params: Promise<{ accessId: string }> }): Promise<Response> {
  const user = await getCurrentUser();
  const { accessId } = await context.params;

  if (!user?.onboarded) {
    return new Response(null, { status: 404 });
  }

  const access = await prisma.projectAccess.findFirst({
    where: { id: accessId, ndaAcceptedAt: { not: null }, cancelledAt: null },
    select: {
      ndaAcceptedAt: true,
      ndaSignature: true,
      investor: { select: { id: true, name: true, lastName: true } },
      project: { select: { ownerId: true, codename: true, region: true } },
    },
  });

  if (!access || (access.investor.id !== user.id && access.project.ownerId !== user.id)) {
    return new Response(null, { status: 404 });
  }

  const buyerName = [access.investor.name, access.investor.lastName ?? ""].filter((part) => part.trim().length > 0).join(" ");
  const text = ndaAgreement({
    buyerName,
    codename: access.project.codename,
    region: access.project.region,
    dateLabel: spanishDate(access.ndaAcceptedAt ?? new Date()),
  });
  const signature = access.ndaSignature ? Buffer.from(access.ndaSignature) : null;
  const bytes = agreementPdf(text, signature && jpegSize(signature) ? signature : null);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Acuerdo-de-confidencialidad.pdf"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
