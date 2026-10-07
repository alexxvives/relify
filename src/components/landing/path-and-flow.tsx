"use client";

import { useState } from "react";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Paths } from "@/components/landing/paths";
import { landingCopy, type FlowRole } from "@/lib/landing-copy";

export function PathAndFlow() {
  const [role, setRole] = useState<FlowRole>(landingCopy.home.paths.columns[0].id);

  return (
    <>
      <Paths role={role} onSelect={setRole} />
      <HowItWorks role={role} />
    </>
  );
}
