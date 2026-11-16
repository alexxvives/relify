import { getCurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";
import { readProjectCover } from "@/lib/server/project-cover";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await context.params;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, status: true, ownerId: true },
  });

  if (!project) {
    return new Response(null, { status: 404 });
  }

  if (project.status !== "published") {
    const user = await getCurrentUser();

    if (!user || user.id !== project.ownerId) {
      return new Response(null, { status: 404 });
    }
  }

  const cover = await readProjectCover(project.id);

  if (!cover) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(cover.bytes), {
    headers: {
      "Content-Type": cover.type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
