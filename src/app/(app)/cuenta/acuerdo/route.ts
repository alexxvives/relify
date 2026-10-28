import { getCurrentUser } from "@/server/getCurrentUser";
import { pdfResponse, readSignedDocument } from "@/server/signedDocuments";

export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();

  if (!user?.onboarded || !user.termsAcceptedAt) {
    return new Response(null, { status: 404 });
  }

  const document = await readSignedDocument("terms", user.id);
  return document ? pdfResponse(document, new URL(request.url).searchParams.has("download")) : new Response(null, { status: 404 });
}
