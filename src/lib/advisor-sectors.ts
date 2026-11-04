export const advisorSectors = [
  { id: "A", name: "Agricultura, ganadería, silvicultura y pesca", short: "Agricultura y pesca" },
  { id: "B", name: "Industrias extractivas", short: "Industrias extractivas" },
  { id: "C", name: "Industria manufacturera", short: "Industria" },
  { id: "D", name: "Suministro de energía eléctrica, gas, vapor y aire acondicionado", short: "Energía" },
  { id: "E", name: "Suministro de agua, actividades de saneamiento, gestión de residuos y descontaminación", short: "Agua y residuos" },
  { id: "F", name: "Construcción", short: "Construcción" },
  { id: "G", name: "Comercio al por mayor y al por menor", short: "Comercio" },
  { id: "H", name: "Transporte y almacenamiento", short: "Transporte y logística" },
  { id: "I", name: "Hostelería", short: "Hostelería" },
  { id: "J", name: "Actividades de edición, radiodifusión y producción y distribución de contenidos", short: "Edición y medios" },
  { id: "K", name: "Telecomunicaciones, programación informática, consultoría, infraestructura informática y otros servicios de información", short: "Tecnología y telecomunicaciones" },
  { id: "L", name: "Actividades financieras y de seguros", short: "Finanzas y seguros" },
  { id: "M", name: "Actividades inmobiliarias", short: "Inmobiliario" },
  { id: "N", name: "Actividades profesionales, científicas y técnicas", short: "Servicios profesionales" },
  { id: "O", name: "Actividades administrativas y servicios auxiliares", short: "Servicios administrativos" },
  { id: "P", name: "Administración pública y defensa; seguridad social obligatoria", short: "Administración pública" },
  { id: "Q", name: "Educación", short: "Educación" },
  { id: "R", name: "Actividades sanitarias y de servicios sociales", short: "Sanidad y servicios sociales" },
  { id: "S", name: "Actividades artísticas, deportivas y de entretenimiento", short: "Arte, deporte y ocio" },
  { id: "T", name: "Otros servicios", short: "Otros servicios" },
  { id: "U", name: "Actividades de los hogares como empleadores de personal doméstico y como productores de bienes y servicios para uso propio", short: "Hogares" },
  { id: "V", name: "Organismos extraterritoriales", short: "Organismos extraterritoriales" },
] as const;

export const advisorSectorIds = advisorSectors.map((sector) => sector.id);

export type AdvisorSectorId = (typeof advisorSectors)[number]["id"];

export function advisorSectorName(id: string): string {
  return advisorSectors.find((sector) => sector.id === id)?.name ?? id;
}

/** t93: short label for cards, filters and profiles; the full CNAE section name stays as stored/admin text. */
export function advisorSectorShort(id: string): string {
  return advisorSectors.find((sector) => sector.id === id)?.short ?? advisorSectorName(id);
}
