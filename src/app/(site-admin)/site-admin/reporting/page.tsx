"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  RefreshCw,
  Timer,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  getSiteReportingOverview,
  listSiteDashboards,
  listSiteReportExecutions,
  listSiteReportExports,
  listSiteReports,
  type ReportExecutionStatus,
  type ReportExportStatus,
  type ReportStatus,
  type SiteDashboard,
  type SiteReport,
  type SiteReportExecution,
  type SiteReportExport,
  type SiteReportingOverview,
} from "@/lib/api";
import {
  EmptyState,
  FilterButton,
  MetricCard,
  OpsPanel,
  RowCard,
  SearchInput,
  StatusBadge,
  countFrom,
  formatDate,
  formatNumber,
} from "../_components/site-admin-ops-ui";

type View = "overview" | "dashboards" | "reports" | "executions" | "exports";

const VIEWS: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "dashboards", label: "Dashboards", icon: LayoutDashboard },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "executions", label: "Executions", icon: Timer },
  { id: "exports", label: "Exports", icon: Download },
];

const REPORT_STATUSES: Array<"ALL" | ReportStatus> = ["ALL", "ACTIVE", "DRAFT", "PAUSED", "ARCHIVED"];
const EXECUTION_STATUSES: Array<"ALL" | ReportExecutionStatus> = ["ALL", "FAILED", "RUNNING", "QUEUED", "COMPLETED", "CANCELLED"];
const EXPORT_STATUSES: Array<"ALL" | ReportExportStatus> = ["ALL", "FAILED", "PROCESSING", "QUEUED", "COMPLETED", "EXPIRED"];

const emptyOverview: SiteReportingOverview = {
  dashboards: {},
  reports: { byStatus: {}, byType: {} },
  executions: {},
  exports: {},
  tenantHealth: { projects: {}, tasks: {}, completedTasksLast30d: 0 },
  budget: { planned: 0, actual: 0 },
  velocity: [],
  recentExports: [],
  recentExecutions: [],
};

