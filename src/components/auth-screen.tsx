import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SignInForm } from "@/components/sign-in-form";
import { SignUpForm } from "@/components/sign-up-form";
import { authCopy } from "@/lib/auth-copy";

type AuthMode = "sign-in" | "sign-up";

function AuthTab({ href, selected, label }: { href: string; selected: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={selected ? "page" : undefined}
      className={
        selected
          ? "border-b-4 border-public-clay pb-3 text-center text-sm text-public-ink"
          : "border-b-4 border-transparent pb-3 text-center text-sm text-public-muted hover:text-public-ink"
      }
    >
      {label}
    </Link>
  );
}

export function AuthScreen({ mode }: { mode: AuthMode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-public-paper px-4 py-10 font-public text-public-ink">
      <div className="flex w-full max-w-[1040px] flex-col gap-4">
        <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm text-public-ink hover:text-public-clay">
          <ArrowLeft className="size-4" aria-hidden />
          {authCopy.backHome}
        </Link>
        <section className="grid w-full border border-public-ink bg-public-card shadow-public md:min-h-[560px] md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex min-h-[280px] flex-col justify-between bg-public-ink px-8 py-10 text-public-paper md:px-12 md:py-12">
            <h1 className="text-[2.35rem] leading-[1.08] tracking-tight md:text-[2.75rem]">
              <span className="block">{authCopy.headlineLead}</span>
              <span className="block">{authCopy.headlineMiddle}</span>
              <span className="block text-public-clay italic">{authCopy.headlineAccent}</span>
              <span className="block">{authCopy.headlineTail}</span>
            </h1>
            <p className="inline-flex items-baseline gap-2 text-2xl tracking-tight">
              <span className="inline-block size-2.5 bg-public-clay" aria-hidden="true" />
              Releva
            </p>
          </div>
          <div className="flex flex-col px-6 py-8 sm:px-10 sm:py-10">
            <nav aria-label={authCopy.signInTitle} className="grid grid-cols-2 border-b border-public-line">
              <AuthTab href="/entrar" selected={mode === "sign-in"} label={authCopy.signInTitle} />
              <AuthTab href="/registro" selected={mode === "sign-up"} label={authCopy.signUpTitle} />
            </nav>
            <div className="mt-8">{mode === "sign-in" ? <SignInForm /> : <SignUpForm />}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
