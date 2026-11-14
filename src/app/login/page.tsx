import { redirect } from "next/navigation";

/** Alias kept so old /login bookmarks still reach /entrar. */
export default function LoginPage() {
  redirect("/entrar");
}
