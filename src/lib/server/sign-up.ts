import { headers } from "next/headers";
import { authCopy } from "@/lib/auth-copy";
import {
  pendingAccountName,
  type AuthResult,
  type SignUpInput,
} from "@/lib/auth-input";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/server/auth";
import { authFailureMessage } from "@/lib/server/auth-failure";

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  try {
    await auth.api.signUpEmail({
      body: {
        name: pendingAccountName(input.email),
        email: input.email,
        password: input.password,
        callbackURL: "/entrar",
      },
      headers: await headers(),
    });
    await prisma.user.update({
      where: { email: input.email },
      data: { termsAcceptedAt: new Date() },
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: authFailureMessage(error, authCopy.signUpFailed),
    };
  }
}
