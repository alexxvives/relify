import Image from "next/image";
import Link from "next/link";
import { Handshake, Shield, TrendingUp } from "lucide-react";
import { Logo } from "@/components/logo";
import { SignInForm } from "@/components/sign-in-form";
import { SignUpForm } from "@/components/sign-up-form";
import { authCopy } from "@/lib/auth-copy";

type AuthMode = "sign-in" | "sign-up";

const stageIcons = [Shield, Handshake, TrendingUp] as const;

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const signingUp = mode === "sign-up";

  return (
    <div className="min-h-dvh bg-[#e7eef6] px-6 py-10 font-public text-[#16324f] sm:px-12 sm:py-14 lg:px-20 lg:py-16 xl:px-28 xl:py-20">
      <div className="relative flex min-h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-[1.75rem] bg-[#f4f8fb] shadow-[0_24px_70px_-36px_rgba(22,50,79,0.35)] sm:min-h-[calc(100dvh-7rem)] lg:min-h-[calc(100dvh-8rem)] xl:min-h-[calc(100dvh-10rem)]">
        <Image
          src="/auth/login-background.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_42%]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(244,248,251,0.97)_0%,rgba(244,248,251,0.9)_14%,rgba(244,248,251,0.62)_28%,rgba(244,248,251,0.18)_42%,rgba(244,248,251,0)_50%,rgba(244,248,251,0.22)_62%,rgba(244,248,251,0.72)_78%,rgba(244,248,251,0.96)_100%)]"
        />
        <div className="relative z-10 flex min-h-[inherit] flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-12 lg:py-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="Releva">
              <Logo />
            </Link>
            <p className="text-right text-[13px] leading-5 text-[#7d8fa1] sm:text-sm">
              {signingUp ? authCopy.haveAccount : authCopy.needAccount}{" "}
              <Link
                href={signingUp ? "/entrar" : "/registro"}
                className="whitespace-nowrap font-medium text-[#14998a] hover:text-[#0f8578]"
              >
                {signingUp ? authCopy.signIn : authCopy.signUp} →
              </Link>
            </p>
          </header>
          <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,36rem)_minmax(1.25rem,1fr)_23.5rem] lg:gap-6 lg:py-4">
            <section>
              <p className="text-[11px] font-medium tracking-[0.22em] text-[#8aa0b2] uppercase">{authCopy.stageKicker}</p>
              <h1 className="mt-4 max-w-[16ch] text-[2.35rem] leading-[1.05] font-semibold tracking-tight text-[#16324f] sm:max-w-none sm:text-[2.85rem]">
                <span className="block">{authCopy.stageHeadlineLead}</span>
                <span className="block">{authCopy.stageHeadlineTail}</span>
              </h1>
              <p className="mt-5 max-w-sm text-[15px] leading-6 text-[#7d8fa1]">{authCopy.stageBody}</p>
              <ul className="mt-8 space-y-4">
                {authCopy.stagePoints.map((point, index) => {
                  const Icon = stageIcons[index] ?? Shield;
                  return (
                    <li key={point.title} className="flex items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/75 text-[#14998a] shadow-[0_8px_20px_-12px_rgba(22,50,79,0.45)]">
                        <Icon className="size-[18px]" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-[#16324f]">{point.title}</span>
                        <span className="block text-[13px] leading-5 text-[#7d8fa1]">{point.body}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
            <div className="hidden lg:block" aria-hidden />
            <section className="rounded-[1.6rem] border border-white/80 bg-white/95 px-6 py-7 shadow-[0_24px_50px_-28px_rgba(22,50,79,0.45)] backdrop-blur-sm sm:px-8 sm:py-9">
              <h2 className="text-[1.65rem] font-semibold tracking-tight text-[#16324f]">
                {signingUp ? authCopy.signUpCardTitle : authCopy.signInCardTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#7d8fa1]">
                {signingUp ? authCopy.signUpIntro : authCopy.signInIntro}
              </p>
              <div className="mt-6">{signingUp ? <SignUpForm /> : <SignInForm />}</div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
