/** t67: browser events between the SABI panel and the admin-wide job indicator. */
export const sabiJobStartedEvent = "releva:sabi-job-started";
export const sabiJobUpdateEvent = "releva:sabi-job-update";

export type SabiJobStatus = "running" | "done" | "failed";

export type SabiJobUpdate = { id: string; status: SabiJobStatus; stage: string; message: string | null };

export const sabiJobStageLabels: Record<string, string> = {
  queued: "En cola",
  read: "Leyendo archivo",
  general: "Datos generales",
  balance: "Balance",
  results: "Cuenta de resultados",
  ratios: "Ratios",
  directors: "Administradores",
  shareholders: "Accionistas",
  saving: "Guardando…",
  done: "Completado",
};

export function sabiJobStageLabel(stage: string): string {
  return sabiJobStageLabels[stage] ?? stage;
}
