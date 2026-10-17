import Link from "next/link";
import { noticeSegments, type NotificationView } from "@/lib/notifications";

export function NoticeText({ text }: { text: string }) {
  return (
    <>
      {noticeSegments(text).map((segment, index) =>
        segment.tone === "plain" ? (
          <span key={`${segment.tone}-${index}`}>{segment.text}</span>
        ) : (
          <span
            key={`${segment.tone}-${index}`}
            className={segment.tone === "accept" ? "font-semibold text-[#17663a]" : "font-semibold text-[#c0362c]"}
          >
            {segment.text}
          </span>
        ),
      )}
    </>
  );
}

export function NoticeList({ items, scroll = false }: { items: NotificationView[]; scroll?: boolean }) {
  return (
    <ul className={scroll ? "mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-auto pr-1" : "mt-4 flex flex-col gap-3"}>
      {items.map((item) => {
        const body = (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold text-[#1c2740]">
                {item.unread ? <span className="mr-2 inline-block size-2 translate-y-[-1px] rounded-full bg-[#465ab4]" aria-hidden /> : null}
                <NoticeText text={item.title} />
              </p>
              <time className="shrink-0 pt-1 text-xs text-[#98a2b3]">{item.when}</time>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{item.body}</p>
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
