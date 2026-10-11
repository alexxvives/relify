import Link from "next/link";
import { DealPipeline } from "@/components/deal-pipeline";
import { advisorCopy } from "@/lib/advisor-copy";
import type { AdvisorProjectBoard } from "@/lib/advisor-processes";

function hireLabel(board: AdvisorProjectBoard): string {
  if (board.hiredBySeller && board.hiredByInvestor) {
    return advisorCopy.processesBoth;
  }

  return board.hiredBySeller ? advisorCopy.processesSeller : advisorCopy.processesInvestor;
}

function Chip({ children, tone }: { children: string; tone: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{children}</span>;
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
              <h2 className="text-2xl font-semibold text-[#1c2740]">{board.codename}</h2>
              <p className="mt-1 text-sm text-[#64748b]">{board.region}</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3d4a63]">{hireLabel(board)}</p>
              {board.services.length > 0 ? <p className="mt-1 text-sm text-[#3d4a63]">{board.services}</p> : null}
            </div>
            <Link href={board.href} className="inline-flex h-10 items-center rounded-full bg-[#465ab4] px-4 text-sm font-medium text-white">
              {advisorCopy.processesOpen}
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip tone={board.depositPending ? "bg-[#fff4d6] text-[#8a6112]" : "bg-[#e8f6ee] text-[#17663a]"}>
              {board.depositPending ? advisorCopy.depositPendingChip : advisorCopy.depositPaidChip}
            </Chip>
            {board.advisorNda ? <Chip tone="bg-[#e8f6ee] text-[#17663a]">{advisorCopy.ndaSignedChip}</Chip> : null}
            {board.ndaPending ? <Chip tone="bg-[#eef2ff] text-[#3d34b8]">{advisorCopy.ndaPendingChip}</Chip> : null}
          </div>
          {board.note ? <p className="mt-4 text-sm text-[#64748b]">{board.note}</p> : null}
          <div className="mt-2 flex flex-col gap-4">
            {board.lanes.map((lane) => (
              <div key={lane.key} className="rounded-2xl bg-[#f7f8fb] px-3 py-3">
                <p className="px-1 text-sm font-semibold text-[#1c2740]">{lane.label}</p>
                <DealPipeline steps={lane.steps} role="advisor" hideWaitingCue />
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
