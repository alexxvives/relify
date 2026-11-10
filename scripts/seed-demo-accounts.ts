import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

const password = "@Releva1z2x";
const projectId = "demo-project-cala";
const projectSlug = "proyecto-cala";

type RoleName = "investor" | "seller" | "advisor" | "admin";

type DemoAccount = {
  email: string;
  aliases: string[];
  name: string;
  lastName: string;
  phone: string;
  nationalId: string;
  role: RoleName;
};

const retiredBuyerEmails = ["inversor.ui@example.com"];

const accounts: DemoAccount[] = [
  {
    email: "inversor@itsreleva.com",
    aliases: ["comprador@itsreleva.com"],
    name: "Martín",
    lastName: "Soler",
    phone: "+34610000002",
    nationalId: "B11111119",
    role: "investor",
  },
  {
    email: "vendedor@itsreleva.com",
    aliases: ["vendedor.borrador@example.com"],
    name: "Elena",
    lastName: "Castro",
    phone: "+34610000003",
    nationalId: "B00000000",
    role: "seller",
  },
  {
    email: "asesor@itsreleva.com",
    aliases: [],
    name: "Irene",
    lastName: "Navarro",
    phone: "+34610000005",
    nationalId: "A33333337",
    role: "advisor",
  },
  {
    email: "admin@itsreleva.com",
    aliases: [],
    name: "Clara",
    lastName: "Vega",
    phone: "+34610000004",
    nationalId: "A11111111",
    role: "admin",
  },
];

async function upsertAccount(spec: DemoAccount, passwordHash: string): Promise<string> {
  const byEmail = await prisma.user.findUnique({ where: { email: spec.email }, select: { id: true } });
  const byAlias =
    byEmail === null && spec.aliases.length > 0
      ? await prisma.user.findFirst({ where: { email: { in: spec.aliases } }, select: { id: true } })
      : null;
  const id = byEmail?.id ?? byAlias?.id ?? randomUUID();
  const data = {
    name: spec.name,
    lastName: spec.lastName,
    email: spec.email,
    emailVerified: true,
    phone: spec.phone,
    nationalId: spec.nationalId,
    role: spec.role,
    onboardedAt: new Date(),
    referralSource: "search",
  };

  if (byEmail || byAlias) {
    await prisma.user.update({ where: { id }, data });
  } else {
    await prisma.user.create({ data: { id, ...data } });
  }

  const credential = await prisma.account.findFirst({
    where: { userId: id, providerId: "credential" },
    select: { id: true },
  });

  if (credential) {
    await prisma.account.update({
      where: { id: credential.id },
      data: { password: passwordHash, accountId: id },
    });
  } else {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: passwordHash,
      },
    });
  }

  return id;
}

async function keepRicherRow(
  retiredId: string,
  buyerId: string,
  rows: { id: string; projectId: string }[],
  findKept: (projectId: string) => Promise<{ id: string } | null>,
  remove: (id: string) => Promise<unknown>,
  reassign: (id: string) => Promise<unknown>,
): Promise<void> {
  for (const row of rows) {
    if (retiredId === buyerId) {
      return;
    }
    const kept = await findKept(row.projectId);
    if (kept && kept.id !== row.id) {
      await remove(row.id);
    } else if (!kept) {
      await reassign(row.id);
    }
  }
}

