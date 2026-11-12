---
name: project-messages
description: >-
  Add or change Releva project messages and in-app notices. Use when working
  on preguntas, reuniones, oferta indicativa, notifications, or a thread
  between a seller and an investor.
---

# Project messages

Preguntas, reuniones, and oferta indicativa on the investor project page are empty states. In-app notices already exist: access request, NDA acceptance, and advisory quote. A notice is not a message thread.

## Notices

Write notices only through `recordNotification` in `src/lib/server/record-notification.ts`. Seller-facing access copy comes from `incomingAccessNotice` and `incomingNdaNotice` in `src/lib/notifications.ts`: "Un inversor" and the project codename. Do not put the investor's name, email, NIF, or phone in a seller notice.

## When adding a thread

1. Wait until the data room work is the current milestone, or the user explicitly asks for messages. Empty tabs stay empty until then.
2. One service per action in `src/lib/server`. The action parses Zod input and does not call Prisma.
3. An investor posts only on a published project after `ndaAccessGate` passes. A seller reads and replies only on a project they own. An advisor does not see that thread.
4. Message bodies and sender identity follow the confidential-reads skill: the seller still sees "Un inversor", not the investor's account fields.
5. Click the bell and the thread as both roles. Confirm the seller HTML has no investor email or name.
