"use server";

import { redirect } from "next/navigation";
import { homeForRole } from "@/lib/auth-input";
import { platformTermsCopy } from "@/lib/platform-terms";
import { signatureBytes, signatureJpeg } from "@/lib/signature-image";
import { getCurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type TermsState = { ok: false; message: string } | null;

export async function acceptPlatformTermsAction(_state: TermsState, formData: FormData): Promise<TermsState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const bytes = signatureJpeg(formData.get("signature"));
  if (!bytes) {
    return { ok: false, message: platformTermsCopy.signRequired };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { termsAcceptedAt: new Date(), signaturePng: signatureBytes(bytes) },
  });

  redirect(homeForRole(user.role));
}
