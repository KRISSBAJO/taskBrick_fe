"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  CircleDot,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRealtime } from "@/components/realtime-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  deleteNotification,
  deleteReadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  type Notification,
  type NotificationChannel,
} from "@/lib/api";
import { cn } from "@/lib/cn";

type NotificationFilter = "ALL" | "UNREAD";

const channels: Array<"ALL" | NotificationChannel> = ["ALL", "IN_APP", "EMAIL", "SMS", "PUSH", "WEBHOOK"];

export default function NotificationsPage() {
  const { auth } = useWorkspaceAuth();
  const { notificationVersion } = useRealtime();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const [channel, setChannel] = useState<"ALL" | NotificationChannel>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDeleteRead, setConfirmDeleteRead] = useState(false);

  const selected = notifications.find((notification) => notification.id === selectedId) ?? notifications[0] ?? null;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await listNotifications(auth.accessToken, {
        limit: 80,
        search: search.trim() || undefined,
        unreadOnly: filter === "UNREAD",
        channel: channel === "ALL" ? undefined : channel,
      });
      setNotifications(page.data);
      setSelectedId((current) => (page.data.some((item) => item.id === current) ? current : page.data[0]?.id ?? ""));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, channel, filter, search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadNotifications();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [loadNotifications, notificationVersion]);

  const stats = useMemo(() => {
    const unread = notifications.filter((notification) => !notification.readAt).length;
    const critical = notifications.filter((notification) => {
      const data = notification.data ?? {};
      return data.priority === "CRITICAL" || data.severity === "CRITICAL";
    }).length;

    return {
      total: notifications.length,
      unread,
      critical,
      inApp: notifications.filter((notification) => notification.channel === "IN_APP").length,
    };
  }, [notifications]);

  async function onToggleRead(notification: Notification) {
    setBusy(true);
    try {
      const updated = notification.readAt
        ? await markNotificationUnread(auth.accessToken, notification.id)
        : await markNotificationRead(auth.accessToken, notification.id);
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? updated : item)),
      );
      toast({
        title: notification.readAt ? "Marked unread" : "Marked read",
        variant: "success",
      });
    } catch (caught) {
      toast({
        title: "Notification update failed",
        description: caught instanceof Error ? caught.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onMarkAllRead() {
    setBusy(true);
    try {
      const result = await markAllNotificationsRead(auth.accessToken);
      setNotifications((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
      );
      toast({
        title: "Inbox updated",
        description: `${result.updated} notification${result.updated === 1 ? "" : "s"} marked as read.`,
        variant: "success",
      });
    } catch (caught) {
      toast({
        title: "Unable to mark all read",
        description: caught instanceof Error ? caught.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(notification: Notification) {
    setBusy(true);
    try {
      await deleteNotification(auth.accessToken, notification.id);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      setSelectedId((current) => (current === notification.id ? "" : current));
      toast({ title: "Notification deleted", variant: "success" });
    } catch (caught) {
      toast({
        title: "Delete failed",
        description: caught instanceof Error ? caught.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteRead() {
    setBusy(true);
    try {
      const result = await deleteReadNotifications(auth.accessToken);
      setConfirmDeleteRead(false);
      setNotifications((current) => current.filter((item) => !item.readAt));
      toast({
        title: "Read notifications removed",
        description: `${result.deleted} notification${result.deleted === 1 ? "" : "s"} deleted.`,
        variant: "success",
      });
    } catch (caught) {
      toast({
        title: "Cleanup failed",
        description: caught instanceof Error ? caught.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100dvh-7rem)] gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="flex min-w-0 flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
          <div className="tb-dashboard-hero px-5 py-5">
            <div className="flex flex-wrap items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-[#111111] shadow-[0_18px_44px_rgba(255,212,0,0.26)]">
                <Bell className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Notification center</p>
                <h1 className="mt-1 text-2xl font-black text-white">Signals that need action</h1>
                <p className="mt-1 max-w-2xl text-sm text-white/60">
                  Real in-app notifications from messages, tasks, workflow events, and system activity.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Total" value={stats.total} />
                <Stat label="Unread" value={stats.unread} tone="yellow" />
                <Stat label="Critical" value={stats.critical} tone="red" />
                <Stat label="In app" value={stats.inApp} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notification title or body"
                className="h-9 w-full rounded-xl border border-line bg-background pl-9 pr-3 text-[13px] text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none"
              />
            </div>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as NotificationFilter)}
              className="h-9 rounded-xl border border-line bg-background px-3 text-[13px] font-bold text-foreground transition focus:border-primary focus:outline-none"
            >
              <option value="ALL">All notifications</option>
              <option value="UNREAD">Unread only</option>
            </select>
            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value as "ALL" | NotificationChannel)}
              className="h-9 rounded-xl border border-line bg-background px-3 text-[13px] font-bold text-foreground transition focus:border-primary focus:outline-none"
            >
              {channels.map((item) => (
                <option key={item} value={item}>{item === "ALL" ? "All channels" : item.replace("_", " ")}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void loadNotifications()}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-background px-3 text-[13px] font-bold text-foreground transition hover:bg-panel-muted"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={busy || stats.unread === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-3 text-[13px] font-black text-white transition hover:bg-[#252525] disabled:opacity-45"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteRead(true)}
              disabled={busy || notifications.every((item) => !item.readAt)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-[13px] font-black text-red-700 transition hover:bg-red-100 disabled:opacity-45"
            >
              <Trash2 className="size-3.5" />
              Delete read
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="min-h-[520px] overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
          {loading ? (
            <div className="flex min-h-[520px] items-center justify-center gap-2 text-sm font-bold text-ink-soft">
              <Loader2 className="size-4 animate-spin" />
              Loading notifications
            </div>
          ) : notifications.length ? (
            <div className="divide-y divide-line">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  active={selected?.id === notification.id}
                  disabled={busy}
                  notification={notification}
                  onDelete={() => onDelete(notification)}
                  onSelect={() => setSelectedId(notification.id)}
                  onToggleRead={() => onToggleRead(notification)}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      <aside className="min-w-0">
        <NotificationDetail
          busy={busy}
          notification={selected}
          onDelete={selected ? () => onDelete(selected) : undefined}
          onToggleRead={selected ? () => onToggleRead(selected) : undefined}
        />
      </aside>

      <ConfirmDialog
        open={confirmDeleteRead}
        title="Delete all read notifications?"
        description="This removes every notification you have already read. Unread notifications stay in the inbox."
        confirmLabel="Delete read"
        busy={busy}
        onClose={() => setConfirmDeleteRead(false)}
        onConfirm={onDeleteRead}
      />
    </div>
  );
}

function Stat({ label, tone, value }: { label: string; tone?: "yellow" | "red"; value: number }) {
  return (
    <div className="min-w-[82px] rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-center">
      <p className={cn(
        "text-xl font-black leading-none text-white",
        tone === "yellow" && "text-primary",
        tone === "red" && "text-red-300",
      )}>
        {value}
      </p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-white/35">{label}</p>
    </div>
  );
}

function NotificationRow({
  active,
  disabled,
  notification,
  onDelete,
  onSelect,
  onToggleRead,
}: {
  active: boolean;
  disabled: boolean;
  notification: Notification;
  onDelete: () => void;
  onSelect: () => void;
  onToggleRead: () => void;
}) {
  const unread = !notification.readAt;

  return (
    <article
      className={cn(
        "group flex items-start gap-3 px-4 py-3 transition",
        active ? "bg-primary/10" : "hover:bg-panel-muted/70",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <span
          className={cn(
            "mt-1.5 size-2.5 shrink-0 rounded-full",
            unread ? "bg-primary shadow-[0_0_0_4px_rgba(255,212,0,0.18)]" : "bg-line",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-black text-foreground">{notification.title}</span>
            <span className="rounded-md bg-panel-muted px-1.5 py-0.5 text-[9px] font-black text-ink-soft">
              {notification.channel.replace("_", " ")}
            </span>
          </span>
          {notification.body ? (
            <span className="mt-1 line-clamp-2 block text-[12px] leading-relaxed text-ink-soft">
              {notification.body}
            </span>
          ) : null}
          <span className="mt-1 block text-[10px] font-bold text-ink-soft/60">
            {formatDateTime(notification.createdAt)}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onToggleRead}
          disabled={disabled}
          className="inline-flex h-8 items-center rounded-lg border border-line bg-panel px-2 text-[11px] font-bold text-foreground transition hover:bg-panel-muted disabled:opacity-50"
        >
          {unread ? "Read" : "Unread"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          aria-label="Delete notification"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </article>
  );
}

function NotificationDetail({
  busy,
  notification,
  onDelete,
  onToggleRead,
}: {
  busy: boolean;
  notification: Notification | null;
  onDelete?: () => void;
  onToggleRead?: () => void;
}) {
  if (!notification) {
    return (
      <div className="sticky top-[76px] rounded-2xl border border-dashed border-line bg-panel p-8 text-center">
        <Inbox className="mx-auto size-8 text-line" />
        <p className="mt-3 text-sm font-black text-foreground">No notification selected</p>
        <p className="mt-1 text-sm text-ink-soft">Select a notification to inspect delivery and payload details.</p>
      </div>
    );
  }

  return (
    <section className="sticky top-[76px] overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="border-b border-line p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-primary">
            <Bell className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-soft">
              {notification.channel.replace("_", " ")}
            </p>
            <h2 className="mt-1 text-lg font-black leading-tight text-foreground">{notification.title}</h2>
            <p className="mt-1 text-[11px] font-bold text-ink-soft">{formatDateTime(notification.createdAt)}</p>
          </div>
        </div>
        {notification.body ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{notification.body}</p>
        ) : null}
        <div className="mt-4 flex gap-2">
          {onToggleRead ? (
            <button
              type="button"
              onClick={onToggleRead}
              disabled={busy}
              className="h-9 rounded-xl border border-line bg-background px-3 text-[12px] font-black text-foreground transition hover:bg-panel-muted disabled:opacity-50"
            >
              {notification.readAt ? "Mark unread" : "Mark read"}
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="h-9 rounded-xl border border-red-200 bg-red-50 px-3 text-[12px] font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <MetaBlock label="Read state" value={notification.readAt ? `Read ${formatDateTime(notification.readAt)}` : "Unread"} />
        <MetaBlock label="Template" value={notification.template?.name ?? "Ad hoc notification"} />
        <MetaBlock label="Notification ID" value={notification.id} mono />
        {notification.deliveries?.length ? (
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">Deliveries</p>
            <div className="mt-2 grid gap-2">
              {notification.deliveries.map((delivery) => (
                <div key={delivery.id} className="rounded-xl border border-line bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-black text-foreground">{delivery.channel}</p>
                    <span className="rounded-md bg-panel-muted px-1.5 py-0.5 text-[9px] font-black text-ink-soft">
                      {delivery.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-soft">Attempts: {delivery.attempts}</p>
                  {delivery.lastError ? <p className="mt-1 text-[11px] text-red-600">{delivery.lastError}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {notification.data ? (
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">Payload</p>
            <pre className="mt-2 max-h-[240px] overflow-auto rounded-xl border border-line bg-[#111111] p-3 text-[11px] leading-relaxed text-white tb-scrollbar">
              {JSON.stringify(notification.data, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MetaBlock({ label, mono, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-background p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">{label}</p>
      <p className={cn("mt-1 break-words text-[12px] font-bold text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center p-8 text-center">
      <div>
        <CircleDot className="mx-auto size-8 text-line" />
        <h2 className="mt-3 text-sm font-black text-foreground">No notifications match this view</h2>
        <p className="mt-1 text-sm text-ink-soft">Adjust filters or wait for the next workspace event.</p>
      </div>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
