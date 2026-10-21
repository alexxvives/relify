import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/server/db";

function asPng(bytes: Uint8Array): string {
  return `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
}

export async function readPlatformSignature(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { signaturePng: true },
  });

  if (user?.signaturePng && user.signaturePng.byteLength >= 80) {
    return asPng(user.signaturePng);
  }

  try {
    const bytes = await readFile(path.join(process.cwd(), "data", "platform-signatures", `${userId}.png`));
    if (bytes.byteLength < 80) {
      return null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { signaturePng: bytes },
    });
    return asPng(bytes);
  } catch {
    return null;
  }
}
