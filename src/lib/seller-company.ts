export const sellerCompanyCookie = "releva-seller-project";

export function pickSellerProjectId(ids: string[], cookie: string | undefined): string | null {
  if (ids.length === 0) {
    return null;
  }

  if (cookie !== undefined && ids.includes(cookie)) {
    return cookie;
  }

  return ids[ids.length - 1] ?? null;
}

export function activeSellerChoice(
  companies: readonly { id: string; cif: string }[],
  cookie: string | undefined,
): string | null {
  const ready = companies.filter((company) => company.cif.trim().length > 0);
  const pool = ready.length > 0 ? ready : companies;

  return pickSellerProjectId(
    pool.map((company) => company.id),
    cookie,
  );
}

export function sellerCompanyLabel(legalName: string, fallback: string): string {
  const name = legalName.trim();
  return name.length > 0 ? name : fallback;
}
