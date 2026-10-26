import { SignatureDocument } from "@/components/platform-terms-dialog";

export function SignedPlatformTerms({ acceptedAt }: { userId: string; acceptedAt: Date }) {
  const when = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeZone: "Europe/Madrid",
  }).format(acceptedAt);

  return <SignatureDocument when={when} />;
}
