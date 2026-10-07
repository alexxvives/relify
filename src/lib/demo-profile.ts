export type DemoInvestorProfile = {
  tradeName: string;
  nif: string;
  postal: string;
  investorType: string;
  trajectory: string;
};

const profiles: Record<string, DemoInvestorProfile> = {
  "inversor@itsreleva.com": {
    tradeName: "Norte Industrial S.L.",
    nif: "A00000000",
    postal: "28001",
    investorType: "Industrial",
    trajectory:
      "Compro talleres y negocios de servicios con equipo estable, facturación entre 500 mil y 2 millones, y un relevo de propiedad ordenado.",
  },
  "comprador@itsreleva.com": {
    tradeName: "Mesa Familiar Demo",
    nif: "B11111119",
    postal: "46001",
    investorType: "Family office",
    trajectory:
      "Busco una pyme rentable en alimentación o comercio para continuarla, con cuentas de tres años y un equipo que se quede.",
  },
};

export function demoInvestorProfile(email: string): DemoInvestorProfile | null {
  return profiles[email] ?? null;
}
