"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseIcon } from "@animateicons/react/lucide/briefcase-icon";
import { Building2Icon } from "@animateicons/react/lucide/building-2-icon";
import { ChevronRightIcon } from "@animateicons/react/lucide/chevron-right-icon";
import { CrownIcon } from "@animateicons/react/lucide/crown-icon";
import { FilesIcon } from "@animateicons/react/lucide/files-icon";
import { HandshakeIcon } from "@animateicons/react/lucide/handshake-icon";
import { HeartIcon } from "@animateicons/react/lucide/heart-icon";
import { HouseIcon, type HouseIconHandle } from "@animateicons/react/lucide/house-icon";
import { LayoutDashboardIcon } from "@animateicons/react/lucide/layout-dashboard-icon";
import { LogOutIcon } from "@animateicons/react/lucide/log-out-icon";
import { MailIcon } from "@animateicons/react/lucide/mail-icon";
import { MessageCircleMoreIcon } from "@animateicons/react/lucide/message-circle-more-icon";
import { PanelLeftIcon } from "@animateicons/react/lucide/panel-left-icon";
import { PhoneIcon } from "@animateicons/react/lucide/phone-icon";
import { ReceiptIcon } from "@animateicons/react/lucide/receipt-icon";
import { TableIcon } from "@animateicons/react/lucide/table-icon";
import { UsersIcon } from "@animateicons/react/lucide/users-icon";
import { XIcon } from "@animateicons/react/lucide/x-icon";
import { signOutAction } from "@/app/cuenta/actions";
import { Logo } from "@/components/logo";
import { CompanySwitcher } from "@/components/company-switcher";
import { NotificationBell } from "@/components/notification-bell";
import { authCopy } from "@/lib/auth-copy";
import { accountInitials } from "@/lib/auth-input";
import type { NotificationView } from "@/lib/notifications";
import { sellerCopy } from "@/lib/seller-copy";
import { destinationIsCurrent, shellCopy, type ShellDestination } from "@/lib/shell";

const iconForHref = {
  "/mercado": Building2Icon,
  "/asesoramiento": MessageCircleMoreIcon,
  "/mi-empresa": HouseIcon,
  "/inversor": HouseIcon,
  "/mi-empresa/detalles": Building2Icon,
  "/mi-empresa/documentos": FilesIcon,
  "/mi-empresa/procesos": TableIcon,
  "/procesos": TableIcon,
  "/mi-empresa/servicios": MessageCircleMoreIcon,
  "/favoritos": HeartIcon,
  "/mandatos": HouseIcon,
  "/mandatos/encargos": HandshakeIcon,
  "/mandatos/venta": FilesIcon,
  "/admin": LayoutDashboardIcon,
  "/admin/empresas": Building2Icon,
  "/admin/cuentas": UsersIcon,
  "/admin/conexiones": HandshakeIcon,
  "/admin/asesores": BriefcaseIcon,
  "/admin/facturacion": ReceiptIcon,
  "/mis-servicios": BriefcaseIcon,
};

function SideLink({
  href,
  label,
  selected,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  selected: boolean;
  icon: typeof HouseIcon;
  onNavigate: () => void;
}) {
  const iconRef = useRef<HouseIconHandle>(null);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      onMouseEnter={() => {
        iconRef.current?.startAnimation();
      }}
      onMouseLeave={() => {
        iconRef.current?.stopAnimation();
      }}
      aria-current={selected ? "page" : undefined}
      className={
        selected
          ? "group flex min-h-11 min-w-0 items-center gap-3 rounded-2xl bg-public-sand px-4 py-2 text-base font-medium text-public-ink"
          : "group flex min-h-11 min-w-0 items-center gap-3 rounded-2xl px-4 py-2 text-base text-public-muted hover:bg-public-sand hover:text-public-ink"
      }
    >
      <Icon ref={iconRef} size={16} isAnimated={false} aria-hidden />
      <span className="min-w-0">{label}</span>
    </Link>
  );
}

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
    <div className="shell min-h-screen bg-public-paper font-public text-public-ink">
      {open ? (
        <button type="button" aria-label={shellCopy.menuClose} className="shell-backdrop" onClick={closeMenu} />
      ) : null}
      <aside id="app-sidebar" data-open={open ? "true" : "false"} className="shell-sidebar">
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-6 pt-6 pb-2">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={home} onClick={closeMenu} className="shrink-0" aria-label="Releva">
              <Logo size="lg" />
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {showPremium ? (
              <Link
                href="/premium"
                onClick={closeMenu}
                className="group inline-flex h-10 items-center gap-2 rounded-full bg-public-clay px-3 text-sm text-white hover:bg-public-clay-deep"
              >
                <CrownIcon size={16} aria-hidden />
                {sellerCopy.premium}
              </Link>
            ) : null}
            {canManageCompanies ? (
              <CompanySwitcher companies={companies} activeId={activeCompanyId} notices={notifications} />
            ) : null}
            <NotificationBell items={notifications} />
            <button
              type="button"
              onClick={closeMenu}
              className="shell-close inline-flex size-10 items-center justify-center rounded-full text-public-ink hover:bg-public-sand"
            >
              <XIcon size={16} aria-hidden />
              <span className="sr-only">{shellCopy.menuClose}</span>
            </button>
          </div>
        </div>
        <nav aria-label={shellCopy.navLabel} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-4">
          {destinations.map((item, index) => {
            const selected = destinationIsCurrent(item.href, pathname);
            const previous = destinations[index - 1];
            const showSection = item.section !== undefined && item.section !== previous?.section;

            return (
              <div key={item.href}>
                {showSection ? (
                  <p className="px-4 pt-5 pb-1 text-xs font-medium tracking-wide text-public-muted">{item.section}</p>
                ) : null}
                <SideLink
                  href={item.href}
                  label={item.label}
                  selected={selected}
                  icon={(iconForHref[item.href as keyof typeof iconForHref] ?? Building2Icon) as typeof HouseIcon}
                  onNavigate={closeMenu}
                />
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
                <PhoneIcon size={16} aria-hidden />
                {shellCopy.helpCall} {shellCopy.helpPhone}
              </a>
              <a
                href={shellCopy.helpEmailHref}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-public-line bg-public-card px-3 text-base font-medium text-public-ink hover:bg-white"
              >
                <MailIcon size={16} aria-hidden />
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
            <ChevronRightIcon size={16} className="shrink-0 text-public-clay" aria-hidden />
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-public-line text-base font-medium text-public-ink hover:bg-public-sand"
            >
              <LogOutIcon size={16} aria-hidden />
              {authCopy.signOut}
            </button>
          </form>
        </div>
      </aside>
      <main className="shell-main">
        <div className="shell-content">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="app-sidebar"
            onClick={() => {
              setOpen(true);
            }}
            className="shell-menu mb-4 inline-flex size-10 items-center justify-center rounded-full bg-public-card text-public-ink shadow-public"
          >
            <PanelLeftIcon size={16} aria-hidden />
            <span className="sr-only">{shellCopy.menuOpen}</span>
          </button>
          {showTitle ? <h1 className="text-3xl tracking-tight text-public-ink">{title}</h1> : null}
          <div className={showTitle ? "mt-6" : undefined}>{children}</div>
        </div>
      </main>
    </div>
  );
}
