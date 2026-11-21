import type { ReactNode } from "react";

/**
 * S40: the Chat / Documentos tab shared by buyer, seller and advisor: the conversation on the left, documents on the
 * right. `bare` when the chat brings its own card.
 */
export function ProcessChatLayout({ chat, documents, bare = false }: { chat: ReactNode; documents: ReactNode; bare?: boolean }) {
  return (
    <section className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {bare ? <div className="min-w-0">{chat}</div> : <div className="flex h-full flex-col rounded-2xl border border-[#e6e9f0] bg-white p-5">{chat}</div>}
      {documents}
    </section>
  );
}
