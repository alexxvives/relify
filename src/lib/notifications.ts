export const notificationCopy = {
  open: "Abrir avisos",
  close: "Cerrar avisos",
  title: "Avisos",
  empty: "No tienes avisos.",
} as const;

export type NotificationView = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  unread: boolean;
};

export function accessRequestedNotice(codename: string): { title: string; body: string } {
  return {
    title: "Solicitud enviada",
    body: `Has pedido acceso a ${codename}.`,
  };
}

export function incomingAccessNotice(codename: string): { title: string; body: string } {
  return {
    title: "Nuevo interés",
    body: `Un inversor ha solicitado acceso a ${codename}.`,
  };
}

export function ndaAcceptedNotice(codename: string): { title: string; body: string } {
  return {
    title: "NDA aceptado",
    body: `Has aceptado el NDA de ${codename}.`,
  };
}

export function incomingNdaNotice(codename: string): { title: string; body: string } {
  return {
    title: "NDA aceptado",
    body: `Un inversor ha aceptado el NDA de ${codename}.`,
  };
}
