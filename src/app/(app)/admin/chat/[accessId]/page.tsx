import { redirect } from "next/navigation";
import { requireRole } from "@/lib/server/require-role";

export default async function AdminChatPage({ params }: { params: Promise<{ accessId: string }> }) {
  await requireRole("admin");
  const { accessId } = await params;
  redirect(`/admin/conexiones/${encodeURIComponent(accessId)}`);
}
