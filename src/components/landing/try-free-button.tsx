"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type StarBorder from "@/components/StarBorder";
import { useLandingAurora } from "@/components/landing/landing-motion";
import { landingCopy } from "@/lib/landing-copy";

const teal = "#2fc4b2";
const clay = "#0f6e73";

type StarBorderComponent = typeof StarBorder;

export function TryFreeButton({
  href = "/registro",
  className = "",
  label = landingCopy.tryFreeCta,
  onClick,
}: {
  href?: string;
  className?: string;
  label?: string;
  onClick?: () => void;
}) {
  const motion = useLandingAurora();
  const [Border, setBorder] = useState<StarBorderComponent | null>(null);
  const shared = `h-12 min-h-11 px-8 text-sm font-semibold ${className}`.trim();
  const plain = `inline-flex items-center justify-center rounded-full bg-public-clay text-white shadow-[0_8px_18px_-12px_rgb(15_110_115_/_0.7)] transition hover:bg-public-clay-deep ${shared}`;

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
      color={teal}
      backgroundColor={clay}
      textColor="#ffffff"
      duration={12}
      thickness={1.4}
      radius={999}
      glow={0.35}
      sparkle={false}
      className={shared}
    >
      {label}
    </Border>
  );
}
