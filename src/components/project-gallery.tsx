"use client";

import { EyeOff, ImagePlus, Images, ShieldAlert, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { addProjectPhotosAction, deleteProjectPhotoAction } from "@/app/(app)/mi-empresa/actions";
import { setProjectPhotoHiddenAction } from "@/app/(app)/admin/empresas/[slug]/sabi-actions";
import { companyCopy } from "@/lib/company-copy";

export type GalleryPhoto = { id: string; hidden: boolean };
const galleryLimit = 6;
const maxEdge = 1600;

function photoSrc(id: string): string {
  return `/fotos/${id}`;
}

/** Shrinks a photo in the browser (max 1600 px, JPEG) so uploads stay small; also drops EXIF metadata such as GPS. */
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("encode");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

/** t84: read-only gallery for the report (buyer ficha, seller preview, admin with hide/show). */
export function PhotoGallery({ photos, moderate = false }: { photos: GalleryPhoto[]; moderate?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {photos.map((photo) => (
        <figure key={photo.id} className="relative overflow-hidden rounded-xl border border-[#e7eaee] bg-[#f7f8fb]">
          <a href={photoSrc(photo.id)} target="_blank" rel="noreferrer" className="block aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrc(photo.id)} alt="Foto del negocio" loading="lazy" className={`size-full object-cover ${photo.hidden ? "opacity-40 grayscale" : ""}`} />
          </a>
          {photo.hidden ? (
            <span className="absolute top-2 left-2 rounded-full bg-[#1c2740]/85 px-2 py-0.5 text-[11px] font-semibold text-white">{companyCopy.galleryHiddenByAdmin}</span>
          ) : null}
          {moderate ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await setProjectPhotoHiddenAction(photo.id, !photo.hidden);
                  router.refresh();
                })
              }
              className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-[#1c2740] shadow hover:bg-white focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none disabled:opacity-60"
            >
              {photo.hidden ? <Eye className="size-3.5" aria-hidden /> : <EyeOff className="size-3.5" aria-hidden />}
              {photo.hidden ? "Mostrar" : "Ocultar"}
            </button>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

/** t84: seller editor in Ficha pública: multi-upload, delete, identification warning. */
export function GalleryEditor({ photos }: { photos: GalleryPhoto[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const room = galleryLimit - photos.length;

  function upload(list: FileList | null) {
    const files = Array.from(list ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;
    if (files.length > room) {
      setMessage(companyCopy.galleryLimit);
      return;
    }
    start(async () => {
      try {
        // One request per photo keeps each server-action body well under the size limit.
        let failure: string | null = null;
        for (const file of files) {
          const body = new FormData();
          body.append("photos", await shrink(file));
          const result = await addProjectPhotosAction(body);
          if (!result.ok) {
            failure = result.message;
            break;
          }
        }
        setMessage(failure);
        router.refresh();
      } catch {
        setMessage(companyCopy.cardPhotosType);
      }
    });
  }

  return (
    <section id="ficha-fotos" className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#e6e9f0] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Images className="size-5 text-[#0f766e]" aria-hidden />
          <h3 className="text-base font-semibold text-[#1c2740]">{companyCopy.galleryTitle}</h3>
          <span className="text-xs text-[#5c6b78] tabular-nums">
            {photos.length} / {galleryLimit}
          </span>
        </div>
        <button
          type="button"
          disabled={pending || room <= 0}
          onClick={() => input.current?.click()}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#d5dbe3] bg-white px-3 text-sm font-medium text-[#0f766e] hover:bg-[#e6f4f2] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none disabled:opacity-50"
        >
          <ImagePlus className="size-4" aria-hidden />
          {pending ? "Subiendo…" : companyCopy.galleryAdd}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            upload(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
      </div>
      <p className="text-sm text-[#5c6b78]">{companyCopy.galleryHint}</p>
      <p className="flex items-start gap-2 rounded-xl bg-[#fff7e8] p-3 text-sm leading-5 text-[#7a4b00]">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        {companyCopy.galleryWarning}
      </p>
      {message ? (
        <p role="alert" className="text-sm text-[#a12f2f]">
          {message}
        </p>
      ) : null}
      {photos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#d6dbe3] bg-[#fbfbfc] p-4 text-center text-sm text-[#8b95a7]">{companyCopy.galleryEmpty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {photos.map((photo) => (
            <figure key={photo.id} className="relative overflow-hidden rounded-xl border border-[#e7eaee] bg-[#f7f8fb]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoSrc(photo.id)} alt="Foto del negocio" loading="lazy" className={`aspect-[4/3] w-full object-cover ${photo.hidden ? "opacity-40 grayscale" : ""}`} />
              {photo.hidden ? (
                <span className="absolute top-2 left-2 rounded-full bg-[#1c2740]/85 px-2 py-0.5 text-[11px] font-semibold text-white">{companyCopy.galleryHiddenByAdmin}</span>
              ) : null}
              <button
                type="button"
                aria-label={companyCopy.galleryDelete}
                title={companyCopy.galleryDelete}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await deleteProjectPhotoAction(photo.id);
                    router.refresh();
                  })
                }
                className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-white/95 text-[#a12f2f] shadow hover:bg-white focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none disabled:opacity-60"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
