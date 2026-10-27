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
    `${input.buyerName}, como comprador en Relify, y el titular del proyecto ${input.codename} (${input.region}) acuerdan:`,
    "",
    `1. El comprador usará la información del proyecto ${input.codename} solo para valorar una posible compra.`,
    "2. No la revelará a terceros, salvo a asesores que acepten esta misma confidencialidad.",
    "3. Este acuerdo no entrega la razón social, el CIF, el domicilio ni los nombres de los archivos.",
    "4. La confidencialidad dura dos años desde esta firma. No reserva la empresa ni impide hablar con otros compradores.",
    "5. Firmar en Relify deja constancia de la aceptación. Este acuerdo es jurídicamente vinculante desde su aceptación (art. 23 de la Ley 34/2002, LSSI).",
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
    `${input.buyerName}, comprador en Relify, manifiesta su intención de estudiar la compra del proyecto ${input.codename} (${input.region}).`,
    "",
    `1. Precio orientativo. La ficha pública indica ${input.askingPrice}. Es una referencia, no el precio cerrado. El importe definitivo se acuerda después de la revisión.`,
    "2. Esta carta no obliga a comprar ni a vender. No es el contrato de compraventa y no es el pago. La revisión, el contrato y el pago vienen después.",
    "3. Firmarla no reserva la empresa. Si el vendedor la acepta, durante seis meses no negociará la venta de este proyecto con otros compradores. Si no la acepta, no hay reserva y el proceso sigue en preguntas y reuniones.",
    "4. La información del proyecto se sigue usando solo para valorar la compra, como en el acuerdo de confidencialidad.",
    "5. La firma en Relify deja constancia y envía esta carta al vendedor como oferta indicativa. El proceso no avanza hasta que el vendedor la acepta.",
  ].join("\n");
}

export function advisorNdaAgreement(input: {
  advisorName: string;
  codename: string;
  region: string;
  dateLabel: string;
}): string {
  return [
    "ACUERDO DE CONFIDENCIALIDAD DEL ASESOR",
    "",
    `Fecha: ${input.dateLabel}`,
    "",
    `${input.advisorName}, como asesor en Relify, y el titular del proyecto ${input.codename} (${input.region}) acuerdan:`,
    "",
    `1. El asesor usará la información del proyecto ${input.codename} solo para el encargo.`,
    "2. La firma del comprador no abre esta ficha. El asesor firma la suya.",
    "3. Este acuerdo no entrega la razón social, el CIF, el domicilio ni los nombres de los archivos antes de esta firma.",
    "4. La confidencialidad dura dos años desde esta firma. No reserva la empresa.",
    "5. Firmar en Relify deja constancia de la aceptación. Este acuerdo es jurídicamente vinculante desde su aceptación (art. 23 de la Ley 34/2002, LSSI).",
  ].join("\n");
}
