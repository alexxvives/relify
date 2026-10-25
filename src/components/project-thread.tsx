"use client";

import { useActionState, useEffect, useId, useLayoutEffect, useOptimistic, useRef, useState, type KeyboardEvent } from "react";
import { ArrowDown, FileText, ImagePlus, Loader2, MessagesSquare, Paperclip, Send, X } from "lucide-react";
import { companyCopy } from "@/lib/company-copy";
import { messageKindLabel, threadPartyLabel, type ThreadMessageView } from "@/lib/project-message";
import { sellerCopy } from "@/lib/seller-copy";

export type MessageActionState = { ok: true } | { ok: false; message: string } | null;

type Attachment = {
  id: string;
  name: string;
  preview: string | null;
};

type ChatMessage = ThreadMessageView & { sending?: boolean };

type Action = (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;

const GROUP_GAP_MS = 5 * 60 * 1000;
const ATTACHMENT_PREFIX = "Adjunto: ";
const TIME_ZONE = "Europe/Madrid";

const timeFormat = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });
const dayFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE });
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

function dayKey(date: Date): string {
  return dayKeyFormat.format(date);
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  if (dayKey(date) === dayKey(today)) {
    return "Hoy";
  }
  if (dayKey(date) === dayKey(yesterday)) {
    return "Ayer";
  }
  return dayFormat.format(date);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  const digits = parts.find((part) => /^\d+$/.test(part));
  if (digits) {
    return digits.slice(0, 2);
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function splitBody(body: string): { text: string; files: string[] } {
  const lines = body.split("\n");
  const files = lines.filter((line) => line.startsWith(ATTACHMENT_PREFIX)).map((line) => line.slice(ATTACHMENT_PREFIX.length).trim());
  const text = lines
    .filter((line) => !line.startsWith(ATTACHMENT_PREFIX))
    .join("\n")
    .trim();
  return { text, files };
}

type Group = { key: string; mine: boolean; day: string | null; messages: ChatMessage[] };

function groupMessages(messages: ChatMessage[]): Group[] {
  const groups: Group[] = [];
  let lastDay = "";
  for (const message of messages) {
    const at = new Date(message.createdAt);
    const day = dayKey(at);
    const previous = groups.at(-1);
    const last = previous?.messages.at(-1);
    const sameDay = day === lastDay;
    if (
      previous &&
      last &&
      sameDay &&
      previous.mine === message.mine &&
      at.getTime() - new Date(last.createdAt).getTime() < GROUP_GAP_MS &&
      last.kind === message.kind
    ) {
      previous.messages.push(message);
    } else {
      groups.push({ key: message.id, mine: message.mine, day: sameDay ? null : message.createdAt, messages: [message] });
    }
    lastDay = day;
  }
  return groups;
}

export function ProjectThread({
  viewer,
  messages,
  action,
  hidden,
  placeholder,
  submitLabel,
  pendingLabel,
  savedLabel,
  invalidFallback,
  partyName,
}: {
  viewer: "seller" | "investor";
  messages: ThreadMessageView[];
  action: Action;
  hidden: { name: string; value: string }[];
  placeholder: string;
  submitLabel: string;
  pendingLabel: string;
  savedLabel: string;
  invalidFallback: string;
  partyName?: string;
}) {
  const named = partyName?.trim() ?? "";
  const party = named.length > 0 ? named : threadPartyLabel(viewer);
  const you = viewer === "seller" ? sellerCopy.you : companyCopy.you;
  const [shown, addSending] = useOptimistic<ChatMessage[], string>(messages, (current, body) => [
    ...current,
    {
      id: `sending-${current.length}`,
      kind: "question",
      body,
      mine: true,
      createdAt: new Date().toISOString(),
      sending: true,
    },
  ]);
  const sendAction: Action = async (state, formData) => {
    const body = String(formData.get("body") ?? "").trim();
    if (body.length > 0) {
      addSending(body);
    }
    return action(state, formData);
  };

  const logRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const [seen, setSeen] = useState(messages.length);
  const lastMine = shown.at(-1)?.mine ?? false;
  const unseen = !atBottom && shown.length > seen;

  function scrollToEnd(smooth: boolean) {
    const log = logRef.current;
    if (log) {
      log.scrollTo({ top: log.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    }
  }

  useLayoutEffect(() => {
    if (nearBottom.current || lastMine) {
      scrollToEnd(false);
    }
  }, [shown.length, lastMine]);

  useEffect(() => {
    scrollToEnd(false);
  }, []);

  const groups = groupMessages(shown);

  return (
    <div className="flex h-full min-h-[24rem] flex-1 flex-col gap-3">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="Chat"
          onScroll={(event) => {
            const el = event.currentTarget;
            const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            nearBottom.current = near;
            if (near !== atBottom) {
              setAtBottom(near);
            }
            if (near && seen !== shown.length) {
              setSeen(shown.length);
            }
          }}
          className="flex max-h-[min(60vh,32rem)] min-h-[16rem] flex-1 flex-col overflow-y-auto overscroll-contain px-1 py-2"
        >
          {shown.length === 0 ? (
            <div className="m-auto flex max-w-xs flex-col items-center gap-3 px-4 py-10 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#eef1fb] text-[#465ab4]">
                <MessagesSquare className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-medium text-[#1c2740]">Aún no hay mensajes</p>
              <p className="text-sm text-[#667085]">{sellerCopy.threadEmpty}</p>
            </div>
          ) : (
            <ol className="flex flex-col gap-4">
              {groups.map((group) => (
                <li key={group.key} className="flex flex-col gap-4">
                  {group.day ? (
                    <div className="flex items-center gap-3 text-xs font-medium text-[#98a2b3]">
                      <span className="h-px flex-1 bg-[#eceff5]" />
                      <span suppressHydrationWarning>{dayLabel(group.day)}</span>
                      <span className="h-px flex-1 bg-[#eceff5]" />
                    </div>
                  ) : null}
                  <MessageGroup group={group} author={group.mine ? you : party} />
                </li>
              ))}
            </ol>
          )}
        </div>
        {unseen ? (
          <button
            type="button"
            onClick={() => {
              scrollToEnd(true);
            }}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#1c2740] px-3 py-1.5 text-xs font-medium text-white shadow-lg"
          >
            <ArrowDown className="size-3.5" aria-hidden />
            Nuevos mensajes
          </button>
        ) : null}
      </div>
      <ChatComposer
        key={messages.length}
        action={sendAction}
        hidden={hidden}
        placeholder={placeholder}
        submitLabel={submitLabel}
        pendingLabel={pendingLabel}
        savedLabel={savedLabel}
        invalidFallback={invalidFallback}
      />
    </div>
  );
}

function MessageGroup({ group, author }: { group: Group; author: string }) {
  const first = group.messages[0];
  const kind = first?.kind ?? "question";
  const mine = group.mine;
  const last = group.messages.length - 1;

  return (
    <div className={mine ? "flex items-end justify-end gap-2" : "flex items-end justify-start gap-2"}>
      {mine ? null : (
        <span
          aria-hidden
          className="mb-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8ecfa] text-xs font-semibold text-[#465ab4]"
        >
          {initials(author)}
        </span>
      )}
      <div className={mine ? "flex max-w-[min(80%,34rem)] flex-col items-end gap-1" : "flex max-w-[min(80%,34rem)] flex-col items-start gap-1"}>
        <p className={mine ? "flex items-center gap-2 px-1 text-xs text-[#667085]" : "flex items-center gap-2 px-1 text-xs text-[#667085]"}>
          <span className="font-medium text-[#1c2740]">{author}</span>
          {first ? (
            <time dateTime={first.createdAt} suppressHydrationWarning>
              {timeFormat.format(new Date(first.createdAt))}
            </time>
          ) : null}
          {kind === "question" ? null : (
            <span
              className={
                kind === "offer"
                  ? "rounded-full bg-[#fff4e5] px-2 py-0.5 text-xs font-medium text-[#9a5b00]"
                  : "rounded-full bg-[#eef1fb] px-2 py-0.5 text-xs font-medium text-[#465ab4]"
              }
            >
              {messageKindLabel(kind)}
            </span>
          )}
        </p>
        {group.messages.map((message, index) => (
          <Bubble key={message.id} message={message} mine={mine} top={index === 0} bottom={index === last} />
        ))}
      </div>
    </div>
  );
}

function Bubble({ message, mine, top, bottom }: { message: ChatMessage; mine: boolean; top: boolean; bottom: boolean }) {
  const { text, files } = splitBody(message.body);
  const corners = mine
    ? `rounded-[18px] ${top ? "" : "rounded-tr-md"} ${bottom ? "" : "rounded-br-md"}`
    : `rounded-[18px] ${top ? "" : "rounded-tl-md"} ${bottom ? "" : "rounded-bl-md"}`;
  const tone = mine ? "bg-[#465ab4] text-white" : "bg-[#f1f3f8] text-[#1c2740]";

  return (
    <div
      title={timeFormat.format(new Date(message.createdAt))}
      className={`${corners} ${tone} flex flex-col gap-2 px-3.5 py-2 text-sm leading-6 break-words ${message.sending ? "opacity-70" : ""}`}
    >
      {text.length > 0 ? <p className="whitespace-pre-wrap">{text}</p> : null}
      {files.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {files.map((name, index) => (
            <li
              key={`${name}-${index}`}
              className={
                mine
                  ? "inline-flex items-center gap-2 rounded-xl bg-white/15 px-2.5 py-1.5 text-xs"
                  : "inline-flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 text-xs"
              }
            >
              <FileText className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{name}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {message.sending ? (
        <span className="inline-flex items-center gap-1 self-end text-xs text-white/80">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Enviando…
        </span>
      ) : null}
    </div>
  );
}

function ChatComposer({
  action,
  hidden,
  placeholder,
  submitLabel,
  pendingLabel,
  savedLabel,
  invalidFallback,
}: {
  action: Action;
  hidden: { name: string; value: string }[];
  placeholder: string;
  submitLabel: string;
  pendingLabel: string;
  savedLabel: string;
  invalidFallback: string;
}) {
  const fieldId = useId();
  const [state, formAction, pending] = useActionState(action, null);
  const [text, setText] = useState("");
  const [hideError, setHideError] = useState(false);
  const [files, setFiles] = useState<Attachment[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    if (ready) {
      formRef.current?.requestSubmit();
    }
  }

  const body = body0(text, files);
  const ready = !pending && body.length > 0;

  function addFiles(list: FileList | null, images: boolean) {
    if (!list) {
      return;
    }

    const next = [...list].slice(0, 4).map((file, index) => ({
      id: `${file.name}-${file.size}-${index}`,
      name: file.name,
      preview: images ? URL.createObjectURL(file) : null,
    }));
    setFiles((current) => [...current, ...next].slice(0, 4));
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const found = current.find((file) => file.id === id);
      if (found?.preview) {
        URL.revokeObjectURL(found.preview);
      }
      return current.filter((file) => file.id !== id);
    });
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2"
      onSubmit={() => {
        setHideError(false);
      }}
    >
      {hidden.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <input type="hidden" name="body" value={body} />
      {files.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {files.map((file) => (
            <li key={file.id} className="inline-flex items-center gap-2 rounded-full bg-[#f4f7ff] py-1 pr-1 pl-2 text-xs text-[#1c2740]">
              {file.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.preview} alt="" className="size-8 rounded-full object-cover" />
              ) : (
                <Paperclip className="size-3.5 text-[#465ab4]" aria-hidden />
              )}
              <span className="max-w-40 truncate">{file.name}</span>
              <button
                type="button"
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-white"
                onClick={() => {
                  removeFile(file.id);
                }}
              >
                <X className="size-3.5" aria-hidden />
                <span className="sr-only">{companyCopy.cardPhotosRemove}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-end gap-2 rounded-2xl border border-[#e6e9f0] bg-white p-1.5 shadow-sm transition focus-within:border-[#465ab4]/50 focus-within:ring-2 focus-within:ring-[#465ab4]/15">
        <label className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#465ab4] hover:bg-white">
          <Paperclip className="size-4" aria-hidden />
          <span className="sr-only">{companyCopy.attachFile}</span>
          <input
            type="file"
            className="sr-only"
            multiple
            onChange={(event) => {
              addFiles(event.target.files, false);
              event.target.value = "";
            }}
          />
        </label>
        <label className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#465ab4] hover:bg-white">
          <ImagePlus className="size-4" aria-hidden />
          <span className="sr-only">{companyCopy.attachImage}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            multiple
            onChange={(event) => {
              addFiles(event.target.files, true);
              event.target.value = "";
            }}
          />
        </label>
        <label className="sr-only" htmlFor={fieldId}>
          {placeholder}
        </label>
        <textarea
          id={fieldId}
          value={text}
          rows={1}
          maxLength={2000}
          placeholder={placeholder}
          readOnly={pending}
          onKeyDown={onKeyDown}
          onChange={(event) => {
            const el = event.target;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            setText(el.value);
            setHideError(true);
          }}
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-6 text-[#1c2740] outline-none placeholder:text-[#98a2b3]"
        />
        <button
          type="submit"
          disabled={!ready}
          className={
            ready
              ? "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#465ab4] px-5 text-base font-medium text-white shadow-sm transition hover:bg-[#3d4fa3]"
              : "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#e6e9f0] px-5 text-base font-medium text-[#5c6b78] transition"
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          <span>Enviar</span>
          <span className="sr-only">{pending ? pendingLabel : submitLabel}</span>
        </button>
      </div>
      {state?.ok === true ? <p className="sr-only" role="status">{savedLabel}</p> : null}
      {state && !state.ok && !hideError ? (
        <p className="text-sm text-red-700" role="alert">
          {state.message || invalidFallback}
        </p>
      ) : null}
    </form>
  );
}

function body0(text: string, files: Attachment[]): string {
  return [text.trim(), ...files.map((file) => `${ATTACHMENT_PREFIX}${file.name}`)].filter((line) => line.length > 0).join("\n");
}
