import Link from "next/link";
import { CalendarDays, FolderOpen, MessageSquare } from "lucide-react";
import { engagementCopy } from "@/lib/engagement-copy";

/** S39 (Alex): the advisor's way into an encargo's chats, data room and meetings. Each section only renders server-side when the advisor may see it. */
const linkClass =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-[#dfe3ec] bg-white px-3.5 text-sm font-medium text-[#465ab4] hover:bg-[#eef2ff]";

export const advisorSectionIds = { chat: "chat", documents: "documentos", meetings: "reuniones" } as const;

export function AdvisorQuickLinks({
  href = "",
  chat,
  documents,
  meetings,
}: {
  href?: string;
  chat: boolean;
  documents: boolean;
  meetings: boolean;
}) {
  const links = [
    chat ? { id: advisorSectionIds.chat, label: engagementCopy.quickChat, icon: MessageSquare } : null,
    documents ? { id: advisorSectionIds.documents, label: engagementCopy.quickDocuments, icon: FolderOpen } : null,
    meetings ? { id: advisorSectionIds.meetings, label: engagementCopy.quickMeetings, icon: CalendarDays } : null,
  ].filter((link) => link !== null);
  if (links.length === 0) return null;

  return (
    <nav aria-label={engagementCopy.quickLabel} data-advisor-quick-links className="flex flex-wrap items-center gap-2">
      {links.map(({ id, label, icon: Icon }) => {
        const body = (
          <>
            <Icon className="size-4" aria-hidden />
            {label}
          </>
        );
        // A same-page anchor stays a native link so the browser fires hashchange (the meetings tab listens to it).
        return href ? (
          <Link key={id} href={`${href}#${id}`} className={linkClass}>
            {body}
          </Link>
        ) : (
          <a key={id} href={`#${id}`} className={linkClass}>
            {body}
          </a>
        );
      })}
    </nav>
  );
}
