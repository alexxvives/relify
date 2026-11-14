"use client";

import { createContext, useContext, type ReactNode } from "react";

const SignerContext = createContext({ nationalIdMissing: false, nationalIdMasked: null as string | null });

export function SignerProvider({
  nationalIdMissing,
  nationalIdMasked = null,
  children,
}: {
  nationalIdMissing: boolean;
  nationalIdMasked?: string | null;
  children: ReactNode;
}) {
  return <SignerContext.Provider value={{ nationalIdMissing, nationalIdMasked }}>{children}</SignerContext.Provider>;
}

export function useSigner() {
  return useContext(SignerContext);
}
