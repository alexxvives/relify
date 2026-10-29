"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
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
import { ChevronDown as ChevronDownIcon } from "lucide-react";
import { ReceiptIcon } from "@animateicons/react/lucide/receipt-icon";
import { TableIcon } from "@animateicons/react/lucide/table-icon";
import { TrophyIcon } from "@animateicons/react/lucide/trophy-icon";
import { UsersIcon } from "@animateicons/react/lucide/users-icon";
import { XIcon } from "@animateicons/react/lucide/x-icon";
import { signOutAction } from "@/app/(app)/cuenta/actions";
import { Logo } from "@/components/logo";
import { CompanySwitcher } from "@/components/company-switcher";
import { sellerCompanyLabel } from "@/lib/seller-company";
import { NotificationBell } from "@/components/notification-bell";
import { AlertDot } from "@/components/ui/badge";
import { scopeNoticesToCompany } from "@/lib/notifications";
import { authCopy } from "@/lib/auth-copy";
import { accountInitials } from "@/lib/auth-input";
import type { NotificationView } from "@/lib/notifications";
import { sellerCopy } from "@/lib/seller-copy";
import { destinationIsCurrent, noticeOpenOnPath, processMenuTarget, goldPillHrefs, shellCopy, type ShellDestination } from "@/lib/shell";

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
  "/mi-empresa/venta": TrophyIcon,
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
  "/admin/mensajes": MessageCircleMoreIcon,
  "/admin/lista-de-espera": MailIcon,
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
  pending = 0,
}: {
  href: string;
  label: string;
  selected: boolean;
  icon: typeof HouseIcon;
  onNavigate: () => void;
  alert: boolean;
  count: number | null;
  pending?: number;
}) {
  const iconRef = useRef<HouseIconHandle>(null);

  return (
    <Link
      href={href}
      prefetch
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
          ? "shell-link group relative flex min-h-11 min-w-0 items-center gap-3 rounded-xl bg-[#262d40] px-4 py-2 text-base font-medium text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-full before:bg-[#2fc4b2]"
          : "shell-link group relative flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-4 py-2 text-base text-[#aeb6c7] hover:bg-[#222839] hover:text-white"
      }
    >
      <span className={selected ? "inline-flex text-[#2fc4b2]" : "inline-flex"}>
        <Icon ref={iconRef} size={16} isAnimated={false} aria-hidden />
      </span>
      <span className="shell-label min-w-0 flex-1">{label}</span>
      {pending > 0 && (count === null || count === 0) ? (
        <span
          className="shell-badge inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#d92d20] px-1.5 text-xs font-semibold text-white"
          aria-label={`${pending} acciones pendientes`}
          title={`${pending} acciones pendientes`}
        >
          {pending > 99 ? "99+" : pending}
        </span>
      ) : null}
      {count === null || count === 0 ? (
        alert ? <AlertDot className="shell-dot" label="Hay novedades sin ver" /> : null
      ) : (
        <span className="shell-badge relative inline-flex shrink-0">
          <span
            className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#2fc4b2] px-2 text-sm font-semibold text-[#0f1b24]"
            aria-label={`${count} procesos`}
          >
            {count > 99 ? "99+" : count}
          </span>
          {pending > 0 ? (
            // Pending actions ride on the count circle as one red bubble (no separate dot beside it).
            <span
              className="absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d92d20] px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-[#1a1f2e]"
              aria-label={`${pending} acciones pendientes`}
              title={`${pending} acciones pendientes`}
            >
              {pending > 99 ? "99+" : pending}
            </span>
          ) : alert ? (
            <AlertDot ring className="absolute -top-1 -right-1" label="Hay novedades sin ver" />
          ) : null}
        </span>
      )}
    </Link>
  );
}

