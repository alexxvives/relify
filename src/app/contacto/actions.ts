"use server";

import { saveContactMessage, saveNewsletterSubscriber, type ContactInput } from "@/server/publicInbox";
import { clientIp, takeThrottle } from "@/server/emailThrottle";

export async function sendContactMessage(input: ContactInput) {
  if (!(await takeThrottle(`contact:ip:${await clientIp()}`, 8, 60 * 60, false))) {
    throw new Error("invalid");
  }
  const result = await saveContactMessage(input);
  if (!result.ok) {
    throw new Error("invalid");
  }
}

export async function subscribeNewsletter(email: string) {
  if (!(await takeThrottle(`newsletter:ip:${await clientIp()}`, 8, 60 * 60, false))) {
    throw new Error("invalid");
  }
  const result = await saveNewsletterSubscriber(email);
  if (!result.ok) {
    throw new Error("invalid");
  }
}
