"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import {
  Building2,
  Activity,
  BarChart3,
  Blocks,
  Bot,
  CalendarCheck2,
  CreditCard,
  DatabaseZap,
  Fingerprint,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MessageSquareWarning,
  MonitorSmartphone,
  PackageCheck,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  Wifi,
  WifiOff,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { ConfirmProvider } from "@/components/confirm-provider";
import { RealtimeProvider, useRealtime } from "@/components/realtime-provider";
import { ToastProvider } from "@/components/toast-provider";
import { AuthenticatedSessionProvider } from "@/components/workspace-shell";
import { cn } from "@/lib/cn";

type PlatformNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  color: string;
};

type PlatformNavGroup = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  items: PlatformNavItem[];
};

const PLATFORM_NAV_GROUPS: PlatformNavGroup[] = [
  {
    id: "command",
    label: "Command",
    description: "Overview and search",
    icon: LayoutDashboard,
    color: "#111111",
    items: [
      { label: "Dashboard", href: "/site-admin", icon: LayoutDashboard, description: "Platform overview", color: "#60a5fa" },
      { label: "Search", href: "/site-admin/search", icon: Search, description: "Cross-tenant lookup", color: "#111111" },
    ],
  },
  {
    id: "tenants",
    label: "Tenants",
    description: "Organizations and people",
    icon: Building2,
    color: "#a78bfa",
    items: [
      { label: "Tenants", href: "/site-admin/tenants", icon: Building2, description: "Organizations", color: "#a78bfa" },
      { label: "Users", href: "/site-admin/users", icon: Users, description: "Global directory", color: "#60a5fa" },
      { label: "Administrators", href: "/site-admin/admins", icon: UserCog, description: "Platform grants", color: "#34d399" },
    ],
  },
  {
    id: "security",
    label: "Security",
    description: "Identity, sessions, threats",
    icon: ShieldAlert,
    color: "#f87171",
    items: [
      { label: "Identity", href: "/site-admin/identity-security", icon: KeyRound, description: "MFA and SSO", color: "#f87171" },
      { label: "Sessions", href: "/site-admin/sessions", icon: MonitorSmartphone, description: "Devices and access", color: "#34d399" },
      { label: "Security", href: "/site-admin/security", icon: ShieldAlert, description: "Threats and events", color: "#f87171" },
    ],
  },
  {
    id: "runtime",
    label: "Operations",
    description: "Runtime, AI, analytics",
    icon: Workflow,
    color: "#d89b00",
    items: [
      { label: "Automation", href: "/site-admin/automation", icon: Workflow, description: "Runs and approvals", color: "#d89b00" },
      { label: "Integrations", href: "/site-admin/integrations", icon: Blocks, description: "Providers and webhooks", color: "#111111" },
      { label: "Meetings", href: "/site-admin/meetings", icon: CalendarCheck2, description: "Meeting ops", color: "#2563eb" },
      { label: "Realtime", href: "/site-admin/realtime", icon: MessageSquareWarning, description: "Rooms and messages", color: "#34d399" },
      { label: "Observability", href: "/site-admin/observability", icon: Activity, description: "Health and metrics", color: "#2563eb" },
      { label: "AI Ops", href: "/site-admin/ai-ops", icon: Bot, description: "Agents and usage", color: "#6d5dd3" },
      { label: "Reporting", href: "/site-admin/reporting", icon: BarChart3, description: "Analytics and exports", color: "#2563eb" },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    description: "Plans, subscriptions, usage",
    icon: CreditCard,
    color: "#d89b00",
    items: [
      { label: "Billing overview", href: "/site-admin/billing", icon: CreditCard, description: "Subscriptions and revenue", color: "#fbbf24" },
      { label: "Plan builder", href: "/site-admin/billing/plans", icon: PackageCheck, description: "Create plans and limits", color: "#6d5dd3" },
      { label: "Feature catalog", href: "/site-admin/billing/features", icon: Sparkles, description: "Billable capabilities", color: "#047857" },
      { label: "Subscriptions", href: "/site-admin/billing/subscriptions", icon: CreditCard, description: "Tenant plan state", color: "#2563eb" },
      { label: "Invoices", href: "/site-admin/billing/invoices", icon: DatabaseZap, description: "Collection records", color: "#111111" },
      { label: "Usage", href: "/site-admin/billing/usage", icon: Activity, description: "Metered consumption", color: "#d89b00" },
      { label: "Events", href: "/site-admin/billing/events", icon: Fingerprint, description: "Provider webhooks", color: "#dc2626" },
      { label: "Entitlements", href: "/site-admin/billing/entitlements", icon: ShieldCheck, description: "Tenant feature access", color: "#047857" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    description: "Audit, compliance, QA",
    icon: DatabaseZap,
    color: "#047857",
    items: [
      { label: "Compliance", href: "/site-admin/compliance", icon: DatabaseZap, description: "Governance jobs", color: "#a78bfa" },
      { label: "Audit", href: "/site-admin/audit", icon: Fingerprint, description: "Immutable trail", color: "#fbbf24" },
      { label: "Hardening", href: "/site-admin/hardening", icon: ShieldCheck, description: "QA and isolation", color: "#047857" },
    ],
  },
];

export function SiteAdminShell({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedSessionProvider
      loadingClassName="bg-[#f7f6f1]"
      loadingTitle="Preparing site admin..."
      loadingSubtitle="Checking platform session boundary."
    >
      {(value) => {
        if (!value.user.isPlatformAdmin) {
          return (
            <ToastProvider>
              <ConfirmProvider>
                <SiteAdminAccessDenied onLogout={value.logout} />
              </ConfirmProvider>
            </ToastProvider>
          );
        }

        return (
          <ToastProvider>
            <ConfirmProvider>
              <RealtimeProvider token={value.auth.accessToken}>
                <PlatformFrame sessionWarning={value.sessionWarning} onLogout={value.logout}>
                  {children}
                </PlatformFrame>
              </RealtimeProvider>
            </ConfirmProvider>
          </ToastProvider>
        );
      }}
    </AuthenticatedSessionProvider>
  );
}

function SiteAdminAccessDenied({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f7f6f1] px-5 text-[#111111]">
      <div
        className="pointer-events-none fixed inset-0 opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(rgba(17,17,17,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.035) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <section className="relative w-full max-w-md rounded-md border border-[#ded8c8] bg-white p-6 shadow-[0_24px_80px_rgba(17,17,17,0.12)]">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-[#111111]">Access denied</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#766f63]">
          This account is signed in, but it does not have an active platform administrator grant.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#dfc744] bg-[#ffd400] px-4 text-sm font-black text-[#111111] transition hover:bg-[#f2c200]"
          >
            <Building2 className="size-4" aria-hidden="true" />
            Workspace
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#ded8c8] bg-white px-4 text-sm font-black text-[#777064] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}

function PlatformFrame({
  children,
  onLogout,
  sessionWarning,
}: {
  children: ReactNode;
  onLogout: () => void;
  sessionWarning: string;
}) {
  const { status } = useRealtime();
  const realtimeReady = status === "connected";

  return (
    <div className="min-h-dvh bg-[#f7f6f1] text-[#111111]">
      <div
        className="pointer-events-none fixed inset-0 opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(rgba(17,17,17,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.035) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <div className="relative flex min-h-dvh">
        <PlatformSidebar onLogout={onLogout} />
        <div className="flex min-w-0 flex-1 flex-col">
          <PlatformHeader realtimeReady={realtimeReady} />
          {sessionWarning ? (
            <div className="border-b border-[#e8d69c] bg-[#fff7d8] px-5 py-2 text-sm font-semibold text-[#8a5a00]">
              {sessionWarning}
            </div>
          ) : null}
          <main className="mx-auto min-w-0 w-full max-w-7xl flex-1 px-4 py-5 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function PlatformSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openGroup = PLATFORM_NAV_GROUPS.find((group) => group.id === openGroupId) ?? null;

  function cancelClose() {
    if (!closeTimerRef.current) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }

  function scheduleClose() {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setOpenGroupId(null);
      closeTimerRef.current = null;
    }, 260);
  }

  function openGroupMenu(groupId: string) {
    cancelClose();
    setOpenGroupId(groupId);
  }

  function isItemActive(item: PlatformNavItem) {
    if (item.href === "/site-admin" || item.href === "/site-admin/billing") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function isGroupActive(group: PlatformNavGroup) {
    return group.items.some(isItemActive);
  }

  return (
    <aside
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
      className="sticky top-0 z-40 hidden h-dvh w-[68px] shrink-0 overflow-visible border-r border-[#ded8c8] bg-white/95 px-2 py-3 shadow-[18px_0_48px_rgba(17,17,17,0.08)] lg:flex lg:flex-col lg:items-center"
    >
      <Link
        href="/"
        aria-label="TaskBricks home"
        className="group relative flex size-12 items-center justify-center rounded-2xl border border-[#ded8c8] bg-white shadow-[0_16px_34px_rgba(17,17,17,0.08)] transition hover:border-[#ffd400]"
      >
        <Image src="/product/taskbrick_icon.png" alt="" width={30} height={30} className="size-[30px] object-contain" priority />
        <PlatformRailTooltip label="TaskBricks" description="Go to home" />
      </Link>

      <nav className="mt-8 grid gap-2" aria-label="Site admin navigation groups">
        {PLATFORM_NAV_GROUPS.map((group) => {
          const Icon = group.icon;
          const active = isGroupActive(group);
          const open = openGroupId === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onMouseEnter={() => openGroupMenu(group.id)}
              onFocus={() => openGroupMenu(group.id)}
              onClick={() => setOpenGroupId((current) => current === group.id ? null : group.id)}
              aria-expanded={open}
              aria-label={`${group.label} navigation`}
              className={cn(
                "group relative flex size-12 items-center justify-center rounded-2xl border transition",
                open
                  ? "border-[#dfc744] bg-[#ffd400] text-[#111111] shadow-[0_18px_42px_rgba(255,212,0,0.22)]"
                  : active
                  ? "border-[#111111]/10 bg-[#111111] text-white shadow-[0_14px_30px_rgba(17,17,17,0.16)]"
                  : "border-transparent text-[#777064] hover:border-[#ded8c8] hover:bg-[#f4f1e7] hover:text-[#111111]",
              )}
            >
              <Icon className="size-[18px]" style={{ color: active || open ? group.color : undefined }} aria-hidden="true" />
              {active ? <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#ffd400] shadow-[0_0_18px_rgba(255,212,0,0.85)]" /> : null}
              <PlatformRailTooltip label={group.label} description={group.description} />
            </button>
          );
        })}
      </nav>

      {openGroup ? (
        <PlatformGroupFlyout
          group={openGroup}
          isItemActive={isItemActive}
          onSelect={() => setOpenGroupId(null)}
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
        />
      ) : null}

      <div className="mt-auto grid gap-2">
        <Link
          href="/dashboard"
          aria-label="Back to workspace"
          className="group relative flex size-12 items-center justify-center rounded-2xl border border-[#dfc744] bg-[#fff3a3] text-[#111111] transition hover:bg-[#ffd400]"
        >
          <Building2 className="size-[18px]" aria-hidden="true" />
          <PlatformRailTooltip label="Workspace" description="Back to tenant workspace" />
        </Link>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Sign out"
          className="group relative flex size-12 items-center justify-center rounded-2xl border border-[#ded8c8] bg-white text-[#777064] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
          <PlatformRailTooltip label="Sign out" />
        </button>
      </div>
    </aside>
  );
}

function PlatformGroupFlyout({
  group,
  isItemActive,
  onPointerEnter,
  onPointerLeave,
  onSelect,
}: {
  group: PlatformNavGroup;
  isItemActive: (item: PlatformNavItem) => boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onSelect: () => void;
}) {
  const GroupIcon = group.icon;
  return (
    <div
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
      className="absolute left-[68px] top-[104px] z-50 w-[330px] rounded-[26px] border border-[#ded8c8] bg-white p-3 shadow-[0_26px_70px_rgba(17,17,17,0.18)]"
    >
      <div className="rounded-[22px] bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white" style={{ border: "1px solid #ded8c8", color: group.color }}>
            <GroupIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a8375]">Site Admin</p>
            <h2 className="truncate text-base font-black text-[#111111]">{group.label}</h2>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-[#766f63]">{group.description}</p>
          </div>
        </div>
      </div>

      <nav className="mt-3 grid gap-1.5" aria-label={`${group.label} links`}>
        {group.items.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onSelect}
              className={cn(
                "group/link flex min-h-[58px] items-center gap-3 rounded-2xl border px-3 transition",
                active
                  ? "border-[#111111] bg-[#111111] text-white shadow-[0_16px_36px_rgba(17,17,17,0.16)]"
                  : "border-transparent bg-white text-[#111111] hover:border-[#ded8c8] hover:bg-[#fbfaf6]",
              )}
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: active ? `${item.color}24` : "#f4f1e7",
                  border: active ? `1px solid ${item.color}44` : "1px solid #e7dfcf",
                  color: active ? item.color : "#777064",
                }}
              >
                <Icon className="size-[17px]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-[13px] font-black", active ? "text-white" : "text-[#111111]")}>{item.label}</span>
                <span className={cn("mt-0.5 block truncate text-[11px] font-semibold", active ? "text-white/55" : "text-[#766f63]")}>{item.description}</span>
              </span>
              {active ? <span className="size-2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.8)]" /> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function PlatformRailTooltip({ description, label }: { description?: string; label: string }) {
  return (
    <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 flex -translate-y-1/2 translate-x-[-4px] items-center opacity-0 transition duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
      <span className="size-2 rotate-45 border-b border-l border-[#ded8c8] bg-white" aria-hidden="true" />
      <span className="-ml-1 min-w-[148px] rounded-2xl border border-[#ded8c8] bg-white px-3 py-2 shadow-[0_18px_42px_rgba(17,17,17,0.14)]">
        <span className="block text-xs font-black text-[#111111]">{label}</span>
        {description ? <span className="mt-0.5 block text-[10px] font-semibold text-[#777064]">{description}</span> : null}
      </span>
    </span>
  );
}

function PlatformHeader({ realtimeReady }: { realtimeReady: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#ded8c8] bg-white/88 px-4 py-3 backdrop-blur-xl sm:px-6 xl:px-8">
      <div className="mx-auto flex min-h-12 max-w-7xl flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-3">
          <div className="hidden h-10 min-w-[280px] items-center gap-2 rounded-2xl border border-[#ded8c8] bg-[#fbfaf6] px-3 md:flex">
            <Search className="size-4 text-[#8a8375]" aria-hidden="true" />
            <span className="text-sm font-semibold text-[#8a8375]">Search tenants, platform users, events...</span>
          </div>
          <div className="md:hidden">
            <p className="text-sm font-black text-[#111111]">Site Admin</p>
            <p className="text-[11px] font-semibold text-[#777064]">Platform console</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[11px] font-black",
              realtimeReady
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            )}
          >
            {realtimeReady ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
            {realtimeReady ? "Live" : "Offline"}
          </span>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#dfc744] bg-[#fff3a3] px-3 text-[12px] font-black text-[#111111] transition hover:bg-[#ffd400]"
          >
            <Building2 className="size-3.5" aria-hidden="true" />
            Workspace
          </Link>
        </div>
      </div>
    </header>
  );
}
