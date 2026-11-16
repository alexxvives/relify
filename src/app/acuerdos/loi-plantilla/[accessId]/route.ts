import { getCurrentUser } from "@/lib/server/get-current-user";
import { dealLoiTemplatePdf } from "@/lib/server/company-pdfs";

export async function GET(request: Request, context: { params: Promise<{ accessId: string }> }): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(null, { status: 404 });
  }
  const { accessId } = await context.params;
  const download = new URL(request.url).searchParams.has("download");
  const response = await dealLoiTemplatePdf(user, accessId, download);
  return response ?? new Response(null, { status: 404 });
}
