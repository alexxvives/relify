"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/app/proyectos/[slug]/actions";
import { AppToast } from "@/components/shell/app-toast";
import { companyCopy } from "@/lib/company-copy";

export const favoriteSaveFailed = "No hemos podido guardar el cambio. Inténtalo de nuevo.";

/**
 * S32 (Alex): the like is optimistic. The heart fills at once (pop plus a small burst, CSS only and off with
 * prefers-reduced-motion) and the save runs in the background. The server action toggles, so clicks only record the
 * wanted state and one loop toggles until the server matches it; on failure the heart goes back and a toast says so.
 */
export function FavoriteButton({
  slug,
  favorited,
  onChange,
  disabled = false,
  title,
}: {
  slug: string;
  favorited: boolean;
  onChange?: (favorited: boolean) => void;
  disabled?: boolean;
  title?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(favorited);
  const [burst, setBurst] = useState(0);
  const [failed, setFailed] = useState(0);
  const wanted = useRef(favorited);
  const confirmed = useRef(favorited);
  const syncing = useRef(false);

  async function sync() {
    if (syncing.current) {
      return;
    }
    syncing.current = true;
    let server = confirmed.current;
    try {
      while (server !== wanted.current) {
        const result = await toggleFavoriteAction(slug);
        if (!result.ok) {
          throw new Error(result.message);
        }
        server = result.favorited;
      }
    } catch {
      wanted.current = server;
      setSaved(server);
      setFailed((count) => count + 1);
    } finally {
      syncing.current = false;
    }
    if (server !== confirmed.current) {
      confirmed.current = server;
      onChange?.(server);
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? companyCopy.savedCompany : companyCopy.saveCompany}
        title={title}
        disabled={disabled}
        data-favorite-button
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (disabled) {
            return;
          }
          const next = !saved;
          wanted.current = next;
          setSaved(next);
          if (next) {
            setBurst((count) => count + 1);
          }
          void sync();
        }}
        className="relative inline-flex size-11 items-center justify-center rounded-xl border border-[#e6e9f0] bg-white text-[#465ab4] disabled:opacity-70"
      >
        <Heart
          key={burst}
          className={`size-4 text-[#465ab4] transition-[fill] duration-150 ${saved ? "fill-[#465ab4]" : "fill-transparent"} ${burst > 0 && saved ? "relify-heart-pop" : ""}`}
          aria-hidden
        />
        {burst > 0 && saved ? (
          <span key={`burst-${burst}`} aria-hidden className="relify-heart-burst pointer-events-none absolute inset-0">
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <span key={angle} style={{ ["--relify-burst-angle" as string]: `${angle}deg` }} />
            ))}
          </span>
        ) : null}
      </button>
      {failed > 0 ? <AppToast message={favoriteSaveFailed} tone="error" pulse={failed} /> : null}
    </>
  );
}
