"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Clock3,
  FolderOpen,
  ListChecks,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { useToast } from "@/components/toast-provider";
import {
  listProjects,
  listTasks,
  listTeams,
  listWorkspaces,
  type PaginatedResponse,
  type Project,
  type Task,
  type TaskPriority,
  type TaskType,
  type Team,
  type Workspace,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  formatLongDate,
  formatShortDate,
  getProjectHealth,
  isOpenTask,
  isRiskTask,
  priorityLabels,
  projectStatusLabels,
  sortTasksForAttention,
  taskStatusLabels,
  type ProjectHealth,
} from "@/lib/workspace-ui";

type DashboardData = {
  projects: Project[];
  tasks: Task[];
  teams: Team[];
  workspaces: Workspace[];
};

type TrendPoint = {
  label: string;
  created: number;
  completed: number;
};

type WeeklyPoint = {
  label: string;
  value: number;
  isToday: boolean;
};

const healthConfig: Record<ProjectHealth, { color: string; className: string }> = {
  "On track": { color: "#10b981", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  "Needs review": { color: "#f59e0b", className: "border-amber-200 bg-amber-50 text-amber-700" },
  "At risk": { color: "#ef4444", className: "border-red-200 bg-red-50 text-red-700" },
  "Complete": { color: "#8b5cf6", className: "border-violet-200 bg-violet-50 text-violet-700" },
};

const priorityConfig: Record<TaskPriority, { dot: string; className: string; weight: number }> = {
  LOW: { dot: "bg-slate-400", className: "border-slate-200 bg-slate-100 text-slate-600", weight: 1 },
  MEDIUM: { dot: "bg-blue-400", className: "border-blue-200 bg-blue-50 text-blue-700", weight: 2 },
  HIGH: { dot: "bg-amber-500", className: "border-amber-200 bg-amber-50 text-amber-700", weight: 3 },
  URGENT: { dot: "bg-orange-500", className: "border-orange-200 bg-orange-50 text-orange-700", weight: 4 },
  CRITICAL: { dot: "bg-red-500", className: "border-red-200 bg-red-50 text-red-700", weight: 5 },
};

const projectAccent: Record<Project["status"], string> = {
  ACTIVE: "#10b981",
  PLANNING: "#3b82f6",
  ON_HOLD: "#f59e0b",
  COMPLETED: "#8b5cf6",
  ARCHIVED: "#9ca3af",
};

const typeAccent: Partial<Record<TaskType, string>> = {
  TASK: "#111111",
  STORY: "#3b82f6",
  BUG: "#ef4444",
  EPIC: "#8b5cf6",
  FEATURE: "#10b981",
  INCIDENT: "#f97316",
  APPROVAL: "#ffd400",
  CHANGE_REQUEST: "#06b6d4",
  MILESTONE: "#f59e0b",
};

export default function DashboardPage() {
  const { auth, user } = useWorkspaceAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData>({
    projects: [],
    tasks: [],
    teams: [],
    workspaces: [],
  });
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const canLoadTeams = canUsePermission(user.permissions, "manage:teams");
      const canLoadWorkspaces = canUsePermission(user.permissions, "manage:workspaces");
      const optionalFailures: string[] = [];

      const [projects, tasks] = await Promise.all([
        fetchAllPages((page) => listProjects(auth.accessToken, { page, limit: 100 })),
        fetchAllPages((page) => listTasks(auth.accessToken, { page, limit: 100, sortBy: "updatedAt", sortDirection: "desc" })),
      ]);

      const [teams, workspaces] = await Promise.all([
        canLoadTeams
          ? fetchAllPages((page) => listTeams(auth.accessToken, { page, limit: 100 })).catch(() => {
              optionalFailures.push("team scope");
              return [];
            })
          : Promise.resolve([]),
        canLoadWorkspaces
          ? fetchAllPages((page) => listWorkspaces(auth.accessToken, { page, limit: 100 })).catch(() => {
              optionalFailures.push("workspace scope");
              return [];
            })
          : Promise.resolve([]),
      ]);

      setData({ projects, tasks, teams, workspaces });

      if (optionalFailures.length) {
        toast({
          title: "Some dashboard sections were skipped",
          description: `${optionalFailures.join(" and ")} could not be loaded with your current permissions.`,
          variant: "warning",
        });
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to load dashboard data.";
      toast({ title: "Dashboard unavailable", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, toast, user.permissions]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  const metrics = useMemo(() => buildMetrics(data, now), [data, now]);
  const trend = useMemo(() => buildTrend(data.tasks), [data.tasks]);
  const distribution = useMemo(() => buildTaskDistribution(data.tasks), [data.tasks]);
  const weekly = useMemo(() => buildWeeklyPerformance(data.tasks), [data.tasks]);
  const health = useMemo(() => buildProjectHealth(data.projects), [data.projects]);
  const attentionTasks = useMemo(
    () => sortTasksForAttention(data.tasks.filter(isOpenTask)).slice(0, 8),
    [data.tasks],
  );
  const projectRows = useMemo(
    () =>
      [...data.projects]
        .sort((left, right) => {
          const healthDelta = healthWeight(getProjectHealth(right)) - healthWeight(getProjectHealth(left));
          if (healthDelta !== 0) return healthDelta;
          return right.progress - left.progress;
        })
        .slice(0, 10),
    [data.projects],
  );

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1480px] gap-4 overflow-hidden sm:gap-5">
      <section className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Live dashboard
            </span>
            <span className="rounded-full border border-line bg-panel px-3 py-1 text-[11px] font-bold text-ink-soft">
              {formatLongDate()}
            </span>
          </div>
          <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Delivery cockpit
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-ink-soft">
            Real portfolio, task, and team signals for {user.firstName || user.email}.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href="/projects"
            className="tb-yellow-button inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black"
          >
            Projects <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/board"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-panel px-4 text-sm font-bold text-foreground transition hover:bg-panel-muted"
          >
            <ListChecks className="size-4" aria-hidden="true" />
            Board
          </Link>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-line bg-panel text-ink-soft transition hover:bg-panel-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <TrendAnalysisCard
          loading={loading}
          metrics={metrics}
          trend={trend}
        />
        <TaskCompletionCard loading={loading} metrics={metrics} />
      </section>

      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          color="#10b981"
          icon={FolderOpen}
          label="Active projects"
          value={loading ? "--" : String(metrics.activeProjects)}
          sub={`${metrics.totalProjects} in portfolio`}
          trend={metrics.projectTrend}
        />
        <MetricCard
          color="#ffd400"
          icon={CheckCircle2}
          label="Delivery rate"
          value={loading ? "--" : `${metrics.deliveryRate}%`}
          sub={`${metrics.completedTasks} completed of ${metrics.totalTasks}`}
          trend={metrics.deliveryTrend}
        />
        <MetricCard
          color={metrics.riskTasks || metrics.atRiskProjects ? "#ef4444" : "#10b981"}
          icon={AlertTriangle}
          label="Risk pressure"
          value={loading ? "--" : String(metrics.riskTasks + metrics.atRiskProjects)}
          sub={`${metrics.riskTasks} critical tasks, ${metrics.atRiskProjects} projects`}
          trend={metrics.riskTrend}
          inverted
        />
        <MetricCard
          color="#8b5cf6"
          icon={Users}
          label="Team scope"
          value={loading ? "--" : String(metrics.totalMembers)}
          sub={`Across ${data.teams.length} teams and ${data.workspaces.length} workspaces`}
          trend={metrics.teamTrend}
        />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <PortfolioPanel loading={loading} projects={projectRows} />
        <RightNowPanel loading={loading} now={now} tasks={attentionTasks} />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <TaskDistributionCard distribution={distribution} loading={loading} />
        <TeamPerformanceCard loading={loading} points={weekly} />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ProjectHealthPanel health={health} loading={loading} />
        <WorkspaceScopePanel data={data} loading={loading} metrics={metrics} />
      </section>
    </div>
  );
}

function TrendAnalysisCard({
  loading,
  metrics,
  trend,
}: {
  loading: boolean;
  metrics: ReturnType<typeof buildMetrics>;
  trend: TrendPoint[];
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-black text-foreground">Trend analysis</h2>
          <p className="mt-0.5 text-xs font-medium text-ink-soft">
            Created and completed work over the last seven months
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LegendDot color="#10b981" label="Completed" />
          <LegendDot color="#ffd400" label="Created" />
        </div>
      </div>

      <div className="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        {loading ? (
          <div className="h-[280px] animate-pulse rounded-2xl bg-panel-muted" />
        ) : (
          <div className="min-w-0 overflow-hidden">
            <LineTrendChart trend={trend} />
          </div>
        )}

        <div className="grid content-start gap-3">
          <TrendSignal
            color="#10b981"
            icon={TrendingUp}
            label="Completed this period"
            value={String(sumTrend(trend, "completed"))}
            note={`${metrics.completedThisMonth} completed this month`}
          />
          <TrendSignal
            color="#ffd400"
            icon={CircleDot}
            label="Created this period"
            value={String(sumTrend(trend, "created"))}
            note={`${metrics.createdThisMonth} created this month`}
          />
          <TrendSignal
            color={metrics.openTasks > metrics.completedTasks ? "#f59e0b" : "#10b981"}
            icon={Clock3}
            label="Open workload"
            value={String(metrics.openTasks)}
            note={`${metrics.overdueTasks} overdue tasks`}
          />
        </div>
      </div>
    </div>
  );
}

