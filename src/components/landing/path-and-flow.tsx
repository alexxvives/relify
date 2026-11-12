"use client";

import { useState } from "react";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Paths } from "@/components/landing/paths";
import { landingCopy, type FlowRole } from "@/lib/landing-copy";

export function PathAndFlow() {
  const [role, setRole] = useState<FlowRole>(landingCopy.home.paths.columns[0].id);
  const [pulse, setPulse] = useState(0);

  return (
    <>
      <Paths
        role={role}
        onSelect={(next) => {
          setRole(next);
          setPulse((count) => count + 1);
        }}
      />
      <div className="releva-path-bridge hidden lg:flex" aria-hidden="true">
        <span key={pulse} className="releva-path-connector" data-pulse={pulse > 0 ? "true" : "false"} />
      </div>
      <HowItWorks role={role} />
    </>
  );
}
