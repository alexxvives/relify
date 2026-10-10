import Link from "next/link";
import type { NotificationView } from "@/lib/notifications";

export function NoticeList({ items }: { items: NotificationView[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {items.slice(0, 4).map((item) => {
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className={item.unread ? "text-sm font-semibold text-[#1c2740]" : "text-sm font-normal text-[#667085]"}>{item.title}</p>
              <time className="shrink-0 text-xs text-[#98a2b3]">{item.when}</time>
            </div>
            <p className={item.unread ? "mt-1 text-sm font-semibold text-[#1c2740]" : "mt-1 text-sm font-normal text-[#667085]"}>{item.body}</p>
          </>
        );

        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className="block rounded-xl bg-[#f4f7ff] px-3 py-3 hover:bg-[#e7edff]">
                {body}
              </Link>
            ) : (
              <div className="rounded-xl bg-[#f4f7ff] px-3 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
