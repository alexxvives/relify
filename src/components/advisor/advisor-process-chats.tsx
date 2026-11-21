"use client";

import { useState } from "react";
import { postAdvisorProcessMessageAction } from "@/app/(app)/mandatos/encargos/actions";
import { ProjectThread } from "@/components/investor/project-thread";
import { Card } from "@/components/ui/form";
import { engagementCopy } from "@/lib/engagement-copy";
import { sellerCopy } from "@/lib/seller-copy";
import type { AdvisorProcessChat } from "@/lib/server/advisor-process-chat";

/** S38: the process chats the asesor can use for the side that hired them (one per buyer when the seller hired). */
export function AdvisorProcessChats({
  engagementId,
  side,
  chats,
}: {
  engagementId: string;
  side: "seller" | "investor";
  chats: AdvisorProcessChat[];
}) {
  const [activeId, setActiveId] = useState(chats[0]?.accessId ?? "");
  const active = chats.find((chat) => chat.accessId === activeId) ?? chats[0];

  return (
    <Card data-advisor-process-chats>
      <h2 className="text-2xl font-semibold text-[#2b3b4a]">{engagementCopy.processChatsTitle}</h2>
      {!active ? (
        <p className="mt-3 text-sm text-[#64748b]">{engagementCopy.processChatsEmpty}</p>
      ) : (
        <>
          {chats.length > 1 ? (
            <div role="tablist" aria-label={engagementCopy.processChatsTitle} className="mt-4 flex flex-wrap gap-2">
              {chats.map((chat) => (
                <button
                  key={chat.accessId}
                  type="button"
                  role="tab"
                  aria-selected={chat.accessId === active.accessId}
                  onClick={() => setActiveId(chat.accessId)}
                  className={`h-9 rounded-full px-3 text-sm font-medium ${chat.accessId === active.accessId ? "bg-[#1c2740] text-white" : "bg-[#f2f4f7] text-[#344054] hover:bg-[#e4e7ec]"}`}
                >
                  {chat.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-4">
            <ProjectThread
              key={active.accessId}
              viewer={side}
              partyName={active.label}
              advisorView={{ clientLabel: side === "seller" ? engagementCopy.clientSeller : engagementCopy.clientBuyer }}
              messages={active.messages}
              action={postAdvisorProcessMessageAction}
              hidden={[
                { name: "engagementId", value: engagementId },
                { name: "accessId", value: active.accessId },
              ]}
              placeholder={sellerCopy.replyField}
              submitLabel={sellerCopy.chatSend}
              pendingLabel={sellerCopy.replying}
              savedLabel={sellerCopy.replySaved}
              invalidFallback={sellerCopy.replyInvalid}
            />
          </div>
        </>
      )}
    </Card>
  );
}
