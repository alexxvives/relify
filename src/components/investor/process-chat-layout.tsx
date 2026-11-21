import type { ReactNode } from "react";
import { companyCopy } from "@/lib/company-copy";

/**
 * S42 (Alex): the chat / documents frame and the meetings frame are the same height from xl (each card scrolls inside
 * when its content runs longer).
 */
export const processPanelGridClass =
  "grid min-w-0 items-stretch gap-4 xl:h-[38rem] xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:*:min-h-0 xl:*:overflow-y-auto";

/**
 * S40: the conversation on the left, documents on the right, shared by buyer, seller and advisor. `bare` when the chat
 * brings its own card.
 */
export function ProcessChatLayout({ chat, documents, bare = false }: { chat: ReactNode; documents: ReactNode; bare?: boolean }) {
  return (
    <section className={processPanelGridClass}>
      {bare ? <div className="min-w-0">{chat}</div> : <div className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-white p-5">{chat}</div>}
      {documents}
    </section>
  );
}

/**
 * S43 (Alex): a counterparty tab (Vendedor, Compradores, Comprador, Asesor): chat and documents with that party, and
 * the meetings with the same party right below.
 */
export function CounterpartyPanel({
  chat,
  documents,
  meetings,
  meetingsTitle = companyCopy.counterpartyMeetings,
  bare = false,
}: {
  chat: ReactNode;
  documents: ReactNode;
  meetings: ReactNode;
  meetingsTitle?: string;
  bare?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6" data-counterparty-panel>
      <ProcessChatLayout bare={bare} chat={chat} documents={documents} />
      {meetings ? (
        <section className="flex min-w-0 flex-col gap-3" data-counterparty-meetings>
          <h3 className="text-base font-semibold text-[#1c2740]">{meetingsTitle}</h3>
          {meetings}
        </section>
      ) : null}
    </div>
  );
}
