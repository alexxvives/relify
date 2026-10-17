import { readFile } from "node:fs/promises";
import path from "node:path";
import { platformTermsCopy } from "@/lib/platform-terms";

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

  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
      <h2 className="text-xl font-semibold text-[#1c2740]">{platformTermsCopy.signedTitle}</h2>
      <p className="mt-1 text-sm text-[#64748b]">
        {platformTermsCopy.signedOn} {when}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {platformTermsCopy.body.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-6 text-[#3d4a63]">
            {paragraph}
          </p>
        ))}
      </div>
      {signature ? (
        // The signature is a drawing stored for this account, not a remote image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={signature} alt="" className="mt-4 h-24 w-full max-w-md rounded-xl border border-[#e7eaee] bg-[#fbfbfc] object-contain" />
      ) : (
        <p className="mt-4 text-sm text-[#64748b]">{platformTermsCopy.signedMissing}</p>
      )}
    </section>
  );
}
