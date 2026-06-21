"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Gauge,
  LineChart,
  Loader2,
  RefreshCw,
  Save,
  ShieldAlert,
  Target,
  Timer,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  createReport,
  getBudgetAnalytics,
  getCycleTimeAnalytics,
  getProjectHealthAnalytics,
  getSlaAnalytics,
  getTeamPerformanceAnalytics,
  getVelocityAnalytics,
  getAnalyticsOverview,
  listProjects,
  listReportExecutions,
  listReports,
  listSprints,
  listTasks,
  runAdHocReport,
  type AnalyticsOverview,
  type BudgetAnalytics,
  type CycleTimeAnalytics,
  type Project,
  type ProjectHealthAnalytics,
  type Report,
  type ReportExecution,
  type SlaAnalytics,
  type Sprint,
  type Task,
  type TeamPerformanceAnalytics,
  type VelocityAnalytics,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  formatShortDate,
  isOpenTask,
  isRiskTask,
  priorityLabels,
  taskStatusLabels,
  taskStatusOrder,
} from "@/lib/workspace-ui";

type ReportType =
  | "OVERVIEW"
  | "PROJECT_HEALTH"
  | "TEAM_PERFORMANCE"
  | "CYCLE_TIME"
  | "VELOCITY"
  | "BUDGET"
  | "SLA";

type ActiveTab = "overview" | "health" | "workload" | "velocity" | "budget" | "sla" | "saved";

const reportTypes: Array<{ type: ReportType; label: string }> = [
  { type: "OVERVIEW", label: "Executive overview" },
  { type: "PROJECT_HEALTH", label: "Project delivery" },
  { type: "TEAM_PERFORMANCE", label: "Team workload" },
  { type: "CYCLE_TIME", label: "Cycle time" },
  { type: "VELOCITY", label: "Sprint velocity" },
  { type: "BUDGET", label: "Budget utilization" },
  { type: "SLA", label: "SLA compliance" },
];

const STATUS_ACCENT: Record<string, string> = {
  BACKLOG: "#94a3b8",
  TODO: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  REVIEW: "#8b5cf6",
  TESTING: "#06b6d4",
  DONE: "#10b981",
  CANCELLED: "#6b7280",
};

const emptyOverview: AnalyticsOverview = {
  budget: { actual: 0, planned: 0 },
  openRisks: 0,
  overdueTasks: 0,
  projects: 0,
  tasks: {},
  time: { entries: 0, minutes: 0 },
};

const TABS: Array<{ id: ActiveTab; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "health", label: "Project health", icon: Gauge },
  { id: "workload", label: "Workload", icon: Users },
  { id: "velocity", label: "Velocity", icon: TrendingUp },
  { id: "budget", label: "Budget", icon: FileSpreadsheet },
  { id: "sla", label: "SLA", icon: Target },
  { id: "saved", label: "Saved reports", icon: Save },
];

