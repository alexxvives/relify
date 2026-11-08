import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client.js";
import { ndaAccessGate } from "./project-access";
import { buyerProjectView } from "./report-veil";
import { figureVeilYears } from "./figure-veil";

const databaseUrl = process.env.INT_TEST_DATABASE_URL;

const fixtures = [
  { key: "investor", email: "int-comprador@test.local", name: "Comprador INT", role: "investor" as const },
  { key: "advisor", email: "int-asesor@test.local", name: "Asesor INT", role: "advisor" as const },
  { key: "seller-sabi", email: "int-vendedor-sabi@test.local", name: "Vendedor INT (SABI)", role: "seller" as const },
  { key: "seller-manual", email: "int-vendedor-manual@test.local", name: "Vendedor INT (Manual)", role: "seller" as const },
  { key: "admin", email: "int-admin@test.local", name: "Admin INT", role: "admin" as const },
];

const fixturePassword = "IntFixture-local-only-not-prod";

describe.skipIf(!databaseUrl)("Better Auth sign-in and authorization (local PG)", () => {
  if (!databaseUrl) {
    return;
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const auth = betterAuth({
    secret: "int-local-test-secret-min-32-characters",
    baseURL: "http://127.0.0.1:3000",
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
  });

  const ids: Record<string, string> = {};
  let sabiProjectId = "";
  let manualProjectId = "";

  beforeAll(async () => {
    const hashed = await hashPassword(fixturePassword);
    for (const fixture of fixtures) {
      const user = await prisma.user.upsert({
        where: { email: fixture.email },
        create: {
          id: randomUUID(),
          email: fixture.email,
          name: fixture.name,
          role: fixture.role,
          emailVerified: true,
          onboardedAt: new Date(),
          termsAcceptedAt: new Date(),
        },
        update: {
          role: fixture.role,
          emailVerified: true,
          onboardedAt: new Date(),
          termsAcceptedAt: new Date(),
        },
      });
      ids[fixture.key] = user.id;
      await prisma.account.deleteMany({
        where: { userId: user.id, providerId: "credential" },
      });
      await prisma.account.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          providerId: "credential",
          accountId: user.id,
          password: hashed,
        },
      });
    }

    const sabi = await prisma.project.upsert({
      where: { slug: "int-empresa-tecnologia" },
      create: {
        id: randomUUID(),
        slug: "int-empresa-tecnologia",
        codename: "INT SABI",
        region: "Madrid",
        revenueCents: BigInt(100000000),
        ebitdaCents: BigInt(20000000),
        adjustedEbitdaCents: BigInt(22000000),
        askingPriceCents: BigInt(200000000),
        netDebtCents: BigInt(0),
        workingCapitalCents: BigInt(5000000),
        netIncomeCents: BigInt(10000000),
        legalName: "Tecnologia Digital SL",
        cif: "B12345678",
        address: "Madrid",
        status: "published",
        ownerId: ids["seller-sabi"],
      },
      update: { ownerId: ids["seller-sabi"], status: "published" },
    });
    sabiProjectId = sabi.id;

    const manual = await prisma.project.upsert({
      where: { slug: "int-consultoria-servicios" },
      create: {
        id: randomUUID(),
        slug: "int-consultoria-servicios",
        codename: "INT Manual",
        region: "Barcelona",
        revenueCents: BigInt(80000000),
        ebitdaCents: BigInt(12000000),
        adjustedEbitdaCents: BigInt(12000000),
        askingPriceCents: BigInt(120000000),
        netDebtCents: BigInt(0),
        workingCapitalCents: BigInt(2000000),
        netIncomeCents: BigInt(8000000),
        legalName: "Consultoria Servicios SL",
        cif: "B87654321",
        address: "Barcelona",
        status: "published",
        ownerId: ids["seller-manual"],
      },
      update: { ownerId: ids["seller-manual"], status: "published" },
    });
    manualProjectId = manual.id;

    await prisma.projectAccess.deleteMany({
      where: { investorId: ids.investor },
    });
    await prisma.projectAccess.create({
      data: {
        id: randomUUID(),
        projectId: manualProjectId,
        investorId: ids.investor,
        ndaAcceptedAt: new Date(),
        sellerAcceptedAt: new Date(),
      },
    });
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  it("verifies Better Auth scrypt hashes for all five fixture users", async () => {
    for (const fixture of fixtures) {
      const account = await prisma.account.findFirst({
        where: { userId: ids[fixture.key], providerId: "credential" },
      });
      expect(account?.password).toBeTruthy();
      const ok = await verifyPassword({
        hash: account?.password ?? "",
        password: fixturePassword,
      });
      expect(ok, fixture.email).toBe(true);
      const wrong = await verifyPassword({
        hash: account?.password ?? "",
        password: "wrong-password",
      });
      expect(wrong, fixture.email).toBe(false);
    }
  });

  it("signs in all five fixture users through Better Auth and rejects a wrong password", async () => {
    for (const fixture of fixtures) {
      const signed = await auth.api.signInEmail({
        body: { email: fixture.email, password: fixturePassword },
        headers: new Headers({ origin: "http://127.0.0.1:3000" }),
      });
      expect(signed.user.email).toBe(fixture.email);
      const session = await prisma.session.findFirst({
        where: { userId: ids[fixture.key] },
        orderBy: { createdAt: "desc" },
      });
      expect(session?.token).toBeTruthy();
    }

    await expect(
      auth.api.signInEmail({
        body: { email: "int-comprador@test.local", password: "wrong-password" },
        headers: new Headers({ origin: "http://127.0.0.1:3000" }),
      }),
    ).rejects.toThrow();
  });

  it("enforces ownership and wrong-role negatives with live rows plus access gates", async () => {
    const sabi = await prisma.project.findUnique({ where: { id: sabiProjectId } });
    const manual = await prisma.project.findUnique({ where: { id: manualProjectId } });
    expect(sabi?.ownerId).toBe(ids["seller-sabi"]);
    expect(manual?.ownerId).toBe(ids["seller-manual"]);
    expect(sabi?.ownerId).not.toBe(ids["seller-manual"]);
    expect(sabi?.ownerId).not.toBe(ids.investor);
    expect(sabi?.ownerId).not.toBe(ids.advisor);

    const advisorOwned = await prisma.project.count({ where: { ownerId: ids.advisor } });
    expect(advisorOwned).toBe(0);

    expect(
      ndaAccessGate({
        onboarded: true,
        role: "seller",
        projectStatus: "published",
        ndaAcceptedAt: new Date(),
      }),
    ).toEqual({ ok: false, code: "forbidden" });
    expect(
      ndaAccessGate({
        onboarded: true,
        role: "advisor",
        projectStatus: "published",
        ndaAcceptedAt: new Date(),
      }),
    ).toEqual({ ok: false, code: "forbidden" });
  });

  it("blocks confidential investor access pre-NDA and allows it post-NDA", async () => {
    const preNda = await prisma.projectAccess.findFirst({
      where: { projectId: sabiProjectId, investorId: ids.investor },
    });
    expect(preNda?.ndaAcceptedAt ?? null).toBeNull();
    expect(
      ndaAccessGate({
        onboarded: true,
        role: "investor",
        projectStatus: "published",
        ndaAcceptedAt: preNda?.ndaAcceptedAt ?? null,
      }),
    ).toEqual({ ok: false, code: "nda-required" });

    const postNda = await prisma.projectAccess.findFirst({
      where: { projectId: manualProjectId, investorId: ids.investor },
    });
    expect(postNda?.ndaAcceptedAt).not.toBeNull();
    expect(
      ndaAccessGate({
        onboarded: true,
        role: "investor",
        projectStatus: "published",
        ndaAcceptedAt: postNda?.ndaAcceptedAt ?? null,
      }),
    ).toEqual({ ok: true });

    const year = {
      ...figureVeilYears()[0]!,
      year: 2024,
      revenueCents: 777_111_01,
      cashCents: 333_222_01,
    };
    const project = {
      slug: "int-consultoria-servicios",
      codename: "INT Manual",
      revenueCents: 1_000_00,
      askingPriceCents: 2_000_00,
      ebitdaAdjustments: [{ type: "other", amountCents: 5_000_00, reason: "Motivo secreto" }],
      reportYears: [year],
      incomeRows: [{ label: "Ventas", values: [777_111_01, null] }],
      balanceRows: [{ label: "Caja", values: [333_222_01, null] }],
      capital: [],
      products: [],
      clients: [],
      secondaryCnaes: [],
    } as unknown as Parameters<typeof buyerProjectView>[0];

    const veiled = JSON.stringify(buyerProjectView(project, false));
    expect(veiled).not.toContain("77711101");
    expect(veiled).not.toContain("Motivo secreto");
    const open = JSON.stringify(buyerProjectView(project, true));
    expect(open).toContain("Motivo secreto");
  });
});
