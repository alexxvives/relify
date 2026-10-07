"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Shuffle, Sparkles } from "lucide-react";
import { verifyCompanyNifAction, type VerifyNifState } from "@/app/mi-empresa/nif-actions";
import { companyCopy } from "@/lib/company-copy";

const notes = [
  { icon: LockKeyhole, title: companyCopy.nifConfidential, body: companyCopy.nifConfidentialBody },
  { icon: Sparkles, title: companyCopy.nifAutofill, body: companyCopy.nifAutofillBody },
  { icon: Shuffle, title: companyCopy.nifAlias, body: companyCopy.nifAliasBody },
] as const;

export function CompanyNifForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<VerifyNifState, FormData>(verifyCompanyNifAction, null);
  const [nif, setNif] = useState("");

  useEffect(() => {
    if (state?.ok) {
      router.push("/mi-empresa/detalles?alta=1");
    }
  }, [state, router]);

  return (
    <section className="mx-auto mt-6 w-full max-w-3xl rounded-3xl border border-[#e6e9f0] bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight">{companyCopy.nifTitle}</h2>
      <p className="mt-1 text-xs font-medium tracking-wide text-[#5c6b78] uppercase">{companyCopy.setupNifStep}</p>
      <p className="mt-2 text-sm text-[#5c6b78]">{companyCopy.nifIntro}</p>
      <ul className="mt-6 grid gap-3 md:grid-cols-3">
        {notes.map((note) => (
          <li key={note.title} className="rounded-2xl bg-[#f7f8fb] p-4">
            <note.icon className="size-5 text-[#3d34b8]" aria-hidden />
            <p className="mt-3 text-sm font-medium">{note.title}</p>
            <p className="mt-1 text-xs leading-5 text-[#5c6b78]">{note.body}</p>
          </li>
        ))}
      </ul>
      <form action={action} className="mt-6">
        <label className="block text-sm font-medium" htmlFor="company-nif">
          {companyCopy.nifLabel}
        </label>
        <input
          id="company-nif"
          name="nif"
          value={nif}
          autoComplete="off"
          required
          onChange={(event) => {
            setNif(event.target.value);
          }}
          className="mt-2 h-12 w-full rounded-xl border border-[#e1e6ee] bg-[#f4f7ff] px-3 text-sm outline-none focus-visible:border-[#5c4de0]"
        />
        {state && !state.ok ? (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center rounded-xl bg-[#3d34b8] px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? companyCopy.nifPending : companyCopy.nifSubmit}
          </button>
        </div>
      </form>
    </section>
  );
}
