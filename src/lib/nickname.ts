/** "Proyecto Olivo" → "Olivo": cards already say it is a listing, so the prefix is noise. */
export function shortNickname(codename: string): string {
  const short = codename.replace(/^\s*proyecto\s+/i, "").trim();
  return short.length > 0 ? short : codename;
}
