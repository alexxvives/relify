import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SignedInPage } from "@/components/signed-in-page";
import { adminCopy } from "@/lib/admin-copy";
import { getAdminThread } from "@/server/getAdminThread";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = {
  title: adminCopy.chatTitle,
  robots: { index: false, follow: false },
};

export default async function AdminChatPage({ params }: { params: Promise<{ accessId: string }> }) {
  const user = await requireRole("admin");
  const { accessId } = await params;
  const thread = await getAdminThread(user, accessId);

  if (!thread) {
    notFound();
  }

  return (
    <SignedInPage title={adminCopy.chatTitle}>
      <div className="flex flex-col gap-4">
        <Link href="/admin" className="text-sm font-medium text-[#3d34b8]">
          {adminCopy.chatBack}
        </Link>
        <section className="rounded-2xl border border-[#e7eaee] bg-white p-5">
          <h2 className="text-2xl font-semibold text-[#2b3b4a]">{thread.codename}</h2>
          <p className="mt-1 text-sm text-[#667085]">{adminCopy.chatReadOnly}</p>
          {thread.messages.length === 0 ? (
            <p className="mt-6 text-sm text-[#667085]">{adminCopy.chatEmpty}</p>
          ) : (
            <ol className="mt-6 flex flex-col gap-3">
              {thread.messages.map((message) => (
                <li key={message.id} className="max-w-3xl rounded-2xl border border-[#e6e9f0] bg-[#f4f7ff] px-4 py-3">
                  <p className="text-xs font-medium text-[#3d34b8]">
                    {message.authorLabel}
                    <span className="ml-2 font-normal text-[#667085]">
                      {message.kindLabel} · {message.createdAt}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#1c2740]">{message.body}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </SignedInPage>
  );
}
