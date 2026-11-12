// Demo advisor directory. Idempotent: upserts by email on the demo.itsreleva.com domain
// (the domain is the demo flag; these users have no login). Run: npx tsx scripts/seed-demo-advisors.ts
import "dotenv/config";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { corporateIsComplete } from "@/lib/advisor-profile";
import { prisma } from "@/lib/db";

type Svc = "DUE_DILIGENCE" | "BUSINESS_PLAN" | "COMPANY_VALUATION" | "LEGAL_CONSULTING" | "LABOR_CONSULTING" | "TAX_CONSULTING";

type Spec = {
  name: string;
  lastName: string;
  firm: string;
  postalCode: string;
  sectors: string[];
  services: Array<[Svc, number, number]>;
  bio: string;
  verified: boolean;
  cases: Array<[string, string, string, number, number, number]>;
};

const specs: Spec[] = [
  { name: "Javier", lastName: "Ortega Ruiz", firm: "Ortega & Ruiz Corporate S.L.", postalCode: "28046", sectors: ["C", "G"], services: [["COMPANY_VALUATION", 3000, 7000], ["DUE_DILIGENCE", 6000, 14000]], bio: "Quince años en fusiones y adquisiciones de pymes industriales en Madrid. Valoro, preparo el dataroom y acompaño la negociación hasta la firma ante notario.", verified: true, cases: [["Fabricante de envases", "2025-03-18", "C", 410_000_000, 62_000_000, 380_000_000]] },
  { name: "Lucía", lastName: "Fernández Soto", firm: "Soto Legal Mercantil S.L.", postalCode: "08008", sectors: ["I", "G"], services: [["LEGAL_CONSULTING", 2500, 6000], ["DUE_DILIGENCE", 5000, 11000]], bio: "Abogada mercantilista especializada en compraventa de negocios de hostelería y retail en Cataluña. Redacto LOI y contrato y reviso contingencias laborales y fiscales.", verified: true, cases: [["Grupo de restauración", "2025-09-02", "I", 180_000_000, 24_000_000, 150_000_000]] },
  { name: "Andrés", lastName: "Molina Prieto", firm: "Molina Valoraciones S.L.", postalCode: "46004", sectors: ["F", "M"], services: [["COMPANY_VALUATION", 2000, 5000], ["BUSINESS_PLAN", 1500, 4000]], bio: "Economista y auditor. Valoraciones por múltiplos y descuento de flujos para constructoras e inmobiliarias de la Comunidad Valenciana, con informe defendible ante el comprador.", verified: true, cases: [] },
  { name: "Marta", lastName: "Iglesias Varela", firm: "Varela Asesores Fiscales S.L.", postalCode: "15003", sectors: ["A", "C"], services: [["TAX_CONSULTING", 1800, 4500], ["DUE_DILIGENCE", 4000, 9000]], bio: "Asesora fiscal en Galicia. Estructuro la venta para optimizar la tributación del vendedor (venta de participaciones vs. activos) y reviso la due diligence fiscal.", verified: true, cases: [["Conservera familiar", "2024-11-21", "C", 260_000_000, 31_000_000, 210_000_000]] },
  { name: "Pablo", lastName: "Herrera Gil", firm: "Herrera M&A Partners S.L.", postalCode: "41001", sectors: ["G", "H"], services: [["COMPANY_VALUATION", 3500, 8000], ["LEGAL_CONSULTING", 3000, 7000]], bio: "Asesor de M&A en Andalucía para empresas de distribución y logística. Busco comprador, coordino el proceso y negocio precio y garantías.", verified: false, cases: [] },
  { name: "Carmen", lastName: "Navas Lorente", firm: "Lorente Laboral S.L.", postalCode: "50001", sectors: ["C", "N"], services: [["LABOR_CONSULTING", 1200, 3500], ["DUE_DILIGENCE", 3500, 8000]], bio: "Graduada social y abogada laboralista en Aragón. Reviso plantilla, convenios y riesgos de subrogación antes de la compra para que no haya sorpresas tras el cierre.", verified: true, cases: [] },
  { name: "Sergio", lastName: "Campos Medina", firm: "Campos Finanzas Corporativas S.L.", postalCode: "48001", sectors: ["C", "D"], services: [["COMPANY_VALUATION", 4000, 9000], ["BUSINESS_PLAN", 2500, 6000]], bio: "Ex director financiero en industria vasca. Preparo plan de negocio y valoración para vendedores que quieren llegar al mercado con cifras sólidas.", verified: true, cases: [["Taller de mecanizado", "2025-05-30", "C", 520_000_000, 88_000_000, 470_000_000]] },
  { name: "Elena", lastName: "Rubio Castaño", firm: "Rubio Castaño Abogados S.L.", postalCode: "30001", sectors: ["A", "I"], services: [["LEGAL_CONSULTING", 2000, 5000], ["TAX_CONSULTING", 1500, 4000]], bio: "Despacho en Murcia con experiencia en explotaciones agrícolas y hoteles. Acompaño compradores y vendedores en la parte jurídica y fiscal de la operación.", verified: false, cases: [] },
  { name: "Raúl", lastName: "Domínguez Peña", firm: "Peña Due Diligence S.L.", postalCode: "47001", sectors: ["G", "K"], services: [["DUE_DILIGENCE", 5000, 12000], ["COMPANY_VALUATION", 3000, 6500]], bio: "Auditor de cuentas en Castilla y León. Due diligence financiera para compradores de pymes tecnológicas y de comercio, con informe claro de riesgos y ajustes al EBITDA.", verified: true, cases: [["Distribuidora de software", "2025-02-14", "K", 140_000_000, 29_000_000, 175_000_000]] },
  { name: "Nuria", lastName: "Santos Bravo", firm: "Bravo Consultoría de Empresas S.L.", postalCode: "07001", sectors: ["I", "S"], services: [["BUSINESS_PLAN", 1500, 4000], ["COMPANY_VALUATION", 2500, 6000]], bio: "Consultora en Baleares especializada en negocios turísticos y de ocio. Ayudo a ordenar las cifras, explicar la estacionalidad y preparar la ficha para compradores.", verified: true, cases: [] },
  { name: "Diego", lastName: "Vidal Aranda", firm: "Vidal Aranda Asesores S.L.", postalCode: "35001", sectors: ["G", "H"], services: [["TAX_CONSULTING", 1500, 3800], ["LABOR_CONSULTING", 1000, 3000]], bio: "Asesoría integral en Canarias: fiscalidad canaria (IGIC, ZEC), laboral y cierre de la operación para empresas de comercio y transporte.", verified: false, cases: [] },
  { name: "Isabel", lastName: "Cortés Llorente", firm: "Cortés Corporate Advisory S.L.", postalCode: "28001", sectors: ["N", "R", "K"], services: [["COMPANY_VALUATION", 5000, 12000], ["DUE_DILIGENCE", 8000, 18000], ["LEGAL_CONSULTING", 4000, 9000]], bio: "Boutique de M&A en Madrid para clínicas, consultoras y empresas de servicios profesionales. Proceso completo, de la valoración al contrato de compraventa.", verified: true, cases: [["Red de clínicas dentales", "2025-07-09", "R", 360_000_000, 72_000_000, 430_000_000], ["Consultora de ingeniería", "2024-12-12", "N", 210_000_000, 38_000_000, 240_000_000]] },
];

