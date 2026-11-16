import { describe, expect, it } from "vitest";
import { waitlistSchema } from "@/lib/waitlist";

describe("waitlistSchema", () => {
  it("accepts a company seat with an empty city", () => {
    const parsed = waitlistSchema.safeParse({
      role: "company",
      name: "Elena Vives",
      email: "elena@example.com",
      city: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects a short name and a bad email", () => {
    const parsed = waitlistSchema.safeParse({
      role: "investor",
      name: "A",
      email: "no-es-correo",
      city: "Valencia",
    });

    expect(parsed.success).toBe(false);
  });
});
