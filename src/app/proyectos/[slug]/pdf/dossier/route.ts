import { getCurrentUser } from "@/server/getCurrentUser";
import { buyerDossierPdf } from "@/server/companyPdfs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(null, { status: 404 });
  }
  const { slug } = await context.params;
  const download = new URL(request.url).searchParams.has("download");
  const response = await buyerDossierPdf(user, slug, download);
  return response ?? new Response(null, { status: 404 });
}
