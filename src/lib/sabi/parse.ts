import {
  employeesLabels,
  moneyIndex,
  normalizeLabel,
  ratioIndex,
  tableHeadings,
  type SabiMoneyKey,
  type SabiRatioKey,
} from "./labels";
import { readFirstSheet, XlsxError, type SheetCell, type SheetGrid } from "./xlsx";

export type SabiCode = { code: string; description: string };
export type SabiCodeSet = { primary: SabiCode[]; secondary: SabiCode[] };
export type SabiCodeScheme = "cnae2009" | "cnae2025" | "nace" | "cae" | "ussic" | "iae" | "naics";

export type SabiIdentity = {
  legalName: string | null;
  cif: string | null;
  formerName: string | null;
  legalForm: string | null;
  legalFormDetail: string | null;
  /** Euro cents. */
  shareCapitalCents: number | null;
  /** ISO date (yyyy-mm-dd). */
  incorporatedOn: string | null;
  status: string | null;
  statusDetail: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  lastAccountsOn: string | null;
  yearsAvailable: number | null;
  accountsType: string | null;
  executiveDirector: string | null;
  president: string | null;
  globalUltimateOwner: string | null;
  independenceIndicator: string | null;
  shareholderCount: number | null;
  subsidiaryCount: number | null;
  employees: number | null;
  activityDescription: string | null;
  /** "Empresa privada" line under the name. */
  companyType: string | null;
  /** "Empresas en el grupo corporativo". */
  groupCompanyCount: number | null;
};

export type SabiYear = {
  year: number;
  /** ISO closing date. */
  closingOn: string;
  months: number | null;
  /** Accounting plan / filing status as SABI prints it (e.g. "PYME PGC 2007"). */
  basis: string | null;
  /** Euro cents, already scaled from the column unit. */
  money: Partial<Record<SabiMoneyKey, number | null>>;
  ratios: Partial<Record<SabiRatioKey, number | null>>;
  employees: number | null;
};

export type SabiPerson = {
  name: string;
  role: string;
  since: string | null;
  department: string | null;
  group: string | null;
  /** Every other column of the row (e.g. "Fuente"), keyed by its header as printed. */
  extra?: Record<string, string>;
};

/** "Estado auditoría por año": one block per filed year. */
export type SabiAudit = {
  year: number;
  closingOn: string | null;
  opinion: string | null;
  auditorName: string | null;
  auditorCode: string | null;
  /** Every label/value pair in the block, as printed. */
  fields: Record<string, string>;
};

/** Raw non-empty cells of the sheet: [row, [[column, text], …]]. Lets the admin see anything the parser has no field for. */
export type SabiSheetRow = [number, Array<[number, string]>];

export type SabiHolding = {
  name: string;
  country: string | null;
  type: string | null;
  /** As printed: "100,00", ">50,00", "-". */
  direct: string | null;
  total: string | null;
  infoDate: string | null;
  /** Remaining columns (Fuente, Variación, Ingreso operacional, Empleados, Nivel, Estatus…), keyed by header. */
  extra?: Record<string, string>;
};

export type SabiReport = {
  identity: SabiIdentity;
  codes: Partial<Record<SabiCodeScheme, SabiCodeSet>>;
  years: SabiYear[];
  directors: SabiPerson[];
  shareholders: SabiHolding[];
  subsidiaries: SabiHolding[];
  auditor: string | null;
  banks: string[];
  audits?: SabiAudit[];
  /** The whole sheet, so nothing in the file is lost. */
  sheet?: SabiSheetRow[];
  /** Human-readable notes for the admin preview (Spanish). */
  warnings: string[];
  /** Labels inside financial tables that the parser does not map. */
  unmappedLabels: string[];
};

export type SabiParseResult = { ok: true; report: SabiReport } | { ok: false; code: "not_xlsx" | "no_financials" };

const missingTokens = new Set(["", "n.d.", "n.s.", "-", "n.a.", "n/a"]);

function cellText(cell: SheetCell | undefined): string {
  return cell ? cell.text.trim() : "";
}

function rowNumbers(grid: SheetGrid): number[] {
  return [...grid.keys()].sort((left, right) => left - right);
}

function rowCells(grid: SheetGrid, row: number): Array<[number, SheetCell]> {
  return [...(grid.get(row)?.entries() ?? [])].sort((left, right) => left[0] - right[0]);
}