async function giveBuyerTheDemo(retiredId: string, buyerId: string): Promise<void> {
  const accesses = await prisma.projectAccess.findMany({
    where: { investorId: retiredId },
    select: { id: true, projectId: true, requestedAt: true, sellerAcceptedAt: true, ndaAcceptedAt: true },
  });

  for (const access of accesses) {
    const kept = await prisma.projectAccess.findUnique({
      where: { projectId_investorId: { projectId: access.projectId, investorId: buyerId } },
      select: { id: true, requestedAt: true, sellerAcceptedAt: true, ndaAcceptedAt: true },
    });
    await prisma.projectMessage.updateMany({
      where: { investorId: retiredId, projectId: access.projectId },
      data: { investorId: buyerId },
    });
    if (kept) {
      await prisma.projectAccess.update({
        where: { id: kept.id },
        data: {
          requestedAt: kept.requestedAt < access.requestedAt ? kept.requestedAt : access.requestedAt,
          sellerAcceptedAt: kept.sellerAcceptedAt ?? access.sellerAcceptedAt,
          ndaAcceptedAt: kept.ndaAcceptedAt ?? access.ndaAcceptedAt,
        },
      });
      await prisma.projectAccess.delete({ where: { id: access.id } });
    } else {
      await prisma.projectAccess.update({ where: { id: access.id }, data: { investorId: buyerId } });
    }
  }

  await prisma.projectMessage.updateMany({ where: { investorId: retiredId }, data: { investorId: buyerId } });

  const favorites = await prisma.projectFavorite.findMany({
    where: { investorId: retiredId },
    select: { id: true, projectId: true },
  });
  await keepRicherRow(
    retiredId,
    buyerId,
    favorites,
    (projectId) =>
      prisma.projectFavorite.findUnique({
        where: { projectId_investorId: { projectId, investorId: buyerId } },
        select: { id: true },
      }),
    (id) => prisma.projectFavorite.delete({ where: { id } }),
    (id) => prisma.projectFavorite.update({ where: { id }, data: { investorId: buyerId } }),
  );

  const grants = await prisma.dataRoomGrant.findMany({
    where: { investorId: retiredId },
    select: { id: true, projectId: true },
  });
  await keepRicherRow(
    retiredId,
    buyerId,
    grants,
    (projectId) =>
      prisma.dataRoomGrant.findUnique({
        where: { projectId_investorId: { projectId, investorId: buyerId } },
        select: { id: true },
      }),
    (id) => prisma.dataRoomGrant.delete({ where: { id } }),
    (id) => prisma.dataRoomGrant.update({ where: { id }, data: { investorId: buyerId } }),
  );

  const shares = await prisma.dataRoomFileShare.findMany({
    where: { investorId: retiredId },
    select: { id: true, fileId: true },
  });
  for (const share of shares) {
    const kept = await prisma.dataRoomFileShare.findUnique({
      where: { fileId_investorId: { fileId: share.fileId, investorId: buyerId } },
      select: { id: true },
    });
    if (kept) {
      await prisma.dataRoomFileShare.delete({ where: { id: share.id } });
    } else {
      await prisma.dataRoomFileShare.update({ where: { id: share.id }, data: { investorId: buyerId } });
    }
  }

  await prisma.notification.updateMany({ where: { userId: retiredId }, data: { userId: buyerId } });
  await prisma.advisoryQuote.updateMany({ where: { investorId: retiredId }, data: { investorId: buyerId } });
  await prisma.project.updateMany({ where: { ownerId: retiredId }, data: { ownerId: null } });
  await prisma.user.delete({ where: { id: retiredId } });
}

