import { redirect } from "next/navigation";
import { PublicMenu } from "@/components/landing/public-menu";
import { getCurrentUser } from "@/server/getCurrentUser";

export async function LandingHeader() {
  const user = await getCurrentUser();

  if (user && !user.onboarded) {
    redirect("/onboarding");
  }

  return (
    <header className="sticky top-0 z-40 px-5 py-4 sm:px-8">
      <PublicMenu signedIn={Boolean(user)} />
    </header>
  );
}
