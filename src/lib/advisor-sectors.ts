export const advisorSectors = [
  { id: "A", name: "Agricultura, ganadería, silvicultura y pesca" },
  { id: "B", name: "Industrias extractivas" },
  { id: "C", name: "Industria manufacturera" },
  { id: "D", name: "Suministro de energía eléctrica, gas, vapor y aire acondicionado" },
  { id: "E", name: "Suministro de agua, actividades de saneamiento, gestión de residuos y descontaminación" },
  { id: "F", name: "Construcción" },
  { id: "G", name: "Comercio al por mayor y al por menor" },
  { id: "H", name: "Transporte y almacenamiento" },
  { id: "I", name: "Hostelería" },
  { id: "J", name: "Actividades de edición, radiodifusión y producción y distribución de contenidos" },
  { id: "K", name: "Telecomunicaciones, programación informática, consultoría, infraestructura informática y otros servicios de información" },
  { id: "L", name: "Actividades financieras y de seguros" },
  { id: "M", name: "Actividades inmobiliarias" },
  { id: "N", name: "Actividades profesionales, científicas y técnicas" },
  { id: "O", name: "Actividades administrativas y servicios auxiliares" },
  { id: "P", name: "Administración pública y defensa; seguridad social obligatoria" },
  { id: "Q", name: "Educación" },
  { id: "R", name: "Actividades sanitarias y de servicios sociales" },
  { id: "S", name: "Actividades artísticas, deportivas y de entretenimiento" },
  { id: "T", name: "Otros servicios" },
  { id: "U", name: "Actividades de los hogares como empleadores de personal doméstico y como productores de bienes y servicios para uso propio" },
  { id: "V", name: "Organismos extraterritoriales" },
] as const;

export const advisorSectorIds = advisorSectors.map((sector) => sector.id);

export type AdvisorSectorId = (typeof advisorSectors)[number]["id"];

export function advisorSectorName(id: string): string {
  return advisorSectors.find((sector) => sector.id === id)?.name ?? id;
}
