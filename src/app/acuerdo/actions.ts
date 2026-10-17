"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { homeForRole } from "@/lib/auth-input";
import { platformTermsCopy } from "@/lib/platform-terms";
import { getCurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type TermsState = { ok: false; message: string } | null;

export async function acceptPlatformTermsAction(_state: TermsState, formData: FormData): Promise<TermsState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const signature = formData.get("signature");
  if (typeof signature !== "string" || !signature.startsWith("data:image/png;base64,")) {
    return { ok: false, message: platformTermsCopy.signRequired };
  }

  const bytes = Buffer.from(signature.slice("data:image/png;base64,".length), "base64");
  if (bytes.byteLength < 80 || bytes.byteLength > 400_000) {
    return { ok: false, message: platformTermsCopy.signRequired };
  }

  const folder = path.join(process.cwd(), "data", "platform-signatures");
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, `${user.id}.png`), bytes);

  await prisma.user.update({
    where: { id: user.id },
    data: { termsAcceptedAt: new Date() },
  });

  redirect(homeForRole(user.role));
}
