"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Bell, ChevronRight } from "lucide-react";
import { markNotificationsReadAction } from "@/app/cuenta/actions";
import { NoticeText } from "@/components/notice-list";
import { noticeIconFor } from "@/lib/notice-icons";
import { notificationCopy, type NotificationView } from "@/lib/notifications";

const openNoticesEvent = "releva-open-notices";

export function OpenNoticeList({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event(openNoticesEvent));
      }}
      className="inline-flex items-center gap-1 text-sm text-[#64748b]"
    >
      {label}
      <ArrowRight className="size-4" aria-hidden />
    </button>
  );
}

export function NotificationBell({ items }: { items: NotificationView[] }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rows = items.map((item) => ({ ...item, unread: item.unread && !seen.includes(item.id) }));
  const unread = rows.filter((item) => item.unread).length;

  const markAllRead = useCallback(() => {
    const ids = items.filter((item) => item.unread).map((item) => item.id);
    setSeen((current) => [...current, ...ids.filter((id) => !current.includes(id))]);
    startTransition(() => {
      void markNotificationsReadAction();
    });
  }, [items]);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
      markAllRead();
    }

    window.addEventListener(openNoticesEvent, onOpen);
    return () => window.removeEventListener(openNoticesEvent, onOpen);
  }, [markAllRead]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        setOpen(false);
        return;
      }

      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const button = buttonRef.current;

    if (!open || !panel || !button) {
      return;
    }

    function place() {
      const currentPanel = panelRef.current;
      const currentButton = buttonRef.current;

      if (!currentPanel || !currentButton) {
        return;
      }

      const rect = currentButton.getBoundingClientRect();
      const margin = 12;
      const width = Math.min(36 * 16, window.innerWidth - margin * 2);
      let left = rect.right - width;

      if (left < margin) {
        left = margin;
      }

      if (left + width > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - margin - width);
      }

      const top = rect.bottom + 8;
      const room = Math.max(160, window.innerHeight - top - margin);
      currentPanel.style.top = `${top}px`;
      currentPanel.style.left = `${left}px`;
      currentPanel.style.width = `${width}px`;
      currentPanel.style.maxHeight = `${Math.round(room / 2)}px`;
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-label={unread > 0 ? `${notificationCopy.open}. ${unread}` : notificationCopy.open}
        onClick={() => {
          if (!open) {
            markAllRead();
          }
          setOpen((current) => !current);
        }}
        className="group relative inline-flex size-10 items-center justify-center rounded-full text-public-ink hover:bg-public-sand"
      >
        <Bell className="nav-icon nav-motion-bell size-4" aria-hidden />
        {unread > 0 ? (
          <span className="absolute top-1.5 right-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-public-clay px-1 text-[10px] leading-4 font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open
        ? createPortal(
        <div
          ref={panelRef}
          className="fixed z-[60] flex w-[min(36rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-public-line bg-public-card shadow-public"
          style={{ top: 0, left: 12, width: "min(36rem, calc(100vw - 1.5rem))", maxHeight: "50vh" }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-public-line px-4 py-3">
            <p className="text-base font-semibold text-public-ink">{notificationCopy.title}</p>
            {unread > 0 ? (
              <button type="button" onClick={markAllRead} className="text-xs font-medium text-[#465ab4] hover:underline">
                {notificationCopy.markAllRead}
              </button>
            ) : (
              <p className="text-xs font-medium text-public-muted">{notificationCopy.caughtUp}</p>
            )}
          </div>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <Bell className="size-5 text-public-muted" aria-hidden />
              <p className="text-sm text-public-muted">{notificationCopy.empty}</p>
            </div>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col overflow-auto p-2">
              {rows.map((item) => {
                const { Icon, chip } = noticeIconFor(item.title);
                const content = (
                  <span className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full ${chip}`}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-public-ink">
                        {item.unread ? <span className="mr-2 inline-block size-2 translate-y-[-1px] rounded-full bg-[#465ab4]" aria-hidden /> : null}
                        <NoticeText text={item.title} />
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-public-muted">{item.body}</span>
                    </span>
                    {item.href ? <ChevronRight className="mt-1 size-4 shrink-0 text-public-muted" aria-hidden /> : null}
                  </span>
                );
                return (
                  <li key={item.id} className="rounded-xl hover:bg-public-sand">
                    {item.href ? (
                      <Link href={item.href} onClick={() => setOpen(false)} className="block min-w-0 rounded-xl px-3 py-3">
                        {content}
                      </Link>
                    ) : (
                      <div className="block min-w-0 rounded-xl px-3 py-3 text-left">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {pending ? <span className="sr-only">{notificationCopy.title}</span> : null}
        </div>,
            document.body,
          )
        : null}
    </div>
  );
}