function LineTrendChart({ trend }: { trend: TrendPoint[] }) {
  const width = 720;
  const height = 260;
  const pad = { left: 24, right: 20, top: 20, bottom: 42 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const maxValue = Math.max(1, ...trend.flatMap((point) => [point.created, point.completed]));
  const x = (index: number) => pad.left + (index / Math.max(1, trend.length - 1)) * innerWidth;
  const y = (value: number) => pad.top + (1 - value / maxValue) * innerHeight;
  const line = (key: "created" | "completed") =>
    trend.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(point[key]).toFixed(1)}`).join(" ");
  const area = (key: "created" | "completed") =>
    `${line(key)} L ${x(trend.length - 1).toFixed(1)} ${(pad.top + innerHeight).toFixed(1)} L ${pad.left} ${(pad.top + innerHeight).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block h-[220px] w-full max-w-full sm:h-[280px]">
      <defs>
        <linearGradient id="dashboard-completed-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="dashboard-created-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffd400" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffd400" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const rowY = pad.top + (1 - fraction) * innerHeight;
        return (
          <line
            key={fraction}
            x1={pad.left}
            x2={width - pad.right}
            y1={rowY}
            y2={rowY}
            stroke="#e8e3d4"
            strokeDasharray="6 8"
            strokeWidth="1"
          />
        );
      })}

      <path d={area("created")} fill="url(#dashboard-created-area)" />
      <path d={area("completed")} fill="url(#dashboard-completed-area)" />
      <path d={line("created")} fill="none" stroke="#ffd400" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      <path d={line("completed")} fill="none" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />

      {trend.map((point, index) => (
        <g key={point.label}>
          <circle cx={x(index)} cy={y(point.created)} r="6" fill="#fffdf3" stroke="#ffd400" strokeWidth="4" />
          <circle cx={x(index)} cy={y(point.completed)} r="6" fill="#fffdf3" stroke="#10b981" strokeWidth="4" />
          <text x={x(index)} y={height - 12} textAnchor="middle" className="fill-[#94a3b8] text-[13px] font-black">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function TaskCompletionCard({
  loading,
  metrics,
}: {
  loading: boolean;
  metrics: ReturnType<typeof buildMetrics>;
}) {
  const rows = [
    { label: "Completed", count: metrics.completedTasks, color: "#10b981" },
    { label: "In progress", count: metrics.inProgressTasks, color: "#ffd400" },
    { label: "Not started", count: metrics.notStartedTasks, color: "#cbd5e1" },
  ];
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (metrics.deliveryRate / 100) * circumference;

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-base font-black text-foreground">Task completion</h2>
        <p className="mt-0.5 text-xs font-medium text-ink-soft">Live status mix</p>
      </div>
      <div className="flex flex-col items-center px-5 py-6">
        {loading ? (
          <div className="size-[150px] animate-pulse rounded-full bg-panel-muted" />
        ) : (
          <div className="relative">
            <svg width="150" height="150" viewBox="0 0 150 150">
              <circle cx="75" cy="75" r={radius} fill="none" stroke="#eff0f3" strokeWidth="16" />
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                strokeWidth="16"
                transform="rotate(-90 75 75)"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-4xl font-black leading-none text-foreground">{metrics.deliveryRate}%</p>
                <p className="mt-1 text-[11px] font-black text-ink-soft">complete</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 w-full space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="size-2 rounded-full" style={{ background: row.color }} />
              <span className="flex-1 text-xs font-semibold text-ink-soft">{row.label}</span>
              <span className="text-sm font-black tabular-nums text-foreground">{loading ? "--" : row.count}</span>
              <span className="w-10 text-right text-[11px] font-semibold text-ink-soft">
                {loading || metrics.totalTasks === 0 ? "" : `${Math.round((row.count / metrics.totalTasks) * 100)}%`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  color,
  icon: Icon,
  inverted,
  label,
  sub,
  trend,
  value,
}: {
  color: string;
  icon: LucideIcon;
  inverted?: boolean;
  label: string;
  sub: string;
  trend: number;
  value: string;
}) {
  const trendGood = inverted ? trend <= 0 : trend >= 0;
  const TrendIcon = trend >= 0 ? TrendingUp : TrendingDown;

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
          <Icon className="size-5" style={{ color }} aria-hidden="true" />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black",
            trendGood ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
          )}
        >
          <TrendIcon className="size-3" aria-hidden="true" />
          {Math.abs(trend)}%
        </span>
      </div>
      <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-xs font-medium text-ink-soft">{sub}</p>
    </article>
  );
}

function PortfolioPanel({ loading, projects }: { loading: boolean; projects: Project[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-black text-foreground">Portfolio health</h2>
          <p className="mt-0.5 text-xs font-medium text-ink-soft">Projects ranked by delivery attention</p>
        </div>
        <Link href="/projects" className="inline-flex items-center gap-1 text-xs font-black text-primary">
          All projects <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-panel-muted" />
          ))}
        </div>
      ) : projects.length ? (
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.slice(0, 9).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState
          body="Create a project to see health, progress, risk, and delivery metrics here."
          cta="Create project"
          href="/projects"
          icon={FolderOpen}
          title="No projects yet"
        />
      )}
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const health = getProjectHealth(project);
  const accent = projectAccent[project.status];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group min-w-0 overflow-hidden rounded-2xl border border-line bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-lg px-2 py-1 text-[10px] font-black tracking-widest" style={{ background: `${accent}18`, color: accent }}>
          {project.key}
        </span>
        <HealthBadge health={health} />
      </div>
      <h3 className="mt-3 truncate text-sm font-black text-foreground group-hover:text-primary">{project.name}</h3>
      <p className="mt-1 truncate text-xs font-medium text-ink-soft">
        {project.team?.name ?? project.workspace?.name ?? "Workspace"}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-muted">
          <div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: accent }} />
        </div>
        <span className="text-xs font-black tabular-nums text-foreground">{project.progress}%</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-semibold text-ink-soft">
        <span>{projectStatusLabels[project.status]}</span>
        <span>{formatShortDate(project.dueDate)}</span>
      </div>
    </Link>
  );
}

