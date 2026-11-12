import { emailSiteUrl } from "@/lib/env";
import {
  connectionRequestEmail,
  newMessagesEmail,
  projectPublishedEmail,
  requestAcceptedEmail,
} from "@/lib/email/messages";
import { prisma } from "@/lib/db";
import { takeThrottle } from "@/lib/server/email-throttle";
import { sendMail } from "@/lib/server/mailer";
import { ownerContact, ownerHome } from "@/lib/server/owner-contact";

/**
 * t73b: email copies of in-app notices. Every function here swallows its own failures
 * (sendMail never throws; lookups are guarded) so the user's action always completes.
 */

function link(path: string): string {
  return new URL(path, emailSiteUrl()).toString();
}

async function quietly(task: () => Promise<unknown>): Promise<void> {
  try {
    await task();
  } catch {
    console.warn("[email-notice] skipped");
  }
}

export function emailOwnerConnectionRequest(
  ownerId: string | null,
  codename: string,
): Promise<void> {
  return quietly(async () => {
    const owner = await ownerContact(ownerId);
    if (!owner || !ownerId) return;
    if (!(await takeThrottle(`request:owner:${ownerId}`, 10, 60 * 60))) return;
    await sendMail({
      to: owner.email,
      tag: "connection-request",
      ...connectionRequestEmail(
        owner.firstName,
        codename,
        link(ownerHome(owner.role, "/mi-empresa/procesos")),
      ),
    });
  });
}

/** One email per buyer conversation every 6 hours at most, however many messages arrive. */
export function emailOwnerNewMessages(
  ownerId: string | null,
  accessId: string,
  codename: string,
): Promise<void> {
  return quietly(async () => {
    const owner = await ownerContact(ownerId);
    if (!owner) return;
    if (!(await takeThrottle(`messages:access:${accessId}`, 1, 6 * 60 * 60)))
      return;
    await sendMail({
      to: owner.email,
      tag: "new-messages",
      ...newMessagesEmail(
        owner.firstName,
        codename,
        link(ownerHome(owner.role, "/mi-empresa/procesos")),
      ),
    });
  });
}

export function emailBuyerAccepted(
  investorId: string,
  codename: string,
  slug: string,
): Promise<void> {
  return quietly(async () => {
    const buyer = await prisma.user.findUnique({
      where: { id: investorId },
      select: { email: true, name: true, suspendedAt: true },
    });
    if (!buyer || buyer.suspendedAt) return;
    await sendMail({
      to: buyer.email,
      tag: "request-accepted",
      ...requestAcceptedEmail(
        buyer.name.trim().split(/\s+/)[0] ?? "",
        codename,
        link(`/proyectos/${slug}`),
      ),
    });
  });
}

export function emailOwnerPublished(
  ownerId: string | null,
  codename: string,
): Promise<void> {
  return quietly(async () => {
    const owner = await ownerContact(ownerId);
    if (!owner) return;
    await sendMail({
      to: owner.email,
      tag: "project-published",
      ...projectPublishedEmail(
        owner.firstName,
        codename,
        link(ownerHome(owner.role)),
      ),
    });
  });
}
