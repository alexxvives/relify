#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";

const accessFile = "/opt/cursor/artifacts/relify-int-test-access.txt";
const credentials = readFileSync(accessFile, "utf8")
  .split("\n")
  .filter(l => l.includes("@"))
  .map(l => {
    const [email, pw] = l.split(": ")[1].split(" / ");
    return { email, password: pw };
  });

const pool = new pg.Pool({
  host: "localhost",
  user: "postgres",
  database: "releva_int_test",
  port: 5432,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log(`[INT Auth Test] Testing ${credentials.length} users\n`);

for (const { email, password } of credentials) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`✗ ${email} - user not found`);
      continue;
    }
    
    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    
    if (!account || !account.password) {
      console.log(`✗ ${email} - no credential account`);
      continue;
    }

    // Verify password hash format
    const isScrypt = account.password.includes(":");
    const hashPreview = account.password.slice(0, 40) + "...";
    
    console.log(`✓ ${email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Terms: ${user.termsAcceptedAt ? "accepted" : "pending"}`);
    console.log(`  Hash: ${isScrypt ? "scrypt" : "unknown"} (${hashPreview})`);
    console.log();
  } catch (err) {
    console.log(`✗ ${email} - ${err.message}`);
  }
}

await prisma.$disconnect();
await pool.end();
