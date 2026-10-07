import type { UserRoleName } from "./auth-input";

export type FavoriteDecision =
  | { ok: true; action: "add" | "remove" }
  | { ok: false; code: "forbidden" | "missing" };

export function favoriteDecision(input: {
  onboarded: boolean;
  role: UserRoleName | null;
  projectStatus: "draft" | "pending" | "published" | null;
  alreadySaved: boolean;
}): FavoriteDecision {
  if (!input.onboarded || input.role !== "investor" || input.projectStatus !== "published") {
    return { ok: false, code: input.projectStatus === "published" ? "forbidden" : "missing" };
  }

  return { ok: true, action: input.alreadySaved ? "remove" : "add" };
}
