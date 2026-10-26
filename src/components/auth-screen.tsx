import Image from "next/image";
import Link from "next/link";
import { Handshake, Shield, TrendingUp } from "lucide-react";
import { PublicMenu } from "@/components/landing/public-menu";
import { SignInForm } from "@/components/sign-in-form";
import { SignUpForm, type SignupIntent } from "@/components/sign-up-form";
import { authCopy } from "@/lib/auth-copy";

type AuthMode = "sign-in" | "sign-up";

const stageIcons = [Shield, Handshake, TrendingUp] as const;

export function AuthScreen({ mode, intent = null }: { mode: AuthMode; intent?: SignupIntent | null }) {
  const signingUp = mode === "sign-up";

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#e7eef6] font-public text-[#16324f]">
      <div className="shrink-0 px-5 pt-4 sm:px-8">
        <PublicMenu signedIn={false} />
      </div>
      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col px-6 xl:max-w-[80%] pt-3 pb-8 sm:px-10 lg:pb-10 lg:px-16 xl:px-24">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-[#f4f8fb] shadow-[0_24px_70px_-36px_rgba(22,50,79,0.35)]">
          <Image
            src="/auth/login-background.jpg"
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover object-[54%_24%]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(244,248,251,0.97)_0%,rgba(244,248,251,0.9)_14%,rgba(244,248,251,0.62)_28%,rgba(244,248,251,0.18)_42%,rgba(244,248,251,0)_50%,rgba(244,248,251,0.22)_62%,rgba(244,248,251,0.72)_78%,rgba(244,248,251,0.96)_100%)]"
          />
          <div className="relative z-10 flex h-full min-h-0 flex-col px-6 py-5 sm:px-8 sm:py-5 lg:px-10 lg:py-5">
            <div className="relative flex flex-1 flex-col justify-center gap-8 py-4 lg:block lg:py-2">
              <section className="min-w-0 lg:absolute lg:top-1/2 lg:left-0 lg:w-[min(38rem,calc(52%-1rem))] lg:-translate-y-1/2">
                <p className="text-base font-medium tracking-[0.22em] text-[#8aa0b2] uppercase">{authCopy.stageKicker}</p>
                <h1 className="mt-4 text-[clamp(3rem,4.6vw,4.5rem)] xl:text-[clamp(3rem,3.7vw,3.75rem)] leading-[0.98] font-semibold tracking-tight text-[#16324f]">
                  <span className="block">{authCopy.stageHeadlineLead}</span>
                  <span className="block">{authCopy.stageHeadlineTail}</span>
                </h1>
                <p className="mt-5 max-w-[24rem] text-xl leading-8 text-[#7d8fa1]">{authCopy.stageBody}</p>
                <ul className="mt-8 space-y-5">
                  {authCopy.stagePoints.map((point, index) => {
                    const Icon = stageIcons[index] ?? Shield;
                    return (
                      <li key={point.title} className="flex items-center gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/75 text-[#14998a] shadow-[0_8px_20px_-12px_rgba(22,50,79,0.45)]">
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-lg font-semibold text-[#16324f]">{point.title}</span>
                          <span className="mt-0.5 block text-base leading-6 text-[#7d8fa1]">{point.body}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <div className="flex w-full flex-col items-center justify-center lg:absolute lg:top-1/2 lg:left-[78%] lg:w-[min(30rem,46%)] lg:-translate-x-1/2 lg:-translate-y-1/2">
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
                  <div className="mt-8">{signingUp ? <SignUpForm intent={intent} /> : <SignInForm />}</div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
