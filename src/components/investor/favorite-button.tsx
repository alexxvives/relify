"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/app/proyectos/[slug]/actions";
import { companyCopy } from "@/lib/company-copy";

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
  const [pending, startTransition] = useTransition();
  const idle = disabled || pending;

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? companyCopy.savedCompany : companyCopy.saveCompany}
      title={title}
      disabled={idle}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) {
          return;
        }
        const next = !saved;
        setSaved(next);
        startTransition(async () => {
          const result = await toggleFavoriteAction(slug);
          if (!result.ok) {
            setSaved(!next);
            return;
          }
          setSaved(result.favorited);
          onChange?.(result.favorited);
          router.refresh();
        });
      }}
      className="inline-flex size-11 items-center justify-center rounded-xl border border-[#e6e9f0] bg-white text-[#465ab4] disabled:opacity-70"
    >
      <Heart className={saved ? "size-4 fill-[#465ab4] text-[#465ab4]" : "size-4 fill-none text-[#465ab4]"} aria-hidden />
    </button>
  );
}
