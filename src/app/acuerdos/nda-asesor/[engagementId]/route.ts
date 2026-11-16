import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/server/get-current-user";
import { pdfResponse, readSignedDocument } from "@/lib/server/signed-documents";

export async function GET(request: Request, context: { params: Promise<{ engagementId: string }> }): Promise<Response> {
  const user = await getCurrentUser();
  const { engagementId } = await context.params;

  if (!user?.onboarded) {
    return new Response(null, { status: 404 });
  }

  const row = await prisma.advisoryEngagement.findFirst({
    where: { id: engagementId, advisorNdaAcceptedAt: { not: null } },
    select: { advisorId: true, requesterId: true, project: { select: { ownerId: true } } },
  });

  if (!row || ![row.advisorId, row.requesterId, row.project.ownerId].includes(user.id)) {
    return new Response(null, { status: 404 });
  }

  const document = await readSignedDocument("advisor_nda", engagementId);
  return document ? pdfResponse(document, new URL(request.url).searchParams.has("download")) : new Response(null, { status: 404 });
}
