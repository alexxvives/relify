const phrases = [
  "EBITDA ajustado",
  "nombre de proyecto",
  "razón social",
  "comunidad autónoma",
  "facturación",
  "EBITDA",
  "dataroom",
  "precio",
  "NDA",
  "CIF",
] as const;

const pattern = new RegExp(
  `\\b(${phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi",
);

export function BlogProse({ text }: { text: string }) {
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        const marked = phrases.some((phrase) => phrase.toLocaleLowerCase("es") === part.toLocaleLowerCase("es"));

        if (!marked) {
          return <span key={`${index}-${part.slice(0, 12)}`}>{part}</span>;
        }

        return (
          <strong key={`${index}-${part}`} className="font-semibold">
            {part}
          </strong>
        );
      })}
    </>
  );
}
