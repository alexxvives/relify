import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { incomingAccessNotice } from "@/lib/notifications";
import { prisma } from "@/server/db";

const password = "@Releva1z2x";
const projectId = "demo-project-cala";
const projectSlug = "proyecto-cala";

type RoleName = "investor" | "seller" | "admin";

type DemoAccount = {
  email: string;
  aliases: string[];
  name: string;
  lastName: string;
  phone: string;
  nationalId: string;
  role: RoleName;
};

const accounts: DemoAccount[] = [
  {
    email: "inversor@itsreleva.com",
    aliases: ["inversor.ui@example.com"],
    name: "Laura",
    lastName: "Vidal",
    phone: "+34610000001",
    nationalId: "A00000000",
    role: "investor",
  },
  {
    email: "comprador@itsreleva.com",
    aliases: [],
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

async function ensureBuyerPlan(userId: string, plan: "limited" | "unlimited", stripeCustomerId: string): Promise<void> {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  await prisma.billingCustomer.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId,
      plan,
      periodStart: start,
      periodEnd: end,
    },
    update: {
      stripeCustomerId,
      plan,
      periodStart: start,
      periodEnd: end,
    },
  });
}

async function main(): Promise<void> {
  const passwordHash = await hashPassword(password);
  const ids = new Map<string, string>();

  for (const account of accounts) {
    ids.set(account.email, await upsertAccount(account, passwordHash));
  }

  const sellerId = ids.get("vendedor@itsreleva.com");
  const investorId = ids.get("inversor@itsreleva.com");
  const buyerId = ids.get("comprador@itsreleva.com");

  if (!sellerId || !investorId || !buyerId) {
    throw new Error("Demo accounts were not created");
  }

  await ensureBuyerPlan(investorId, "unlimited", "demo_cus_inversor");
  await ensureBuyerPlan(buyerId, "limited", "demo_cus_comprador");

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
      netDebtCents: 4_500_000,
      workingCapitalCents: 6_200_000,
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
      netDebtCents: 4_500_000,
      workingCapitalCents: 6_200_000,
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

  const acceptedAt = new Date("2026-09-20T10:00:00.000Z");
  const ndaAt = new Date("2026-09-21T10:00:00.000Z");
  await prisma.projectAccess.upsert({
    where: { projectId_investorId: { projectId, investorId } },
    create: {
      id: "demo-access-inversor",
      projectId,
      investorId,
      requestedAt: new Date("2026-09-18T10:00:00.000Z"),
      sellerAcceptedAt: acceptedAt,
      ndaAcceptedAt: ndaAt,
    },
    update: { sellerAcceptedAt: acceptedAt, ndaAcceptedAt: ndaAt },
  });
  await prisma.projectAccess.upsert({
    where: { projectId_investorId: { projectId, investorId: buyerId } },
    create: {
      id: "demo-access-comprador",
      projectId,
      investorId: buyerId,
      requestedAt: new Date(),
    },
    update: { sellerAcceptedAt: null, ndaAcceptedAt: null },
  });
  await prisma.dataRoomGrant.upsert({
    where: { projectId_investorId: { projectId, investorId } },
    create: { id: "demo-grant-inversor", projectId, investorId },
    update: {},
  });
  await prisma.projectFavorite.upsert({
    where: { projectId_investorId: { projectId, investorId } },
    create: { id: "demo-fav-inversor-cala", projectId, investorId },
    update: {},
  });

  const olivo = await prisma.project.findUnique({ where: { slug: "proyecto-olivo" }, select: { id: true } });
  const duna = await prisma.project.findUnique({ where: { slug: "proyecto-duna" }, select: { id: true } });

  if (olivo) {
    await prisma.projectFavorite.upsert({
      where: { projectId_investorId: { projectId: olivo.id, investorId: buyerId } },
      create: { id: "demo-fav-comprador-olivo", projectId: olivo.id, investorId: buyerId },
      update: {},
    });
  }

  if (duna) {
    await prisma.projectFavorite.upsert({
      where: { projectId_investorId: { projectId: duna.id, investorId } },
      create: { id: "demo-fav-inversor-duna", projectId: duna.id, investorId },
      update: {},
    });
  }

  const messages = [
    {
      id: "demo-msg-1",
      author: "investor" as const,
      kind: "question" as const,
      body: "¿El equipo de tienda sigue después del traspaso?",
      createdAt: new Date("2026-09-22T09:00:00.000Z"),
    },
    {
      id: "demo-msg-2",
      author: "seller" as const,
      kind: "question" as const,
      body: "Sí. Las cuatro personas de tienda quieren continuar.",
      createdAt: new Date("2026-09-22T16:00:00.000Z"),
    },
  ];

  await prisma.projectMessage.deleteMany({
    where: {
      OR: [{ id: "demo-msg-3" }, { body: "Propongo una reunión la semana que viene para ver el obrador." }],
    },
  });

  for (const message of messages) {
    await prisma.projectMessage.upsert({
      where: { id: message.id },
      create: { ...message, projectId, investorId },
      update: { body: message.body, author: message.author, kind: message.kind },
    });
  }

  const sellerNotice = incomingAccessNotice("Proyecto Cala");
  await prisma.notification.upsert({
    where: { id: "demo-note-seller" },
    create: {
      id: "demo-note-seller",
      userId: sellerId,
      title: sellerNotice.title,
      body: sellerNotice.body,
      href: "/mi-empresa/procesos",
    },
    update: { userId: sellerId, title: sellerNotice.title, body: sellerNotice.body, href: "/mi-empresa/procesos" },
  });
  await prisma.notification.upsert({
    where: { id: "demo-note-investor" },
    create: {
      id: "demo-note-investor",
      userId: investorId,
      title: "Solicitud aceptada",
      body: "Proyecto Cala ha aceptado tu solicitud.",
      href: "/proyectos/proyecto-cala",
    },
    update: { userId: investorId },
  });

  console.log("Demo accounts ready: inversor@itsreleva.com, comprador@itsreleva.com, vendedor@itsreleva.com, admin@itsreleva.com");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Demo seed failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
