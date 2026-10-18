import { readFile } from "node:fs/promises";
import path from "node:path";
import { SignedTermsButton } from "@/components/platform-terms-dialog";

export async function SignedPlatformTerms({ userId, acceptedAt }: { userId: string; acceptedAt: Date }) {
  const when = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeZone: "Europe/Madrid",
  }).format(acceptedAt);
  let signature: string | null = null;

  try {
    const bytes = await readFile(path.join(process.cwd(), "data", "platform-signatures", `${userId}.png`));
    signature = `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    signature = null;
  }

  return <SignedTermsButton when={when} signature={signature} />;
}
