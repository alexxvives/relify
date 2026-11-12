"use client";

import { createContext, useContext, type ReactNode } from "react";

const SignerContext = createContext({ nationalIdMissing: false });

export function SignerProvider({ nationalIdMissing, children }: { nationalIdMissing: boolean; children: ReactNode }) {
  return <SignerContext.Provider value={{ nationalIdMissing }}>{children}</SignerContext.Provider>;
}

export function useSigner() {
  return useContext(SignerContext);
}
