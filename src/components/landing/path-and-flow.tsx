"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingPipeline } from "@/components/landing/landing-pipeline";
import { Paths } from "@/components/landing/paths";
import { useAllowsMotion } from "@/components/landing/landing-motion";
import { landingCopy, type FlowRole } from "@/lib/landing-copy";

type FadeProps = {
  children?: ReactNode;
  blur?: boolean | number;
  duration?: number;
  trigger?: "scroll" | "mount";
  initialOpacity?: number;
};

function PathSteps({ role, pulse }: { role: FlowRole; pulse: number }) {
  const motion = useAllowsMotion();
  const [Fade, setFade] = useState<ComponentType<FadeProps> | null>(null);
  const steps = <HowItWorks role={role} travel={pulse} />;

  useEffect(() => {
    if (!motion || pulse === 0) {
      return;
    }
    let alive = true;
    void import("@/components/landing/fade-content").then((mod) => {
      if (alive) {
        setFade(() => mod.default);
      }
    });
    return () => {
      alive = false;
    };
  }, [motion, pulse]);

  if (!motion || !Fade) {
    return steps;
  }

  return (
    <Fade key={`${role}-${pulse}`} blur duration={0.8} trigger="mount" initialOpacity={0}>
      {steps}
    </Fade>
  );
}

export function PathAndFlow() {
  const [role, setRole] = useState<FlowRole>(landingCopy.home.paths.columns[0].id);
  const [pulse, setPulse] = useState(0);

  return (
    <Paths
      role={role}
      onSelect={(next) => {
        setRole(next);
        setPulse((count) => count + 1);
      }}
    >
      <PathSteps role={role} pulse={pulse} />
      <LandingPipeline />
    </Paths>
  );
}
