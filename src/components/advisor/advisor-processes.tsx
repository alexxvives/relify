import Link from "next/link";
import { AdvisorNdaTurn } from "@/components/advisor/advisor-engagement-forms";
import { DealPipeline, DealWaitingCue } from "@/components/investor/deal-pipeline";
import { advisorCopy } from "@/lib/advisor-copy";
import { advisorLaneCue, type AdvisorProjectBoard } from "@/lib/advisor-processes";

function hireTags(board: AdvisorProjectBoard): string[] {
  if (board.hiredBySeller && board.hiredByInvestor) {
    return [advisorCopy.hiredByBoth];
  }
  if (board.hiredBySeller) {
    return [advisorCopy.hiredBySeller];
  }
  if (board.hiredByInvestor) {
    return [advisorCopy.hiredByInvestor];
  }
  return [];
}

function PendingMark({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs font-semibold text-[#b42318]">{children}</span>
  );
}

export function AdvisorProcesses({ boards, empty = advisorCopy.processesEmpty }: { boards: AdvisorProjectBoard[]; empty?: string }) {
  if (boards.length === 0) {
    return <p className="text-sm text-[#64748b]">{empty}</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {boards.map((board) => (
        <li key={board.projectId} className="rounded-3xl border border-[#e7eaee] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="text-2xl font-semibold text-[#1c2740]">{board.codename}</h2>
                {hireTags(board).map((tag) => (
                  <span key={tag} className="rounded-full bg-[#f4f6f8] px-3 py-1 text-xs font-medium text-[#3d4a63]">
                    {tag}
                  </span>
                ))}
                {board.services.map((service) => (
                  <span key={service} className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#3d34b8]">
                    {service}
                  </span>
                ))}
                {board.depositPending ? <PendingMark>{advisorCopy.depositPendingChip}</PendingMark> : null}
              </div>
              <p className="mt-1 text-sm text-[#64748b]">{board.region}</p>
            </div>
            <Link href={board.href} className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white">
              {advisorCopy.processesOpen}
            </Link>
          </div>
          {board.note ? <p className="mt-4 text-sm text-[#64748b]">{board.note}</p> : null}
          <div className="mt-2 flex flex-col gap-2">
            {board.lanes.map((lane) => {
              const cue = advisorLaneCue(lane.steps, lane.signNdaId !== null);

              return (
                <div key={lane.key} className="border-t border-[#eef0f3] pt-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
                    <p className="text-sm font-semibold text-[#1c2740]">{lane.label}</p>
                    {cue?.yours && lane.signNdaId && lane.ndaText ? (
                      <AdvisorNdaTurn engagementId={lane.signNdaId} text={lane.ndaText} />
                    ) : cue ? (
                      <DealWaitingCue cue={cue} />
                    ) : null}
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
