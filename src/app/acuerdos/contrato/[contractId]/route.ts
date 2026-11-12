import { getCurrentUser } from "@/lib/server/get-current-user";
import { readContractFile } from "@/lib/server/sale-contract";
import { pdfResponse } from "@/lib/server/signed-documents";

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