/** Parses a SABI number: numeric cells as is, text in Spanish format ("1.234,56", "259.927 EUR"). */
export function parseSabiNumber(cell: SheetCell | undefined): number | null {
  if (!cell) {
    return null;
  }

  if (cell.number !== null) {
    return cell.number;
  }

  const text = cell.text.trim().replace(/\s*(mil |mll |mill )?EUR$/i, "").trim();

  if (missingTokens.has(text.toLowerCase())) {
    return null;
  }

  if (!/^-?[\d.]+(,\d+)?$/.test(text)) {
    return null;
  }

  const value = Number(text.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function excelSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 2_958_465) {
    return null;
  }

  const date = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86_400_000);
  return date.toISOString().slice(0, 10);
}

/** "dd/mm/yyyy" text or an Excel serial to ISO. */
export function parseSabiDate(cell: SheetCell | undefined): string | null {
  if (!cell) {
    return null;
  }

  const match = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(cell.text);

  if (match) {
    return `${match[3]}-${match[2]?.padStart(2, "0")}-${match[1]?.padStart(2, "0")}`;
  }

  return cell.number !== null ? excelSerialToIso(cell.number) : null;
}

function emptyIdentity(): SabiIdentity {
  return {
    legalName: null,
    cif: null,
    formerName: null,
    legalForm: null,
    legalFormDetail: null,
    shareCapitalCents: null,
    incorporatedOn: null,
    status: null,
    statusDetail: null,
    street: null,
    postalCode: null,
    city: null,
    province: null,
    country: null,
    phone: null,
    website: null,
    lastAccountsOn: null,
    yearsAvailable: null,
    accountsType: null,
    executiveDirector: null,
    president: null,
    globalUltimateOwner: null,
    independenceIndicator: null,
    shareholderCount: null,
    subsidiaryCount: null,
    employees: null,
    activityDescription: null,
    companyType: null,
    groupCompanyCount: null,
  };
}

function textOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 && !missingTokens.has(trimmed.toLowerCase()) ? trimmed : null;
}

/** Label → the next non-empty cell on the same row. First match wins. */
function labelValues(grid: SheetGrid, lastRow: number): Map<string, SheetCell> {
  const values = new Map<string, SheetCell>();

  for (const row of rowNumbers(grid)) {
    if (row > lastRow) {
      break;
    }

    const cells = rowCells(grid, row);

    for (let index = 0; index < cells.length - 1; index += 1) {
      const label = normalizeLabel(cells[index]?.[1].text ?? "");
      const next = cells[index + 1]?.[1];

      if (label && next && !values.has(label)) {
        values.set(label, next);
      }
    }
  }

  return values;
}

const tableHeaderPattern = /^cuentas (no )?consolidadas$|^(un)?consolidated accounts$/;

function isTableHeader(grid: SheetGrid, row: number): boolean {
  return rowCells(grid, row).some(([, cell]) => tableHeaderPattern.test(normalizeLabel(cell.text)));
}

