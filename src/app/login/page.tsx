import { redirect } from "next/navigation";

/** Direct sign-in for admins and existing users while the landing's "Acceder" button points to the waitlist. */
export default function LoginPage() {
  redirect("/entrar");
}
