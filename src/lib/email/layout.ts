/**
 * t73b: the one shared Relify email layout. Table-based, inline styles, max 600 px wide and fluid
 * below that, so it renders in Gmail, Outlook and phones. Every caller gets an HTML and a matching
 * plain-text body from the same content, so the two never drift apart.
 */

export type EmailRow = { label: string; value: string };

export type EmailContent = {
  /** Hidden inbox preview line. */
  preheader: string;
  /** Small pill above the title, e.g. "Cuenta" or "Tu empresa". */
  eyebrow?: string;
  title: string;
  /** Plain paragraphs; never HTML. */
  paragraphs: string[];
  rows?: EmailRow[];
  cta?: { label: string; url: string };
  /** Small grey line under the button (e.g. expiry or "si no fuiste tú"). */
  note?: string;
  /** Footer line explaining why the person gets this email. */
  reason: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

const navy = "#1c2740";
const teal = "#0f766e";
const tealBright = "#2fc4b2";
const ink = "#3d4a63";
const muted = "#8b95a7";
const font =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Only absolute http(s) links reach a template, so a stray value can never become javascript: etc. */
function safeUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("email_unsafe_url");
  }
  return parsed.toString();
}

export function renderEmail(
  subject: string,
  content: EmailContent,
): RenderedEmail {
  const cta = content.cta
    ? { label: content.cta.label, url: safeUrl(content.cta.url) }
    : null;
  const rows = content.rows ?? [];

  const text = [
    content.title,
    "",
    ...content.paragraphs.flatMap((paragraph) => [paragraph, ""]),
    ...(rows.length
      ? [...rows.map((row) => `${row.label}: ${row.value}`), ""]
      : []),
    ...(cta ? [`${cta.label}: ${cta.url}`, ""] : []),
    ...(content.note ? [content.note, ""] : []),
    "—",
    "Relify · Compraventa de empresas",
    content.reason,
  ].join("\n");

  const paragraphs = content.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${ink}">${escapeHtml(paragraph)}</p>`,
    )
    .join("");
  const table = rows.length
    ? `<tr><td class="px" style="padding:4px 36px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e1e6ee;border-radius:12px;border-collapse:separate;font-size:14px;color:${navy}">${rows
        .map(
          (row, index) =>
            `<tr><td style="padding:11px 16px;width:120px;color:#5c6b78;vertical-align:top;${index ? "border-top:1px solid #eef1f5;" : ""}">${escapeHtml(row.label)}</td><td style="padding:11px 16px;font-weight:600;word-break:break-word;${index ? "border-top:1px solid #eef1f5;" : ""}">${escapeHtml(row.value)}</td></tr>`,
        )
        .join("")}</table></td></tr>`
    : "";
  const button = cta
    ? `<tr><td class="px" style="padding:18px 36px 6px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:${teal}"><a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:14px 26px;border-radius:999px;font-family:${font};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">${escapeHtml(cta.label)}</a></td></tr></table></td></tr>
<tr><td class="px" style="padding:10px 36px 0;font-size:12px;line-height:1.5;color:${muted}">Si el botón no funciona, copia este enlace en el navegador:<br><a href="${escapeHtml(cta.url)}" style="color:${teal};word-break:break-all">${escapeHtml(cta.url)}</a></td></tr>`
    : "";
  const note = content.note
    ? `<tr><td class="px" style="padding:16px 36px 0;font-size:13px;line-height:1.55;color:#5c6b78">${escapeHtml(content.note)}</td></tr>`
    : "";
  const logo = cta
    ? `<img src="${escapeHtml(new URL("/brand/email-logo-white.png", cta.url).toString())}" width="88" height="32" alt="Relify" style="display:block;border:0;outline:none;height:32px;width:88px;font-size:22px;font-weight:800;color:#ffffff;font-family:${font}">`
    : `<span style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#ffffff">Relify</span><span style="display:inline-block;width:8px;height:8px;margin-left:3px;border-radius:999px;background:${tealBright}"></span>`;
  const eyebrow = content.eyebrow
    ? `<span style="display:inline-block;margin-bottom:12px;padding:4px 12px;border-radius:999px;background:#e6f4f2;color:${teal};font-size:12px;font-weight:700;letter-spacing:0.2px">${escapeHtml(content.eyebrow)}</span><br>`
    : "";

  const html = `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only"><title>${escapeHtml(subject)}</title>
<style>@media (max-width:620px){.px{padding-left:22px!important;padding-right:22px!important}.title{font-size:22px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#eef2f5;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f5">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f5;font-family:${font}">
<tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e1e6ee">
<tr><td class="px" style="background:${navy};padding:24px 36px">
${logo}
</td></tr>
<tr><td style="height:4px;background:${teal};line-height:4px;font-size:0">&nbsp;</td></tr>
<tr><td class="px" style="padding:32px 36px 6px">${eyebrow}<h1 class="title" style="margin:0 0 14px;font-size:24px;line-height:1.3;font-weight:700;color:${navy}">${escapeHtml(content.title)}</h1>${paragraphs}</td></tr>
${table}
${button}
${note}
<tr><td style="height:30px;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td class="px" style="background:#f7f8fb;border-top:1px solid #eef1f5;padding:18px 36px;font-size:12px;line-height:1.6;color:${muted}">
<strong style="color:#5c6b78">Relify</strong> · Compraventa de empresas · <a href="https://itsrelify.com" style="color:${muted}">itsrelify.com</a><br>${escapeHtml(content.reason)}
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { subject, html, text };
}

