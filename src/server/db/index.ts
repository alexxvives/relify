import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { readServerEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function onWorkers(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

function createPrismaClient(): PrismaClient {
  const { DATABASE_URL } = readServerEnv();

  if (onWorkers()) {
    const socket = globalThis.WebSocket;

    if (!socket) {
      throw new Error("WebSocket is required on the Worker");
    }

    neonConfig.webSocketConstructor = socket;
    neonConfig.poolQueryViaFetch = true;
    const adapter = new PrismaNeon({ connectionString: DATABASE_URL });
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrisma();
    const value: unknown = Reflect.get(client, property, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