function parseIdentity(grid: SheetGrid, firstTableRow: number): SabiIdentity {
  const identity = emptyIdentity();
  const rows = rowNumbers(grid).filter((row) => row < firstTableRow);
  const values = labelValues(grid, firstTableRow - 1);
  const text = (label: string) => textOrNull(cellText(values.get(label)));
  const number = (label: string) => parseSabiNumber(values.get(label));

  const firstRow = rows[0];
  identity.legalName = firstRow !== undefined ? textOrNull(rowCells(grid, firstRow).map(([, cell]) => cell.text).join(" ")) : null;
  identity.cif = text("codigo nif")?.toUpperCase().replace(/[\s.-]/g, "") ?? null;
  identity.formerName = text("denominacion antigua");
  identity.legalForm = text("forma juridica");
  identity.legalFormDetail = text("forma juridica detallada");
  const capital = number("capital social (eur)");
  identity.shareCapitalCents = capital === null ? null : Math.round(capital * 100);
  identity.incorporatedOn = parseSabiDate(values.get("fecha constitucion"));
  identity.status = text("estado");
  identity.statusDetail = text("estado detallado");
  identity.phone = text("telefono");
  identity.website = text("direccion web");
  identity.lastAccountsOn = parseSabiDate(values.get("fecha ultimas cuentas")) ?? parseSabiDate(values.get("ultimo ano disponible"));
  const years = number("anos disponibles");
  identity.yearsAvailable = years === null ? null : Math.round(years);
  identity.accountsType = text("cuentas disponibles");
  identity.executiveDirector = text("director ejecutivo");
  identity.president = text("presidente");
  identity.independenceIndicator = text("indicador independencia bvd");
  const shareholders = number("num. accionistas");
  identity.shareholderCount = shareholders === null ? null : Math.round(shareholders);
  const subsidiaries = number("num. participadas");
  identity.subsidiaryCount = subsidiaries === null ? null : Math.round(subsidiaries);
  const group = number("empresas en el grupo corporativo");
  identity.groupCompanyCount = group === null ? null : Math.round(group);
  const employees = number("numero de empleados");
  identity.employees = employees === null ? null : Math.round(employees);

  let contactRow: number | null = null;

  for (const row of rows) {
    const first = cellText(grid.get(row)?.get(1));
    const label = normalizeLabel(first);

    if (first.startsWith("El Global Ultimate Owner de esta participada es ")) {
      identity.globalUltimateOwner = textOrNull(first.slice("El Global Ultimate Owner de esta participada es ".length));
    }

    if (identity.companyType === null && /^empresa (privada|publica)|^(private|public)(ly)? (company|listed)/.test(label)) {
      identity.companyType = textOrNull(first);
    }

    if (label === "informacion de contacto") {
      contactRow = row;
    }

    if (label === "descripcion actividad") {
      const next = rows.find((candidate) => candidate > row);
      identity.activityDescription = next !== undefined ? textOrNull(cellText(grid.get(next)?.get(1))) : null;
    }

    // "28912 LEGANES (MADRID, ESPANA)" next to "Código NIF".
    const located = /^(\d{5})\s+(.+?)\s*\(([^,]+),\s*([^)]+)\)$/.exec(first);

    if (located && identity.postalCode === null) {
      identity.postalCode = located[1] ?? null;
      identity.city = textOrNull(located[2] ?? "");
      identity.province = textOrNull(located[3] ?? "");
      identity.country = textOrNull(located[4] ?? "");
    }
  }

  if (contactRow !== null) {
    const lines: string[] = [];

    for (const row of rows.filter((candidate) => candidate > contactRow)) {
      const first = cellText(grid.get(row)?.get(1));

      if (!first) {
        if (lines.length > 0) {
          break;
        }

        continue;
      }

      if (/^informaci[oó]n /i.test(first)) {
        break;
      }

      lines.push(first);
    }

    identity.street = textOrNull(lines[0] ?? "");
  }

  return identity;
}

const schemePatterns: Array<[SabiCodeScheme, RegExp]> = [
  ["cnae2009", /^codigo\(s\) cnae 2009$/],
  ["cnae2025", /^cnae 2025 code\(s\)$|^codigo\(s\) cnae 2025$/],
  ["nace", /^codigo\(s\) nace/],
  ["cae", /^codigo\(s\) cae/],
  ["ussic", /^codigo\(s\) us sic$/],
  ["iae", /^codigo\(s\) iae$/],
  ["naics", /^naics .*code\(s\)$|^codigo\(s\) naics/],
];

const codeWidth: Partial<Record<SabiCodeScheme, number>> = { cnae2009: 4, cnae2025: 4, nace: 4, cae: 4, ussic: 4, iae: 4 };

function parseCodes(grid: SheetGrid, firstTableRow: number): Partial<Record<SabiCodeScheme, SabiCodeSet>> {
  const codes: Partial<Record<SabiCodeScheme, SabiCodeSet>> = {};
  let scheme: SabiCodeScheme | null = null;
  let role: "primary" | "secondary" = "primary";

  for (const row of rowNumbers(grid)) {
    if (row >= firstTableRow) {
      break;
    }

    const first = cellText(grid.get(row)?.get(1));
    const label = normalizeLabel(first);
    const matched = schemePatterns.find(([, pattern]) => pattern.test(label));

    if (matched) {
      scheme = matched[0];
      role = "primary";
      codes[scheme] = { primary: [], secondary: [] };
      continue;
    }

    if (!scheme) {
      continue;
    }

    if (/^codigo\(s\) primario/.test(label)) {
      role = "primary";
      continue;
    }

    if (/^codigo\(s\) secundario/.test(label)) {
      role = "secondary";
      continue;
    }

    const cell = grid.get(row)?.get(1);
    const raw = cell?.number !== null && cell?.number !== undefined ? String(Math.trunc(cell.number)) : first;

    if (/^\d{2,6}$/.test(raw)) {
      const width = codeWidth[scheme] ?? raw.length;
      const description = cellText(grid.get(row)?.get(3)) || cellText(grid.get(row)?.get(2)).replace(/^-\s*/, "");
      codes[scheme]?.[role].push({ code: raw.padStart(width, "0"), description });
      continue;
    }

    if (first) {
      scheme = null;
    }
  }

  return codes;
}

