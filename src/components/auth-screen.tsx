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
    <div className="min-h-dvh bg-[#e7eef6] px-12 py-20 font-public text-[#16324f] sm:px-24 sm:py-28 lg:px-40 lg:py-32 xl:px-56 xl:py-40">
      <div className="relative flex min-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-[1.75rem] bg-[#f4f8fb] shadow-[0_24px_70px_-36px_rgba(22,50,79,0.35)] sm:min-h-[calc(100dvh-14rem)] lg:min-h-[calc(100dvh-16rem)] xl:min-h-[calc(100dvh-20rem)]">
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
        <div className="relative z-10 flex min-h-[inherit] flex-col px-6 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-6">
          <header>
            <Link href="/" aria-label="Releva">
              <Logo size="lg" />
            </Link>
          </header>
          <div className="grid flex-1 items-center gap-8 py-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,26rem)] lg:py-2">
            <section className="min-w-0">
              <p className="text-sm font-medium tracking-[0.2em] text-[#8aa0b2] uppercase">{authCopy.stageKicker}</p>
              <h1 className="mt-4 text-[2.6rem] leading-[1.02] font-semibold tracking-tight text-[#16324f] sm:text-[3.35rem]">
                <span className="block">{authCopy.stageHeadlineLead}</span>
                <span className="block">{authCopy.stageHeadlineTail}</span>
              </h1>
              <p className="mt-4 max-w-lg text-[17px] leading-7 text-[#7d8fa1]">{authCopy.stageBody}</p>
              <ul className="mt-6 space-y-4">
                {authCopy.stagePoints.map((point, index) => {
                  const Icon = stageIcons[index] ?? Shield;
                  return (
                    <li key={point.title} className="flex items-center gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/75 text-[#14998a] shadow-[0_8px_20px_-12px_rgba(22,50,79,0.45)]">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-base font-semibold text-[#16324f]">{point.title}</span>
                        <span className="mt-0.5 block text-[15px] leading-6 text-[#7d8fa1]">{point.body}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
            <div className="flex w-full flex-col items-center justify-center self-center">
              <p className="mb-4 text-center text-[15px] text-[#7d8fa1]">
                {signingUp ? authCopy.haveAccount : authCopy.needAccount}{" "}
                <Link
                  href={signingUp ? "/entrar" : "/registro"}
                  className="whitespace-nowrap font-medium text-[#14998a] hover:text-[#0f8578]"
                >
                  {signingUp ? authCopy.signIn : authCopy.signUp} →
                </Link>
              </p>
              <section className="w-full rounded-[1.75rem] border border-white/80 bg-white/95 px-8 py-9 shadow-[0_24px_50px_-28px_rgba(22,50,79,0.45)] backdrop-blur-sm sm:px-9 sm:py-10">
                <h2 className="text-center text-3xl font-semibold tracking-tight text-[#16324f]">
                  {signingUp ? authCopy.signUpCardTitle : authCopy.signInCardTitle}
                </h2>
                <p className="mt-3 text-center text-base leading-7 text-[#7d8fa1]">
                  {signingUp ? authCopy.signUpIntro : authCopy.signInIntro}
                </p>
                <div className="mt-8">{signingUp ? <SignUpForm /> : <SignInForm />}</div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
