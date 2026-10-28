"use server";

import { getCurrentUser } from "@/server/getCurrentUser";
import { setProjectHidden, type HiddenResult } from "@/server/toggleProjectHidden";

export async function setHiddenAction(slug: string, hidden: boolean): Promise<HiddenResult> {
  const user = await getCurrentUser();
  if (!user || typeof slug !== "string" || typeof hidden !== "boolean") {
    return { ok: false, message: "Inicia sesión para ocultar empresas." };
  }
  return setProjectHidden(user, slug, hidden);
}
