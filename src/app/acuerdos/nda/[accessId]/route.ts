import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/get-current-user";
import { pdfResponse, readSignedDocument } from "@/lib/server/signed-documents";

export async function GET(request: Request, context: { params: Promise<{ accessId: string }> }): Promise<Response> {
  const user = await getCurrentUser();
  const { accessId } = await context.params;

  if (!user?.onboarded) {
    return new Response(null, { status: 404 });
  }

  const access = await prisma.projectAccess.findFirst({
    where: { id: accessId, ndaAcceptedAt: { not: null }, cancelledAt: null },
    select: { investorId: true, project: { select: { ownerId: true } } },
  });

  if (!access || (access.investorId !== user.id && access.project.ownerId !== user.id)) {
    return new Response(null, { status: 404 });
  }

  const document = await readSignedDocument("nda", accessId);
  return document ? pdfResponse(document, new URL(request.url).searchParams.has("download")) : new Response(null, { status: 404 });
}
