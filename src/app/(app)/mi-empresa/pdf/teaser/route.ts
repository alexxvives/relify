import { getCurrentUser } from "@/server/getCurrentUser";
import { sellerTeaserPdf } from "@/server/companyPdfs";

export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(null, { status: 404 });
  }
  const params = new URL(request.url).searchParams;
  const download = params.has("download");
  const preview = params.has("preview");
  const response = await sellerTeaserPdf(user, download, { log: download && !preview });
  return response ?? new Response(null, { status: 404 });
}
