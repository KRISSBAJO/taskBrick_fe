"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileWarning,
  GitBranch,
  ListChecks,
  PlayCircle,
  RefreshCw,
  RotateCw,
  Square,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  cancelSiteWorkflowRun,
  getSiteAutomationOverview,
  listSiteApprovalDefinitions,
  listSiteApprovals,
  listSiteWorkflowRunLogs,
  listSiteWorkflowRuns,
  listSiteWorkflows,
  retrySiteWorkflowRun,
  type ApprovalStatus,
  type SiteApproval,
  type SiteApprovalDefinition,
  type SiteAutomationOverview,
  type SiteWorkflow,
  type SiteWorkflowRun,
  type SiteWorkflowRunLog,
  type WorkflowRunStatus,
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
} from "../_components/site-admin-ops-ui";

type View = "runs" | "workflows" | "approvals" | "logs";

const VIEWS: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "runs", label: "Runs", icon: PlayCircle },
  { id: "workflows", label: "Definitions", icon: Workflow },
  { id: "approvals", label: "Approvals", icon: ListChecks },
  { id: "logs", label: "Runtime logs", icon: FileWarning },
];

const RUN_STATUSES: Array<"ALL" | WorkflowRunStatus> = ["ALL", "FAILED", "RUNNING", "PENDING", "COMPLETED", "CANCELLED"];
const APPROVAL_STATUSES: Array<"ALL" | ApprovalStatus> = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

type ApprovalDefinitionRow = SiteApprovalDefinition & { workflowId?: string | null };

const emptyOverview: SiteAutomationOverview = {
  workflows: { byTrigger: {} },
  runs: { byStatus: {}, last24h: 0, deadLetter: 0 },
  approvals: { byStatus: {} },
  definitions: {},
  runtimeLogs: { errorLogs: 0 },
  recentFailedRuns: [],
};

