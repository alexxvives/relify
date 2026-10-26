import Link from "next/link";
import { noticeIconFor } from "@/lib/notice-icons";
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

export function NoticeList({
  items,
  scroll = false,
  icons = false,
}: {
  items: NotificationView[];
  scroll?: boolean;
  icons?: boolean;
}) {
  return (
    <ul className={scroll ? "mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1" : "mt-4 flex flex-col gap-3"}>
      {items.map((item) => {
        const { Icon, chip } = noticeIconFor(item.title);
        const body = (
          <div className={icons ? "flex gap-3" : ""}>
            {icons ? (
              <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${chip}`}>
                <Icon className="size-4" aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-[#1c2740]">
                {item.unread ? <span className="mr-2 inline-block size-2 translate-y-[-1px] rounded-full bg-[#465ab4]" aria-hidden /> : null}
                <NoticeText text={item.title} />
              </p>
              <time className="block text-xs text-[#667085]">{item.when}</time>
              <p className="mt-1 text-sm leading-6 text-[#5c6b78]">{item.body}</p>
            </div>
          </div>
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
