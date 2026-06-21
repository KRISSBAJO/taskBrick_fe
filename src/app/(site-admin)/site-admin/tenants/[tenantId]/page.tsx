"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Database,
  DollarSign,
  FileText,
  FolderKanban,
  Gauge,
  KeyRound,
  Layers3,
  Link2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  getSiteTenant,
  listSiteTenantUsers,
  updateSiteTenantStatus,
  type SiteTenantDetail,
  type Tenant,
  type TenantUser,
} from "@/lib/api";

const emptyTenantIndices: SiteTenantDetail["indices"] = {
  workspace: {
    workspaces: 0,
    teams: 0,
    integrations: 0,
    webhooks: 0,
    files: 0,
    aiAgents: 0,
    reports: 0,
    dashboards: 0,
  },
  projects: {
    total: 0,
    byStatus: {},
    byVisibility: {},
    overdue: 0,
  },
  tasks: {
    total: 0,
    open: 0,
    overdue: 0,
    byStatus: {},
    byPriority: {},
    byType: {},
  },
  delivery: {
    sprints: 0,
    boards: 0,
    milestones: 0,
    openRisks: 0,
    plannedBudget: 0,
    actualBudget: 0,
    budgetVariance: 0,
  },
  security: {
    activeSessions: 0,
    revokedSessions: 0,
    openSecurityEvents: 0,
    totalSecurityEvents: 0,
    apiKeys: 0,
    auditLogs: 0,
    platformAuditLogs: 0,
    mfaFactors: 0,
    trustedDevices: 0,
    ssoProviders: 0,
  },
};

const DEEP_OPERATIONS = [
  { key: "users", label: "Users", description: "Membership, roles, identity, and verification.", icon: Users, color: "#2563eb" },
  { key: "projects", label: "Projects", description: "Portfolio, delivery state, risks, and workload.", icon: FolderKanban, color: "#6d5dd3" },
  { key: "workspaces", label: "Workspaces", description: "Workspace segmentation and custom fields.", icon: Building2, color: "#6d5dd3" },
  { key: "teams", label: "Teams", description: "Team structure, members, and project load.", icon: Users, color: "#059669" },
  { key: "sessions", label: "Sessions", description: "Active, revoked, MFA, and trusted-device sessions.", icon: CalendarClock, color: "#059669" },
  { key: "security", label: "Security", description: "Policy posture, events, MFA, SSO, and API keys.", icon: ShieldCheck, color: "#dc2626" },
  { key: "billing", label: "Billing", description: "Plan, seats, usage, invoices, and events.", icon: DollarSign, color: "#d89b00" },
  { key: "integrations", label: "Integrations", description: "Providers, webhooks, deliveries, and sync state.", icon: Link2, color: "#111111" },
  { key: "files", label: "Files", description: "Storage, uploads, visibility, archive, and delete state.", icon: Database, color: "#5f574c" },
  { key: "ai", label: "AI usage", description: "Agents, tokens, actions, and estimated cost.", icon: Sparkles, color: "#6d5dd3" },
  { key: "reports", label: "Reports", description: "Dashboards, reports, executions, and exports.", icon: BarChart3, color: "#2563eb" },
  { key: "activity", label: "Activity", description: "Tenant audit, platform audit, and security timeline.", icon: Activity, color: "#dc2626" },
];

export default function SiteAdminTenantDetailPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = String(params.tenantId ?? "");
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [detail, setDetail] = useState<SiteTenantDetail | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const canMutate = user.platformAdminLevel === "OWNER" || user.platformAdminLevel === "ADMIN";

  const loadTenant = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError("");
    try {
      const [tenantDetail, tenantUsers] = await Promise.all([
        getSiteTenant(auth.accessToken, tenantId),
        listSiteTenantUsers(auth.accessToken, tenantId, { limit: 50 }),
      ]);
      setDetail(tenantDetail);
      setUsers(tenantUsers.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load tenant detail.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, tenantId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTenant(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadTenant]);

  async function changeTenantStatus(tenant: Tenant, status: string) {
    const confirmed = await confirm({
      title: `${status === "ACTIVE" ? "Reactivate" : "Change"} ${tenant.name}?`,
      description:
        status === "SUSPENDED"
          ? "Suspending a tenant revokes active sessions and blocks login until reactivated."
          : `This will set tenant status to ${status}. Platform audit and security events will be recorded.`,
      confirmLabel: status === "ACTIVE" ? "Reactivate tenant" : "Apply status",
      tone: status === "SUSPENDED" || status === "CANCELLED" ? "danger" : "warning",
    });
    if (!confirmed) return;

    setBusy(`status:${tenant.id}`);
    try {
      await updateSiteTenantStatus(auth.accessToken, tenant.id, {
        status,
        reason: `Changed from site admin tenant detail by ${user.email}`,
      });
      toast({ title: "Tenant status updated", description: `${tenant.name} is now ${status}.`, variant: "success" });
      await loadTenant();
    } catch (caught) {
      toast({
        title: "Status update failed",
        description: caught instanceof Error ? caught.message : "Unable to update tenant status.",
        variant: "error",
      });
    } finally {
      setBusy("");
    }
  }

  const tenant = detail?.tenant;
  const indices = detail?.indices ?? emptyTenantIndices;
  const projectCount = indices.projects.total || tenant?._count?.projects || detail?.projects.length || 0;
  const taskCount = indices.tasks.total;
  const openTaskCount = indices.tasks.open;
  const activeSessionCount = indices.security.activeSessions || detail?.sessions.active || 0;
  const openEventCount = indices.security.openSecurityEvents || detail?.securityEvents.open || 0;
  const userCount = useMemo(() => (detail ? sumRecord(detail.users) : 0), [detail]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <LightEmpty text="Loading tenant detail..." />
      </div>
    );
  }

  if (error || !detail || !tenant) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/site-admin/tenants" className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-3 text-[12px] font-black text-[#111111]" style={{ border: "1px solid #ded8c8" }}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to tenants
        </Link>
        <LightEmpty text={error || "Tenant detail was not returned."} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(17,17,17,0.08)] md:p-6" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link href="/site-admin/tenants" className="inline-flex h-9 items-center gap-2 rounded-2xl bg-[#fbfaf6] px-3 text-[12px] font-black text-[#111111] transition hover:bg-[#ffd400]" style={{ border: "1px solid #ded8c8" }}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Tenants
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <SoftBadge status={tenant.status} />
              <span className="inline-flex h-7 items-center gap-2 rounded-full px-3 text-[9px] font-black uppercase tracking-[0.14em]" style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" }}>
                <Building2 className="size-3.5" aria-hidden="true" />
                @{tenant.slug}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#111111] md:text-[42px]">{tenant.name}</h1>
            <p className="mt-2 max-w-2xl text-[13px] font-semibold leading-6 text-[#665f54]">
              Tenant-level isolation, membership, project activity, sessions, and security signals for platform administration.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canMutate && tenant.status !== "SUSPENDED" ? (
              <button type="button" onClick={() => changeTenantStatus(tenant, "SUSPENDED")} disabled={busy === `status:${tenant.id}`} className="h-10 rounded-2xl px-4 text-[12px] font-black transition disabled:opacity-50" style={{ background: "#fff1f1", border: "1px solid #fecaca", color: "#dc2626" }}>
                Suspend tenant
              </button>
            ) : null}
            {canMutate && tenant.status !== "ACTIVE" ? (
              <button type="button" onClick={() => changeTenantStatus(tenant, "ACTIVE")} disabled={busy === `status:${tenant.id}`} className="h-10 rounded-2xl px-4 text-[12px] font-black transition disabled:opacity-50" style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#047857" }}>
                Activate tenant
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-6 grid gap-3 border-t border-[#eee8dc] pt-5 sm:grid-cols-2 lg:grid-cols-5">
          <DetailMetric icon={Users} label="Users" value={userCount} color="#2563eb" />
          <DetailMetric icon={FolderKanban} label="Projects" value={projectCount} color="#6d5dd3" />
          <DetailMetric icon={BarChart3} label="Open tasks" value={openTaskCount} color="#d89b00" />
          <DetailMetric icon={Activity} label="Active sessions" value={activeSessionCount} color="#059669" />
          <DetailMetric icon={AlertTriangle} label="Open events" value={openEventCount} color={openEventCount > 0 ? "#dc2626" : "#059669"} />
        </div>
      </section>

      <LightPanel title="Deep operations" eyebrow="Tenant control surface" accent="#111111">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {DEEP_OPERATIONS.map((operation) => (
            <OperationCard
              key={operation.key}
              href={`/site-admin/tenants/${tenant.id}/${operation.key}`}
              icon={operation.icon}
              label={operation.label}
              description={operation.description}
              color={operation.color}
            />
          ))}
        </div>
      </LightPanel>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
        <LightPanel title="Projects" eyebrow="Tenant delivery" accent="#6d5dd3">
          <div className="mb-4 grid gap-2 sm:grid-cols-4">
            <MiniIndex label="Total" value={projectCount} color="#6d5dd3" />
            <MiniIndex label="Active" value={indices.projects.byStatus.ACTIVE ?? 0} color="#059669" />
            <MiniIndex label="Completed" value={indices.projects.byStatus.COMPLETED ?? 0} color="#2563eb" />
            <MiniIndex label="Overdue" value={indices.projects.overdue} color={indices.projects.overdue > 0 ? "#dc2626" : "#8a8375"} />
          </div>
          <div className="space-y-3">
            {detail.projects.map((project) => (
              <div key={project.id} className="rounded-[20px] bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[14px] font-black text-[#111111]">{project.name}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#5f574c]" style={{ border: "1px solid #ded8c8" }}>{project.key}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-[#766f63]">
                      {project.workspace?.name ?? "No workspace"} - {project.team?.name ?? "No team"} - {project.visibility}
                    </p>
                  </div>
                  <SoftBadge status={project.status} />
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee8dc]">
                  <span className="block h-full rounded-full bg-[#34d399]" style={{ width: `${Math.min(100, Math.max(0, project.progress ?? 0))}%` }} />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <ProjectMiniStat label="Tasks" value={project._count?.tasks ?? 0} />
                  <ProjectMiniStat label="Members" value={project._count?.members ?? 0} />
                  <ProjectMiniStat label="Sprints" value={project._count?.sprints ?? 0} />
                  <ProjectMiniStat label="Risks" value={project._count?.risks ?? 0} />
                </div>
              </div>
            ))}
            {detail.projects.length === 0 ? <LightEmpty text="Backend returned zero projects linked to this tenant ID." /> : null}
          </div>
        </LightPanel>

        <LightPanel title="Recent task movement" eyebrow="Work activity" accent="#d89b00">
          <div className="space-y-2">
            {(detail.recentTasks ?? []).map((task) => (
              <div key={task.id} className="rounded-2xl bg-[#fbfaf6] px-4 py-3" style={{ border: "1px solid #e7dfcf" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-black text-[#111111]">{task.title}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#766f63]">{task.key} - {task.project?.name ?? "Project"} - {formatDate(task.updatedAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <SoftBadge status={task.type} />
                    <SoftBadge status={task.status} />
                  </div>
                </div>
              </div>
            ))}
            {(detail.recentTasks ?? []).length === 0 ? <LightEmpty text="No recent task movement for this tenant." /> : null}
          </div>
        </LightPanel>
        </div>

        <div className="space-y-4">
          <LightPanel title="Tenant indices" eyebrow="Backend footprint" accent="#111111">
            <div className="grid grid-cols-2 gap-2">
              <IndexTile icon={Building2} label="Workspaces" value={indices.workspace.workspaces} color="#6d5dd3" />
              <IndexTile icon={Users} label="Teams" value={indices.workspace.teams} color="#2563eb" />
              <IndexTile icon={CalendarClock} label="Sprints" value={indices.delivery.sprints} color="#d89b00" />
              <IndexTile icon={Layers3} label="Boards" value={indices.delivery.boards} color="#059669" />
              <IndexTile icon={Gauge} label="Milestones" value={indices.delivery.milestones} color="#6d5dd3" />
              <IndexTile icon={AlertTriangle} label="Open risks" value={indices.delivery.openRisks} color={indices.delivery.openRisks > 0 ? "#dc2626" : "#059669"} />
              <IndexTile icon={Database} label="Files" value={indices.workspace.files} color="#5f574c" />
              <IndexTile icon={Link2} label="Webhooks" value={indices.workspace.webhooks} color="#2563eb" />
              <IndexTile icon={Sparkles} label="AI agents" value={indices.workspace.aiAgents} color="#6d5dd3" />
              <IndexTile icon={FileText} label="Reports" value={indices.workspace.reports} color="#d89b00" />
            </div>
            <div className="mt-3 rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
              <div className="flex items-center gap-2">
                <DollarSign className="size-4 text-[#059669]" aria-hidden="true" />
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8375]">Budget</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <MoneyStat label="Planned" value={indices.delivery.plannedBudget} />
                <MoneyStat label="Actual" value={indices.delivery.actualBudget} />
                <MoneyStat label="Variance" value={indices.delivery.budgetVariance} />
              </div>
            </div>
          </LightPanel>

          <LightPanel title="Recent users" eyebrow="Membership" accent="#2563eb">
            <div className="space-y-2">
              {users.map((tenantUser) => (
                <div key={tenantUser.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fbfaf6] px-3 py-2.5" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-black text-[#111111]">{tenantUser.email}</p>
                    <p className="truncate text-[10px] font-semibold text-[#766f63]">{tenantUser.roles?.map((role) => role.role.name).join(", ") || "Member"}</p>
                  </div>
                  <SoftBadge status={tenantUser.status ?? "UNKNOWN"} />
                </div>
              ))}
              {users.length === 0 ? <LightEmpty text="No users returned for this tenant." /> : null}
            </div>
          </LightPanel>

          <LightPanel title="Security posture" eyebrow="Platform guardrails" accent="#fbbf24">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <IndexTile icon={KeyRound} label="API keys" value={indices.security.apiKeys} color="#d89b00" />
              <IndexTile icon={ShieldCheck} label="MFA factors" value={indices.security.mfaFactors} color="#059669" />
              <IndexTile icon={Activity} label="Trusted devices" value={indices.security.trustedDevices} color="#2563eb" />
              <IndexTile icon={Building2} label="SSO providers" value={indices.security.ssoProviders} color="#6d5dd3" />
            </div>
            <div className="space-y-2">
              {[
                { label: "Tenant status is explicit", ok: tenant.status === "ACTIVE" || tenant.status === "TRIAL" },
                { label: "Security events tracked", ok: indices.security.totalSecurityEvents >= 0 },
                { label: "Platform actions audited", ok: indices.security.platformAuditLogs >= 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-[#fbfaf6] px-3 py-3" style={{ border: "1px solid #e7dfcf" }}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl" style={{ background: item.ok ? "#ecfdf5" : "#fff1f1", border: `1px solid ${item.ok ? "#bbf7d0" : "#fecaca"}` }}>
                    {item.ok ? <CheckCircle2 className="size-4 text-[#047857]" /> : <AlertTriangle className="size-4 text-[#dc2626]" />}
                  </span>
                  <span className="text-[12px] font-black text-[#111111]">{item.label}</span>
                </div>
              ))}
            </div>
          </LightPanel>

          <LightPanel title="Security events" eyebrow="Recent signals" accent="#dc2626">
            <div className="space-y-2">
              {(detail.recentSecurityEvents ?? []).map((event) => (
                <div key={event.id} className="rounded-2xl bg-[#fbfaf6] px-3 py-3" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12px] font-black text-[#111111]">{event.type}</p>
                    <SoftBadge status={event.status} />
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-[#766f63]">{event.severity} - {formatDate(event.createdAt)}</p>
                </div>
              ))}
              {(detail.recentSecurityEvents ?? []).length === 0 ? <LightEmpty text="No security events returned for this tenant." /> : null}
            </div>
          </LightPanel>
        </div>
      </section>
    </div>
  );
}

function DetailMetric({ color, icon: Icon, label, value }: { color: string; icon: typeof Building2; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none" style={{ color }}>{value}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${color}14`, border: `1px solid ${color}24` }}>
          <Icon className="size-4" style={{ color }} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function MiniIndex({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] px-3 py-3" style={{ border: "1px solid #e7dfcf" }}>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{label}</p>
      <p className="mt-1 text-xl font-black leading-none tabular-nums" style={{ color }}>{value}</p>
    </div>
  );
}

function ProjectMiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2" style={{ border: "1px solid #e7dfcf" }}>
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8a8375]">{label}</p>
      <p className="mt-1 text-[14px] font-black tabular-nums text-[#111111]">{value}</p>
    </div>
  );
}

function IndexTile({ color, icon: Icon, label, value }: { color: string; icon: typeof Building2; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-3" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}14`, border: `1px solid ${color}24` }}>
          <Icon className="size-3.5" style={{ color }} aria-hidden="true" />
        </span>
        <span className="text-lg font-black leading-none tabular-nums" style={{ color }}>{value}</span>
      </div>
      <p className="mt-2 truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8375]">{label}</p>
    </div>
  );
}

function MoneyStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8a8375]">{label}</p>
      <p className="mt-1 truncate text-[13px] font-black text-[#111111]">{formatMoney(value)}</p>
    </div>
  );
}

