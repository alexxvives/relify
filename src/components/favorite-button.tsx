"use client";

import { useState, useTransition } from "react";
import { HeartIcon } from "@/components/ui/heart";
import { toggleFavoriteAction } from "@/app/proyectos/[slug]/actions";
import { companyCopy } from "@/lib/company-copy";

export function FavoriteButton({ slug, favorited }: { slug: string; favorited: boolean }) {
  const [saved, setSaved] = useState(favorited);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? companyCopy.savedCompany : companyCopy.saveCompany}
      disabled={pending}
      onClick={() => {
        const next = !saved;
        setSaved(next);
        startTransition(async () => {
          const result = await toggleFavoriteAction(slug);
          if (!result.ok) {
            setSaved(!next);
            return;
          }
          setSaved(result.favorited);
        });
      }}
      className="inline-flex size-11 items-center justify-center rounded-xl border border-[#e6e9f0] bg-white text-[#3d34b8]"
    >
      <HeartIcon size={16} className="text-[#3d34b8]" aria-hidden />
    </button>
  );
}
