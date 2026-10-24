import Image from "next/image";
import { BadgeCheck, Building2, MapPin, Sparkles } from "lucide-react";
import { projectImageSrc } from "@/lib/project-image";
import { aiImageLabel, sectorImageSrc, type SectorImageKey } from "@/lib/sector-image";

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

export function AiImageTag() {
  return (
    <span className="pointer-events-none absolute right-3 bottom-3 z-[2] inline-flex items-center gap-1 rounded-full bg-[#0c1224]/70 px-2 py-0.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
      <Sparkles className="size-3.5" aria-hidden />
      {aiImageLabel}
    </span>
  );
}

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#e7f6ee] px-2 py-0.5 text-xs font-semibold text-[#1b7a45] ring-1 ring-[#1b7a45]/20 ${className}`}
    >
      <BadgeCheck className="size-3.5" aria-hidden />
      Verificado
    </span>
  );
}

export function ProjectPhoto({
  slug,
  alt,
  frameClassName = projectPhotoFrame,
  title,
  place,
  src,
  sectorKey,
  verified = false,
}: {
  slug: string;
  alt: string;
  frameClassName?: string;
  title?: string;
  place?: string;
  src?: string | null;
  sectorKey?: SectorImageKey;
  verified?: boolean;
}) {
  const own = src && src.length > 0 ? src : projectImageSrc(slug);
  const generated = !own && sectorKey !== undefined;
  const image = own ?? (sectorKey ? sectorImageSrc(sectorKey) : null);
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
      {verified ? <VerifiedBadge className="absolute bottom-3 left-3 z-[2]" /> : null}
      {generated ? <AiImageTag /> : null}
    </div>
  );
}
