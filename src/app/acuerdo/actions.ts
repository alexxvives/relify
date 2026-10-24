"use server";

import { redirect } from "next/navigation";
import { homeForRole } from "@/lib/auth-input";
import { platformTermsCopy } from "@/lib/platform-terms";
import { signatureBytes, signatureJpeg } from "@/lib/signature-image";
import { getCurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { ensureNationalId } from "@/server/ensureNationalId";
import { storeSignedDocumentQuietly } from "@/server/signedDocuments";

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

  const idError = await ensureNationalId(user.id, formData.get("nationalId"));
  if (idError) {
    return { ok: false, message: idError };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { termsAcceptedAt: new Date(), signaturePng: signatureBytes(bytes) },
  });
  await storeSignedDocumentQuietly("terms", user.id);

  redirect(homeForRole(user.role));
}
