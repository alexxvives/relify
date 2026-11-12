import { redirect } from "next/navigation";
import { PublicMenu } from "@/components/landing/public-menu";
import { isIntEnvironment } from "@/lib/int-env";
import { getCurrentUser } from "@/server/getCurrentUser";

export async function LandingHeader() {
  const user = await getCurrentUser();

  if (user && !user.onboarded) {
    redirect("/onboarding");
  }

  return (
    <header className="sticky top-0 z-40 px-4 py-2.5 pt-[max(0.5rem,env(safe-area-inset-top,0px))] sm:px-8 sm:py-4 sm:pt-[max(1rem,env(safe-area-inset-top,0px))]">
      <PublicMenu signedIn={Boolean(user)} showInt={isIntEnvironment()} />
    </header>
  );
}
