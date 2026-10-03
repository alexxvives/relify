import { describe, expect, it } from "vitest";
import {
  accountDisplayName,
  accountInitials,
  destinationForUser,
  homeForRole,
  messageForAuthCode,
  onboardingSchema,
  pendingAccountName,
  readUserRole,
  signInSchema,
  signUpSchema,
  signupRoles,
} from "./auth-input";

const validSignUp = {
  email: "Ana@Example.com",
  password: "clave-segura",
} as const;

describe("signUpSchema", () => {
  it("stores a lowercase email and password", () => {
    expect(signUpSchema.parse(validSignUp)).toEqual({
      email: "ana@example.com",
      password: "clave-segura",
    });
  });

  it("rejects a short password and keeps admin off self-serve signup", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, password: "corta" }).success).toBe(false);
    expect(signupRoles).not.toContain("admin");
  });
});

describe("onboardingSchema", () => {
  it("keeps a name, a self-serve role, and how they found Releva", () => {
    expect(
      onboardingSchema.parse({
        name: " Ana ",
        lastName: " Ruiz ",
        nationalId: "B12345674",
        phone: "612345678",
        role: "investor",
        referralSource: "search",
      }),
    ).toEqual({
      name: "Ana",
      lastName: "Ruiz",
      nationalId: "B12345674",
      phone: "612345678",
      role: "investor",
      referralSource: "search",
    });
  });

  it("rejects admin and an empty referral", () => {
    expect(
      onboardingSchema.safeParse({
        name: "Ana",
        lastName: "Ruiz",
        nationalId: "B12345674",
        phone: "612345678",
        role: "admin",
        referralSource: "search",
      }).success,
    ).toBe(false);
    expect(
      onboardingSchema.safeParse({
        name: "Ana",
        lastName: "Ruiz",
        nationalId: "B12345678",
        phone: "112345678",
        role: "seller",
        referralSource: "search",
      }).success,
    ).toBe(false);
  });
});

describe("destinationForUser", () => {
  it("sends an unfinished account to onboarding and a finished one home", () => {
    expect(destinationForUser({ role: null, onboarded: false })).toBe("/onboarding");
    expect(destinationForUser({ role: "investor", onboarded: false })).toBe("/onboarding");
    expect(destinationForUser({ role: "seller", onboarded: true })).toBe("/mi-empresa");
    expect(destinationForUser({ role: "advisor", onboarded: true })).toBe("/mandatos");
  });
});

describe("accountDisplayName", () => {
  it("joins the surname and builds initials", () => {
    expect(accountDisplayName("Ana", "Ruiz")).toBe("Ana Ruiz");
    expect(accountDisplayName("Ana", null)).toBe("Ana");
    expect(accountInitials("Ana Ruiz")).toBe("AR");
  });
});

describe("pendingAccountName", () => {
  it("uses the mailbox name until onboarding replaces it", () => {
    expect(pendingAccountName("ana.ruiz@example.com")).toBe("ana.ruiz");
    expect(pendingAccountName("@example.com")).toBe("Cuenta");
  });
});

describe("signInSchema", () => {
  it("accepts an email and password without a role", () => {
    const parsed = signInSchema.parse({
      email: "Ana@Example.com",
      password: "clave-segura",
    });

    expect(parsed).toEqual({
      email: "ana@example.com",
      password: "clave-segura",
    });
  });
});

describe("homeForRole", () => {
  it("sends each role to its own home", () => {
    expect(homeForRole("investor")).toBe("/inversor");
    expect(homeForRole("seller")).toBe("/mi-empresa");
    expect(homeForRole("advisor")).toBe("/mandatos");
    expect(homeForRole("admin")).toBe("/cuenta");
    expect(homeForRole(null)).toBe("/cuenta");
  });
});

describe("readUserRole", () => {
  it("keeps the stored roles and drops anything else", () => {
    expect(readUserRole("advisor")).toBe("advisor");
    expect(readUserRole("admin")).toBe("admin");
    expect(readUserRole("buyer")).toBeNull();
    expect(readUserRole(null)).toBeNull();
  });
});

describe("messageForAuthCode", () => {
  it("maps duplicate emails and bad credentials", () => {
    expect(messageForAuthCode("USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "fallback")).toBe(
      "Ese correo ya tiene una cuenta.",
    );
    expect(messageForAuthCode("INVALID_EMAIL_OR_PASSWORD", "fallback")).toBe(
      "El correo o la contraseña no son correctos.",
    );
    expect(messageForAuthCode(undefined, "fallback")).toBe("fallback");
  });
});
