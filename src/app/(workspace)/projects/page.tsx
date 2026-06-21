"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  List,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { getTenantEntitlements, listProjects, type BillingEntitlementFeature, type Project, type ProjectStatus } from "@/lib/api";
import { cn } from "@/lib/cn";
import { canCreateProjects, canViewProjectFinance, hasProjectAction } from "@/lib/project-permissions";
import {
  formatShortDate,
  getProjectHealth,
  projectStatusLabels,
  type ProjectHealth,
} from "@/lib/workspace-ui";

const STATUS_TABS: Array<"ALL" | ProjectStatus> = [
  "ALL",
  "ACTIVE",
  "PLANNING",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
];

const statusAccentColor: Record<ProjectStatus, string> = {
  ACTIVE: "#10b981",
  PLANNING: "#3b82f6",
  ON_HOLD: "#f59e0b",
  COMPLETED: "#8b5cf6",
  ARCHIVED: "#9ca3af",
};

const statusPillClass: Record<ProjectStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PLANNING: "bg-blue-50 text-blue-700 border-blue-200",
  ON_HOLD: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-violet-50 text-violet-700 border-violet-200",
  ARCHIVED: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function ProjectsPage() {
  const { auth } = useWorkspaceAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | ProjectStatus>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [projectEntitlement, setProjectEntitlement] = useState<BillingEntitlementFeature | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectPage, entitlementResult] = await Promise.all([
        listProjects(auth.accessToken),
        getTenantEntitlements(auth.accessToken).catch(() => null),
      ]);
      setProjects(projectPage.data);
      setProjectEntitlement(entitlementResult?.features.find((feature) => feature.key === "projects.limit") ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadProjects(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchStatus = status === "ALL" || p.status === status;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        p.team?.name?.toLowerCase().includes(q) ||
        p.workspace?.name?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [projects, query, status]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((p) => p.status === "ACTIVE").length,
      atRisk: projects.filter(
        (p) => getProjectHealth(p) === "At risk" || getProjectHealth(p) === "Needs review",
      ).length,
      completed: projects.filter((p) => p.status === "COMPLETED").length,
    }),
    [projects],
  );
  const activeProjectCount = projects.filter((project) => project.status !== "ARCHIVED").length;
  const projectLimit = projectEntitlement?.limit;
  const projectCreateRoleReason = canCreateProjects(auth.user)
    ? undefined
    : "Your workspace role cannot create projects.";
  const projectCreateDisabledReason =
    projectCreateRoleReason ??
    (projectEntitlement && projectLimit !== null && projectLimit !== undefined && activeProjectCount >= projectLimit
      ? `Your current plan includes ${projectLimit} active projects. Upgrade billing to create more.`
      : projectEntitlement && (!projectEntitlement.enabled || !projectEntitlement.allowed)
        ? "Project creation is not included in the current plan."
        : undefined);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_360px]">
      <section className="min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Projects</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Track scope, ownership, and delivery health across your portfolio.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadProjects()}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-sm font-medium text-foreground transition hover:bg-panel-muted"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden="true" />
              Refresh
            </button>
            {projectCreateDisabledReason ? (
              <button
                type="button"
                disabled
                title={projectCreateDisabledReason}
                className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-lg bg-primary/60 px-3 text-sm font-black text-[#111111] opacity-70"
              >
                <Plus className="size-4" aria-hidden="true" />
                New project
              </button>
            ) : (
              <Link
                href="/projects/create"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-black text-[#111111] shadow-[0_10px_30px_rgba(255,212,0,0.22)] transition hover:bg-primary-dark"
              >
                <Plus className="size-4" aria-hidden="true" />
                New project
              </Link>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={stats.total} Icon={FolderOpen} accent="#ffd400" />
          <StatCard label="Active" value={stats.active} Icon={Zap} accent="#10b981" />
          <StatCard label="At risk" value={stats.atRisk} Icon={AlertTriangle} accent="#f59e0b" />
          <StatCard label="Completed" value={stats.completed} Icon={CheckCircle2} accent="#8b5cf6" />
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-xl border border-line bg-panel p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, teams, workspaces…"
                type="search"
                className="h-9 w-full rounded-lg border border-line bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-ink-soft"
              />
            </label>
            <div className="flex rounded-lg border border-line bg-background p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-md transition",
                  viewMode === "grid"
                    ? "bg-panel shadow-sm text-foreground"
                    : "text-ink-soft hover:text-foreground",
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-md transition",
                  viewMode === "list"
                    ? "bg-panel shadow-sm text-foreground"
                    : "text-ink-soft hover:text-foreground",
                )}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>

          {/* Status tabs */}
          <div className="mt-2.5 flex gap-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => {
              const count =
                tab === "ALL"
                  ? projects.length
                  : projects.filter((p) => p.status === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatus(tab)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    status === tab
                      ? "bg-foreground text-white"
                      : "text-ink-soft hover:bg-panel-muted hover:text-foreground",
                  )}
                >
                  {tab === "ALL" ? "All" : projectStatusLabels[tab]}
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold",
                      status === tab ? "bg-white/20 text-white" : "bg-panel-muted text-ink-soft",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <ProjectSkeletons viewMode={viewMode} />
        ) : filteredProjects.length === 0 ? (
          <EmptyState canCreate={!projectCreateDisabledReason} />
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredProjects.map((project) => (
              <ProjectCardGrid key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-sm">
            {filteredProjects.map((project, i) => (
              <ProjectRowList
                key={project.id}
                project={project}
                last={i === filteredProjects.length - 1}
              />
            ))}
          </div>
        )}
      </section>

      <aside className="grid content-start gap-4">
        <ProjectLaunchPanel disabledReason={projectCreateDisabledReason} activeProjectCount={activeProjectCount} projectLimit={projectLimit} />
        <PortfolioMix projects={projects} />
      </aside>
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  accent,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</span>
        <span
          className="flex size-7 items-center justify-center rounded-lg"
          style={{ background: `${accent}22` }}
        >
          <Icon className="size-3.5" style={{ color: accent }} />
        </span>
      </div>
      <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function ProjectCardGrid({ project }: { project: Project }) {
  const health = getProjectHealth(project);
  const accent = statusAccentColor[project.status];
  const contractValue = Number(project.contractValue ?? 0);
  const location = projectLocationLabel(project);
  const canEdit = hasProjectAction(project, "editProject");
  const canViewFinance = canViewProjectFinance(project);

  return (
    <article className="group relative overflow-hidden rounded-xl border border-line bg-panel shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg">
      {/* Edit button — appears on card hover */}
      {canEdit ? (
      <Link
        href={`/projects/${project.id}/edit`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Edit project"
        className="absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-lg border border-line bg-panel text-ink-soft opacity-0 shadow-sm transition-all hover:border-primary hover:bg-panel-muted hover:text-foreground group-hover:opacity-100"
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </Link>
      ) : null}
      <div className="h-1 w-full" style={{ background: accent }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white"
              style={{ background: accent }}
            >
              {project.key.slice(0, 4)}
            </span>
            <div className="min-w-0">
              <Link
                href={`/projects/${project.id}`}
                className="block truncate text-sm font-bold text-foreground transition-colors hover:text-primary"
              >
                {project.name}
              </Link>
              <p className="mt-0.5 truncate text-xs text-ink-soft">
                {project.workspace?.name ?? "Workspace"} · {project.team?.name ?? "No team"}
              </p>
            </div>
          </div>
          <HealthBadge health={health} />
        </div>

        {canViewFinance && (project.clientName || location) && (
          <p className="mt-3 truncate text-xs font-medium text-ink-soft">
            {project.clientName || location}
          </p>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink-soft">Progress</span>
            <span className="font-bold text-foreground">{project.progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%`, background: accent }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-semibold",
              statusPillClass[project.status],
            )}
          >
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: accent }} />
            {projectStatusLabels[project.status]}
          </span>
          <span className="flex items-center gap-1 text-ink-soft">
            <Calendar className="size-3" aria-hidden="true" />
            {formatShortDate(project.dueDate)}
          </span>
          <span className="ml-auto font-semibold text-foreground">
            {project._count?.tasks ?? 0} tasks
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-soft">
          {canViewFinance ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-panel-muted px-2 py-1 font-semibold">
              <CircleDollarSign className="size-3" aria-hidden="true" />
              {formatMoney(contractValue, project.currency || "USD")}
            </span>
          ) : null}
          {canViewFinance && location && (
            <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-panel-muted px-2 py-1 font-semibold">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{location}</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function ProjectRowList({ project, last }: { project: Project; last: boolean }) {
  const health = getProjectHealth(project);
  const accent = statusAccentColor[project.status];
  const location = projectLocationLabel(project);
  const canEdit = hasProjectAction(project, "editProject");
  const canViewFinance = canViewProjectFinance(project);

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3 transition-colors hover:bg-panel-muted",
        !last && "border-b border-line",
      )}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white"
        style={{ background: accent }}
      >
        {project.key.slice(0, 4)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="truncate text-sm font-semibold text-foreground hover:underline"
          >
            {project.name}
          </Link>
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold",
              statusPillClass[project.status],
            )}
          >
            {projectStatusLabels[project.status]}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-ink-soft">
          {project.workspace?.name} · {project.team?.name ?? "No team"}
        </p>
        {canViewFinance && (project.clientName || location) && (
          <p className="mt-0.5 truncate text-xs text-ink-soft">
            {project.clientName || location}
            {` - ${formatMoney(Number(project.contractValue ?? 0), project.currency || "USD")}`}
          </p>
        )}
      </div>
      <div className="hidden shrink-0 items-center gap-4 sm:flex">
        <div className="w-20">
          <div className="mb-1 flex justify-between text-[10px]">
            <span className="text-ink-soft">Progress</span>
            <span className="font-bold text-foreground">{project.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-panel-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${project.progress}%`, background: accent }}
            />
          </div>
        </div>
        <span className="w-14 text-right text-xs text-ink-soft">
          {formatShortDate(project.dueDate)}
        </span>
        <HealthBadge health={health} />
        {canEdit ? (
          <Link
            href={`/projects/${project.id}/edit`}
            aria-label="Edit project"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-ink-soft transition hover:border-primary hover:bg-panel-muted hover:text-foreground"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function HealthBadge({ health }: { health: ProjectHealth }) {
  const map: Record<ProjectHealth, { cls: string; Icon: LucideIcon }> = {
    "On track": { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: BadgeCheck },
    "At risk": { cls: "bg-red-50 text-red-700 border-red-200", Icon: AlertTriangle },
    "Needs review": { cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: AlertTriangle },
    Complete: { cls: "bg-violet-50 text-violet-700 border-violet-200", Icon: CheckCircle2 },
  };
  const { cls, Icon } = map[health];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold",
        cls,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {health}
    </span>
  );
}

function EmptyState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-panel py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-panel-muted">
        <FolderOpen className="size-7 text-ink-soft" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-bold text-foreground">No projects found</h2>
      <p className="mt-1 text-sm text-ink-soft">Create a project or adjust your filters.</p>
      {canCreate ? (
        <Link
          href="/projects/create"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-[#111111] transition hover:bg-primary-dark"
        >
          <Plus className="size-4" aria-hidden="true" />
          Create project
        </Link>
      ) : null}
    </div>
  );
}

function ProjectLaunchPanel({
  activeProjectCount,
  disabledReason,
  projectLimit,
}: {
  activeProjectCount: number;
  disabledReason?: string;
  projectLimit?: number | null;
}) {
  const limitLabel = projectLimit === null || projectLimit === undefined ? "Unlimited" : `${activeProjectCount}/${projectLimit}`;

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-panel shadow-sm">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-[#111111]">
            <FolderPlus className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-foreground">Project setup</h2>
            <p className="text-xs font-medium text-ink-soft">Use the guided multi-step setup page.</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-line bg-background p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">Active</p>
            <p className="mt-1 text-xl font-black text-foreground">{activeProjectCount}</p>
          </div>
          <div className="rounded-xl border border-line bg-background p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">Plan limit</p>
            <p className="mt-1 text-xl font-black text-foreground">{limitLabel}</p>
          </div>
        </div>

        {disabledReason ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-red-700">
            {disabledReason}
          </div>
        ) : (
          <Link
            href="/projects/create"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-[#111111] shadow-[0_16px_40px_rgba(255,212,0,0.2)] transition hover:bg-primary-dark"
          >
            <Plus className="size-4" aria-hidden="true" />
            Start project setup
          </Link>
        )}
      </div>
    </section>
  );
}

function ProjectSkeletons({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex animate-pulse items-center gap-4 px-4 py-3",
              i < 4 && "border-b border-line",
            )}
          >
            <div className="size-8 rounded-lg bg-panel-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-48 rounded-md bg-panel-muted" />
              <div className="h-2.5 w-32 rounded-md bg-panel-muted" />
            </div>
            <div className="hidden h-3 w-24 rounded-md bg-panel-muted sm:block" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-line bg-panel shadow-sm"
        >
          <div className="h-1 bg-panel-muted" />
          <div className="space-y-4 p-5">
            <div className="flex gap-3">
              <div className="size-10 rounded-xl bg-panel-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 rounded-md bg-panel-muted" />
                <div className="h-2.5 w-1/2 rounded-md bg-panel-muted" />
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-panel-muted" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-md bg-panel-muted" />
              <div className="h-6 w-16 rounded-md bg-panel-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PortfolioMix({ projects }: { projects: Project[] }) {
  const total = Math.max(projects.length, 1);
  const rows = (["ACTIVE", "PLANNING", "ON_HOLD", "COMPLETED", "ARCHIVED"] as ProjectStatus[]).map(
    (s) => {
      const count = projects.filter((p) => p.status === s).length;
      return {
        status: s,
        label: projectStatusLabels[s],
        count,
        percent: Math.round((count / total) * 100),
        accent: statusAccentColor[s],
      };
    },
  );

  return (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Portfolio mix</h2>
        <span className="text-xs text-ink-soft">{projects.length} total</span>
      </div>

      {projects.length > 0 && (
        <div className="mt-3 flex h-2 overflow-hidden rounded-full">
          {rows
            .filter((r) => r.count > 0)
            .map((r) => (
              <div
                key={r.status}
                className="h-full transition-all duration-500"
                style={{ width: `${r.percent}%`, background: r.accent }}
              />
            ))}
        </div>
      )}

      <div className="mt-4 grid gap-3">
        {rows.map((row) => (
          <div key={row.status} className="flex items-center gap-2.5">
            <span className="size-2 shrink-0 rounded-full" style={{ background: row.accent }} />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
              {row.label}
            </span>
            <span className="tabular-nums text-xs font-bold text-ink-soft">{row.count}</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-panel-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${row.percent}%`, background: row.accent }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function projectLocationLabel(project: Project) {
  return [project.locationName, project.city, project.state, project.country]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(", ");
}

function formatMoney(value: number, currency?: string | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
