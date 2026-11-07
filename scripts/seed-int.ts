/**
 * INT synthetic data seeding.
 * Creates test accounts and projects with synthetic data only.
 * NEVER clone production data.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "crypto";

// Create database adapter
const databaseUrl = process.env.INT_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL not configured");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function seedIntData() {
  console.log("[INT Seed] Starting synthetic data creation");
  console.log("[INT Seed] WARNING: This will create test data in INT database");
  console.log("");
  
  // Verify we're in INT mode
  if (process.env.INT_ENVIRONMENT !== "true") {
    throw new Error("INT_ENVIRONMENT must be 'true' to run INT seed");
  }
  
  // Verify database URL is INT
  const dbUrl = process.env.INT_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("Database URL not configured");
  }
  
  if (dbUrl.includes("itsreleva") || dbUrl.includes("itsrelify") || (dbUrl.includes("neon.tech") && !dbUrl.includes("-int"))) {
    throw new Error("Database appears to be production. INT seed requires isolated database.");
  }
  
  console.log("[INT Seed] Database: validated as non-production");
  console.log("");
  
  // Create INT test users
  // NOTE: better-auth handles password hashing via its own routes
  // For seeding, create users via better-auth signup or manually hash
  
  console.log("[INT Seed] Creating test users...");
  
  const testUsers = [
    { email: "int-seller@test.local", name: "INT Seller", role: "seller" },
    { email: "int-buyer@test.local", name: "INT Buyer", role: "investor" },
    { email: "int-advisor@test.local", name: "INT Advisor", role: "advisor" },
  ] as const;
  
  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      create: {
        id: randomUUID(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        emailVerified: true,
        onboardedAt: new Date(),
        termsAcceptedAt: new Date(),
      },
      update: {},
    });
    console.log(`  ✓ ${userData.name} (${userData.email})`);
  }
  
  console.log("");
  console.log("[INT Seed] ✅ Synthetic users created");
  console.log("");
  console.log("NOTE: Set passwords via better-auth signup or direct SQL:");
  console.log("  UPDATE \"user\" SET password = crypt('password', gen_salt('bf'))");
  console.log("  WHERE email LIKE 'int-%@test.local';");
  console.log("");
  console.log("[INT Seed] Complete");
}

seedIntData()
  .catch((error) => {
    console.error("[INT Seed] ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
