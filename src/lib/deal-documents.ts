export function spanishDate(now: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(now);
}

/** t92: "Proyecto Olivo" stays as is and "Olivo" becomes "Proyecto Olivo", so the text never says "proyecto Proyecto". */
export function projectTitle(codename: string): string {
  const name = codename.trim().replace(/\s+/g, " ");
  if (!name) {
    return "el proyecto";
  }
  return /^proyecto\s/i.test(name) ? `Proyecto ${name.replace(/^proyecto\s+/i, "")}` : `Proyecto ${name}`;
}

/** t92: "en la Comunitat Valenciana", "en Canarias": article only for names that take one. */
export function regionPlace(region: string): string {
  const name = region.trim();
  if (!name) {
    return "España";
  }
  return /^(comunidad|comunitat|región|regi[oó]n|ciudad|rioja)\b/i.test(name) ? `la ${name}` : name;
}

function partiesLine(person: string, role: "Comprador" | "Asesor", codename: string, region: string): string {
  return `${person} (el ${role}) y el titular de ${projectTitle(codename)}, empresa ubicada en ${regionPlace(region)} (el Vendedor), acuerdan lo siguiente:`;
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
    partiesLine(input.buyerName, "Comprador", input.codename, input.region),
    "",
    `1. El Comprador usará la información de ${projectTitle(input.codename)} solo para valorar una posible compra.`,
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
    `${input.buyerName} (el Comprador) manifiesta al titular de ${projectTitle(input.codename)}, empresa ubicada en ${regionPlace(input.region)} (el Vendedor), su intención de estudiar la compra de la empresa.`,
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
    partiesLine(input.advisorName, "Asesor", input.codename, input.region),
    "",
    `1. El Asesor usará la información de ${projectTitle(input.codename)} solo para el encargo.`,
    "2. La firma del comprador no abre esta ficha. El asesor firma la suya.",
    "3. Este acuerdo no entrega la razón social, el CIF, el domicilio ni los nombres de los archivos antes de esta firma.",
    "4. La confidencialidad dura dos años desde esta firma. No reserva la empresa.",
    "5. Firmar en Relify deja constancia de la aceptación. Este acuerdo es jurídicamente vinculante desde su aceptación (art. 23 de la Ley 34/2002, LSSI).",
  ].join("\n");
}
