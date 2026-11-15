const waitlistSeeds = ["alba", "nube", "cala", "duna", "bruma", "olivo", "roble", "faro"] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** DiceBear Gaze blob portraits vendored at `/waitlist/*.svg` (CSP `img-src 'self'`). Unknown seeds cycle those portraits. */
export function gazeAvatarUrl(seed: string): string {
  const safe = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32) || "relify";
  if ((waitlistSeeds as readonly string[]).includes(safe)) {
    return `/waitlist/${safe}.svg`;
  }
  const pick = waitlistSeeds[hashSeed(safe) % waitlistSeeds.length] ?? "alba";
  return `/waitlist/${pick}.svg`;
}

export function uploadedInvestorPhoto(photo: string): string {
  return photo.startsWith("data:image/") ? photo : "";
}

export function investorDisplayPhoto(photo: string, gaze: string): string {
  const uploaded = uploadedInvestorPhoto(photo);
  return uploaded.length > 0 ? uploaded : gaze;
}
