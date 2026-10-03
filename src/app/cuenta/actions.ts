"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/getCurrentUser";
import { markNotificationsRead } from "@/server/markNotificationsRead";
import { signOut } from "@/server/signOut";

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/entrar");
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  await markNotificationsRead(user.id);
  revalidatePath("/", "layout");
}
