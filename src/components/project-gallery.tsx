"use client";

import { ChevronLeft, ChevronRight, Eye, EyeOff, ImagePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { addProjectPhotosAction, deleteProjectPhotoAction } from "@/app/(app)/mi-empresa/actions";
import { setProjectPhotoHiddenAction } from "@/app/(app)/admin/empresas/[slug]/sabi-actions";
import { FieldHint } from "@/components/field-hint";
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

/** t85: full-screen viewer shared by the seller editor and the buyer ficha: large photo, prev/next, close, Esc and arrow keys. */
export function PhotoLightbox({ photos, index, onIndex, onClose }: { photos: GalleryPhoto[]; index: number; onIndex: (index: number) => void; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = photos.length;
  const step = useCallback((delta: number) => onIndex((index + delta + count) % count), [count, index, onIndex]);
  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, step]);
  const photo = photos[index];
  if (!photo) return null;
  const navButton =
    "absolute top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1c2740] shadow hover:bg-white focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none";
  return (
    <div role="dialog" aria-modal="true" aria-label={`Foto ${index + 1} de ${count}`} className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1220]/85 p-4" onClick={onClose}>
      {/* t89: any click outside the photo and its controls (backdrop or empty space around it) closes the viewer. */}
      <div className="relative flex max-h-full w-full max-w-5xl items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoSrc(photo.id)} alt={`Foto del negocio ${index + 1}`} onClick={(event) => event.stopPropagation()} className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" />
        {count > 1 ? (
          <>
            <button type="button" aria-label="Foto anterior" onClick={(event) => { event.stopPropagation(); step(-1); }} className={`${navButton} left-2`}>
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button type="button" aria-label="Foto siguiente" onClick={(event) => { event.stopPropagation(); step(1); }} className={`${navButton} right-2`}>
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        ) : null}
        <span onClick={(event) => event.stopPropagation()} className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1c2740]/85 px-2.5 py-0.5 text-xs font-medium text-white tabular-nums">
          {index + 1} / {count}
        </span>
      </div>
      <button
        ref={closeRef}
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-full bg-white/90 text-[#1c2740] shadow hover:bg-white focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none"
      >
        <X className="size-5" aria-hidden />
      </button>
    </div>
  );
}

function Thumb({ photo, index, size, onOpen }: { photo: GalleryPhoto; index: number; size: string; onOpen: (index: number) => void }) {
  return (
    <button
      type="button"
      aria-label={`Ver foto ${index + 1} en grande`}
      onClick={() => onOpen(index)}
      className={`${size} block overflow-hidden rounded-lg border border-[#e7eaee] bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoSrc(photo.id)} alt="" loading="lazy" className={`size-full object-cover transition hover:scale-105 ${photo.hidden ? "opacity-40 grayscale" : ""}`} />
    </button>
  );
}

/** t85/t86: small gallery grid for the report (buyer ficha, seller preview, admin with hide/show); click opens the lightbox. */
export function PhotoGallery({ photos, moderate = false }: { photos: GalleryPhoto[]; moderate?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {photos.map((photo, index) => (
          <li key={photo.id} className="relative flex flex-col items-center gap-1">
            <Thumb photo={photo} index={index} size="aspect-square w-[min(100%,10rem)]" onOpen={setOpen} />
            {photo.hidden ? <span className="absolute top-1 left-1 rounded-full bg-[#1c2740]/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">{companyCopy.galleryHiddenByAdmin}</span> : null}
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
                className="inline-flex items-center gap-1 rounded-full border border-[#d5dbe3] bg-white px-2 py-0.5 text-[11px] font-medium text-[#1c2740] hover:bg-[#f4f7ff] disabled:opacity-60"
              >
                {photo.hidden ? <Eye className="size-3" aria-hidden /> : <EyeOff className="size-3" aria-hidden />}
                {photo.hidden ? "Mostrar" : "Ocultar"}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {open !== null ? <PhotoLightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

/**
 * t86: the single seller uploader ("Subir fotos") in Datos de la ficha. Photos are stored as project photos (max 6);
 * the first visible one is the marketplace card cover and all visible ones show in the ficha's Fotos section.
 * Clicking a thumbnail opens the lightbox.
 */
export function CardPhotoUploader({ photos, recommended, onCount }: { photos: GalleryPhoto[]; recommended: boolean; onCount?: (count: number) => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const room = galleryLimit - photos.length;

  function upload(list: FileList | null) {
    const files = Array.from(list ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      if ((list?.length ?? 0) > 0) setMessage(companyCopy.cardPhotosType);
      return;
    }
    if (files.length > room) {
      setMessage(companyCopy.cardPhotosLimit);
      return;
    }
    start(async () => {
      try {
        // One request per photo keeps each server-action body well under the size limit.
        let failure: string | null = null;
        let added = 0;
        for (const file of files) {
          const body = new FormData();
          body.append("photos", await shrink(file));
          const result = await addProjectPhotosAction(body);
          if (!result.ok) {
            failure = result.message;
            break;
          }
          added += 1;
        }
        setMessage(failure);
        onCount?.(photos.length + added);
        router.refresh();
      } catch {
        setMessage(companyCopy.cardPhotosType);
      }
    });
  }

  return (
    <div id="fotos" className="flex scroll-mt-24 flex-col gap-2">
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-[#2b3b4a]">
        <span className="whitespace-nowrap">{companyCopy.cardPhotos}</span>
        <span className="text-xs font-normal whitespace-nowrap text-[#5c6b78] tabular-nums">
          {photos.length} / {galleryLimit}
        </span>
        <FieldHint text={companyCopy.cardPhotosHint} />
        {recommended && photos.length === 0 ? (
          <span className="rounded-full bg-[#fff4d6] px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-[#8a6112]">{companyCopy.cardPhotosRecommended}</span>
        ) : null}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending || room <= 0}
          onClick={() => input.current?.click()}
          className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-[#e7eaee] bg-white px-3 text-sm font-medium text-[#2b3b4a] hover:bg-[#f7f8fb] focus-visible:ring-2 focus-visible:ring-[#2fc4b2] focus-visible:outline-none disabled:opacity-50 sm:flex-none"
        >
          <ImagePlus className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{pending ? "Subiendo…" : companyCopy.cardPhotos}</span>
        </button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label={companyCopy.cardPhotos}
          onChange={(event) => {
            upload(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        {photos.length > 0 ? (
          <ul className="flex flex-wrap items-center gap-2" aria-label="Fotos subidas">
            {photos.map((photo, index) => (
              <li key={photo.id} className="relative">
                <Thumb photo={photo} index={index} size="size-11" onOpen={setOpen} />
                {index === 0 ? (
                  <span className="pointer-events-none absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-[#1c2740] px-1.5 text-[9px] leading-4 font-semibold text-white">Portada</span>
                ) : null}
                <button
                  type="button"
                  aria-label={`${companyCopy.cardPhotosRemove} ${index + 1}`}
                  title={companyCopy.cardPhotosRemove}
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await deleteProjectPhotoAction(photo.id);
                      onCount?.(photos.length - 1);
                      router.refresh();
                    })
                  }
                  className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-[#c0362c] text-white shadow-sm hover:bg-[#a12f2f] disabled:opacity-60"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {message ? (
        <p role="alert" className="text-sm text-[#a12f2f]">
          {message}
        </p>
      ) : null}
      {open !== null ? <PhotoLightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}
