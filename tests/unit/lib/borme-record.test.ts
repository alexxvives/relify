import { describe, expect, it } from "vitest";
import { parseBormeCompany, parseBormeSearch, registryCompanyFromBorme } from "@/lib/borme-record";

const mercadonaHit = {
  slug: "mercadona-sa",
  name: "MERCADONA SA",
  cif: "A46103834",
  province: "Valencia",
  cnae_code: null,
};

describe("parseBormeSearch", () => {
  it("keeps the item whose CIF matches and ignores a bulletin that does not list it", () => {
    const hit = parseBormeSearch({ items: [mercadonaHit] }, "a46103834");
    const miss = parseBormeSearch({ count: 0, items: [] }, "A46103834");
    const broken = parseBormeSearch({ unexpected: true }, "A46103834");

    expect(hit).toEqual({ ok: true, hit: mercadonaHit });
    expect(miss).toEqual({ ok: true, hit: null });
    expect(broken).toEqual({ ok: false });
  });
});

describe("registryCompanyFromBorme", () => {
  it("fills identity from the bulletin and leaves the accounts empty", () => {
    const file = parseBormeCompany({
      company: {
        name: "MERCADONA SA",
        cif: "A46103834",
        address: "",
        date_creation: "",
        workers: "",
      },
      events: [
        {
          date: "2009-01-23",
          type: "Nombramientos",
          province: "Valencia",
          details: "Nombramientos. Apoderado: RAMOS CANCELA FRANCISCO-JAVIER.",
        },
        {
          date: "2025-03-17",
          type: "Reelecciones",
          province: "Valencia",
          details:
            "Reelecciones. consejero: HERRERO CHACON HORTENSIA MARIA. Cambio de domicilio social: C/ ALFONSO ROIG ALFONSO S/N (ALBALAT DELS SORELLS).",
        },
      ],
    });

    const record = registryCompanyFromBorme("A46103834", mercadonaHit, file);

    expect(record?.legalName).toBe("MERCADONA SA");
    expect(record?.address).toBe("C/ ALFONSO ROIG ALFONSO S/N (ALBALAT DELS SORELLS), Valencia");
    expect(record?.address).not.toContain("RAMOS");
    expect(record?.address).not.toContain("HERRERO");
    expect(record?.region).toBe("Valencia");
    expect(record?.foundedYear).toBeNull();
    expect(record?.description).toBe("");
    expect(record?.principalCnae).toBe("");
    expect(record?.revenueCents).toBeNull();
    expect(record?.ebitdaCents).toBeNull();
    expect(record?.adjustedEbitdaCents).toBeNull();
    expect(record?.headcount).toBeNull();
    expect(record?.codename.startsWith("Proyecto ")).toBe(true);
    expect(record?.codename).not.toContain("MERCADONA");
  });

  it("reads a constitution year, a dotted CNAE, and a worker count when the bulletin has them", () => {
    const record = registryCompanyFromBorme(
      "B12345674",
      {
        slug: "ejemplo-sl",
        name: "EJEMPLO SL",
        cif: "B12345674",
        province: "Madrid",
        cnae_code: "4711",
      },
      {
        company: {
          date_creation: "",
          workers: "8",
        },
        events: [
          {
            date: "2018-05-04",
            type: "Constitución",
            details: "Constitución. Domicilio: CALLE MAYOR 2 (MADRID). Datos registrales. T 1.",
          },
        ],
      },
    );

    expect(record?.foundedYear).toBe(2018);
    expect(record?.principalCnae).toBe("47.11");
    expect(record?.headcount).toBe("band_6_10");
    expect(record?.address).toBe("CALLE MAYOR 2 (MADRID)");
    expect(record?.revenueCents).toBeNull();
  });
});
