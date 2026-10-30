export const SABI_NOTIFY_TO = "info@itsrelify.com";
/** Sender on the onboarded itsrelify.com domain (Cloudflare Email Sending). */
export const SABI_NOTIFY_FROM = { email: "notificaciones@itsrelify.com", name: "Relify" };

export type SabiRequestEmailInput = {
  companyName: string;
  cif: string;
  ownerName: string;
  ownerEmail: string;
  adminUrl: string;
  /** When the CIF was entered; defaults to now. */
  at?: Date;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function madridTime(at: Date): string {
  return `${at.toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} (hora de Madrid)`;
}

/** Internal heads-up: a seller entered a CIF, so the team has to load SABI within 24 h. */
export function sabiRequestEmail(input: SabiRequestEmailInput): { to: string; subject: string; text: string; html: string } {
  const name = input.companyName.trim() || "Empresa sin razón social";
  const when = madridTime(input.at ?? new Date());
  const rows: [string, string][] = [
    ["Empresa", name],
    ["CIF", input.cif],
    ["Vendedor", input.ownerName.trim() || "—"],
    ["Email", input.ownerEmail],
    ["Alta", when],
  ];
  const text = [
    "Una empresa ha introducido su CIF en Relify. Hay que cargar su SABI en las próximas 24 h.",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Ficha en admin: ${input.adminUrl}`,
  ].join("\n");
  const url = escapeHtml(input.adminUrl);
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SABI pendiente</title></head>
<body style="margin:0;padding:0;background:#eef2f5;-webkit-text-size-adjust:100%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f5;padding:32px 12px;font-family:Arial,Helvetica,sans-serif">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(28,39,64,0.12)">
<tr><td style="background:#1c2740;padding:22px 28px">
<span style="font-size:22px;font-weight:700;letter-spacing:-0.3px;color:#ffffff">Relify</span>
<span style="display:inline-block;margin-left:10px;padding:3px 10px;border-radius:999px;background:#2fc4b2;color:#0f1b24;font-size:12px;font-weight:700;vertical-align:3px">SABI · 24 h</span>
</td></tr>
<tr><td style="height:4px;background:#0f766e;line-height:4px;font-size:0">&nbsp;</td></tr>
<tr><td style="padding:28px 28px 8px;color:#1c2740">
<h1 style="margin:0 0 8px;font-size:20px;line-height:1.3">Nueva empresa con CIF: carga su SABI</h1>
<p style="margin:0;font-size:14px;line-height:1.6;color:#3d4a63">Un vendedor acaba de dar de alta su empresa con el CIF. Su ficha muestra «datos financieros en 24 h» hasta que cargues el informe.</p>
</td></tr>
<tr><td style="padding:16px 28px 4px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e1e6ee;border-radius:12px;font-size:14px;color:#1c2740">
${rows
  .map(
    ([label, value], index) =>
      `<tr><td style="padding:11px 16px;width:96px;color:#5c6b78;${index ? "border-top:1px solid #eef1f5;" : ""}">${label}</td><td style="padding:11px 16px;font-weight:600;${index ? "border-top:1px solid #eef1f5;" : ""}">${escapeHtml(value)}</td></tr>`,
  )
  .join("\n")}
</table>
</td></tr>
<tr><td align="left" style="padding:24px 28px 8px">
<a href="${url}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:700;font-size:14px">Abrir ficha en admin →</a>
</td></tr>
<tr><td style="padding:4px 28px 26px;font-size:12px;line-height:1.5;color:#8b95a7">Si el botón no funciona: <a href="${url}" style="color:#0f766e;word-break:break-all">${url}</a></td></tr>
<tr><td style="background:#f7f8fb;padding:16px 28px;font-size:12px;color:#8b95a7;border-top:1px solid #eef1f5">Aviso interno de Relify para el equipo. No respondas a este correo.</td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { to: SABI_NOTIFY_TO, subject: `SABI pendiente: ${name} (${input.cif})`, text, html };
}
