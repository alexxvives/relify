import { CheckCircle2, Circle } from "lucide-react";
import type { AdminPublishChecks, PublishChecklist } from "@/lib/publish-checklist";

/** t75: admin-only view of what approval needs. The server enforces the same checks in approveProject. */
export function AdminPublishChecksCard({
  checks,
  status,
}: {
  checks: { seller: PublishChecklist; admin: AdminPublishChecks };
  status: "draft" | "pending" | "published";
}) {
  const ready = checks.seller.ready && checks.admin.ready;
  const groups = [
    { title: "Del vendedor", list: checks.seller },
    { title: "Nuestras comprobaciones", list: checks.admin },
  ];

  return (
    <section aria-labelledby="admin-publish-checks" className="rounded-2xl border border-[#e6e9f0] bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="admin-publish-checks" className="text-base font-semibold text-[#1c2740]">
          Revisión para publicar
        </h2>
        <span className={`text-sm font-medium ${ready ? "text-[#0f766e]" : "text-[#5b6578]"}`}>
          {ready ? (status === "pending" ? "Lista para aprobar" : "Todo correcto") : "Aún no se puede aprobar"}
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#5b6578]">{group.title}</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {group.list.items.map((item) => (
                <li key={item.key} className="flex items-start gap-2 text-sm text-[#1c2740]">
                  {item.done ? (
                    <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-[#0f766e]" />
                  ) : (
                    <Circle aria-hidden className="mt-0.5 size-4 shrink-0 text-[#9aa3b5]" />
                  )}
                  <span>
                    {item.label}
                    <span className="sr-only">{item.done ? ": hecho" : ": pendiente"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
