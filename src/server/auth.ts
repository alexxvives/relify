import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { readServerEnv } from "@/lib/env";
import { prisma } from "@/server/db";

const env = readServerEnv();

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
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
