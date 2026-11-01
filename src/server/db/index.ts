import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { readServerEnv } from "@/lib/env";
import { type AppPrismaClient, withNumberCents } from "./numberCents";
import {
  getRequestContext,
  isInsideUnifiedScope,
} from "vinext/shims/unified-request-context";

const globalForPrisma = globalThis as unknown as { prisma?: AppPrismaClient };

function onWorkers(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers"
  );
}

function isLocalDatabase(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

function createPrismaClient(): AppPrismaClient {
  const { DATABASE_URL } = readServerEnv();

  // Neon's WebSocket driver only talks to Neon. A local Postgres (vinext dev or
  // preview against localhost) goes through node-postgres over TCP sockets.
  if (onWorkers() && !isLocalDatabase(DATABASE_URL)) {
    const socket = globalThis.WebSocket;

    if (!socket) {
      throw new Error("WebSocket is required on the Worker");
    }

    neonConfig.webSocketConstructor = socket;
    neonConfig.poolQueryViaFetch = true;
    const adapter = new PrismaNeon({ connectionString: DATABASE_URL });
    return withNumberCents(new PrismaClient({ adapter }));
  }

  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  return withNumberCents(new PrismaClient({ adapter }));
}

// Workers forbid reusing I/O objects (sockets, WebSockets) across requests: a
// client cached on globalThis hangs or throws on the second request. On Workers
// we keep one client per request context instead.
const requestClients = new WeakMap<object, AppPrismaClient>();

function getPrisma(): AppPrismaClient {
  if (onWorkers() && isInsideUnifiedScope()) {
    const context = getRequestContext();
    let client = requestClients.get(context);
    if (!client) {
      client = createPrismaClient();
      requestClients.set(context, client);
    }
    return client;
  }
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
}

export const prisma: AppPrismaClient = new Proxy({} as AppPrismaClient, {
  get(_target, property, receiver) {
    const client = getPrisma();
    const value: unknown = Reflect.get(client, property, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
