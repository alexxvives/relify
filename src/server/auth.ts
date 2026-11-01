import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { readServerEnv, readSiteUrl } from "@/lib/env";
import { prisma } from "@/server/db";
import { passwordResetEmail } from "@/lib/email/messages";
import { sendAccountEmail } from "@/server/sendAccountEmail";
import { sendMail } from "@/server/mailer";

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
      // t73b: reset links point at our own page; the token is single-use, lives 1 h and is
      // stored hashed (verification.storeIdentifier below). Other sessions end on reset.
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, token }) => {
        const url = new URL("/restablecer-contrasena", readSiteUrl());
        url.searchParams.set("token", token);
        await sendMail({
          to: user.email,
          tag: "password-reset",
          ...passwordResetEmail(url.toString()),
        });
      },
    },
    verification: {
      storeIdentifier: "hashed",
    },
    // Email-sending endpoints run only through our server actions, which carry their own
    // per-IP and per-address throttle (src/server/emailThrottle.ts). Close the raw HTTP routes.
    disabledPaths: [
      "/sign-up/email",
      "/request-password-reset",
      "/reset-password",
      "/send-verification-email",
    ],
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendAccountEmail({ to: user.email, url });
      },
    },
    session: {
      freshAge: 60 * 60 * 24 * 30,
      // Signed session snapshot in a cookie: skips the session-table round
      // trip on most requests. The user row (role, suspension) is still read
      // live in getCurrentUser, so a suspended account is cut off at once.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
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
