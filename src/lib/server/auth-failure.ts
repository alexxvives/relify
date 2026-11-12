import { APIError } from "better-auth/api";
import { messageForAuthCode } from "@/lib/auth-input";

export function authFailureMessage(error: unknown, fallback: string): string {
  const code = error instanceof APIError ? error.body?.code : undefined;
  return messageForAuthCode(code, fallback);
}
