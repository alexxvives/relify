import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { authCopy } from "@/lib/auth-copy";
import {
  readUserRole,
  type SignInInput,
  type UserRoleName,
} from "@/lib/auth-input";
import { auth } from "@/server/auth";
import { authFailureMessage } from "@/server/auth-failure";
import { prisma } from "@/server/db";

export type SignInResult =
  | { ok: true; role: UserRoleName | null; onboarded: boolean }
  | { ok: false; message: string };

export async function signIn(input: SignInInput): Promise<SignInResult> {
  try {
    const blocked = await prisma.user.findUnique({
      where: { email: input.email },
      select: { suspendedAt: true },
    });

    if (blocked?.suspendedAt) {
      return { ok: false, message: authCopy.suspended };
    }

    const signedIn = await auth.api.signInEmail({
      body: {
        email: input.email,
        password: input.password,
      },
      headers: await headers(),
    });
    const stored = await prisma.user.findUnique({
      where: { id: signedIn.user.id },
      select: { role: true, onboardedAt: true, suspendedAt: true },
    });

    if (stored?.suspendedAt) {
      await prisma.session.deleteMany({ where: { userId: signedIn.user.id } });
      return { ok: false, message: authCopy.suspended };
    }

    return {
      ok: true,
      role: readUserRole(stored?.role),
      onboarded: stored?.onboardedAt != null,
    };
  } catch (error) {
    // Wrong credentials are expected; anything else (database, runtime) is a real
    // server fault and must reach the Worker logs instead of a generic message.
    const code = error instanceof APIError ? error.body?.code : undefined;
    if (code === "INVALID_EMAIL_OR_PASSWORD") {
      console.warn("[signIn] rejected credentials", { email: input.email });
    } else {
      console.error("[signIn] failed", { email: input.email, code }, error);
    }
    return {
      ok: false,
      message: authFailureMessage(error, authCopy.signInFailed),
    };
  }
}
