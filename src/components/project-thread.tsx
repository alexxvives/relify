"use client";

import { useActionState, useId, useState } from "react";
import { ImagePlus, Paperclip, Send, X } from "lucide-react";
import { companyCopy } from "@/lib/company-copy";
import { messageKindLabel, threadPartyLabel, type ThreadMessageView } from "@/lib/project-message";
import { sellerCopy } from "@/lib/seller-copy";

export type MessageActionState = { ok: true } | { ok: false; message: string } | null;

type Attachment = {
  id: string;
  name: string;
  preview: string | null;
};

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
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
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

  return (
    <div className="flex h-full min-h-[24rem] flex-1 flex-col gap-4">
      {messages.length === 0 ? <p className="text-sm text-[#667085]">{sellerCopy.threadEmpty}</p> : null}
      <ol className="flex flex-1 flex-col gap-3" aria-live="polite">
        {messages.map((message) => (
          <li key={message.id} className={message.mine ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                message.mine
                  ? "max-w-[min(78%,34rem)] rounded-2xl rounded-br-md bg-[#465ab4] px-4 py-3 text-white"
                  : "max-w-[min(78%,34rem)] rounded-2xl rounded-bl-md border border-[#e6e9f0] bg-white px-4 py-3 text-[#1c2740]"
              }
            >
              <p className={message.mine ? "text-xs font-medium text-white/80" : "text-xs font-medium text-[#3d34b8]"}>
                {message.mine ? you : party}
                <span className={message.mine ? "ml-2 font-normal text-white/70" : "ml-2 font-normal text-[#667085]"}>
                  {messageKindLabel(message.kind)}
                </span>
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <ChatComposer
        key={messages.length}
        action={action}
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

function ChatComposer({
  action,
  hidden,
  placeholder,
  submitLabel,
  pendingLabel,
  savedLabel,
  invalidFallback,
}: {
  action: (state: MessageActionState, formData: FormData) => Promise<MessageActionState>;
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
  const names = files.map((file) => `Adjunto: ${file.name}`);
  const body = [text.trim(), ...names].filter((line) => line.length > 0).join("\n");

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
      <div className="flex items-end gap-2 rounded-2xl border border-[#e6e9f0] bg-[#f7f8fb] p-2">
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
          onChange={(event) => {
            setText(event.target.value);
            setHideError(true);
          }}
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={pending || body.length === 0}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#3d34b8] text-white disabled:opacity-60"
        >
          <Send className="size-4" aria-hidden />
          <span className="sr-only">{pending ? pendingLabel : submitLabel}</span>
        </button>
      </div>
      {state?.ok === true ? <p className="text-sm text-[#157a45]">{savedLabel}</p> : null}
      {state && !state.ok && !hideError ? (
        <p className="text-sm text-red-700" role="alert">
          {state.message || invalidFallback}
        </p>
      ) : null}
    </form>
  );
}
