import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { authCopy } from "@/lib/auth-copy";
import { getAccountNationalId } from "@/server/getAccountNationalId";
import { getCurrentUser } from "@/server/getCurrentUser";

export const metadata: Metadata = {
  title: authCopy.accountTitle,
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  const roleLabel = user.role ? authCopy.roles[user.role] : authCopy.roleMissing;
  const nationalId = await getAccountNationalId(user.id);

  return (
    <AppShell title={authCopy.accountTitle}>
      <p className="max-w-xl leading-7 text-[#5c6b78]">{authCopy.accountIntro}</p>
      <dl className="mt-6 max-w-xl divide-y divide-[#e6e9f0] rounded-2xl border border-[#e6e9f0] bg-white">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <dt className="text-sm text-[#5c6b78]">{authCopy.nameLabel}</dt>
          <dd className="text-sm font-medium">{user.name}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <dt className="text-sm text-[#5c6b78]">{authCopy.lastNameLabel}</dt>
          <dd className="text-sm font-medium">{user.lastName ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <dt className="text-sm text-[#5c6b78]">{authCopy.nationalIdLabel}</dt>
          <dd className="text-sm font-medium">{nationalId ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <dt className="text-sm text-[#5c6b78]">{authCopy.phoneLabel}</dt>
          <dd className="text-sm font-medium">{user.phone ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <dt className="text-sm text-[#5c6b78]">{authCopy.emailLabel}</dt>
          <dd className="text-sm font-medium">{user.email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <dt className="text-sm text-[#5c6b78]">{authCopy.roleLabel}</dt>
          <dd className="text-sm font-medium">{roleLabel}</dd>
        </div>
      </dl>
    </AppShell>
  );
}
