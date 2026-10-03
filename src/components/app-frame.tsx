"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  CircleHelp,
  Crown,
  EyeOff,
  Files,
  Heart,
  House,
  LogOut,
  MessageCircleMore,
  Newspaper,
  PanelLeft,
  Search,
  TableProperties,
  User,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/cuenta/actions";
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
  "/inversor/perfil": User,
  "/mi-empresa/detalles": Building2,
  "/mi-empresa/documentos": Files,
  "/dataroom": Files,
  "/mi-empresa/procesos": TableProperties,
  "/procesos": TableProperties,
  "/mi-empresa/servicios": MessageCircleMore,
  "/tendencias": Newspaper,
  "/busquedas": Search,
  "/favoritos": Heart,
  "/ocultas": EyeOff,
  "/mandatos": House,
  "/mis-servicios": Briefcase,
  "/cuenta": User,
};

export function AppFrame({
  name,
  roleLabel,
  destinations,
  title,
  showTitle = true,
  notifications,
  children,
}: {
  name: string;
  roleLabel: string;
  destinations: ShellDestination[];
  title: string;
  showTitle?: boolean;
  notifications: NotificationView[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const home = destinations[0]?.href ?? "/cuenta";
  const workspace = destinations.some((item) => item.href === "/mi-empresa" || item.href === "/inversor" || item.href === "/mercado");
  const firstName = name.trim().split(/\s+/)[0] ?? name;

  function closeMenu() {
    setOpen(false);
  }

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setCollapsed((current) => !current);
      return;
    }

    setOpen((current) => !current);
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#2b3b4a]">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#e7eaee] bg-[#f9fafb] px-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="app-sidebar"
          onClick={toggleSidebar}
          className="inline-flex size-7 items-center justify-center rounded-full text-[#2b3b4a]"
        >
          {open ? <X className="size-4" aria-hidden /> : <PanelLeft className="size-4" aria-hidden />}
          <span className="sr-only">{open ? shellCopy.menuClose : shellCopy.menuOpen}</span>
        </button>
        <div className="flex items-center gap-2 pr-2">
          {workspace ? (
            <Link
              href="/cuenta"
              className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-[#ffaf4d] px-4 text-base font-medium text-[#2b3b4a]"
            >
              <Crown className="size-4" aria-hidden />
              {sellerCopy.premium}
            </Link>
          ) : null}
          <div className="relative">
            <button
              type="button"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              onClick={() => {
                setAccountOpen((current) => !current);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e7eaee] bg-white pr-3 pl-1.5 text-base font-medium text-[#2b3b4a]"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#f4f4f5] text-[#3f3f46]">
                <User className="size-4" aria-hidden />
              </span>
              {firstName}
              <span className="sr-only">{roleLabel}</span>
            </button>
            {accountOpen ? (
              <div role="menu" className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-[#e7eaee] bg-white p-2 shadow-lg">
                <p className="px-2 py-1 text-sm font-medium">{name}</p>
                <p className="px-2 pb-2 text-xs text-[#64748b]">{roleLabel}</p>
                <Link
                  href="/cuenta"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                  }}
                  className="block rounded-xl px-2 py-2 text-sm hover:bg-[#f4f4f5]"
                >
                  {authCopy.accountTitle}
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-[#f4f4f5]"
                  >
                    <LogOut className="size-4" aria-hidden />
                    {authCopy.signOut}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
          <NotificationBell items={notifications} />
        </div>
      </header>
      {open ? (
        <button
          type="button"
          aria-label={shellCopy.menuClose}
          className="fixed inset-0 z-30 bg-[#1c2740]/30 md:hidden"
          onClick={closeMenu}
        />
      ) : null}
      <aside
        id="app-sidebar"
        className={
          open
            ? "fixed top-16 bottom-0 left-0 z-40 flex w-[255px] flex-col bg-[#fafafa]"
            : collapsed
              ? "fixed top-16 bottom-0 left-0 z-40 hidden w-[255px] flex-col bg-[#fafafa]"
              : "fixed top-16 bottom-0 left-0 z-40 hidden w-[255px] flex-col bg-[#fafafa] md:flex"
        }
      >
        <Link href={home} onClick={closeMenu} className="px-5 pt-5 text-[26px] leading-none font-semibold tracking-tight text-[#243056]">
          Releva
        </Link>
        <nav aria-label={shellCopy.navLabel} className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
          {destinations.map((item, index) => {
            const Icon = iconForHref[item.href] ?? Building2;
            const selected = destinationIsCurrent(item.href, pathname);
            const previous = destinations[index - 1];
            const showSection = item.section !== undefined && item.section !== previous?.section;

            return (
              <div key={item.href}>
                {showSection ? (
                  <p className="flex h-8 items-center px-2 text-sm font-medium text-[#3f3f46]/70">{item.section}</p>
                ) : null}
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={selected ? "page" : undefined}
                  className={
                    selected
                      ? "flex h-11 items-center gap-2 rounded-[14px] bg-[#f4f4f5] p-2.5 text-base font-medium text-[#18181b]"
                      : "flex h-11 items-center gap-2 rounded-[14px] p-2.5 text-base font-normal text-[#3f3f46] hover:bg-[#f4f4f5]"
                  }
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="p-3">
          <Link
            href="/cuenta"
            onClick={closeMenu}
            className="inline-flex items-center gap-2 rounded-full border border-[#e7eaee] bg-white px-4 py-2 text-sm text-[#3f3f46]"
          >
            <CircleHelp className="size-4" aria-hidden />
            {sellerCopy.help}
          </Link>
        </div>
      </aside>
      <main className={collapsed ? "min-h-screen bg-[#fcfcfc] pt-16" : "min-h-screen bg-[#fcfcfc] pt-16 md:pl-[255px]"}>
        <div className="mx-auto w-full max-w-7xl px-3 pt-4 pb-6 md:px-6">
          {showTitle ? <h1 className="text-[28px] leading-none font-semibold tracking-tight text-[#2b3b4a]">{title}</h1> : null}
          <div className={showTitle ? "mt-4" : undefined}>{children}</div>
        </div>
      </main>
      <span className="sr-only">{accountInitials(name)}</span>
    </div>
  );
}
