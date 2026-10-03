const projectImages: Record<string, string> = {
  "proyecto-olivo": "/projects/proyecto-olivo.jpg",
  "proyecto-roble": "/projects/proyecto-roble.jpg",
  "proyecto-duna": "/projects/proyecto-duna.jpg",
};

export function projectImageSrc(slug: string): string | null {
  return projectImages[slug] ?? null;
}

export function seededProjectImages(): string[] {
  return Object.values(projectImages);
}
