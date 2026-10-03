import * as z from "zod";
import { authCopy } from "./auth-copy";
import { isValidSpanishCif } from "./spanish-cif";

export const signupRoles = ["seller", "investor", "advisor"] as const;

export const userRoles = ["seller", "investor", "advisor", "admin"] as const;

export const referralSources = ["search", "social", "press", "recommendation", "ads", "other"] as const;

export type SignupRole = (typeof signupRoles)[number];

export type UserRoleName = (typeof userRoles)[number];

export type ReferralSource = (typeof referralSources)[number];

export type AuthResult = { ok: true } | { ok: false; message: string };

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const phoneNationalSchema = z.string().regex(/^[6-9]\d{8}$/);

export const onboardingSchema = z.object({
  name: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  nationalId: z.string().trim().superRefine((value, context) => {
    if (value.length === 0) {
      context.addIssue({ code: "custom", message: "required" });
      return;
    }

    if (!isValidSpanishCif(value)) {
      context.addIssue({ code: "custom", message: "invalid" });
    }
  }),
  phone: phoneNationalSchema,
  role: z.enum(signupRoles),
  referralSource: z.enum(referralSources),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export type SignInInput = z.infer<typeof signInSchema>;

export function homeForRole(role: UserRoleName | null): string {
  if (role === "investor") {
    return "/inversor";
  }

  if (role === "seller") {
    return "/mi-empresa";
  }

  if (role === "advisor") {
    return "/mandatos";
  }

  return "/cuenta";
}

export function destinationForUser(user: { role: UserRoleName | null; onboarded: boolean }): string {
  if (!user.onboarded) {
    return "/onboarding";
  }

  return homeForRole(user.role);
}

export function accountDisplayName(name: string, lastName: string | null): string {
  const last = lastName?.trim() ?? "";

  if (last.length === 0) {
    return name;
  }

  return `${name} ${last}`;
}

export function accountInitials(displayName: string): string {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2);
  const letters = parts.map((part) => part[0] ?? "").join("");

  if (letters.length === 0) {
    return "R";
  }

  return letters.toLocaleUpperCase("es-ES");
}

export function storedPhone(national: string): string {
  return `+34${national}`;
}

export function pendingAccountName(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  const name = localPart.trim().slice(0, 80);

  if (name.length === 0) {
    return "Cuenta";
  }

  return name;
}

export function readUserRole(value: unknown): UserRoleName | null {
  if (typeof value !== "string") {
    return null;
  }

  return userRoles.find((role) => role === value) ?? null;
}

export function signUpFieldMessage(error: z.ZodError): string {
  const field = error.issues[0]?.path[0];

  if (field === "email") {
    return authCopy.invalidEmail;
  }

  if (field === "password") {
    return authCopy.passwordLength;
  }

  return authCopy.invalidForm;
}

export function onboardingFieldMessage(error: z.ZodError): string {
  const field = error.issues[0]?.path[0];

  if (field === "name") {
    return authCopy.nameRequired;
  }

  if (field === "lastName") {
    return authCopy.lastNameRequired;
  }

  if (field === "nationalId") {
    const issue = error.issues.find((item) => item.path[0] === "nationalId");
    return issue?.message === "required" ? authCopy.nationalIdRequired : authCopy.nationalIdInvalid;
  }

  if (field === "phone") {
    return authCopy.phoneInvalid;
  }

  if (field === "role") {
    return authCopy.roleRequired;
  }

  if (field === "referralSource") {
    return authCopy.referralRequired;
  }

  return authCopy.invalidForm;
}

export function signInFieldMessage(error: z.ZodError): string {
  const field = error.issues[0]?.path[0];

  if (field === "email") {
    return authCopy.invalidEmail;
  }

  if (field === "password") {
    return authCopy.passwordLength;
  }

  return authCopy.invalidForm;
}

export function messageForAuthCode(code: string | undefined, fallback: string): string {
  if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return authCopy.emailTaken;
  }

  if (code === "INVALID_EMAIL" || code === "INVALID_EMAIL_OR_PASSWORD") {
    return authCopy.invalidCredentials;
  }

  if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
    return authCopy.passwordLength;
  }

  return fallback;
}
