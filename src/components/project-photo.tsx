import Image from "next/image";
import { Building2 } from "lucide-react";
import { projectImageSrc } from "@/lib/project-image";

export function ProjectPhoto({
  slug,
  alt,
  frameClassName = "relative aspect-[16/9] bg-[radial-gradient(120%_90%_at_0%_0%,#ffffff_0%,#d5e0ff_32%,#7f97e4_68%,#2c3f86_100%)]",
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
        <div className="flex h-full items-center justify-center">
          <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-white/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <Building2 className="size-8" aria-hidden />
          </span>
        </div>
      )}
    </div>
  );
}
