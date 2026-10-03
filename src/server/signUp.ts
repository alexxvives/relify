import { headers } from "next/headers";
import { authCopy } from "@/lib/auth-copy";
import { pendingAccountName, type AuthResult, type SignUpInput } from "@/lib/auth-input";
import { auth } from "@/server/auth";
import { authFailureMessage } from "@/server/auth-failure";

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  try {
    await auth.api.signUpEmail({
      body: {
        name: pendingAccountName(input.email),
        email: input.email,
        password: input.password,
      },
      headers: await headers(),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: authFailureMessage(error, authCopy.signUpFailed) };
  }
}
