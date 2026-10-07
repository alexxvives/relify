import Image from "next/image";
import { Building2 } from "lucide-react";
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

export function ProjectPhoto({
  slug,
  alt,
  frameClassName = projectPhotoFrame,
}: {
  slug: string;
  alt: string;
  frameClassName?: string;
}) {
  const src = projectImageSrc(slug);

  return (
    <div className={frameClassName}>
      {src ? (
        <Image src={src} alt={alt} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
      ) : (
        <ProjectPhotoMark />
      )}
    </div>
  );
}
