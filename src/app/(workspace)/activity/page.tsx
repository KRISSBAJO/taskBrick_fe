"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CircleDot,
  Database,
  FileClock,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { listAuditLogs, listUsers, type AuditLog, type TenantUser } from "@/lib/api";
import { cn } from "@/lib/cn";

const entityTypes = ["ALL", "Task", "Project", "Conversation", "Message", "Team", "User", "Notification"];
const quickActions = ["ALL", "task.update", "message.create", "project.update", "conversation.create", "team.member_add"];

export default function ActivityPage() {
  const { auth } = useWorkspaceAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });

  const selected = logs.find((log) => log.id === selectedId) ?? logs[0] ?? null;
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const auditPage = await listAuditLogs(auth.accessToken, {
        limit: 50,
        search: search.trim() || undefined,
        entityType: entityType === "ALL" ? undefined : entityType,
        action: action === "ALL" ? undefined : action,
      });
      setLogs(auditPage.data);
      setMeta(auditPage.meta);
      setSelectedId((current) => (auditPage.data.some((log) => log.id === current) ? current : auditPage.data[0]?.id ?? ""));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to load audit activity.";
      setError(message);
      toast({
        title: "Activity unavailable",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [action, auth.accessToken, entityType, search, toast]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadActivity();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [loadActivity]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      listUsers(auth.accessToken, { limit: 100 })
        .then((page) => setUsers(page.data))
        .catch(() => setUsers([]));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [auth.accessToken]);

  const stats = useMemo(() => {
    const byEntity = new Set(logs.map((log) => log.entityType)).size;
    const actors = new Set(logs.map((log) => log.actorId).filter(Boolean)).size;
    const writes = logs.filter((log) => /create|update|delete|remove|add|revoke|start|complete/i.test(log.action)).length;

    return {
      visible: logs.length,
      total: meta.total,
      entityTypes: byEntity,
      actors,
      writes,
    };
  }, [logs, meta.total]);

  return (
    <div className="grid min-h-[calc(100dvh-7rem)] gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
      <section className="flex min-w-0 flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
          <div className="tb-dashboard-hero px-5 py-5">
            <div className="flex flex-wrap items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-[#111111] shadow-[0_18px_44px_rgba(255,212,0,0.26)]">
                <Activity className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Audit activity</p>
                <h1 className="mt-1 text-2xl font-black text-white">Workspace event trail</h1>
                <p className="mt-1 max-w-2xl text-sm text-white/60">
                  Immutable tenant activity across projects, tasks, chat, teams, notifications, and admin actions.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Visible" value={stats.visible} />
                <Stat label="Total" value={stats.total} tone="yellow" />
                <Stat label="Entities" value={stats.entityTypes} />
                <Stat label="Actors" value={stats.actors} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <div className="relative min-w-[230px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search action, entity, id, or IP"
                className="h-9 w-full rounded-xl border border-line bg-background pl-9 pr-3 text-[13px] text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none"
              />
            </div>
            <select
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              className="h-9 rounded-xl border border-line bg-background px-3 text-[13px] font-bold text-foreground transition focus:border-primary focus:outline-none"
            >
              {entityTypes.map((item) => (
                <option key={item} value={item}>{item === "ALL" ? "All entities" : item}</option>
              ))}
            </select>
            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="h-9 rounded-xl border border-line bg-background px-3 text-[13px] font-bold text-foreground transition focus:border-primary focus:outline-none"
            >
              {quickActions.map((item) => (
                <option key={item} value={item}>{item === "ALL" ? "All actions" : item}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void loadActivity()}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-background px-3 text-[13px] font-bold text-foreground transition hover:bg-panel-muted"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            {error}
          </div>
        ) : null}

        <div className="min-h-[540px] overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
          {loading ? (
            <div className="flex min-h-[540px] items-center justify-center gap-2 text-sm font-bold text-ink-soft">
              <Loader2 className="size-4 animate-spin" />
              Loading activity
            </div>
          ) : logs.length ? (
            <div className="divide-y divide-line">
              {logs.map((log) => (
                <AuditRow
                  key={log.id}
                  active={selected?.id === log.id}
                  actor={log.actorId ? usersById.get(log.actorId) : undefined}
                  log={log}
                  onSelect={() => setSelectedId(log.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      <aside className="min-w-0">
        <AuditDetail actor={selected?.actorId ? usersById.get(selected.actorId) : undefined} log={selected} />
      </aside>
    </div>
  );
}

function Stat({ label, tone, value }: { label: string; tone?: "yellow"; value: number }) {
  return (
    <div className="min-w-[82px] rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-center">
      <p className={cn("text-xl font-black leading-none text-white", tone === "yellow" && "text-primary")}>
        {value}
      </p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-white/35">{label}</p>
    </div>
  );
}

function AuditRow({
  active,
  actor,
  log,
  onSelect,
}: {
  active: boolean;
  actor?: TenantUser;
  log: AuditLog;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition",
        active ? "bg-primary/10" : "hover:bg-panel-muted/70",
      )}
    >
      <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-primary">
        <FileClock className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-foreground">{humanAction(log.action)}</span>
          <span className="rounded-md bg-panel-muted px-1.5 py-0.5 text-[9px] font-black text-ink-soft">
            {log.entityType}
          </span>
        </span>
        <span className="mt-1 block truncate text-[12px] text-ink-soft">
          {actor ? displayName(actor) : log.actorId ?? "System"} updated {log.entityId ?? "tenant scope"}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold text-ink-soft/60">
          <span>{formatDateTime(log.createdAt)}</span>
          {log.ipAddress ? <span>{log.ipAddress}</span> : null}
        </span>
      </span>
    </button>
  );
}

function AuditDetail({ actor, log }: { actor?: TenantUser; log: AuditLog | null }) {
  if (!log) {
    return (
      <div className="sticky top-[76px] rounded-2xl border border-dashed border-line bg-panel p-8 text-center">
        <CircleDot className="mx-auto size-8 text-line" />
        <p className="mt-3 text-sm font-black text-foreground">No activity selected</p>
        <p className="mt-1 text-sm text-ink-soft">Select an event to inspect audit metadata.</p>
      </div>
    );
  }

  return (
    <section className="sticky top-[76px] overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="border-b border-line p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-soft">Audit event</p>
            <h2 className="mt-1 text-lg font-black leading-tight text-foreground">{humanAction(log.action)}</h2>
            <p className="mt-1 text-[11px] font-bold text-ink-soft">{formatDateTime(log.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <MetaBlock icon={<UserRound className="size-4" />} label="Actor" value={actor ? `${displayName(actor)} (${actor.email})` : log.actorId ?? "System"} />
        <MetaBlock icon={<Database className="size-4" />} label="Entity" value={`${log.entityType}${log.entityId ? ` / ${log.entityId}` : ""}`} mono />
        <MetaBlock icon={<Filter className="size-4" />} label="Action" value={log.action} mono />
        <MetaBlock label="IP address" value={log.ipAddress ?? "Not captured"} />
        <MetaBlock label="User agent" value={log.userAgent ?? "Not captured"} />

        <Payload title="Before" value={log.oldValue} />
        <Payload title="After" value={log.newValue} />
      </div>
    </section>
  );
}

function MetaBlock({
  icon,
  label,
  mono,
  value,
}: {
  icon?: ReactNode;
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-background p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">
        {icon}
        {label}
      </p>
      <p className={cn("mt-1 break-words text-[12px] font-bold text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function Payload({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">{title}</p>
      <pre className="mt-2 max-h-[230px] overflow-auto rounded-xl border border-line bg-[#111111] p-3 text-[11px] leading-relaxed text-white tb-scrollbar">
        {value === undefined || value === null ? "null" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[540px] items-center justify-center p-8 text-center">
      <div>
        <CircleDot className="mx-auto size-8 text-line" />
        <h2 className="mt-3 text-sm font-black text-foreground">No audit activity found</h2>
        <p className="mt-1 text-sm text-ink-soft">Try a broader action, entity, or search filter.</p>
      </div>
    </div>
  );
}

function displayName(user: { email: string; firstName?: string | null; lastName?: string | null }) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

function humanAction(action: string) {
  return action
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
