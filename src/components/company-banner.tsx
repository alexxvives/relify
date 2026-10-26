import type { ReactNode } from "react";
import { MapPin } from "lucide-react";

export function CompanyBanner({
  title,
  subtitle,
  status,
  progress,
  children,
  besideTitle,
  heading = "h1",
  image = null,
}: {
  title: string;
  subtitle?: string;
  status?: { label: string; live: boolean };
  progress?: ReactNode;
  children?: ReactNode;
  besideTitle?: ReactNode;
  heading?: "h1" | "p";
  /** Company or sector photo shown behind the banner; `ai` adds the AI-image label. */
  image?: { src: string; ai: boolean } | null;
}) {
  const Title = heading;

  return (
    <header
      className="relative overflow-hidden rounded-[1.75rem] px-6 py-[4.625rem] text-white sm:px-8 sm:py-[5.125rem]"
      style={
        image
          ? { background: "#05070f" }
          : {
              background:
                "radial-gradient(140% 120% at -8% -20%, #ffffff 0%, #d5e0ff 16%, rgba(70, 90, 180, 0.55) 42%, #05070f 72%)",
            }
      }
    >
      {image ? (
        <>
          {/* Covers can come from the app's upload route, which next/image cannot optimise. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070f]/55 via-[#05070f]/65 to-[#05070f]/90" aria-hidden />
        </>
      ) : null}
      <div
        className="pointer-events-none absolute -inset-4 opacity-20"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
      {children ? <div className="absolute top-6 right-6 z-10 flex items-center gap-2">{children}</div> : null}
      <div className="relative z-10 mx-auto max-w-3xl pt-2 text-center">
        <div className={besideTitle ? "flex flex-wrap items-center justify-center gap-x-4 gap-y-3" : undefined}>
          <Title className="releva-page-title text-6xl leading-[0.96] text-white sm:text-7xl">
            {title}
          </Title>
          {besideTitle ? <div className="max-w-sm text-left">{besideTitle}</div> : null}
        </div>
        {subtitle || status ? (
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[#e7ecff]">
          {subtitle ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {subtitle}
          </span>
          ) : null}
          {status ? (
            <span className="inline-flex items-center gap-2">
              <span className="relative inline-flex size-2.5" aria-hidden>
                <span
                  className={
                    status.live
                      ? "releva-live-dot absolute inset-0 rounded-full bg-[#5dffa8]"
                      : "releva-live-dot absolute inset-0 rounded-full bg-[#ffd27a]"
                  }
                />
                <span
                  className={
                    status.live
                      ? "relative inline-flex size-2.5 rounded-full bg-[#5dffa8]"
                      : "relative inline-flex size-2.5 rounded-full bg-[#ffd27a]"
                  }
                />
              </span>
              {status.label}
            </span>
          ) : null}
        </p>
        ) : null}
      </div>
      {progress ? <div className="relative z-10 mt-16 sm:mt-20">{progress}</div> : null}
    </header>
  );
}
