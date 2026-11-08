import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

const testUsers = [
  { key: "investor", email: "int-comprador@test.local", name: "Comprador INT", role: "investor" },
  { key: "advisor", email: "int-asesor@test.local", name: "Asesor INT", role: "advisor" },
  { key: "seller-sabi", email: "int-vendedor-sabi@test.local", name: "Vendedor INT (SABI)", role: "seller" },
  { key: "seller-manual", email: "int-vendedor-manual@test.local", name: "Vendedor INT (Manual)", role: "seller" },
  { key: "admin", email: "int-admin@test.local", name: "Admin INT", role: "admin" },
];

const users = {};
const credentials = [];

for (const { key, email, name, role } of testUsers) {
  const userId = randomUUID();
  const password = `Test123!${key}`;
  const hashedPassword = await hashPassword(password);
  
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
    update: { id: userId },
  });
  
  users[key] = user;
  credentials.push(`${email}:${password}`);
  
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: email,
      },
    },
    create: {
      userId: user.id,
      providerId: "credential",
      accountId: email,
      password: hashedPassword,
    },
    update: { password: hashedPassword },
  });
}

// Create SABI project
const sabiProject = await prisma.project.upsert({
  where: { slug: "int-test-sabi" },
  create: {
    id: randomUUID(),
    ownerId: users["seller-sabi"].id,
    status: "published",
    title: "INT Test Project (SABI)",
    slug: "int-test-sabi",
    nif: "A12345678",
    location: "Madrid, España",
    foundedYear: 2015,
    description: "Test project imported from SABI",
    sellingReason: "Test reason",
    priceEur: 500000,
    band: "band_11_20",
    listingType: "business",
  },
  update: {},
});

// Create Manual project
const manualProject = await prisma.project.upsert({
  where: { slug: "int-test-manual" },
  create: {
    id: randomUUID(),
    ownerId: users["seller-manual"].id,
    status: "published",
    title: "INT Test Project (Manual)",
    slug: "int-test-manual",
    nif: "B87654321",
    location: "Barcelona, España",
    foundedYear: 2018,
    description: "Test project created manually",
    sellingReason: "Test reason",
    priceEur: 300000,
    band: "band_6_10",
    listingType: "business",
  },
  update: {},
});

console.log("✓ Created 5 test users");
console.log("✓ Created 2 test projects");
console.log("\nTest credentials saved to /opt/cursor/artifacts/test-credentials.txt");

import { writeFileSync } from "fs";
writeFileSync("/opt/cursor/artifacts/test-credentials.txt", credentials.join("\n"));

await pool.end();
await prisma.$disconnect();
