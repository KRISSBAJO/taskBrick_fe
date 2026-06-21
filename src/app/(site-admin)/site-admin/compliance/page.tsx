"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  FileArchive,
  Play,
  RefreshCw,
  Scale,
  ShieldCheck,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  approveSiteComplianceJob,
  cancelSiteComplianceJob,
  getSiteComplianceOverview,
  listSiteComplianceJobs,
  rejectSiteComplianceJob,
  runSiteComplianceJob,
  type ComplianceJobStatus,
  type ComplianceJobType,
  type SiteComplianceJob,
  type SiteComplianceOverview,
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

const JOB_TYPES: Array<"ALL" | ComplianceJobType> = ["ALL", "DATA_EXPORT", "DATA_DELETION", "RETENTION_PURGE"];
const JOB_STATUSES: Array<"ALL" | ComplianceJobStatus> = ["ALL", "REQUESTED", "APPROVED", "QUEUED", "RUNNING", "COMPLETED", "FAILED", "REJECTED", "CANCELLED"];

const emptyOverview: SiteComplianceOverview = {
  jobs: { byStatus: {}, byType: {} },
  policies: { reviewed: 0, boundaryChecks: [] },
  recentJobs: [],
  evidenceTrail: [],
};

export default function SiteAdminCompliancePage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [overview, setOverview] = useState<SiteComplianceOverview>(emptyOverview);
  const [jobs, setJobs] = useState<SiteComplianceJob[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof JOB_TYPES)[number]>("ALL");
  const [statusFilter, setStatusFilter] = useState<(typeof JOB_STATUSES)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const canApprove = user.platformAdminLevel === "OWNER" || user.platformAdminLevel === "ADMIN" || user.platformAdminLevel === "SUPPORT";
  const canRun = user.platformAdminLevel === "OWNER" || user.platformAdminLevel === "ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResult, jobsResult] = await Promise.all([
        getSiteComplianceOverview(auth.accessToken),
        listSiteComplianceJobs(auth.accessToken, {
          limit: 30,
          search: query || undefined,
          type: typeFilter !== "ALL" ? typeFilter : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
        }),
      ]);
      setOverview(overviewResult);
      setJobs(jobsResult.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load compliance data.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, query, typeFilter, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const metrics = useMemo(() => {
    const open = countFrom(overview.jobs.byStatus, ["REQUESTED", "APPROVED", "QUEUED", "RUNNING"]);
    const completed = overview.jobs.byStatus.COMPLETED ?? 0;
    const failed = countFrom(overview.jobs.byStatus, ["FAILED", "REJECTED", "CANCELLED", "EXPIRED"]);
    const review = overview.policies.boundaryChecks.filter((check) => check.evidence === "REVIEW").length;
    return { open, completed, failed, review };
  }, [overview]);

  async function approveJob(job: SiteComplianceJob) {
    const confirmed = await confirm({
      title: `Approve ${job.type.replace(/_/g, " ").toLowerCase()}?`,
      description: "Approval records a platform audit event. Deletion and retention purge jobs still require a separate run action.",
      confirmLabel: "Approve job",
      tone: "warning",
    });
    if (!confirmed) return;
    setBusy(job.id);
    try {
      await approveSiteComplianceJob(auth.accessToken, job.id);
      toast({ title: "Compliance job approved", description: "The job was approved and is ready to run.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Approval failed", description: caught instanceof Error ? caught.message : "Unable to approve job.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function rejectJob(job: SiteComplianceJob) {
    const confirmed = await confirm({
      title: `Reject ${job.type.replace(/_/g, " ").toLowerCase()}?`,
      description: "Rejection records a platform audit event and closes the job.",
      confirmLabel: "Reject job",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusy(job.id);
    try {
      await rejectSiteComplianceJob(auth.accessToken, job.id, { reason: `Rejected from site-admin compliance by ${user.email}` });
      toast({ title: "Compliance job rejected", description: "The job was rejected.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Rejection failed", description: caught instanceof Error ? caught.message : "Unable to reject job.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function runJob(job: SiteComplianceJob) {
    const confirmed = await confirm({
      title: `Run ${job.type.replace(/_/g, " ").toLowerCase()}?`,
      description: "This will execute the compliance job. Data deletion and retention purge actions are irreversible.",
      confirmLabel: "Run job",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusy(job.id);
    try {
      await runSiteComplianceJob(auth.accessToken, job.id);
      toast({ title: "Compliance job queued", description: "The job was queued for execution.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Run failed", description: caught instanceof Error ? caught.message : "Unable to run job.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function cancelJob(job: SiteComplianceJob) {
    setBusy(job.id);
    try {
      await cancelSiteComplianceJob(auth.accessToken, job.id, { reason: `Cancelled from site-admin compliance by ${user.email}` });
      toast({ title: "Compliance job cancelled", description: "The job was cancelled.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Cancel failed", description: caught instanceof Error ? caught.message : "Unable to cancel job.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "#a78bfa18" }}>
            <DatabaseZap className="size-4" style={{ color: "#a78bfa" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Compliance</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">{metrics.open} open · {metrics.completed} completed · {overview.policies.reviewed} policies reviewed</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={FileArchive} label="Exports" value={overview.jobs.byType.DATA_EXPORT ?? 0} subtext="data access jobs" tone="#2563eb" />
        <MetricCard icon={Trash2} label="Deletion" value={overview.jobs.byType.DATA_DELETION ?? 0} subtext="subject deletion jobs" tone="#dc2626" />
        <MetricCard icon={Scale} label="Retention" value={overview.jobs.byType.RETENTION_PURGE ?? 0} subtext="purge jobs" tone="#d89b00" />
        <MetricCard icon={Clock3} label="Open jobs" value={metrics.open} subtext="needs action or running" tone={metrics.open ? "#d89b00" : "#047857"} />
        <MetricCard icon={CheckCircle2} label="Completed" value={metrics.completed} subtext="evidence created" tone="#047857" />
        <MetricCard icon={ShieldCheck} label="Boundary review" value={metrics.review} subtext={`${overview.policies.reviewed} policies checked`} tone={metrics.review ? "#dc2626" : "#047857"} />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search jobs by subject, type, tenant..." />
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.map((type) => (
              <FilterButton key={type} label={type} active={typeFilter === type} onClick={() => setTypeFilter(type)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {JOB_STATUSES.map((status) => (
              <FilterButton key={status} label={status} active={statusFilter === status} onClick={() => setStatusFilter(status)} />
            ))}
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <OpsPanel accent="#a78bfa" eyebrow="Compliance jobs" title="Data export, deletion, and retention">
        {loading ? (
          <EmptyState text="Loading compliance jobs..." />
        ) : jobs.length === 0 ? (
          <EmptyState text="No compliance jobs matched the current filter." />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <ComplianceJobCard
                key={job.id}
                job={job}
                busy={busy === job.id}
                canApprove={canApprove}
                canRun={canRun}
                onApprove={() => void approveJob(job)}
                onReject={() => void rejectJob(job)}
                onRun={() => void runJob(job)}
                onCancel={() => void cancelJob(job)}
              />
            ))}
          </div>
        )}
      </OpsPanel>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <OpsPanel accent="#6d5dd3" eyebrow="Evidence trail" title="Immutable compliance audit log">
          {loading ? (
            <EmptyState text="Loading evidence trail..." />
          ) : overview.evidenceTrail.length === 0 ? (
            <EmptyState text="No evidence trail entries found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">
                  <tr>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Tenant</th>
                    <th className="px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee8dc]">
                  {overview.evidenceTrail.map((entry) => (
                    <tr key={entry.id} className="transition hover:bg-[#fffdf2]">
                      <td className="min-w-[240px] px-3 py-3">
                        <p className="text-[12px] font-black text-[#111111]">{entry.action}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{entry.entityType}</p>
                      </td>
                      <td className="px-3 py-3 text-[12px] font-semibold text-[#766f63]">
                        {entry.tenant ? (
                          <Link href={`/site-admin/tenants/${entry.tenant.id}`} className="hover:text-[#6d5dd3]">{entry.tenant.name}</Link>
                        ) : "Platform"}
                      </td>
                      <td className="px-3 py-3 text-[12px] font-semibold text-[#766f63]">{formatDate(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </OpsPanel>

        <OpsPanel accent="#047857" eyebrow="Policy boundary checks" title="Tenant data governance posture">
          {overview.policies.boundaryChecks.length === 0 ? (
            <EmptyState text="No boundary checks to display." />
          ) : (
            <div className="space-y-2">
              {overview.policies.boundaryChecks.map((check) => (
                <div key={check.tenant.id} className="rounded-2xl bg-[#fbfaf6] p-3" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-black text-[#111111]">
                        <Link href={`/site-admin/tenants/${check.tenant.id}`} className="hover:text-[#6d5dd3]">{check.tenant.name}</Link>
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-[#766f63]">Audit {check.auditRetentionDays}d{check.dataRetentionDays ? ` · Data ${check.dataRetentionDays}d` : ""}</p>
                    </div>
                    <StatusBadge value={check.evidence} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge value={check.mfaRequired ? "MFA ON" : "MFA OFF"} />
                    <StatusBadge value={check.domainDiscoveryEnabled ? "DISCOVERY ON" : "DISCOVERY OFF"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </OpsPanel>
      </div>
    </div>
  );
}

function ComplianceJobCard({
  job,
  busy,
  canApprove,
  canRun,
  onApprove,
  onReject,
  onRun,
  onCancel,
}: {
  job: SiteComplianceJob;
  busy: boolean;
  canApprove: boolean;
  canRun: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRun: () => void;
  onCancel: () => void;
}) {
  const canAct = !busy && (job.status === "REQUESTED" || job.status === "APPROVED" || job.status === "QUEUED" || job.status === "RUNNING");
  return (
    <RowCard>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-black text-[#111111]">{job.type.replace(/_/g, " ")}</p>
          <StatusBadge value={job.status} />
        </div>
        <p className="mt-1 text-[11px] font-semibold text-[#766f63]">
          {job.tenant ? (
            <Link href={`/site-admin/tenants/${job.tenant.id}`} className="hover:text-[#6d5dd3]">{job.tenant.name}</Link>
          ) : "Platform"} · {job.subjectType ?? "global"} · {formatDate(job.createdAt)}
        </p>
        {job.requestedBy ? (
          <p className="mt-1 text-[11px] font-semibold text-[#8a8375]">Requested by {formatUserName(job.requestedBy)}</p>
        ) : null}
      </div>
      {canAct ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          {canApprove && job.status === "REQUESTED" ? (
            <ActionButton icon={CheckCircle2} label="Approve" tone="#047857" onClick={onApprove} disabled={busy} />
          ) : null}
          {canRun && job.status === "APPROVED" ? (
            <ActionButton icon={Play} label="Run" tone="#2563eb" onClick={onRun} disabled={busy} />
          ) : null}
          {canApprove && job.status === "REQUESTED" ? (
            <ActionButton icon={XCircle} label="Reject" tone="#dc2626" onClick={onReject} disabled={busy} />
          ) : null}
          {(job.status === "QUEUED" || job.status === "RUNNING") ? (
            <ActionButton icon={Ban} label="Cancel" tone="#d89b00" onClick={onCancel} disabled={busy} />
          ) : null}
        </div>
      ) : null}
    </RowCard>
  );
}

function formatUserName(user: SiteComplianceJob["requestedBy"]) {
  if (!user) return "Unknown user";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email;
}

function ActionButton({ icon: Icon, label, tone, onClick, disabled }: { icon: LucideIcon; label: string; tone: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-[11px] font-black text-white transition disabled:opacity-50"
      style={{ background: tone }}
    >
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </button>
  );
}
