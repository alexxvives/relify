import { ebitdaAdjustmentLabels, type EbitdaAdjustment } from "./ebitda-adjustments";
import { renderEmail } from "./email/layout";
import { formatEur } from "./money";
import { madridTime, SABI_NOTIFY_TO } from "./sabi-request-email";

export type EbitdaAdjustmentEmailInput = {
  companyName: string;
  projectId: string;
  adjustmentAmountCents: number;
  rows: EbitdaAdjustment[];
  adminUrl: string;
  at?: Date;
};

function conceptLine(row: EbitdaAdjustment): string {
  const amount = `${row.amountCents > 0 ? "+" : ""}${formatEur(row.amountCents)}`;
  const reason = row.reason && row.reason.trim().length > 0 ? ` — ${row.reason.trim()}` : "";
  return `${ebitdaAdjustmentLabels[row.type]}: ${amount}${reason}`;
}

/** Internal heads-up to info@ when a seller submits EBITDA adjustments. No owner email or other PII. */
export function ebitdaAdjustmentEmail(input: EbitdaAdjustmentEmailInput): { to: string; subject: string; text: string; html: string } {
  const name = input.companyName.trim() || "Empresa sin razón social";
  const pending = input.rows.filter((row) => row.status === "pending");
  const listed = pending.length > 0 ? pending : input.rows;
  const subject = `Ajuste de EBITDA: ${name}`;
  const concepts = listed.map(conceptLine);
  const rendered = renderEmail(subject, {
    preheader: `${name} ha enviado un ajuste de EBITDA para revisar.`,
    eyebrow: "EBITDA",
    title: "Un vendedor ha enviado un ajuste de EBITDA",
    paragraphs: [
      "Revisa los conceptos y el importe en admin. Hasta que aceptes, el comprador sigue viendo el EBITDA de las cuentas.",
      ...concepts,
    ],
    rows: [
      { label: "Empresa", value: name },
      { label: "Proyecto", value: input.projectId },
      { label: "Importe de los ajustes", value: `${input.adjustmentAmountCents > 0 ? "+" : ""}${formatEur(input.adjustmentAmountCents)}` },
      { label: "Enviado", value: madridTime(input.at ?? new Date()) },
    ],
    cta: { label: "Revisar el ajuste en admin", url: input.adminUrl },
    reason: "Aviso interno de Relify para el equipo.",
  });
  return { to: SABI_NOTIFY_TO, ...rendered };
}

export function pendingAdjustmentFingerprint(rows: EbitdaAdjustment[]): string {
  return JSON.stringify(
    rows
      .filter((row) => row.status === "pending")
      .map((row) => ({ id: row.id, type: row.type, amountCents: row.amountCents, reason: row.reason ?? "" }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  );
}

/** Fire the team mail once per new or changed pending submission, not on a no-op save. */
export function shouldNotifyEbitdaAdjustment(previous: EbitdaAdjustment[] | null, next: EbitdaAdjustment[]): boolean {
  const after = pendingAdjustmentFingerprint(next);
  if (after === "[]") {
    return false;
  }
  return after !== pendingAdjustmentFingerprint(previous ?? []);
}
