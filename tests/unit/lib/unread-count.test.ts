import { describe, expect, it } from "vitest";
import { unreadCount, type ThreadMessageView } from "@/lib/project-message";

const msg = (id: string, mine: boolean, createdAt: string): ThreadMessageView => ({ id, kind: "question", body: id, mine, createdAt });

describe("unreadCount", () => {
  const messages = [msg("a", false, "2026-10-01T10:00:00Z"), msg("b", true, "2026-10-02T10:00:00Z"), msg("c", false, "2026-10-03T10:00:00Z")];

  it("counts every incoming message when the chat was never opened", () => {
    expect(unreadCount(messages, null)).toBe(2);
  });

  it("counts only incoming messages after the last read", () => {
    expect(unreadCount(messages, "2026-10-02T00:00:00Z")).toBe(1);
    expect(unreadCount(messages, "2026-10-04T00:00:00Z")).toBe(0);
  });
});