type Column = { column: number; year: number; closingOn: string; multiplier: number; months: number | null; basis: string | null };

function unitMultiplier(header: string): number {
  const unit = normalizeLabel(header.split("\n").slice(1).join(" "));

  if (/^(mil|th|miles)\b/.test(unit)) {
    return 1_000;
  }

  if (/^(mll|mill|millones|m)\b/.test(unit)) {
    return 1_000_000;
  }

  return 1;
}

type TableKind = "summary" | "global" | "ratios" | "other";

function sectionKind(title: string): TableKind {
  const label = normalizeLabel(title);

  if (label.startsWith("perfil financiero")) {
    return "summary";
  }

  if (label.startsWith("ratios")) {
    return "ratios";
  }

  if (label.startsWith("formato global") || label.startsWith("formato detallado")) {
    return "global";
  }

  return "other";
}

type ParsedTables = { years: Map<number, SabiYear>; warnings: string[]; unmapped: Set<string> };

function parseTables(grid: SheetGrid): ParsedTables {
  const years = new Map<number, SabiYear>();
  const warnings: string[] = [];
  const unmapped = new Set<string>();
  const rows = rowNumbers(grid);
  let section: TableKind = "other";
  let columns: Column[] = [];
  let headerColumns = new Set<number>();
  let headerless = false;
  const priority = new Map<string, TableKind>();

  for (const row of rows) {
    const cells = rowCells(grid, row);
    const first = cellText(grid.get(row)?.get(1));

    if (first && !/^\d+\.\s*$/.test(first)) {
      const kind = sectionKind(first);

      if (kind !== "other") {
        section = kind;
        columns = [];
        continue;
      }

      if (columns.length > 0) {
        columns = [];
        section = "other";
      }
    }

    if (isTableHeader(grid, row)) {
      columns = [];
      headerColumns = new Set();

      for (const [column, cell] of cells) {
        const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(cell.text.trim());

        if (match) {
          const year = Number(match[3]);
          const closingOn = `${match[3]}-${match[2]?.padStart(2, "0")}-${match[1]?.padStart(2, "0")}`;
          columns.push({ column, year, closingOn, multiplier: unitMultiplier(cell.text), months: null, basis: null });
          headerColumns.add(column);
        }
      }

      const multipliers = new Set(columns.map((column) => column.multiplier));

      if ([...multipliers].some((value) => value !== 1)) {
        warnings.push("Algunas columnas vienen en miles o millones de EUR; se han convertido a euros.");
      }

      continue;
    }

    if (columns.length === 0) {
      continue;
    }

    // "12 meses\nPendiente de tratamiento\nPYME PGC 2007" just under the header.
    const periodCells = cells.filter(([column, cell]) => headerColumns.has(column) && /^\d+ meses/i.test(cell.text.trim()));

    if (periodCells.length > 0) {
      for (const [column, cell] of periodCells) {
        const target = columns.find((candidate) => candidate.column === column);

        if (target) {
          const lines = cell.text.split("\n").map((line) => line.trim()).filter(Boolean);
          target.months = Number(/^(\d+)/.exec(lines[0] ?? "")?.[1] ?? "") || null;
          target.basis = lines.slice(1).join(" · ") || null;
        }
      }

      continue;
    }

    const labelCell = cells.find(([column]) => column <= 2 && cellText(grid.get(row)?.get(column)).length > 0);

    if (!labelCell) {
      continue;
    }

    const label = normalizeLabel(labelCell[1].text);

    if (tableHeadings.includes(label)) {
      continue;
    }

    const moneyKey = section === "ratios" ? undefined : moneyIndex.get(label);
    const ratioKey = section === "global" ? undefined : ratioIndex.get(label);
    const isEmployees = employeesLabels.includes(label);

    if (!moneyKey && !ratioKey && !isEmployees) {
      unmapped.add(labelCell[1].text.trim());
      continue;
    }

    for (const [column, cell] of cells) {
      if (column <= labelCell[0] || headerColumns.has(column)) {
        continue;
      }

      if (parseSabiNumber(cell) !== null) {
        headerless = true;
      }
    }

    for (const column of columns) {
      const value = parseSabiNumber(grid.get(row)?.get(column.column));
      let entry = years.get(column.year);

      if (!entry) {
        entry = { year: column.year, closingOn: column.closingOn, months: null, basis: null, money: {}, ratios: {}, employees: null };
        years.set(column.year, entry);
      }

      if (entry.closingOn !== column.closingOn) {
        continue;
      }

      entry.months ??= column.months;
      entry.basis ??= column.basis;

      if (isEmployees) {
        entry.employees ??= value === null ? null : Math.round(value);
        continue;
      }

      const key = moneyKey ?? ratioKey;

      if (!key) {
        continue;
      }

      // "Formato Global" wins over the summary table for the same line.
      const slot = `${column.year}:${key}`;
      const previous = priority.get(slot);

      if (previous === "global" && section !== "global") {
        continue;
      }

      priority.set(slot, section);

      if (moneyKey) {
        entry.money[moneyKey] = value === null ? null : Math.round(value * column.multiplier * 100);
      } else if (ratioKey) {
        entry.ratios[ratioKey] = value;
      }
    }
  }

  if (headerless) {
    warnings.push("Hay columnas con cifras pero sin fecha de cierre en la cabecera; se han ignorado.");
  }

  return { years, warnings, unmapped };
}

