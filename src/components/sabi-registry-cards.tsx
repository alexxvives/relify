import { Building2, Landmark, ShieldCheck, Tags, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { SabiHolding } from "@/lib/sabi/parse";
import type { SabiRegistry } from "@/lib/sabi/registry";
import { Card } from "@/components/ui/form";

/** t67: SABI's registry lists (governance, ownership, audits, banks, activity codes) as ficha cards. */
export const sabiRegistryCopy = {
  title: "Registro mercantil y grupo (SABI)",
  intro: "Administradores, accionistas, participadas, auditorías, bancos y códigos de actividad tal y como los publica SABI.",
  directors: "Administradores y directivos",
  shareholders: "Accionistas",
  subsidiaries: "Participadas",
  audits: "Auditoría por ejercicio",
  banks: "Bancos",
  codes: "Códigos de actividad",
  empty: "Sin datos en el informe SABI.",
};

const schemeLabels: Record<string, string> = {
  cnae2009: "CNAE 2009",
  cnae2025: "CNAE 2025",
  nace: "NACE Rev. 2",
  cae: "CAE",
  ussic: "US SIC",
  iae: "IAE",
  naics: "NAICS",
};

function isoDay(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }

  const [year, month, day] = iso.split("-");
  return day ? `${day}/${month}/${year}` : iso;
}

function extras(extra: Record<string, string> | undefined): string | null {
  const parts = Object.entries(extra ?? {})
    .filter(([key, value]) => key !== "Variación" && value.trim() !== "" && value.trim() !== "-")
    .map(([key, value]) => `${key.replace(/\*$/, "")}: ${value}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function Section({ icon, title, count, children }: { icon: ReactNode; title: string; count?: number; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1c2740]">
        {icon}
        {title}
        {count !== undefined ? <span className="rounded-full bg-[#e6f4f2] px-2 py-0.5 text-xs font-medium text-[#0f5f59]">{count}</span> : null}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-[#5c6b78]">{sabiRegistryCopy.empty}</p>;
}

function HoldingTable({ rows }: { rows: SabiHolding[] }) {
  if (rows.length === 0) {
    return <Empty />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e7eaee]">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead className="bg-[#f7f8fb] text-xs text-[#5c6b78]">
          <tr>
            <th className="px-3 py-2 font-semibold">Nombre</th>
            <th className="px-3 py-2 font-semibold">País</th>
            <th className="px-3 py-2 font-semibold">Tipo</th>
            <th className="px-3 py-2 text-right font-semibold">% directo</th>
            <th className="px-3 py-2 text-right font-semibold">% total</th>
            <th className="px-3 py-2 font-semibold">Fecha info.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const more = extras(row.extra);
            return (
              <tr key={`${row.name}-${index}`} className="border-t border-[#eef0f4] align-top text-[#1c2740]">
                <td className="px-3 py-2">
                  <span className="font-medium">{row.name}</span>
                  {more ? <span className="block text-xs text-[#5c6b78]">{more}</span> : null}
                </td>
                <td className="px-3 py-2">{row.country ?? "—"}</td>
                <td className="px-3 py-2">{row.type ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.direct ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.total ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">{isoDay(row.infoDate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function SabiRegistryCards({ registry }: { registry: SabiRegistry }) {
  const schemes = Object.entries(registry.activityCodes).filter(([, set]) => set && set.primary.length + set.secondary.length > 0);

  return (
    <Card id="panel-sabi-registry" className="scroll-mt-6">
      <h2 className="text-2xl font-semibold text-[#2b3b4a]">{sabiRegistryCopy.title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-[#64748b]">{sabiRegistryCopy.intro}</p>
      <div className="mt-5 flex flex-col gap-6">
        <Section icon={<Users className="size-4 text-[#0f766e]" aria-hidden />} title={sabiRegistryCopy.directors} count={registry.directors.length}>
          {registry.directors.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e7eaee]">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <thead className="bg-[#f7f8fb] text-xs text-[#5c6b78]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Nombre</th>
                    <th className="px-3 py-2 font-semibold">Cargo</th>
                    <th className="px-3 py-2 font-semibold">Desde</th>
                    <th className="px-3 py-2 font-semibold">Órgano</th>
                  </tr>
                </thead>
                <tbody>
                  {registry.directors.map((person, index) => (
                    <tr key={`${person.name}-${index}`} className="border-t border-[#eef0f4] text-[#1c2740]">
                      <td className="px-3 py-2 font-medium">{person.name}</td>
                      <td className="px-3 py-2">{person.role || "—"}</td>
                      <td className="px-3 py-2 tabular-nums">{isoDay(person.since)}</td>
                      <td className="px-3 py-2">{[person.group, person.department].filter(Boolean).join(" · ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
        <Section icon={<Users className="size-4 text-[#0f766e]" aria-hidden />} title={sabiRegistryCopy.shareholders} count={registry.shareholdings.length}>
          <HoldingTable rows={registry.shareholdings} />
        </Section>
        <Section icon={<Building2 className="size-4 text-[#0f766e]" aria-hidden />} title={sabiRegistryCopy.subsidiaries} count={registry.subsidiaries.length}>
          <HoldingTable rows={registry.subsidiaries} />
        </Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <Section icon={<ShieldCheck className="size-4 text-[#0f766e]" aria-hidden />} title={sabiRegistryCopy.audits} count={registry.audits.length}>
            {registry.audits.length === 0 ? (
              <Empty />
            ) : (
              <ul className="flex flex-col gap-1 text-sm text-[#1c2740]">
                {registry.audits.map((audit) => (
                  <li key={audit.year} className="tabular-nums">
                    <span className="font-medium">{audit.year}</span>
                    <span className="text-[#5c6b78]"> · cierre {isoDay(audit.closingOn)}</span>
                    {audit.opinion ? ` · ${audit.opinion}` : ""}
                    {audit.auditorName || audit.auditorCode ? ` · ${[audit.auditorName, audit.auditorCode].filter(Boolean).join(" · ")}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section icon={<Landmark className="size-4 text-[#0f766e]" aria-hidden />} title={sabiRegistryCopy.banks} count={registry.banks.length}>
            {registry.banks.length === 0 ? (
              <Empty />
            ) : (
              <ul className="flex flex-col gap-1 text-sm text-[#1c2740]">
                {registry.banks.map((bank) => (
                  <li key={bank}>{bank}</li>
                ))}
              </ul>
            )}
          </Section>
        </div>
        <Section icon={<Tags className="size-4 text-[#0f766e]" aria-hidden />} title={sabiRegistryCopy.codes}>
          {schemes.length === 0 ? (
            <Empty />
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {schemes.map(([scheme, set]) => (
                <div key={scheme} className="min-w-0">
                  <dt className="text-xs font-medium text-[#5c6b78]">{schemeLabels[scheme] ?? scheme.toUpperCase()}</dt>
                  <dd className="text-[#1c2740]">
                    {[...set!.primary.map((code) => ({ ...code, main: true })), ...set!.secondary.map((code) => ({ ...code, main: false }))].map((code, index) => (
                      <span key={`${code.code}-${index}`} className="block">
                        <span className="font-medium tabular-nums">{code.code}</span> {code.description}
                        {code.main ? <span className="ml-1 text-xs text-[#0f766e]">principal</span> : null}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Section>
      </div>
    </Card>
  );
}
