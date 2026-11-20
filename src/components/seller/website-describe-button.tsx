"use client";

import { Globe, Sparkles } from "lucide-react";
import { useId, useState } from "react";
import { describeFromWebsiteAction } from "@/app/(app)/mi-empresa/actions";
import { companyCopy } from "@/lib/company-copy";

/**
 * S33 (Alex): "Rellenar con tu web" at the top-right of Descripción. Asks for the company website (prefilled from the
 * project or onboarding), drafts a description on the server and puts it in the textarea. It never saves: the seller
 * edits it and saves with Guardar like any other change.
 */
export function WebsiteDescribeButton({
  initialUrl,
  hasText,
  onFill,
}: {
  initialUrl: string;
  hasText: boolean;
  onFill: (description: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const inputId = useId();

  async function run() {
    if (pending) return;
    if (hasText && !window.confirm(companyCopy.websiteReplaceConfirm)) return;
    setPending(true);
    setNote(null);
    try {
      const result = await describeFromWebsiteAction(url);
      if (result?.ok && result.description) {
        onFill(result.description);
        setOpen(false);
      }
      setNote(result ? { ok: result.ok, text: result.message } : { ok: false, text: companyCopy.websiteFailed });
    } catch {
      setNote({ ok: false, text: companyCopy.websiteFailed });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setNote(null);
        }}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#c9d2f5] bg-white px-3 text-sm font-medium text-[#465ab4] transition hover:bg-[#f4f6fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465ab4]"
        data-website-describe
      >
        <Sparkles className="size-4" aria-hidden />
        {companyCopy.websiteButton}
      </button>
      {open ? (
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] p-3 sm:w-[26rem]">
          <label htmlFor={inputId} className="text-sm font-medium text-[#1c2740]">
            {companyCopy.websiteLabel}
          </label>
          <div className="flex gap-2">
            <span className="relative flex-1">
              <Globe className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a7]" aria-hidden />
              <input
                id={inputId}
                type="text"
                inputMode="url"
                autoComplete="url"
                maxLength={300}
                placeholder="miempresa.es"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void run();
                  }
                }}
                className="h-11 w-full rounded-xl border border-[#d5dee8] bg-white pr-3 pl-9 text-sm text-[#1c2740] focus-visible:border-[#465ab4] focus-visible:outline-none"
              />
            </span>
            <button
              type="button"
              disabled={pending || url.trim() === ""}
              onClick={() => void run()}
              className="inline-flex h-11 shrink-0 items-center rounded-xl bg-[#465ab4] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? companyCopy.websitePending : companyCopy.websiteRun}
            </button>
          </div>
          <p className="text-xs text-[#64748b]">{companyCopy.websiteHint}</p>
        </div>
      ) : null}
      {note ? (
        <p role={note.ok ? "status" : "alert"} className={`text-sm ${note.ok ? "text-[#17663a]" : "text-[#c0362c]"}`}>
          {note.text}
        </p>
      ) : null}
    </div>
  );
}