function OperationCard({ color, description, href, icon: Icon, label }: { color: string; description: string; href: string; icon: typeof Building2; label: string }) {
  return (
    <Link href={href} className="group rounded-[22px] bg-[#fbfaf6] p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_42px_rgba(17,17,17,0.08)]" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${color}14`, border: `1px solid ${color}24` }}>
          <Icon className="size-4" style={{ color }} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-black text-[#111111] group-hover:text-[#6d5dd3]">{label}</span>
          <span className="mt-1 line-clamp-2 block text-[11px] font-semibold leading-5 text-[#766f63]">{description}</span>
        </span>
      </div>
    </Link>
  );
}

function LightPanel({ accent, children, eyebrow, title }: { accent: string; children: ReactNode; eyebrow: string; title: string }) {
  return (
    <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
      <div className="border-b border-[#eee8dc] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-[3px] w-6 rounded-full" style={{ background: accent }} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">{eyebrow}</p>
        </div>
        <h2 className="mt-1 text-[15px] font-black text-[#111111]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function LightEmpty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] px-6 py-10 text-center text-[13px] font-bold text-[#766f63]" style={{ border: "1px dashed #d8cfbc" }}>
      {text}
    </div>
  );
}

function SoftBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const [bg, color, border] =
    ["ACTIVE", "RESOLVED", "COMPLETED"].includes(normalized) ? ["#ecfdf5", "#047857", "#bbf7d0"] :
    ["TRIAL", "OPEN", "INVITED", "PLANNING"].includes(normalized) ? ["#fff7d8", "#8a5a00", "#f4d26a"] :
    ["SUSPENDED", "CANCELLED", "REVOKED", "DEACTIVATED", "ARCHIVED", "ON_HOLD"].includes(normalized) ? ["#fff1f1", "#dc2626", "#fecaca"] :
    ["#f4f1e7", "#5f574c", "#ded8c8"];

  return (
    <span className="inline-flex h-6 items-center rounded-full px-2.5 text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: bg, color, border: `1px solid ${border}` }}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function sumRecord(record: Record<string, number>) {
  return Object.values(record).reduce((sum, value) => sum + value, 0);
}

function formatDate(value?: string | null) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
