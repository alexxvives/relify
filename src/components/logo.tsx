type LogoTone = "ink" | "paper";
type LogoSize = "md" | "lg";

export function Logo({ tone = "ink", size = "md" }: { tone?: LogoTone; size?: LogoSize }) {
  const onPaper = tone === "paper";
  const mark = size === "lg" ? "size-10" : "size-8";
  const word = size === "lg" ? "text-[1.85rem]" : "text-[1.35rem]";
  const tile = onPaper ? "#f4f8f8" : "#12343a";
  const letter = onPaper ? "#12343a" : "#f4f8f8";
  const accent = onPaper ? "#0f6e73" : "#7ed0cb";

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className={mark} aria-hidden="true">
        <rect width="32" height="32" rx="9" fill={tile} />
        <path
          fill={letter}
          d="M8.8 7.2h7.2c3.8 0 6.15 2.15 6.15 5.2 0 2.25-1.25 4-3.3 4.75L23.4 24.8h-3.6l-4.2-7.05H12v7.05H8.8V7.2Zm3.2 2.6v5.1h3.8c1.82 0 2.92-.92 2.92-2.55s-1.1-2.55-2.92-2.55h-3.8Z"
        />
        <circle cx="24.2" cy="8.2" r="2.15" fill={accent} />
      </svg>
      <span className={`releva-word leading-none ${onPaper ? "text-public-paper" : "text-public-ink"} ${word}`}>Releva</span>
    </span>
  );
}