async function ensureAdvisorDesk(advisorId: string): Promise<void> {
  const services: Prisma.InputJsonValue = [
    { serviceType: "COMPANY_VALUATION", priceFromCents: 250_000, priceToCents: 600_000 },
    { serviceType: "DUE_DILIGENCE", priceFromCents: 400_000, priceToCents: 900_000 },
  ];
  const profile = {
    businessName: "Navarro Advisory S.L.",
    nif: "A33333337",
    postalCode: "08001",
    description:
      "Asesoría de compraventa de pymes. Acompaño al propietario desde la ficha hasta el cierre, con la identidad de la empresa fuera del escaparate.",
    sectors: ["C", "G"],
    services,
    closedOperations: [
      {
        name: "Obrador familiar",
        closingDate: "2025-06-12",
        sectorId: "C",
        revenueCents: 92_000_000,
        ebitdaCents: 18_000_000,
        enterpriseValueCents: 120_000_000,
      },
      {
        name: "Taller de proximidad",
        closingDate: "2025-11-03",
        sectorId: "G",
        revenueCents: 64_000_000,
        ebitdaCents: 9_000_000,
        enterpriseValueCents: 48_000_000,
      },
    ] as Prisma.InputJsonValue,
    dealsAnswered: true,
  };

  await prisma.advisorProfile.upsert({
    where: { userId: advisorId },
    create: { userId: advisorId, ...profile },
    update: profile,
  });

  const projectId = "demo-project-nube";
  const company = {
    slug: "proyecto-nube",
    codename: "Proyecto Nube",
    region: "Cataluña",
    revenueCents: 64_000_000,
    ebitdaCents: 9_000_000,
    adjustedEbitdaCents: 8_000_000,
    askingPriceCents: 48_000_000,
    netIncomeCents: 0,
    legalName: "Taller Nube Demo S.L.",
    cif: "B77777779",
    address: "Carrer Demo 8, 08001 Barcelona",
    status: "draft" as const,
    ownerId: advisorId,
  };

  await prisma.project.upsert({
    where: { id: projectId },
    create: { id: projectId, ...company },
    update: company,
  });
  await prisma.saleMandate.upsert({
    where: { advisorId_projectId: { advisorId, projectId } },
    create: { id: "demo-mandate-nube", advisorId, projectId },
    update: {},
  });
}

