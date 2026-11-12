export type CnaeSection = {
  id: string;
  label: string;
};

const sections: readonly { max: number; id: string; label: string }[] = [
  { max: 3, id: "A", label: "Agricultura" },
  { max: 9, id: "B", label: "Extractivas" },
  { max: 33, id: "C", label: "Industria" },
  { max: 35, id: "D", label: "Energía" },
  { max: 39, id: "E", label: "Agua y residuos" },
  { max: 43, id: "F", label: "Construcción" },
  { max: 47, id: "G", label: "Comercio" },
  { max: 53, id: "H", label: "Transporte" },
  { max: 56, id: "I", label: "Hostelería" },
  { max: 63, id: "J", label: "Información" },
  { max: 66, id: "K", label: "Finanzas" },
  { max: 68, id: "L", label: "Inmobiliario" },
  { max: 75, id: "M", label: "Profesionales" },
  { max: 82, id: "N", label: "Administrativos" },
  { max: 84, id: "O", label: "Administración pública" },
  { max: 85, id: "P", label: "Educación" },
  { max: 88, id: "Q", label: "Sanidad" },
  { max: 93, id: "R", label: "Cultura y deporte" },
  { max: 96, id: "S", label: "Otros servicios" },
  { max: 98, id: "T", label: "Hogares" },
  { max: 99, id: "U", label: "Organismos" },
];

export type SectorCompany = {
  slug: string;
  codename: string;
  revenueCents: number;
};

export type IndustrySector = {
  id: string;
  label: string;
  count: number;
  revenueCents?: number;
  companies?: SectorCompany[];
};

export const cnaeSectionLabels = sections.map((section) => section.label);

export type CnaeSelectOption = { value: string; label: string; group?: string };

/** CNAE class list grouped under section headers for the seller sector dropdown. */
export function groupedCnaeOptions(
  classes: readonly { code: string; title: string }[],
  emptyLabel: string,
): CnaeSelectOption[] {
  return [
    { value: "", label: emptyLabel },
    ...classes.map((item) => ({
      value: item.code,
      label: `${item.code} — ${item.title}`,
      group: cnaeSection(item.code)?.label,
    })),
  ];
}

export function cnaeSection(code: string): CnaeSection | null {
  const division = Number(code.slice(0, 2));

  if (!Number.isInteger(division) || division < 1) {
    return null;
  }

  const section = sections.find((item) => division <= item.max);
  return section ? { id: section.id, label: section.label } : null;
}

export function groupSectors(codes: readonly string[]): IndustrySector[] {
  const counts = new Map<string, IndustrySector>();

  for (const code of codes) {
    const section = cnaeSection(code);

    if (!section) {
      continue;
    }

    const current = counts.get(section.id);

    if (current) {
      current.count += 1;
    } else {
      counts.set(section.id, { id: section.id, label: section.label, count: 1 });
    }
  }

  return [...counts.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "es"));
}

export function groupSectorBooks(
  rows: readonly { code: string; slug: string; codename: string; revenueCents: number }[],
): IndustrySector[] {
  const books = new Map<string, IndustrySector>();

  for (const row of rows) {
    const section = cnaeSection(row.code);

    if (!section) {
      continue;
    }

    const current = books.get(section.id) ?? {
      id: section.id,
      label: section.label,
      count: 0,
      revenueCents: 0,
      companies: [],
    };
    const companies = current.companies ?? [];

    if (!companies.some((company) => company.slug === row.slug)) {
      companies.push({ slug: row.slug, codename: row.codename, revenueCents: row.revenueCents });
      current.count += 1;
      current.revenueCents = (current.revenueCents ?? 0) + row.revenueCents;
    }

    current.companies = companies;
    books.set(section.id, current);
  }

  return [...books.values()].sort(
    (left, right) => (right.revenueCents ?? 0) - (left.revenueCents ?? 0) || left.label.localeCompare(right.label, "es"),
  );
}
