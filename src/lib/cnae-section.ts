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

export type IndustrySector = {
  id: string;
  label: string;
  count: number;
};

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
