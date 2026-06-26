"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  FileText,
  Hash,
  Loader2,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useRealtime } from "@/components/realtime-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  globalSearch,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type GlobalSearchResult,
  type GlobalSearchResultType,
  type Notification,
  type SearchCategory,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { getAccessProfile, roleLabel } from "@/lib/access-policy";

function userInitials(first: string, last: string, email: string) {
  const i = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.trim();
  return i || email.slice(0, 2).toUpperCase();
}

const searchCategories: Array<{ id: SearchCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "projects", label: "Projects" },
  { id: "tasks", label: "Tasks" },
  { id: "files", label: "Files" },
  { id: "people", label: "People" },
  { id: "messages", label: "Messages" },
];

const searchIcons: Record<GlobalSearchResultType, LucideIcon> = {
  FILE: FileText,
  MESSAGE: MessageSquare,
  PROJECT: BriefcaseBusiness,
  TASK: ClipboardList,
  TEAM: Users,
  USER: Users,
  WORKSPACE: Building2,
};

export function Topbar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { auth, user } = useWorkspaceAuth();
  const pathname = usePathname();
  const { notificationVersion, status } = useRealtime();
  const { toast } = useToast();
  const access = getAccessProfile(user);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommandSearch, setShowCommandSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<SearchCategory>("all");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const realtimeReady = status === "connected";
  const siteAdminActive = pathname.startsWith("/site-admin");

  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const [count, page] = await Promise.all([
        getUnreadNotificationCount(auth.accessToken),
        listNotifications(auth.accessToken, { limit: 6 }),
      ]);
      setUnread(count.total);
      setNotifications(page.data);
    } catch (error) {
      toast({
        title: "Notifications unavailable",
        description: error instanceof Error ? error.message : "Unable to load notifications.",
        variant: "error",
      });
    } finally {
      setLoadingNotifications(false);
    }
  }, [auth.accessToken, toast]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadNotifications, notificationVersion]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowCommandSearch(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (event.key === "Escape") {
        setShowCommandSearch(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const term = searchQuery.trim();
    let alive = true;
    const timer = window.setTimeout(() => {
      if (!showCommandSearch || term.length < 2) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      void globalSearch(auth.accessToken, {
        category: searchCategory,
        limit: 24,
        search: term,
      })
        .then((result) => {
          if (alive) setSearchResults(result.data);
        })
        .catch((error) => {
          if (!alive) return;
          setSearchResults([]);
          toast({
            title: "Search unavailable",
            description: error instanceof Error ? error.message : "Unable to search workspace.",
            variant: "error",
          });
        })
        .finally(() => {
          if (alive) setSearching(false);
        });
    }, 180);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [auth.accessToken, searchCategory, searchQuery, showCommandSearch, toast]);

  async function onMarkAllRead() {
    try {
      const result = await markAllNotificationsRead(auth.accessToken);
      setUnread(0);
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? new Date().toISOString(),
        })),
      );
      toast({
        title: "Notifications cleared",
        description: `${result.updated} unread notification${result.updated === 1 ? "" : "s"} marked as read.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Unable to update notifications",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  }

  async function onOpenNotification(notification: Notification) {
    if (!notification.readAt) {
      setUnread((current) => Math.max(0, current - 1));
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
      try {
        await markNotificationRead(auth.accessToken, notification.id);
      } catch {
        void loadNotifications();
      }
    }
    setShowNotifications(false);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/85 px-3 backdrop-blur-xl sm:px-4 md:px-5">
      <div className="flex h-14 items-center gap-3">
        {onOpenSidebar ? (
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open workspace navigation"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-panel text-foreground shadow-sm transition hover:border-primary/45 hover:bg-panel-muted lg:hidden"
          >
            <Menu className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        <div className="relative hidden flex-1 md:block">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onFocus={() => setShowCommandSearch(true)}
            placeholder="Search projects, tasks, people..."
            className="h-9 w-full max-w-[460px] rounded-xl border border-line bg-panel pl-9 pr-20 text-sm text-foreground shadow-sm placeholder:text-ink-soft transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded border border-line bg-panel-muted px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
            Ctrl K
          </kbd>

          {showCommandSearch ? (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowCommandSearch(false)}
                aria-hidden="true"
              />
              <CommandSearchMenu
                category={searchCategory}
                loading={searching}
                query={searchQuery}
                results={searchResults}
                onCategoryChange={setSearchCategory}
                onClose={() => setShowCommandSearch(false)}
              />
            </>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {access.canViewSiteAdmin ? (
            <div className="hidden h-9 items-center rounded-xl border border-line bg-panel p-1 shadow-sm md:flex">
              <Link
                href="/dashboard"
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-black transition",
                  !siteAdminActive ? "bg-[#111111] text-white" : "text-ink-soft hover:text-foreground",
                )}
              >
                <Building2 className="size-3.5" aria-hidden="true" />
                Workspace
              </Link>
              <Link
                href="/site-admin"
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-black transition",
                  siteAdminActive ? "bg-red-600 text-white" : "text-ink-soft hover:text-foreground",
                )}
              >
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Site Admin
              </Link>
            </div>
          ) : null}

          <span
            className={cn(
              "hidden h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold md:inline-flex",
              realtimeReady
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            )}
            title={realtimeReady ? "Realtime connected" : "Realtime reconnecting"}
          >
            {realtimeReady ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
            {realtimeReady ? "Live" : "Offline"}
          </span>

          <Link
            href="/projects"
            className="tb-yellow-button inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-bold"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">New</span>
          </Link>

          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => setShowNotifications((current) => !current)}
              className="relative inline-flex size-9 items-center justify-center rounded-lg border border-line bg-panel text-ink-soft transition hover:border-primary/40 hover:text-foreground"
            >
              <Bell className="size-4" aria-hidden="true" />
              {unread > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-black text-[#111111] shadow-sm">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </button>

            {showNotifications ? (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNotifications(false)}
                  aria-hidden="true"
                />
                <NotificationMenu
                  loading={loadingNotifications}
                  notifications={notifications}
                  unread={unread}
                  onMarkAllRead={onMarkAllRead}
                  onOpen={onOpenNotification}
                />
              </>
            ) : null}
          </div>

          <Link
            href="/settings"
            aria-label="Settings"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-panel text-ink-soft transition hover:border-primary/40 hover:text-foreground"
          >
            <Settings className="size-4" aria-hidden="true" />
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu((current) => !current)}
              className="flex h-9 items-center gap-2 rounded-lg border border-line bg-panel pl-1.5 pr-2 transition hover:border-primary/40"
              aria-label="User menu"
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-[#0f1117] text-[10px] font-extrabold text-white">
                {userInitials(user.firstName, user.lastName, user.email)}
              </span>
              <span className="hidden max-w-[96px] truncate text-[12px] font-semibold text-foreground sm:block">
                {displayName}
              </span>
              <ChevronDown
                className={cn(
                  "size-3 text-ink-soft transition-transform duration-150",
                  showUserMenu && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>

            {showUserMenu ? (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                  aria-hidden="true"
                />
                <UserMenu
                  name={displayName}
                  email={user.email}
                  role={roleLabel(user)}
                  initials={userInitials(user.firstName, user.lastName, user.email)}
                  onClose={() => setShowUserMenu(false)}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function CommandSearchMenu({
  category,
  loading,
  onCategoryChange,
  onClose,
  query,
  results,
}: {
  category: SearchCategory;
  loading: boolean;
  onCategoryChange: (category: SearchCategory) => void;
  onClose: () => void;
  query: string;
  results: GlobalSearchResult[];
}) {
  const showPrompt = query.trim().length < 2;

  return (
    <section className="absolute left-0 top-[calc(100%+8px)] z-20 w-[min(720px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_30px_90px_rgba(17,17,17,0.22)]">
      <div className="border-b border-line bg-background px-3 py-2">
        <div className="flex gap-1 overflow-x-auto tb-scrollbar">
          {searchCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onCategoryChange(item.id)}
              className={cn(
                "h-8 rounded-xl px-3 text-[11px] font-black transition",
                category === item.id ? "bg-[#111111] text-white" : "text-ink-soft hover:bg-panel-muted hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[460px] overflow-y-auto p-2 tb-scrollbar">
        {showPrompt ? (
          <div className="grid min-h-[220px] place-items-center rounded-xl border border-dashed border-line bg-background px-6 py-10 text-center">
            <div>
              <Hash className="mx-auto size-8 text-primary-dark" />
              <p className="mt-3 text-sm font-black text-foreground">Search the workspace</p>
              <p className="mt-1 text-xs font-semibold text-ink-soft">Type at least two characters to find tasks, files, people, messages, and projects.</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex min-h-[220px] items-center justify-center gap-2 text-sm font-black text-ink-soft">
            <Loader2 className="size-4 animate-spin" />
            Searching workspace
          </div>
        ) : results.length ? (
          <div className="grid gap-1.5">
            {results.map((result) => (
              <SearchResultRow key={`${result.type}-${result.id}`} result={result} onClose={onClose} />
            ))}
          </div>
        ) : (
          <div className="grid min-h-[220px] place-items-center rounded-xl border border-dashed border-line bg-background px-6 py-10 text-center">
            <div>
              <Search className="mx-auto size-8 text-ink-soft" />
              <p className="mt-3 text-sm font-black text-foreground">No matching records</p>
              <p className="mt-1 text-xs font-semibold text-ink-soft">Try a broader term or switch result type.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SearchResultRow({ onClose, result }: { onClose: () => void; result: GlobalSearchResult }) {
  const Icon = searchIcons[result.type];
  const external = Boolean(result.metadata?.external) || /^https?:\/\//i.test(result.url);
  const content = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-[#111111]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-black text-foreground">{result.title}</span>
          <span className="shrink-0 rounded-lg border border-line bg-background px-1.5 py-0.5 text-[9px] font-black text-ink-soft">
            {result.type}
          </span>
        </span>
        {result.subtitle ? (
          <span className="mt-0.5 block truncate text-xs font-semibold text-ink-soft">{result.subtitle}</span>
        ) : null}
      </span>
      {external ? <ExternalLink className="size-4 shrink-0 text-ink-soft" aria-hidden="true" /> : null}
    </>
  );

  const className = "flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-primary/40 hover:bg-primary/10";

  if (external) {
    return (
      <a href={result.url} target="_blank" rel="noreferrer" onClick={onClose} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={result.url} onClick={onClose} className={className}>
      {content}
    </Link>
  );
}

function NotificationMenu({
  loading,
  notifications,
  onMarkAllRead,
  onOpen,
  unread,
}: {
  loading: boolean;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onOpen: (notification: Notification) => void;
  unread: number;
}) {
  return (
    <section className="absolute right-0 top-[calc(100%+8px)] z-20 w-[360px] overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_28px_86px_rgba(17,17,17,0.18)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="text-[13px] font-black text-foreground">Notifications</p>
          <p className="text-[11px] text-ink-soft">{unread} unread</p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unread === 0}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-background px-2.5 text-[11px] font-bold text-foreground transition hover:bg-panel-muted disabled:opacity-45"
        >
          <CheckCheck className="size-3.5" />
          Mark all
        </button>
      </div>

      <div className="max-h-[390px] overflow-y-auto tb-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[12px] font-bold text-ink-soft">
            <Loader2 className="size-4 animate-spin" />
            Loading notifications
          </div>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <NotificationPreview
              key={notification.id}
              notification={notification}
              onOpen={() => onOpen(notification)}
            />
          ))
        ) : (
          <div className="px-4 py-10 text-center">
            <Bell className="mx-auto size-6 text-line" />
            <p className="mt-2 text-[13px] font-bold text-ink-soft">No notifications yet</p>
          </div>
        )}
      </div>

      <Link
        href="/notifications"
        className="flex h-11 items-center justify-center border-t border-line text-[12px] font-black text-foreground transition hover:bg-panel-muted"
      >
        Open notification center
      </Link>
    </section>
  );
}

function NotificationPreview({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: () => void;
}) {
  const unread = !notification.readAt;
  const href = notificationHref(notification);

  return (
    <Link
      href={href}
      onClick={onOpen}
      className="flex gap-3 border-b border-line/70 px-4 py-3 transition last:border-b-0 hover:bg-panel-muted/70"
    >
      <span
        className={cn(
          "mt-1 size-2 shrink-0 rounded-full",
          unread ? "bg-primary" : "bg-line",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-black text-foreground">{notification.title}</span>
        {notification.body ? (
          <span className="mt-1 line-clamp-2 block text-[11px] leading-relaxed text-ink-soft">
            {notification.body}
          </span>
        ) : null}
        <span className="mt-1 block text-[10px] font-bold text-ink-soft/65">
          {timeAgo(notification.createdAt)}
        </span>
      </span>
    </Link>
  );
}

function UserMenu({
  name,
  email,
  role,
  initials,
  onClose,
}: {
  name: string;
  email: string;
  role: string;
  initials: string;
  onClose: () => void;
}) {
  const { logout } = useWorkspaceAuth();

  return (
    <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[220px] overflow-hidden rounded-xl border border-line bg-panel shadow-xl">
      <div className="flex items-center gap-3 border-b border-line px-3 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0f1117] text-[11px] font-extrabold text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold text-foreground">{name}</p>
          <p className="truncate text-[10px] text-ink-soft">{email}</p>
          <span className="mt-0.5 inline-block rounded bg-primary/15 px-1.5 py-px text-[10px] font-bold text-primary-dark">
            {role}
          </span>
        </div>
      </div>

      <div className="p-1">
        <MenuItem href="/settings" label="Profile and settings" onClick={onClose} />
        <MenuItem href="/team" label="Team" onClick={onClose} />
        <div className="my-1 h-px bg-line" />
        <button
          type="button"
          onClick={() => {
            onClose();
            logout();
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-danger transition hover:bg-red-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function MenuItem({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground transition hover:bg-panel-muted"
    >
      {label}
    </Link>
  );
}

function notificationHref(notification: Notification) {
  const data = notification.data ?? {};
  if (typeof data.conversationId === "string") return `/messages?conversation=${data.conversationId}`;
  if (typeof data.taskId === "string" && typeof data.projectId === "string") {
    return `/projects/${data.projectId}?task=${data.taskId}`;
  }
  return "/notifications";
}

function timeAgo(value: string) {
  const then = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}
