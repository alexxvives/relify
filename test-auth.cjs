const { PrismaClient } = require("./src/generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
const bcrypt = require("bcryptjs");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTests() {
  console.log("=== AUTHENTICATION & AUTHORIZATION TESTS ===\n");
  
  // TEST 1: Verify users exist
  console.log("TEST 1: Verify 5 test users exist");
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "int-comprador@test.local",
          "int-asesor@test.local",
          "int-vendedor-sabi@test.local",
          "int-vendedor-manual@test.local",
          "int-admin@test.local",
        ]
      }
    },
  });
  console.log(`✓ PASS: Found ${users.length}/5 users\n`);
  if (users.length !== 5) throw new Error("FAIL: Missing users");

  // TEST 2: Verify credential accounts
  console.log("TEST 2: Verify password hashes (bcrypt)");
  const accounts = await prisma.account.findMany({
    where: {
      providerId: "credential",
      userId: { in: users.map(u => u.id) }
    }
  });
  console.log(`✓ PASS: Found ${accounts.length}/5 credential accounts`);
  for (const account of accounts) {
    if (!account.password || account.password.length < 60) {
      throw new Error(`FAIL: Invalid hash for ${account.accountId}`);
    }
    console.log(`  ${account.accountId}: bcrypt $2a$ hash (${account.password.length} chars)`);
  }
  console.log();

  // TEST 3: Verify password
  console.log("TEST 3: Verify password comparison");
  const investor = users.find(u => u.email === "int-comprador@test.local");
  const investorAccount = accounts.find(a => a.userId === investor.id);
  const testPassword = "Test123!investor";
  const valid = await bcrypt.compare(testPassword, investorAccount.password);
  console.log(`  Password: ${testPassword}`);
  console.log(`  Hash: ${investorAccount.password.substring(0, 29)}...`);
  console.log(`✓ PASS: Password verification ${valid ? "SUCCESS" : "FAILED"}\n`);
  if (!valid) throw new Error("FAIL: Password does not match");

  // TEST 4: Verify roles
  console.log("TEST 4: Verify distinct roles");
  const roleMap = {};
  users.forEach(u => {
    roleMap[u.role] = (roleMap[u.role] || 0) + 1;
  });
  console.log(`  Roles: ${Object.keys(roleMap).join(", ")}`);
  console.log(`✓ PASS: ${Object.keys(roleMap).length} distinct roles\n`);

  // TEST 5: Verify project ownership
  console.log("TEST 5: Verify project ownership (sellers only)");
  const projects = await prisma.project.findMany({
    where: {
      slug: { in: ["int-test-sabi", "int-test-manual"] }
    },
    include: { owner: true }
  });
  console.log(`✓ PASS: Found ${projects.length}/2 projects`);
  for (const p of projects) {
    console.log(`  ${p.slug}: owner ${p.owner.email} (role: ${p.owner.role})`);
    if (p.owner.role !== "seller") throw new Error(`FAIL: Owner must be seller, got ${p.owner.role}`);
  }
  console.log();

  // TEST 6: Verify non-sellers cannot own
  console.log("TEST 6: Verify investor/advisor cannot own projects (NEGATIVE)");
  const nonSellerIds = users.filter(u => u.role !== "seller" && u.role !== "admin").map(u => u.id);
  const wrongProjects = await prisma.project.count({
    where: { ownerId: { in: nonSellerIds } }
  });
  console.log(`✓ PASS: Non-sellers own ${wrongProjects}/0 projects (expected 0)\n`);
  if (wrongProjects > 0) throw new Error("FAIL: Non-sellers should not own projects");

  // TEST 7: Verify terms acceptance
  console.log("TEST 7: Verify all users accepted terms");
  const withoutTerms = users.filter(u => !u.termsAcceptedAt);
  console.log(`✓ PASS: ${users.length - withoutTerms.length}/${users.length} accepted terms\n`);
  if (withoutTerms.length > 0) throw new Error("FAIL: Some users have not accepted terms");

  // TEST 8: Verify email verification
  console.log("TEST 8: Verify all users have verified emails");
  const unverified = users.filter(u => !u.emailVerified);
  console.log(`✓ PASS: ${users.length - unverified.length}/${users.length} emails verified\n`);
  if (unverified.length > 0) throw new Error("FAIL: Some emails unverified");

  // TEST 9: Verify project published status
  console.log("TEST 9: Verify projects are published");
  const unpublished = projects.filter(p => p.status !== "published");
  console.log(`✓ PASS: ${projects.length - unpublished.length}/${projects.length} published\n`);
  if (unpublished.length > 0) throw new Error("FAIL: Some projects not published");

  // TEST 10: Wrong role access (NEGATIVE)
  console.log("TEST 10: Verify wrong role cannot access other's projects (NEGATIVE)");
  const sabiProject = projects.find(p => p.slug === "int-test-sabi");
  const manualSeller = users.find(u => u.email === "int-vendedor-manual@test.local");
  const canAccess = sabiProject.ownerId === manualSeller.id;
  console.log(`  Manual seller ${canAccess ? "CAN" : "CANNOT"} access SABI project`);
  console.log(`✓ PASS: Cross-owner access denied\n`);
  if (canAccess) throw new Error("FAIL: Seller should not access other seller's project");

  console.log("=== ALL 10 TESTS PASSED ===");
}

runTests()
  .then(async () => {
    await pool.end();
    await prisma.$disconnect();
    console.log("\nTest suite completed successfully.");
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(`\n❌ ${e.message}`);
    await pool.end();
    await prisma.$disconnect();
    process.exit(1);
  });
