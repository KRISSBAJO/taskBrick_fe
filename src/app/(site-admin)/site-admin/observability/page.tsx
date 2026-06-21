"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  RadioTower,
  RefreshCw,
  ServerCog,
  ShieldAlert,
  Timer,
  Wifi,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { getSiteObservabilityOverview, type SecurityEvent, type SiteObservabilityOverview } from "@/lib/api";
import {
  EmptyState,
  MetricCard,
  OpsPanel,
  StatusBadge,
  countFrom,
  formatDate,
  formatNumber,
  textField,
} from "../_components/site-admin-ops-ui";

const emptyOverview: SiteObservabilityOverview = {
  live: { status: "unknown" },
  ready: {
    status: "unknown",
    database: { status: "unknown", latencyMs: 0 },
    realtime: {
      namespace: "/",
      status: "unknown",
      connections: 0,
      rooms: { total: 0, tenant: 0, user: 0, conversation: 0, task: 0, memberships: 0 },
      tenants: {},
      authMethods: {},
    },
  },
  api: { errors: {}, errorRateSignals: 0, recentRequests: [], slowEndpoints: [] },
  queues: { workflows: {}, webhooks: {}, compliance: {}, metrics: {} },
  workers: {},
  sessions: { active: 0 },
  securityEvents: { open: 0, recentApiSecurityEvents: [] },
};