export default function SiteAdminAutomationPage() {
  const { auth } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [overview, setOverview] = useState<SiteAutomationOverview>(emptyOverview);
  const [runs, setRuns] = useState<SiteWorkflowRun[]>([]);
  const [workflows, setWorkflows] = useState<SiteWorkflow[]>([]);
  const [approvals, setApprovals] = useState<SiteApproval[]>([]);
  const [approvalDefs, setApprovalDefs] = useState<SiteApprovalDefinition[]>([]);
  const [logs, setLogs] = useState<SiteWorkflowRunLog[]>([]);
  const [view, setView] = useState<View>("runs");
  const [query, setQuery] = useState("");
  const [runStatusFilter, setRunStatusFilter] = useState<(typeof RUN_STATUSES)[number]>("ALL");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<(typeof APPROVAL_STATUSES)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResult, runsResult, workflowsResult, approvalsResult, approvalDefsResult, logsResult] = await Promise.all([
        getSiteAutomationOverview(auth.accessToken),
        listSiteWorkflowRuns(auth.accessToken, {
          limit: 30,
          search: query || undefined,
          status: runStatusFilter !== "ALL" ? runStatusFilter : undefined,
        }),
        listSiteWorkflows(auth.accessToken, { limit: 30, search: query || undefined }),
        listSiteApprovals(auth.accessToken, {
          limit: 30,
          search: query || undefined,
          status: approvalStatusFilter !== "ALL" ? approvalStatusFilter : undefined,
        }),
        listSiteApprovalDefinitions(auth.accessToken, { limit: 30, search: query || undefined }),
        listSiteWorkflowRunLogs(auth.accessToken, { limit: 30 }),
      ]);
      setOverview(overviewResult);
      setRuns(runsResult.data);
      setWorkflows(workflowsResult.data);
      setApprovals(approvalsResult.data);
      setApprovalDefs(approvalDefsResult.data);
      setLogs(logsResult.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load automation data.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, query, runStatusFilter, approvalStatusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const metrics = useMemo(() => {
    const activeWorkflows = Object.values(overview.workflows.byTrigger).reduce((sum, n) => sum + n, 0);
    const failedRuns = countFrom(overview.runs.byStatus, ["FAILED"]);
    const runningRuns = countFrom(overview.runs.byStatus, ["RUNNING", "PENDING"]);
    const completedRuns = overview.runs.byStatus.COMPLETED ?? 0;
    const pendingApprovals = countFrom(overview.approvals.byStatus, ["PENDING"]);
    const errorLogs = overview.runtimeLogs.errorLogs;
    return { activeWorkflows, failedRuns, runningRuns, completedRuns, pendingApprovals, errorLogs };
  }, [overview]);

  async function retryRun(run: SiteWorkflowRun) {
    const confirmed = await confirm({
      title: "Retry workflow run?",
      description: "A new run will be queued for this workflow.",
      confirmLabel: "Retry",
      tone: "warning",
    });
    if (!confirmed) return;
    setBusy(run.id);
    try {
      await retrySiteWorkflowRun(auth.accessToken, run.id);
      toast({ title: "Workflow retried", description: "The run was queued for retry.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Retry failed", description: caught instanceof Error ? caught.message : "Unable to retry workflow run.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function cancelRun(run: SiteWorkflowRun) {
    setBusy(run.id);
    try {
      await cancelSiteWorkflowRun(auth.accessToken, run.id);
      toast({ title: "Workflow run cancelled", description: "Runtime cancellation was recorded.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Cancel failed", description: caught instanceof Error ? caught.message : "Unable to cancel workflow run.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "#d89b0018" }}>
            <Workflow className="size-4" style={{ color: "#d89b00" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Automation</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">{metrics.activeWorkflows} workflows · {metrics.failedRuns} failed · {metrics.pendingApprovals} approvals pending</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={GitBranch} label="Workflows" value={metrics.activeWorkflows} subtext="definitions by trigger" tone="#111111" />
        <MetricCard icon={AlertTriangle} label="Failed runs" value={metrics.failedRuns} subtext={`${overview.runs.deadLetter} dead-letter`} tone={metrics.failedRuns ? "#dc2626" : "#047857"} />
        <MetricCard icon={Clock3} label="Active runs" value={metrics.runningRuns} subtext={`${overview.runs.last24h} last 24h`} tone="#d89b00" />
        <MetricCard icon={CheckCircle2} label="Completed" value={metrics.completedRuns} subtext="successful executions" tone="#047857" />
        <MetricCard icon={ListChecks} label="Approvals" value={metrics.pendingApprovals} subtext="pending review" tone={metrics.pendingApprovals ? "#d89b00" : "#047857"} />
        <MetricCard icon={FileWarning} label="Error logs" value={metrics.errorLogs} subtext="runtime log errors" tone={metrics.errorLogs ? "#dc2626" : "#047857"} />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-[12px] px-3 text-[12px] font-black transition ${view === id ? "bg-[#111111] text-white" : "bg-[#fbfaf6] text-[#5f574c] hover:bg-[#f0ebe0]"}`}
                style={view !== id ? { border: "1px solid #ded8c8" } : undefined}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Search workflows, runs, tenants..." />
          {view === "runs" ? (
            <div className="flex flex-wrap gap-2">
              {RUN_STATUSES.map((status) => (
                <FilterButton key={status} label={status} active={runStatusFilter === status} onClick={() => setRunStatusFilter(status)} />
              ))}
            </div>
          ) : null}
          {view === "approvals" ? (
            <div className="flex flex-wrap gap-2">
              {APPROVAL_STATUSES.map((status) => (
                <FilterButton key={status} label={status} active={approvalStatusFilter === status} onClick={() => setApprovalStatusFilter(status)} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      {view === "runs" ? (
        <OpsPanel accent="#d89b00" eyebrow="Workflow runs" title="Execution history and control">
          {loading ? (
            <EmptyState text="Loading workflow runs..." />
          ) : runs.length === 0 ? (
            <EmptyState text="No workflow runs matched the current filter." />
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <RowCard key={run.id}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-black text-[#111111]">{run.workflow?.name ?? run.workflowId ?? run.id}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#766f63]">
                      {run.tenant ? (
                        <Link href={`/site-admin/tenants/${run.tenant.id}`} className="hover:text-[#6d5dd3]">{run.tenant.name}</Link>
                      ) : "Platform"} · {formatDate(run.createdAt)}
                    </p>
                    {run.error ? <p className="mt-1 truncate text-[11px] font-semibold text-red-600">{run.error}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <StatusBadge value={run.status} />
                    {(run.status === "FAILED") ? (
                      <button
                        type="button"
                        onClick={() => void retryRun(run)}
                        disabled={busy === run.id}
                        className="inline-flex h-7 items-center gap-1 rounded-[8px] bg-[#2563eb] px-2 text-[11px] font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        <RotateCw className="size-3" aria-hidden="true" />
                        Retry
                      </button>
                    ) : null}
                    {(run.status === "RUNNING" || run.status === "PENDING") ? (
                      <button
                        type="button"
                        onClick={() => void cancelRun(run)}
                        disabled={busy === run.id}
                        className="inline-flex h-7 items-center gap-1 rounded-[8px] bg-[#dc2626] px-2 text-[11px] font-black text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        <Square className="size-3" aria-hidden="true" />
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </RowCard>
              ))}
            </div>
          )}
        </OpsPanel>
      ) : null}

      {view === "workflows" ? (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <OpsPanel accent="#111111" eyebrow="Workflow definitions" title="Global workflow registry">
            {loading ? (
              <EmptyState text="Loading workflow definitions..." />
            ) : workflows.length === 0 ? (
              <EmptyState text="No workflow definitions found." />
            ) : (
              <div className="space-y-2">
                {workflows.map((wf) => (
                  <RowCard key={wf.id}>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-black text-[#111111]">{wf.name}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#766f63]">
                        {wf.tenant ? (
                          <Link href={`/site-admin/tenants/${wf.tenant.id}`} className="hover:text-[#6d5dd3]">{wf.tenant.name}</Link>
                        ) : "Platform"} · {wf.triggerType ?? "manual"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={wf.isActive ? "ACTIVE" : "INACTIVE"} />
                      {wf.entityType ? <StatusBadge value={wf.entityType} /> : null}
                    </div>
                  </RowCard>
                ))}
              </div>
            )}
          </OpsPanel>

          <OpsPanel accent="#6d5dd3" eyebrow="Definition registry" title="By workflow type">
            <div className="space-y-2">
              {Object.keys(overview.definitions).length === 0 ? (
                <EmptyState text="No definitions to display." />
              ) : (
                Object.entries(overview.definitions).map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl bg-[#fbfaf6] px-3 py-3" style={{ border: "1px solid #e7dfcf" }}>
                    <p className="text-[12px] font-black text-[#111111]">{key}</p>
                    <StatusBadge value={String(count)} />
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">By trigger type</p>
              {Object.keys(overview.workflows.byTrigger).length === 0 ? (
                <p className="text-[11px] font-bold text-[#8a8375]">No trigger data</p>
              ) : (
                Object.entries(overview.workflows.byTrigger).map(([trigger, count]) => (
                  <div key={trigger} className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-[#111111]">{trigger}</p>
                    <StatusBadge value={String(count)} />
                  </div>
                ))
              )}
            </div>
          </OpsPanel>
        </div>
      ) : null}

      {view === "approvals" ? (
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <OpsPanel accent="#2563eb" eyebrow="Approval queue" title="Pending and recent approval decisions">
            {loading ? (
              <EmptyState text="Loading approvals..." />
            ) : approvals.length === 0 ? (
              <EmptyState text="No approvals matched the current filter." />
            ) : (
              <div className="space-y-2">
                {approvals.map((approval) => (
                  <RowCard key={approval.id}>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-black text-[#111111]">{approval.title ?? approval.definitionId ?? "Approval request"}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#766f63]">
                        {approval.tenant ? (
                          <Link href={`/site-admin/tenants/${approval.tenant.id}`} className="hover:text-[#6d5dd3]">{approval.tenant.name}</Link>
                        ) : "Platform"} · {formatDate(approval.createdAt)}
                      </p>
                    </div>
                    <StatusBadge value={approval.status} />
                  </RowCard>
                ))}
              </div>
            )}
          </OpsPanel>

          <OpsPanel accent="#a78bfa" eyebrow="Approval definitions" title="Registered approval types">
            {loading ? (
              <EmptyState text="Loading..." />
            ) : approvalDefs.length === 0 ? (
              <EmptyState text="No approval definitions found." />
            ) : (
              <div className="space-y-2">
                {approvalDefs.map((def: ApprovalDefinitionRow) => (
                  <div key={def.id} className="rounded-2xl bg-[#fbfaf6] p-3" style={{ border: "1px solid #e7dfcf" }}>
                    <p className="text-[12px] font-black text-[#111111]">{def.name ?? def.id}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#766f63]">
                      {def.tenant ? def.tenant.name : "Platform"} · {def.workflowId ? "Workflow" : "Standalone"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </OpsPanel>
        </div>
      ) : null}

      {view === "logs" ? (
        <OpsPanel accent="#dc2626" eyebrow="Runtime logs" title={`Error signals (${overview.runtimeLogs.errorLogs} total)`}>
          {loading ? (
            <EmptyState text="Loading runtime logs..." />
          ) : logs.length === 0 ? (
            <EmptyState text="No runtime log entries found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">
                  <tr>
                    <th className="px-3 py-2">Message</th>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2">Run</th>
                    <th className="px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee8dc]">
                  {logs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-[#fffdf2]">
                      <td className="min-w-[360px] px-3 py-3">
                        <p className="truncate text-[12px] font-black text-[#111111]">{log.message}</p>
                        {log.data ? <p className="mt-1 truncate text-[11px] font-semibold text-[#766f63]">{typeof log.data === "string" ? log.data : JSON.stringify(log.data)}</p> : null}
                      </td>
                      <td className="px-3 py-3"><StatusBadge value={log.level ?? "INFO"} /></td>
                      <td className="px-3 py-3 text-[11px] font-semibold text-[#766f63]">{log.runId ? `${log.runId.slice(0, 12)}...` : "-"}</td>
                      <td className="px-3 py-3 text-[12px] font-semibold text-[#766f63]">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </OpsPanel>
      ) : null}

      {view === "runs" && overview.recentFailedRuns.length > 0 ? (
        <OpsPanel accent="#dc2626" eyebrow="Dead letter queue" title="Recent failed runs requiring attention">
          <div className="space-y-2">
            {overview.recentFailedRuns.map((run) => (
              <RowCard key={run.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-black text-[#111111]">{run.workflow?.name ?? run.workflowId ?? run.id}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#766f63]">
                    {run.tenant ? run.tenant.name : "Platform"} · {formatDate(run.createdAt)}
                  </p>
                  {run.error ? <p className="mt-1 truncate text-[11px] text-red-600">{run.error}</p> : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <StatusBadge value={run.status} />
                  <button
                    type="button"
                    onClick={() => void retryRun(run)}
                    disabled={busy === run.id}
                    className="inline-flex h-7 items-center gap-1 rounded-[8px] bg-[#2563eb] px-2 text-[11px] font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RotateCw className="size-3" aria-hidden="true" />
                    Retry
                  </button>
                </div>
              </RowCard>
            ))}
          </div>
        </OpsPanel>
      ) : null}
    </div>
  );
}