function cif(seed: number): string {
  const body = String(1_000_000 + seed * 7_919).padStart(7, "0").slice(-7);
  let even = 0;
  let odd = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = Number(body[i]);
    if (i % 2 === 1) even += d;
    else odd += String(d * 2).split("").reduce((s, c) => s + Number(c), 0);
  }
  return `B${body}${(10 - ((even + odd) % 10)) % 10}`;
}

function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
}

async function main(): Promise<void> {
  let count = 0;
  for (const [index, spec] of specs.entries()) {
    const email = `${slugify(spec.name)}.${slugify(spec.lastName.split(" ")[0] ?? "")}@demo.itsreleva.com`;
    const profile = {
      businessName: spec.firm,
      nif: cif(index + 11),
      postalCode: spec.postalCode,
      description: spec.bio,
      sectors: spec.sectors,
      services: spec.services.map(([serviceType, from, to]) => ({ serviceType, priceFromCents: from * 100, priceToCents: to * 100 })) as Prisma.InputJsonValue,
      closedOperations: spec.cases.map(([name, closingDate, sectorId, revenueCents, ebitdaCents, enterpriseValueCents]) => ({ name, closingDate, sectorId, revenueCents, ebitdaCents, enterpriseValueCents })) as Prisma.InputJsonValue,
      dealsAnswered: true,
      verifiedAt: spec.verified ? new Date("2026-09-01T10:00:00Z") : null,
    };
    if (!corporateIsComplete(profile)) throw new Error(`invalid demo profile ${email}`);
    const existing = await prisma.user.findFirst({ where: { email }, select: { id: true } });
    const id = existing?.id ?? randomUUID();
    const user = { name: spec.name, lastName: spec.lastName, email, emailVerified: true, role: "advisor" as const, onboardedAt: new Date(), termsAcceptedAt: new Date(), referralSource: "demo" };
    if (existing) await prisma.user.update({ where: { id }, data: user });
    else await prisma.user.create({ data: { id, ...user } });
    await prisma.advisorProfile.upsert({ where: { userId: id }, create: { userId: id, ...profile }, update: profile });
    count += 1;
  }
  const total = await prisma.user.count({ where: { email: { endsWith: "@demo.itsreleva.com" }, role: "advisor" } });
  console.log(`demo advisors upserted: ${count}; total on demo domain: ${total}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "seed failed");
    process.exit(1);
  });
