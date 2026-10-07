"use client";

import { useState, type FormEvent } from "react";
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
    <section className="rounded-[2rem] border border-public-line bg-public-card p-6 shadow-public sm:p-8">
      <h2 className="text-2xl tracking-tight">{blogCopy.newsletterTitle}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-public-muted">{blogCopy.newsletterBody}</p>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row" noValidate>
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
            className="h-12 w-full rounded-full border border-public-line bg-white px-4 text-sm"
          />
        </label>
        <button type="submit" className="inline-flex h-12 items-center justify-center rounded-full bg-public-clay px-5 text-sm text-white hover:bg-public-clay-deep">
          {blogCopy.newsletterButton}
        </button>
      </form>
      <p className={invalid ? "mt-3 text-sm text-red-700" : "mt-3 text-sm text-public-muted"} role={invalid ? "alert" : "status"}>
        {note ?? blogCopy.newsletterPrivacy}
      </p>
    </section>
  );
}