export default function SiteAdminObservabilityPage() {
  const { auth } = useWorkspaceAuth();
  const [overview, setOverview] = useState<SiteObservabilityOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(await getSiteObservabilityOverview(auth.accessToken));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load observability data.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const queueTotals = useMemo(() => {
    const workflowActive = countFrom(overview.queues.workflows, ["PENDING", "RUNNING", "QUEUED"]);
    const webhookBacklog = countFrom(overview.queues.webhooks, ["PENDING", "FAILED"]);
    const complianceOpen = countFrom(overview.queues.compliance, ["REQUESTED", "APPROVED", "QUEUED", "RUNNING"]);
    return { workflowActive, webhookBacklog, complianceOpen };
  }, [overview]);

  const dbHealthy = overview.ready.database.latencyMs < 500;
  const readyHealthy = overview.ready.status.toLowerCase() === "ok";

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "#05966918" }}>
            <Activity className="size-4" style={{ color: "#059669" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Observability</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">{overview.live.status.toUpperCase()} · {overview.ready.database.latencyMs}ms DB · {overview.api.errorRateSignals} API errors</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={CheckCircle2} label="Live" value={overview.live.status.toUpperCase()} subtext={overview.live.environment ?? "runtime"} tone={overview.live.status === "ok" ? "#047857" : "#d89b00"} />
        <MetricCard icon={Gauge} label="Ready" value={overview.ready.status.toUpperCase()} subtext={readyHealthy ? "checks passing" : "review required"} tone={readyHealthy ? "#047857" : "#dc2626"} />
        <MetricCard icon={Database} label="DB latency" value={`${overview.ready.database.latencyMs}ms`} subtext={overview.ready.database.status} tone={dbHealthy ? "#047857" : "#dc2626"} />
        <MetricCard icon={RadioTower} label="Realtime" value={overview.ready.realtime.connections} subtext={`${overview.ready.realtime.rooms.total} rooms`} tone="#2563eb" />
        <MetricCard icon={AlertTriangle} label="API errors" value={overview.api.errorRateSignals} subtext="captured signals" tone={overview.api.errorRateSignals ? "#dc2626" : "#047857"} />
        <MetricCard icon={Wifi} label="Sessions" value={overview.sessions.active} subtext="active now" tone="#6d5dd3" />
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <OpsPanel accent="#047857" eyebrow="Health endpoints" title="Live, ready, realtime, and database">
          <div className="grid gap-3 md:grid-cols-2">
            <HealthTile label="/health/live" status={overview.live.status} detail={`Uptime ${formatNumber(Math.round(overview.live.uptimeSeconds ?? 0))}s`} icon={<Activity className="size-4" />} />
            <HealthTile label="/health/ready" status={overview.ready.status} detail={`Service ${overview.live.service ?? "taskbricks"}`} icon={<Gauge className="size-4" />} />
            <HealthTile label="PostgreSQL" status={overview.ready.database.status} detail={`${overview.ready.database.latencyMs}ms latency`} icon={<Database className="size-4" />} />
            <HealthTile label="Realtime gateway" status={overview.ready.realtime.status} detail={`${overview.ready.realtime.namespace} namespace`} icon={<RadioTower className="size-4" />} />
          </div>
          <div className="mt-4 rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">Realtime room shape</p>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
              <MiniStat label="Tenant" value={overview.ready.realtime.rooms.tenant} />
              <MiniStat label="User" value={overview.ready.realtime.rooms.user} />
              <MiniStat label="Conversation" value={overview.ready.realtime.rooms.conversation} />
              <MiniStat label="Task" value={overview.ready.realtime.rooms.task} />
              <MiniStat label="Memberships" value={overview.ready.realtime.rooms.memberships} />
            </div>
          </div>
        </OpsPanel>

        <OpsPanel accent="#d89b00" eyebrow="Queue and worker posture" title="Background execution health">
          <div className="space-y-3">
            <QueueLine label="Workflow runtime" active={queueTotals.workflowActive} counts={overview.queues.workflows} />
            <QueueLine label="Webhook deliveries" active={queueTotals.webhookBacklog} counts={overview.queues.webhooks} />
            <QueueLine label="Compliance jobs" active={queueTotals.complianceOpen} counts={overview.queues.compliance} />
          </div>
          <div className="mt-4 grid gap-2">
            {Object.entries(overview.workers).map(([name, status]) => (
              <div key={name} className="flex items-center justify-between rounded-2xl bg-[#fbfaf6] px-3 py-3" style={{ border: "1px solid #e7dfcf" }}>
                <div className="flex items-center gap-2">
                  <ServerCog className="size-4 text-[#2563eb]" aria-hidden="true" />
                  <p className="text-[12px] font-black text-[#111111]">{humanize(name)}</p>
                </div>
                <StatusBadge value={status} />
              </div>
            ))}
          </div>
        </OpsPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <OpsPanel accent="#2563eb" eyebrow="API throughput" title="Recent request telemetry">
          {loading ? (
            <EmptyState text="Loading request telemetry..." />
          ) : overview.api.recentRequests.length === 0 ? (
            <EmptyState text="No recent API request samples returned." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">
                  <tr>
                    <th className="px-3 py-2">Endpoint</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Latency</th>
                    <th className="px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee8dc]">
                  {overview.api.recentRequests.slice(0, 12).map((request, index) => (
                    <RequestRow key={`${textField(request, ["requestId", "id"], "request")}:${index}`} request={request} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </OpsPanel>

        <OpsPanel accent="#dc2626" eyebrow="Slow endpoint watchlist" title="Latency pressure">
          {overview.api.slowEndpoints.length === 0 ? (
            <EmptyState text="No endpoints crossed the 1000ms slow threshold." />
          ) : (
            <div className="space-y-2">
              {overview.api.slowEndpoints.map((request, index) => (
                <div key={`${textField(request, ["requestId", "path", "url"], "slow")}:${index}`} className="rounded-2xl bg-[#fbfaf6] p-3" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-black text-[#111111]">{textField(request, ["method"], "GET")} {textField(request, ["path", "url", "route"], "unknown endpoint")}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{textField(request, ["requestId", "tenantId", "userId"], "no request id")}</p>
                    </div>
                    <StatusBadge value={`${textField(request, ["durationMs"], "0")}ms`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </OpsPanel>
      </div>

      <OpsPanel accent="#f87171" eyebrow="API security signals" title="Recent platform security events">
        <SecurityEventList events={overview.securityEvents.recentApiSecurityEvents} loading={loading} />
      </OpsPanel>
    </div>
  );
}

function HealthTile({ detail, icon, label, status }: { detail: string; icon: ReactNode; label: string; status: string }) {
  const healthy = ["ok", "up", "connected"].includes(status.toLowerCase());
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-center justify-between gap-3">
        <div className={healthy ? "text-emerald-600" : "text-amber-600"}>{icon}</div>
        <StatusBadge value={status} />
      </div>
      <p className="mt-4 text-sm font-black text-[#111111]">{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{detail}</p>
    </div>
  );
}

function QueueLine({ active, counts, label }: { active: number; counts: Record<string, number>; label: string }) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-3" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-black text-[#111111]">{label}</p>
          <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{formatNumber(total)} total records</p>
        </div>
        <StatusBadge value={active ? `${active} active` : "clear"} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(counts).length === 0 ? <span className="text-[11px] font-bold text-[#8a8375]">No queue records</span> : null}
        {Object.entries(counts).map(([status, count]) => <StatusBadge key={status} value={`${status} ${count}`} />)}
      </div>
    </div>
  );
}

function RequestRow({ request }: { request: Record<string, unknown> }) {
  const endpoint = `${textField(request, ["method"], "GET")} ${textField(request, ["path", "url", "route"], "unknown endpoint")}`;
  const status = textField(request, ["statusCode", "status"], "n/a");
  return (
    <tr className="transition hover:bg-[#fffdf2]">
      <td className="max-w-[520px] px-3 py-3">
        <p className="truncate text-[12px] font-black text-[#111111]">{endpoint}</p>
        <p className="mt-1 truncate text-[11px] font-semibold text-[#766f63]">{textField(request, ["requestId", "tenantId", "userId"], "metadata unavailable")}</p>
      </td>
      <td className="px-3 py-3"><StatusBadge value={status} /></td>
      <td className="px-3 py-3 text-[12px] font-black text-[#111111]"><Timer className="mr-1 inline size-3.5 text-[#d89b00]" />{textField(request, ["durationMs"], "0")}ms</td>
      <td className="px-3 py-3 text-[12px] font-semibold text-[#766f63]"><Clock3 className="mr-1 inline size-3.5" />{formatDate(textField(request, ["createdAt", "timestamp", "time"], ""))}</td>
    </tr>
  );
}

function SecurityEventList({ events, loading }: { events: SecurityEvent[]; loading: boolean }) {
  if (loading) return <EmptyState text="Loading security signals..." />;
  if (events.length === 0) return <EmptyState text="No API security events in the current observation window." />;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {events.map((event) => (
        <div key={event.id} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-[#111111]">{event.type}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{event.tenant?.name ?? "Platform"} - {formatDate(event.createdAt)}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <StatusBadge value={event.severity} />
              <StatusBadge value={event.status} />
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-[11px] font-semibold text-[#766f63]">
            <ShieldAlert className="mr-1 inline size-3.5 text-red-500" />
            {event.source ?? event.subjectType ?? event.requestId ?? "No additional source metadata"}
          </p>
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2" style={{ border: "1px solid #ded8c8" }}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8375]">{label}</p>
      <p className="mt-1 text-lg font-black text-[#111111]">{formatNumber(value)}</p>
    </div>
  );
}

function humanize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
