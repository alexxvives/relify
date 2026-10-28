import { redirect } from "next/navigation";
import { requireRole } from "@/server/requireRole";

export default async function AdminChatPage({ params }: { params: Promise<{ accessId: string }> }) {
  await requireRole("admin");
  const { accessId } = await params;
  redirect(`/admin/conexiones/${encodeURIComponent(accessId)}`);
}
