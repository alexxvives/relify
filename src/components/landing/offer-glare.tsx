"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useLandingAurora } from "@/components/landing/landing-motion";

type GlareHoverProps = {
  width?: string;
  height?: string;
  borderRadius?: string;
  borderColor?: string;
  glareColor?: string;
  glareOpacity?: number;
  glareSize?: number;
  softness?: number;
  rimGlint?: boolean;
  mode?: "hover" | "follow" | "loop" | "click";
  className?: string;
  children?: ReactNode;
};

/** Subtle sheen on marketplace preview cards. Lazy, skipped when motion is reduced. */
export function OfferGlare({ children }: { children: ReactNode }) {
  const motion = useLandingAurora();
  const [Glare, setGlare] = useState<ComponentType<GlareHoverProps> | null>(null);

  useEffect(() => {
    if (!motion) {
      return;
    }
    let alive = true;
    void import("@/components/GlareHover").then((mod) => {
      if (alive) {
        setGlare(() => mod.default);
      }
    });
    return () => {
      alive = false;
    };
  }, [motion]);

  if (!motion || !Glare) {
    return children;
  }

  return (
    <Glare
      width="100%"
      height="100%"
      borderRadius="1rem"
      borderColor="transparent"
      glareColor="#ffffff"
      glareOpacity={0.22}
      glareSize={18}
      softness={0.75}
      rimGlint={false}
      mode="hover"
      className="!block h-full w-full overflow-hidden rounded-[1.25rem]"
    >
      {children}
    </Glare>
  );
}
