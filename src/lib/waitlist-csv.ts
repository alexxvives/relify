export type WaitlistCsvRow = { name: string; email: string; roleLabel: string; city: string; createdAt: string };

function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function waitlistCsv(rows: WaitlistCsvRow[], formatDate: (iso: string) => string): string {
  const header = ["Nombre", "Correo", "Perfil", "Ciudad", "Fecha"].map(cell).join(";");
  const lines = rows.map((row) => [row.name, row.email, row.roleLabel, row.city, formatDate(row.createdAt)].map(cell).join(";"));
  return `\uFEFF${[header, ...lines].join("\r\n")}\r\n`;
}
