"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { applyGaConsent, hasAnalyticsConsent, loadGoogleAnalytics, trackConversion } from "@/lib/analytics";
import {
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_MAX_AGE,
  parseCookieConsent,
  serializeCookieConsent,
  type ConversionEvent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";
import { cookiesCopy } from "@/lib/cookies-copy";

const OPEN_EVENT = "relify:cookie-preferences";

function persist(choice: CookieConsentChoice): void {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(choice));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_COOKIE}=${serializeCookieConsent(choice)}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event("storage"));
}

let choiceSnapshot: CookieConsentChoice | null = null;
let choiceRaw: string | null | undefined;

function readChoice(): CookieConsentChoice | null {
  const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (raw === choiceRaw) {
    return choiceSnapshot;
  }
  choiceRaw = raw;
  choiceSnapshot = parseCookieConsent(raw);
  return choiceSnapshot;
}

function subscribeConsent(notify: () => void): () => void {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
}

function loadAnalytics(gtmId: string | null, gaId: string | null): void {
  if (gtmId) {
    return;
  }
  if (gaId) {
    loadGoogleAnalytics(gaId);
  }
}

export function CookieConsent({
  gtmId,
  gaId,
}: {
  gtmId: string | null;
  gaId: string | null;
}) {
  const analyticsReady = Boolean(gtmId || gaId);
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const stored = useSyncExternalStore(subscribeConsent, readChoice, () => null);
  const [preferences, setPreferences] = useState(false);
  const [configure, setConfigure] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOpen = () => {
      setConfigure(true);
      setPreferences(true);
      setAnalyticsOn(readChoice()?.analytics === true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!hydrated || !analyticsReady || stored === null) {
      return;
    }
    applyGaConsent(stored.analytics);
    if (stored.analytics) {
      loadAnalytics(gtmId, gaId);
    }
  }, [hydrated, analyticsReady, gtmId, gaId, stored]);

  function save(next: CookieConsentChoice): void {
    persist(next);
    setPreferences(false);
    setConfigure(false);
    setAnalyticsOn(next.analytics);
    if (!analyticsReady) {
      return;
    }
    applyGaConsent(next.analytics);
    if (next.analytics) {
      loadAnalytics(gtmId, gaId);
    }
  }

  const open = hydrated && (stored === null || preferences);

  useEffect(() => {
    if (!open) {
      document.documentElement.classList.remove("relify-consent-open");
      document.documentElement.style.removeProperty("--relify-consent-h");
      return;
    }
    const el = barRef.current;
    if (!el) {
      return;
    }
    const apply = () => {
      const height = `${Math.ceil(el.getBoundingClientRect().height)}px`;
      document.documentElement.style.setProperty("--relify-consent-h", height);
      document.documentElement.classList.add("relify-consent-open");
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("relify-consent-open");
      document.documentElement.style.removeProperty("--relify-consent-h");
    };
  }, [open, configure]);

  if (!open) {
    return null;
  }

  return (
    <div className="relify-consent" role="dialog" aria-labelledby="relify-consent-title" aria-modal="false">
      <div ref={barRef} className="relify-consent-card">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 sm:flex-1">
            <h2 id="relify-consent-title" className="text-sm font-semibold text-public-ink">
              {cookiesCopy.bannerTitle}
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-public-muted sm:mt-1 sm:text-sm">
              {cookiesCopy.bannerBody}{" "}
              <Link href="/cookies" className="font-medium text-public-clay underline-offset-2 hover:underline">
                {cookiesCopy.policyLink}
              </Link>
            </p>
            {configure ? (
              <div className="mt-3 grid gap-2 sm:max-w-xl">
                <label className="flex items-start justify-between gap-3 rounded-2xl border border-public-line bg-public-sand px-4 py-3">
                  <span>
                    <span className="block text-sm font-medium text-public-ink">{cookiesCopy.essentialsTitle}</span>
                    <span className="mt-0.5 block text-xs text-public-muted">{cookiesCopy.essentialsLock}</span>
                  </span>
                  <input type="checkbox" checked disabled className="mt-1 size-4 accent-[#0f6e73]" />
                </label>
                <label className="flex items-start justify-between gap-3 rounded-2xl border border-public-line bg-white px-4 py-3">
                  <span>
                    <span className="block text-sm font-medium text-public-ink">{cookiesCopy.analyticsTitle}</span>
                    <span className="mt-0.5 block text-xs text-public-muted">{cookiesCopy.analyticsToggle}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={analyticsOn}
                    onChange={(event) => setAnalyticsOn(event.target.checked)}
                    className="mt-1 size-4 accent-[#0f6e73]"
                  />
                </label>
              </div>
            ) : null}
          </div>
          <div className={`relify-consent-actions${configure ? " relify-consent-actions-save" : ""}`}>
            {configure ? (
              <button type="button" className="relify-consent-accept" onClick={() => save({ analytics: analyticsOn })}>
                {cookiesCopy.save}
              </button>
            ) : (
              <>
                <button type="button" className="relify-consent-ghost" onClick={() => save({ analytics: false })}>
                  {cookiesCopy.reject}
                </button>
                <button type="button" className="relify-consent-accept" onClick={() => save({ analytics: true })}>
                  {cookiesCopy.accept}
                </button>
                <button
                  type="button"
                  className="relify-consent-configure self-center sm:order-first"
                  onClick={() => {
                    setConfigure(true);
                    setAnalyticsOn(stored?.analytics === true);
                  }}
                >
                  {cookiesCopy.configure}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CookiePreferencesLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className ?? "text-sm text-public-ink underline-offset-2 hover:underline"}
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      {cookiesCopy.reopen}
    </button>
  );
}

export function ConversionPing({ event }: { event: ConversionEvent }) {
  useEffect(() => {
    const key = `relify.conv.${event}`;
    if (window.sessionStorage.getItem(key) === "1") {
      return;
    }
    if (!hasAnalyticsConsent()) {
      return;
    }
    window.sessionStorage.setItem(key, "1");
    trackConversion(event);
  }, [event]);
  return null;
}
