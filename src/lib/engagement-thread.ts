import * as z from "zod";
import type { ProcessFile } from "./deal-pipeline";
import type { ThreadMessageView } from "./project-message";

export const engagementIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{7,80}$/);

export const engagementMessageSchema = z.object({
  engagementId: engagementIdSchema,
  kind: z.enum(["question", "meeting"]),
  body: z.string().trim().min(1).max(2000),
});

export const engagementMeetingSchema = z.object({
  engagementId: engagementIdSchema,
  messageId: engagementIdSchema,
  body: z.string().trim().max(2000).optional(),
});

export type AdvisorContactView = {
  id: string;
  slug: string;
  heading: string;
  detail: string;
  services: string;
  partyName: string;
  placeholder: string;
  viewer: "investor" | "seller";
  messages: ThreadMessageView[];
  documents: ProcessFile[];
};
