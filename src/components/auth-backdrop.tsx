"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

function subscribeMd(onStoreChange: () => void): () => void {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

/** Desktop-only city photo. SSR and viewports below `md` skip the image so phones never download it. */
export function AuthBackdrop() {
  const desktop = useSyncExternalStore(
    subscribeMd,
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false,
  );
  if (!desktop) {
    return null;
  }
  return (
    <>
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
    </>
  );
}
