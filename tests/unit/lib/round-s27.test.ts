import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { accountProfileKeepIdSchema, accountProfileSchema } from "@/lib/auth-input";
import { blogHeadingId, blogPosts, relatedBlogPosts } from "@/lib/blog";
import { formatRoiPercent, roiPercent, roiTone } from "@/lib/money";
import { isValidSpanishCif } from "@/lib/spanish-cif";
import { destinationsForRole } from "@/lib/shell";
import { sellerPanelFlags } from "@/lib/company-profile";
import { progressCardGutter } from "@/components/seller/detail-section-nav";
import {
  apiEmpresasCacheMs,
  checkApiEmpresas,
  checkUploads,
  healthCheckPrefix,
  healthProbeCif,
  healthTokenMatches,
  resetDeepHealthCache,
  runDeepHealth,
  type DeepHealthDeps,
  type HealthBucket,
} from "@/lib/server/deep-health";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

function memoryBucket(log: string[] = []): HealthBucket & { store: Map<string, Uint8Array> } {
  const store = new Map<string, Uint8Array>();
  return {
    store,
    put: async (key, value) => {
      log.push(`put ${key}`);
      store.set(key, value);
    },
    get: async (key) => {
      log.push(`get ${key}`);
      const value = store.get(key);
      return value ? { arrayBuffer: async () => value.slice().buffer } : null;
    },
    delete: async (key) => {
      log.push(`delete ${key}`);
      store.delete(key);
    },
  };
}

function deps(overrides: Partial<DeepHealthDeps> = {}): DeepHealthDeps {
  let clock = 1_000_000;
  return {
    now: () => (clock += 5),
    pingDb: async () => true,
    apiEmpresasKey: "",
    probeApiEmpresas: async () => ({ ok: true }),
    bucket: async () => null,
    randomId: () => "probe",
    ...overrides,
  };
}

describe("S27 point 1: Tendencias has its own menu entry", () => {
  it("investors get /tendencias in Explorar and Inicio no longer renders it", () => {
    const investor = destinationsForRole("investor");
    expect(investor.find((item) => item.href === "/tendencias")).toMatchObject({ label: "Tendencias", section: "Explorar" });
    expect(read("src/components/investor/investor-home.tsx")).not.toMatch(/SellerTrends|Tendencias/);
  });
});

describe("S27 point 2: blog", () => {
  it("builds stable, accent-free heading anchors", () => {
    expect(blogHeadingId("Qué cifras conviene tener a mano")).toBe("que-cifras-conviene-tener-a-mano");
    expect(blogHeadingId("¿Cómo avanza la compraventa?")).toBe("como-avanza-la-compraventa");
  });

  it("related posts exclude the current one and prefer the same lane", () => {
    const post = blogPosts[0]!;
    const related = relatedBlogPosts(post.slug, 3);
    expect(related).toHaveLength(Math.min(3, blogPosts.length - 1));
    expect(related.some((item) => item.slug === post.slug)).toBe(false);
    const sameLane = blogPosts.filter((item) => item.slug !== post.slug && item.lane === post.lane).length;
    expect(related.slice(0, Math.min(3, sameLane)).every((item) => item.lane === post.lane)).toBe(true);
  });

  it("the post page has a table of contents, meta, a CTA and related cards", () => {
    const page = read("src/app/blog/[slug]/page.tsx");
    expect(page).toMatch(/aria-label=\{blogCopy\.toc\}/);
    expect(page).toMatch(/<time dateTime=\{post\.date\}>/);
    expect(page).toMatch(/blogCopy\.ctaSell/);
    expect(page).toMatch(/<BlogCard post=\{item\} \/>/);
    expect(read("src/components/public/blog-index.tsx")).toMatch(/<BlogFeatured post=\{featured\} \/>/);
  });
});