function RightNowPanel({ loading, now, tasks }: { loading: boolean; now: number; tasks: Task[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-black text-foreground">Right now</h2>
          <p className="mt-0.5 text-xs font-medium text-ink-soft">Highest-priority open tasks</p>
        </div>
        <Zap className="size-5 text-primary" aria-hidden="true" />
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-panel-muted" />
          ))}
        </div>
      ) : tasks.length ? (
        <div className="divide-y divide-line">
          {tasks.map((task) => (
            <AttentionRow key={task.id} now={now} task={task} />
          ))}
        </div>
      ) : (
        <EmptyState
          body="There are no urgent open tasks in the current workspace data."
          icon={CheckCircle2}
          title="All clear"
        />
      )}
    </section>
  );
}

function AttentionRow({ now, task }: { now: number; task: Task }) {
  const priority = priorityConfig[task.priority] ?? priorityConfig.MEDIUM;
  const overdue = Boolean(task.dueDate && new Date(task.dueDate).getTime() < now);

  return (
    <Link
      href={`/projects/${task.projectId}?task=${task.id}`}
      className="group flex items-center gap-3 px-5 py-3 transition hover:bg-panel-muted/70"
    >
      <span className={cn("size-2.5 shrink-0 rounded-full", priority.dot)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground group-hover:text-primary">{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ink-soft">
          <span className="font-mono">{task.key}</span>
          <span>{taskStatusLabels[task.status]}</span>
          {task.dueDate ? (
            <span className={cn(overdue && "text-red-600")}>{overdue ? "Overdue" : formatShortDate(task.dueDate)}</span>
          ) : null}
        </div>
      </div>
      <span className={cn("rounded-full border px-2 py-1 text-[10px] font-black", priority.className)}>
        {priorityLabels[task.priority]}
      </span>
    </Link>
  );
}

function TaskDistributionCard({
  distribution,
  loading,
}: {
  distribution: Array<{ type: TaskType; count: number; percent: number; color: string }>;
  loading: boolean;
}) {
  const total = distribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-base font-black text-foreground">Task distribution</h2>
        <p className="mt-0.5 text-xs font-medium text-ink-soft">Live work by task type</p>
      </div>
      <div className="space-y-5 p-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-xl bg-panel-muted" />
          ))
        ) : distribution.length ? (
          distribution.map((item) => (
            <div key={item.type}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-xl text-[10px] font-black text-white" style={{ background: item.color }}>
                    {item.type.slice(0, 1)}
                  </span>
                  <span className="text-sm font-bold text-foreground">{titleCase(item.type)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-ink-soft">
                  <span>{item.count} tasks</span>
                  <span className="w-9 text-right font-black tabular-nums" style={{ color: item.color }}>
                    {item.percent}%
                  </span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-panel-muted">
                <div className="h-full rounded-full" style={{ width: `${item.percent}%`, background: item.color }} />
              </div>
            </div>
          ))
        ) : (
          <EmptyState body="Create tasks to see type distribution." icon={ListChecks} title="No tasks yet" />
        )}
      </div>
      {!loading && total > 0 ? (
        <div className="border-t border-line px-5 py-3 text-xs font-semibold text-ink-soft">
          {total} task{total === 1 ? "" : "s"} represented
        </div>
      ) : null}
    </section>
  );
}

