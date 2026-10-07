"use client";

import { useActionState, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SquarePenIcon } from "@/components/ui/square-pen";
import { meetingBody, meetingIsPast, readMeeting } from "@/lib/meeting";
import { sellerCopy } from "@/lib/seller-copy";
import type { ThreadMessageView } from "@/lib/project-message";
import type { MessageActionState } from "@/components/project-thread";

const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const weekdays = ["L", "M", "X", "J", "V", "S", "D"];
const starts = Array.from({ length: 23 }, (_, index) => {
  const total = 8 * 60 + index * 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});
const durations = [
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 h" },
  { minutes: 90, label: "1 h 30" },
  { minutes: 120, label: "2 h" },
  { minutes: 180, label: "3 h" },
] as const;

const dialogClass =
  "fixed top-1/2 left-1/2 z-50 m-0 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e7eaee] bg-white p-6 text-[#2b3b4a] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] backdrop:bg-[#1c2740]/40";

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

function plusMinutes(time: string, minutes: number): string | null {
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  const total = hour * 60 + minute + minutes;

  if (total > 20 * 60) {
    return null;
  }

  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
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
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(notes);
  const [state, formAction, pending] = useActionState(action, null);
  const [closed, setClosed] = useState<MessageActionState>(null);

  if (state?.ok && state !== closed) {
    setClosed(state);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="mt-2 flex items-start gap-3">
        <p className="min-w-0 flex-1 text-sm leading-6 whitespace-pre-wrap text-[#3d4a63]">
          {notes.trim().length > 0 ? notes : <span className="text-[#8b95a7]">{sellerCopy.meetingsNoNotes}</span>}
        </p>
        <button
          type="button"
          aria-label={sellerCopy.meetingsEditNotes}
          onClick={() => {
            setEditing(true);
          }}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[#465ab4] hover:bg-[#eef2ff]"
        >
          <SquarePenIcon size={16} aria-hidden />
        </button>
      </div>
    );
  }

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
          type="button"
          onClick={() => {
            setValue(notes);
            setEditing(false);
          }}
          className="inline-flex h-9 items-center rounded-full border border-[#e1e6ee] px-3 text-sm font-medium"
        >
          {sellerCopy.meetingsCancel}
        </button>
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
  approveAction,
  hidden,
}: {
  message: ThreadMessageView;
  today: string;
  notesAction?: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  approveAction?: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
}) {
  const slot = readMeeting(message.body);
  const past = slot ? meetingIsPast(slot, today) : false;
  const tag = !slot || past ? null : slot.status === "proposed" ? sellerCopy.meetingsProposalTag : sellerCopy.meetingsScheduledTag;

  return (
    <li className="rounded-2xl bg-[#f7f8fb] px-4 py-3">
      {slot ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-[#1c2740]">
              {slot.from === slot.to ? formatDay(slot.from) : `${formatDay(slot.from)} – ${formatDay(slot.to)}`}
              <span className="ml-2 font-medium text-[#465ab4]">
                {slot.fromTime}–{slot.toTime}
              </span>
            </p>
            {tag ? (
              <span className="shrink-0 rounded-full bg-[#eef2ff] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#465ab4] uppercase">
                {tag}
              </span>
            ) : null}
          </div>
          {slot.description.length > 0 ? <p className="mt-2 text-sm leading-6 text-[#3d4a63]">{slot.description}</p> : null}
          {slot.status === "scheduled" && notesAction ? (
            <MeetingNotes messageId={message.id} notes={slot.notes} action={notesAction} hidden={hidden} />
          ) : null}
          {slot.status === "proposed" && !message.mine && approveAction ? (
            <AcceptMeeting messageId={message.id} action={approveAction} hidden={hidden} />
          ) : null}
        </>
      ) : (
        <p className="text-sm leading-6 text-[#3d4a63]">{message.body}</p>
      )}
    </li>
  );
}