export function AppFrame({
  name,
  destinations,
  notifications: allNotifications,
  showPremium = false,
  companies = [],
  activeCompanyId = null,
  canManageCompanies = false,
  showHelp = true,
  processCount = 0,
  processPending = 0,
  encargoCount = 0,
  navCounts = {},
  children,
}: {
  name: string;
  destinations: ShellDestination[];
  notifications: NotificationView[];
  showPremium?: boolean;
  companies?: { id: string; legalName: string; codename: string; pending?: number }[];
  activeCompanyId?: string | null;
  canManageCompanies?: boolean;
  showHelp?: boolean;
  processCount?: number;
  /** Pending "your turn" actions for roles without a company switcher (buyer). */
  processPending?: number;
  encargoCount?: number;
  /** Extra sidebar bubbles by href (admin: new items since last visit). */
  navCounts?: Record<string, number>;
  children: ReactNode;
}) {
  // Multi-company sellers: the bell and menu dots only cover the selected company.
  const { scoped: notifications, unreadElsewhere } = useMemo(
    () => scopeNoticesToCompany(allNotifications, companies, activeCompanyId),
    [allNotifications, companies, activeCompanyId],
  );
  const routePath = usePathname();
  // Optimistic active state: highlight the clicked item at once, before the route commits.
  const [navTarget, setNavTarget] = useState<{ href: string; from: string } | null>(null);
  const pathname = navTarget !== null && navTarget.from === routePath ? navTarget.href : routePath;
  // Same numbers as the company switcher badges: "your turn" actions per company, named so other companies are clear.
  const pendingGroups = canManageCompanies
    ? companies
        .filter((company) => (company.pending ?? 0) > 0)
        .map((company) => ({ companyId: company.id, label: sellerCompanyLabel(company.legalName, company.codename), count: company.pending ?? 0, active: company.id === activeCompanyId }))
        .sort((a, b) => Number(b.active) - Number(a.active))
    : [];
  const activePending = (companies.find((company) => company.id === activeCompanyId)?.pending ?? 0) + processPending;
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());

  function toggleSection(section: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }
  const home = destinations[0]?.href ?? "/cuenta";
  const initials = accountInitials(name);
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const seen = useSyncExternalStore(subscribeProcessSeen, getProcessSeenSnapshot, () => "");

  useEffect(() => {
    const ids = notifications
      .filter((item) => item.unread && processMenuTarget(item.href) !== null && noticeOpenOnPath(item.href, routePath))
      .map((item) => item.id);
    rememberProcessSeen(ids);
  }, [notifications, routePath]);

  const tabs = destinations.filter((item) => item.href in tabLabelForHref).slice(0, 3);

  const saleItem = destinations.find((item) => goldPillHrefs.includes(item.href));
  const navItems = destinations.filter((item) => !goldPillHrefs.includes(item.href));

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
        className="shell-sidebar shell-dark"
      >
        <div className="shell-head relative z-20 flex flex-col gap-3 px-4 pt-5 pb-2">
          {/* Row 1: brand on the left, quick tools on the right. Never wraps. */}
          <div className="flex min-w-0 items-center justify-between gap-2">
            <Link href={home} onClick={closeMenu} className="shrink-0" aria-label="Relify">
              <Logo tone="light" />
            </Link>
            <div className="shell-tools flex shrink-0 items-center gap-1">
              {showPremium ? <PremiumLink onClick={closeMenu} /> : null}
              <NotificationBell items={notifications} pendingGroups={pendingGroups} />
              <button
                type="button"
                onClick={closeMenu}
                className="shell-close inline-flex size-10 items-center justify-center rounded-full text-[#d6dbe6] hover:bg-[#262d40]"
              >
                <XIcon size={16} aria-hidden />
                <span className="sr-only">{shellCopy.menuClose}</span>
              </button>
            </div>
          </div>
          {/* Row 2: the active company spans the full sidebar width. */}
          {canManageCompanies ? (
            <CompanySwitcher companies={companies} activeId={activeCompanyId} notices={notifications} unreadElsewhere={unreadElsewhere} />
          ) : null}
        </div>
        <nav aria-label={shellCopy.navLabel} className="shell-nav flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-3">
          {navItems.map((item, index) => {
            const selected = destinationIsCurrent(item.href, pathname);
            const previous = navItems[index - 1];
            const showSection = item.section !== undefined && item.section !== previous?.section;
            const sectionId = item.section ? `nav-section-${item.section.replace(/\W+/g, "-")}` : undefined;
            const hidden = item.section !== undefined && collapsed.has(item.section) && !selected;
            const seenIds = new Set(seen.split(",").filter((id) => id.length > 0));
            const alert =
              ready &&
              notifications.some(
                (notice) => notice.unread && processMenuTarget(notice.href) === item.href && !seenIds.has(notice.id),
              );

            return (
              <div key={item.href}>
                {showSection && item.section ? (
                  <button
                    type="button"
                    aria-expanded={!collapsed.has(item.section)}
                    aria-controls={sectionId}
                    onClick={() => {
                      toggleSection(item.section ?? "");
                    }}
                    className="shell-label flex w-full items-center justify-between rounded-lg px-4 pt-5 pb-2 text-[11px] font-semibold tracking-[0.08em] text-[#8a93a8] uppercase hover:text-[#d6dbe6] focus-visible:outline-2 focus-visible:outline-[#2fc4b2]"
                  >
                    {item.section}
                    <ChevronDownIcon
                      size={14}
                      className={`shrink-0 transition-transform duration-200 ${collapsed.has(item.section) ? "-rotate-90" : ""}`}
                      aria-hidden
                    />
                  </button>
                ) : null}
                {hidden ? null : (
                <div id={showSection ? sectionId : undefined}>
                <SideLink
                  href={item.href}
                  label={item.label}
                  selected={selected}
                  icon={(iconForHref[item.href as keyof typeof iconForHref] ?? Building2Icon) as typeof HouseIcon}
                  onNavigate={() => {
                    setNavTarget({ href: item.href, from: routePath });
                    closeMenu();
                  }}
                  alert={alert}
                  pending={item.href === "/mi-empresa/procesos" || item.href === "/procesos" ? activePending : 0}
                  count={processHrefs.has(item.href) ? processCount : item.href === "/mandatos/encargos" ? encargoCount : (selected ? null : (navCounts[item.href] ?? null))}
                />
                </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="shell-foot border-t border-white/10 p-3">
          {saleItem ? (
            <Link
              href={saleItem.href}
              onClick={closeMenu}
              title={saleItem.label}
              aria-current={destinationIsCurrent(saleItem.href, pathname) ? "page" : undefined}
              className="group mb-3 flex h-9 min-w-0 items-center justify-center gap-2 rounded-full bg-[linear-gradient(120deg,#f3e2b3_0%,#ecd08a_50%,#f3e2b3_100%)] px-3 text-sm font-semibold text-[#5a4210] ring-1 ring-[#d4b062]/60 transition hover:brightness-[1.03] aria-[current=page]:ring-[#a87f2c]"
            >
              <TrophyIcon size={16} isAnimated={false} aria-hidden />
              <span className="shell-label min-w-0 truncate">{saleItem.label}</span>
            </Link>
          ) : null}
          {showHelp ? (
            <details className="shell-full group/help mb-3 rounded-xl bg-[#222839] px-3 py-2 open:py-3">
              <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
                {shellCopy.helpTitle}
                <ChevronDownIcon size={16} className="shrink-0 text-[#aeb6c7] transition-transform duration-200 group-open/help:rotate-180" aria-hidden />
              </summary>
              <p className="mt-1 text-xs leading-5 text-[#aeb6c7]">{shellCopy.helpBody}</p>
              <div className="mt-3 grid gap-2">
                <a
                  href={shellCopy.helpPhoneHref}
                  className="group inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1a1f2e] px-3 text-sm font-medium text-[#d6dbe6] hover:bg-[#262d40] hover:text-white"
                >
                  <PhoneIcon size={16} aria-hidden />
                  {shellCopy.helpCall} {shellCopy.helpPhone}
                </a>
                <a
                  href={shellCopy.helpEmailHref}
                  className="group inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1a1f2e] px-3 text-sm font-medium text-[#d6dbe6] hover:bg-[#262d40] hover:text-white"
                >
                  <MailIcon size={16} aria-hidden />
                  <span className="truncate">{shellCopy.helpEmail}</span>
                </a>
              </div>
            </details>
          ) : null}
          <Link
            href="/cuenta"
            onClick={closeMenu}
            title={name}
            className="shell-profile flex items-center gap-3 rounded-xl px-3 py-2 text-white hover:bg-[#222839]"
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2fc4b2] text-sm font-semibold text-[#0f1b24]">
              {initials}
            </span>
            <span className="shell-label min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block text-sm text-[#aeb6c7]">{shellCopy.viewProfile}</span>
            </span>
            <ChevronRightIcon size={16} className="shell-label shrink-0 text-[#8a93a8]" aria-hidden />
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              title={authCopy.signOut}
              className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-[#aeb6c7] hover:bg-[#222839] hover:text-white"
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
            <NotificationBell items={notifications} pendingGroups={pendingGroups} />
          </div>
        </header>
        <div className="shell-content pb-28 lg:pb-[var(--layout-pad)]">
          {children}
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
