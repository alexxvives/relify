import Link from "next/link";
import { DealPipeline, DealWaitingCue } from "@/components/deal-pipeline";
import { advisorCopy } from "@/lib/advisor-copy";
import type { AdvisorProjectBoard } from "@/lib/advisor-processes";
import { stepCue, type DealStep } from "@/lib/deal-pipeline";

function hireLabel(board: AdvisorProjectBoard): string {
  if (board.hiredBySeller && board.hiredByInvestor) {
    return advisorCopy.processesBoth;
  }

  return board.hiredBySeller ? advisorCopy.processesSeller : advisorCopy.processesInvestor;
}

function PendingMark({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs font-semibold text-[#b42318]">{children}</span>
  );
}

function laneCue(steps: DealStep[]) {
  const current = steps.find((step) => step.state === "current");

  if (!current) {
    return null;
  }

  return stepCue(current.id, "advisor", current.pendingLoi === true);
}

export function AdvisorProcesses({ boards }: { boards: AdvisorProjectBoard[] }) {
  if (boards.length === 0) {
    return <p className="text-sm text-[#64748b]">{advisorCopy.processesEmpty}</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {boards.map((board) => (
        <li key={board.projectId} className="rounded-3xl border border-[#e7eaee] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="text-2xl font-semibold text-[#1c2740]">{board.codename}</h2>
                {board.depositPending ? <PendingMark>{advisorCopy.depositPendingChip}</PendingMark> : null}
                {board.ndaPending ? <PendingMark>{advisorCopy.ndaToSign}</PendingMark> : null}
              </div>
              <p className="mt-1 text-sm text-[#64748b]">{board.region}</p>
              <p className="mt-2 text-sm leading-6 text-[#3d4a63]">{hireLabel(board)}</p>
              {board.services.length > 0 ? <p className="mt-1 text-sm text-[#3d4a63]">{board.services}</p> : null}
            </div>
            <Link href={board.href} className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white">
              {advisorCopy.processesOpen}
            </Link>
          </div>
          {board.note ? <p className="mt-4 text-sm text-[#64748b]">{board.note}</p> : null}
          <div className="mt-2 flex flex-col gap-2">
            {board.lanes.map((lane) => {
              const cue = laneCue(lane.steps);

              return (
                <div key={lane.key} className="border-t border-[#eef0f3] pt-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
                    <p className="text-sm font-semibold text-[#1c2740]">{lane.label}</p>
                    {cue ? <DealWaitingCue cue={cue} /> : null}
                  </div>
                  <DealPipeline steps={lane.steps} role="advisor" hideAsideCue />
                </div>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}
