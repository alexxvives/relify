import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/cuenta/actions";
import { authCopy } from "@/lib/auth-copy";
import { getCurrentUser } from "@/server/getCurrentUser";

export async function AccountNav() {
  const user = await getCurrentUser();

  if (user && !user.onboarded) {
    redirect("/onboarding");
  }

  if (!user) {
    return (
      <>
        <Link href="/entrar" className="text-public-paper hover:text-public-clay">
          {authCopy.signIn}
        </Link>
        <Link href="/registro" className="text-public-paper hover:text-public-clay">
          {authCopy.signUp}
        </Link>
      </>
    );
  }

  const roleLabel = user.role ? authCopy.roles[user.role] : authCopy.roleMissing;

  return (
    <>
      <Link href="/cuenta" className="text-public-paper hover:text-public-clay">
        {user.name}
      </Link>
      <span className="text-public-sand">{roleLabel}</span>
      <form action={signOutAction}>
        <button type="submit" className="text-public-paper hover:text-public-clay">
          {authCopy.signOut}
        </button>
      </form>
    </>
  );
}
