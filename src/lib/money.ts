const euroFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function formatEur(cents: number): string {
  return euroFormatter.format(cents / 100);
}