const itemPattern = /^\d+\.\s*$/;

function parsePeople(grid: SheetGrid): SabiPerson[] {
  const people: SabiPerson[] = [];
  const rows = rowNumbers(grid);
  let group: string | null = null;
  let nameColumn: number | null = null;
  let departmentColumn: number | null = null;
  let headers: Array<[number, string]> = [];

  for (const row of rows) {
    const cells = rowCells(grid, row);
    const first = cellText(grid.get(row)?.get(1));

    if (first) {
      const label = normalizeLabel(first);

      if (label.startsWith("administradores") || label === "juntas y comites" || label === "administracion y personal") {
        group = label.startsWith("administradores") ? null : first;
        nameColumn = null;
        continue;
      }

      if (nameColumn !== null && !itemPattern.test(first)) {
        nameColumn = null;
        group = null;
      }
    }

    const header = cells.find(([, cell]) => normalizeLabel(cell.text) === "nombre");

    if (header && cells.some(([, cell]) => normalizeLabel(cell.text).startsWith("titulo original"))) {
      nameColumn = header[0];
      departmentColumn = cells.find(([, cell]) => /^(departamento|comite)$/.test(normalizeLabel(cell.text)))?.[0] ?? null;
      headers = cells.map(([column, cell]) => [column, cell.text.replace(/\s+/g, " ").trim()]);
      continue;
    }

    if (nameColumn === null || !cells.some(([column, cell]) => column < nameColumn! && itemPattern.test(cell.text.trim()))) {
      continue;
    }

    const name = cellText(grid.get(row)?.get(nameColumn));
    const roleCell = cells.find(([, cell]) => /\(desde\s\d{1,2}\/\d{1,2}\/\d{4}\)/.test(cell.text));
    const roleText = roleCell ? roleCell[1].text.trim() : "";
    const since = /\(desde\s(\d{1,2}\/\d{1,2}\/\d{4})\)/.exec(roleText);

    if (!name) {
      continue;
    }

    const extra: Record<string, string> = {};

    for (const [column, title] of headers) {
      const normalized = normalizeLabel(title);

      if (column === nameColumn || column === departmentColumn || column === roleCell?.[0] || normalized.startsWith("titulo original")) {
        continue;
      }

      const value = textOrNull(cellText(grid.get(row)?.get(column)));

      if (value && title) {
        extra[title] = value;
      }
    }

    people.push({
      ...(Object.keys(extra).length > 0 ? { extra } : {}),
      name,
      role: roleText.replace(/\s*\(desde\s[^)]*\)\s*$/, "") || "—",
      since: since ? parseSabiDate({ text: since[1] ?? "", number: null }) : null,
      department: departmentColumn !== null ? textOrNull(cellText(grid.get(row)?.get(departmentColumn))) : null,
      group,
    });
  }

  return people;
}

