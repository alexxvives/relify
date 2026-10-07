import { User } from "lucide-react";

const tones = ["a", "b", "c", "d"] as const;

export function BuyerMark({ tone }: { tone: number }) {
  const name = tones[tone % tones.length] ?? "a";

  return (
    <span className={`releva-user releva-user-${name}`}>
      <User className="releva-user-glyph" strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}
