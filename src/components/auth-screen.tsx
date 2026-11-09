import Image from "next/image";
import Link from "next/link";
import { Handshake, Shield, TrendingUp } from "lucide-react";
import { PublicMenu } from "@/components/landing/public-menu";
import { SignInForm } from "@/components/sign-in-form";
import { SignUpForm, type SignupIntent } from "@/components/sign-up-form";
import {
  ForgotPasswordForm,
  ResetPasswordForm,
} from "@/components/password-reset-forms";
import { authCopy } from "@/lib/auth-copy";

type AuthMode = "sign-in" | "sign-up" | "forgot" | "reset";

const stageIcons = [Shield, Handshake, TrendingUp] as const;

export function AuthScreen({
  mode,
  intent = null,
  token = null,
}: {
  mode: AuthMode;
  intent?: SignupIntent | null;
  token?: string | null;
}) {
  const signingUp = mode === "sign-up";
  const card =
    mode === "forgot"
      ? {
          title: authCopy.forgotCardTitle,
          intro: authCopy.forgotIntro,
          form: <ForgotPasswordForm />,
        }
      : mode === "reset"
        ? {
            title: authCopy.resetCardTitle,
            intro: authCopy.resetIntro,
            form: <ResetPasswordForm token={token} />,
          }
        : signingUp
          ? {
              title: authCopy.signUpCardTitle,
              intro: authCopy.signUpIntro,
              form: <SignUpForm intent={intent} />,
            }
          : {
              title: authCopy.signInCardTitle,
              intro: authCopy.signInIntro,
              form: <SignInForm />,
            };

  return (
    <div className="flex min-h-dvh flex-col bg-[#e7eef6] lg:h-dvh lg:max-h-dvh lg:overflow-hidden font-public text-[#16324f]">
      <div className="shrink-0 px-4 pt-3 sm:px-5 sm:pt-4 lg:px-8 short:pt-2">
        <PublicMenu signedIn={false} />
      </div>
      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col px-4 pt-2 pb-6 sm:px-6 sm:pt-3 sm:pb-8 lg:px-10 lg:pb-10 xl:max-w-[80%] xl:px-16 2xl:px-24 short:pt-2 short:lg:pb-4">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl sm:rounded-[1.75rem] bg-[#f4f8fb] shadow-[0_24px_70px_-36px_rgba(22,50,79,0.35)]">
          <Image
            src="/auth/login-background.jpg"
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover object-[54%_24%] tiny:hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(244,248,251,0.97)_0%,rgba(244,248,251,0.9)_14%,rgba(244,248,251,0.62)_28%,rgba(244,248,251,0.18)_42%,rgba(244,248,251,0)_50%,rgba(244,248,251,0.22)_62%,rgba(244,248,251,0.72)_78%,rgba(244,248,251,0.96)_100%)]"
          />
          <div className="relative z-10 flex h-full min-h-0 flex-col px-6 py-5 sm:px-8 sm:py-5 lg:px-10 lg:py-5">
            <div className="relative flex flex-1 flex-col justify-center gap-4 py-3 sm:gap-8 sm:py-4 lg:block lg:py-2">
              <section className="min-w-0 lg:absolute lg:top-1/2 lg:left-0 lg:w-[min(38rem,calc(52%-1rem))] lg:-translate-y-1/2 short:lg:w-[min(34rem,calc(52%-1rem))]">
                <p className="text-sm font-medium tracking-[0.22em] sm:text-base short:text-xs short:tracking-[0.18em] text-[#8aa0b2] uppercase">
                  {authCopy.stageKicker}
                </p>
                <h1 className="mt-2 text-[2rem] sm:mt-4 sm:text-[3rem] lg:text-[clamp(3rem,4.6vw,4.5rem)] xl:text-[clamp(3rem,3.7vw,3.75rem)] short:mt-2 short:text-[clamp(2.25rem,3.4vw,2.875rem)] short:xl:text-[clamp(2.25rem,3vw,2.875rem)] tiny:text-[2rem] tiny:xl:text-[2rem] leading-[0.98] font-semibold tracking-tight text-[#16324f]">
                  <span className="block">{authCopy.stageHeadlineLead}</span>
                  <span className="block">{authCopy.stageHeadlineTail}</span>
                </h1>
                <p className="mt-3 hidden max-w-[24rem] text-base leading-6 text-[#7d8fa1] sm:mt-5 sm:block sm:text-xl sm:leading-8 short:mt-3 short:text-base short:leading-6 tiny:text-sm tiny:leading-5">
                  {authCopy.stageBody}
                </p>
                <ul className="mt-8 hidden space-y-5 sm:block short:mt-4 short:space-y-2 tiny:mt-3 tiny:space-y-1.5">
                  {authCopy.stagePoints.map((point, index) => {
                    const Icon = stageIcons[index] ?? Shield;
                    return (
                      <li key={point.title} className="flex items-center gap-4 short:gap-3">
                        <span className="flex size-12 short:size-8 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/75 text-[#14998a] shadow-[0_8px_20px_-12px_rgba(22,50,79,0.45)]">
                          <Icon className="size-5 short:size-4" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-lg font-semibold text-[#16324f] short:text-base">
                            {point.title}
                          </span>
                          <span className="mt-0.5 block text-base leading-6 text-[#7d8fa1] short:hidden">
                            {point.body}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <div className="flex w-full flex-col items-center justify-center lg:absolute lg:top-1/2 lg:left-[78%] lg:w-[min(30rem,46%)] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:max-h-full short:lg:w-[min(27rem,44%)]">
                <section className="w-full max-w-md mx-auto rounded-2xl sm:rounded-[1.75rem] border border-white/80 bg-white/95 px-5 py-5 sm:px-8 sm:py-9 lg:px-9 lg:py-10 shadow-[0_24px_50px_-28px_rgba(22,50,79,0.45)] backdrop-blur-sm lg:max-h-full lg:overflow-y-auto short:px-7 short:py-5 tiny:px-5 tiny:py-4">
                  <h2 className="text-center text-2xl sm:text-3xl short:text-2xl font-semibold tracking-tight text-[#16324f]">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-center text-sm leading-6 text-[#7d8fa1] sm:mt-3 sm:text-base sm:leading-7 short:mt-1 short:text-sm short:leading-5">
                    {card.intro}
                  </p>
                  <div className="mt-5 sm:mt-8 short:mt-4">{card.form}</div>
                  {mode === "forgot" || mode === "reset" ? (
                    <p className="mt-5 text-center text-[15px] text-[#7d8fa1] short:mt-3 short:text-sm">
                      <Link
                        href="/entrar"
                        className="font-medium text-[#14998a] hover:text-[#0f8578]"
                      >
                        ← {authCopy.backToSignIn}
                      </Link>
                    </p>
                  ) : (
                    <p className="mt-5 text-center text-[15px] text-[#7d8fa1] short:mt-3 short:text-sm">
                      {signingUp ? authCopy.haveAccount : authCopy.needAccount}{" "}
                      <Link
                        href={signingUp ? "/entrar" : "/registro"}
                        className="whitespace-nowrap font-medium text-[#14998a] hover:text-[#0f8578]"
                      >
                        {signingUp ? authCopy.signIn : authCopy.signUp} →
                      </Link>
                    </p>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
