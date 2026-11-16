"use server";

import { z } from "zod";
import { authCopy } from "@/lib/auth-copy";
import { auth } from "@/lib/server/auth";
import { clientIp, takeThrottle, throttleHash } from "@/lib/server/email-throttle";

export type ForgotState = { sent: boolean; message: string } | null;
export type ResetState = { message: string; invalid?: boolean } | null;

const emailSchema = z.email().max(254);

/** Always answers the same way, so the page never says whether an account exists. */
export async function requestPasswordResetAction(
  _state: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!parsed.success) {
    return { sent: false, message: "Escribe un correo válido." };
  }

  const ip = await clientIp();
  const ipOk = await takeThrottle(`reset:ip:${ip}`, 5, 15 * 60, false);
  if (!ipOk) {
    return { sent: false, message: authCopy.forgotThrottled };
  }

  // Per-address cap: silently stop sending, but answer exactly as on success.
  const addressOk = await takeThrottle(
    `reset:email:${throttleHash(parsed.data)}`,
    3,
    60 * 60,
  );
  if (addressOk) {
    try {
      await auth.api.requestPasswordReset({ body: { email: parsed.data } });
    } catch {
      console.warn("[password-reset] request failed");
    }
  }

  return { sent: true, message: authCopy.forgotSent };
}

const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(128),
});

export async function resetPasswordAction(
  _state: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { message: "La contraseña debe tener entre 8 y 128 caracteres." };
  }

  const ip = await clientIp();
  if (!(await takeThrottle(`reset-confirm:ip:${ip}`, 10, 15 * 60, false))) {
    return { message: authCopy.forgotThrottled };
  }

  try {
    await auth.api.resetPassword({
      body: { token: parsed.data.token, newPassword: parsed.data.password },
    });
  } catch {
    return { message: authCopy.resetInvalid, invalid: true };
  }

  return { message: "ok" };
}