export default function SiteAdminReportingPage() {
  const { auth } = useWorkspaceAuth();
  const [overview, setOverview] = useState<SiteReportingOverview>(emptyOverview);
  const [dashboards, setDashboards] = useState<SiteDashboard[]>([]);
  const [reports, setReports] = useState<SiteReport[]>([]);
  const [executions, setExecutions] = useState<SiteReportExecution[]>([]);
  const [exports, setExports] = useState<SiteReportExport[]>([]);
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [reportStatus, setReportStatus] = useState<(typeof REPORT_STATUSES)[number]>("ACTIVE");
  const [executionStatus, setExecutionStatus] = useState<(typeof EXECUTION_STATUSES)[number]>("FAILED");
  const [exportStatus, setExportStatus] = useState<(typeof EXPORT_STATUSES)[number]>("COMPLETED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResult, dashboardsResult, reportsResult, executionsResult, exportsResult] = await Promise.all([
        getSiteReportingOverview(auth.accessToken),
        listSiteDashboards(auth.accessToken, { limit: 35, search: query || undefined }),
        listSiteReports(auth.accessToken, { limit: 35, search: query || undefined, status: reportStatus === "ALL" ? undefined : reportStatus }),
        listSiteReportExecutions(auth.accessToken, { limit: 35, search: query || undefined, status: executionStatus === "ALL" ? undefined : executionStatus }),
        listSiteReportExports(auth.accessToken, { limit: 35, search: query || undefined, status: exportStatus === "ALL" ? undefined : exportStatus }),
      ]);
      setOverview(overviewResult);
      setDashboards(dashboardsResult.data);
      setReports(reportsResult.data);
      setExecutions(executionsResult.data);
      setExports(exportsResult.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load reporting analytics.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, executionStatus, exportStatus, query, reportStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const metrics = useMemo(() => {
    const dashboardTotal = Object.values(overview.dashboards).reduce((sum, count) => sum + count, 0);
    const reportTotal = Object.values(overview.reports.byStatus).reduce((sum, count) => sum + count, 0);
    const failedExecutions = countFrom(overview.executions, ["FAILED", "CANCELLED"]);
    const completedExports = countFrom(overview.exports, ["COMPLETED"]);
    const budgetVariance = overview.budget.actual - overview.budget.planned;
    const velocityPoints = overview.velocity.reduce((sum, sprint) => sum + sprint.storyPoints, 0);
    return { dashboardTotal, reportTotal, failedExecutions, completedExports, budgetVariance, velocityPoints };
  }, [overview]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "#2563eb18" }}>
            <BarChart3 className="size-4" style={{ color: "#2563eb" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Reporting</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">{metrics.dashboardTotal} dashboards · {metrics.reportTotal} reports · {metrics.failedExecutions} failed</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={LayoutDashboard} label="Dashboards" value={metrics.dashboardTotal} subtext="visibility mix" tone="#6d5dd3" />
        <MetricCard icon={FileBarChart} label="Reports" value={metrics.reportTotal} subtext={`${overview.reports.byStatus.ACTIVE ?? 0} active`} tone="#111111" />
        <MetricCard icon={TriangleAlert} label="Failed runs" value={metrics.failedExecutions} subtext="execution pressure" tone={metrics.failedExecutions ? "#dc2626" : "#047857"} />
        <MetricCard icon={Download} label="Exports" value={metrics.completedExports} subtext="completed exports" tone="#047857" />
        <MetricCard icon={CircleDollarSign} label="Budget variance" value={`$${formatNumber(metrics.budgetVariance)}`} subtext={`planned $${formatNumber(overview.budget.planned)}`} tone={metrics.budgetVariance > 0 ? "#dc2626" : "#047857"} />
        <MetricCard icon={TrendingUp} label="Velocity" value={metrics.velocityPoints} subtext="story points" tone="#2563eb" />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search dashboard, report, export file, execution error, tenant..." />
          <div className="flex flex-wrap gap-2">
            {VIEWS.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" onClick={() => setView(item.id)} className="inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-[11px] font-black transition" style={{ background: view === item.id ? "#111111" : "#fbfaf6", border: "1px solid #ded8c8", color: view === item.id ? "#ffffff" : "#5f574c" }}>
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>
          {view === "reports" ? <div className="flex flex-wrap gap-2">{REPORT_STATUSES.map((item) => <FilterButton key={item} active={reportStatus === item} onClick={() => setReportStatus(item)}>{item}</FilterButton>)}</div> : null}
          {view === "executions" ? <div className="flex flex-wrap gap-2">{EXECUTION_STATUSES.map((item) => <FilterButton key={item} active={executionStatus === item} onClick={() => setExecutionStatus(item)}>{item}</FilterButton>)}</div> : null}
          {view === "exports" ? <div className="flex flex-wrap gap-2">{EXPORT_STATUSES.map((item) => <FilterButton key={item} active={exportStatus === item} onClick={() => setExportStatus(item)}>{item}</FilterButton>)}</div> : null}
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      {view === "overview" ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <OpsPanel accent="#047857" eyebrow="Tenant health" title="Project and task status distribution">
            <div className="space-y-4">
              <Distribution title="Projects" values={overview.tenantHealth.projects} />
              <Distribution title="Tasks" values={overview.tenantHealth.tasks} />
              <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">Completed tasks in last 30 days</p>
                <p className="mt-2 text-3xl font-black text-[#111111]">{formatNumber(overview.tenantHealth.completedTasksLast30d)}</p>
              </div>
            </div>
          </OpsPanel>

          <OpsPanel accent="#2563eb" eyebrow="Velocity" title="Recent sprint throughput">
            {overview.velocity.length === 0 ? <EmptyState text="No completed sprint velocity records returned." /> : (
              <div className="space-y-3">
                {overview.velocity.slice(0, 8).map((sprint) => (
                  <div key={sprint.id} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#111111]">{sprint.name}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{sprint.project?.name ?? "Project"} · {formatDate(sprint.completedAt)}</p>
                      </div>
                      <StatusBadge value={`${sprint.storyPoints} pts`} />
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#ece7dc]">
                      <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${Math.min(100, sprint.completedTasks * 10)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </OpsPanel>
        </div>
      ) : null}

      {view === "dashboards" ? (
        <OpsPanel accent="#6d5dd3" eyebrow="Dashboard inventory" title="Platform dashboard visibility">
          {loading ? <EmptyState text="Loading dashboards..." /> : dashboards.length === 0 ? <EmptyState text="No dashboards matched the current filters." /> : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboards.map((dashboard) => <DashboardCard key={dashboard.id} dashboard={dashboard} />)}
            </div>
          )}
        </OpsPanel>
      ) : null}

      {view === "reports" ? (
        <OpsPanel accent="#111111" eyebrow="Report definitions" title="Scheduled and ad-hoc report catalog">
          {loading ? <EmptyState text="Loading reports..." /> : reports.length === 0 ? <EmptyState text="No reports matched the current filters." /> : (
            <div className="space-y-3">
              {reports.map((report) => <ReportRow key={report.id} report={report} />)}
            </div>
          )}
        </OpsPanel>
      ) : null}

      {view === "executions" ? (
        <OpsPanel accent="#dc2626" eyebrow="Execution history" title="Report execution pressure and errors">
          {loading ? <EmptyState text="Loading report executions..." /> : executions.length === 0 ? <EmptyState text="No executions matched the current filters." /> : (
            <div className="space-y-3">
              {executions.map((execution) => <ExecutionRow key={execution.id} execution={execution} />)}
            </div>
          )}
        </OpsPanel>
      ) : null}

      {view === "exports" ? (
        <OpsPanel accent="#d89b00" eyebrow="Export history" title="Export-ready report output">
          {loading ? <EmptyState text="Loading report exports..." /> : exports.length === 0 ? <EmptyState text="No exports matched the current filters." /> : (
            <div className="space-y-3">
              {exports.map((item) => <ExportRow key={item.id} item={item} />)}
            </div>
          )}
        </OpsPanel>
      ) : null}
    </div>
  );
}

function Distribution({ title, values }: { title: string; values: Record<string, number> }) {
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-[#111111]">{title}</p>
        <p className="text-[11px] font-black text-[#8a8375]">{formatNumber(total)} total</p>
      </div>
      <div className="mt-3 space-y-2">
        {Object.entries(values).length === 0 ? <p className="text-[12px] font-semibold text-[#766f63]">No distribution returned.</p> : Object.entries(values).map(([key, value]) => (
          <div key={key}>
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.08em] text-[#8a8375]">
              <span>{key.replace(/_/g, " ")}</span>
              <span>{formatNumber(value)}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-[#ece7dc]">
              <div className="h-full rounded-full bg-[#ffd400]" style={{ width: `${total ? Math.max(4, Math.round((value / total) * 100)) : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardCard({ dashboard }: { dashboard: SiteDashboard }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#111111]">{dashboard.name}</p>
          <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{dashboard.visibility} · {dashboard._count?.widgets ?? 0} widgets</p>
        </div>
        <StatusBadge value={dashboard.isDefault ? "DEFAULT" : "CUSTOM"} />
      </div>
      <p className="mt-3 line-clamp-2 min-h-10 text-[12px] font-semibold leading-5 text-[#665f54]">{dashboard.description ?? "No description provided."}</p>
      {dashboard.tenant ? <Link href={`/site-admin/tenants/${dashboard.tenant.id}`} className="mt-3 inline-flex text-[11px] font-black text-[#6d5dd3] hover:text-[#111111]">{dashboard.tenant.name}</Link> : null}
    </div>
  );
}

function ReportRow({ report }: { report: SiteReport }) {
  return (
    <RowCard>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={report.status} />
          <StatusBadge value={report.type} />
          {report.tenant ? <Link href={`/site-admin/tenants/${report.tenant.id}`} className="text-[11px] font-black text-[#6d5dd3] hover:text-[#111111]">{report.tenant.name}</Link> : null}
        </div>
        <p className="mt-3 truncate text-sm font-black text-[#111111]">{report.name}</p>
        <p className="mt-1 text-[12px] font-semibold text-[#665f54]">Last run {formatDate(report.lastRunAt)} · Next run {formatDate(report.nextRunAt)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:min-w-[200px]">
        <MiniStat label="Runs" value={report._count?.executions ?? 0} />
        <MiniStat label="Exports" value={report._count?.exports ?? 0} />
      </div>
    </RowCard>
  );
}

function ExecutionRow({ execution }: { execution: SiteReportExecution }) {
  return (
    <RowCard>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={execution.status} />
          <StatusBadge value={execution.type} />
          {execution.tenant ? <Link href={`/site-admin/tenants/${execution.tenant.id}`} className="text-[11px] font-black text-[#6d5dd3] hover:text-[#111111]">{execution.tenant.name}</Link> : null}
        </div>
        <p className="mt-3 truncate text-sm font-black text-[#111111]">{execution.report?.name ?? "Ad-hoc report"}</p>
        {execution.error ? <p className="mt-1 line-clamp-2 text-[12px] font-bold text-red-700">{execution.error}</p> : <p className="mt-1 text-[12px] font-semibold text-[#665f54]">{formatNumber(execution.rowCount ?? 0)} rows · {execution.durationMs ?? 0}ms · {formatDate(execution.createdAt)}</p>}
      </div>
      <div className="flex items-center justify-start lg:justify-end">
        {execution.status === "FAILED" ? <TriangleAlert className="size-5 text-red-600" aria-hidden="true" /> : <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />}
      </div>
    </RowCard>
  );
}

function ExportRow({ item }: { item: SiteReportExport }) {
  return (
    <RowCard>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={item.status} />
          <StatusBadge value={item.format} />
          {item.tenant ? <Link href={`/site-admin/tenants/${item.tenant.id}`} className="text-[11px] font-black text-[#6d5dd3] hover:text-[#111111]">{item.tenant.name}</Link> : null}
        </div>
        <p className="mt-3 truncate text-sm font-black text-[#111111]">{item.fileName ?? item.report?.name ?? "Report export"}</p>
        {item.error ? <p className="mt-1 line-clamp-2 text-[12px] font-bold text-red-700">{item.error}</p> : <p className="mt-1 text-[12px] font-semibold text-[#665f54]">{formatNumber(item.sizeBytes ?? 0)} bytes · expires {formatDate(item.expiresAt)}</p>}
      </div>
      <div className="flex items-center justify-start lg:justify-end">
        <StatusBadge value={`${formatNumber(item.execution?.rowCount ?? 0)} rows`} />
      </div>
    </RowCard>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2" style={{ border: "1px solid #eee8dc" }}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8a8375]">{label}</p>
      <p className="mt-1 truncate text-[12px] font-black text-[#111111]">{typeof value === "number" ? formatNumber(value) : value}</p>
    </div>
  );
}
