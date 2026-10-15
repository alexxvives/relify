import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { readServerEnv } from "@/lib/env";
import { prisma } from "@/server/db";
import { sendAccountEmail } from "@/server/sendAccountEmail";

function createAuth() {
  const env = readServerEnv();
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendAccountEmail({ to: user.email, url });
      },
    },
    session: {
      freshAge: 60 * 60 * 24 * 30,
    },
    user: {
      changeEmail: {
        enabled: true,
      },
      deleteUser: {
        enabled: true,
      },
      additionalFields: {
        role: {
          type: ["seller", "investor", "advisor", "admin"],
          required: false,
          input: false,
        },
      },
    },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;

let authInstance: Auth | undefined;

function getAuth(): Auth {
  authInstance ??= createAuth();
  return authInstance;
}

export const auth: Auth = new Proxy({} as Auth, {
  get(_target, property, receiver) {
    const instance = getAuth();
    const value: unknown = Reflect.get(instance, property, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
  has(_target, property) {
    return property in getAuth();
  },
});
