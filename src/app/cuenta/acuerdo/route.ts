import { platformTermsPdf } from "@/lib/agreement-pdf";
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
  const bytes = platformTermsPdf(when);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Acuerdo-con-Releva.pdf"; filename*=UTF-8\'\'Acuerdo-con-Releva.pdf',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
