import { platformTermsPdf } from "@/lib/agreement-pdf";
import { jpegSize } from "@/lib/signature-image";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/getCurrentUser";

export async function GET(): Promise<Response> {
  const user = await getCurrentUser();

  if (!user?.onboarded || !user.termsAcceptedAt) {
    return new Response(null, { status: 404 });
  }

  const when = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeZone: "Europe/Madrid",
  }).format(user.termsAcceptedAt);
  const stored = await prisma.user.findUnique({
    where: { id: user.id },
    select: { signaturePng: true },
  });
  const signature = stored?.signaturePng ? Buffer.from(stored.signaturePng) : null;
  const bytes = platformTermsPdf(when, signature && jpegSize(signature) ? signature : null);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Acuerdo-con-Relify.pdf"; filename*=UTF-8\'\'Acuerdo-con-Relify.pdf',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
