import type { ReactNode } from "react";

/**
 * S42 (Alex): Chat / Documentos and Reuniones share one panel frame, so both tabs are the same height from xl
 * (each card scrolls inside when its content runs longer).
 */
export const processPanelGridClass =
  "grid min-w-0 items-stretch gap-4 xl:h-[38rem] xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:*:min-h-0 xl:*:overflow-y-auto";

/**
 * S40: the Chat / Documentos tab shared by buyer, seller and advisor: the conversation on the left, documents on the
 * right. `bare` when the chat brings its own card.
 */
export function ProcessChatLayout({ chat, documents, bare = false }: { chat: ReactNode; documents: ReactNode; bare?: boolean }) {
  return (
    <section className={processPanelGridClass}>
      {bare ? <div className="min-w-0">{chat}</div> : <div className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-white p-5">{chat}</div>}
      {documents}
    </section>
  );
}
