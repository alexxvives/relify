import * as z from "zod";
import { authCopy } from "./auth-copy";
import { isValidPhoneNational, phoneCountryByIso } from "./phone-countries";

export { storedPhone } from "./phone-countries";
import { isValidSpanishPersonId } from "./spanish-cif";

export const signupRoles = ["seller", "investor", "advisor"] as const;

export const userRoles = ["seller", "investor", "advisor", "admin"] as const;

export const referralSources = ["search", "social", "press", "recommendation", "ads", "other"] as const;

export type SignupRole = (typeof signupRoles)[number];

export type UserRoleName = (typeof userRoles)[number];

export type ReferralSource = (typeof referralSources)[number];

export function referralSourceLabel(source: string | null | undefined): string | null {
  if (source === undefined || source === null || source === "") {
    return null;
  }

  if (!referralSources.some((item) => item === source)) {
    return null;
  }

  return authCopy.referralSources[source as ReferralSource].label;
}

export type AuthResult = { ok: true } | { ok: false; message: string };

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export function splitAccountName(value: string): { name: string; lastName: string } | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  const space = trimmed.indexOf(" ");

  if (space <= 0) {
    return null;
  }

  const name = trimmed.slice(0, space);
  const lastName = trimmed.slice(space + 1);

  if (name.length === 0 || name.length > 80 || lastName.length === 0 || lastName.length > 80) {
    return null;
  }

  return { name, lastName };
}

const nationalIdSchema = z.string().trim().superRefine((value, context) => {
  if (value.length === 0) {
    context.addIssue({ code: "custom", message: "required" });
    return;
  }

  if (!isValidSpanishPersonId(value)) {
    context.addIssue({ code: "custom", message: "invalid" });
  }
});

function refinePhone(value: { phoneCountry: string; phone: string }, context: z.RefinementCtx): void {
  if (!phoneCountryByIso(value.phoneCountry)) {
    context.addIssue({ code: "custom", path: ["phoneCountry"], message: "invalid" });
    return;
  }

  if (!isValidPhoneNational(value.phoneCountry, value.phone)) {
    context.addIssue({
      code: "custom",
      path: ["phone"],
      message: value.phoneCountry === "ES" ? "spain" : "international",
    });
  }
}

export const onboardingSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    nationalId: nationalIdSchema,
    phoneCountry: z.string(),
    phone: z.string(),
    role: z.enum(signupRoles),
    referralSource: z.enum(referralSources),
  })
  .superRefine(refinePhone);

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const accountProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    nationalId: nationalIdSchema,
    phoneCountry: z.string(),
    phone: z.string(),
  })
  .superRefine(refinePhone);

export type AccountProfileInput = z.infer<typeof accountProfileSchema>;

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

  if (role === "admin") {
    return "/admin";
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

export function parseAccountEmail(value: string): string | null {
  const parsed = emailSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
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

  if (field === "phone" || field === "phoneCountry") {
    const issue = error.issues.find((item) => item.path[0] === "phone" || item.path[0] === "phoneCountry");
    return issue?.message === "international" ? authCopy.phoneInvalidInternational : authCopy.phoneInvalid;
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

  if (code === "INVALID_PASSWORD") {
    return authCopy.passwordWrong;
  }

  if (code === "SESSION_NOT_FRESH" || code === "SESSION_EXPIRED") {
    return authCopy.sessionStale;
  }

  return fallback;
}
