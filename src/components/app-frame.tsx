"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
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
import { destinationIsCurrent, noticeOpenOnPath, processMenuTarget, shellCopy, type ShellDestination } from "@/lib/shell";

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

const tabLabelForHref: Record<string, string> = {
  "/mi-empresa": "Inicio",
  "/mi-empresa/detalles": "Empresa",
  "/mi-empresa/procesos": "Procesos",
  "/inversor": "Inicio",
  "/mercado": "Empresas",
  "/procesos": "Procesos",
  "/mandatos": "Inicio",
  "/mandatos/encargos": "Encargos",
  "/mandatos/venta": "Procesos",
  "/admin": "Inicio",
  "/admin/empresas": "Empresas",
  "/admin/cuentas": "Cuentas",
};

const processSeenKey = "Relify-process-seen";
let processSeen = "";
let processSeenLoaded = false;
const processSeenListeners = new Set<() => void>();

function subscribeProcessSeen(listener: () => void) {
  processSeenListeners.add(listener);
  loadProcessSeenFromStorage();
  return () => {
    processSeenListeners.delete(listener);
  };
}

function getProcessSeenSnapshot(): string {
  return processSeen;
}

function loadProcessSeenFromStorage() {
  if (processSeenLoaded || typeof window === "undefined") {
    return;
  }

  processSeenLoaded = true;
  processSeen = window.localStorage.getItem(processSeenKey) ?? "";

  for (const listener of processSeenListeners) {
    listener();
  }
}

function rememberProcessSeen(ids: readonly string[]) {
  const current = new Set(processSeen.split(",").filter((id) => id.length > 0));
  let changed = false;

  for (const id of ids) {
    if (!current.has(id)) {
      current.add(id);
      changed = true;
    }
  }

  if (!changed || typeof window === "undefined") {
    return;
  }

  processSeen = [...current].join(",");
  window.localStorage.setItem(processSeenKey, processSeen);

  for (const listener of processSeenListeners) {
    listener();
  }
}

function subscribeReady() {
  return () => undefined;
}

const processHrefs = new Set(["/procesos", "/mi-empresa/procesos", "/mandatos/venta"]);