export default function ReportsPage() {
  const { auth } = useWorkspaceAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [savedReports, setSavedReports] = useState<Report[]>([]);
  const [executions, setExecutions] = useState<ReportExecution[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview>(emptyOverview);
  const [projectHealth, setProjectHealth] = useState<ProjectHealthAnalytics>({ data: [], total: 0 });
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformanceAnalytics>({ data: [], total: 0 });
  const [cycleTime, setCycleTime] = useState<CycleTimeAnalytics>({ averageCycleTimeHours: 0, data: [], total: 0 });
  const [velocity, setVelocity] = useState<VelocityAnalytics>({ averageStoryPoints: 0, data: [], total: 0 });
  const [budget, setBudget] = useState<BudgetAnalytics>({ data: [], total: 0 });
  const [sla, setSla] = useState<SlaAnalytics>({ breached: 0, completedOnTime: 0, compliancePercent: 100, totalWithDueDate: 0 });
  const [projectId, setProjectId] = useState("");
  const [from, setFrom] = useState(() => dateInputDaysAgo(30));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [activeType, setActiveType] = useState<ReportType>("OVERVIEW");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [error, setError] = useState("");

  const filters = useMemo(
    () => ({
      projectId: projectId || undefined,
      from: from ? toNoonIso(from) : undefined,
      to: to ? toNoonIso(to) : undefined,
    }),
    [from, projectId, to],
  );

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage(null);
    try {
      const [
        projectPage,
        taskPage,
        sprintPage,
        savedPage,
        executionPage,
        overviewData,
        healthData,
        teamData,
        cycleData,
        velocityData,
        budgetData,
        slaData,
      ] = await Promise.all([
        listProjects(auth.accessToken),
        listTasks(auth.accessToken, projectId ? { projectId } : {}),
        listSprints(auth.accessToken, projectId ? { projectId, limit: 100 } : { limit: 100 }),
        listReports(auth.accessToken, { limit: 25 }),
        listReportExecutions(auth.accessToken, { limit: 12 }),
        getAnalyticsOverview(auth.accessToken, filters),
        getProjectHealthAnalytics(auth.accessToken, filters),
        getTeamPerformanceAnalytics(auth.accessToken, filters),
        getCycleTimeAnalytics(auth.accessToken, filters),
        getVelocityAnalytics(auth.accessToken, filters),
        getBudgetAnalytics(auth.accessToken, filters),
        getSlaAnalytics(auth.accessToken, filters),
      ]);

      setProjects(projectPage.data);
      setTasks(taskPage.data);
      setSprints(sprintPage.data);
      setSavedReports(savedPage.data);
      setExecutions(executionPage.data);
      setOverview(overviewData);
      setProjectHealth(healthData);
      setTeamPerformance(teamData);
      setCycleTime(cycleData);
      setVelocity(velocityData);
      setBudget(budgetData);
      setSla(slaData);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load reporting data.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, filters, projectId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadReports(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadReports]);

  const openTasks = useMemo(() => tasks.filter(isOpenTask), [tasks]);
  const blockedTasks = useMemo(
    () => tasks.filter((t) => isRiskTask(t) || t.priority === "CRITICAL" || t.priority === "URGENT"),
    [tasks],
  );
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "DONE"), [tasks]);
  const totalStoryPoints = tasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
  const completedStoryPoints = completedTasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
  const selectedProject = projects.find((p) => p.id === projectId) ?? null;

  const statusDistribution = useMemo(() => {
    const counts = Object.fromEntries(taskStatusOrder.map((s) => [s, 0])) as Record<string, number>;
    tasks.forEach((t) => { counts[t.status] = (counts[t.status] ?? 0) + 1; });
    return counts;
  }, [tasks]);

  const workload = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; open: number; done: number; points: number; critical: number }>();
    tasks.forEach((task) => {
      (task.assignees ?? []).forEach((assignment) => {
        const name = `${assignment.user.firstName ?? ""} ${assignment.user.lastName ?? ""}`.trim() || assignment.user.email;
        const cur = map.get(assignment.user.id) ?? { critical: 0, done: 0, email: assignment.user.email, id: assignment.user.id, name, open: 0, points: 0 };
        if (task.status === "DONE") cur.done += 1; else cur.open += 1;
        cur.points += task.storyPoints ?? 0;
        if (task.priority === "CRITICAL" || task.priority === "URGENT") cur.critical += 1;
        map.set(assignment.user.id, cur);
      });
    });
    return [...map.values()].sort((a, b) => b.open - a.open).slice(0, 8);
  }, [tasks]);

  const burndown = useMemo(() => buildBurndown(tasks, from, to), [from, tasks, to]);
  const productivity = useMemo(() => buildProductivityTrend(tasks), [tasks]);

  async function runReport(type = activeType) {
    setRunning(true);
    setMessage(null);
    try {
      const execution = await runAdHocReport(auth.accessToken, {
        type,
        parameters: filters,
        cacheKey: `${type}-${projectId || "all"}-${from}-${to}`,
      });
      setExecutions((cur) => [execution, ...cur.filter((e) => e.id !== execution.id)].slice(0, 12));
      setMessage({ text: `${labelForType(type)} report executed.`, ok: true });
    } catch (caught) {
      setMessage({ text: caught instanceof Error ? caught.message : "Unable to run report.", ok: false });
    } finally {
      setRunning(false);
    }
  }

  async function saveReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    if (!name) return;
    setSaving(true);
    setMessage(null);
    try {
      const report = await createReport(auth.accessToken, {
        cacheTtlSeconds: 900,
        description: String(fd.get("description") || ""),
        name,
        query: filters,
        status: "ACTIVE",
        type: activeType,
      });
      setSavedReports((cur) => [report, ...cur]);
      form.reset();
      setMessage({ text: "Report saved to the catalog.", ok: true });
    } catch (caught) {
      setMessage({ text: caught instanceof Error ? caught.message : "Unable to save report.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  function exportCurrentView() {
    const rows = [
      ["Metric", "Value"],
      ["Projects", String(overview.projects)],
      ["Tasks", String(tasks.length)],
      ["Open tasks", String(openTasks.length)],
      ["Completed tasks", String(completedTasks.length)],
      ["Blocked or critical", String(blockedTasks.length)],
      ["Completed story points", String(completedStoryPoints)],
      ["Total story points", String(totalStoryPoints)],
      ["SLA compliance", `${sla.compliancePercent}%`],
      ["Average cycle time hours", String(Math.round(cycleTime.averageCycleTimeHours * 10) / 10)],
      ["Velocity average points", String(Math.round(velocity.averageStoryPoints * 10) / 10)],
      ["Budget planned", String(overview.budget.planned)],
      ["Budget actual", String(overview.budget.actual)],
    ];
    downloadCsv(`taskbricks-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div className="flex min-h-0 flex-col">
      {/* ── Dark hero ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0f1117 0%,#161b27 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative px-6 pt-7 lg:px-8">
          {/* Title row */}
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-center gap-4">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: "linear-gradient(135deg,#ffe45c 0%,#ffd400 46%,#f6b900 100%)",
                  boxShadow: "0 0 20px rgba(255,212,0,0.35)",
                }}
              >
                <BarChart3 className="size-6 text-[#111111]" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Analytics</p>
                <h1 className="text-2xl font-black text-white">Reports</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => void runReport()}
                disabled={running}
                className="tb-yellow-button inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-60"
              >
                {running ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                Run report
              </button>
              <button
                type="button"
                onClick={exportCurrentView}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.07] px-4 text-sm font-black text-white transition hover:bg-white/[0.12]"
              >
                <Download className="size-4" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => void loadReports()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.07] px-4 text-sm font-black text-white transition hover:bg-white/[0.12]"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KpiChip label="Open tasks" value={openTasks.length} loading={loading} tone="yellow" icon={Target} />
            <KpiChip label="Blocked / urgent" value={blockedTasks.length} loading={loading} tone="red" icon={AlertTriangle} />
            <KpiChip label="SLA compliance" value={`${sla.compliancePercent}%`} loading={loading} tone="green" icon={Gauge} />
            <KpiChip label="Avg cycle time" value={`${Math.round(cycleTime.averageCycleTimeHours)}h`} loading={loading} tone="blue" icon={Timer} />
          </div>

          {/* Tab bar — merges into content below */}
          <div className="mt-5 flex gap-1 overflow-x-auto tb-scrollbar">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-black transition",
                    active
                      ? "bg-background text-foreground shadow-[0_-1px_0_0_var(--line)]"
                      : "text-white/45 hover:bg-white/[0.08] hover:text-white/80",
                  )}
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Filter strip ── */}
      <div className="border-b border-line bg-panel px-6 py-3 lg:px-8">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">
            Project
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={fieldClass}>
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.key} — {p.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={fieldClass} />
          </label>
          <label className="grid gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={fieldClass} />
          </label>
          <button
            type="button"
            onClick={() => void loadReports()}
            className="h-9 rounded-lg bg-foreground px-4 text-sm font-black text-white transition hover:bg-black"
          >
            Apply
          </button>
          {selectedProject ? (
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-black text-foreground">
              {selectedProject.key}
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Notices ── */}
      {(message ?? error) ? (
        <div className="px-6 pt-4 lg:px-8">
          {message ? <Notice message={message} /> : null}
          {error ? <Notice message={{ text: error, ok: false }} /> : null}
        </div>
      ) : null}

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-auto bg-background px-6 py-6 tb-scrollbar lg:px-8">
        {activeTab === "overview" && (
          <OverviewTab
            burndown={burndown}
            blockedTasks={blockedTasks}
            completedTasks={completedTasks}
            loading={loading}
            overview={overview}
            sprints={sprints}
            statusDistribution={statusDistribution}
            tasks={tasks}
          />
        )}
        {activeTab === "health" && (
          <HealthTab projectHealth={projectHealth} loading={loading} />
        )}
        {activeTab === "workload" && (
          <WorkloadTab
            loading={loading}
            productivity={productivity}
            teamPerformance={teamPerformance}
            workload={workload}
          />
        )}
        {activeTab === "velocity" && (
          <VelocityTab cycleTime={cycleTime} loading={loading} velocity={velocity} />
        )}
        {activeTab === "budget" && (
          <BudgetTab budget={budget} loading={loading} overview={overview} />
        )}
        {activeTab === "sla" && (
          <SlaTab loading={loading} sla={sla} />
        )}
        {activeTab === "saved" && (
          <SavedTab
            activeType={activeType}
            executions={executions}
            running={running}
            saveReport={saveReport}
            savedReports={savedReports}
            saving={saving}
            setActiveType={setActiveType}
            runReport={runReport}
          />
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Tab panels                                                 */
/* ────────────────────────────────────────────────────────── */

function OverviewTab({
  burndown,
  blockedTasks,
  completedTasks,
  loading,
  overview,
  sprints,
  statusDistribution,
  tasks,
}: {
  burndown: Array<{ label: string; open: number; done: number; percent: number }>;
  blockedTasks: Task[];
  completedTasks: Task[];
  loading: boolean;
  overview: AnalyticsOverview;
  sprints: Sprint[];
  statusDistribution: Record<string, number>;
  tasks: Task[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_300px]">
      {/* Burndown */}
      <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
        <PanelHeader eyebrow="Delivery trend" title="Sprint burndown" icon={LineChart} />
        <div className="mt-6">
          <BurndownChart points={burndown} loading={loading} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-semibold text-ink-soft">
          <span>{sprints.length} sprint{sprints.length === 1 ? "" : "s"}</span>
          <span>{completedTasks.length} tasks completed</span>
          <span>{tasks.length} tasks total</span>
        </div>
      </div>

      {/* Status distribution + quick stats */}
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <PanelHeader eyebrow="Flow distribution" title="Task status" icon={BarChart3} />
          <div className="mt-5 grid gap-4">
            {taskStatusOrder.map((status) => (
              <DistributionBar
                key={status}
                label={taskStatusLabels[status]}
                value={statusDistribution[status] ?? 0}
                total={tasks.length}
                color={STATUS_ACCENT[status]}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <QuickStat label="Overdue" value={overview.overdueTasks} danger={overview.overdueTasks > 0} />
          <QuickStat label="Open risks" value={overview.openRisks} danger={overview.openRisks > 0} />
          <QuickStat label="Hours tracked" value={Math.round((overview.time?.minutes ?? 0) / 60)} />
          <QuickStat label="Projects" value={overview.projects} />
        </div>
      </div>

      {/* Blocked tasks — full width */}
      {blockedTasks.length > 0 ? (
        <div className="rounded-2xl border border-line bg-panel shadow-sm xl:col-span-2">
          <div className="border-b border-line px-6 py-4">
            <PanelHeader eyebrow="Needs attention" title="Blocked and critical tasks" icon={ShieldAlert} />
          </div>
          <div className="divide-y divide-line">
            {blockedTasks.slice(0, 10).map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center gap-4 px-6 py-4 transition hover:bg-panel-muted"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50">
                  <AlertTriangle className="size-4 text-red-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-foreground">{task.title}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-ink-soft">
                    {task.key} · {taskStatusLabels[task.status]} · due {formatShortDate(task.dueDate)}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-black text-red-600">
                  {priorityLabels[task.priority]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HealthTab({
  projectHealth,
  loading,
}: {
  projectHealth: ProjectHealthAnalytics;
  loading: boolean;
}) {
  if (loading) return <Skeleton />;
  return (
    <div className="rounded-2xl border border-line bg-panel shadow-sm">
      <div className="border-b border-line px-6 py-4">
        <PanelHeader eyebrow="Delivery status" title="Project health" icon={Gauge} />
      </div>
      <div className="overflow-x-auto tb-scrollbar">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr>
              {["Project", "Health", "Completion", "Overdue", "Open risks", "Due date"].map((h) => (
                <th
                  key={h}
                  className="border-b border-line bg-panel-muted px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projectHealth.data.length ? (
              projectHealth.data.map((project) => (
                <tr key={project.id} className="transition hover:bg-panel-muted">
                  <td className="border-b border-line px-6 py-4">
                    <Link href={`/projects/${project.id}`} className="font-black text-foreground transition hover:text-primary-dark">
                      {project.name}
                    </Link>
                    <p className="mt-0.5 text-[11px] font-semibold text-ink-soft">{project.key}</p>
                  </td>
                  <td className="border-b border-line px-6 py-4">
                    <HealthPill score={project.healthScore} />
                  </td>
                  <td className="border-b border-line px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-panel-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${project.completion}%` }} />
                      </div>
                      <span className="text-xs font-black text-foreground">{project.completion}%</span>
                    </div>
                  </td>
                  <td className="border-b border-line px-6 py-4">
                    <span className={cn("text-sm font-black", project.overdueTasks > 0 ? "text-red-600" : "text-foreground")}>
                      {project.overdueTasks}
                    </span>
                  </td>
                  <td className="border-b border-line px-6 py-4">
                    <span className={cn("text-sm font-black", project.openRisks > 0 ? "text-amber-600" : "text-foreground")}>
                      {project.openRisks}
                    </span>
                  </td>
                  <td className="border-b border-line px-6 py-4 text-sm font-semibold text-ink-soft">
                    {formatShortDate(project.dueDate)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <Empty icon={Gauge} text="No project health data for these filters." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkloadTab({
  loading,
  productivity,
  teamPerformance,
  workload,
}: {
  loading: boolean;
  productivity: Array<{ label: string; done: number; percent: number }>;
  teamPerformance: TeamPerformanceAnalytics;
  workload: Array<{ id: string; name: string; email: string; open: number; done: number; points: number; critical: number }>;
}) {
  if (loading) return <Skeleton />;
  return (
    <div className="grid gap-6">
      {teamPerformance.data.length > 0 ? (
        <div className="rounded-2xl border border-line bg-panel shadow-sm">
          <div className="border-b border-line px-6 py-4">
            <PanelHeader eyebrow="Team-level throughput" title="Team performance" icon={Users} />
          </div>
          <div className="divide-y divide-line">
            {teamPerformance.data.slice(0, 6).map((team) => (
              <div key={team.id} className="flex items-center gap-6 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-black text-foreground">{team.name}</p>
                  <p className="text-xs font-semibold text-ink-soft">
                    {team.doneTasks}/{team.tasks} tasks · {Math.round(team.minutes / 60)}h tracked
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-panel-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${team.completionRate}%` }} />
                  </div>
                  <span className="w-10 text-right text-sm font-black text-foreground">{team.completionRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-line bg-panel shadow-sm">
        <div className="border-b border-line px-6 py-4">
          <PanelHeader eyebrow="Individual ownership" title="Member workload" icon={Users} />
        </div>
        {workload.length ? (
          <div className="divide-y divide-line">
            {workload.map((member) => {
              const total = member.open + member.done;
              const donePct = pct(member.done, total);
              return (
                <div
                  key={member.id}
                  className="grid items-center gap-4 px-6 py-4"
                  style={{ gridTemplateColumns: "minmax(180px,1fr) 140px 56px 56px 56px" }}
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-foreground">{member.name}</p>
                    <p className="truncate text-[11px] font-semibold text-ink-soft">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${donePct}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-foreground">{member.open}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ink-soft">Open</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-foreground">{member.done}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ink-soft">Done</p>
                  </div>
                  <div className="text-center">
                    <p className={cn("text-sm font-black", member.critical > 0 ? "text-red-600" : "text-foreground")}>
                      {member.critical}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ink-soft">Crit.</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            <Empty icon={Users} text="No assigned workload in this filtered set." />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
        <PanelHeader eyebrow="Last 7 days" title="Productivity trend" icon={TrendingUp} />
        <div className="mt-6 flex h-52 items-end gap-3">
          {productivity.map((item) => (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end rounded-xl bg-panel-muted p-1">
                <div
                  className="w-full rounded-lg bg-primary shadow-[0_6px_16px_rgba(255,212,0,0.18)]"
                  style={{ height: `${item.percent}%` }}
                  title={`${item.done} completed`}
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-ink-soft">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VelocityTab({
  cycleTime,
  loading,
  velocity,
}: {
  cycleTime: CycleTimeAnalytics;
  loading: boolean;
  velocity: VelocityAnalytics;
}) {
  if (loading) return <Skeleton />;
  const maxPts = Math.max(...velocity.data.map((s) => s.storyPoints), 1);
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
        <PanelHeader eyebrow="Sprint throughput" title="Sprint velocity" icon={TrendingUp} />
        <div className="mt-6">
          {velocity.data.length ? (
            <div className="flex h-52 items-end gap-2">
              {velocity.data.slice(0, 12).map((sprint) => {
                const barPct = Math.max(6, Math.round((sprint.storyPoints / maxPts) * 100));
                return (
                  <div key={sprint.id} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-full w-full items-end rounded-xl bg-panel-muted p-1">
                      <div
                        className="w-full rounded-lg bg-primary shadow-[0_6px_16px_rgba(255,212,0,0.18)]"
                        style={{ height: `${barPct}%` }}
                        title={`${sprint.storyPoints} pts — ${sprint.completedTasks} tasks`}
                      />
                    </div>
                    <span className="w-full truncate text-center text-[10px] font-black uppercase tracking-[0.08em] text-ink-soft">
                      {sprint.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty icon={TrendingUp} text="No velocity data for these filters." />
          )}
        </div>
        <div className="mt-5 flex items-center gap-4 rounded-xl border border-line bg-background p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">Average velocity</p>
            <p className="mt-1 text-3xl font-black text-foreground">
              {Math.round(velocity.averageStoryPoints * 10) / 10}
              <span className="ml-1.5 text-sm font-semibold text-ink-soft">pts / sprint</span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
        <PanelHeader eyebrow="Task flow efficiency" title="Cycle time" icon={Timer} />
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-line bg-background py-10 text-center">
          <div className="flex size-20 items-center justify-center rounded-full border-4 border-primary/30">
            <Timer className="size-9 text-primary" />
          </div>
          <p className="mt-4 text-5xl font-black text-foreground">
            {Math.round(cycleTime.averageCycleTimeHours * 10) / 10}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-soft">average hours per task</p>
          <p className="mt-3 text-[11px] font-semibold text-ink-soft">
            Based on {cycleTime.total} completed task{cycleTime.total === 1 ? "" : "s"}
          </p>
        </div>
        {cycleTime.data.length > 0 ? (
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line">
            {cycleTime.data.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-foreground">{item.title}</p>
                  <p className="text-[11px] font-semibold text-ink-soft">{item.key}</p>
                </div>
                <span className="ml-4 shrink-0 rounded-lg border border-line bg-background px-2 py-0.5 text-xs font-black text-ink-soft">
                  {Math.round(item.cycleTimeHours ?? 0)}h
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BudgetTab({
  budget,
  loading,
  overview,
}: {
  budget: BudgetAnalytics;
  loading: boolean;
  overview: AnalyticsOverview;
}) {
  if (loading) return <Skeleton />;
  const planned = Math.round(Number(overview.budget.planned) || 0);
  const actual = Math.round(Number(overview.budget.actual) || 0);
  const overBudget = planned > 0 && actual > planned;
  const usedPct = planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : 0;

  return (
    <div className="grid gap-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">Planned</p>
          <p className="mt-2 text-3xl font-black text-foreground">{planned.toLocaleString()}</p>
        </div>
        <div className={cn("rounded-2xl border bg-panel p-5 shadow-sm", overBudget ? "border-red-200" : "border-line")}>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">Actual</p>
          <p className={cn("mt-2 text-3xl font-black", overBudget ? "text-red-600" : "text-foreground")}>
            {actual.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">Utilization</p>
          <p className={cn("mt-2 text-3xl font-black", overBudget ? "text-red-600" : "text-foreground")}>
            {usedPct}%
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-muted">
            <div
              className={cn("h-full rounded-full", overBudget ? "bg-red-500" : "bg-primary")}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Per-project */}
      <div className="rounded-2xl border border-line bg-panel shadow-sm">
        <div className="border-b border-line px-6 py-4">
          <PanelHeader eyebrow="Per project" title="Budget breakdown" icon={FileSpreadsheet} />
        </div>
        {budget.data.length ? (
          <div className="divide-y divide-line">
            {budget.data.map((item) => {
              const over = item.utilizationPercent > 100;
              return (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-foreground">{item.project.name}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-ink-soft">
                      {item.currency} {Math.round(Number(item.actual)).toLocaleString()} / {Math.round(Number(item.planned)).toLocaleString()}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-muted">
                      <div
                        className={cn("h-full rounded-full", over ? "bg-red-500" : "bg-primary")}
                        style={{ width: `${Math.min(100, item.utilizationPercent)}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-lg border px-3 py-1 text-xs font-black",
                      over ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {item.utilizationPercent}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            <Empty icon={FileSpreadsheet} text="No budget analytics in this filtered set." />
          </div>
        )}
      </div>
    </div>
  );
}

function SlaTab({ loading, sla }: { loading: boolean; sla: SlaAnalytics }) {
  if (loading) return <Skeleton />;
  const good = sla.compliancePercent >= 90;
  const warn = sla.compliancePercent >= 70;
  const color = good ? "#10b981" : warn ? "#f59e0b" : "#ef4444";
  const ring = good ? "border-emerald-300" : warn ? "border-amber-300" : "border-red-300";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-panel px-8 py-12 shadow-sm">
        <div className={cn("flex size-36 items-center justify-center rounded-full border-8", ring)}>
          <div className="text-center">
            <p className="text-5xl font-black" style={{ color }}>{sla.compliancePercent}%</p>
            <p className="mt-1 text-xs font-semibold text-ink-soft">compliance</p>
          </div>
        </div>
        <p className="mt-6 text-lg font-black text-foreground">SLA compliance</p>
        <p className="mt-1 text-sm font-semibold text-ink-soft">Due-date adherence across all tasks</p>
      </div>

      <div className="grid gap-4">
        {[
          { label: "Tasks with due date", value: sla.totalWithDueDate, tone: "neutral" },
          { label: "Completed on time", value: sla.completedOnTime, tone: "green" },
          { label: "SLA breached", value: sla.breached, tone: sla.breached > 0 ? "red" : "neutral" },
        ].map(({ label, value, tone }) => (
          <div
            key={label}
            className={cn(
              "rounded-2xl border p-5 shadow-sm",
              tone === "red" ? "border-red-200 bg-red-50" : tone === "green" ? "border-emerald-200 bg-emerald-50" : "border-line bg-panel",
            )}
          >
            <p
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.14em]",
                tone === "red" ? "text-red-500" : tone === "green" ? "text-emerald-600" : "text-ink-soft",
              )}
            >
              {label}
            </p>
            <p
              className={cn(
                "mt-2 text-4xl font-black",
                tone === "red" ? "text-red-700" : tone === "green" ? "text-emerald-700" : "text-foreground",
              )}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedTab({
  activeType,
  executions,
  running,
  saveReport,
  savedReports,
  saving,
  setActiveType,
  runReport,
}: {
  activeType: ReportType;
  executions: ReportExecution[];
  running: boolean;
  saveReport: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  savedReports: Report[];
  saving: boolean;
  setActiveType: (t: ReportType) => void;
  runReport: (type?: ReportType) => Promise<void>;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        {/* Save form */}
        <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
          <PanelHeader eyebrow="Create" title="Save current view" icon={Save} />
          <form onSubmit={(e) => void saveReport(e)} className="mt-5 grid gap-3">
            <input name="name" required placeholder="Report name" className={fieldClass} />
            <select value={activeType} onChange={(e) => setActiveType(e.target.value as ReportType)} className={fieldClass}>
              {reportTypes.map((item) => (
                <option key={item.type} value={item.type}>{item.label}</option>
              ))}
            </select>
            <input name="description" placeholder="Description (optional)" className={fieldClass} />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-ink-soft">Saved with current project / date filters.</p>
              <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-[#111111] disabled:opacity-55">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save
              </button>
            </div>
          </form>
        </div>

        {/* Catalog */}
        <div className="rounded-2xl border border-line bg-panel shadow-sm">
          <div className="border-b border-line px-6 py-4">
            <PanelHeader eyebrow="Reusable" title="Report catalog" icon={FileSpreadsheet} />
          </div>
          {savedReports.length ? (
            <div className="divide-y divide-line">
              {savedReports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => {
                    setActiveType((report.type as ReportType) || "OVERVIEW");
                    void runReport((report.type as ReportType) || "OVERVIEW");
                  }}
                  className="group flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-panel-muted"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-primary">
                    <FileSpreadsheet className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-foreground">{report.name}</p>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-ink-soft">
                      {labelForType(report.type)} · {report.status}
                      {report.lastRunAt ? ` · last run ${formatShortDate(report.lastRunAt)}` : ""}
                    </p>
                  </div>
                  {running ? <Loader2 className="size-4 animate-spin text-ink-soft" /> : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <Empty icon={FileSpreadsheet} text="No saved reports yet." />
            </div>
          )}
        </div>
      </div>

      {/* Recent executions */}
      <div className="rounded-2xl border border-line bg-panel shadow-sm">
        <div className="border-b border-line px-6 py-4">
          <PanelHeader eyebrow="Audit trail" title="Recent executions" icon={CalendarDays} />
        </div>
        {executions.length ? (
          <div className="divide-y divide-line">
            {executions.map((execution) => (
              <div key={execution.id} className="flex items-start justify-between gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-foreground">{labelForType(execution.type)}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-ink-soft">
                    {formatShortDate(execution.completedAt ?? execution.startedAt ?? execution.createdAt)}
                    {execution.rowCount != null ? ` · ${execution.rowCount} rows` : ""}
                    {execution.durationMs ? ` · ${execution.durationMs}ms` : ""}
                  </p>
                  {execution.error ? (
                    <p className="mt-1 text-xs font-bold text-red-600">{execution.error}</p>
                  ) : null}
                </div>
                <ExecutionPill status={execution.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <Empty icon={CalendarDays} text="No executions yet." />
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Shared UI primitives                                       */
/* ────────────────────────────────────────────────────────── */

function KpiChip({
  icon: Icon,
  label,
  loading,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  loading: boolean;
  tone: "yellow" | "red" | "green" | "blue";
  value: string | number;
}) {
  const color =
    tone === "yellow" ? "#ffd400"
    : tone === "red" ? "#f87171"
    : tone === "green" ? "#34d399"
    : "#60a5fa";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <Icon className="size-5 shrink-0" style={{ color }} />
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/40">{label}</p>
        <p className="text-xl font-black" style={{ color }}>
          {loading ? "—" : value}
        </p>
      </div>
    </div>
  );
}

function PanelHeader({ eyebrow, icon: Icon, title }: { eyebrow: string; icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">{eyebrow}</p>
        <h2 className="text-sm font-black text-foreground">{title}</h2>
      </div>
    </div>
  );
}

function DistributionBar({ color, label, total, value }: { color: string; label: string; total: number; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-xs font-black text-foreground">{label}</span>
        <span className="text-xs font-black text-ink-soft">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-muted">
        <div className="h-full rounded-full" style={{ background: color, width: `${pct(value, total)}%` }} />
      </div>
    </div>
  );
}

function BurndownChart({
  loading,
  points,
}: {
  loading: boolean;
  points: Array<{ label: string; open: number; done: number; percent: number }>;
}) {
  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-panel-muted" />;
  return (
    <div className="rounded-xl border border-line bg-background p-4">
      <div className="flex h-56 items-end gap-1.5">
        {points.map((point) => (
          <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="relative flex h-48 w-full items-end overflow-hidden rounded-lg bg-panel-muted p-1">
              <div className="w-full rounded-md bg-[#111111]" style={{ height: `${point.percent}%` }} title={`${point.open} open`} />
              <div
                className="absolute bottom-1 left-1 right-1 rounded-md bg-primary/75"
                style={{ height: `${pct(point.done, point.open + point.done)}%` }}
                title={`${point.done} done`}
              />
            </div>
            <span className="truncate text-[10px] font-black uppercase tracking-[0.08em] text-ink-soft">{point.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] font-bold text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#111111]" />Open work</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />Done work</span>
      </div>
    </div>
  );
}

function QuickStat({ danger, label, value }: { danger?: boolean; label: string; value: number | string }) {
  return (
    <div className={cn("rounded-xl border p-4", danger ? "border-red-200 bg-red-50" : "border-line bg-panel")}>
      <p className={cn("text-2xl font-black", danger ? "text-red-700" : "text-foreground")}>{value}</p>
      <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">{label}</p>
    </div>
  );
}

function HealthPill({ score }: { score: number }) {
  const tone = score >= 75 ? "green" : score >= 45 ? "yellow" : "red";
  return (
    <span
      className={cn(
        "inline-flex rounded-lg border px-2.5 py-1 text-xs font-black",
        tone === "green" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "yellow" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "red" && "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {score}/100
    </span>
  );
}

function ExecutionPill({ status }: { status: string }) {
  const ok = status === "COMPLETED";
  const bad = status === "FAILED" || status === "CANCELLED";
  return (
    <span
      className={cn(
        "shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-black",
        ok && "border-emerald-200 bg-emerald-50 text-emerald-700",
        bad && "border-red-200 bg-red-50 text-red-700",
        !ok && !bad && "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {status}
    </span>
  );
}

function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line bg-background px-4 py-10 text-center">
      <Icon className="size-5 text-ink-soft" />
      <p className="mt-2 text-sm font-semibold text-ink-soft">{text}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-4">
      <div className="h-48 animate-pulse rounded-2xl bg-panel" />
      <div className="h-32 animate-pulse rounded-2xl bg-panel" />
    </div>
  );
}

function Notice({ message }: { message: { text: string; ok: boolean } }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-black",
        message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {message.text}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Pure helpers                                               */
/* ────────────────────────────────────────────────────────── */

function buildBurndown(tasks: Task[], from: string, to: string) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const days =
    Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
      ? 7
      : Math.max(1, Math.min(14, Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1));
  const maxOpen = Math.max(tasks.filter(isOpenTask).length, 1);

  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(start);
    if (Number.isNaN(date.getTime())) date.setTime(Date.now() - (days - index - 1) * 86_400_000);
    else date.setDate(start.getDate() + index);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const done = tasks.filter((t) => t.completedAt && new Date(t.completedAt) <= dayEnd).length;
    const open = Math.max(tasks.length - done, 0);
    return {
      done,
      label: date.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      open,
      percent: Math.max(8, Math.round((open / maxOpen) * 100)),
    };
  });
}

function buildProductivityTrend(tasks: Task[]) {
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const done = tasks.filter((t) => t.completedAt?.slice(0, 10) === key).length;
    return { done, label: date.toLocaleDateString("en-US", { weekday: "short" }), percent: 0 };
  });
  const max = Math.max(...days.map((d) => d.done), 1);
  return days.map((d) => ({ ...d, percent: Math.max(6, Math.round((d.done / max) * 100)) }));
}

function labelForType(type: string) {
  return reportTypes.find((r) => r.type === type)?.label ?? type.replaceAll("_", " ").toLowerCase();
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function dateInputDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function toNoonIso(value: string) {
  return new Date(`${value}T12:00:00`).toISOString();
}

function downloadCsv(fileName: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const fieldClass =
  "h-9 w-full rounded-lg border border-line bg-background px-3 text-sm font-semibold text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none";
