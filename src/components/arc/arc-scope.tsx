import type { ReactNode } from "react";
import "./foundation.css";
import "./relify.css";

/** Gives uiarc blocks their spacing and type tokens, tuned to the Relify palette. */
export function ArcScope({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["arc-scope relify-arc", className].filter(Boolean).join(" ")}>{children}</div>;
}
