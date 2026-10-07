"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  ChevronRight,
  Crown,
  Files,
  Heart,
  House,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircleMore,
  PanelLeft,
  Phone,
  TableProperties,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/cuenta/actions";
import { Logo } from "@/components/logo";
import { CompanySwitcher } from "@/components/company-switcher";
import { NotificationBell } from "@/components/notification-bell";
import { authCopy } from "@/lib/auth-copy";
import { accountInitials } from "@/lib/auth-input";
import type { NotificationView } from "@/lib/notifications";
import { sellerCopy } from "@/lib/seller-copy";
import { destinationIsCurrent, shellCopy, type ShellDestination } from "@/lib/shell";

const iconForHref: Record<string, typeof Building2> = {
  "/mercado": Building2,
  "/asesoramiento": MessageCircleMore,
  "/mi-empresa": House,
  "/inversor": House,
  "/mi-empresa/detalles": Building2,
  "/mi-empresa/documentos": Files,
  "/mi-empresa/procesos": TableProperties,
  "/procesos": TableProperties,
  "/mi-empresa/servicios": MessageCircleMore,
  "/favoritos": Heart,
  "/mandatos": House,
  "/admin": LayoutDashboard,
  "/mis-servicios": Briefcase,
};

const motionForHref: Record<string, string> = {
  "/mercado": "nav-motion-building",
  "/asesoramiento": "nav-motion-chat",
  "/mi-empresa": "nav-motion-house",
  "/inversor": "nav-motion-house",
  "/mi-empresa/detalles": "nav-motion-building",
  "/mi-empresa/documentos": "nav-motion-files",
  "/mi-empresa/procesos": "nav-motion-steps",
  "/procesos": "nav-motion-steps",
  "/mi-empresa/servicios": "nav-motion-chat",
  "/favoritos": "nav-motion-heart",
  "/mandatos": "nav-motion-house",
  "/admin": "nav-motion-board",
  "/mis-servicios": "nav-motion-case",
};

export function AppFrame({
  name,
  destinations,
  title,
  showTitle = true,
  notifications,
  showPremium = false,
  companies = [],
  activeCompanyId = null,
  canManageCompanies = false,
  children,
}: {
  name: string;
  destinations: ShellDestination[];
  title: string;
  showTitle?: boolean;
  notifications: NotificationView[];
  showPremium?: boolean;
  companies?: { id: string; legalName: string; codename: string }[];
  activeCompanyId?: string | null;
  canManageCompanies?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const home = destinations[0]?.href ?? "/cuenta";
  const initials = accountInitials(name);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-public-paper font-public text-public-ink">
      {open ? (
        <button
          type="button"
          aria-label={shellCopy.menuClose}
          className="fixed inset-0 z-30 bg-public-ink/30 xl:hidden"
          onClick={closeMenu}
        />
      ) : null}
      <aside
        id="app-sidebar"
        className={
          open
            ? "fixed inset-y-0 left-0 z-40 flex w-[min(30rem,calc(100%-1rem))] flex-col border-r border-public-line bg-public-card xl:w-[30rem]"
            : "fixed inset-y-0 left-0 z-40 hidden w-[30rem] flex-col border-r border-public-line bg-public-card xl:flex"
        }
      >
        <div className="relative z-20 flex items-center justify-between gap-3 px-6 pt-6 pb-2">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={home} onClick={closeMenu} className="shrink-0" aria-label="Releva">
              <Logo size="lg" />
            </Link>
            {canManageCompanies ? (
              <CompanySwitcher companies={companies} activeId={activeCompanyId} notices={notifications} />
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {showPremium ? (
              <Link
                href="/premium"
                onClick={closeMenu}
                className="group inline-flex h-10 items-center gap-2 rounded-full bg-public-clay px-3 text-sm text-white hover:bg-public-clay-deep"
              >
                <Crown className="nav-icon nav-motion-crown size-4" aria-hidden />
                {sellerCopy.premium}
              </Link>
            ) : null}
            <NotificationBell items={notifications} />
            <button
              type="button"
              onClick={closeMenu}
              className="inline-flex size-10 items-center justify-center rounded-full text-public-ink hover:bg-public-sand xl:hidden"
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">{shellCopy.menuClose}</span>
            </button>
          </div>
        </div>
        <nav aria-label={shellCopy.navLabel} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-4">
          {destinations.map((item, index) => {
            const Icon = iconForHref[item.href] ?? Building2;
            const motion = motionForHref[item.href] ?? "nav-motion-building";
            const selected = destinationIsCurrent(item.href, pathname);
            const previous = destinations[index - 1];
            const showSection = item.section !== undefined && item.section !== previous?.section;

            return (
              <div key={item.href}>
                {showSection ? (
                  <p className="px-4 pt-5 pb-1 text-xs font-medium tracking-wide text-public-muted">{item.section}</p>
                ) : null}
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={selected ? "page" : undefined}
                  className={
                    selected
                      ? "group flex h-11 items-center gap-3 rounded-2xl bg-public-sand px-4 text-base font-medium text-public-ink"
                      : "group flex h-11 items-center gap-3 rounded-2xl px-4 text-base text-public-muted hover:bg-public-sand hover:text-public-ink"
                  }
                >
                  <Icon className={`nav-icon ${motion} size-4 shrink-0 ${selected ? "nav-icon-play" : ""}`} aria-hidden />
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-public-line p-4">
          <section className="rounded-2xl bg-public-sand px-4 py-4">
            <h2 className="text-base font-semibold text-public-ink">{shellCopy.helpTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-public-muted">{shellCopy.helpBody}</p>
            <div className="mt-3 grid gap-2">
              <a
                href={shellCopy.helpPhoneHref}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-public-clay px-3 text-base font-medium text-white hover:bg-public-clay-deep"
              >
                <Phone className="nav-icon nav-motion-phone size-4" aria-hidden />
                {shellCopy.helpCall} {shellCopy.helpPhone}
              </a>
              <a
                href={shellCopy.helpEmailHref}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-public-line bg-public-card px-3 text-base font-medium text-public-ink hover:bg-white"
              >
                <Mail className="nav-icon nav-motion-mail size-4" aria-hidden />
                {shellCopy.helpEmail}
              </a>
            </div>
          </section>
          <Link
            href="/cuenta"
            onClick={closeMenu}
            className="mt-3 flex items-center gap-3 rounded-2xl border border-public-line px-3 py-3 hover:bg-public-sand"
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-public-sand text-sm font-medium text-public-clay">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block text-sm font-medium text-public-clay">{shellCopy.viewProfile}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-public-clay" aria-hidden />
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-public-line text-base font-medium text-public-ink hover:bg-public-sand"
            >
              <LogOut className="size-4" aria-hidden />
              {authCopy.signOut}
            </button>
          </form>
        </div>
      </aside>
      <main className="min-h-screen xl:pl-[30rem]">
        <div className="w-full px-6 py-6 md:px-8 md:py-8">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="app-sidebar"
            onClick={() => {
              setOpen(true);
            }}
            className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-public-card text-public-ink shadow-public xl:hidden"
          >
            <PanelLeft className="size-4" aria-hidden />
            <span className="sr-only">{shellCopy.menuOpen}</span>
          </button>
          {showTitle ? <h1 className="text-3xl tracking-tight text-public-ink">{title}</h1> : null}
          <div className={showTitle ? "mt-6" : undefined}>{children}</div>
        </div>
      </main>
    </div>
  );
}
