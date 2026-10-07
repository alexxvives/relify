import * as z from "zod";

const slotSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fromTime: z.string().regex(/^\d{2}:\d{2}$/),
  toTime: z.string().regex(/^\d{2}:\d{2}$/),
  description: z.string().trim().max(2000).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  status: z.enum(["proposed", "scheduled"]).optional().default("scheduled"),
});

export type MeetingSlot = z.infer<typeof slotSchema>;

export type MeetingDraft = {
  from: string;
  to: string;
  fromTime: string;
  toTime: string;
  description?: string;
  notes?: string;
  status?: MeetingSlot["status"];
};

const prefix = "reunion:";

export function meetingBody(slot: MeetingDraft): string | null {
  const parsed = slotSchema.safeParse(slot);

  if (!parsed.success || parsed.data.from > parsed.data.to || parsed.data.fromTime > parsed.data.toTime) {
    return null;
  }

  return `${prefix}${JSON.stringify(parsed.data)}`;
}

export function readMeeting(body: string): MeetingSlot | null {
  if (!body.startsWith(prefix)) {
    return null;
  }

  try {
    const parsed = slotSchema.safeParse(JSON.parse(body.slice(prefix.length)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function withMeetingNotes(body: string, notes: string): string | null {
  const slot = readMeeting(body);

  if (!slot || slot.status !== "scheduled" || notes.trim().length > 2000) {
    return null;
  }

  return meetingBody({ ...slot, notes: notes.trim() });
}

export function withMeetingStatus(body: string, status: "scheduled"): string | null {
  const slot = readMeeting(body);

  if (!slot) {
    return null;
  }

  return meetingBody({ ...slot, status });
}

export function madridToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function meetingIsPast(slot: MeetingSlot, today: string): boolean {
  return slot.to < today;
}

export function attachmentNames(bodies: readonly string[]): string[] {
  const names: string[] = [];

  for (const body of bodies) {
    for (const line of body.split("\n")) {
      if (line.startsWith("Adjunto: ")) {
        const name = line.slice("Adjunto: ".length).trim();
        if (name.length > 0 && !names.includes(name)) {
          names.push(name);
        }
      }
    }
  }

  return names;
}
