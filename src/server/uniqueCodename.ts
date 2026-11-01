import { prisma } from "@/server/db";
import { nicknameFor, nicknameWords } from "@/lib/nickname";

/** A curated nickname no other company uses. Falls back to a numbered one when the list is exhausted. */
export async function uniqueCodename(
  avoid: readonly string[] = [],
): Promise<string> {
  const rows = await prisma.project.findMany({ select: { codename: true } });
  const taken = new Set([
    ...rows.map((row) => row.codename.trim().toLowerCase()),
    ...avoid.map((name) => name.trim().toLowerCase()),
  ]);
  const words = [...nicknameWords].sort(() => Math.random() - 0.5);
  for (const word of words) {
    const name = nicknameFor(word);
    if (!taken.has(name.toLowerCase())) {
      return name;
    }
  }
  for (let suffix = 2; ; suffix += 1) {
    for (const word of words) {
      const name = `${nicknameFor(word)} ${suffix}`;
      if (!taken.has(name.toLowerCase())) {
        return name;
      }
    }
  }
}

export async function codenameIsFree(
  codename: string,
  exceptProjectId?: string,
): Promise<boolean> {
  const clash = await prisma.project.findFirst({
    where: {
      codename: { equals: codename.trim(), mode: "insensitive" },
      ...(exceptProjectId ? { NOT: { id: exceptProjectId } } : {}),
    },
    select: { id: true },
  });
  return clash === null;
}
