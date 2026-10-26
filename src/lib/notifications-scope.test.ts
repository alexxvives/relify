import { describe, expect, it } from "vitest";
import { noticeCompanyId, scopeNoticesToCompany } from "./notifications";

const companies = [
  { id: "a", codename: "Proyecto Cala" },
  { id: "b", codename: "Proyecto Cala Norte" },
  { id: "c", codename: "Proyecto Duna" },
];
const n = (body: string, unread = true) => ({ title: "Nueva pregunta", body, unread });

describe("notice scoping per seller company", () => {
  it("matches the longest codename and respects word boundaries", () => {
    expect(noticeCompanyId(n("Proyecto Cala Norte: nueva solicitud."), companies)).toBe("b");
    expect(noticeCompanyId(n("Proyecto Cala: contrato firmado."), companies)).toBe("a");
    expect(noticeCompanyId(n("Proyecto Calamar: otra cosa."), companies)).toBeNull();
  });

  it("keeps active-company and generic notices; counts unread elsewhere", () => {
    const items = [n("Proyecto Cala: x"), n("Proyecto Duna: y"), n("Proyecto Duna: z", false), n("Tu cuenta está verificada.")];
    const { scoped, unreadElsewhere } = scopeNoticesToCompany(items, companies, "a");
    expect(scoped.map((item) => item.body)).toEqual(["Proyecto Cala: x", "Tu cuenta está verificada."]);
    expect(unreadElsewhere).toEqual({ c: 1 });
  });

  it("does nothing for a single company", () => {
    const items = [n("Proyecto Duna: y")];
    expect(scopeNoticesToCompany(items, [companies[0]], "a").scoped).toHaveLength(1);
  });
});
