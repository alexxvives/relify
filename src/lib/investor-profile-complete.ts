/** A buyer may request connections only once sellers can read who they are: type, ticket, sectors and how they invest. */
export function investorProfileIsComplete(draft: { investorType: string; ticket: string; sectors: string; thesis: string }): boolean {
  return [draft.investorType, draft.ticket, draft.sectors, draft.thesis].every((value) => value.trim().length > 0);
}
