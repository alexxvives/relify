const { PrismaClient } = require("./src/generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
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
    const hashedPassword = await bcrypt.hash(password, 10);
    
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

  const sabi = await prisma.project.upsert({
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
      description: "Test project",
      sellingReason: "Test",
      priceEur: 500000,
      band: "band_11_20",
      listingType: "business",
    },
    update: {},
  });

  const manual = await prisma.project.upsert({
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
      description: "Test project",
      sellingReason: "Test",
      priceEur: 300000,
      band: "band_6_10",
      listingType: "business",
    },
    update: {},
  });

  console.log("✓ Seeded 5 users and 2 projects");
  console.log("\nTest credentials:");
  credentials.forEach(c => console.log(`  ${c}`));
  
  require("fs").writeFileSync("/opt/cursor/artifacts/test-credentials.txt", credentials.join("\n"));
}

main()
  .then(async () => {
    await pool.end();
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    await pool.end();
    await prisma.$disconnect();
    process.exit(1);
  });
