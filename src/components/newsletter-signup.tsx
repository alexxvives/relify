"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { blogCopy } from "@/lib/blog";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setInvalid(true);
      setNote(blogCopy.newsletterInvalid);
      return;
    }
    setInvalid(false);
    setNote(blogCopy.newsletterOffline);
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-public-ink text-white shadow-public">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-[#1aa6a0]/30 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 left-10 size-48 rounded-full bg-public-clay/30 blur-2xl" />
      <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.7fr)]">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-[#9ad9d4] uppercase">
            <Mail className="size-4" aria-hidden />
            {blogCopy.kicker}
          </p>
          <h2 className="releva-page-title mt-3 text-4xl leading-[0.98] text-white sm:text-5xl">{blogCopy.newsletterTitle}</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/75">{blogCopy.newsletterBody}</p>
          <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row" noValidate>
            <label className="min-w-0 flex-1">
              <span className="sr-only">{blogCopy.newsletterPlaceholder}</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                aria-invalid={invalid}
                placeholder={blogCopy.newsletterPlaceholder}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setInvalid(false);
                }}
                className="h-12 w-full rounded-full border border-white/15 bg-white px-4 text-sm text-public-ink"
              />
            </label>
            <button type="submit" className="inline-flex h-12 items-center justify-center rounded-full bg-public-clay px-5 text-sm text-white hover:bg-public-clay-deep">
              {blogCopy.newsletterButton}
            </button>
          </form>
          <p className={invalid ? "mt-3 text-sm text-[#ffd0c8]" : "mt-3 text-sm text-white/60"} role={invalid ? "alert" : "status"}>
            {note ?? blogCopy.newsletterPrivacy}
          </p>
        </div>
        <div className="relative mx-auto hidden w-full max-w-sm lg:block" aria-hidden>
          <div className="absolute top-4 right-6 h-44 w-[78%] rotate-6 rounded-2xl bg-[#1aa6a0]/80" />
          <div className="absolute top-8 right-10 h-44 w-[78%] -rotate-3 rounded-2xl bg-public-clay/90" />
          <div className="relative rounded-2xl bg-white p-5 text-public-ink shadow-[0_20px_50px_-24px_rgba(0,0,0,0.55)]">
            <p className="text-xs font-medium tracking-[0.16em] text-public-clay uppercase">Nota</p>
            <p className="mt-3 text-xl leading-tight font-semibold">Qué mirar antes de pedir el NDA</p>
            <div className="mt-4 space-y-2">
              <span className="block h-2 w-full rounded-full bg-[#e7eaee]" />
              <span className="block h-2 w-11/12 rounded-full bg-[#e7eaee]" />
              <span className="block h-2 w-4/5 rounded-full bg-[#e7eaee]" />
              <span className="block h-2 w-9/12 rounded-full bg-[#d7f3f1]" />
            </div>
            <p className="mt-5 text-xs text-public-muted">Una lectura al mes. Sin envíos todavía.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
