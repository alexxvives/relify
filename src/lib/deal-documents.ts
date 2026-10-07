export function spanishDate(now: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(now);
}

export function ndaAgreement(input: {
  buyerName: string;
  codename: string;
  region: string;
  dateLabel: string;
}): string {
  return [
    "ACUERDO DE CONFIDENCIALIDAD",
    "",
    `Fecha: ${input.dateLabel}`,
    "",
    `${input.buyerName}, como comprador en Releva, y el titular del proyecto ${input.codename} (${input.region}) acuerdan:`,
    "",
    `1. El comprador usará la información del proyecto ${input.codename} solo para valorar una posible compra.`,
    "2. No la revelará a terceros, salvo a asesores que acepten esta misma reserva.",
    "3. Este acuerdo no entrega la razón social, el CIF, el domicilio ni los nombres de los archivos.",
    "4. La reserva dura dos años desde esta firma.",
    "5. Firmar en Releva deja constancia de la aceptación. No es una firma electrónica cualificada.",
  ].join("\n");
}

export function loiAgreement(input: {
  buyerName: string;
  codename: string;
  region: string;
  askingPrice: string;
  dateLabel: string;
}): string {
  return [
    "CARTA DE INTENCIONES",
    "",
    `Fecha: ${input.dateLabel}`,
    "",
    `${input.buyerName} manifiesta su intención de comprar el proyecto ${input.codename} (${input.region}).`,
    "",
    `Precio orientativo de la ficha pública: ${input.askingPrice}.`,
    "",
    "Esta carta no obliga a cerrar la compra. La revisión, el contrato y el pago vienen después.",
    "Firmarla la envía al vendedor como oferta indicativa.",
  ].join("\n");
}
