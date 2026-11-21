"use client";

import { postAdvisorProcessMessageAction } from "@/app/(app)/mandatos/encargos/actions";
import { ProjectThread } from "@/components/investor/project-thread";
import { engagementCopy } from "@/lib/engagement-copy";
import { sellerCopy } from "@/lib/seller-copy";
import type { AdvisorProcessChat } from "@/lib/server/advisor-process-chat";

/** S38/S40: one process chat the asesor writes in for the side that hired them (the buyer filter picks which). */
export function AdvisorProcessThread({
  engagementId,
  side,
  chat,
}: {
  engagementId: string;
  side: "seller" | "investor";
  chat: AdvisorProcessChat;
}) {
  return (
    <div data-advisor-process-chats className="flex flex-1 flex-col">
      <ProjectThread
        key={chat.accessId}
        viewer={side}
        partyName={chat.label}
        advisorView={{ clientLabel: side === "seller" ? engagementCopy.clientSeller : engagementCopy.clientBuyer }}
        messages={chat.messages}
        action={postAdvisorProcessMessageAction}
        hidden={[
          { name: "engagementId", value: engagementId },
          { name: "accessId", value: chat.accessId },
        ]}
        placeholder={sellerCopy.replyField}
        submitLabel={sellerCopy.chatSend}
        pendingLabel={sellerCopy.replying}
        savedLabel={sellerCopy.replySaved}
        invalidFallback={sellerCopy.replyInvalid}
      />
    </div>
  );
}
