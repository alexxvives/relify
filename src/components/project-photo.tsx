import Image from "next/image";
import { Building2, MapPin } from "lucide-react";
import { projectImageSrc } from "@/lib/project-image";

export const projectPhotoFrame =
  "relative aspect-[16/9] bg-[radial-gradient(120%_100%_at_15%_0%,#3a4d86_0%,#1c2a52_46%,#0c1224_100%)]";

export function ProjectPhotoMark() {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-white/10 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
        <Building2 className="size-8" aria-hidden />
      </span>
    </div>
  );
}

export function PhotoScrim({ title, place }: { title: string; place: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] bg-gradient-to-b from-[#0c1224]/80 via-[#0c1224]/40 to-transparent px-14 pt-4 pb-16 text-center">
      <p className="text-base font-semibold tracking-tight text-white drop-shadow-sm">{title}</p>
      <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-white/90">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        {place}
      </p>
    </div>
  );
}

export function ProjectPhoto({
  slug,
  alt,
  frameClassName = projectPhotoFrame,
  title,
  place,
  src,
}: {
  slug: string;
  alt: string;
  frameClassName?: string;
  title?: string;
  place?: string;
  src?: string | null;
}) {
  const image = src && src.length > 0 ? src : projectImageSrc(slug);
  const uploaded = image?.includes("/portadas/") === true;

  return (
    <div className={frameClassName}>
      {uploaded && image ? (
        // The cover is served by the app route, not a static file next/image can import.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={alt} className="absolute inset-0 size-full object-cover" />
      ) : image ? (
        <Image src={image} alt={alt} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
      ) : (
        <ProjectPhotoMark />
      )}
      {title && place ? <PhotoScrim title={title} place={place} /> : null}
    </div>
  );
}