function TeamPerformanceCard({ loading, points }: { loading: boolean; points: WeeklyPoint[] }) {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const best = points.reduce((winner, point) => (point.value > winner.value ? point : winner), points[0] ?? { label: "None", value: 0, isToday: false });
  const max = Math.max(1, ...points.map((point) => point.value));

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-base font-black text-foreground">Team performance</h2>
        <p className="mt-0.5 text-xs font-medium text-ink-soft">Completed work this week</p>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-panel-muted" />
        ) : (
          <div className="flex h-48 items-end justify-between gap-3 border-b border-line pb-6">
            {points.map((point) => (
              <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full max-w-16 items-end rounded-2xl bg-panel-muted">
                  <div
                    className={cn("w-full rounded-2xl", point.isToday ? "bg-primary" : "bg-[#111111]/75")}
                    style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }}
                    title={`${point.value} completed`}
                  />
                </div>
                <span className="text-xs font-black text-ink-soft">{point.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MiniStat label="This week" value={loading ? "--" : String(total)} note="tasks completed" />
          <MiniStat label="Best day" value={loading ? "--" : String(best.value)} note={`${best.label} peak output`} highlight />
        </div>
      </div>
    </section>
  );
}

function ProjectHealthPanel({
  health,
  loading,
}: {
  health: Array<{ label: ProjectHealth; count: number; percent: number; color: string }>;
  loading: boolean;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-black text-foreground">Project health mix</h2>
          <p className="mt-0.5 text-xs font-medium text-ink-soft">Portfolio status from real project dates and progress</p>
        </div>
        <BarChart3 className="size-5 text-ink-soft" aria-hidden="true" />
      </div>
      <div className="space-y-4 p-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-xl bg-panel-muted" />
          ))
        ) : (
          health.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span className="text-foreground">{item.label}</span>
                <span className="text-ink-soft">{item.count} projects</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-panel-muted">
                <div className="h-full rounded-full" style={{ width: `${item.percent}%`, background: item.color }} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function WorkspaceScopePanel({
  data,
  loading,
  metrics,
}: {
  data: DashboardData;
  loading: boolean;
  metrics: ReturnType<typeof buildMetrics>;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-black text-foreground">Workspace scope</h2>
          <p className="mt-0.5 text-xs font-medium text-ink-soft">Current operational surface</p>
        </div>
        <Shield className="size-5 text-ink-soft" aria-hidden="true" />
      </div>
      <div className="grid gap-3 p-5">
        <ScopeRow color="#3b82f6" icon={Shield} label="Workspaces" value={loading ? "--" : String(data.workspaces.length)} />
        <ScopeRow color="#8b5cf6" icon={Users} label="Teams" value={loading ? "--" : String(data.teams.length)} />
        <ScopeRow color="#f59e0b" icon={ListChecks} label="Open tasks" value={loading ? "--" : String(metrics.openTasks)} />
        <ScopeRow color="#ef4444" icon={AlertTriangle} label="Overdue tasks" value={loading ? "--" : String(metrics.overdueTasks)} />
      </div>
    </section>
  );
}

function TrendSignal({
  color,
  icon: Icon,
  label,
  note,
  value,
}: {
  color: string;
  icon: LucideIcon;
  label: string;
  note: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-soft">{label}</span>
        <Icon className="size-4" style={{ color }} aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-black text-foreground">{value}</p>
      <p className="mt-1 text-xs font-medium text-ink-soft">{note}</p>
    </div>
  );
}

function HealthBadge({ health }: { health: ProjectHealth }) {
  return (
    <span className={cn("rounded-full border px-2 py-1 text-[10px] font-black", healthConfig[health].className)}>
      {health}
    </span>
  );
}

function ScopeRow({
  color,
  icon: Icon,
  label,
  value,
}: {
  color: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-background px-4 py-3">
      <span className="flex size-9 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
        <Icon className="size-4" style={{ color }} aria-hidden="true" />
      </span>
      <span className="flex-1 text-sm font-bold text-foreground">{label}</span>
      <span className="text-lg font-black tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function MiniStat({
  highlight,
  label,
  note,
  value,
}: {
  highlight?: boolean;
  label: string;
  note: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-panel-muted px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">{label}</p>
      <p className={cn("mt-1 text-3xl font-black tabular-nums", highlight ? "text-primary" : "text-foreground")}>{value}</p>
      <p className="text-[11px] font-medium text-ink-soft">{note}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold text-ink-soft">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function EmptyState({
  body,
  cta,
  href,
  icon: Icon,
  title,
}: {
  body: string;
  cta?: string;
  href?: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="grid place-items-center px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl border border-line bg-panel-muted">
        <Icon className="size-6 text-ink-soft" aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-sm font-black text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-xs font-medium text-ink-soft">{body}</p>
      {href && cta ? (
        <Link href={href} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-[#111111]">
          {cta} <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

async function fetchAllPages<T>(loader: (page: number) => Promise<PaginatedResponse<T>>) {
  const first = await loader(1);
  const items = [...first.data];
  const totalPages = Math.min(first.totalPages || 1, 20);

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await loader(page);
    items.push(...next.data);
  }

  return items;
}

function canUsePermission(permissions: readonly string[] | undefined, permission: string) {
  const granted = new Set(permissions ?? []);
  if (granted.has("manage:all") || granted.has(permission)) return true;

  const subject = permission.split(":")[1];
  return subject ? granted.has(`manage:${subject}`) : false;
}

function buildMetrics(data: DashboardData, now: number) {
  const activeProjects = data.projects.filter((project) => project.status === "ACTIVE").length;
  const totalProjects = data.projects.length;
  const completedTasks = data.tasks.filter((task) => task.status === "DONE").length;
  const openTasks = data.tasks.filter(isOpenTask).length;
  const inProgressTasks = data.tasks.filter((task) => ["IN_PROGRESS", "REVIEW", "TESTING"].includes(task.status)).length;
  const notStartedTasks = data.tasks.filter((task) => ["BACKLOG", "TODO"].includes(task.status)).length;
  const riskTasks = data.tasks.filter(isRiskTask).length;
  const atRiskProjects = data.projects.filter((project) => getProjectHealth(project) === "At risk").length;
  const overdueTasks = data.tasks.filter((task) => isOpenTask(task) && task.dueDate && new Date(task.dueDate).getTime() < now).length;
  const totalMembers = data.teams.reduce((sum, team) => sum + (team._count?.members ?? 0), 0);
  const deliveryRate = data.tasks.length ? Math.round((completedTasks / data.tasks.length) * 100) : 0;
  const completedThisMonth = countTasksInCurrentMonth(data.tasks, (task) => task.status === "DONE", completedDateForTask);
  const createdThisMonth = countTasksInCurrentMonth(data.tasks, () => true, (task) => task.createdAt);

  return {
    activeProjects,
    atRiskProjects,
    completedTasks,
    completedThisMonth,
    createdThisMonth,
    deliveryRate,
    inProgressTasks,
    notStartedTasks,
    openTasks,
    overdueTasks,
    riskTasks,
    totalMembers,
    totalProjects,
    totalTasks: data.tasks.length,
    deliveryTrend: trendPercent(completedThisMonth, previousMonthTaskCount(data.tasks, (task) => task.status === "DONE", completedDateForTask)),
    projectTrend: trendPercent(activeProjects, Math.max(0, totalProjects - activeProjects)),
    riskTrend: trendPercent(riskTasks + atRiskProjects, Math.max(0, overdueTasks)),
    teamTrend: data.teams.length ? Math.round(totalMembers / data.teams.length) : 0,
  };
}

function buildTrend(tasks: Task[]): TrendPoint[] {
  return monthBuckets(6).map((bucket) => ({
    label: bucket.label,
    created: tasks.filter((task) => isWithin(task.createdAt, bucket.start, bucket.end)).length,
    completed: tasks.filter((task) => task.status === "DONE" && isWithin(completedDateForTask(task), bucket.start, bucket.end)).length,
  }));
}

function buildTaskDistribution(tasks: Task[]) {
  const counts = tasks.reduce((map, task) => {
    map.set(task.type, (map.get(task.type) ?? 0) + 1);
    return map;
  }, new Map<TaskType, number>());
  const total = Math.max(1, tasks.length);

  return Array.from(counts.entries())
    .map(([type, count]) => ({
      type,
      count,
      percent: Math.round((count / total) * 100),
      color: typeAccent[type] ?? "#64748b",
    }))
    .sort((left, right) => right.count - left.count);
}

function buildWeeklyPerformance(tasks: Task[]): WeeklyPoint[] {
  const today = new Date();
  const start = startOfWeek(today);
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const startDay = startOfDay(date);
    const endDay = endOfDay(date);
    return {
      label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      value: tasks.filter((task) => task.status === "DONE" && isWithin(completedDateForTask(task), startDay, endDay)).length,
      isToday: startDay.toDateString() === startOfDay(today).toDateString(),
    };
  });
}

function buildProjectHealth(projects: Project[]) {
  const total = Math.max(1, projects.length);
  const labels: ProjectHealth[] = ["On track", "Needs review", "At risk", "Complete"];
  return labels.map((label) => {
    const count = projects.filter((project) => getProjectHealth(project) === label).length;
    return {
      label,
      count,
      percent: Math.round((count / total) * 100),
      color: healthConfig[label].color,
    };
  });
}

function sumTrend(trend: TrendPoint[], key: "created" | "completed") {
  return trend.reduce((sum, point) => sum + point[key], 0);
}

function monthBuckets(monthsBack: number) {
  const now = new Date();
  return Array.from({ length: monthsBack + 1 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - monthsBack + index, 1);
    return {
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
      start: startOfDay(new Date(date.getFullYear(), date.getMonth(), 1)),
      end: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
    };
  });
}

function countTasksInCurrentMonth(
  tasks: Task[],
  predicate: (task: Task) => boolean,
  dateGetter: (task: Task) => string | null | undefined,
) {
  const now = new Date();
  const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  return tasks.filter((task) => predicate(task) && isWithin(dateGetter(task), start, end)).length;
}

function previousMonthTaskCount(
  tasks: Task[],
  predicate: (task: Task) => boolean,
  dateGetter: (task: Task) => string | null | undefined,
) {
  const now = new Date();
  const start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
  return tasks.filter((task) => predicate(task) && isWithin(dateGetter(task), start, end)).length;
}

function completedDateForTask(task: Task) {
  return task.completedAt ?? task.updatedAt ?? task.createdAt;
}

function isWithin(value: string | null | undefined, start: Date, end: Date) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time >= start.getTime() && time <= end.getTime();
}

function startOfWeek(value: Date) {
  const date = startOfDay(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function trendPercent(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function healthWeight(health: ProjectHealth) {
  if (health === "At risk") return 4;
  if (health === "Needs review") return 3;
  if (health === "On track") return 2;
  return 1;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
