import { describe, expect, it } from "vitest";
import {
  PROD_DEPLOY_FLAG,
  PROD_WORKER_NAME,
  prodDeployPreconditions,
  prodDeployRefusal,
} from "../../scripts/prod-deploy-guard.mjs";

const allowed = {
  flag: "yes",
  branch: "main",
  intEnvironment: undefined,
  isTty: true,
  typedWorker: PROD_WORKER_NAME,
} as const;

describe("prodDeployRefusal", () => {
  it("allows only an explicit confirmed deploy from main on a TTY", () => {
    expect(prodDeployRefusal(allowed)).toBeNull();
    expect(prodDeployPreconditions(allowed)).toBeNull();
  });

  it("refuses without RELIFY_DEPLOY_PROD=yes", () => {
    expect(prodDeployRefusal({ ...allowed, flag: undefined })).toContain(PROD_DEPLOY_FLAG);
    expect(prodDeployRefusal({ ...allowed, flag: "true" })).toContain(PROD_DEPLOY_FLAG);
  });

  it("refuses any branch that is not main", () => {
    expect(prodDeployRefusal({ ...allowed, branch: "cursor/mobile-responsive-c353" })).toContain("not main");
    expect(prodDeployRefusal({ ...allowed, branch: "HEAD" })).toContain("not main");
  });

  it("refuses non-interactive shells so agents cannot deploy", () => {
    expect(prodDeployRefusal({ ...allowed, isTty: false })).toContain("TTY");
  });

  it("refuses unless the typed name is the production worker", () => {
    expect(prodDeployPreconditions(allowed)).toBeNull();
    expect(prodDeployRefusal({ ...allowed, typedWorker: "releva-int" })).toContain(PROD_WORKER_NAME);
    expect(prodDeployRefusal({ ...allowed, typedWorker: undefined })).toContain(PROD_WORKER_NAME);
  });

  it("refuses when the INT environment flag is on", () => {
    expect(prodDeployRefusal({ ...allowed, intEnvironment: "true" })).toContain("INT_ENVIRONMENT");
  });
});
