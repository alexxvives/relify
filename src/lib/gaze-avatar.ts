export function gazeAvatarUrl(seed: string): string {
  const safe = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
  return `https://api.dicebear.com/10.x/gaze/svg?seed=${safe}&backgroundColor=1c2740&backgroundType=solid`;
}

export function uploadedInvestorPhoto(photo: string): string {
  return photo.startsWith("data:image/") ? photo : "";
}

export function investorDisplayPhoto(photo: string, gaze: string): string {
  const uploaded = uploadedInvestorPhoto(photo);
  return uploaded.length > 0 ? uploaded : gaze;
}
