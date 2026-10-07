import Image from "next/image";
import { Building2 } from "lucide-react";
import { projectImageSrc } from "@/lib/project-image";

export function ProjectPhoto({
  slug,
  alt,
  frameClassName = "relative aspect-[16/9] bg-gradient-to-br from-[#d9e2fb] via-[#eef2ff] to-[#f6f1e8]",
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
        <div className="flex h-full items-center justify-center text-[#465ab4]">
          <Building2 className="size-10" aria-hidden />
        </div>
      )}
    </div>
  );
}
