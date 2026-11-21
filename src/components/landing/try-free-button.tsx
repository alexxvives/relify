"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type StarBorder from "@/components/StarBorder";
import { useLandingAurora } from "@/components/landing/landing-motion";
import { landingCopy } from "@/lib/landing-copy";

const navy = "#1c2740";

type StarBorderComponent = typeof StarBorder;

export function TryFreeButton({
  // S42 (Alex): for now "Prueba gratis" takes visitors to the landing's lista de espera.
  href = landingCopy.waitlistNav.href,
  className = "",
  label = landingCopy.tryFreeCta,
  onClick,
  size = "nav",
}: {
  href?: string;
  className?: string;
  label?: string;
  onClick?: () => void;
  size?: "nav" | "hero";
}) {
  const motion = useLandingAurora();
  const [Border, setBorder] = useState<StarBorderComponent | null>(null);
  const sizing = size === "hero" ? "h-12 min-h-12 px-8" : "h-11 min-h-11 px-4";
  const shared = `${sizing} text-sm font-semibold ${className}`.trim();
  const plain = `inline-flex items-center justify-center rounded-full bg-relify-btn text-white shadow-[0_8px_18px_-12px_rgb(28_39_64_/_0.55)] transition hover:bg-relify-btn-hover ${shared}`;

  useEffect(() => {
    if (!motion) {
      return;
    }
    let alive = true;
    void import("@/components/StarBorder").then((mod) => {
      if (alive) {
        setBorder(() => mod.default);
      }
    });
    return () => {
      alive = false;
    };
  }, [motion]);

  if (!motion || !Border) {
    return (
      <Link href={href} onClick={onClick} className={plain}>
        {label}
      </Link>
    );
  }

  return (
    <Border
      as={Link}
      href={href}
      onClick={onClick}
      color="#ffffff"
      backgroundColor={navy}
      textColor="#ffffff"
      duration={12}
      thickness={1.4}
      radius={999}
      glow={0.28}
      sparkle={false}
      className={shared}
    >
      {label}
    </Border>
  );
}
