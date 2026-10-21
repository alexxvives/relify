import { SignatureDocument } from "@/components/platform-terms-dialog";
import { readPlatformSignature } from "@/server/platformSignature";

export async function SignedPlatformTerms({ userId, acceptedAt }: { userId: string; acceptedAt: Date }) {
  const when = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeZone: "Europe/Madrid",
  }).format(acceptedAt);
  const signature = await readPlatformSignature(userId);

  return <SignatureDocument when={when} signature={signature} />;
}
