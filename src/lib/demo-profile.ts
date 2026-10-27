export const investorPhotoPath = "/investors/family-office.svg";

export type InvestorProfileDraft = {
  photo: string;
  city: string;
  province: string;
  investorType: string;
  ticket: string;
  sectors: string;
  thesis: string;
  contribution: string;
  stake: string;
};

export type DemoInvestorProfile = InvestorProfileDraft & {
  tradeName: string;
  nif: string;
  postal: string;
};

const profiles: Record<string, DemoInvestorProfile> = {
  "inversor@itsreleva.com": {
    tradeName: "Mesa Familiar Demo",
    nif: "B11111119",
    postal: "46001",
    photo: investorPhotoPath,
    city: "Valencia",
    province: "Comunidad Valenciana",
    investorType: "Family office",
    ticket: "Entre 1 y 3 millones",
    sectors: "Alimentación y comercio de proximidad",
    thesis:
      "Busco una pyme rentable en alimentación o comercio para continuarla, con cuentas de tres años y un equipo que se quede.",
    contribution: "Capital paciente y continuidad del equipo. No busco un relevo inmediato de la gestión.",
    stake: "Mayoría",
  },
};

export function demoInvestorProfile(email: string): DemoInvestorProfile | null {
  return profiles[email] ?? null;
}

export type PublicInvestorCard = {
  photo: string;
  investorType: string;
  place: string;
  ticket: string;
  sectors: string;
  thesis: string;
  contribution: string;
  stake: string;
};

export function publicCardFromDraft(draft: InvestorProfileDraft): PublicInvestorCard | null {
  const filled = [draft.investorType, draft.city, draft.thesis, draft.contribution].some((value) => value.trim().length > 0);

  if (!filled) {
    return null;
  }

  const place = [draft.city.trim(), draft.province.trim()].filter((part) => part.length > 0).join(", ");

  return {
    photo: draft.photo.trim(),
    investorType: draft.investorType.trim(),
    place,
    ticket: draft.ticket.trim(),
    sectors: draft.sectors.trim(),
    thesis: draft.thesis.trim(),
    contribution: draft.contribution.trim(),
    stake: draft.stake.trim(),
  };
}

export function publicInvestorCard(email: string): PublicInvestorCard | null {
  const profile = profiles[email];

  if (!profile) {
    return null;
  }

  return publicCardFromDraft(profile);
}

export function investorProfileChecks(draft: InvestorProfileDraft): {
  photo: boolean;
  place: boolean;
  kind: boolean;
  search: boolean;
  offer: boolean;
} {
  return {
    photo: draft.photo.trim().length > 0,
    place: draft.city.trim().length > 0 && draft.province.trim().length > 0,
    kind: draft.investorType.trim().length > 0 && draft.ticket.trim().length > 0,
    search: draft.thesis.trim().length > 0 && draft.sectors.trim().length > 0,
    offer: draft.contribution.trim().length > 0,
  };
}
