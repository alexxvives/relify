import { PrismaClient } from "../src/generated/prisma/client.js";
const prisma = new PrismaClient();
const users = await prisma.user.findMany({ select: { email: true, name: true, lastName: true, role: true, onboardedAt: true } });
console.log(JSON.stringify(users, null, 2));
await prisma.$disconnect();
