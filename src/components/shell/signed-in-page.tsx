import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/server/get-current-user";

/**
 * Page heading + body inside the persistent (app) layout. The sidebar frame lives in
 * src/app/(app)/layout.tsx, so changing page never re-renders or reloads the menu.
 */
export async function SignedInPage({
  title,
  showTitle = true,
  greeting = false,
  children,
}: {
  title: string;
  showTitle?: boolean;
  /** Replace the title with a "Hola, {nombre}" heading (role homes). */
  greeting?: boolean;
  children: ReactNode;
}) {
  const user = greeting ? await getCurrentUser() : null;
  const heading = greeting && user ? `Hola, ${user.displayName.split(" ")[0] ?? user.displayName}` : title;
  const show = greeting || showTitle;

  return (
    <>
      {show ? <h1 className="text-2xl tracking-tight text-public-ink sm:text-[1.75rem]">{heading}</h1> : null}
      <div className={show ? "mt-5" : undefined}>{children}</div>
    </>
  );
}
