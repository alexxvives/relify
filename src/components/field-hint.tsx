import { InfoHint } from "@/components/ui/info-hint";

/** Form-field help icon; a thin preset of the shared InfoHint. */
export function FieldHint({
  text,
  align = "start",
  tone = "ink",
  wide = false,
}: {
  text: string;
  align?: "start" | "center" | "end";
  tone?: "ink" | "light";
  wide?: boolean;
}) {
  return <InfoHint text={text} align={align} tone={tone} width={wide ? "lg" : "md"} />;
}
