export const accessCopy = {
  requestHeading: "Solicitar acceso",
  requestBody: "Pide acceso a este proyecto. La ficha que ya ves no cambia.",
  requestAction: "Solicitar acceso",
  connect: "Conectar",
  pending: "Solicitud enviada",
  connected: "Conectado",
  ndaHeading: "Acuerdo de confidencialidad",
  ndaBody:
    "Aceptas no revelar la información de este proyecto. Esta aceptación no muestra la razón social, el CIF, la dirección ni los archivos, y no abre un data room.",
  acceptAction: "Firmar acuerdo",
  signOnProcesses: "El acuerdo se firma en Mis procesos.",
  loiHeading: "Carta de intenciones",
  loiSigned: "Carta firmada",
  signLoi: "Firmar carta",
  connectYes: "Sí, conectar",
  connectCancel: "Cancelar",
  accepted: "NDA aceptado",
  acceptedBody: "El acuerdo queda registrado. La ficha sigue igual.",
  forbidden: "Solo un inversor puede solicitar acceso.",
  missing: "Ese proyecto no está publicado.",
  ndaRequired: "Primero tienes que solicitar acceso.",
  planRequired: "Elige un plan para conectar con empresas.",
  matchLimit: "Has usado los 3 matches de este mes.",
  waitingForSeller: "Solicitud enviada.",
  cancelProcess: "Cancelar proceso",
  cancelTitle: "¿Seguro que quieres cancelar este proceso?",
  cancelBody: "Se cierra para las dos partes. Puedes volver a conectar más adelante.",
  cancelYes: "Sí, cancelar",
  cancelNo: "No, seguir",
  cancelFailed: "No se ha podido cancelar el proceso.",
} as const;

export function connectConfirm(left: number): string {
  return left === 1 ? "¿Seguro? Te queda 1 este mes." : `¿Seguro? Te quedan ${left} este mes.`;
}
