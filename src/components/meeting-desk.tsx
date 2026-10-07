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
const timeSlots = Array.from({ length: 25 }, (_, index) => {
  const total = 8 * 60 + index * 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});

const dialogClass =
  "fixed top-1/2 left-1/2 z-50 m-0 w-[min(52rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#e7eaee] bg-white p-6 text-[#2b3b4a] shadow-[0_24px_80px_-32px_rgba(28,39,64,0.55)] backdrop:bg-[#1c2740]/40";

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
  omitEmpty = false,
}: {
  messageId: string;
  notes: string;
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
  omitEmpty?: boolean;
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
        {notes.trim().length > 0 || !omitEmpty ? (
          <p className="min-w-0 flex-1 text-sm leading-6 whitespace-pre-wrap text-[#3d4a63]">
            {notes.trim().length > 0 ? notes : <span className="text-[#8b95a7]">{sellerCopy.meetingsNoNotes}</span>}
          </p>
        ) : null}
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
  onEdit,
}: {
  message: ThreadMessageView;
  today: string;
  notesAction?: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  approveAction?: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
  onEdit?: () => void;
}) {
  const slot = readMeeting(message.body);
  const past = slot ? meetingIsPast(slot, today) : false;
  const tag = slot && !past && slot.status === "proposed" ? sellerCopy.meetingsProposalTag : null;

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
              {tag ? (
                <span className="ml-2 rounded-full bg-[#eef2ff] px-2 py-0.5 align-middle text-[11px] font-semibold tracking-wide text-[#465ab4] uppercase">
                  {tag}
                </span>
              ) : null}
            </p>
            {onEdit ? (
              <button
                type="button"
                aria-label={sellerCopy.meetingsChange}
                onClick={onEdit}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[#465ab4] hover:bg-[#eef2ff]"
              >
                <SquarePenIcon size={16} aria-hidden />
              </button>
            ) : null}
          </div>
          {slot.description.length > 0 ? <p className="mt-2 text-sm leading-6 text-[#3d4a63]">{slot.description}</p> : null}
          {slot.status === "scheduled" && notesAction ? (
            <MeetingNotes messageId={message.id} notes={slot.notes} action={notesAction} hidden={hidden} omitEmpty={past} />
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
  today,
  legend = false,
}: {
  cursor: string;
  onCursor: (next: string) => void;
  selected: string;
  onPick?: (day: string) => void;
  blocked: (day: string) => boolean;
  marks: ReadonlySet<string>;
  today: string;
  legend?: boolean;
}) {
  const cells = monthCells(cursor);
  const [yearText, monthText] = cursor.split("-");

  return (
    <div className="rounded-3xl border border-[#e6e9f0] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => {
            onCursor(shiftMonth(cursor, -1));
          }}
          className="inline-flex size-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#f4f7ff]"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <p className="text-sm font-semibold tracking-wide text-[#1c2740] capitalize">
          {months[Number(monthText) - 1]} {yearText}
        </p>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => {
            onCursor(shiftMonth(cursor, 1));
          }}
          className="inline-flex size-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#f4f7ff]"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-medium tracking-wide text-[#98a2b3]">
        {weekdays.map((day) => (
          <span key={day} className="pb-2">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, index) => {
          const unavailable = day !== null && blocked(day);
          const active = day !== null && day === selected;
          const marked = day !== null && marks.has(day);
          const todayMark = day === today;
          return day === null ? (
            <span key={`empty-${index}`} className="h-10" />
          ) : (
            <button
              key={day}
              type="button"
              disabled={unavailable || !onPick}
              onClick={() => {
                if (onPick) {
                  onPick(day);
                }
              }}
              className={
                active
                  ? "mx-auto flex size-10 items-center justify-center rounded-full bg-[#465ab4] text-sm font-semibold text-white"
                  : unavailable
                    ? "mx-auto flex size-10 items-center justify-center rounded-full text-sm text-[#d0d5dd]"
                    : marked
                      ? "mx-auto flex size-10 items-center justify-center rounded-full bg-[#eef2ff] text-sm font-semibold text-[#465ab4]"
                      : todayMark
                        ? "mx-auto flex size-10 items-center justify-center rounded-full text-sm font-semibold text-[#465ab4] ring-1 ring-[#c9d4f5]"
                        : "mx-auto flex size-10 items-center justify-center rounded-full text-sm text-[#1c2740] hover:bg-[#f4f7ff]"
              }
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
      {legend ? (
        <div className="mt-3 flex items-center gap-4 border-t border-[#eef1f6] pt-3 text-xs text-[#667085]">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#465ab4]" />
            {sellerCopy.meetingsLegendMark}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full ring-1 ring-[#c9d4f5]" />
            {sellerCopy.meetingsLegendToday}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function durationLabel(from: string, to: string): string {
  const [fromHour, fromMinute] = from.split(":").map(Number);
  const [toHour, toMinute] = to.split(":").map(Number);
  const minutes = (toHour ?? 0) * 60 + (toMinute ?? 0) - ((fromHour ?? 0) * 60 + (fromMinute ?? 0));

  if (minutes <= 0) {
    return "";
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest} min`;
  }

  if (rest === 0) {
    return hours === 1 ? "1 h" : `${hours} h`;
  }

  return `${hours} h ${rest} min`;
}

function HourRange({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const drag = useRef<string | null>(null);
  const span = durationLabel(from, to);

  function choose(slot: string) {
    const anchor = drag.current ?? slot;
    const start = anchor < slot ? anchor : slot;
    const end = anchor < slot ? slot : anchor;
    const finish = start === end ? (plusMinutes(start, 30) ?? "20:00") : end;
    onChange(start, finish);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-2xl bg-[#eef2ff] px-3 py-2 text-center">
        <p className="text-sm font-semibold text-[#465ab4]">
          {from} – {to}
        </p>
        {span.length > 0 ? <p className="text-xs text-[#667085]">{span}</p> : null}
      </div>
      <div
        className="max-h-72 overflow-y-auto rounded-3xl border border-[#e6e9f0] bg-[#f7f8fb] p-1.5"
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {timeSlots.map((slot, index) => {
          const selected = slot >= from && slot < to;
          const previous = timeSlots[index - 1];
          const next = timeSlots[index + 1];
          const starts = selected && (previous === undefined || previous < from);
          const ends = selected && (next === undefined || next >= to);
          return (
            <button
              key={slot}
              type="button"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                drag.current = slot;
                choose(slot);
              }}
              onPointerEnter={() => {
                if (drag.current) {
                  choose(slot);
                }
              }}
              className={
                selected
                  ? `flex h-8 w-full items-center bg-[#465ab4] px-3 text-left text-xs font-semibold text-white ${starts ? "rounded-t-xl" : ""} ${ends ? "rounded-b-xl" : ""}`
                  : "flex h-8 w-full items-center rounded-lg px-3 text-left text-xs text-[#667085] hover:bg-white"
              }
            >
              {slot}
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
  initial,
}: {
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
  submitLabel: string;
  today: string;
  mode: "propose" | "log";
  onDone: () => void;
  initial?: { day: string; fromTime: string; toTime: string; text: string };
}) {
  const [day, setDay] = useState(initial?.day ?? "");
  const [fromTime, setFromTime] = useState(initial?.fromTime ?? "10:00");
  const [toTime, setToTime] = useState(initial?.toTime ?? "11:00");
  const [text, setText] = useState(initial?.text ?? "");
  const [cursor, setCursor] = useState((initial?.day ?? today).slice(0, 7));
  const [state, formAction, pending] = useActionState(action, null);
  const body =
    day.length > 0 && fromTime < toTime
      ? (meetingBody({
          from: day,
          to: day,
          fromTime,
          toTime,
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
      <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_9.5rem]">
        <MonthGrid
          cursor={cursor}
          onCursor={setCursor}
          selected={day}
          marks={new Set()}
          today={today}
          blocked={(value) => (mode === "log" ? value > today : value < today)}
          onPick={setDay}
        />
        <div>
          <HourRange
            from={fromTime}
            to={toTime}
            onChange={(start, end) => {
              setFromTime(start);
              setToTime(end);
            }}
          />
        </div>
      </div>
      <label className="text-sm font-medium text-[#1c2740]">
        {mode === "propose" ? sellerCopy.meetingsDescription : sellerCopy.meetingsNotes}
        <textarea
          value={text}
          maxLength={2000}
          onChange={(event) => {
            setText(event.target.value);
          }}
          className="mt-1 min-h-20 w-full rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] px-3 py-2 text-sm"
        />
      </label>
      <div className="rounded-2xl bg-[#f7f8fb] px-4 py-3">
        <p className="text-[11px] font-semibold tracking-wide text-[#8b95a7] uppercase">{sellerCopy.meetingsPreview}</p>
        <p className="mt-1 text-sm font-semibold text-[#1c2740]">{sellerCopy.meetingsUntitled}</p>
        <p className="mt-1 text-sm text-[#465ab4]">
          {day.length > 0 ? formatDay(day) : sellerCopy.meetingsRange}
          <span className="ml-2">
            {fromTime}–{toTime}
          </span>
        </p>
        {text.trim().length > 0 ? <p className="mt-1 text-sm leading-6 text-[#3d4a63]">{text.trim()}</p> : null}
      </div>
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
  initial,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title: string;
  formKey: number;
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  hidden: { name: string; value: string }[];
  submitLabel: string;
  today: string;
  mode: "propose" | "log";
  initial?: { day: string; fromTime: string; toTime: string; text: string };
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
        initial={initial}
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
  rescheduleAction,
  hidden,
  today,
}: {
  messages: ThreadMessageView[];
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  notesAction?: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  approveAction?: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
  rescheduleAction?: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
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
  const editRef = useRef<HTMLDialogElement>(null);
  const [proposeKey, setProposeKey] = useState(0);
  const [logKey, setLogKey] = useState(0);
  const [editKey, setEditKey] = useState(0);
  const [editing, setEditing] = useState<ThreadMessageView | null>(null);
  const editingSlot = editing ? readMeeting(editing.body) : null;
  const [cursor, setCursor] = useState(today.slice(0, 7));
  const marks = meetingDays(meetings);

  useEffect(() => {
    if (editing) {
      editRef.current?.showModal();
    }
  }, [editing, editKey]);

  function openDialog(ref: RefObject<HTMLDialogElement | null>, bump: (value: number) => void) {
    bump(Date.now());
    ref.current?.showModal();
  }

  return (
    <section className="grid items-start gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#1c2740]">{sellerCopy.meetingsCalendar}</h3>
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
        <div className="mt-4">
          <MonthGrid
            cursor={cursor}
            onCursor={setCursor}
            selected=""
            marks={marks}
            today={today}
            blocked={() => false}
            legend
          />
        </div>
      </div>
      <div className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#1c2740]">{sellerCopy.meetingsRegister}</h3>
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
        {meetings.length === 0 ? <p className="mt-3 text-sm text-[#667085]">{sellerCopy.meetingsNone}</p> : null}
        <ul className="mt-3 flex flex-col gap-3">
          {[...upcoming, ...past].map((message) => (
            <MeetingCard
              key={message.id}
              message={message}
              today={today}
              notesAction={notesAction}
              approveAction={approveAction}
              hidden={hidden}
              onEdit={
                rescheduleAction
                  ? () => {
                      setEditing(message);
                      setEditKey(Date.now());
                    }
                  : undefined
              }
            />
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
      {rescheduleAction && editing && editingSlot ? (
        <MeetingDialog
          dialogRef={editRef}
          title={sellerCopy.meetingsChange}
          formKey={editKey}
          action={rescheduleAction}
          hidden={[...hidden, { name: "messageId", value: editing.id }]}
          submitLabel={sellerCopy.meetingsChange}
          today={today}
          mode="propose"
          initial={{
            day: editingSlot.from,
            fromTime: editingSlot.fromTime,
            toTime: editingSlot.toTime,
            text: editingSlot.description,
          }}
        />
      ) : null}
    </section>
  );
}
