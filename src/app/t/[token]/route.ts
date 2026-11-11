import { publicTeaserPdf } from "@/server/companyPdfs";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await context.params;
  const download = new URL(request.url).searchParams.has("download");
  const response = await publicTeaserPdf(token, download);
  return response ?? new Response(null, { status: 404 });
}
