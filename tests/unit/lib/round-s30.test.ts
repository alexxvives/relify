import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { companyCopy } from "@/lib/company-copy";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("S30: vinext KV cache binding", () => {
  it("configures the KV data adapter for vinext", () => {
    const vite = read("vite.config.ts");
    expect(vite).toMatch(/from "@vinext\/cloudflare\/cache\/kv-data-adapter"/);
    expect(vite).toMatch(/cache: \{ data: kvDataAdapter\(\) \}/);
  });

  it("binds VINEXT_KV_CACHE on prod with an explicit id so deploys never auto-provision a namespace", () => {
    const prod = read("cloudflare.config.ts");
    expect(prod).toMatch(/VINEXT_KV_CACHE: bindings\.kv\(\{ id: RELEVA_VINEXT_KV_CACHE_ID \}\)/);
    expect(prod).toMatch(/const RELEVA_VINEXT_KV_CACHE_ID = "[^"]+"/);
    expect(prod).toMatch(/releva-vinext-cache/);
  });

  it("binds the INT namespace in the INT config and the packaged worker", () => {
    const id = "5657d0bd1ac44f9a8b344f93cbc43d17";
    expect(read("cloudflare.int.config.ts")).toMatch(new RegExp(`RELEVA_INT_VINEXT_KV_CACHE_ID = "${id}"`));
    const pack = read("scripts/package-int-worker.mjs");
    expect(pack).toMatch(new RegExp(`intKvCacheId = "${id}"`));
    expect(pack).toMatch(/binding = "VINEXT_KV_CACHE"/);
    expect(pack).toMatch(/type: "kv_namespace"/);
  });
});

describe("S30: Prisma baseline", () => {
  it("keeps the catch-up migration before later rounds, so migrations replay to the current schema", () => {
    const names = readdirSync(join(process.cwd(), "prisma/migrations")).filter((name) => /^\d{14}_/.test(name)).sort();
    expect(names.filter((name) => name > "20261116220000_schema_catch_up").every((name) => name >= "20261121000000")).toBe(true);
    expect(names).toContain("20261116220000_schema_catch_up");
    const sql = read("prisma/migrations/20261116220000_schema_catch_up/migration.sql");
    expect(sql).toMatch(/CREATE TABLE "signed_document"/);
    expect(sql).toMatch(/mark this migration as applied/);
  });

  it("the baseline script checks by default and only resolves with --apply --yes", () => {
    const script = read("scripts/prisma-baseline.mjs");
    expect(script).toMatch(/--from-config-datasource/);
    expect(script).toMatch(/--exit-code/);
    expect(script).toMatch(/if \(apply && !confirmed\)/);
    expect(script).toMatch(/"migrate", "resolve", "--applied"/);
    expect(script).toMatch(/target === shadow/);
    expect(script).not.toMatch(/console\.(log|error)\([^;]*(\$\{target\}|\$\{shadow\}|process\.env)/);
  });

  it("ships the INT align SQL, idempotent and transactional", () => {
    const sql = read("prisma/int-s30-align-array-not-null.sql");
    expect(sql).toMatch(/alter table advisor_profile alter column sectors set not null/);
    expect(sql).toMatch(/alter table advisory_quote alter column services set not null/);
    expect(sql).toMatch(/^begin;$/m);
    expect(existsSync(join(process.cwd(), "docs/DEPLOY-S30.md"))).toBe(true);
  });
});

describe("S30: Relify agreement and Detalles de empresa", () => {
  it("the agreement pad hides the stored DNI/NIE line; NDA and LOI keep it", () => {
    expect(read("src/components/auth/platform-terms-form.tsx")).toMatch(/showStoredNationalId=\{false\}/);
    const pad = read("src/components/investor/signature-pad.tsx");
    expect(pad).toMatch(/showStoredNationalId = true/);
    expect(pad).toMatch(/const showStored = showStoredNationalId && !askId/);
  });

  it("drops the inline Falta para publicar block and the Ubicación info hint", () => {
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).not.toMatch(/PublishMissing|data-publish-missing/);
    expect(form).toMatch(/<Fact id="panel-location" icon=\{MapPin\} label=\{companyCopy\.locationLabel\} required>/);
    expect(JSON.stringify(companyCopy)).not.toMatch(/Falta para publicar|Dato del registro mercantil/);
  });

  it("uses one label style for Descripción and the CNAE fields and names them CNAE", () => {
    expect(companyCopy.principalCnaeLabel).toBe("CNAE principal");
    expect(companyCopy.secondaryCnaeLabel).toBe("CNAEs secundarios");
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).toMatch(/const fieldLabelClass = "mb-1 flex items-center gap-1 text-sm text-\[#64748b\]"/);
    expect(form).not.toMatch(/text-base font-semibold text-\[#1c2740\]">\s*\{companyCopy\.descriptionLabel\}/);
    expect(form).not.toMatch(/<p className="flex h-9 items-center">/);
    expect(form.match(/className=\{fieldLabelClass\}/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("Tu progreso floats: no gutter, phone bar opens it (S31: a popover at every width)", () => {
    const nav = read("src/components/seller/detail-section-nav.tsx");
    expect(nav).not.toMatch(/pr-\[18rem\]/);
    expect(nav).toMatch(/data-progress-toggle="peek"/);
    expect(nav).toMatch(/const cardClass = peek \? "flex" : "hidden";/);
  });
});
