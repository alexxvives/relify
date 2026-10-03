"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { markNotificationsReadAction } from "@/app/cuenta/actions";
import { notificationCopy, type NotificationView } from "@/lib/notifications";

export function NotificationBell({ items }: { items: NotificationView[] }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const rows = items.map((item) => ({ ...item, unread: item.unread && !seen.includes(item.id) }));
  const unread = rows.filter((item) => item.unread).length;

  function toggle() {
    const next = !open;
    setOpen(next);

    if (next && unread > 0) {
      setSeen(items.map((item) => item.id));
      startTransition(async () => {
        await markNotificationsReadAction();
      });
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={notificationCopy.open}
        onClick={toggle}
        className="relative inline-flex size-11 items-center justify-center rounded-full text-[#2b3b4a] hover:bg-[#f4f4f5]"
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 ? (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#3d34b8]" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-[#e6e9f0] bg-white p-3 shadow-[0_18px_40px_-24px_rgba(28,39,64,0.45)]">
          <p className="px-2 text-sm font-semibold">{notificationCopy.title}</p>
          {rows.length === 0 ? (
            <p className="px-2 py-4 text-sm text-[#5c6b78]">{notificationCopy.empty}</p>
          ) : (
            <ul className="mt-2 flex max-h-80 flex-col gap-1 overflow-auto">
              {rows.map((item) => {
                const content = (
                  <>
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#5c6b78]">{item.body}</span>
                  </>
                );
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link href={item.href} onClick={() => setOpen(false)} className="block rounded-xl px-2 py-2 hover:bg-[#f5f6fa]">
                        {content}
                      </Link>
                    ) : (
                      <div className="rounded-xl px-2 py-2">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {pending ? <span className="sr-only">{notificationCopy.title}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
