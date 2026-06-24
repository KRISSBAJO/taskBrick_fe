"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Blocks,
  BriefcaseBusiness,
  Calendar,
  ClipboardCheck,
  CreditCard,
  Ellipsis,
  FileText,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageCircle,
  MessageSquare,
  Settings,
  Shield,
  Sparkles,
  Star,
  Target,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { cn } from "@/lib/cn";
import { getAccessProfile, roleLabel } from "@/lib/access-policy";

type NavItem = { label: string; href: string; icon: LucideIcon };

const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderOpen },
  { label: "Board", href: "/board", icon: ListChecks },
  { label: "Sprints", href: "/sprints", icon: Calendar },
  { label: "Meetings", href: "/meetings", icon: MessageSquare },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Team", href: "/team", icon: Users },
];

const TOOLS_NAV: NavItem[] = [
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Approvals", href: "/approvals", icon: ClipboardCheck },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Billing", href: "/settings/billing", icon: CreditCard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Integrations", href: "/integrations", icon: Blocks },
  { label: "Admin", href: "/admin", icon: Shield },
  { label: "Docs", href: "/docs", icon: FileText },
];

const SETTINGS_NAV: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

const WORK_HUB_NAV: NavItem[] = [
  { label: "For You", href: "/work-hub/for-you", icon: Sparkles },
  { label: "Inbox", href: "/work-hub/inbox", icon: Inbox },
  { label: "Starred", href: "/work-hub/starred", icon: Star },
  { label: "My Tasks", href: "/work-hub/my-tasks", icon: Target },
];

