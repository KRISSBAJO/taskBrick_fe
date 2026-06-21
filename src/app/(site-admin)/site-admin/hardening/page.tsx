"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Database,
  FileCheck2,
  Fingerprint,
  Gauge,
  KeyRound,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { getSiteHardeningOverview, type PlatformAuditLog, type SiteHardeningOverview } from "@/lib/api";
import {
  EmptyState,
  MetricCard,
  OpsPanel,
  RowCard,
  StatusBadge,
  countFrom,
  formatDate,
  formatNumber,
} from "../_components/site-admin-ops-ui";

const emptyOverview: SiteHardeningOverview = {
  checks: {},
  data: {},
  qaMatrix: [],
  recentPlatformAudit: [],
};

type PlatformAuditRow = PlatformAuditLog & {
  actor?: (PlatformAuditLog["actor"] & { name?: string | null }) | null;
};

export default function SiteAdminHardeningPage() {
  const { auth } = useWorkspaceAuth();
  const [overview, setOverview] = useState<SiteHardeningOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(await getSiteHardeningOverview(auth.accessToken));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load hardening overview.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const metrics = useMemo(() => {
    const apiKeys = recordField(overview.data.apiKeys);
    const complianceJobs = recordField(overview.data.complianceJobs);
    return {
      platformAdmins: numberField(overview.data.platformAdmins),
      tenants: numberField(overview.data.tenants),
      users: numberField(overview.data.users),
      openSecurityEvents: numberField(overview.data.openSecurityEvents),
      activeApiKeys: countFrom(apiKeys, ["ACTIVE"]),
      openCompliance: countFrom(complianceJobs, ["REQUESTED", "APPROVED", "QUEUED", "RUNNING"]),
      failedRuntime: numberField(overview.data.failedWorkflowRuns) + numberField(overview.data.failedAiUsage) + numberField(overview.data.failedReportExecutions),
    };
  }, [overview.data]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "#04785718" }}>
            <ShieldCheck className="size-4" style={{ color: "#047857" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Site readiness</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">{metrics.openSecurityEvents} open events · {metrics.failedRuntime} runtime failures · {metrics.platformAdmins} admins</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={ShieldCheck} label="Platform admins" value={metrics.platformAdmins} subtext="active grants" tone="#047857" />
        <MetricCard icon={Database} label="Tenants" value={metrics.tenants} subtext="isolated scopes" tone="#6d5dd3" />
        <MetricCard icon={Users} label="Users" value={metrics.users} subtext="global identities" tone="#2563eb" />
        <MetricCard icon={ShieldAlert} label="Open events" value={metrics.openSecurityEvents} subtext="security review" tone={metrics.openSecurityEvents ? "#dc2626" : "#047857"} />
        <MetricCard icon={KeyRound} label="Active API keys" value={metrics.activeApiKeys} subtext="tenant credentials" tone="#d89b00" />
        <MetricCard icon={TriangleAlert} label="Runtime failures" value={metrics.failedRuntime} subtext="workflow + AI + reports" tone={metrics.failedRuntime ? "#dc2626" : "#047857"} />
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <OpsPanel accent="#047857" eyebrow="Security and runtime checks" title="Platform endpoint posture">
        {Object.keys(overview.checks).length === 0 ? (
          <EmptyState text="No security checks returned." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(overview.checks).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-2xl bg-[#fbfaf6] px-3 py-3" style={{ border: "1px solid #e7dfcf" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-[#047857]" aria-hidden="true" />
                  <p className="text-[12px] font-black text-[#111111]">{humanize(key)}</p>
                </div>
                <StatusBadge value={String(value)} />
              </div>
            ))}
          </div>
        )}
      </OpsPanel>

      <div className="grid gap-5 xl:grid-cols-2">
        <OpsPanel accent="#2563eb" eyebrow="QA matrix" title="Readiness evidence by area">
          {loading ? (
            <EmptyState text="Loading QA matrix..." />
          ) : overview.qaMatrix.length === 0 ? (
            <EmptyState text="No QA matrix data returned." />
          ) : (
            <div className="space-y-2">
              {overview.qaMatrix.map((row, index) => (
                <div key={index} className="rounded-2xl bg-[#fbfaf6] p-3" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <ListChecks className="size-3.5 shrink-0 text-[#2563eb]" aria-hidden="true" />
                        <p className="truncate text-[12px] font-black text-[#111111]">{row.area}</p>
                      </div>
                      <p className="mt-1 truncate pl-5 text-[11px] font-semibold text-[#766f63]">{row.evidence}</p>
                    </div>
                    <StatusBadge value={row.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </OpsPanel>

        <OpsPanel accent="#6d5dd3" eyebrow="Platform audit trail" title="Recent administrative actions">
          {loading ? (
            <EmptyState text="Loading audit trail..." />
          ) : overview.recentPlatformAudit.length === 0 ? (
            <EmptyState text="No recent platform audit events." />
          ) : (
            <div className="space-y-2">
              {overview.recentPlatformAudit.map((log: PlatformAuditRow) => (
                <RowCard key={log.id}>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-black text-[#111111]">{log.action}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#766f63]">
                      {log.actor ? (log.actor.name ?? log.actor.email ?? log.actorId ?? "System") : "System"} · {log.entityType}
                      {log.targetTenant ? ` · ${log.targetTenant.name}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    <StatusBadge value={formatDate(log.createdAt)} />
                    {log.ipAddress ? <StatusBadge value={log.ipAddress} /> : null}
                  </div>
                </RowCard>
              ))}
            </div>
          )}
        </OpsPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <OpsPanel accent="#d89b00" eyebrow="Platform data posture" title="Global resource summary">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(overview.data)
              .filter(([, v]) => typeof v === "number" || typeof v === "string")
              .map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-[#fbfaf6] p-3" style={{ border: "1px solid #e7dfcf" }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8375]">{humanize(key)}</p>
                  <p className="mt-1 text-lg font-black text-[#111111]">{formatNumber(numberField(value))}</p>
                </div>
              ))}
          </div>
        </OpsPanel>

        <OpsPanel accent="#dc2626" eyebrow="API key activity" title="Credential health">
          <div className="space-y-2">
            <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-[#d89b00]" aria-hidden="true" />
                <p className="text-[12px] font-black text-[#111111]">Active keys</p>
              </div>
              <p className="mt-2 text-2xl font-black text-[#111111]">{formatNumber(metrics.activeApiKeys)}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#766f63]">tenant credentials</p>
            </div>
            <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
              <div className="flex items-center gap-2">
                <Fingerprint className="size-4 text-[#6d5dd3]" aria-hidden="true" />
                <p className="text-[12px] font-black text-[#111111]">Open compliance</p>
              </div>
              <p className="mt-2 text-2xl font-black text-[#111111]">{formatNumber(metrics.openCompliance)}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#766f63]">active jobs</p>
            </div>
            <Link href="/site-admin/compliance" className="flex items-center justify-center rounded-2xl bg-[#fbfaf6] p-3 text-[12px] font-black text-[#6d5dd3] transition hover:bg-[#f0ebe0]" style={{ border: "1px solid #e7dfcf" }}>
              <FileCheck2 className="mr-2 size-3.5" />
              View compliance jobs
            </Link>
          </div>
        </OpsPanel>
      </div>

      <OpsPanel accent="#111111" eyebrow="Platform metrics" title="System health indicators">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={Gauge} label="Runtime failures" value={metrics.failedRuntime} tone={metrics.failedRuntime ? "#dc2626" : "#047857"} />
          <StatTile icon={Activity} label="Open security events" value={metrics.openSecurityEvents} tone={metrics.openSecurityEvents ? "#dc2626" : "#047857"} />
          <StatTile icon={Users} label="Total users" value={metrics.users} tone="#2563eb" />
          <StatTile icon={Database} label="Total tenants" value={metrics.tenants} tone="#6d5dd3" />
        </div>
      </OpsPanel>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <Icon className="size-4" style={{ color: tone }} aria-hidden="true" />
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8375]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#111111]">{formatNumber(value)}</p>
    </div>
  );
}

function humanize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase()).trim();
}

function numberField(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseInt(value, 10) || 0;
  return 0;
}

function recordField(value: unknown): Record<string, number> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, number>;
  }
  return {};
}