describe("S27 point 3: one page-title system", () => {
  it("SignedInPage, Empresas and Detalles de empresa share the same title tokens", () => {
    expect(read("src/components/shell/signed-in-page.tsx")).toMatch(/<PageHeader title=\{heading\} \/>/);
    const market = read("src/components/investor/market-browser.tsx");
    expect(market).toMatch(/pageHeaderRowClass/);
    expect(market).toMatch(/lg:grid-rows-\[minmax\(0,1fr\)\]/);
    expect(market).toMatch(/className=\{`\$\{pageTitleClass\}/);
    expect(read("src/components/seller/company-draft-form.tsx")).toMatch(/<h1 className=\{pageTitleClass\}>\{sellerCopy\.detailsTitle\}<\/h1>/);
    const header = read("src/components/shell/page-header.tsx");
    expect(header).toMatch(/h-8 min-w-0 items-center/);
  });
});

describe("S27 point 5: deep health check", () => {
  beforeEach(() => {
    resetDeepHealthCache();
  });

  it("reports not_configured for API Empresas and uploads without key or binding, and stays ok", async () => {
    const result = await runDeepHealth(deps());
    expect(result.ok).toBe(true);
    expect(result.checks.database.status).toBe("ok");
    expect(result.checks.apiEmpresas).toEqual({ status: "not_configured", latencyMs: 0 });
    expect(result.checks.uploads).toEqual({ status: "not_configured", latencyMs: 0 });
    expect(typeof result.checks.database.latencyMs).toBe("number");
  });

  it("fails when the database does not answer", async () => {
    const result = await runDeepHealth(deps({ pingDb: async () => false }));
    expect(result.ok).toBe(false);
    expect(result.checks.database).toMatchObject({ status: "error", detail: "db_unreachable" });
  });

  it("calls API Empresas with the probe CIF once per hour, including failures", async () => {
    const calls: string[] = [];
    let clock = 0;
    const base = deps({
      now: () => clock,
      apiEmpresasKey: "k",
      probeApiEmpresas: async (cif) => {
        calls.push(cif);
        return { ok: false, code: "auth" };
      },
    });
    const first = await checkApiEmpresas(base);
    expect(first).toMatchObject({ status: "error", detail: "auth", cached: false });
    clock = apiEmpresasCacheMs - 1;
    expect(await checkApiEmpresas(base)).toMatchObject({ status: "error", cached: true });
    expect(calls).toEqual([healthProbeCif]);
    clock = apiEmpresasCacheMs + 1;
    await checkApiEmpresas(base);
    expect(calls).toHaveLength(2);
  });

  it("puts, reads back and deletes one object under health-check/", async () => {
    const log: string[] = [];
    const bucket = memoryBucket(log);
    const check = await checkUploads(deps({ bucket: async () => bucket }));
    expect(check.status).toBe("ok");
    expect(log).toEqual([`put ${healthCheckPrefix}probe`, `get ${healthCheckPrefix}probe`, `delete ${healthCheckPrefix}probe`]);
    expect(bucket.store.size).toBe(0);
  });

  it("flags a bucket that loses the object and still deletes the probe", async () => {
    const bucket = memoryBucket();
    const broken: HealthBucket = { ...bucket, get: async () => null };
    const check = await checkUploads(deps({ bucket: async () => broken }));
    expect(check).toMatchObject({ status: "error", detail: "missing" });
    expect(bucket.store.size).toBe(0);
  });

  it("compares the token exactly and refuses when the secret is unset", () => {
    expect(healthTokenMatches("abc", "abc")).toBe(true);
    expect(healthTokenMatches("abd", "abc")).toBe(false);
    expect(healthTokenMatches("abcd", "abc")).toBe(false);
    expect(healthTokenMatches(null, "abc")).toBe(false);
    expect(healthTokenMatches("abc", undefined)).toBe(false);
    expect(healthTokenMatches("", "")).toBe(false);
  });

  it("the route 404s without HEALTHCHECK_TOKEN, 401s on a bad header and keeps /api/health cheap", () => {
    const route = read("src/app/api/health/deep/route.ts");
    expect(route).toMatch(/process\.env\.HEALTHCHECK_TOKEN/);
    expect(route).toMatch(/status: 404/);
    expect(route).toMatch(/status: 401/);
    expect(route).toMatch(/x-health-token/);
    expect(read("src/app/api/health/route.ts")).not.toMatch(/deep-health/);
  });
});

describe("S27 point 6: ficha section bar", () => {
  it("shows prev/next arrows only when the sections overflow", () => {
    const nav = read("src/components/seller/report-nav.tsx");
    expect(nav).toMatch(/edges\.overflow \? \(\s*<ScrollArrow direction=\{-1\}/);
    expect(nav).toMatch(/<ScrollArrow direction=\{1\} disabled=\{!edges\.right\}/);
    expect(nav).toMatch(/el\.scrollBy\(/);
    expect(read("src/app/globals.css")).toMatch(/touch-action: pan-x pan-y;/);
  });
});

describe("S27 point 7: ROI percent", () => {
  it("is EBITDA / asking price × 100", () => {
    expect(roiPercent(1_200_000_00, 180_000_00)).toBeCloseTo(15, 5);
    expect(roiPercent(0, 100)).toBeNull();
    expect(roiPercent(100, 0)).toBeNull();
    expect(roiPercent(100, -5)).toBeNull();
  });

  it("formats without decimals from 10 % and with one below", () => {
    expect(formatRoiPercent(25)).toBe("25%");
    expect(formatRoiPercent(14.29)).toBe("14%");
    expect(formatRoiPercent(8.333)).toBe("8,3%");
  });

  it("keeps the payback thresholds (≤4 years good, ≤7 average)", () => {
    expect(roiTone(25)).toBe("good");
    expect(roiTone(20)).toBe("average");
    expect(roiTone(14.3)).toBe("average");
    expect(roiTone(10)).toBe("high");
  });
});

describe("S27 points 8 and 9", () => {
  it("related companies lose the kicker and the tinted wrapper", () => {
    const project = read("src/components/investor/investor-project.tsx");
    expect(project).not.toMatch(/recommendationsKicker/);
    expect(project).not.toMatch(/rounded-2xl bg-\[#eef1f8\] px-5 py-6 sm:px-6/);
  });

  it("the help box shows the email and drops the Llámanos line", () => {
    const frame = read("src/components/shell/app-frame.tsx");
    expect(frame).toMatch(/shellCopy\.helpEmailHref/);
    expect(read("src/lib/shell.ts")).not.toMatch(/Llámanos o escríbenos/);
  });
});

describe("S27 points 10 and 11: /cuenta autosaves silently; Detalles keeps Guardar", () => {
  it("/cuenta has no save bar or Guardado note and saves on a debounce", () => {
    const account = read("src/components/account/account-settings.tsx");
    expect(account).not.toMatch(/ShellStickyCtaBar/);
    expect(account).toMatch(/export const accountAutosaveMs = 800/);
    expect(account).toMatch(/form\.requestSubmit\(\)/);
    expect(read("src/components/investor/investor-profile.tsx")).not.toMatch(/profileSaved|savedNote/);
  });

  it("a stored, masked DNI is kept without re-validating it", () => {
    const base = { name: "Martín", lastName: "Soler", phoneCountry: "ES", phone: "612345678" };
    expect(accountProfileKeepIdSchema.safeParse({ ...base, nationalId: "•••••678Z" }).success).toBe(true);
    expect(accountProfileSchema.safeParse({ ...base, nationalId: "•••••678Z" }).success).toBe(false);
    expect(read("src/app/(app)/cuenta/actions.ts")).toMatch(/keepStored \? accountProfileKeepIdSchema : accountProfileSchema/);
  });

  it("partial profiles save: empty phone and empty DNI/NIE are fine, a typed one must be valid", () => {
    const base = { name: "Martín", lastName: "Soler", phoneCountry: "ES" };
    expect(accountProfileSchema.safeParse({ ...base, phone: "", nationalId: "" }).success).toBe(true);
    expect(accountProfileSchema.safeParse({ ...base, phone: "12", nationalId: "" }).success).toBe(false);
    expect(accountProfileSchema.safeParse({ ...base, phone: "", nationalId: "12345678A" }).success).toBe(false);
    expect(accountProfileSchema.safeParse({ ...base, phone: "", nationalId: "12345678Z" }).success).toBe(true);
    expect(read("src/lib/server/update-account-profile.ts")).toMatch(/input\.phone\.trim\(\) \? storedPhone/);
  });

  it("Detalles panels close to a read-only summary with a labelled Editar button", () => {
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).toMatch(/<Pencil className="size-3\.5" aria-hidden \/>\s*\{companyCopy\.editPanel\}/);
    expect(form).toMatch(/\{open \|\| !summary \? null : <div className="mt-4">\{summary\}<\/div>\}/);
  });
});

describe("S27 point 4: INT seed", () => {
  const sql = read("prisma/int-s27-pipeline-advisors.sql");

  it("is INT-only, transactional and idempotent", () => {
    expect(sql.split("\n")[0]).toMatch(/^-- INT only\. Do not apply on production/);
    expect(sql).toMatch(/^BEGIN;$/m);
    expect(sql).toMatch(/^COMMIT;$/m);
    const inserts = sql.match(/^INSERT INTO/gm) ?? [];
    const guarded = (sql.match(/ON CONFLICT|AND NOT EXISTS/g) ?? []).length;
    expect(guarded).toBeGreaterThanOrEqual(inserts.length);
    expect(sql).not.toMatch(/\b(UPDATE|DELETE|DROP|TRUNCATE)\b/);
  });

  it("never writes a password: logins copy the hash of an existing INT test account", () => {
    expect(sql).toMatch(/SELECT a\.password\s+FROM "account" a/);
    expect(sql).not.toMatch(/\$scrypt|password\s*=\s*'/i);
  });

  it("seeds three asesores with profiles and one comprador process per pipeline step", () => {
    for (const email of ["int-asesor-valoracion@test.local", "int-asesor-legal@test.local", "int-asesor-fiscal@test.local"]) {
      expect(sql).toContain(email);
    }
    expect(sql).toMatch(/INSERT INTO advisor_profile/);
    const steps = sql.match(/\('int-s27-[a-z-]+', [1-6], \d+\)/g) ?? [];
    expect(steps.map((row) => row.match(/, ([1-6]),/)?.[1])).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(sql).toMatch(/WHERE u\.email = 'int-comprador@test\.local'/);
    expect(read("docs/INT.md")).toMatch(/int-s27-pipeline-advisors\.sql/);
  });

  it("gives the three asesores NIFs that pass isValidSpanishCif so they are listed", () => {
    const nifs = [...sql.matchAll(/'int-asesor-[a-z]+@test\.local', '[^']+', '([A-Z0-9]+)'/g)].map((row) => row[1]);
    expect(nifs).toHaveLength(3);
    for (const nif of nifs) {
      expect(isValidSpanishCif(nif), nif).toBe(true);
    }
  });
});

describe("S27 follow-up: Detalles de empresa saves only on Guardar", () => {
  const form = read("src/components/seller/company-draft-form.tsx");

  it("has no background autosave: no debounce timer, no blur or unload flush, Enter does not save", () => {
    expect(form).not.toMatch(/saveTimer/);
    expect(form).not.toMatch(/typing \? 800 : 0/);
    expect(form).not.toMatch(/addEventListener\("pagehide"/);
    expect(form).toMatch(/function onSubmit\(event: FormEvent<HTMLFormElement>\) \{\s*event\.preventDefault\(\);\s*\}/);
  });

  it("Guardar saves the form and closes the panel only once the save lands; Cancelar reverts the section", () => {
    expect(form).toMatch(/onSave=\{\(\) => saveSection\("basic"\)\}/);
    expect(form).toMatch(/onSave=\{\(\) => saveSection\("structure"\)\}/);
    expect(form).toMatch(/onSave=\{\(\) => saveSection\("deal"\)\}/);
    expect(form).toMatch(/if \(closing && landed\.saved\) closePanelRef\.current\(closing\)/);
    expect(form).toMatch(/revertSection\("basic"\);\s*setOpenBasic\(false\);/);
    expect(form).toMatch(/onClick=\{onSave \?\? onCollapse\}/);
  });

  it("warns before leaving and before switching tabs, and shows Cambios sin guardar near Guardar", () => {
    expect(form).toMatch(/<UnsavedChangesGuard\s+dirty=\{formDirty \|\| pending\}\s+onSave=\{saveAndLeave\}\s+failedHref/);
    expect(form).not.toMatch(/\bautoSave\n/);
    expect(form).toMatch(/if \(formDirty && id !== tab\) \{\s*setTabAsk\(id\);/);
    expect(form).toMatch(/<UnsavedTabDialog/);
    expect(form).toMatch(/data-unsaved-hint/);
    expect(read("src/lib/company-copy.ts")).toMatch(/unsavedHint: "Cambios sin guardar"/);
  });
});

describe("S27 follow-up: blog grid has no lone last card", () => {
  it("spans a lone last card (or the second of two) across the free columns", async () => {
    const { blogGridClass } = await import("@/components/public/blog-index");
    expect(blogGridClass).toContain("sm:[&>li:nth-child(2n+1):last-child]:col-span-2");
    expect(blogGridClass).toContain("lg:[&>li:nth-child(3n+1):last-child]:col-span-3");
    expect(blogGridClass).toContain("lg:[&>li:nth-child(3n+2):last-child]:col-span-2");
    expect(read("src/components/public/blog-card.tsx")).toMatch(/@\[40rem\]:flex-row/);
  });
});

describe("S27 follow-up: the active seller company is deterministic", () => {
  it("breaks createdAt ties by id so the Detalles page and its save hit the same company", () => {
    const source = read("src/lib/server/seller-company.ts");
    expect(source).not.toMatch(/orderBy: \{ createdAt: "asc" \}/);
    expect((source.match(/orderBy: \[\{ createdAt: "asc" \}, \{ id: "asc" \}\]/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });
});

describe("S27 follow-up: short descriptions save; the read-only view shows the server", () => {
  const form = read("src/components/seller/company-draft-form.tsx");
  const actions = read("src/app/(app)/mi-empresa/actions.ts");

  it("never blocks or flags a short description on save; 200 characters is only a publish requirement", () => {
    expect(form).not.toMatch(/descriptionMinLength/);
    expect(form).not.toMatch(/showDescriptionMin/);
    expect(read("src/lib/company-copy.ts")).not.toMatch(/descriptionTooShort/);
    expect(read("src/lib/seller-completion.ts")).toMatch(/description\.trim\(\)\.length >= descriptionMinLength/);
  });

  it("counts the description panel as filled only from 200 characters, like Falta para publicar", () => {
    const base = { legalName: "Horno", cif: "B00000000", principalCnae: "", closedYears: [], headcount: "", capitalPercents: [], askingPrice: "" };
    expect(sellerPanelFlags({ ...base, description: "Obrador de barrio." }).description).toBe(false);
    expect(sellerPanelFlags({ ...base, description: "x".repeat(200) }).description).toBe(true);
  });

  it("returns the stored draft after a save and rebuilds the baseline from it", () => {
    expect(actions).toMatch(/draft = await getCompanyDraft\(user\)/);
    expect(actions).toMatch(/saved: true, draft/);
    expect(form).toMatch(/baselineFromDraft\(state\.draft, cif\)/);
  });

  it("stops the save with a real error instead of swapping a browser-rejected value", () => {
    expect(form).toMatch(/invalid\.reportValidity\(\)/);
    expect(form).toMatch(/companyCopy\.invalidFieldNotSaved/);
    expect(form).not.toMatch(/const kept = savedForm\.current\?\.getAll\(element\.name\)/);
  });
});

describe("S27 follow-up: the Tu progreso card never covers the form", () => {
  it("reserves a right gutter from 1280 px while the card is pinned and drops it when minimised", () => {
    expect(progressCardGutter(null)).toBe("xl:pr-[18rem]");
    expect(progressCardGutter("1")).toBe("xl:pr-[18rem]");
    expect(progressCardGutter("0")).toBe("");
    expect(read("src/components/seller/company-draft-form.tsx")).toMatch(/relative flex flex-col gap-4 \$\{progressGutter\}/);
  });

  it("is never pinned below 1280 px: the pill opens it as a popover", () => {
    const nav = read("src/components/seller/detail-section-nav.tsx");
    expect(nav).toMatch(/const cardClass = `\$\{peek \? "flex" : "hidden"\}/);
    expect(nav).toMatch(/event\.key === "Escape"/);
  });
});

