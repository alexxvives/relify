"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { sabiJobsAction } from "@/app/(app)/admin/empresas/[slug]/sabi-actions";
import {
  sabiJobStageLabel,
  sabiJobStartedEvent,
  sabiJobUpdateEvent,
  type SabiJobUpdate,
} from "@/lib/sabi/job-events";
import type { SabiJobView } from "@/server/sabiJobs";

const pollMs = 1200;
const doneToastMs = 20_000;
const dismissedKey = "releva:sabi-jobs-dismissed";

function readDismissed(): Set<string> {
  try {
    return new Set(
      JSON.parse(window.localStorage.getItem(dismissedKey) ?? "[]") as string[],
    );
  } catch {
    return new Set();
  }
}

/**
 * t67: admin-wide SABI import indicator. Polls while an import runs, survives navigation between
 * admin pages, announces completion and refreshes the current page's data when one finishes.
 */
export function SabiJobsIndicator() {
  const router = useRouter();
  const [jobs, setJobs] = useState<SabiJobView[]>([]);
  const [listedAt, setListedAt] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(() =>
    typeof window === "undefined" ? new Set() : readDismissed(),
  );
  const watching = useRef<Set<string>>(new Set());
  const watchKey = "releva:sabi-jobs-watching";
  const saveWatching = () => {
    try {
      sessionStorage.setItem(watchKey, JSON.stringify([...watching.current]));
    } catch {}
  };
  // Finished jobs are announced only if this tab saw them start or run.
  const [announced, setAnnounced] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem("releva:sabi-jobs-announced") ?? "[]") as string[]);
    } catch {
      return new Set();
    }
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let alive = true;

    async function tick() {
      if (inFlight.current) {
        return;
      }

      inFlight.current = true;
      let list: SabiJobView[] = [];

      try {
        list = await sabiJobsAction();
      } catch {
        list = [];
      } finally {
        inFlight.current = false;
      }

      if (!alive) {
        return;
      }

      setJobs(list);
      setListedAt(Date.now());
      const finished: string[] = [];

      for (const job of list) {
        window.dispatchEvent(
          new CustomEvent<SabiJobUpdate>(sabiJobUpdateEvent, {
            detail: {
              id: job.id,
              status: job.status,
              stage: job.stage,
              message: job.message,
            },
          }),
        );

        if (job.status === "running") {
          watching.current.add(job.id);
          saveWatching();
        } else if (watching.current.delete(job.id)) {
          saveWatching();
          finished.push(job.id);
        }
      }

      if (finished.length > 0) {
        setAnnounced((current) => {
          const next = new Set([...current, ...finished]);
          try {
            sessionStorage.setItem("releva:sabi-jobs-announced", JSON.stringify([...next]));
          } catch {}
          return next;
        });
        router.refresh();

        for (const id of finished) {
          if (list.find((job) => job.id === id)?.status === "done") {
            setTimeout(() => setAnnounced((current) => new Set([...current].filter((other) => other !== id))), doneToastMs);
          }
        }
      }

      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }

      if (watching.current.size > 0) {
        timer.current = setTimeout(() => void tick(), pollMs);
      }
    }

    try {
      for (const id of JSON.parse(sessionStorage.getItem(watchKey) ?? "[]") as string[]) watching.current.add(id);
    } catch {}

    void tick();

    function started(event: Event) {
      const id = (event as CustomEvent<{ jobId: string }>).detail?.jobId;

      if (id) {
        watching.current.add(id);
        saveWatching();
        void tick();
      }
    }

    window.addEventListener(sabiJobStartedEvent, started);
    return () => {
      alive = false;
      window.removeEventListener(sabiJobStartedEvent, started);

      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [router]);

  function dismiss(id: string) {
    const next = new Set(dismissed).add(id);
    setDismissed(next);

    try {
      window.localStorage.setItem(
        dismissedKey,
        JSON.stringify([...next].slice(-50)),
      );
    } catch {
      // Private mode: dismissal only lasts for this page.
    }
  }

  const visible = jobs.filter(
    (job) =>
      job.status === "running" ||
      (announced.has(job.id) &&
        !dismissed.has(job.id) &&
        !(job.status === "done" && job.finishedAt && listedAt - Date.parse(job.finishedAt) > doneToastMs)),
  );

  if (visible.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96"
    >
      {visible.map((job) => (
        <div
          key={job.id}
          role={job.status === "failed" ? "alert" : "status"}
          data-sabi-job={job.status}
          className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg ${
            job.status === "failed"
              ? "border-[#f0c2c2] bg-white text-[#8d2424]"
              : "border-[#1c2740] bg-[#1c2740] text-white"
          }`}
        >
          {job.status === "running" ? (
            <Loader2
              className="mt-0.5 size-4 shrink-0 animate-spin text-[#7fd6cc]"
              aria-hidden
            />
          ) : job.status === "done" ? (
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-[#2fc4b2]"
              aria-hidden
            />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {job.status === "running"
                ? "Importando SABI"
                : job.status === "done"
                  ? "SABI importado"
                  : "Error al importar SABI"}{" "}
              · {job.companyName}
            </p>
            <p
              className={`truncate text-xs ${job.status === "failed" ? "" : "text-white/75"}`}
            >
              {job.status === "running"
                ? `${sabiJobStageLabel(job.stage)} · ${job.fileName}`
                : (job.message ?? job.fileName)}
            </p>
            {job.status !== "running" && job.slug ? (
              <Link
                href={`/admin/empresas/${job.slug}`}
                onClick={() => dismiss(job.id)}
                className={`mt-1 inline-block text-xs font-semibold underline ${job.status === "failed" ? "text-[#1c2740]" : "text-[#7fd6cc]"}`}
              >
                Ver ficha
              </Link>
            ) : null}
          </div>
          {job.status === "running" ? null : (
            <button
              type="button"
              onClick={() => dismiss(job.id)}
              aria-label="Cerrar aviso"
              className="-mr-1 rounded-full p-1 opacity-75 hover:opacity-100"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
