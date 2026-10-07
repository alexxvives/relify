import { describe, expect, it } from "vitest";
import { attachmentNames, madridToday, meetingBody, meetingIsPast, proposeMeetingChange, readMeeting, withMeetingNotes, withMeetingStatus } from "./meeting";

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
      description: "",
      notes: "Primera llamada",
      status: "scheduled",
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
    expect(meetingIsPast(readMeeting(body ?? "") ?? { from: "", to: "", fromTime: "", toTime: "", description: "", notes: "", status: "scheduled" }, "2026-10-07")).toBe(
      true,
    );
    expect(madridToday(new Date("2026-10-07T22:30:00.000Z"))).toBe("2026-10-08");
  });
});

describe("meeting proposal", () => {
  it("keeps one day, a description, and private notes until it is accepted", () => {
    const body = meetingBody({
      from: "2026-10-14",
      to: "2026-10-14",
      fromTime: "10:00",
      toTime: "11:00",
      description: "Visita al obrador",
      status: "proposed",
    });

    expect(withMeetingNotes(body ?? "", "Nota interna")).toBeNull();
    expect(readMeeting(withMeetingStatus(body ?? "", "scheduled") ?? "")?.status).toBe("scheduled");
    expect(withMeetingNotes(withMeetingStatus(body ?? "", "scheduled") ?? "", "Nota interna")).toContain("Nota interna");
  });

  it("sends a time change back to the other person", () => {
    const body = meetingBody({
      from: "2026-10-14",
      to: "2026-10-14",
      fromTime: "10:00",
      toTime: "12:00",
      description: "Visita",
      notes: "Ya hablado",
      status: "scheduled",
    });
    const next = proposeMeetingChange(
      body ?? "",
      { from: "2026-10-21", to: "2026-10-21", fromTime: "16:00", toTime: "17:00", description: "Otra hora" },
      "seller",
    );
    const slot = readMeeting(next ?? "");

    expect(slot?.status).toBe("proposed");
    expect(slot?.proposedBy).toBe("seller");
    expect(slot?.from).toBe("2026-10-21");
    expect(slot?.notes).toBe("Ya hablado");
    expect(slot?.description).toBe("Otra hora");
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
