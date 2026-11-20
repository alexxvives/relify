import { privateFileResponse } from "@/lib/file-response";
import { readAdvisorDocument } from "@/lib/server/advisor-documents";
import { getCurrentUser } from "@/lib/server/get-current-user";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const user = await getCurrentUser();

  if (!user || !user.onboarded || user.role !== "advisor") {
    return new Response(null, { status: 404 });
  }

  const { id } = await context.params;
  const file = await readAdvisorDocument(user.id, id);
  return file ? privateFileResponse(file.fileName, file.bytes) : new Response(null, { status: 404 });
}
