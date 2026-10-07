import { describe, expect, it } from "vitest";
import { attachmentNames, madridToday, meetingBody, meetingIsPast, readMeeting, withMeetingNotes } from "./meeting";

describe("meetingBody", () => {
  it("keeps a day range and an hour range", () => {
    const body = meetingBody({
      from: "2026-10-12",
      to: "2026-10-16",
      fromTime: "10:00",
      toTime: "12:30",
      notes: "Primera llamada",
    });

    expect(body).not.toBeNull();
    expect(readMeeting(body ?? "")).toEqual({
      from: "2026-10-12",
      to: "2026-10-16",
      fromTime: "10:00",
      toTime: "12:30",
      notes: "Primera llamada",
    });
  });

  it("rejects an inverted range and a free-text body", () => {
    expect(
      meetingBody({
        from: "2026-10-16",
        to: "2026-10-12",
        fromTime: "10:00",
        toTime: "12:00",
        notes: "",
      }),
    ).toBeNull();
    expect(readMeeting("el martes a las diez")).toBeNull();
  });
});

describe("withMeetingNotes", () => {
  it("replaces the notes and leaves a past day on the right", () => {
    const body = meetingBody({
      from: "2026-10-01",
      to: "2026-10-02",
      fromTime: "09:00",
      toTime: "10:00",
      notes: "Borrador",
    });

    expect(withMeetingNotes(body ?? "", "Cerrada")).toContain("Cerrada");
    expect(withMeetingNotes("hola", "Cerrada")).toBeNull();
    expect(meetingIsPast(readMeeting(body ?? "") ?? { from: "", to: "", fromTime: "", toTime: "", notes: "" }, "2026-10-07")).toBe(
      true,
    );
    expect(madridToday(new Date("2026-10-07T22:30:00.000Z"))).toBe("2026-10-08");
  });
});

describe("attachmentNames", () => {
  it("lists names sent in the chat once", () => {
    expect(attachmentNames(["Hola\nAdjunto: nda.pdf", "Adjunto: nda.pdf\nAdjunto: cuentas.xml"])).toEqual([
      "nda.pdf",
      "cuentas.xml",
    ]);
  });
});
