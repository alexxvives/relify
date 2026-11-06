import { describe, expect, it } from "vitest";
import { senderFor } from "./mailer";

describe("senderFor", () => {
  it("sends a team alert from the inbox to itself", () => {
    expect(senderFor("info@itsrelify.com")).toEqual({
      address: "info@itsrelify.com",
      name: "Relify",
    });
    expect(senderFor(" Info@ItsRelify.com ")).toEqual({
      address: "info@itsrelify.com",
      name: "Relify",
    });
  });

  it("keeps mail to a person on notificaciones@", () => {
    expect(senderFor("alexxvives@gmail.com")).toEqual({
      address: "notificaciones@itsrelify.com",
      name: "Relify",
    });
  });
});
