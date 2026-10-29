export const SABI_NOTIFY_TO = "info@itsrelify.com";

export type SabiRequestEmailInput = {
  companyName: string;
  cif: string;
  ownerName: string;
  ownerEmail: string;
  adminUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Internal heads-up: a seller entered a CIF, so the team has to load SABI within 24 h. */
export function sabiRequestEmail(input: SabiRequestEmailInput): { to: string; subject: string; text: string; html: string } {
  const name = input.companyName.trim() || "Empresa sin razón social";
  const rows: [string, string][] = [
    ["Empresa", name],
    ["CIF", input.cif],
    ["Titular", input.ownerName.trim() || "—"],
    ["Email", input.ownerEmail],
  ];
  const text = [
    "Una empresa ha introducido su CIF en Relify. Hay que cargar su SABI en las próximas 24 h.",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Ficha en admin: ${input.adminUrl}`,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;color:#1c2740;max-width:560px">
<h2 style="margin:0 0 8px;font-size:18px">Nuevo CIF pendiente de SABI</h2>
<p style="margin:0 0 16px;font-size:14px;color:#3d4a63">Una empresa ha introducido su CIF en Relify. Hay que cargar su SABI en las próximas 24 h.</p>
<table style="border-collapse:collapse;font-size:14px">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#5c6b78">${label}</td><td style="padding:4px 0;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join("")}</table>
<p style="margin:20px 0 0"><a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600;font-size:14px">Abrir ficha en admin</a></p>
</div>`;

  return { to: SABI_NOTIFY_TO, subject: `SABI pendiente: ${name} (${input.cif})`, text, html };
}
