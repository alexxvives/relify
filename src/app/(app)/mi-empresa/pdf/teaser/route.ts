import { getCurrentUser } from "@/server/getCurrentUser";
import { sellerTeaserPdf } from "@/server/companyPdfs";

export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(null, { status: 404 });
  }
  const download = new URL(request.url).searchParams.has("download");
  const response = await sellerTeaserPdf(user, download);
  return response ?? new Response(null, { status: 404 });
}
