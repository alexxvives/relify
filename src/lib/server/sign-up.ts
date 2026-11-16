import { headers } from "next/headers";
import { authCopy } from "@/lib/auth-copy";
import {
  pendingAccountName,
  type AuthResult,
  type SignUpInput,
} from "@/lib/auth-input";
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
    // S26: the Términos checkbox is enforced by readSignUpForm. It must not stamp terms_accepted_at: that column
    // means "signed the Acuerdo con Relify" (PlatformTermsDialog), and stamping it here skipped the agreement.
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: authFailureMessage(error, authCopy.signUpFailed),
    };
  }
}
