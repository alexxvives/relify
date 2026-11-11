function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** Local geometric avatar. CSP blocks remote image hosts (`img-src 'self' data: blob:`). */
export function gazeAvatarUrl(seed: string): string {
  const safe = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32) || "relify";
  const hash = hashSeed(safe);
  const ink = "#1c2740";
  const clay = "#0f6e73";
  const sand = "#e5eef0";
  const eye = 14 + (hash % 6);
  const smile = 34 + (hash % 8);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="32" fill="${ink}"/>
    <circle cx="32" cy="28" r="18" fill="${sand}"/>
    <circle cx="25" cy="26" r="3.2" fill="${ink}"/>
    <circle cx="39" cy="26" r="3.2" fill="${ink}"/>
    <path d="M24 ${smile} Q32 ${smile + eye / 4} 40 ${smile}" fill="none" stroke="${clay}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="48" cy="14" r="5" fill="${clay}"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function uploadedInvestorPhoto(photo: string): string {
  return photo.startsWith("data:image/") ? photo : "";
}

export function investorDisplayPhoto(photo: string, gaze: string): string {
  const uploaded = uploadedInvestorPhoto(photo);
  return uploaded.length > 0 ? uploaded : gaze;
}
