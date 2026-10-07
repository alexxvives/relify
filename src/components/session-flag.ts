"use client";

import { useState, useSyncExternalStore } from "react";

const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, listener: () => void) {
  const set = listeners.get(key) ?? new Set<() => void>();
  set.add(listener);
  listeners.set(key, set);
  return () => {
    set.delete(listener);
  };
}

export function rememberSessionFlag(key: string, next: boolean) {
  sessionStorage.setItem(key, next ? "1" : "0");
  publish(key);
}

function publish(key: string) {
  listeners.get(key)?.forEach((listener) => {
    listener();
  });
}

function readStored(key: string): string | null {
  return sessionStorage.getItem(key);
}

export function useSessionFlag(key: string, fallback: boolean): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => {
      const stored = readStored(key);
      if (stored === "1") {
        return true;
      }
      if (stored === "0") {
        return false;
      }
      return fallback;
    },
    () => fallback,
  );

  function setValue(next: boolean) {
    sessionStorage.setItem(key, next ? "1" : "0");
    publish(key);
  }

  return [value, setValue];
}

export function useSessionString(key: string, fallback: string): [string, (next: string) => void] {
  const value = useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => readStored(key) ?? fallback,
    () => fallback,
  );

  function setValue(next: string) {
    sessionStorage.setItem(key, next);
    publish(key);
  }

  return [value, setValue];
}

function readChoice<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  const stored = readStored(key);

  for (const item of allowed) {
    if (item === stored) {
      return item;
    }
  }

  return fallback;
}

export function useSessionChoice<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (next: T) => void] {
  const value = useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => readChoice(key, fallback, allowed),
    () => fallback,
  );

  function setValue(next: T) {
    sessionStorage.setItem(key, next);
    publish(key);
  }

  return [value, setValue];
}

export function usePanelOpen(key: string, fallback: boolean, pinnedOpen: boolean): [boolean, (next: boolean) => void] {
  const [stored, setStored] = useSessionFlag(key, fallback);
  const [pinned, setPinned] = useState(pinnedOpen);

  function setOpen(next: boolean) {
    setPinned(false);
    setStored(next);
  }

  return [pinned || stored, setOpen];
}