function parseHoldings(grid: SheetGrid, nameHeader: string): SabiHolding[] {
  const holdings: SabiHolding[] = [];
  const rows = rowNumbers(grid);
  let header: Map<string, number> | null = null;
  let titles: Array<[number, string]> = [];

  for (const row of rows) {
    const cells = rowCells(grid, row);

    if (!header) {
      const hit = cells.find(([, cell]) => normalizeLabel(cell.text) === nameHeader);

      if (hit) {
        header = new Map(cells.map(([column, cell]) => [normalizeLabel(cell.text.split("\n")[0] ?? ""), column]));
        titles = cells.map(([column, cell]) => [column, cell.text.replace(/(\p{L})-\s*(\p{Ll})/gu, "$1$2").replace(/\s+/g, " ").trim()]);
      }

      continue;
    }

    const first = cellText(grid.get(row)?.get(1));

    if (first && !itemPattern.test(first) && first !== "*") {
      break;
    }

    if (!itemPattern.test(first)) {
      continue;
    }

    const nameColumn = header.get(nameHeader) ?? 2;
    const countryColumn = header.get("pais") ?? null;
    const limit = countryColumn ?? nameColumn + 1;
    let name = "";

    for (let column = nameColumn; column < limit || column === nameColumn; column += 1) {
      name = cellText(grid.get(row)?.get(column));

      if (name || column >= limit) {
        break;
      }
    }

    if (!name) {
      name = cells.filter(([column]) => column > 1).map(([, cell]) => cell.text.trim()).find(Boolean) ?? "";
    }

    if (!name) {
      continue;
    }

    const pick = (label: string) => {
      const column = header?.get(label);
      return column === undefined ? null : textOrNull(cellText(grid.get(row)?.get(column)));
    };
    const dateColumn = header.get("fecha de la info.");

    const known = new Set(["pais", "tipo", "directo (%)", "total (%)", "fecha de la info.", nameHeader]);
    const extra: Record<string, string> = {};

    for (const [column, title] of titles) {
      if (known.has(normalizeLabel(title)) || column === nameColumn) {
        continue;
      }

      const value = textOrNull(cellText(grid.get(row)?.get(column)));

      if (value && title) {
        extra[title] = value;
      }
    }

    holdings.push({
      ...(Object.keys(extra).length > 0 ? { extra } : {}),
      name,
      country: pick("pais"),
      type: pick("tipo"),
      direct: pick("directo (%)"),
      total: pick("total (%)"),
      infoDate: dateColumn === undefined ? null : parseSabiDate(grid.get(row)?.get(dateColumn)),
    });
  }

  return holdings;
}

function parseAuditAndBanks(grid: SheetGrid): { auditor: string | null; banks: string[] } {
  let auditor: string | null = null;
  const banks: string[] = [];
  const rows = rowNumbers(grid);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const first = normalizeLabel(cellText(grid.get(row)?.get(1)));

    if (first === "auditor" && auditor === null) {
      auditor = textOrNull(cellText(grid.get(row)?.get(2)));
    }

    if (first === "bancos") {
      for (const next of rows.slice(index + 1)) {
        if (cellText(grid.get(next)?.get(1))) {
          break;
        }

        const bank = textOrNull(cellText(grid.get(next)?.get(2)));

        if (bank) {
          banks.push(bank);
        }
      }
    }
  }

  return { auditor, banks };
}

function parseAudits(grid: SheetGrid): SabiAudit[] {
  const audits: SabiAudit[] = [];
  let current: SabiAudit | null = null;

  for (const row of rowNumbers(grid)) {
    const first = cellText(grid.get(row)?.get(1)).trim();
    const opened = /^(\d{4})\s+cuenta:?$/i.exec(first.replace(/\u00a0/g, " "));

    if (opened) {
      current = { year: Number(opened[1]), closingOn: null, opinion: null, auditorName: null, auditorCode: null, fields: {} };
      audits.push(current);
      continue;
    }

    if (first) {
      current = null;
      continue;
    }

    if (!current) {
      continue;
    }

    const cells = rowCells(grid, row);
    const labelCell = cells[0];
    const valueCell = cells[1];

    if (!labelCell || !valueCell) {
      continue;
    }

    const label = normalizeLabel(labelCell[1].text);
    const value = textOrNull(valueCell[1].text);

    if (!value) {
      continue;
    }

    current.fields[labelCell[1].text.replace(/:\s*$/, "").trim()] = value;

    if (label === "fecha de cierre") {
      current.closingOn = parseSabiDate(valueCell[1]);
    } else if (label === "opinion auditores") {
      current.opinion = value;
    } else if (label === "nombre del auditor") {
      current.auditorName = value;
    } else if (label === "codigo de auditor") {
      current.auditorCode = value;
    }
  }

  return audits;
}