function userInitials(first: string, last: string, email: string) {
  const i = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.trim();
  return i || email.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useWorkspaceAuth();
  const [panelOpen, setPanelOpen] = useState(false);
  const access = getAccessProfile(user);
  const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const initials = userInitials(user.firstName, user.lastName, user.email);
  const visibleTools = TOOLS_NAV.filter((item) => {
    if (item.href === "/admin") return access.canViewAdmin;
    if (item.href === "/integrations") return access.canManageIntegrations;
    if (item.href === "/reports") return access.canViewReports;
    if (item.href === "/settings/billing") return access.canViewBilling;
    return true;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPanelOpen(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  function isActive(href: string) {
    const path = href.split("#")[0];
    return pathname === path || (path.length > 1 && pathname.startsWith(`${path}/`));
  }

  return (
    <aside
      className={cn(
        "hidden min-h-dvh shrink-0 border-r border-line bg-[#f4f1e7] transition-[width] duration-200 lg:flex",
        panelOpen ? "w-[336px]" : "w-[58px]",
      )}
    >
      <div className="flex w-[58px] shrink-0 flex-col items-center border-r border-line bg-panel">
        <Link
          href="/"
          aria-label="TaskBricks home"
          className="flex h-[64px] w-full items-center justify-center border-b border-line"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-[#111111] shadow-[0_12px_28px_rgba(255,212,0,0.28)]">
            <Blocks className="size-5" aria-hidden="true" />
          </span>
        </Link>

        <nav className="flex w-full flex-1 flex-col items-center gap-1.5 px-1.5 py-4" aria-label="Primary navigation">
          {PRIMARY_NAV.slice(0, 1).map((item) => (
            <RailLink key={item.href} item={item} active={isActive(item.href)} />
          ))}

          <WorkHubRail active={isActive("/work-hub")} isActive={isActive} />

          {PRIMARY_NAV.slice(1).map((item) => (
            <RailLink key={item.href} item={item} active={isActive(item.href)} />
          ))}

          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            aria-label={panelOpen ? "Close tools panel" : "Open tools panel"}
            className={cn(
              "group relative mt-2 flex size-11 items-center justify-center rounded-2xl text-ink-soft transition",
              panelOpen
                ? "bg-[#111111] text-primary shadow-[0_16px_34px_rgba(17,17,17,0.18)]"
                : "hover:bg-panel-muted hover:text-foreground",
            )}
          >
            {panelOpen ? <X className="size-4" aria-hidden="true" /> : <Ellipsis className="size-5" aria-hidden="true" />}
            <RailTooltip label={panelOpen ? "Close more tools" : "More tools"} />
          </button>

          <div className="mt-auto flex w-full flex-col items-center gap-1.5 border-t border-line pt-4">
            <RailLink item={SETTINGS_NAV[0]} active={isActive("/settings")} />
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              className="group relative flex size-11 items-center justify-center rounded-2xl text-ink-soft transition hover:bg-red-50 hover:text-danger"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <RailTooltip label="Sign out" />
            </button>
          </div>
        </nav>
      </div>

      {panelOpen ? (
        <div className="flex min-w-0 flex-1 flex-col p-3">
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-panel shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary-dark">TaskBricks</p>
                <h2 className="mt-1 text-sm font-black text-foreground">More tools</h2>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Close tools panel"
                className="flex size-8 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:bg-panel-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 tb-scrollbar" aria-label="More tools">
              <PanelSection label="Operations">
                {visibleTools.map((item) => (
                  <PanelLink key={item.href} item={item} active={isActive(item.href)} />
                ))}
              </PanelSection>
            </nav>

            <div className="border-t border-line p-3">
              <div className="flex items-center gap-3 rounded-xl bg-[#111111] p-2.5 text-white">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[11px] font-black text-[#111111]">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-black">{displayName}</p>
                  <p className="truncate text-[10px] text-white/45">{roleLabel(user)}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Sign out"
                  title="Sign out"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-primary"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function RailLink({ active, item }: { active: boolean; item: NavItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      className={cn(
        "group relative flex size-11 items-center justify-center rounded-2xl transition",
        active
          ? "bg-primary text-[#111111] shadow-[0_14px_28px_rgba(255,212,0,0.35)]"
          : "text-ink-soft hover:bg-panel-muted hover:text-foreground",
      )}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
      <RailTooltip label={item.label} />
    </Link>
  );
}

function WorkHubRail({
  active,
  isActive,
}: {
  active: boolean;
  isActive: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  function closeMenu() {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 180);
  }

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  return (
    <div
      className="relative"
      onFocus={openMenu}
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <Link
        href="/work-hub/for-you"
        aria-label="Work Hub"
        className={cn(
          "group relative flex size-11 items-center justify-center rounded-2xl transition",
          active
            ? "bg-primary text-[#111111] shadow-[0_14px_28px_rgba(255,212,0,0.35)]"
            : "text-ink-soft hover:bg-panel-muted hover:text-foreground",
        )}
      >
        <BriefcaseBusiness className="size-[18px]" aria-hidden="true" />
        {!open ? <RailTooltip label="Work Hub" /> : null}
      </Link>

      {open ? (
        <div
          className="absolute left-[calc(100%+10px)] top-0 z-[60] w-[292px] rounded-3xl border border-line bg-panel p-2 shadow-[0_26px_70px_rgba(17,17,17,0.18)]"
          onFocus={openMenu}
          onMouseEnter={openMenu}
        >
          <div className="flex items-center gap-3 rounded-2xl bg-[#111111] p-3 text-white">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-[#111111]">
              <BriefcaseBusiness className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-primary">Work Hub</span>
              <span className="mt-0.5 block text-sm font-black">For You, Inbox, Starred, My Tasks</span>
            </span>
          </div>

          <div className="mt-2 grid gap-1">
            {WORK_HUB_NAV.map((item) => {
              const Icon = item.icon;
              const itemActive = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-black transition",
                    itemActive
                      ? "bg-primary text-[#111111]"
                      : "text-[#4b5565] hover:bg-panel-muted hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      itemActive
                        ? "bg-[#111111] text-primary"
                        : "bg-[#f0f3f7] text-[#667085] group-hover:bg-primary/35 group-hover:text-[#111111]",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.label}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[11px] font-semibold",
                        itemActive ? "text-[#111111]/60" : "text-ink-soft",
                      )}
                    >
                      {workHubDescription(item.href)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RailTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 flex -translate-y-1/2 translate-x-[-4px] items-center opacity-0 transition duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
      <span className="size-2 rotate-45 bg-[#111111]" aria-hidden="true" />
      <span className="-ml-1 whitespace-nowrap rounded-xl border border-primary/25 bg-[#111111] px-3 py-2 text-xs font-black text-white shadow-[0_18px_42px_rgba(17,17,17,0.24)]">
        {label}
      </span>
    </span>
  );
}

function workHubDescription(href: string) {
  if (href.endsWith("/inbox")) return "Internal mail";
  if (href.endsWith("/starred")) return "Pinned work";
  if (href.endsWith("/my-tasks")) return "Assigned tasks";
  return "Daily queue";
}

function PanelSection({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <section className={className}>
      <p className="px-2 text-[11px] font-black text-ink-soft">{label}</p>
      <div className="mt-2 grid gap-1">{children}</div>
    </section>
  );
}

function PanelLink({ active, item }: { active: boolean; item: NavItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex h-12 items-center gap-3 rounded-xl px-2.5 text-[14px] font-bold transition",
        active
          ? "bg-[#111111] text-white shadow-[0_16px_36px_rgba(17,17,17,0.13)]"
          : "text-[#4b5565] hover:bg-panel-muted hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition",
          active
            ? "bg-primary text-[#111111]"
            : "bg-[#f0f3f7] text-[#667085] group-hover:bg-primary/35 group-hover:text-[#111111]",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
