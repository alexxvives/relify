export type DemoInvestorProfile = {
  tradeName: string;
  nif: string;
  postal: string;
  investorType: string;
  trajectory: string;
};

const profiles: Record<string, DemoInvestorProfile> = {
  "inversor@itsreleva.com": {
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
