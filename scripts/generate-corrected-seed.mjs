/**
 * Generate corrected idempotent seed SQL for INT database.
 * Uses Better Auth actual hashPassword (scrypt), proper constraints, single transaction.
 */

import { randomBytes, randomUUID, createHash } from "crypto";
import { writeFileSync, readFileSync } from "fs";
import { hashPassword } from "better-auth/crypto";

// Generate deterministic UUID from string (for idempotence)
function deterministicUUID(namespace, value) {
  const hash = createHash("sha256").update(`${namespace}:${value}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

// Read existing passwords if available
function getExistingPasswords() {
  try {
    const content = readFileSync("/opt/cursor/artifacts/relify-int-test-access.txt", "utf8");
    const passwords = {};
    const lines = content.split("\n");
    let currentRole = null;
    
    for (const line of lines) {
      if (line.includes("(") && line.includes("):")) {
        currentRole = line.match(/\(([^)]+)\)/)?.[1];
      } else if (line.trim().startsWith("Password:") && currentRole) {
        passwords[currentRole] = line.split("Password:")[1].trim();
      }
    }
    
    return passwords;
  } catch {
    return {};
  }
}

// Generate or reuse password
function getPassword(key, existing) {
  if (existing[key]) {
    console.log(`  Reusing password for ${key}`);
    return existing[key];
  }
  return randomBytes(16).toString("base64").slice(0, 24);
}

// SQL escape
function sqlString(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function sqlTimestamp(d) {
  return sqlString(d.toISOString());
}

// Synthetic SABI with meaningful financials
function syntheticSabiJson(cif) {
  const data = {
    cif,
    legalName: "Tecnología Digital SL",
    legalForm: "Sociedad Limitada",
    foundedYear: 2015,
    shareCapital: 3000,
    employeeCount: 32,
    yearsCovered: 3,
    financialYears: [
      {
        year: 2021,
        revenue: 4500000,
        ebitda: 650000,
        netIncome: 500000,
        assets: 2800000,
        liabilities: 800000,
        equity: 2000000,
      },
      {
        year: 2022,
        revenue: 4750000,
        ebitda: 700000,
        netIncome: 550000,
        assets: 3100000,
        liabilities: 850000,
        equity: 2250000,
      },
      {
        year: 2023,
        revenue: 5000000,
        ebitda: 750000,
        netIncome: 600000,
        assets: 3400000,
        liabilities: 900000,
        equity: 2500000,
      },
    ],
    syntheticNotice: "Synthetic test data for INT environment",
  };
  return sqlString(JSON.stringify(data));
}

async function generateCorrectedSeed() {
  console.log("[Corrected Seed] Starting...");
  
  const lines = [];
  const credentials = [];
  const existingPasswords = getExistingPasswords();
  
  // Single atomic transaction
  lines.push("-- INT Seed SQL - Corrected & Idempotent");
  lines.push("-- Generated: " + new Date().toISOString());
  lines.push("-- Single atomic transaction with proper Better Auth scrypt hashing");
  lines.push("");
  lines.push("BEGIN;");
  lines.push("");
  
  // Test users with deterministic IDs
  const testUsers = [
    { key: "buyer", email: "int-comprador@test.local", name: "Comprador INT", role: "investor" },
    { key: "advisor", email: "int-asesor@test.local", name: "Asesor INT", role: "advisor" },
    { key: "seller-sabi", email: "int-vendedor-sabi@test.local", name: "Vendedor INT (SABI)", role: "seller" },
    { key: "seller-manual", email: "int-vendedor-manual@test.local", name: "Vendedor INT (Manual)", role: "seller" },
    { key: "admin", email: "int-admin@test.local", name: "Admin INT", role: "admin" },
  ];
  
  const userIds = {};
  const passwords = {};
  
  lines.push("-- Test Users with Better Auth scrypt password hashing");
  
  for (const { key, email, name, role } of testUsers) {
    // Deterministic user ID for idempotence
    const userId = deterministicUUID("int-user", email);
    const password = getPassword(key, existingPasswords);
    const passwordHash = await hashPassword(password);
    const now = new Date();
    
    userIds[key] = userId;
    passwords[key] = password;
    credentials.push(`${role.toUpperCase()} (${key}):`);
    credentials.push(`  Email: ${email}`);
    credentials.push(`  Password: ${password}`);
    credentials.push("");
    
    lines.push("");
    lines.push(`-- ${name}`);
    lines.push(`INSERT INTO "user" (id, name, email, email_verified, role, onboarded_at, terms_accepted_at, created_at, updated_at)`);
    lines.push(`VALUES (${sqlString(userId)}, ${sqlString(name)}, ${sqlString(email)}, true, ${sqlString(role)}, ${sqlTimestamp(now)}, ${sqlTimestamp(now)}, ${sqlTimestamp(now)}, ${sqlTimestamp(now)})`);
    lines.push(`ON CONFLICT (email) DO UPDATE SET`);
    lines.push(`  onboarded_at = EXCLUDED.onboarded_at,`);
    lines.push(`  terms_accepted_at = EXCLUDED.terms_accepted_at;`);
    
    // Account - note: no unique constraint on (provider_id, account_id), only PK on id
    // Use deterministic account ID
    const accountId = deterministicUUID("int-account", email);
    lines.push("");
    lines.push(`INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)`);
    lines.push(`VALUES (${sqlString(accountId)}, ${sqlString(email)}, 'credential', ${sqlString(userId)}, ${sqlString(passwordHash)}, ${sqlTimestamp(now)}, ${sqlTimestamp(now)})`);
    lines.push(`ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password, updated_at = EXCLUDED.updated_at;`);
  }
  
  lines.push("");
  lines.push("-- Projects with meaningful synthetic data");
  
  // Project with SABI - deterministic slug and ID
  const sabiSlug = "int-empresa-tecnologia";
  const sabiProjectId = deterministicUUID("int-project", sabiSlug);
  const now = new Date();
  
  lines.push("");
  lines.push("-- Project with synthetic SABI fixture");
  lines.push(`INSERT INTO "project" (id, slug, owner_id, codename, region, revenue_cents, ebitda_cents, adjusted_ebitda_cents, ebitda_adjustments, asking_price_cents, seller_financing, seller_financing_max_pct, seller_financing_years, seller_stay, net_debt_cents, working_capital_cents, net_income_cents, legal_name, cif, address, founded_year, description, sale_reason, opex_cents, headcount_range, customer_base, status, verified_at, sabi_imported_at, sabi_file_name, sabi_data, legal_form, accounts_format, audited, average_headcount, created_at)`);
  lines.push(`VALUES (`);
  lines.push(`  ${sqlString(sabiProjectId)},`);
  lines.push(`  ${sqlString(sabiSlug)},`);
  lines.push(`  ${sqlString(userIds["seller-sabi"])},`);
  lines.push(`  'Empresa Tecnología',`);
  lines.push(`  'Comunidad de Madrid',`);
  lines.push(`  500000000,`);
  lines.push(`  75000000,`);
  lines.push(`  80000000,`);
  lines.push(`  '[{"type":"add","amountCents":5000000,"reason":"Gasto no recurrente normalizado"}]'::jsonb,`);
  lines.push(`  400000000,`);
  lines.push(`  'negotiable',`);
  lines.push(`  20,`);
  lines.push(`  3,`);
  lines.push(`  '6m',`);
  lines.push(`  50000000,`);
  lines.push(`  100000000,`);
  lines.push(`  60000000,`);
  lines.push(`  'Tecnología Digital SL',`);
  lines.push(`  'B12345678',`);
  lines.push(`  'Calle Ejemplo 123, 28001 Madrid',`);
  lines.push(`  2015,`);
  lines.push(`  'Empresa de desarrollo de software B2B con cartera de clientes recurrentes y crecimiento sostenido.',`);
  lines.push(`  'Jubilación del fundador',`);
  lines.push(`  350000000,`);
  lines.push(`  'band_21_50',`);
  lines.push(`  'business',`);
  lines.push(`  'published',`);
  lines.push(`  ${sqlTimestamp(now)},`);
  lines.push(`  ${sqlTimestamp(now)},`);
  lines.push(`  'synthetic-int-sabi.json',`);
  lines.push(`  ${syntheticSabiJson("B12345678")}::jsonb,`);
  lines.push(`  'Sociedad Limitada',`);
  lines.push(`  'Normal',`);
  lines.push(`  true,`);
  lines.push(`  32,`);
  lines.push(`  ${sqlTimestamp(now)}`);
  lines.push(`)`);
  lines.push(`ON CONFLICT (slug) DO UPDATE SET`);
  lines.push(`  sabi_data = EXCLUDED.sabi_data,`);
  lines.push(`  updated_at = EXCLUDED.updated_at;`);
  
  // CNAE
  const sabiCnaeId = deterministicUUID("int-cnae", `${sabiProjectId}-6201`);
  lines.push("");
  lines.push(`INSERT INTO "project_cnae" (id, project_id, code, role, position)`);
  lines.push(`VALUES (${sqlString(sabiCnaeId)}, ${sqlString(sabiProjectId)}, '6201', 'principal', 0)`);
  lines.push(`ON CONFLICT (project_id, code) DO NOTHING;`);
  
  // Years with meaningful financials
  const financials = [
    { year: 2021, revenue: 450000000, ebitda: 65000000, netIncome: 50000000, assets: 280000000, equity: 200000000 },
    { year: 2022, revenue: 475000000, ebitda: 70000000, netIncome: 55000000, assets: 310000000, equity: 225000000 },
    { year: 2023, revenue: 500000000, ebitda: 75000000, netIncome: 60000000, assets: 340000000, equity: 250000000 },
  ];
  
  for (const { year, revenue, ebitda, netIncome, assets, equity } of financials) {
    const yearId = deterministicUUID("int-year", `${sabiProjectId}-${year}`);
    lines.push("");
    lines.push(`INSERT INTO "project_year" (id, project_id, year, kind, sales_cents, operating_profit_cents, profit_after_tax_cents, fixed_assets_cents, shareholders_funds_cents)`);
    lines.push(`VALUES (${sqlString(yearId)}, ${sqlString(sabiProjectId)}, ${year}, 'closed', ${revenue}, ${ebitda}, ${netIncome}, ${assets}, ${equity})`);
    lines.push(`ON CONFLICT (project_id, year) DO UPDATE SET`);
    lines.push(`  sales_cents = EXCLUDED.sales_cents,`);
    lines.push(`  operating_profit_cents = EXCLUDED.operating_profit_cents,`);
    lines.push(`  profit_after_tax_cents = EXCLUDED.profit_after_tax_cents;`);
  }
  
  // Project manual
  const manualSlug = "int-consultoria-servicios";
  const manualProjectId = deterministicUUID("int-project", manualSlug);
  
  lines.push("");
  lines.push("-- Project manual (no SABI)");
  lines.push(`INSERT INTO "project" (id, slug, owner_id, codename, region, revenue_cents, ebitda_cents, adjusted_ebitda_cents, asking_price_cents, seller_financing, seller_stay, net_debt_cents, working_capital_cents, net_income_cents, legal_name, cif, address, founded_year, description, sale_reason, opex_cents, headcount_range, customer_base, status, verified_at, average_headcount, created_at)`);
  lines.push(`VALUES (`);
  lines.push(`  ${sqlString(manualProjectId)},`);
  lines.push(`  ${sqlString(manualSlug)},`);
  lines.push(`  ${sqlString(userIds["seller-manual"])},`);
  lines.push(`  'Consultoría Servicios',`);
  lines.push(`  'Cataluña',`);
  lines.push(`  200000000,`);
  lines.push(`  40000000,`);
  lines.push(`  40000000,`);
  lines.push(`  160000000,`);
  lines.push(`  'no',`);
  lines.push(`  '3m',`);
  lines.push(`  0,`);
  lines.push(`  50000000,`);
  lines.push(`  30000000,`);
  lines.push(`  'Consultoría Profesional SL',`);
  lines.push(`  'B87654321',`);
  lines.push(`  'Passeig de Gràcia 100, 08008 Barcelona',`);
  lines.push(`  2018,`);
  lines.push(`  'Consultoría estratégica para pequeñas y medianas empresas.',`);
  lines.push(`  'Nuevos proyectos internacionales',`);
  lines.push(`  140000000,`);
  lines.push(`  'band_11_20',`);
  lines.push(`  'business',`);
  lines.push(`  'published',`);
  lines.push(`  ${sqlTimestamp(now)},`);
  lines.push(`  15,`);
  lines.push(`  ${sqlTimestamp(now)}`);
  lines.push(`)`);
  lines.push(`ON CONFLICT (slug) DO UPDATE SET updated_at = EXCLUDED.updated_at;`);
  
  const manualCnaeId = deterministicUUID("int-cnae", `${manualProjectId}-7022`);
  lines.push("");
  lines.push(`INSERT INTO "project_cnae" (id, project_id, code, role, position)`);
  lines.push(`VALUES (${sqlString(manualCnaeId)}, ${sqlString(manualProjectId)}, '7022', 'principal', 0)`);
  lines.push(`ON CONFLICT (project_id, code) DO NOTHING;`);
  
  // Buyer NDA states
  lines.push("");
  lines.push("-- Buyer NDA relationships");
  
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  const onePointFiveDaysAgo = new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000);
  
  // Pre-NDA view
  const viewId = deterministicUUID("int-view", `${userIds["buyer"]}-${sabiProjectId}`);
  lines.push("");
  lines.push(`INSERT INTO "project_view" (id, project_id, investor_id, viewed_at, last_viewed_at)`);
  lines.push(`VALUES (${sqlString(viewId)}, ${sqlString(sabiProjectId)}, ${sqlString(userIds["buyer"])}, ${sqlTimestamp(twoDaysAgo)}, ${sqlTimestamp(twoDaysAgo)})`);
  lines.push(`ON CONFLICT (project_id, investor_id) DO NOTHING;`);
  
  // Accepted NDA
  const accessId = deterministicUUID("int-access", `${userIds["buyer"]}-${manualProjectId}`);
  lines.push("");
  lines.push(`INSERT INTO "project_access" (id, project_id, investor_id, requested_at, seller_accepted_at, nda_accepted_at)`);
  lines.push(`VALUES (${sqlString(accessId)}, ${sqlString(manualProjectId)}, ${sqlString(userIds["buyer"])}, ${sqlTimestamp(twoDaysAgo)}, ${sqlTimestamp(onePointFiveDaysAgo)}, ${sqlTimestamp(oneDayAgo)})`);
  lines.push(`ON CONFLICT (project_id, investor_id) DO NOTHING;`);
  
  // Advisor mandate
  lines.push("");
  lines.push("-- Advisor mandate");
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const mandateId = deterministicUUID("int-mandate", `${userIds["advisor"]}-${sabiProjectId}`);
  lines.push("");
  lines.push(`INSERT INTO "sale_mandate" (id, project_id, advisor_id, created_at)`);
  lines.push(`VALUES (${sqlString(mandateId)}, ${sqlString(sabiProjectId)}, ${sqlString(userIds["advisor"])}, ${sqlTimestamp(thirtyDaysAgo)})`);
  lines.push(`ON CONFLICT (advisor_id, project_id) DO NOTHING;`);
  
  lines.push("");
  lines.push("COMMIT;");
  lines.push("");
  lines.push("-- Seed complete: 5 users, 2 projects, 3 NDA relationships, 3 financial years with details");
  
  // Write SQL
  const sqlPath = "/opt/cursor/artifacts/int-bootstrap/seed.sql";
  writeFileSync(sqlPath, lines.join("\n"));
  console.log(`[Corrected Seed] ✓ ${sqlPath}`);
  console.log(`[Corrected Seed]   ${lines.length} lines`);
  
  // Write credentials
  const credPath = "/opt/cursor/artifacts/relify-int-test-access.txt";
  const credContent = [
    "==============================================",
    "RELEVA INT Test Access Credentials",
    "==============================================",
    "",
    "CONFIDENTIAL - Do not commit or share",
    "",
    ...credentials,
    "",
    "==============================================",
    `Generated: ${new Date().toISOString()}`,
    "==============================================",
  ].join("\n");
  
  writeFileSync(credPath, credContent, { mode: 0o600 });
  console.log(`[Corrected Seed] ✓ ${credPath} (chmod 600)`);
  
  // Write manifest
  const manifest = {
    generated: new Date().toISOString(),
    target: {
      project: "silent-rain-47735324",
      org: "org-jolly-rain-91494508",
      branch: "br-jolly-rain-b9g5pzn4",
      endpoint: "ep-steep-boat-b954u39t",
      host: "ep-steep-boat-b954u39t.c-7.eu-central-1.aws.neon.tech",
      database: "releva_int",
    },
    schema: {
      file: "schema.sql",
      lines: 1069,
      tables: 43,
      enums: 13,
    },
    seed: {
      file: "seed.sql",
      lines: lines.length,
      users: testUsers.length,
      projects: 2,
      relationships: 3,
      financialYears: 3,
      passwordHashing: "scrypt (Better Auth default)",
      idempotence: "deterministic UUIDs, proper ON CONFLICT",
    },
    credentials: {
      file: credPath,
      users: testUsers.map(u => u.email),
    },
  };
  
  const manifestPath = "/opt/cursor/artifacts/int-bootstrap/manifest.json";
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`[Corrected Seed] ✓ ${manifestPath}`);
  
  console.log("[Corrected Seed] Complete - uses Better Auth scrypt, proper constraints");
}

generateCorrectedSeed().catch(error => {
  console.error("[Corrected Seed] ERROR:", error);
  process.exit(1);
});
