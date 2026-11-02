import { getCurrentUser } from "@/server/getCurrentUser";
import { readProjectPhoto } from "@/server/projectPhotos";

const idPattern = /^[a-f0-9-]{36}$/;

/** t84: gallery photo. Public listing photos load for anyone; hidden or unpublished ones only for admin and the owner. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  if (!idPattern.test(id)) {
    return new Response(null, { status: 404 });
  }
  const photo = await readProjectPhoto(id);
  if (!photo) {
    return new Response(null, { status: 404 });
  }
  const open = photo.project.status === "published" && !photo.hidden;
  if (!open) {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.id !== photo.project.ownerId)) {
      return new Response(null, { status: 404 });
    }
  }
  return new Response(new Uint8Array(photo.bytes), {
    headers: { "Content-Type": photo.mime, "Cache-Control": open ? "public, max-age=300" : "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
