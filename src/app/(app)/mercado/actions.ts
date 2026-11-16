"use server";

import { getCurrentUser } from "@/lib/server/get-current-user";
import { setProjectHidden, type HiddenResult } from "@/lib/server/toggle-project-hidden";

export async function setHiddenAction(slug: string, hidden: boolean): Promise<HiddenResult> {
  const user = await getCurrentUser();
  if (!user || typeof slug !== "string" || typeof hidden !== "boolean") {
    return { ok: false, message: "Inicia sesión para ocultar empresas." };
  }
  return setProjectHidden(user, slug, hidden);
}
