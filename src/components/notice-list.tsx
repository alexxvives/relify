import Link from "next/link";
import type { NotificationView } from "@/lib/notifications";

export function NoticeList({ items }: { items: NotificationView[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {items.slice(0, 4).map((item) => {
        const body = (
          <>
            <p className="text-sm font-semibold text-[#1c2740]">{item.title}</p>
            <p className="mt-1 text-sm text-[#667085]">{item.body}</p>
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
