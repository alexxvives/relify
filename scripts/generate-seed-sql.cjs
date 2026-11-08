/**
 * Generate idempotent seed SQL for INT database.
 * Produces SQL with proper Better Auth password hashing (bcrypt).
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { randomBytes, randomUUID } = require("crypto");
const { writeFileSync } = require("fs");
const bcrypt = require("bcryptjs");

// Generate strong random password
function generatePassword() {
  return randomBytes(16).toString("base64").slice(0, 24);
}

// Hash password using bcrypt (Better Auth compatible)
function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

// SQL escape
function sqlString(s) {
  return `'${s.replace(/'/g, "''")}'`;
}

function sqlTimestamp(d) {
  return sqlString(d.toISOString());
}

// Synthetic SABI data
function syntheticSabiJson(cif) {
  const data = {
    cif,
    legalName: `Empresa Sintética ${cif}`,
    legalForm: "Sociedad Limitada",
    yearsCovered: 3,
    syntheticNotice: "Synthetic test data, not real SABI",
  };
  return sqlString(JSON.stringify(data));
}

async function generateSeedSql() {
  console.log("[Generate Seed SQL] Starting...");
  
  const lines = [];
  const credentials = [];
  
  // Header
  lines.push("-- INT Seed SQL - Idempotent");
  lines.push("-- Generated: " + new Date().toISOString());
  lines.push("-- Safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING)");
  lines.push("");
  
  // Test users
  const testUsers = [
    { key: "buyer", email: "int-comprador@test.local", name: "Comprador INT", role: "investor" },
    { key: "advisor", email: "int-asesor@test.local", name: "Asesor INT", role: "advisor" },
    { key: "seller-sabi", email: "int-vendedor-sabi@test.local", name: "Vendedor INT (SABI)", role: "seller" },
    { key: "seller-manual", email: "int-vendedor-manual@test.local", name: "Vendedor INT (Manual)", role: "seller" },
    { key: "admin", email: "int-admin@test.local", name: "Admin INT", role: "admin" },
  ];
  
  const userIds = {};
  const passwords = {};
  
  lines.push("-- Test Users");
  lines.push("BEGIN;");
  lines.push("");
  
  for (const { key, email, name, role } of testUsers) {
    const userId = randomUUID();
    const password = generatePassword();
    const passwordHash = hashPassword(password);
    const now = new Date();
    
    userIds[key] = userId;
    passwords[key] = password;
    credentials.push(`${role.toUpperCase()} (${key}):`);
    credentials.push(`  Email: ${email}`);
    credentials.push(`  Password: ${password}`);
    credentials.push("");
    
    lines.push(`-- ${name}`);
    lines.push(`INSERT INTO "user" (id, name, email, email_verified, role, onboarded_at, terms_accepted_at, created_at, updated_at)`);
    lines.push(`VALUES (${sqlString(userId)}, ${sqlString(name)}, ${sqlString(email)}, true, ${sqlString(role)}, ${sqlTimestamp(now)}, ${sqlTimestamp(now)}, ${sqlTimestamp(now)}, ${sqlTimestamp(now)})`);
    lines.push(`ON CONFLICT (email) DO NOTHING;`);
    lines.push("");
    
    // Better Auth account with password
    const accountId = randomUUID();
    lines.push(`INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)`);
    lines.push(`VALUES (${sqlString(accountId)}, ${sqlString(userId)}, 'credential', ${sqlString(userId)}, ${sqlString(passwordHash)}, ${sqlTimestamp(now)}, ${sqlTimestamp(now)})`);
    lines.push(`ON CONFLICT (provider_id, account_id) DO UPDATE SET password = EXCLUDED.password;`);
    lines.push("");
  }
  
  lines.push("COMMIT;");
  lines.push("");
  
  // Projects
  const sabiSlug = `empresa-tecnologia-${randomUUID().slice(0, 8)}`;
  const sabiProjectId = randomUUID();
  const manualSlug = `consultoria-servicios-${randomUUID().slice(0, 8)}`;
  const manualProjectId = randomUUID();
  const now = new Date();
  
  lines.push("-- Projects");
  lines.push("BEGIN;");
  lines.push("");
  
  // Project with SABI
  lines.push("-- Project with SABI fixture");
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
  lines.push(`  '[{"type":"add","amountCents":5000000,"reason":"Gasto no recurrente"}]'::jsonb,`);
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
  lines.push(`  'Desarrollo software B2B con clientes recurrentes',`);
  lines.push(`  'Jubilación fundador',`);
  lines.push(`  350000000,`);
  lines.push(`  'band_21_50',`);
  lines.push(`  'business',`);
  lines.push(`  'published',`);
  lines.push(`  ${sqlTimestamp(now)},`);
  lines.push(`  ${sqlTimestamp(now)},`);
  lines.push(`  'synthetic-${randomUUID().slice(0, 8)}.json',`);
  lines.push(`  ${syntheticSabiJson("B12345678")}::jsonb,`);
  lines.push(`  'Sociedad Limitada',`);
  lines.push(`  'Normal',`);
  lines.push(`  true,`);
  lines.push(`  32,`);
  lines.push(`  ${sqlTimestamp(now)}`);
  lines.push(`)`);
  lines.push(`ON CONFLICT (slug) DO NOTHING;`);
  lines.push("");
  
  // CNAE for SABI project
  lines.push(`INSERT INTO "project_cnae" (id, project_id, code, role, position)`);
  lines.push(`VALUES (${sqlString(randomUUID())}, ${sqlString(sabiProjectId)}, '6201', 'principal', 0)`);
  lines.push(`ON CONFLICT (project_id, code) DO NOTHING;`);
  lines.push("");
  
  // Years for SABI project
  for (let i = 0; i < 3; i++) {
    const year = 2021 + i;
    lines.push(`INSERT INTO "project_year" (id, project_id, year, kind)`);
    lines.push(`VALUES (${sqlString(randomUUID())}, ${sqlString(sabiProjectId)}, ${year}, 'closed')`);
    lines.push(`ON CONFLICT (project_id, year) DO NOTHING;`);
    lines.push("");
  }
  
  // Project manual
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
  lines.push(`  'Consultoría estratégica PYMEs',`);
  lines.push(`  'Nuevos proyectos internacionales',`);
  lines.push(`  140000000,`);
  lines.push(`  'band_11_20',`);
  lines.push(`  'business',`);
  lines.push(`  'published',`);
  lines.push(`  ${sqlTimestamp(now)},`);
  lines.push(`  15,`);
  lines.push(`  ${sqlTimestamp(now)}`);
  lines.push(`)`);
  lines.push(`ON CONFLICT (slug) DO NOTHING;`);
  lines.push("");
  
  lines.push(`INSERT INTO "project_cnae" (id, project_id, code, role, position)`);
  lines.push(`VALUES (${sqlString(randomUUID())}, ${sqlString(manualProjectId)}, '7022', 'principal', 0)`);
  lines.push(`ON CONFLICT (project_id, code) DO NOTHING;`);
  lines.push("");
  
  lines.push("COMMIT;");
  lines.push("");
  
  // Buyer NDA states
  lines.push("-- Buyer NDA relationships");
  lines.push("BEGIN;");
  lines.push("");
  
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  const onePointFiveDaysAgo = new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000);
  
  // Pre-NDA view
  lines.push("-- Pre-NDA view");
  lines.push(`INSERT INTO "project_view" (id, project_id, investor_id, viewed_at, last_viewed_at)`);
  lines.push(`VALUES (${sqlString(randomUUID())}, ${sqlString(sabiProjectId)}, ${sqlString(userIds["buyer"])}, ${sqlTimestamp(twoDaysAgo)}, ${sqlTimestamp(twoDaysAgo)})`);
  lines.push(`ON CONFLICT (project_id, investor_id) DO NOTHING;`);
  lines.push("");
  
  // Accepted NDA
  lines.push("-- Accepted NDA");
  lines.push(`INSERT INTO "project_access" (id, project_id, investor_id, requested_at, seller_accepted_at, nda_accepted_at)`);
  lines.push(`VALUES (${sqlString(randomUUID())}, ${sqlString(manualProjectId)}, ${sqlString(userIds["buyer"])}, ${sqlTimestamp(twoDaysAgo)}, ${sqlTimestamp(onePointFiveDaysAgo)}, ${sqlTimestamp(oneDayAgo)})`);
  lines.push(`ON CONFLICT (project_id, investor_id) DO NOTHING;`);
  lines.push("");
  
  lines.push("COMMIT;");
  lines.push("");
  
  // Advisor mandate
  lines.push("-- Advisor mandate");
  lines.push("BEGIN;");
  lines.push("");
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  lines.push(`INSERT INTO "sale_mandate" (id, project_id, advisor_id, created_at)`);
  lines.push(`VALUES (${sqlString(randomUUID())}, ${sqlString(sabiProjectId)}, ${sqlString(userIds["advisor"])}, ${sqlTimestamp(thirtyDaysAgo)})`);
  lines.push(`ON CONFLICT (advisor_id, project_id) DO NOTHING;`);
  lines.push("");
  
  lines.push("COMMIT;");
  lines.push("");
  
  // Footer
  lines.push("-- Seed complete");
  lines.push(`-- Total users: ${testUsers.length}`);
  lines.push("-- Total projects: 2");
  lines.push("");
  
  // Write SQL
  const sqlPath = "/opt/cursor/artifacts/int-bootstrap/seed.sql";
  writeFileSync(sqlPath, lines.join("\n"));
  console.log(`[Generate Seed SQL] ✓ ${sqlPath}`);
  console.log(`[Generate Seed SQL]   ${lines.length} lines`);
  
  // Write credentials (secure file)
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
  console.log(`[Generate Seed SQL] ✓ ${credPath} (chmod 600)`);
  
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
      tables: 45,
    },
    seed: {
      file: "seed.sql",
      lines: lines.length,
      users: testUsers.length,
      projects: 2,
      relationships: 3,
    },
    credentials: {
      file: credPath,
      users: testUsers.map(u => u.email),
    },
  };
  
  const manifestPath = "/opt/cursor/artifacts/int-bootstrap/manifest.json";
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`[Generate Seed SQL] ✓ ${manifestPath}`);
  
  console.log("[Generate Seed SQL] Complete");
}

generateSeedSql().catch(error => {
  console.error("[Generate Seed SQL] ERROR:", error);
  process.exit(1);
});