function AcceptMeeting({
  messageId,
  action,
  hidden,
}: {
  messageId: string;
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="mt-3 flex items-center justify-end gap-3">
      {hidden.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <input type="hidden" name="messageId" value={messageId} />
      {state && !state.ok ? <p className="text-sm text-red-700">{state.message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center rounded-full bg-[#17663a] px-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? sellerCopy.replying : sellerCopy.meetingsAccept}
      </button>
    </form>
  );
}

function MonthGrid({
  cursor,
  onCursor,
  selected,
  onPick,
  blocked,
  marks,
}: {
  cursor: string;
  onCursor: (next: string) => void;
  selected: string;
  onPick?: (day: string) => void;
  blocked: (day: string) => boolean;
  marks: ReadonlySet<string>;
}) {
  const cells = monthCells(cursor);
  const [yearText, monthText] = cursor.split("-");

  return (
    <div className="rounded-2xl bg-[#f4f7ff] p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => {
            onCursor(shiftMonth(cursor, -1));
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
            onCursor(shiftMonth(cursor, 1));
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
          const unavailable = day !== null && blocked(day);
          const active = day !== null && day === selected;
          const marked = day !== null && marks.has(day);
          return (
            <button
              key={day ?? `empty-${index}`}
              type="button"
              disabled={day === null || unavailable || !onPick}
              onClick={() => {
                if (day && onPick) {
                  onPick(day);
                }
              }}
              className={
                day === null
                  ? "h-8"
                  : active
                    ? "h-8 rounded-full bg-[#465ab4] text-xs font-semibold text-white"
                    : unavailable
                      ? "h-8 rounded-full text-xs text-[#c5cdd8]"
                      : marked
                        ? "h-8 rounded-full bg-white text-xs font-semibold text-[#465ab4]"
                        : "h-8 rounded-full text-xs text-[#1c2740] hover:bg-white"
              }
            >
              {day ? Number(day.slice(8)) : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SlotForm({
  action,
  hidden,
  submitLabel,
  today,
  mode,
  onDone,
}: {
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
  submitLabel: string;
  today: string;
  mode: "propose" | "log";
  onDone: () => void;
}) {
  const [day, setDay] = useState("");
  const [fromTime, setFromTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [text, setText] = useState("");
  const [cursor, setCursor] = useState(today.slice(0, 7));
  const [state, formAction, pending] = useActionState(action, null);
  const end = plusMinutes(fromTime, duration);
  const body =
    day.length > 0 && end
      ? (meetingBody({
          from: day,
          to: day,
          fromTime,
          toTime: end,
          description: mode === "propose" ? text : "",
          notes: mode === "log" ? text : "",
          status: mode === "propose" ? "proposed" : "scheduled",
        }) ?? "")
      : "";

  useEffect(() => {
    if (state?.ok) {
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="grid gap-4">
      {hidden.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <input type="hidden" name="body" value={body} />
      <MonthGrid
        cursor={cursor}
        onCursor={setCursor}
        selected={day}
        marks={new Set()}
        blocked={(value) => (mode === "log" ? value > today : value < today)}
        onPick={setDay}
      />
      <div>
        <p className="text-sm font-medium text-[#1c2740]">{sellerCopy.meetingsStart}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {starts.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => {
                setFromTime(time);
              }}
              className={
                time === fromTime
                  ? "h-8 rounded-full bg-[#465ab4] px-2.5 text-xs font-semibold text-white"
                  : "h-8 rounded-full bg-[#f4f7ff] px-2.5 text-xs text-[#1c2740] hover:bg-white"
              }
            >
              {time}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-[#1c2740]">{sellerCopy.meetingsDuration}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {durations.map((item) => {
            const allowed = plusMinutes(fromTime, item.minutes) !== null;
            return (
              <button
                key={item.minutes}
                type="button"
                disabled={!allowed}
                onClick={() => {
                  setDuration(item.minutes);
                }}
                className={
                  item.minutes === duration
                    ? "h-8 rounded-full bg-[#465ab4] px-3 text-xs font-semibold text-white"
                    : "h-8 rounded-full bg-[#f4f7ff] px-3 text-xs text-[#1c2740] hover:bg-white disabled:text-[#c5cdd8]"
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {end ? (
          <p className="mt-2 text-sm text-[#465ab4]">
            {fromTime}–{end}
          </p>
        ) : null}
      </div>
      <label className="text-sm font-medium text-[#1c2740]">
        {mode === "propose" ? sellerCopy.meetingsDescription : sellerCopy.meetingsNotes}
        <textarea
          value={text}
          maxLength={2000}
          onChange={(event) => {
            setText(event.target.value);
          }}
          className="mt-1 min-h-20 w-full rounded-xl border border-[#e1e6ee] bg-[#f4f7ff] px-3 py-2 text-sm"
        />
      </label>
      <div className="flex items-center justify-end gap-3">
        {state && !state.ok ? <p className="text-sm text-red-700">{state.message}</p> : null}
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-10 items-center rounded-full border border-[#e1e6ee] px-4 text-sm font-medium"
        >
          {sellerCopy.meetingsCancel}
        </button>
        <button
          type="submit"
          disabled={pending || body.length === 0}
          className="inline-flex h-10 items-center rounded-full bg-[#3d34b8] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? sellerCopy.replying : submitLabel}
        </button>
      </div>
    </form>
  );
}

function MeetingDialog({
  dialogRef,
  title,
  formKey,
  action,
  hidden,
  submitLabel,
  today,
  mode,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title: string;
  formKey: number;
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
  submitLabel: string;
  today: string;
  mode: "propose" | "log";
}) {
  const close = useCallback(() => {
    dialogRef.current?.close();
  }, [dialogRef]);

  return (
    <dialog ref={dialogRef} className={dialogClass}>
      <h3 className="text-lg font-semibold text-[#1c2740]">{title}</h3>
      <p className="mt-1 mb-4 text-sm text-[#667085]">{sellerCopy.meetingsRange}</p>
      <SlotForm
        key={formKey}
        action={action}
        hidden={hidden}
        submitLabel={submitLabel}
        today={today}
        mode={mode}
        onDone={close}
      />
    </dialog>
  );
}

function meetingDays(messages: ThreadMessageView[]): Set<string> {
  const days = new Set<string>();

  for (const message of messages) {
    const slot = readMeeting(message.body);
    if (slot) {
      days.add(slot.from);
    }
  }

  return days;
}

export function MeetingDesk({
  messages,
  action,
  notesAction,
  approveAction,
  hidden,
  today,
}: {
  messages: ThreadMessageView[];
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  notesAction?: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  approveAction?: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
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
  const proposeRef = useRef<HTMLDialogElement>(null);
  const logRef = useRef<HTMLDialogElement>(null);
  const [proposeKey, setProposeKey] = useState(0);
  const [logKey, setLogKey] = useState(0);
  const [cursor, setCursor] = useState(today.slice(0, 7));
  const marks = meetingDays(meetings);

  function openDialog(ref: RefObject<HTMLDialogElement | null>, bump: (value: number) => void) {
    bump(Date.now());
    ref.current?.showModal();
  }

  return (
    <section className="grid items-start gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#1c2740]">{sellerCopy.meetingsHeading}</h3>
          <button
            type="button"
            onClick={() => {
              openDialog(proposeRef, setProposeKey);
            }}
            className="inline-flex h-10 items-center rounded-full bg-[#3d34b8] px-4 text-sm font-medium text-white"
          >
            {sellerCopy.meetingsPropose}
          </button>
        </div>
        <p className="mt-1 text-sm text-[#667085]">{sellerCopy.meetingsGlance}</p>
        <div className="mt-4">
          <MonthGrid cursor={cursor} onCursor={setCursor} selected="" marks={marks} blocked={() => false} />
        </div>
      </div>
      <div className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
        <h3 className="text-lg font-semibold text-[#1c2740]">{sellerCopy.meetingsUpcoming}</h3>
        {upcoming.length === 0 ? <p className="mt-3 text-sm text-[#667085]">{sellerCopy.meetingsNone}</p> : null}
        <ul className="mt-3 flex flex-col gap-3">
          {upcoming.map((message) => (
            <MeetingCard
              key={message.id}
              message={message}
              today={today}
              notesAction={notesAction}
              approveAction={approveAction}
              hidden={hidden}
            />
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#1c2740]">{sellerCopy.meetingsPast}</h3>
          <button
            type="button"
            onClick={() => {
              openDialog(logRef, setLogKey);
            }}
            className="inline-flex h-10 items-center rounded-full border border-[#d5dbe8] px-4 text-sm font-medium text-[#3d34b8]"
          >
            {sellerCopy.meetingsLog}
          </button>
        </div>
        <p className="mt-1 text-sm text-[#667085]">{sellerCopy.meetingsPastHint}</p>
        {past.length === 0 ? <p className="mt-3 text-sm text-[#667085]">{sellerCopy.meetingsNone}</p> : null}
        <ul className="mt-3 flex flex-col gap-3">
          {past.map((message) => (
            <MeetingCard key={message.id} message={message} today={today} notesAction={notesAction} hidden={hidden} />
          ))}
        </ul>
      </div>
      <MeetingDialog
        dialogRef={proposeRef}
        title={sellerCopy.meetingsPropose}
        formKey={proposeKey}
        action={action}
        hidden={hidden}
        submitLabel={sellerCopy.meetingsPropose}
        today={today}
        mode="propose"
      />
      <MeetingDialog
        dialogRef={logRef}
        title={sellerCopy.meetingsLog}
        formKey={logKey}
        action={action}
        hidden={hidden}
        submitLabel={sellerCopy.meetingsLog}
        today={today}
        mode="log"
      />
    </section>
  );
}