function SideLink({
  href,
  label,
  selected,
  icon: Icon,
  onNavigate,
  alert,
  count,
}: {
  href: string;
  label: string;
  selected: boolean;
  icon: typeof HouseIcon;
  onNavigate: () => void;
  alert: boolean;
  count: number | null;
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
      title={label}
      className={
        selected
          ? "shell-link group relative flex min-h-11 min-w-0 items-center gap-3 rounded-2xl bg-public-sand px-4 py-2 text-base font-medium text-public-ink"
          : "shell-link group relative flex min-h-11 min-w-0 items-center gap-3 rounded-2xl px-4 py-2 text-base text-public-muted hover:bg-public-sand hover:text-public-ink"
      }
    >
      <Icon ref={iconRef} size={16} isAnimated={false} aria-hidden />
      <span className="shell-label min-w-0 flex-1">{label}</span>
      {count === null || count === 0 ? (
        alert ? <span className="shell-dot inline-flex size-2.5 shrink-0 rounded-full bg-[#d92d20]" aria-label="Hay novedades sin ver" /> : null
      ) : (
        <span className="shell-badge relative inline-flex shrink-0">
          <span
            className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#465ab4] px-2 text-sm font-semibold text-white"
            aria-label={`${count} procesos`}
          >
            {count > 99 ? "99+" : count}
          </span>
          {alert ? (
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-[#d92d20] ring-2 ring-white" aria-label="Hay novedades sin ver" />
          ) : null}
        </span>
      )}
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
  showHelp = true,
  processCount = 0,
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
  showHelp?: boolean;
  processCount?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const home = destinations[0]?.href ?? "/cuenta";
  const initials = accountInitials(name);
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const seen = useSyncExternalStore(subscribeProcessSeen, getProcessSeenSnapshot, () => "");

  useEffect(() => {
    const ids = notifications
      .filter((item) => item.unread && processMenuTarget(item.href) !== null && noticeOpenOnPath(item.href, pathname))
      .map((item) => item.id);
    rememberProcessSeen(ids);
  }, [notifications, pathname]);

  const tabs = destinations.filter((item) => item.href in tabLabelForHref).slice(0, 3);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="shell min-h-screen bg-public-paper font-public text-public-ink">
      {open ? (
        <button type="button" aria-label={shellCopy.menuClose} className="shell-backdrop" onClick={closeMenu} />
      ) : null}
      <aside
        id="app-sidebar"
        data-open={open ? "true" : "false"}
        className="shell-sidebar"
      >
        <div className="shell-head relative z-20 flex flex-col gap-3 px-4 pt-5 pb-2">
          {/* Row 1: brand on the left, quick tools on the right. Never wraps. */}
          <div className="flex min-w-0 items-center justify-between gap-2">
            <Link href={home} onClick={closeMenu} className="shrink-0" aria-label="Relify">
              <Logo />
            </Link>
            <div className="shell-tools flex shrink-0 items-center gap-1">
              {showPremium ? <PremiumLink onClick={closeMenu} /> : null}
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
          {/* Row 2: the active company spans the full sidebar width. */}
          {canManageCompanies ? (
            <CompanySwitcher companies={companies} activeId={activeCompanyId} notices={notifications} />
          ) : null}
        </div>
        <nav aria-label={shellCopy.navLabel} className="shell-nav flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-3">
          {destinations.map((item, index) => {
            const selected = destinationIsCurrent(item.href, pathname);
            const previous = destinations[index - 1];
            const showSection = item.section !== undefined && item.section !== previous?.section;
            const seenIds = new Set(seen.split(",").filter((id) => id.length > 0));
            const alert =
              ready &&
              notifications.some(
                (notice) => notice.unread && processMenuTarget(notice.href) === item.href && !seenIds.has(notice.id),
              );

            return (
              <div key={item.href}>
                {showSection ? (
                  <p className="shell-label px-4 pt-5 pb-1 text-xs font-medium tracking-wide text-public-muted">{item.section}</p>
                ) : null}
                <SideLink
                  href={item.href}
                  label={item.label}
                  selected={selected}
                  icon={(iconForHref[item.href as keyof typeof iconForHref] ?? Building2Icon) as typeof HouseIcon}
                  onNavigate={closeMenu}
                  alert={alert}
                  count={processHrefs.has(item.href) ? processCount : null}
                />
              </div>
            );
          })}
        </nav>
        <div className="shell-foot border-t border-public-line p-3">
          {showHelp ? (
            <section className="shell-full mb-3 rounded-2xl bg-public-sand p-3">
              <h2 className="text-sm font-semibold text-public-ink">{shellCopy.helpTitle}</h2>
              <p className="mt-1 text-xs leading-5 text-public-muted">{shellCopy.helpBody}</p>
              <div className="mt-3 grid gap-2">
                <a
                  href={shellCopy.helpPhoneHref}
                  className="group inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-public-clay px-3 text-sm font-medium text-white hover:bg-public-clay-deep"
                >
                  <PhoneIcon size={16} aria-hidden />
                  {shellCopy.helpCall} {shellCopy.helpPhone}
                </a>
                <a
                  href={shellCopy.helpEmailHref}
                  className="group inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-public-line bg-public-card px-3 text-sm font-medium text-public-ink hover:bg-white"
                >
                  <MailIcon size={16} aria-hidden />
                  <span className="truncate">{shellCopy.helpEmail}</span>
                </a>
              </div>
            </section>
          ) : null}
          <Link
            href="/cuenta"
            onClick={closeMenu}
            title={name}
            className="shell-profile flex items-center gap-3 rounded-2xl border border-public-line px-3 py-2 hover:bg-public-sand"
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-public-sand text-sm font-medium text-public-clay">
              {initials}
            </span>
            <span className="shell-label min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block text-sm font-medium text-public-clay">{shellCopy.viewProfile}</span>
            </span>
            <ChevronRightIcon size={16} className="shell-label shrink-0 text-public-clay" aria-hidden />
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              title={authCopy.signOut}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-public-line text-sm font-medium text-public-ink hover:bg-public-sand"
            >
              <LogOutIcon size={16} aria-hidden />
              <span className="shell-label">{authCopy.signOut}</span>
            </button>
          </form>
        </div>
      </aside>
      <main className="shell-main">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-public-line bg-white px-3 lg:hidden">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="app-sidebar"
            onClick={() => {
              setOpen(true);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-base font-medium text-public-ink hover:bg-public-sand"
          >
            <PanelLeftIcon size={20} aria-hidden />
            <span>Menú</span>
          </button>
          <Link href={home} aria-label="Relify">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            {showPremium ? <PremiumLink /> : null}
            <NotificationBell items={notifications} />
          </div>
        </header>
        <div className="shell-content pb-28 lg:pb-[var(--layout-pad)]">
          {showTitle ? <h1 className="text-3xl tracking-tight text-public-ink">{title}</h1> : null}
          <div className={showTitle ? "mt-6" : undefined}>{children}</div>
        </div>
        <nav
          aria-label="Accesos rápidos"
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-public-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {tabs.map((item) => {
            const Icon = (iconForHref[item.href as keyof typeof iconForHref] ?? Building2Icon) as typeof HouseIcon;
            const selected = destinationIsCurrent(item.href, pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-medium ${selected ? "text-[#0c7c78]" : "text-public-muted"}`}
              >
                <Icon size={22} isAnimated={false} aria-hidden />
                {tabLabelForHref[item.href] ?? item.label}
              </Link>
            );
          })}
          {showHelp ? (
            <a href={shellCopy.helpPhoneHref} className="flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-medium text-public-muted">
              <PhoneIcon size={22} aria-hidden />
              Ayuda
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(true);
              }}
              className="flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-medium text-public-muted"
            >
              <PanelLeftIcon size={22} aria-hidden />
              Más
            </button>
          )}
        </nav>
      </main>
    </div>
  );
}

/** Compact upgrade entry beside the bell; the label shows as a tooltip on hover and focus. */
function PremiumLink({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/premium"
      onClick={onClick}
      aria-label={sellerCopy.premium}
      className="group/premium relative inline-flex size-10 items-center justify-center rounded-full text-public-clay hover:bg-public-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
    >
      <CrownIcon size={18} aria-hidden />
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-30 mt-1 -translate-x-1/2 rounded-md bg-[#1c2740] px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-opacity duration-150 group-hover/premium:opacity-100 group-focus-visible/premium:opacity-100"
      >
        {sellerCopy.premium}
      </span>
    </Link>
  );
}
