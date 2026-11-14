"use client";

import { useState } from "react";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingPipeline } from "@/components/landing/landing-pipeline";
import { Paths } from "@/components/landing/paths";
import { landingCopy, type FlowRole } from "@/lib/landing-copy";

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
      <HowItWorks key={`${role}-${pulse}`} role={role} travel={pulse} />
      <LandingPipeline />
    </Paths>
  );
}
