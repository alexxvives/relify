import { getCurrentUser } from "@/server/getCurrentUser";
import { readContractFile } from "@/server/saleContract";
import { pdfResponse } from "@/server/signedDocuments";

export async function GET(request: Request, context: { params: Promise<{ contractId: string }> }): Promise<Response> {
  const user = await getCurrentUser();
  const { contractId } = await context.params;

  if (!user?.onboarded) {
    return new Response(null, { status: 404 });
  }

  const params = new URL(request.url).searchParams;
  const file = await readContractFile(user, contractId, params.has("firmado"));
  return file ? pdfResponse(file, params.has("download")) : new Response(null, { status: 404 });
}
