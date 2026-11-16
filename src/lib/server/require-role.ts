import { redirect } from "next/navigation";
import { homeForRole, type UserRoleName } from "@/lib/auth-input";
import { getCurrentUser, type CurrentUser } from "@/lib/server/get-current-user";

export async function requireRole(role: UserRoleName): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  if (user.role !== role) {
    redirect(homeForRole(user.role));
  }

  return user;
}
