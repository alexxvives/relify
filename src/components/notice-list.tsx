import Link from "next/link";
import { Bell, CalendarClock, FolderOpen, HandCoins, MessageCircle, Reply, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { noticeSegments, type NotificationView } from "@/lib/notifications";

function iconFor(title: string) {
  if (title.includes("NDA")) {
    return ShieldCheck;
  }

  if (title.includes("Pregunta") || title.includes("pregunta") || title.includes("Mensaje")) {
    return MessageCircle;
  }

  if (title.includes("Reunión") || title.includes("reunión")) {
    return CalendarClock;
  }

  if (title.includes("Oferta")) {
    return Sparkles;
  }

  if (title.includes("Respuesta")) {
    return Reply;
  }

  if (title.includes("Dataroom") || title.includes("document")) {
    return FolderOpen;
  }

  if (title.includes("depósito") || title.includes("Depósito") || title.includes("Pago")) {
    return HandCoins;
  }

  if (title.includes("interés") || title.includes("Solicitud") || title.includes("Presupuesto") || title.includes("Encargo")) {
    return UserRound;
  }

  return Bell;
}

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
        const Icon = iconFor(item.title);
        const body = (
          <div className={icons ? "flex gap-3" : ""}>
            {icons ? (
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#465ab4]">
                <Icon className="size-4" aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-semibold text-[#1c2740]">
                  {item.unread ? <span className="mr-2 inline-block size-2 translate-y-[-1px] rounded-full bg-[#465ab4]" aria-hidden /> : null}
                  <NoticeText text={item.title} />
                </p>
                <time className="shrink-0 pt-1 text-xs text-[#98a2b3]">{item.when}</time>
              </div>
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
