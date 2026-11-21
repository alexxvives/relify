import { advisorCopy } from "./advisor-copy";
import { dealPipeline, processFlags, stepCue, type DealStep, type StepCue } from "./deal-pipeline";
import { labelAccesses } from "./project-message";

/** S37: paid (or closed) encargos open under Mis procesos, unpaid ones under Encargos. */
export function advisorEngagementHref(id: string, paid: boolean): string {
  return paid ? `/mandatos/venta/${id}` : `/mandatos/encargos/${id}`;
}

export type AdvisorAccessSnapshot = {
  investorId: string;
  requestedAt: Date;
  accepted: boolean;
  nda: boolean;
  questions: boolean;
  meeting: boolean;
  offer: boolean;
  loiAccepted: boolean;
  /** Buyer's real name once the seller has accepted them. */
  connectedName?: string | null;
};

export type AdvisorEngagementSnapshot = {
  id: string;
  client: "investor" | "seller";
  requesterId: string;
  services: string;
  depositPaid: boolean;
  advisorNda: boolean;
  processOpened: boolean;
  closed: boolean;
  projectId: string;
  slug: string;
  codename: string;
  region: string;
  saleClosed: boolean;
  accesses: AdvisorAccessSnapshot[];
};

export type AdvisorProcessLane = {
  key: string;
  label: string;
  steps: DealStep[];
  signNdaId: string | null;
  ndaText: string | null;
};

export type AdvisorProjectBoard = {
  projectId: string;
  codename: string;
  region: string;
  services: string[];
  href: string;
  hiredBySeller: boolean;
  hiredByInvestor: boolean;
  depositPending: boolean;
  advisorNda: boolean;
  ndaPending: boolean;
  lanes: AdvisorProcessLane[];
  note: string | null;
};

export function advisorLaneCue(steps: readonly DealStep[], signNda: boolean): StepCue | null {
  if (signNda) {
    return { yours: true, action: advisorCopy.signNda };
  }

  const current = steps.find((step) => step.state === "current");

  if (!current) {
    return null;
  }

  return stepCue(current.id, "advisor", current.pendingLoi === true);
}

function laneSteps(access: AdvisorAccessSnapshot, saleClosed: boolean): DealStep[] {
  return dealPipeline(
    "advisor",
    processFlags({
      accepted: access.accepted,
      nda: access.nda,
      questions: access.questions,
      meeting: access.meeting,
      offer: access.offer,
      loiAccepted: access.loiAccepted,
      closed: saleClosed,
    }),
  );
}

/** An advisor hire is only valid once that deal is in Q&A (NDA signed). */
export function engagementReachedQa(row: AdvisorEngagementSnapshot): boolean {
  if (row.client === "investor") {
    return row.accesses.some((access) => access.investorId === row.requesterId && access.nda);
  }

  return row.accesses.some((access) => access.nda);
}

export function advisorProjectBoards(rows: readonly AdvisorEngagementSnapshot[]): AdvisorProjectBoard[] {
  const eligible = rows.filter(engagementReachedQa);
  const byProject = new Map<string, AdvisorEngagementSnapshot[]>();

  for (const row of eligible) {
    const list = byProject.get(row.projectId) ?? [];
    list.push(row);
    byProject.set(row.projectId, list);
  }

  const boards: AdvisorProjectBoard[] = [];

  for (const group of byProject.values()) {
    const first = group[0];

    if (!first) {
      continue;
    }

    const seller = group.find((row) => row.client === "seller");
    const investorRows = group.filter((row) => row.client === "investor");
    const labeled = labelAccesses(first.accesses.map((access) => ({ ...access, projectId: first.projectId })));
    const lanes: AdvisorProcessLane[] = [];
    const seen = new Set<string>();

    if (seller?.processOpened) {
      for (const access of labeled) {
        if (!access.nda) {
          continue;
        }

        lanes.push({
          key: `${access.label}-${lanes.length}`,
          label: access.label,
          steps: laneSteps(access, first.saleClosed),
          signNdaId: null,
          ndaText: null,
        });
        seen.add(access.investorId);
      }
    }

    for (const row of investorRows) {
      if (seen.has(row.requesterId)) {
        continue;
      }

      const access = labeled.find((item) => item.investorId === row.requesterId) ?? {
        investorId: row.requesterId,
        requestedAt: new Date(0),
        accepted: false,
        nda: false,
        questions: false,
        meeting: false,
        offer: false,
        loiAccepted: false,
      };

      if (!access.nda) {
        continue;
      }

      lanes.push({
        key: `comprador-${lanes.length}`,
        // S42 (Alex): the client's real name, "Comprador" only when the account has none.
        label: ("connectedName" in access ? access.connectedName?.trim() : "") || advisorCopy.buyerLane,
        steps: laneSteps(access, first.saleClosed),
        signNdaId: row.depositPaid && !row.advisorNda && !row.closed ? row.id : null,
        ndaText: null,
      });
      seen.add(row.requesterId);
    }

    const depositPending = group.some((row) => !row.depositPaid && !row.closed);
    let note: string | null = null;

    if (lanes.length === 0 && seller?.closed && !seller.processOpened) {
      note = advisorCopy.processesClosed;
    } else if (lanes.length === 0 && group.every((row) => row.closed)) {
      note = advisorCopy.processesFinished;
    } else if (lanes.length === 0 && seller && !seller.processOpened) {
      note = advisorCopy.processesWait;
    } else if (lanes.length === 0 && depositPending) {
      note = advisorCopy.processesDeposit;
    } else if (lanes.length === 0) {
      note = advisorCopy.processesNone;
    }

    const focus =
      group.find((row) => row.depositPaid && !row.closed) ??
      group.find((row) => row.depositPaid) ??
      group.find((row) => !row.depositPaid && !row.closed) ??
      seller ??
      investorRows[0] ??
      first;
    const services = [
      ...new Set(
        group.flatMap((row) =>
          row.services
            .split(/[·,]/)
            .map((service) => service.trim())
            .filter((service) => service.length > 0),
        ),
      ),
    ];

    boards.push({
      projectId: first.projectId,
      codename: first.codename,
      region: first.region,
      services,
      href: advisorEngagementHref(focus.id, focus.depositPaid || focus.closed),
      hiredBySeller: seller !== undefined,
      hiredByInvestor: investorRows.length > 0,
      depositPending,
      advisorNda: investorRows.length > 0 && investorRows.every((row) => row.advisorNda),
      ndaPending: investorRows.some((row) => row.depositPaid && !row.advisorNda),
      lanes,
      note,
    });
  }

  return boards.sort((left, right) => left.codename.localeCompare(right.codename, "es"));
}

export function splitAdvisorEngagements(rows: readonly AdvisorEngagementSnapshot[]): {
  awaiting: AdvisorEngagementSnapshot[];
  active: AdvisorEngagementSnapshot[];
} {
  return {
    awaiting: rows.filter((row) => !row.depositPaid && !row.closed),
    active: rows.filter((row) => row.depositPaid || row.closed),
  };
}
