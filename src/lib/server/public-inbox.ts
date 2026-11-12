import { randomUUID } from "node:crypto";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const contactTopics = [
  "Vender mi empresa",
  "Comprar una empresa",
  "Asesores",
  "Otro",
] as const;

export type ContactInput = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

/** Stores a public contact message for the admin inbox. Nothing is emailed anywhere. */
export async function saveContactMessage(
  input: ContactInput,
): Promise<{ ok: boolean }> {
  const name = String(input.name ?? "")
    .trim()
    .slice(0, 120);
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 200);
  const topic = contactTopics.includes(
    input.topic as (typeof contactTopics)[number],
  )
    ? input.topic
    : "Otro";
  const message = String(input.message ?? "")
    .trim()
    .slice(0, 2000);
  if (!name || !EMAIL.test(email) || message.length < 20) {
    return { ok: false };
  }
  await prisma.contactMessage.create({
    data: { id: randomUUID(), name, email, topic, message },
  });
  return { ok: true };
}

/** Adds an address to the newsletter list. Subscribing twice is not an error. */
export async function saveNewsletterSubscriber(
  raw: string,
): Promise<{ ok: boolean }> {
  const email = String(raw ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 200);
  if (!EMAIL.test(email)) {
    return { ok: false };
  }
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email },
    update: {},
  });
  return { ok: true };
}

export async function listPublicInbox(user: CurrentUser) {
  if (!user.onboarded || user.role !== "admin") {
    return { messages: [], subscribers: [] };
  }
  const [messages, subscribers] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);
  return { messages, subscribers };
}
