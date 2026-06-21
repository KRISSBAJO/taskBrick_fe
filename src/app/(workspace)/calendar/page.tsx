"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Gauge,
  KanbanSquare,
  Loader2,
  RefreshCw,
  Target,
  TimerReset,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  listProjects,
  listSprints,
  listTasks,
  updateTask,
  type Project,
  type Sprint,
  type Task,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatShortDate, isOpenTask } from "@/lib/workspace-ui";

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

const PRIORITY_STRIPE: Record<string, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  URGENT: "#f97316",
  CRITICAL: "#ef4444",
};

type PlanningView = "calendar" | "timeline" | "sprints" | "workload";

const VIEWS: Array<{ id: PlanningView; label: string; icon: LucideIcon }> = [
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "timeline", label: "Timeline", icon: KanbanSquare },
  { id: "sprints", label: "Sprints", icon: TimerReset },
  { id: "workload", label: "Workload", icon: Users },
];

export default function CalendarPage() {
  const { auth } = useWorkspaceAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeView, setActiveView] = useState<PlanningView>("calendar");
  const [projectId, setProjectId] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [draggingTaskId, setDraggingTaskId] = useState("");
  const [savingTaskId, setSavingTaskId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const selectedProject = projects.find((p) => p.id === projectId) ?? null;

  const loadPlanning = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [projectPage, taskPage, sprintPage] = await Promise.all([
        listProjects(auth.accessToken),
        listTasks(auth.accessToken, projectId ? { projectId } : {}),
        listSprints(auth.accessToken, projectId ? { projectId, limit: 100 } : { limit: 100 }),
      ]);
      setProjects(projectPage.data);
      setTasks(taskPage.data);
      setSprints(sprintPage.data);
    } catch (caught) {
      setMessage({ text: caught instanceof Error ? caught.message : "Unable to load planning calendar.", ok: false });
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, projectId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadPlanning(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadPlanning]);

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const sprintByDate = useMemo(() => groupSprintsByDate(sprints), [sprints]);
  const monthTasks = useMemo(
    () => tasks.filter((t) => t.dueDate && isSameMonth(new Date(t.dueDate), currentMonth)),
    [currentMonth, tasks],
  );
  const openTasks = tasks.filter(isOpenTask);
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && isOpenTask(t) && new Date(t.dueDate) < startOfDay(new Date()),
  );
  const scheduledTasks = tasks.filter((t) => t.dueDate).length;

  async function moveTaskToDate(taskId: string, date: Date) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setSavingTaskId(taskId);
    setMessage(null);
    try {
      const dueDate = toNoonIso(date);
      const updated = await updateTask(auth.accessToken, taskId, { dueDate });
      setTasks((cur) => cur.map((t) => (t.id === taskId ? updated : t)));
      setMessage({ text: `${task.key} moved to ${formatShortDate(dueDate)}.`, ok: true });
    } catch (caught) {
      setMessage({ text: caught instanceof Error ? caught.message : "Unable to move task date.", ok: false });
    } finally {
      setSavingTaskId("");
      setDraggingTaskId("");
    }
  }

  function onTaskDragStart(event: DragEvent, taskId: string) {
    event.dataTransfer.setData("text/task-id", taskId);
    event.dataTransfer.effectAllowed = "move";
    setDraggingTaskId(taskId);
  }

  function onDayDrop(event: DragEvent, date: Date) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id") || draggingTaskId;
    if (taskId) void moveTaskToDate(taskId, date);
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
          {/* Title + nav row */}
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-center gap-4">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: "linear-gradient(135deg,#ffe45c 0%,#ffd400 46%,#f6b900 100%)",
                  boxShadow: "0 0 20px rgba(255,212,0,0.35)",
                }}
              >
                <CalendarDays className="size-6 text-[#111111]" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Planning</p>
                <h1 className="text-2xl font-black text-white">{monthFormatter.format(currentMonth)}</h1>
              </div>
            </div>

            {/* Month nav */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.07] text-white transition hover:bg-white/[0.12]"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                className="tb-yellow-button inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-black"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.07] text-white transition hover:bg-white/[0.12]"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KpiChip label="This month" value={monthTasks.length} icon={CalendarDays} tone="yellow" loading={loading} />
            <KpiChip label="Open work" value={openTasks.length} icon={Target} tone="blue" loading={loading} />
            <KpiChip label="Overdue" value={overdueTasks.length} icon={AlertTriangle} tone={overdueTasks.length > 0 ? "red" : "green"} loading={loading} />
            <KpiChip label="Scheduled" value={`${scheduledTasks}/${tasks.length}`} icon={Gauge} tone="blue" loading={loading} />
          </div>

          {/* View tabs */}
          <div className="mt-5 flex gap-1 overflow-x-auto tb-scrollbar">
            {VIEWS.map((view) => {
              const active = activeView === view.id;
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView(view.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-black transition",
                    active
                      ? "bg-background text-foreground shadow-[0_-1px_0_0_var(--line)]"
                      : "text-white/45 hover:bg-white/[0.08] hover:text-white/80",
                  )}
                >
                  <Icon className="size-3.5" />
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Filter strip ── */}
      <div className="border-b border-line bg-panel px-6 py-3 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className={fieldClass}
            style={{ maxWidth: 280 }}
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.key} — {p.name}</option>
            ))}
          </select>
          {selectedProject ? (
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-black text-foreground">
              {selectedProject.key}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void loadPlanning()}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-background px-4 text-sm font-black text-foreground transition hover:bg-panel-muted"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Notices ── */}
      {message ? (
        <div className="px-6 pt-4 lg:px-8">
          <Notice message={message} />
        </div>
      ) : null}

      {/* ── View content ── */}
      <div className="flex-1 overflow-auto bg-background px-6 py-5 tb-scrollbar lg:px-8">
        {activeView === "calendar" && (
          <CalendarGrid
            days={calendarDays}
            loading={loading}
            month={currentMonth}
            onDayDrop={onDayDrop}
            onTaskDragStart={onTaskDragStart}
            savingTaskId={savingTaskId}
            scheduledCount={scheduledTasks}
            sprintsByDate={sprintByDate}
            tasksByDate={tasksByDate}
            totalTasks={tasks.length}
          />
        )}
        {activeView === "timeline" && (
          <Timeline loading={loading} month={currentMonth} projects={projects} sprints={sprints} tasks={tasks} />
        )}
        {activeView === "sprints" && (
          <SprintCalendar loading={loading} month={currentMonth} sprints={sprints} tasks={tasks} />
        )}
        {activeView === "workload" && (
          <WorkloadView days={calendarDays.filter((d) => d.inMonth)} loading={loading} tasks={tasks} />
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Calendar grid                                              */
/* ────────────────────────────────────────────────────────── */

type CalendarDay = { date: Date; inMonth: boolean };

function CalendarGrid({
  days,
  loading,
  month,
  onDayDrop,
  onTaskDragStart,
  savingTaskId,
  scheduledCount,
  sprintsByDate,
  tasksByDate,
  totalTasks,
}: {
  days: CalendarDay[];
  loading: boolean;
  month: Date;
  onDayDrop: (event: DragEvent, date: Date) => void;
  onTaskDragStart: (event: DragEvent, taskId: string) => void;
  savingTaskId: string;
  scheduledCount: number;
  sprintsByDate: Map<string, Sprint[]>;
  tasksByDate: Map<string, Task[]>;
  totalTasks: number;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-panel" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-ink-soft">
          {monthFormatter.format(month)}
        </p>
        <p className="text-xs font-semibold text-ink-soft">
          {scheduledCount}/{totalTasks} scheduled
        </p>
      </div>
      <div className="overflow-x-auto tb-scrollbar">
        <div className="min-w-[840px]">
          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(2026, 5, 14 + i);
              return (
                <div key={i} className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
                  {weekdayFormatter.format(d)}
                </div>
              );
            })}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const key = dateKey(day.date);
              const dayTasks = tasksByDate.get(key) ?? [];
              const daySprints = sprintsByDate.get(key) ?? [];
              const today = isSameDay(day.date, new Date());
              return (
                <div
                  key={key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDayDrop(e, day.date)}
                  className={cn(
                    "min-h-[120px] overflow-hidden rounded-2xl border p-2.5 transition-colors",
                    day.inMonth
                      ? today
                        ? "border-primary bg-panel shadow-[0_0_0_2px_rgba(255,212,0,0.12),0_1px_4px_rgba(0,0,0,0.06)]"
                        : "border-line bg-panel shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                      : "border-transparent bg-panel-muted/30 opacity-40",
                  )}
                >
                  {/* Day header */}
                  <div className="mb-2 flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-[11px] font-black",
                        today
                          ? "bg-primary text-[#111111]"
                          : day.inMonth
                            ? "text-foreground"
                            : "text-ink-soft",
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                    {day.inMonth && dayTasks.length > 0 ? (
                      <span className="text-[10px] font-semibold text-ink-soft">{dayTasks.length}</span>
                    ) : null}
                  </div>

                  {/* Sprint banner */}
                  {daySprints.slice(0, 1).map((sprint) => (
                    <Link
                      key={sprint.id}
                      href="/sprints"
                      className="mb-1.5 block truncate rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-black text-blue-600 transition hover:bg-blue-100"
                    >
                      {sprint.name}
                    </Link>
                  ))}

                  {/* Task chips */}
                  <div className="grid gap-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <TaskChip
                        key={task.id}
                        draggable
                        onDragStart={(e) => onTaskDragStart(e, task.id)}
                        saving={savingTaskId === task.id}
                        task={task}
                      />
                    ))}
                    {dayTasks.length > 3 ? (
                      <span className="block rounded-md bg-panel-muted px-1.5 py-0.5 text-center text-[10px] font-semibold text-ink-soft">
                        +{dayTasks.length - 3} more
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Timeline (Gantt-style)                                     */
/* ────────────────────────────────────────────────────────── */

function Timeline({
  loading,
  month,
  projects,
  sprints,
  tasks,
}: {
  loading: boolean;
  month: Date;
  projects: Project[];
  sprints: Sprint[];
  tasks: Task[];
}) {
  const days = buildLinearDays(month, 30);
  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-panel" />;

  return (
    <div className="rounded-2xl border border-line bg-panel shadow-sm">
      <div className="overflow-x-auto tb-scrollbar">
        <div className="min-w-[1000px]">
          {/* Header row */}
          <div
            className="grid border-b border-line"
            style={{ gridTemplateColumns: "220px repeat(30, minmax(24px,1fr))" }}
          >
            <div className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">Project</div>
            {days.map((day) => (
              <div
                key={dateKey(day)}
                className={cn(
                  "py-3 text-center text-[10px] font-black text-ink-soft",
                  isSameDay(day, new Date()) && "text-primary",
                )}
              >
                {day.getDate()}
              </div>
            ))}
          </div>

          {/* Project rows */}
          <div className="divide-y divide-line">
            {projects.slice(0, 12).map((project) => {
              const projectTasks = tasks.filter((t) => t.projectId === project.id);
              const projectSprints = sprints.filter((s) => s.projectId === project.id);
              return (
                <div
                  key={project.id}
                  className="grid items-center"
                  style={{ gridTemplateColumns: "220px 1fr" }}
                >
                  <div className="border-r border-line px-4 py-4">
                    <Link href={`/projects/${project.id}`} className="group">
                      <p className="truncate text-sm font-black text-foreground transition group-hover:text-primary-dark">
                        {project.name}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-ink-soft">
                        {project.key} · {project.progress}%
                      </p>
                    </Link>
                  </div>
                  <div
                    className="relative h-14"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${days.length}, minmax(24px,1fr))`,
                    }}
                  >
                    {/* Today marker */}
                    {days.map((day, i) =>
                      isSameDay(day, new Date()) ? (
                        <div
                          key={i}
                          className="pointer-events-none absolute inset-y-0 w-px bg-primary/40"
                          style={{ left: `${((i + 0.5) / days.length) * 100}%` }}
                        />
                      ) : null,
                    )}
                    {/* Absolute Gantt layer */}
                    <div className="absolute inset-1">
                      {projectSprints.map((sprint) => (
                        <TimelineBar
                          key={sprint.id}
                          color="#3b82f6"
                          dark={false}
                          days={days}
                          end={sprint.endDate ?? sprint.completedAt}
                          label={sprint.name}
                          start={sprint.startDate}
                        />
                      ))}
                      {projectTasks.filter((t) => t.dueDate).slice(0, 20).map((task) => (
                        <TimelineMarker key={task.id} days={days} task={task} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {!projects.length ? (
              <div className="p-6">
                <Empty icon={FolderOpen} text="No projects available for timeline planning." />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Sprint calendar                                            */
/* ────────────────────────────────────────────────────────── */

function SprintCalendar({
  loading,
  month,
  sprints,
  tasks,
}: {
  loading: boolean;
  month: Date;
  sprints: Sprint[];
  tasks: Task[];
}) {
  const days = buildLinearDays(month, 30);
  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-panel" />;

  return (
    <div className="grid gap-3">
      {sprints.length ? (
        sprints.map((sprint) => {
          const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
          const done = sprintTasks.filter((t) => t.status === "DONE").length;
          const pts = sprintTasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
          const completionPct = sprintTasks.length ? Math.round((done / sprintTasks.length) * 100) : 0;
          return (
            <article key={sprint.id} className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-black text-foreground">{sprint.name}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-ink-soft">
                    {formatShortDate(sprint.startDate)} — {formatShortDate(sprint.endDate)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-line bg-background px-2.5 py-1 text-xs font-black text-ink-soft">
                    {done}/{sprintTasks.length} done
                  </span>
                  <span className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-black text-foreground">
                    {pts} pts
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
              </div>
              {/* Gantt bar */}
              <div className="relative mt-3 h-10 overflow-hidden rounded-xl bg-panel-muted">
                <TimelineBar
                  color="#ffd400"
                  dark
                  days={days}
                  end={sprint.endDate ?? sprint.completedAt}
                  label={sprint.name}
                  start={sprint.startDate}
                />
              </div>
            </article>
          );
        })
      ) : (
        <Empty icon={TimerReset} text="No sprints found for this planning filter." />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Workload view                                              */
/* ────────────────────────────────────────────────────────── */

function WorkloadView({
  days,
  loading,
  tasks,
}: {
  days: CalendarDay[];
  loading: boolean;
  tasks: Task[];
}) {
  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-panel" />;
  const max = Math.max(...days.map((d) => tasksForDay(tasks, d.date).length), 1);

  return (
    <div className="grid gap-5">
      {/* Bar chart */}
      <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">
          Tasks due per day — {monthFormatter.format(days[0]?.date ?? new Date())}
        </p>
        <div className="flex h-48 items-end gap-1">
          {days.map((day) => {
            const dayTasks = tasksForDay(tasks, day.date);
            const critical = dayTasks.filter((t) => t.priority === "CRITICAL" || t.priority === "URGENT").length;
            const today = isSameDay(day.date, new Date());
            return (
              <div key={dateKey(day.date)} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div className="flex h-full w-full items-end rounded-lg bg-panel-muted p-0.5">
                  <div
                    className={cn(
                      "w-full rounded-md",
                      critical > 0 ? "bg-red-500" : today ? "bg-primary" : "bg-foreground/20",
                    )}
                    style={{ height: `${Math.max(4, Math.round((dayTasks.length / max) * 100))}%` }}
                    title={`${dayTasks.length} due${critical ? `, ${critical} critical` : ""}`}
                  />
                </div>
                <span
                  className={cn(
                    "text-[9px] font-black",
                    today ? "text-primary" : "text-ink-soft",
                  )}
                >
                  {day.date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-ink-soft">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-foreground/20" />Normal</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" />Critical/urgent</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />Today</span>
        </div>
      </div>

      {/* Busy days list */}
      {days.some((d) => tasksForDay(tasks, d.date).length > 0) ? (
        <div className="rounded-2xl border border-line bg-panel shadow-sm">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">Days with due tasks</p>
          </div>
          <div className="divide-y divide-line">
            {days
              .map((day) => ({ day, due: tasksForDay(tasks, day.date) }))
              .filter((item) => item.due.length > 0)
              .slice(0, 12)
              .map(({ day, due }) => {
                const crit = due.filter((t) => t.priority === "CRITICAL" || t.priority === "URGENT").length;
                return (
                  <div key={dateKey(day.date)} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div>
                      <p className="text-sm font-black text-foreground">{formatShortDate(day.date.toISOString())}</p>
                      <p className="mt-0.5 text-xs font-semibold text-ink-soft">
                        {due.length} task{due.length === 1 ? "" : "s"} due
                        {crit > 0 ? ` · ${crit} critical` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-black",
                        crit > 0
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-line bg-panel-muted text-ink-soft",
                      )}
                    >
                      {due.length}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Shared UI primitives                                       */
/* ────────────────────────────────────────────────────────── */

function TaskChip({
  draggable,
  onDragStart,
  saving,
  task,
}: {
  draggable?: boolean;
  onDragStart?: (event: DragEvent) => void;
  saving?: boolean;
  task: Task;
}) {
  const stripe = PRIORITY_STRIPE[task.priority] ?? "#94a3b8";
  return (
    <Link
      href={`/tasks/${task.id}`}
      draggable={draggable}
      onDragStart={onDragStart}
      className={cn(
        "flex items-stretch overflow-hidden rounded-lg border border-line bg-background transition hover:border-primary/60 hover:bg-panel-muted",
        saving && "opacity-60",
      )}
    >
      <span className="w-1 shrink-0" style={{ background: stripe }} />
      <span className="min-w-0 flex-1 px-1.5 py-1">
        <span className="block truncate text-[10px] font-black text-ink-soft">{task.key}</span>
        <span className="block truncate text-[11px] font-semibold text-foreground leading-tight">{task.title}</span>
      </span>
      {saving ? <Loader2 className="mr-1.5 mt-1.5 size-3 shrink-0 animate-spin text-ink-soft" /> : null}
    </Link>
  );
}

function TimelineBar({
  color,
  dark,
  days,
  end,
  label,
  start,
}: {
  color: string;
  dark?: boolean;
  days: Date[];
  end?: string | null;
  label: string;
  start?: string | null;
}) {
  const range = rangeToGrid(start, end, days);
  if (!range) return null;
  return (
    <div
      className={cn("absolute top-1/2 h-6 -translate-y-1/2 truncate rounded-lg px-2 text-[10px] font-black leading-6 shadow-sm", dark ? "text-[#111111]" : "text-white")}
      style={{ left: `${range.left}%`, width: `${range.width}%`, background: color }}
      title={label}
    >
      {label}
    </div>
  );
}

function TimelineMarker({ days, task }: { days: Date[]; task: Task }) {
  if (!task.dueDate) return null;
  const index = days.findIndex((d) => isSameDay(d, new Date(task.dueDate!)));
  if (index < 0) return null;
  return (
    <Link
      href={`/tasks/${task.id}`}
      className={cn(
        "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow",
        task.status === "DONE" ? "bg-emerald-500" : task.priority === "CRITICAL" ? "bg-red-500" : "bg-[#111111]",
      )}
      style={{ left: `${((index + 0.5) / days.length) * 100}%` }}
      title={`${task.key} — ${task.title}`}
    />
  );
}

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
        <p className="text-xl font-black" style={{ color }}>{loading ? "—" : value}</p>
      </div>
    </div>
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

function buildCalendarDays(month: Date): CalendarDay[] {
  const start = startOfMonth(month);
  const first = new Date(start);
  first.setDate(start.getDate() - first.getDay());
  return Array.from({ length: 42 }).map((_, i) => {
    const date = new Date(first);
    date.setDate(first.getDate() + i);
    return { date, inMonth: isSameMonth(date, month) };
  });
}

function buildLinearDays(start: Date, count: number) {
  return Array.from({ length: count }).map((_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
}

function groupTasksByDate(tasks: Task[]) {
  const map = new Map<string, Task[]>();
  tasks.forEach((task) => {
    if (!task.dueDate) return;
    const key = dateKey(new Date(task.dueDate));
    map.set(key, [...(map.get(key) ?? []), task]);
  });
  return map;
}

function groupSprintsByDate(sprints: Sprint[]) {
  const map = new Map<string, Sprint[]>();
  sprints.forEach((sprint) => {
    const start = sprint.startDate ? new Date(sprint.startDate) : null;
    const end = sprint.endDate ? new Date(sprint.endDate) : start;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const key = dateKey(date);
      map.set(key, [...(map.get(key) ?? []), sprint]);
    }
  });
  return map;
}

function tasksForDay(tasks: Task[], date: Date) {
  return tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), date));
}

function rangeToGrid(startVal: string | null | undefined, endVal: string | null | undefined, days: Date[]) {
  if (!startVal && !endVal) return null;
  const start = startVal ? new Date(startVal) : endVal ? new Date(endVal) : null;
  const end = endVal ? new Date(endVal) : start;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const startIndex = days.findIndex((d) => isSameDay(d, start) || d > start);
  const endIndex = days.findIndex((d) => isSameDay(d, end) || d > end);
  const left = Math.max(0, startIndex < 0 ? 0 : startIndex);
  const right = Math.min(days.length, (endIndex < 0 ? days.length - 1 : endIndex) + 1);
  return {
    left: (left / days.length) * 100,
    width: Math.max(3, ((right - left) / days.length) * 100),
  };
}

function addMonths(date: Date, delta: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + delta);
  return startOfMonth(next);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toNoonIso(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).toISOString();
}

const fieldClass =
  "h-9 w-full rounded-lg border border-line bg-background px-3 text-sm font-semibold text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none";
