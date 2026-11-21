import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { authCopy } from "@/lib/auth-copy";
import { companyCopy } from "@/lib/company-copy";
import { investorCopy } from "@/lib/investor-copy";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("S25c placeholders never look like a value already filled in", () => {
  it("uses example-style or neutral copy", () => {
    expect(companyCopy.locationPlaceholder).toBe("Ej.: Sabadell, Barcelona");
    expect(investorCopy.locationPlaceholder).toBe("Ej.: Sabadell, Cataluña, España"); // S26: Ciudad, Comunidad, España
    expect(companyCopy.nifPlaceholder).toMatch(/^Ej\.: /);
    expect(authCopy.nationalIdPlaceholder).toMatch(/^Ej\.: /);
    expect(companyCopy.amountPlaceholder).toBe("Importe en €");
  });

  it("drops the hardcoded realistic placeholders from the seller wizard and NIF step", () => {
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).not.toMatch(/placeholder="08022, Barcelona"/);
    expect(form).not.toMatch(/placeholder="0"/);
    expect(read("src/components/seller/company-nif-form.tsx")).not.toMatch(/placeholder="B\d/);
  });

  it("checks every literal placeholder in the wizard, /cuenta and the buyer profile", () => {
    const files = [
      "src/components/seller/company-draft-form.tsx",
      "src/components/seller/company-nif-form.tsx",
      "src/components/account/account-settings.tsx",
      "src/components/investor/investor-profile.tsx",
    ];
    for (const file of files) {
      for (const [, text] of read(file).matchAll(/placeholder="([^"]*)"/g)) {
        // Literal placeholders left are prompts ("Elige …"), never digits, codes or amounts.
        expect(text, `${file}: ${text}`).not.toMatch(/\d/);
      }
    }
  });

  it("paints placeholders in one lighter, regular-weight colour", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/--field-placeholder: #8b95a7/);
    expect(css).toMatch(/\.relify-field::placeholder \{\s*color: var\(--field-placeholder\);\s*font-weight: 400;/);
    expect(read("src/components/ui/form/index.tsx")).toMatch(/placeholder:font-normal placeholder:text-\[var\(--field-placeholder\)\]/);
  });

  it("lets Falta para publicar and Inicio links focus the Ubicación input", () => {
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).toMatch(/id="company-location"\s+name="location"\s+data-flash/);
    // The deep link is marked done only after it highlights, so a cancelled first effect run still focuses later.
    expect(form).toMatch(/deepLinkDone\.current = true;\s+highlightTarget\(target, true\);/);
    expect(read("src/lib/publish-checklist.ts")).toMatch(/detailHref\("identity", "panel-location"\)/);
  });
});
