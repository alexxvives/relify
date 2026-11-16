import * as z from "zod";
import { accessCopy } from "./access-copy";
import type { UserRoleName } from "./auth-input";

export const projectAccessInputSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export type ProjectAccessInput = z.infer<typeof projectAccessInputSchema>;

/** After a cancel, reconnect must drop match-fee, NDA and LOI leftovers or the 2% stamp can leak. */
export const reconnectAccessReset = {
  cancelledAt: null,
  cancelledBy: null,
  sellerAcceptedAt: null,
  ndaAcceptedAt: null,
  loiAcceptedAt: null,
  diligencePassedAt: null,
  ndaSignature: null,
  ndaText: null,
  loiSignature: null,
  loiSignedAt: null,
  buyerPlanAtMatch: null,
};

export type ProjectAccessView = "none" | "awaiting-seller" | "requested" | "accepted";

/** Maps a stored connection to the buyer ficha stage. `accepted` is the post-NDA full ficha. */
export function accessFromConnection(
  row:
    | {
        ndaAcceptedAt: Date | null;
        sellerAcceptedAt: Date | null;
        cancelledAt: Date | null;
      }
    | null,
): ProjectAccessView {
  if (!row || row.cancelledAt !== null) {
    return "none";
  }

  if (row.sellerAcceptedAt === null) {
    return "awaiting-seller";
  }

  return row.ndaAcceptedAt === null ? "requested" : "accepted";
}

export type AccessDenial = "forbidden" | "missing" | "nda-required" | "waiting" | "plan" | "limit";

type AccessContext = {
  onboarded: boolean;
  role: UserRoleName | null;
  projectStatus: "draft" | "pending" | "published" | null;
};

function roleAndProject(input: AccessContext): { ok: true } | { ok: false; code: "forbidden" | "missing" } {
  if (!input.onboarded || input.role !== "investor") {
    return { ok: false, code: "forbidden" };
  }

  if (input.projectStatus !== "published") {
    return { ok: false, code: "missing" };
  }

  return { ok: true };
}

export function requestAccessOutcome(
  input: AccessContext & { alreadyRequested: boolean },
): { ok: true; insert: boolean } | { ok: false; code: "forbidden" | "missing" } {
  const allowed = roleAndProject(input);

  if (!allowed.ok) {
    return allowed;
  }

  return { ok: true, insert: !input.alreadyRequested };
}

export function acceptNdaOutcome(
  input: AccessContext & { requested: boolean; sellerMatched: boolean; alreadyAccepted: boolean },
): { ok: true; stamp: boolean } | { ok: false; code: AccessDenial } {
  const allowed = roleAndProject(input);

  if (!allowed.ok) {
    return allowed;
  }

  if (!input.requested) {
    return { ok: false, code: "nda-required" };
  }

  if (!input.sellerMatched) {
    return { ok: false, code: "waiting" };
  }

  return { ok: true, stamp: !input.alreadyAccepted };
}

export function ndaAccessGate(
  input: AccessContext & { ndaAcceptedAt: Date | null },
): { ok: true } | { ok: false; code: "forbidden" | "missing" | "nda-required" } {
  const allowed = roleAndProject(input);

  if (!allowed.ok) {
    return allowed;
  }

  if (input.ndaAcceptedAt === null) {
    return { ok: false, code: "nda-required" };
  }

  return { ok: true };
}

export function accessMessage(code: AccessDenial): string {
  if (code === "forbidden") {
    return accessCopy.forbidden;
  }

  if (code === "missing") {
    return accessCopy.missing;
  }

  if (code === "waiting") {
    return accessCopy.waitingForSeller;
  }

  if (code === "plan") {
    return accessCopy.planRequired;
  }

  if (code === "limit") {
    return accessCopy.matchLimit;
  }

  return accessCopy.ndaRequired;
}
