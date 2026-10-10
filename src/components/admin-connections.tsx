import Link from "next/link";
import { adminCopy } from "@/lib/admin-copy";
import type { AdminConnectionRow } from "@/server/listAdminConnections";

const when = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "Europe/Madrid" });

export function AdminConnections({ connections }: { connections: AdminConnectionRow[] }) {
  if (connections.length === 0) {
    return <p className="text-sm text-[#667085]">{adminCopy.empty}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {connections.map((connection) => (
        <li key={connection.id} className="flex flex-col gap-2 rounded-2xl border border-[#e7eaee] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-[#1c2740]">{connection.codename}</p>
            <p className="mt-1 text-sm text-[#667085]">{connection.investorEmail}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-sm text-[#3d4a63]">
              {connection.accepted ? adminCopy.accepted : adminCopy.waiting}
              {" · "}
              {connection.nda ? adminCopy.ndaYes : adminCopy.ndaNo}
              {" · "}
              {when.format(connection.requestedAt)}
            </p>
            <Link href={`/admin/chat/${connection.id}`} className="text-sm font-medium text-[#465ab4]">
              {adminCopy.readChat}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
