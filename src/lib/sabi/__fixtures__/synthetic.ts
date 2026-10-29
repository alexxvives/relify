import { deflateRawSync } from "node:zlib";

/** A made-up company laid out like a SABI "Informe" export. No real data. */
type Row = Array<string | number | null>;

const header = ["", "Cuentas No Consolidadas", null, "31/12/2024\nEUR", "31/12/2023\nmil EUR"];

export const syntheticRows: Row[] = [
  ["EMPRESA FICTICIA DE PRUEBAS SL"],
  ["Código NIF", "B12345674", null, "Forma jurídica", "Sociedad limitada"],
  ["28001 MADRID (MADRID, ESPAÑA)"],
  ["Fecha constitución", 36526, null, "Número de empleados", 12],
  ["Estado", "Activa"],
  ["Información de contacto"],
  ["CALLE FALSA, 123"],
  [],
  ["Código(s) CNAE 2009"],
  ["Código(s) primario(s)"],
  [6920, null, "Actividades de contabilidad"],
  ["Código(s) secundario(s)"],
  [8299, null, "Otras actividades de apoyo"],
  [],
  ["Formato Global"],
  header,
  ["", null, null, "12 meses\nPYME PGC 2007", "11 meses\nPYME PGC 2007"],
  ["", "Inmovilizado", null, "100.000,00", "90"],
  ["", "Activo circulante", null, "50.000,00", "40"],
  ["", "Existencias", null, "5.000,00", "4"],
  ["", "Deudores", null, "20.000,00", "16"],
  ["", "Tesorería", null, "25.000,00", "20"],
  ["", "Total activo", null, "150.000,00", "130"],
  ["", "Fondos propios", null, "80.000,00", "70"],
  ["", "Pasivo fijo", null, "n.d.", "30"],
  ["", "Acreedores a L. P.", null, "30.000,00", "30"],
  ["", "Pasivo líquido", null, "40.000,00", "30"],
  ["", "Deudas financieras", null, "10.000,00", "8"],
  ["", "Acreedores comerciales", null, "15.000,00", "12"],
  ["", "Total pasivo y capital propio", null, "150.000,00", "130"],
  ["", "Ingresos de explotación", null, "210.000,00", "180"],
  ["", "Importe neto Cifra de Ventas", null, "200.000,00", "175"],
  ["", "Consumo de mercaderías y de materias", null, "-60.000,00", "-50"],
  ["", "Resultado bruto", null, "150.000,00", "130"],
  ["", "Gastos de personal", null, "-80.000,00", "-70"],
  ["", "Dotaciones para amortiz. de inmovil.", null, "-10.000,00", "-9"],
  ["", "Resultado Explotación", null, "30.000,00", "25"],
  ["", "Resultado financiero", null, "-2.000,00", "-1"],
  ["", "Result. ordinarios antes Impuestos", null, "28.000,00", "24"],
  ["", "Resultado del Ejercicio", null, "21.000,00", "18"],
  ["", "EBITDA", null, "40.000,00", "34"],
  ["", "Número empleados", null, 12, 10],
  [],
  ["Ratios"],
  header,
  ["", "Liquidez general", null, "1,25", "1,33"],
  ["", "Margen de beneficio (%)", null, "13,33", "13,33"],
  [],
  ["Administradores y directivos"],
  ["Juntas y comités"],
  ["", "Nombre", null, "Título original", "Cargo", "Departamento"],
  ["1.\u00a0", "Doña Persona Inventada", null, "Administrador Único", "Administrador Único (desde\u00a001/02/2010)", "BoD"],
  [],
  ["Accionistas actuales"],
  ["", "Nombre del accionista", null, "País", "Tipo", "Directo (%)", "Total (%)"],
  ["1.", "SOCIO INVENTADO SL", null, "ES", "C", "60,00", "60,00"],
  ["2.", "OTRA PERSONA FICTICIA", null, "ES", "I", "40,00", "40,00"],
  [],
  ["Auditor", "Auditores Imaginarios SLP"],
  ["Bancos"],
  [null, "0000 - BANCO DE MENTIRA"],
];

function colName(index: number): string {
  let name = "";
  let n = index + 1;

  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }

  return name;
}

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function sheetXml(rows: Row[]): string {
  const body = rows
    .map((row, r) => {
      const cells = row
        .map((value, c) => {
          if (value === null || value === "") {
            return "";
          }

          const ref = `${colName(c)}${r + 1}`;
          return typeof value === "number"
            ? `<c r="${ref}"><v>${value}</v></c>`
            : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escape(value)}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><worksheet><sheetData>${body}</sheetData></worksheet>`;
}

function crc32(data: Buffer): number {
  let crc = ~0;

  for (const byte of data) {
    crc ^= byte;

    for (let k = 0; k < 8; k += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return ~crc >>> 0;
}

export function zip(files: Record<string, string>): Uint8Array {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const raw = Buffer.from(content, "utf8");
    const packed = deflateRawSync(raw);
    const nameBytes = Buffer.from(name, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc32(raw), 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc32(raw), 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBytes, packed);
    centrals.push(central, nameBytes);
    offset += 30 + nameBytes.length + packed.length;
  }

  const centralBytes = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...locals, centralBytes, end]));
}

export function syntheticWorkbook(rows: Row[] = syntheticRows): Uint8Array {
  return zip({
    "xl/workbook.xml": '<workbook><sheets><sheet name="Resultados" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels": '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": sheetXml(rows),
  });
}
