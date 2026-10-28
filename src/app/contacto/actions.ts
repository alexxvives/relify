"use server";

import { saveContactMessage, saveNewsletterSubscriber, type ContactInput } from "@/server/publicInbox";

export async function sendContactMessage(input: ContactInput) {
  const result = await saveContactMessage(input);
  if (!result.ok) {
    throw new Error("invalid");
  }
}

export async function subscribeNewsletter(email: string) {
  const result = await saveNewsletterSubscriber(email);
  if (!result.ok) {
    throw new Error("invalid");
  }
}
