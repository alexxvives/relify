import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { PublicSite } from "@/components/public-site";
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
          ? "rounded-full bg-public-ink px-4 py-2 text-center text-sm text-public-paper"
          : "rounded-full px-4 py-2 text-center text-sm text-public-muted hover:text-public-ink"
      }
    >
      {label}
    </Link>
  );
}

export function AuthScreen({ mode }: { mode: AuthMode }) {
  return (
    <PublicSite>
      <main className="mx-auto grid w-full max-w-[1100px] items-stretch gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        <section className="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-public-ink text-public-paper shadow-public">
          <Image
            src="/cities/city-madrid.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-public-ink via-public-ink/75 to-public-ink/25" />
          <div className="relative flex h-full min-h-[420px] flex-col justify-between p-8 sm:p-12">
            <Logo tone="paper" size="lg" />
            <div>
              <p className="text-xs tracking-[0.22em] text-[#9fd4d1] uppercase">{authCopy.panelKicker}</p>
              <h1 className="mt-4 max-w-md text-[2.6rem] leading-[1.05] tracking-tight sm:text-5xl">
                <span className="block">{authCopy.headlineLead}</span>
                <span className="block">{authCopy.headlineMiddle}</span>
                <span className="releva-word block text-[1.15em] text-[#9fd4d1]">{authCopy.headlineAccent}</span>
                <span className="block">{authCopy.headlineTail}</span>
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-[#d5e6e6]">{authCopy.panelNote}</p>
            </div>
          </div>
        </section>
        <section className="flex flex-col justify-center rounded-[2rem] bg-public-card px-6 py-8 shadow-public sm:px-10 sm:py-12">
          <nav aria-label={authCopy.signInTitle} className="flex w-fit gap-1 rounded-full bg-public-sand p-1">
            <AuthTab href="/entrar" selected={mode === "sign-in"} label={authCopy.signInTitle} />
            <AuthTab href="/registro" selected={mode === "sign-up"} label={authCopy.signUpTitle} />
          </nav>
          <p className="mt-8 text-sm leading-6 text-public-muted">
            {mode === "sign-in" ? authCopy.signInIntro : authCopy.signUpIntro}
          </p>
          <div className="mt-6">{mode === "sign-in" ? <SignInForm /> : <SignUpForm />}</div>
          <Link href="/" className="mt-8 text-sm text-public-muted hover:text-public-ink">
            {authCopy.backHome}
          </Link>
        </section>
      </main>
    </PublicSite>
  );
}
