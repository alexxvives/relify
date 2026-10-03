import { headers } from "next/headers";
import { authCopy } from "@/lib/auth-copy";
import { readUserRole, type SignInInput, type UserRoleName } from "@/lib/auth-input";
import { auth } from "@/server/auth";
import { authFailureMessage } from "@/server/auth-failure";
import { prisma } from "@/server/db";

export type SignInResult =
  | { ok: true; role: UserRoleName | null; onboarded: boolean }
  | { ok: false; message: string };

export async function signIn(input: SignInInput): Promise<SignInResult> {
  try {
    const signedIn = await auth.api.signInEmail({
      body: {
        email: input.email,
        password: input.password,
      },
      headers: await headers(),
    });
    const stored = await prisma.user.findUnique({
      where: { id: signedIn.user.id },
      select: { role: true, onboardedAt: true },
    });
    return {
      ok: true,
      role: readUserRole(stored?.role),
      onboarded: stored?.onboardedAt != null,
    };
  } catch (error) {
    return { ok: false, message: authFailureMessage(error, authCopy.signInFailed) };
  }
}
