"use client";

import { useActionState, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { meetingBody, meetingIsPast, readMeeting } from "@/lib/meeting";
import { sellerCopy } from "@/lib/seller-copy";
import type { ThreadMessageView } from "@/lib/project-message";
import type { MessageActionState } from "@/components/project-thread";

const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const weekdays = ["L", "M", "X", "J", "V", "S", "D"];

function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-");
  const name = months[Number(month) - 1] ?? month;
  return `${Number(day)} ${name} ${year}`;
}

function monthCells(cursor: string): Array<string | null> {
  const [yearText, monthText] = cursor.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<string | null> = Array.from({ length: lead }, () => null);

  for (let day = 1; day <= count; day += 1) {
    cells.push(`${yearText}-${monthText}-${String(day).padStart(2, "0")}`);
  }

  return cells;
}

function shiftMonth(cursor: string, delta: number): string {
  const [yearText, monthText] = cursor.split("-");
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function MeetingNotes({
  messageId,
  notes,
  action,
  hidden,
}: {
  messageId: string;
  notes: string;
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
}) {
  const [value, setValue] = useState(notes);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="mt-3">
      {hidden.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <input type="hidden" name="messageId" value={messageId} />
      <label className="text-sm font-medium text-[#1c2740]">
        {sellerCopy.meetingsNotes}
        <textarea
          name="notes"
          value={value}
          maxLength={2000}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          className="mt-1 min-h-20 w-full rounded-xl border border-[#e1e6ee] bg-white px-3 py-2 text-sm"
        />
      </label>
      <div className="mt-2 flex items-center justify-end gap-3">
        {state && !state.ok ? <p className="text-sm text-red-700">{state.message}</p> : null}
        <button
          type="submit"
          disabled={pending || value === notes}
          className="inline-flex h-9 items-center rounded-full bg-[#3d34b8] px-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? sellerCopy.replying : sellerCopy.meetingsSave}
        </button>
      </div>
    </form>
  );
}

function MeetingCard({
  message,
  today,
  notesAction,
  hidden,
}: {
  message: ThreadMessageView;
  today: string;
  notesAction?: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
}) {
  const slot = readMeeting(message.body);

  return (
    <li className="rounded-2xl bg-[#f7f8fb] px-4 py-3">
      {slot ? (
        <>
          <p className="text-sm font-semibold text-[#1c2740]">
            {slot.from === slot.to ? formatDay(slot.from) : `${formatDay(slot.from)} – ${formatDay(slot.to)}`}
            <span className="ml-2 font-medium text-[#465ab4]">
              {slot.fromTime}–{slot.toTime}
            </span>
          </p>
          {notesAction ? (
            <MeetingNotes messageId={message.id} notes={slot.notes} action={notesAction} hidden={hidden} />
          ) : slot.notes.length > 0 ? (
            <p className="mt-2 text-sm leading-6 text-[#3d4a63]">{slot.notes}</p>
          ) : null}
          {meetingIsPast(slot, today) ? null : (
            <p className="mt-2 text-xs font-medium tracking-wide text-[#8b95a7] uppercase">{sellerCopy.meetingsUpcoming}</p>
          )}
        </>
      ) : (
        <p className="text-sm leading-6 text-[#3d4a63]">{message.body}</p>
      )}
    </li>
  );
}

function SlotForm({
  action,
  hidden,
  submitLabel,
  today,
  fromLimit,
}: {
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
  submitLabel: string;
  today: string;
  fromLimit?: string;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromTime, setFromTime] = useState("10:00");
  const [toTime, setToTime] = useState("12:00");
  const [notes, setNotes] = useState("");
  const [cursor, setCursor] = useState(today.slice(0, 7));
  const [state, formAction, pending] = useActionState(action, null);
  const end = to.length > 0 ? to : from;
  const body = meetingBody({ from, to: end, fromTime, toTime, notes }) ?? "";
  const cells = monthCells(cursor);
  const [yearText, monthText] = cursor.split("-");

  function pick(day: string) {
    if (fromLimit && day > fromLimit) {
      return;
    }

    if (from.length === 0 || to.length > 0) {
      setFrom(day);
      setTo("");
      return;
    }

    if (day < from) {
      setTo(from);
      setFrom(day);
      return;
    }

    setTo(day);
  }

  return (
    <form action={formAction} className="grid gap-3">
      {hidden.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <input type="hidden" name="body" value={body} />
      <div className="rounded-2xl bg-[#f4f7ff] p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => {
              setCursor((current) => shiftMonth(current, -1));
            }}
            className="inline-flex size-8 items-center justify-center rounded-full hover:bg-white"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <p className="text-sm font-semibold text-[#1c2740]">
            {months[Number(monthText) - 1]} {yearText}
          </p>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => {
              setCursor((current) => shiftMonth(current, 1));
            }}
            className="inline-flex size-8 items-center justify-center rounded-full hover:bg-white"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#8b95a7]">
          {weekdays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, index) => {
            const selected = day !== null && (day === from || day === to || (to.length > 0 && day > from && day < to));
            const blocked = day !== null && fromLimit !== undefined && day > fromLimit;
            return (
              <button
                key={day ?? `empty-${index}`}
                type="button"
                disabled={day === null || blocked}
                onClick={() => {
                  if (day) {
                    pick(day);
                  }
                }}
                className={
                  day === null
                    ? "h-8"
                    : selected
                      ? "h-8 rounded-full bg-[#465ab4] text-xs font-semibold text-white"
                      : blocked
                        ? "h-8 rounded-full text-xs text-[#c5cdd8]"
                        : "h-8 rounded-full text-xs text-[#1c2740] hover:bg-white"
                }
              >
                {day ? Number(day.slice(8)) : ""}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-[#1c2740]">
          {sellerCopy.meetingsStart}
          <input
            type="time"
            required
            value={fromTime}
            onChange={(event) => {
              setFromTime(event.target.value);
            }}
            className="mt-1 h-11 w-full rounded-xl border border-[#e1e6ee] bg-[#f4f7ff] px-3 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-[#1c2740]">
          {sellerCopy.meetingsEnd}
          <input
            type="time"
            required
            value={toTime}
            onChange={(event) => {
              setToTime(event.target.value);
            }}
            className="mt-1 h-11 w-full rounded-xl border border-[#e1e6ee] bg-[#f4f7ff] px-3 text-sm"
          />
        </label>
      </div>
      <label className="text-sm font-medium text-[#1c2740]">
        {sellerCopy.meetingsNotes}
        <textarea
          value={notes}
          maxLength={2000}
          onChange={(event) => {
            setNotes(event.target.value);
          }}
          className="mt-1 min-h-20 w-full rounded-xl border border-[#e1e6ee] bg-[#f4f7ff] px-3 py-2 text-sm"
        />
      </label>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || body.length === 0}
          className="inline-flex h-10 items-center rounded-full bg-[#3d34b8] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? sellerCopy.replying : submitLabel}
        </button>
      </div>
      {state && !state.ok ? <p className="text-sm text-red-700">{state.message}</p> : null}
    </form>
  );
}

export function MeetingDesk({
  messages,
  action,
  notesAction,
  hidden,
  today,
  columns = false,
}: {
  messages: ThreadMessageView[];
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  notesAction?: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
  today: string;
  columns?: boolean;
}) {
  const meetings = messages.filter((message) => message.kind === "meeting");
  const past = meetings.filter((message) => {
    const slot = readMeeting(message.body);
    return slot ? meetingIsPast(slot, today) : false;
  });
  const upcoming = meetings.filter((message) => !past.includes(message));
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  if (columns) {
    return (
      <section className="grid items-start gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
          <h3 className="text-lg font-semibold text-[#1c2740]">{sellerCopy.meetingsPropose}</h3>
          <p className="mt-1 text-sm text-[#667085]">{sellerCopy.meetingsRange}</p>
          <div className="mt-4">
            <SlotForm action={action} hidden={hidden} submitLabel={sellerCopy.meetingsPropose} today={today} />
          </div>
          {upcoming.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-semibold tracking-wide text-[#5c6b78] uppercase">{sellerCopy.meetingsUpcoming}</p>
              <ul className="mt-3 flex flex-col gap-3">
                {upcoming.map((message) => (
                  <MeetingCard key={message.id} message={message} today={today} notesAction={notesAction} hidden={hidden} />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[#1c2740]">{sellerCopy.meetingsPast}</h3>
            <button
              type="button"
              onClick={() => {
                setLogOpen((current) => !current);
              }}
              className="inline-flex h-10 items-center rounded-full border border-[#d5dbe8] px-4 text-sm font-medium text-[#3d34b8]"
            >
              {sellerCopy.meetingsLog}
            </button>
          </div>
          <p className="mt-1 text-sm text-[#667085]">{sellerCopy.meetingsPastHint}</p>
          {logOpen ? (
            <div className="mt-4">
              <SlotForm action={action} hidden={hidden} submitLabel={sellerCopy.meetingsLog} today={today} fromLimit={today} />
            </div>
          ) : null}
          {past.length === 0 ? <p className="mt-4 text-sm text-[#667085]">{sellerCopy.meetingsNone}</p> : null}
          <ul className="mt-4 flex flex-col gap-3">
            {past.map((message) => (
              <MeetingCard key={message.id} message={message} today={today} notesAction={notesAction} hidden={hidden} />
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#1c2740]">{sellerCopy.meetingsHeading}</h3>
        <button
          type="button"
          onClick={() => {
            setOpen((current) => !current);
          }}
          className="inline-flex h-10 items-center rounded-full bg-[#3d34b8] px-4 text-sm font-medium text-white"
        >
          {sellerCopy.meetingsPropose}
        </button>
      </div>
      {meetings.length === 0 ? <p className="mt-4 text-sm text-[#667085]">{sellerCopy.meetingsNone}</p> : null}
      <ul className="mt-4 flex flex-col gap-3">
        {meetings.map((message) => (
          <MeetingCard key={message.id} message={message} today={today} notesAction={notesAction} hidden={hidden} />
        ))}
      </ul>
      {open ? (
        <div className="mt-4">
          <SlotForm action={action} hidden={hidden} submitLabel={sellerCopy.meetingsPropose} today={today} />
        </div>
      ) : null}
    </section>
  );
}
