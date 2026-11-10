/**
 * Simplified INT seed - creates users and instructs password setup via app.
 * NEVER clone production data. NEVER run against production.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, randomUUID } from "crypto";
import { writeFileSync, chmodSync } from "fs";

// Exact INT project validation
function validateIntTarget() {
  if (process.env.INT_ENVIRONMENT !== "true") {
    throw new Error("INT_ENVIRONMENT must be 'true' to run INT seed");
  }
  
  const dbUrl = process.env.INT_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("Database URL not configured");
  }
  
  // Reject production patterns
  const productionPatterns = [
    "itsreleva",
    "itsrelify",
    "releva-prod",
    "releva.neon",
  ];
  
  const lowerUrl = dbUrl.toLowerCase();
  for (const pattern of productionPatterns) {
    if (lowerUrl.includes(pattern)) {
      throw new Error(
        `Database URL contains production pattern "${pattern}". ` +
        `INT seed requires isolated INT database only.`
      );
    }
  }
  
  // Must be localhost OR explicitly approved INT project  
  const parsed = new URL(dbUrl);
  const host = parsed.hostname.toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  
  if (!isLocal) {
    const approvedHost = process.env.INT_APPROVED_DB_HOST?.toLowerCase();
    if (!approvedHost) {
      throw new Error(
        "Remote database requires INT_APPROVED_DB_HOST. " +
        "For RELEVA-INT Neon project, set exact endpoint host:port."
      );
    }
    
    const hostPort = `${host}:${parsed.port || "5432"}`;
    if (hostPort !== approvedHost.toLowerCase()) {
      throw new Error(
        `Database host "${hostPort}" does not match approved "${approvedHost}". ` +
        `Cannot seed against unapproved database.`
      );
    }
  }
  
  console.log(`[INT Seed] Target validated: ${isLocal ? "localhost" : "approved remote INT project"}`);
}

// Generate password  
function generatePassword(): string {
  return randomBytes(16).toString("base64").slice(0, 24);
}

// Synthetic SABI data
function syntheticSabi(cif: string) {
  return {
    cif,
    legalName: `Empresa Sintética ${cif}`,
    legalForm: "Sociedad Limitada",
    yearsCovered: 3,
    syntheticNotice: "Synthetic test data, not real SABI",
  };
}

async function seedInt() {
  console.log("");
  console.log("==============================================");
  console.log("INT Seed - Comprehensive Test Data");
  console.log("==============================================");
  console.log("");
  
  validateIntTarget();
  console.log("");
  
  const dbUrl = process.env.INT_DATABASE_URL || process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });
  
  console.log("[INT Seed] Creating test users...");
  console.log("");
  
  const testPassword = generatePassword();
  const accessFile = "/opt/cursor/artifacts/relify-int-test-access.txt";
  
  const testUsers = [
    { key: "buyer", email: "int-comprador@test.local", name: "Comprador INT", role: "investor" },
    { key: "advisor", email: "int-asesor@test.local", name: "Asesor INT", role: "advisor" },
    { key: "seller-sabi", email: "int-vendedor-sabi@test.local", name: "Vendedor INT (SABI)", role: "seller" },
    { key: "seller-manual", email: "int-vendedor-manual@test.local", name: "Vendedor INT (Manual)", role: "seller" },
    { key: "admin", email: "int-admin@test.local", name: "Admin INT", role: "admin" },
  ] as const;
  
  const users: Record<string, { id: string; email: string }> = {};
  const credentials: string[] = [];
  
  for (const { key, email, name, role } of testUsers) {
    const userId = randomUUID();
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        id: userId,
        email,
        name,
        role,
        emailVerified: true,
        onboardedAt: new Date(),
        termsAcceptedAt: new Date(),
      },
      update: {
        emailVerified: true,
        onboardedAt: new Date(),
      },
    });
    
    users[key] = user;
    credentials.push(`${role.toUpperCase()} (${key}):`);
    credentials.push(`  Email: ${email}`);
    credentials.push(`  Password: (set via app - see instructions below)`);
    credentials.push("");
    
    console.log(`  ✓ ${name} (${email})`);
  }
  
  console.log("");
  console.log("[INT Seed] Creating seller projects...");
  
  // Project with SABI
  const sabiSlug = `empresa-tecnologia-${randomUUID().slice(0, 8)}`;
  const projectSabi = await prisma.project.upsert({
    where: { slug: sabiSlug },
    create: {
      id: randomUUID(),
      slug: sabiSlug,
      ownerId: users["seller-sabi"].id,
      codename: "Empresa Tecnología",
      region: "Comunidad de Madrid",
      revenueCents: BigInt(500000000), // 5M
      ebitdaCents: BigInt(75000000), // 750k
      adjustedEbitdaCents: BigInt(80000000), // 800k
      ebitdaAdjustments: [{
        type: "add",
        amountCents: 5000000,
        reason: "Gasto no recurrente"
      }],
      askingPriceCents: BigInt(400000000), // 4M
      sellerFinancing: "yes",
      sellerFinancingMaxPct: 20,
      sellerFinancingYears: 3,
      sellerStay: "6m",
      netDebtCents: BigInt(50000000),
      workingCapitalCents: BigInt(100000000),
      netIncomeCents: BigInt(60000000),
      legalName: "Tecnología Digital SL",
      cif: "B12345678",
      address: "Calle Ejemplo 123, 28001 Madrid",
      foundedYear: 2015,
      description: "Desarrollo software B2B con clientes recurrentes",
      saleReason: "Jubilación fundador",
      opexCents: BigInt(350000000),
      headcountRange: "band_21_50",
      customerBase: "business",
      status: "published",
      verifiedAt: new Date(),
      // Synthetic SABI
      sabiImportedAt: new Date(),
      sabiFileName: `synthetic-${randomUUID().slice(0, 8)}.json`,
      sabiData: syntheticSabi("B12345678"),
      legalForm: "Sociedad Limitada",
      accountsFormat: "Normal",
      audited: true,
      averageHeadcount: 32,
    },
    update: {},
  });
  
  console.log(`  ✓ ${projectSabi.codename} (con SABI fixture)`);
  
  // Add CNAE
  await prisma.projectCnae.upsert({
    where: {
      projectId_code: {
        projectId: projectSabi.id,
        code: "62.01"
      }
    },
    create: {
      id: randomUUID(),
      projectId: projectSabi.id,
      code: "62.01",
      role: "principal",
      position: 0,
    },
    update: {},
  });
  
  // Add years
  for (let i = 0; i < 3; i++) {
    const year = 2021 + i;
    await prisma.projectYear.upsert({
      where: {
        projectId_year: {
          projectId: projectSabi.id,
          year
        }
      },
      create: {
        id: randomUUID(),
        projectId: projectSabi.id,
        year,
        kind: "closed",
      },
      update: {},
    });
  }
  
  // Project manual
  const manualSlug = `consultoria-servicios-${randomUUID().slice(0, 8)}`;
  const projectManual = await prisma.project.upsert({
    where: { slug: manualSlug },
    create: {
      id: randomUUID(),
      slug: manualSlug,
      ownerId: users["seller-manual"].id,
      codename: "Consultoría Servicios",
      region: "Cataluña",
      revenueCents: BigInt(200000000),
      ebitdaCents: BigInt(40000000),
      adjustedEbitdaCents: BigInt(40000000),
      askingPriceCents: BigInt(160000000),
      sellerFinancing: "no",
      sellerStay: "3m",
      netDebtCents: BigInt(0),
      workingCapitalCents: BigInt(50000000),
      netIncomeCents: BigInt(30000000),
      legalName: "Consultoría Profesional SL",
      cif: "B87654321",
      address: "Passeig de Gràcia 100, 08008 Barcelona",
      foundedYear: 2018,
      description: "Consultoría estratégica PYMEs",
      saleReason: "Nuevos proyectos internacionales",
      opexCents: BigInt(140000000),
      headcountRange: "band_11_20",
      customerBase: "business",
      status: "published",
      verifiedAt: new Date(),
      // NO SABI
      sabiImportedAt: null,
      averageHeadcount: 15,
    },
    update: {},
  });
  
  console.log(`  ✓ ${projectManual.codename} (sin SABI, manual)`);
  
  await prisma.projectCnae.upsert({
    where: {
      projectId_code: {
        projectId: projectManual.id,
        code: "70.22"
      }
    },
    create: {
      id: randomUUID(),
      projectId: projectManual.id,
      code: "70.22",
      role: "principal",
      position: 0,
    },
    update: {},
  });
  
  console.log("");
  console.log("[INT Seed] Creating buyer NDA states...");
  
  // Pre-NDA view
  await prisma.projectView.upsert({
    where: {
      projectId_investorId: {
        projectId: projectSabi.id,
        investorId: users["buyer"].id
      }
    },
    create: {
      id: randomUUID(),
      projectId: projectSabi.id,
      investorId: users["buyer"].id,
      viewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    update: {},
  });
  
  // Accepted NDA
  await prisma.projectAccess.upsert({
    where: {
      projectId_investorId: {
        projectId: projectManual.id,
        investorId: users["buyer"].id
      }
    },
    create: {
      id: randomUUID(),
      projectId: projectManual.id,
      investorId: users["buyer"].id,
      requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      sellerAcceptedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
      ndaAcceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    update: {},
  });
  
  console.log(`  ✓ Pre-NDA: "${projectSabi.codename}"`);
  console.log(`  ✓ Accepted NDA: "${projectManual.codename}"`);
  
  console.log("");
  console.log("[INT Seed] Creating advisor mandate...");
  
  await prisma.saleMandate.upsert({
    where: {
      advisorId_projectId: {
        advisorId: users["advisor"].id,
        projectId: projectSabi.id
      }
    },
    create: {
      id: randomUUID(),
      projectId: projectSabi.id,
      advisorId: users["advisor"].id,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    update: {},
  });
  
  console.log(`  ✓ Mandate for "${projectSabi.codename}"`);
  
  console.log("");
  console.log("[INT Seed] Writing access file...");
  
  const accessContent = [
    "==============================================",
    "RELEVA INT Test Access",
    "==============================================",
    "",
    "CONFIDENTIAL - Do not commit or share",
    "",
    ...credentials,
    "",
    "PASSWORD SETUP:",
    "---------------",
    `Shared test password: ${testPassword}`,
    "",
    "To set passwords via app:",
    "1. Visit INT site",
    "2. Click 'Entrar' → '¿Olvidaste tu contraseña?'",
    "3. Enter email above",
    "4. Check logs for password reset link (email disabled in INT)",
    "5. Set password",
    "",
    "OR via SQL (after connecting to INT database):",
    `UPDATE "user" SET password = crypt('${testPassword}', gen_salt('bf'))`,
    `WHERE email LIKE 'int-%@test.local';`,
    "",
    "==============================================",
    `Generated: ${new Date().toISOString()}`,
    "==============================================",
  ].join("\n");
  
  writeFileSync(accessFile, accessContent, { mode: 0o600 });
  chmodSync(accessFile, 0o600);
  
  console.log(`  ✓ ${accessFile}`);
  console.log(`  ✓ Permissions: 0600`);
  
  console.log("");
  console.log("==============================================");
  console.log("✅ INT Seed Complete");
  console.log("==============================================");
  console.log("");
  console.log("Test accounts created (roles: investor, advisor, seller, admin)");
  console.log("Projects: 1 with SABI fixture, 1 manual");
  console.log("Buyer states: pre-NDA view + accepted NDA");
  console.log("");
  console.log(`Access credentials: ${accessFile}`);
  console.log("");
  
  await prisma.$disconnect();
}

seedInt().catch((error) => {
  console.error("");
  console.error("❌ INT Seed ERROR:");
  console.error(error);
  console.error("");
  process.exit(1);
});