async function main(): Promise<void> {
  const passwordHash = await hashPassword(password);
  const ids = new Map<string, string>();

  for (const account of accounts) {
    ids.set(account.email, await upsertAccount(account, passwordHash));
  }

  const sellerId = ids.get("vendedor@itsreleva.com");
  const buyerId = ids.get("inversor@itsreleva.com");
  const advisorId = ids.get("asesor@itsreleva.com");

  if (!sellerId || !buyerId || !advisorId) {
    throw new Error("Demo accounts were not created");
  }

  for (const email of retiredBuyerEmails) {
    const retired = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (retired && retired.id !== buyerId) {
      await giveBuyerTheDemo(retired.id, buyerId);
    }
  }

  await ensureAdvisorDesk(advisorId);

  await prisma.project.upsert({
    where: { id: projectId },
    create: {
      id: projectId,
      slug: projectSlug,
      codename: "Proyecto Cala",
      region: "Andalucía",
      revenueCents: 92_000_000,
      ebitdaCents: 18_000_000,
      adjustedEbitdaCents: 16_000_000,
      askingPriceCents: 120_000_000,
      netIncomeCents: 9_800_000,
      legalName: "Horno de la Cala S.L.",
      cif: "B00000000",
      address: "Calle Demo 4, 41001 Sevilla",
      foundedYear: 2012,
      description: "Obrador de barrio con tienda propia y venta a cafeterías. El equipo se queda.",
      opexCents: 21_000_000,
      headcountRange: "band_6_10",
      status: "published",
      ownerId: sellerId,
    },
    update: {
      slug: projectSlug,
      codename: "Proyecto Cala",
      region: "Andalucía",
      revenueCents: 92_000_000,
      ebitdaCents: 18_000_000,
      adjustedEbitdaCents: 16_000_000,
      askingPriceCents: 120_000_000,
      netIncomeCents: 9_800_000,
      legalName: "Horno de la Cala S.L.",
      cif: "B00000000",
      address: "Calle Demo 4, 41001 Sevilla",
      foundedYear: 2012,
      description: "Obrador de barrio con tienda propia y venta a cafeterías. El equipo se queda.",
      opexCents: 21_000_000,
      headcountRange: "band_6_10",
      status: "published",
      ownerId: sellerId,
    },
  });

  await prisma.projectCnae.deleteMany({ where: { projectId } });
  await prisma.activitySlice.deleteMany({ where: { projectId } });
  await prisma.projectYear.deleteMany({ where: { projectId } });
  await prisma.dataRoomFile.deleteMany({ where: { projectId } });

  await prisma.projectCnae.createMany({
    data: [
      { id: "demo-cala-cnae-1", projectId, code: "10.71", role: "principal", position: 1 },
      { id: "demo-cala-cnae-2", projectId, code: "10.72", role: "secondary", position: 1 },
    ],
  });
  await prisma.activitySlice.createMany({
    data: [
      { id: "demo-cala-cap-1", projectId, kind: "capital", position: 1, basisPoints: 10000 },
      { id: "demo-cala-pro-1", projectId, kind: "product", position: 1, basisPoints: 7000 },
      { id: "demo-cala-pro-2", projectId, kind: "product", position: 2, basisPoints: 3000 },
      { id: "demo-cala-cli-1", projectId, kind: "client", position: 1, basisPoints: 6000 },
      { id: "demo-cala-cli-2", projectId, kind: "client", position: 2, basisPoints: 4000 },
    ],
  });
  await prisma.projectYear.createMany({
    data: [2022, 2023, 2024].map((year, index) => ({
      id: `demo-cala-year-${year}`,
      projectId,
      year,
      kind: "closed" as const,
      salesCents: 74_000_000 + index * 9_000_000,
      staffCostsCents: 22_000_000,
      suppliesCents: 31_000_000,
      amortizationCents: 2_400_000,
      currentAssetsCents: 18_000_000,
      cashCents: 4_200_000,
      nonCurrentAssetsCents: 27_000_000,
      equityCents: 19_000_000,
      currentLiabilitiesCents: 8_000_000,
      longTermDebtCents: 4_500_000,
    })),
  });
  await prisma.projectYear.create({
    data: {
      id: "demo-cala-year-2025",
      projectId,
      year: 2025,
      kind: "forecast",
      salesCents: 101_000_000,
    },
  });
  await prisma.dataRoomFile.createMany({
    data: [
      { id: "demo-cala-file-1", projectId, folder: "Fiscal", fileName: "cuentas-2024.pdf" },
      { id: "demo-cala-file-2", projectId, folder: "Laboral", fileName: "plantilla.pdf" },
      { id: "demo-cala-file-3", projectId, folder: "Societario", fileName: "escrituras.pdf" },
    ],
  });

  await prisma.projectMessage.deleteMany({ where: { projectId } });
  await prisma.dataRoomFileShare.deleteMany({ where: { investorId: buyerId } });
  await prisma.dataRoomGrant.deleteMany({ where: { projectId } });
  await prisma.projectAccess.deleteMany({ where: { projectId } });
  await prisma.notification.deleteMany({
    where: {
      userId: { in: [sellerId, buyerId] },
      OR: [{ body: { contains: "Proyecto Cala" } }, { title: { contains: "NDA" } }, { title: { contains: "Solicitud" } }],
    },
  });
  await prisma.projectFavorite.upsert({
    where: { projectId_investorId: { projectId, investorId: buyerId } },
    create: { id: "demo-fav-inversor-cala", projectId, investorId: buyerId },
    update: {},
  });

  const olivo = await prisma.project.findUnique({ where: { slug: "proyecto-olivo" }, select: { id: true } });
  const duna = await prisma.project.findUnique({ where: { slug: "proyecto-duna" }, select: { id: true } });

  if (olivo) {
    await prisma.projectFavorite.upsert({
      where: { projectId_investorId: { projectId: olivo.id, investorId: buyerId } },
      create: { id: "demo-fav-inversor-olivo", projectId: olivo.id, investorId: buyerId },
      update: {},
    });
  }

  if (duna) {
    await prisma.projectFavorite.upsert({
      where: { projectId_investorId: { projectId: duna.id, investorId: buyerId } },
      create: { id: "demo-fav-inversor-duna", projectId: duna.id, investorId: buyerId },
      update: {},
    });
  }

  await prisma.user.deleteMany({ where: { email: "alexxvives@gmail.com" } });

  console.log("Demo accounts ready: inversor@itsreleva.com, vendedor@itsreleva.com, asesor@itsreleva.com, admin@itsreleva.com");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Demo seed failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
