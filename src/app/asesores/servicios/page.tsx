import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/getCurrentUser";

// Legacy URL: signed-in advisors land on their own page, everyone else on the public advisor page.
export default async function Page() {
  const user = await getCurrentUser();
  redirect(user?.role === "advisor" ? "/mis-servicios" : "/asesores");
}
