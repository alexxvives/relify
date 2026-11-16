import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sideCannonColors, sideCannonDurationMs, sideCannonShots } from "@/lib/client/side-cannons";
import { platformAgreementSigned } from "@/lib/platform-agreement";
import { platformTermsCopy } from "@/lib/platform-terms";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("S26b: one signature closes the Acuerdo con Relify dialog", () => {
  it("counts a signature as signed even right after account creation (fresh and seed accounts)", () => {
    const createdAt = new Date("2026-11-16T09:00:00Z");
    // Signed 1 minute after sign-up: inside the S26 sign-up window, but the signature makes it signed.
    expect(platformAgreementSigned({ termsAcceptedAt: new Date(createdAt.getTime() + 60_000), hasSignature: true, createdAt })).toBe(true);
    // Seed account stamped at creation, then signed now.
    expect(platformAgreementSigned({ termsAcceptedAt: new Date(createdAt.getTime() + 5), hasSignature: true, createdAt })).toBe(true);
  });

  it("the sign action writes what the rule reads and no longer redirects to the page the user is on", () => {
    const action = read("src/app/acuerdo/actions.ts");
    expect(action).toMatch(/termsAcceptedAt: new Date\(\), signaturePng: signatureBytes\(bytes\)/);
    expect(action).toMatch(/return \{ ok: true, home: homeForRole\(user\.role\) \}/);
    expect(action).not.toMatch(/redirect\(homeForRole/);
  });

  it("the shell keeps the dialog mounted and the dialog closes itself, then refreshes", () => {
    expect(read("src/components/shell/app-shell.tsx")).toMatch(/<PlatformTermsDialog required=\{!user\.termsAccepted && user\.role !== "admin"\} \/>/);
    const dialog = read("src/components/auth/platform-terms-dialog.tsx");
    expect(dialog).toMatch(/<PlatformTermsForm onSigned=\{onSigned\} \/>/);
    expect(dialog).toMatch(/dialogRef\.current\?\.close\(\)/);
    expect(dialog).toMatch(/router\.refresh\(\)/);
    expect(dialog).toMatch(/if \(!fired\.current\)/);
    const form = read("src/components/auth/platform-terms-form.tsx");
    expect(form).toMatch(/handled\.current === state/);
    expect(form).toMatch(/router\.replace\(state\.home\)/);
  });
});

describe("S26b: signed state and welcome confetti", () => {
  it("uses the requested side cannons", () => {
    expect(sideCannonDurationMs).toBe(3000);
    expect([...sideCannonColors]).toEqual(["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]);
    expect(sideCannonShots).toEqual([
      { particleCount: 2, angle: 60, spread: 55, startVelocity: 60, origin: { x: 0, y: 0.5 } },
      { particleCount: 2, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.5 } },
    ]);
  });

  it("loads canvas-confetti on demand, skips it for reduced motion and runs on requestAnimationFrame", () => {
    const source = read("src/lib/client/side-cannons.ts");
    expect(source).toMatch(/await import\("canvas-confetti"\)/);
    expect(source).toMatch(/prefers-reduced-motion: reduce/);
    expect(source).toMatch(/requestAnimationFrame\(frame\)/);
    expect(source).toMatch(/useWorker: false/);
    expect(read("src/app/globals.css")).toMatch(/\.relify-signed-check \{[\s\S]*animation: relify-signed-pop/);
  });

  it("has the success and welcome copy", () => {
    expect(platformTermsCopy.signedDone).toBe("Acuerdo firmado");
    expect(platformTermsCopy.welcome).toBe("¡Bienvenido a Relify!");
  });
});
