"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppToast } from "@/components/shell/app-toast";

export const savedToastText = "Guardado";

/**
 * S40 (Alex): every field that saves on its own (no Guardar button) confirms with one brief "Guardado" toast.
 * Saves that land close together collapse into a single toast; errors stay inline on the field.
 */
export function useSavedToast(delayMs = 300) {
  const [pulse, setPulse] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const notifySaved = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPulse((value) => value + 1), delayMs);
  }, [delayMs]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { notifySaved, savedToast: <AppToast message={pulse > 0 ? savedToastText : null} pulse={pulse} /> };
}