/** t67: the raw sheet is a fallback copy, capped so one odd export cannot bloat the row. */
export const sabiSheetMaxRows = 2000;
export const sabiSheetMaxCellChars = 500;

function sheetRows(grid: SheetGrid): SabiSheetRow[] {
  return rowNumbers(grid)
    .map(
      (row): SabiSheetRow => [
        row,
        rowCells(grid, row)
          .map(([column, cell]): [number, string] => [column, cell.text.slice(0, sabiSheetMaxCellChars)])
          .filter(([, text]) => text.trim() !== ""),
      ],
    )
    .filter(([, cells]) => cells.length > 0)
    .slice(0, sabiSheetMaxRows);
}

const cifPattern = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;

function validate(report: SabiReport): void {
  const { identity, years, warnings } = report;

  if (!identity.cif) {
    warnings.push("No se ha encontrado el Código NIF en el archivo.");
  } else if (!cifPattern.test(identity.cif)) {
    warnings.push(`El NIF del archivo (${identity.cif}) no tiene formato de CIF de sociedad.`);
  }

  if (!identity.legalName) {
    warnings.push("No se ha encontrado la razón social.");
  }

  for (const year of years) {
    if (year.months !== null && year.months !== 12) {
      warnings.push(`El ejercicio ${year.year} cubre ${year.months} meses, no un año completo.`);
    }

    const { totalAssets, totalLiabilitiesAndEquity, ebitda, ebit, depreciation } = year.money;

    if (totalAssets != null && totalLiabilitiesAndEquity != null && Math.abs(totalAssets - totalLiabilitiesAndEquity) > 100) {
      warnings.push(`En ${year.year} el total activo no cuadra con el total pasivo.`);
    }

    if (ebitda == null && ebit != null && depreciation != null) {
      warnings.push(`En ${year.year} falta el EBITDA; se calcula como EBIT + amortizaciones.`);
    }

    if (year.money.operatingRevenue == null && year.money.sales == null) {
      warnings.push(`En ${year.year} no hay ingresos de explotación.`);
    }
  }
}

export function parseSabiGrid(grid: SheetGrid): SabiParseResult {
  const rows = rowNumbers(grid);
  const firstTableRow = rows.find((row) => isTableHeader(grid, row));

  if (firstTableRow === undefined) {
    return { ok: false, code: "no_financials" };
  }

  const tables = parseTables(grid);

  if (tables.years.size === 0) {
    return { ok: false, code: "no_financials" };
  }

  const identity = parseIdentity(grid, firstTableRow);
  const years = [...tables.years.values()].sort((left, right) => right.year - left.year);
  identity.employees ??= years[0]?.employees ?? null;
  const { auditor, banks } = parseAuditAndBanks(grid);
  const report: SabiReport = {
    identity,
    codes: parseCodes(grid, firstTableRow),
    years,
    directors: parsePeople(grid),
    shareholders: parseHoldings(grid, "nombre del accionista"),
    subsidiaries: parseHoldings(grid, "nombre participada"),
    auditor,
    banks,
    audits: parseAudits(grid),
    sheet: sheetRows(grid),
    warnings: [...tables.warnings],
    unmappedLabels: [...tables.unmapped],
  };
  validate(report);
  return { ok: true, report };
}

export async function parseSabiWorkbook(bytes: Uint8Array): Promise<SabiParseResult> {
  let grid: SheetGrid;

  try {
    grid = await readFirstSheet(bytes);
  } catch (error) {
    if (error instanceof XlsxError) {
      return { ok: false, code: "not_xlsx" };
    }

    throw error;
  }

  return parseSabiGrid(grid);
}
