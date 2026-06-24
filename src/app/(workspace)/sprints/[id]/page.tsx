"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock,
  FileText,
  Flag,
  Pencil,
  Plus,
  Play,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  apiRequest,
  completeSprint,
  createSprintRetrospective,
  deleteSprintRetrospective,
  listTasks,
  listSprintRetrospectives,
  startSprint,
  updateSprintRetrospective,
  type Sprint,
  type SprintRetrospective,
  type Task,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  formatShortDate,
  taskStatusLabels,
  userInitials,
} from "@/lib/workspace-ui";

// ── Color maps ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  BACKLOG:     "#94a3b8",
  TODO:        "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  REVIEW:      "#8b5cf6",
  DONE:        "#10b981",
  CANCELLED:   "#ef4444",
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444",
  URGENT:   "#f97316",
  HIGH:     "#f59e0b",
  MEDIUM:   "#3b82f6",
  LOW:      "#94a3b8",
};

const STATUS_ORDER = ["TODO", "IN_PROGRESS", "REVIEW", "BACKLOG", "DONE", "CANCELLED"] as const;

type RetrospectiveDraft = {
  wentWell: string;
  improve: string;
  actionItems: string;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function SprintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { auth } = useWorkspaceAuth();

  const [sprint,         setSprint]         = useState<Sprint | null>(null);
  const [tasks,          setTasks]          = useState<Task[]>([]);
  const [retrospectives, setRetrospectives] = useState<SprintRetrospective[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [retroSaving,    setRetroSaving]    = useState(false);
  const [editingRetroId, setEditingRetroId] = useState("");
  const [error,          setError]          = useState("");
  const [retroMessage,   setRetroMessage]   = useState<{ text: string; ok: boolean } | null>(null);
  const [retroDraft,     setRetroDraft]     = useState<RetrospectiveDraft>({ wentWell: "", improve: "", actionItems: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [sprintData, taskPage, retroData] = await Promise.all([
        apiRequest<Sprint>(`/agile/sprints/${id}`, { token: auth.accessToken, cache: "no-store" }),
        listTasks(auth.accessToken, { sprintId: id, limit: 200 }),
        listSprintRetrospectives(auth.accessToken, id),
      ]);
      setSprint(sprintData);
      setTasks(taskPage.data);
      setRetrospectives(retroData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sprint.");
    } finally { setLoading(false); }
  }, [auth.accessToken, id]);

  useEffect(() => { const t = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(t); }, [load]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const isActive    = Boolean(sprint?.startDate && !sprint.completedAt);
  const isCompleted = Boolean(sprint?.completedAt);
  const isPlanned   = Boolean(!sprint?.startDate && !sprint?.completedAt);

  const done      = tasks.filter((t) => t.status === "DONE").length;
  const inProg    = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "REVIEW").length;
  const pct       = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const daysLeft  = daysRemaining(sprint?.endDate);
  const overdue   = daysLeft !== null && daysLeft < 0;

  const statusGroups = useMemo(() => {
    const m: Record<string, number> = {};
    tasks.forEach((t) => { m[t.status] = (m[t.status] ?? 0) + 1; });
    return m;
  }, [tasks]);

  const sortedStatuses = STATUS_ORDER.filter((s) => (statusGroups[s] ?? 0) > 0);

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function onStart() {
    if (!sprint) return;
    setSaving(true);
    try { await startSprint(auth.accessToken, sprint.id); await load(); }
    catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function onComplete() {
    if (!sprint) return;
    setSaving(true);
    try { await completeSprint(auth.accessToken, sprint.id, { moveIncompleteToBacklog: true }); await load(); }
    catch { /* ignore */ }
    finally { setSaving(false); }
  }

  function resetRetroDraft() {
    setEditingRetroId("");
    setRetroDraft({ wentWell: "", improve: "", actionItems: "" });
  }

  function onEditRetrospective(retro: SprintRetrospective) {
    setEditingRetroId(retro.id);
    setRetroMessage(null);
    setRetroDraft({
      wentWell: retro.wentWell ?? "",
      improve: retro.improve ?? "",
      actionItems: actionItemsToText(retro.actionItems),
    });
  }

  async function onSaveRetrospective(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sprint) return;

    const payload = {
      wentWell: retroDraft.wentWell.trim() || undefined,
      improve: retroDraft.improve.trim() || undefined,
      actionItems: parseActionItems(retroDraft.actionItems),
    };

    if (!payload.wentWell && !payload.improve && payload.actionItems.length === 0) {
      setRetroMessage({ text: "Add notes or at least one action item.", ok: false });
      return;
    }

    setRetroSaving(true);
    setRetroMessage(null);
    try {
      if (editingRetroId) {
        await updateSprintRetrospective(auth.accessToken, sprint.id, editingRetroId, payload);
        setRetroMessage({ text: "Retrospective updated.", ok: true });
      } else {
        await createSprintRetrospective(auth.accessToken, sprint.id, payload);
        setRetroMessage({ text: "Retrospective added.", ok: true });
      }
      resetRetroDraft();
      setRetrospectives(await listSprintRetrospectives(auth.accessToken, sprint.id));
    } catch (err) {
      setRetroMessage({ text: err instanceof Error ? err.message : "Unable to save retrospective.", ok: false });
    } finally {
      setRetroSaving(false);
    }
  }

  async function onDeleteRetrospective(retro: SprintRetrospective) {
    if (!sprint) return;
    const ok = window.confirm("Delete this retrospective?");
    if (!ok) return;

    setRetroSaving(true);
    setRetroMessage(null);
    try {
      await deleteSprintRetrospective(auth.accessToken, sprint.id, retro.id);
      if (editingRetroId === retro.id) resetRetroDraft();
      setRetrospectives((current) => current.filter((item) => item.id !== retro.id));
      setRetroMessage({ text: "Retrospective deleted.", ok: true });
    } catch (err) {
      setRetroMessage({ text: err instanceof Error ? err.message : "Unable to delete retrospective.", ok: false });
    } finally {
      setRetroSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const statusBadge = isActive    ? { label: "Active",    bg: "#0c1a12", color: "#34d399", border: "rgba(52,211,153,0.25)" }
                    : isCompleted ? { label: "Completed",  bg: "#120b2a", color: "#a78bfa", border: "rgba(167,139,250,0.25)" }
                    :               { label: "Planned",    bg: "#0b1426", color: "#60a5fa", border: "rgba(96,165,250,0.25)"  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Back nav ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/sprints"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink-soft transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> All sprints
        </Link>
        {sprint && (
          <>
            <span className="text-ink-soft/30">/</span>
            <span className="text-[12px] font-bold text-foreground">{sprint.name}</span>
          </>
        )}
      </div>

      {/* ── Sprint header ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-[160px] animate-pulse rounded-2xl bg-panel-muted" />
      ) : sprint ? (
        <div
          className="relative overflow-hidden rounded-2xl border p-6"
          style={{ background: statusBadge.bg, borderColor: statusBadge.border }}
        >
          {/* grid bg */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative">

            {/* Title row */}
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2.5">
                  {isActive && (
                    <span className="relative flex size-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: statusBadge.color }} />
                      <span className="relative inline-flex size-2 rounded-full" style={{ background: statusBadge.color }} />
                    </span>
                  )}
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]"
                    style={{ background: `${statusBadge.color}18`, color: statusBadge.color }}
                  >
                    {statusBadge.label}
                  </span>
                </div>
                <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl">{sprint.name}</h1>
                {sprint.goal && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{sprint.goal}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.06] text-white/50 transition hover:text-white"
                >
                  <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                </button>
                {isPlanned && (
                  <button
                    type="button"
                    onClick={() => void onStart()}
                    disabled={saving}
                    className="tb-yellow-button inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-[13px] font-black disabled:opacity-50"
                  >
                    <Play className="size-4" /> Start sprint
                  </button>
                )}
                {isActive && (
                  <button
                    type="button"
                    onClick={() => void onComplete()}
                    disabled={saving}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-700/60 bg-emerald-950/60 px-4 text-[13px] font-black text-emerald-400 transition hover:bg-emerald-900/50 disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-4" /> Complete sprint
                  </button>
                )}
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-5 flex flex-wrap items-center gap-5 border-t pt-4" style={{ borderColor: `${statusBadge.color}18` }}>
              <StatChip icon={<Flag className="size-3" />} label={`${tasks.length} tasks`} color={statusBadge.color} />
              <StatChip icon={<CheckCircle2 className="size-3" />} label={`${done} done · ${pct}%`} color="#34d399" />
              {sprint.startDate && (
                <StatChip
                  icon={<CalendarDays className="size-3" />}
                  label={`${formatShortDate(sprint.startDate)} → ${sprint.endDate ? formatShortDate(sprint.endDate) : "—"}`}
                  color={statusBadge.color}
                />
              )}
              {daysLeft !== null && (
                <StatChip
                  icon={<Clock className="size-3" />}
                  label={overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                  color={overdue ? "#f87171" : "#34d399"}
                />
              )}
            </div>

            {/* Task completion bar */}
            {tasks.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[10px] font-semibold" style={{ color: `${statusBadge.color}80` }}>
                  <span>Task completion</span><span>{pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: `${statusBadge.color}14` }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: "#10b981" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error || "Sprint not found."}</div>
      )}

      {/* ── Body grid: task table + sidebar ──────────────────────────────────── */}
      {!loading && sprint && (
        <div className="grid gap-5 xl:grid-cols-[1fr_220px]">

          {/* Task table */}
          <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
            {/* Column headers */}
            <div
              className="sticky top-0 z-10 grid items-center border-b-2 border-line bg-panel-muted/90 px-5 py-3 backdrop-blur-sm"
              style={{ gridTemplateColumns: "minmax(0,1fr) 140px 110px 120px 72px 48px" }}
            >
              {["Title", "Status", "Assignee", "Due", "Pts", ""].map((col) => (
                <span key={col} className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft/65">{col}</span>
              ))}
            </div>

            {tasks.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-panel-muted">
                  <CircleDot className="size-5 text-ink-soft/40" />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-black text-foreground">No tasks in this sprint</p>
                  <p className="mt-1 text-[12px] text-ink-soft">Assign tasks from the board or project view.</p>
                </div>
              </div>
            ) : (
              tasks.map((task, idx) => (
                <SprintTaskRow key={task.id} task={task} isLast={idx === tasks.length - 1} />
              ))
            )}
          </div>

          {/* Sidebar: status breakdown */}
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
              <div className="border-b border-line px-4 py-3.5">
                <h3 className="text-[12px] font-black text-foreground">Status breakdown</h3>
              </div>
              <div className="space-y-2.5 p-4">
                {sortedStatuses.length === 0 ? (
                  <p className="text-[11px] text-ink-soft">No tasks yet.</p>
                ) : (
                  sortedStatuses.map((status) => {
                    const count = statusGroups[status] ?? 0;
                    const spct  = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
                    const color = STATUS_COLOR[status] ?? "#94a3b8";
                    return (
                      <div key={status}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full" style={{ background: color }} />
                            <span className="text-[11px] font-semibold text-foreground">
                              {taskStatusLabels[status as keyof typeof taskStatusLabels] ?? status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black tabular-nums text-foreground">{count}</span>
                            <span className="text-[10px] text-ink-soft/60">{spct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-muted">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${spct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
              <div className="border-b border-line px-4 py-3.5">
                <h3 className="text-[12px] font-black text-foreground">Progress</h3>
              </div>
              <div className="grid grid-cols-2 gap-px bg-line">
                {[
                  { label: "Total",       value: tasks.length, color: "#94a3b8" },
                  { label: "Completed",   value: done,         color: "#10b981" },
                  { label: "In Progress", value: inProg,       color: "#f59e0b" },
                  { label: "Remaining",   value: tasks.length - done - inProg, color: "#3b82f6" },
                ].map(({ color, label, value }) => (
                  <div key={label} className="flex flex-col bg-panel px-4 py-3.5">
                    <span className="text-[22px] font-black leading-none tabular-nums" style={{ color }}>{value}</span>
                    <span className="mt-1 text-[10px] font-semibold text-ink-soft">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && sprint && (
        <RetrospectivePanel
          draft={retroDraft}
          editingId={editingRetroId}
          message={retroMessage}
          retrospectives={retrospectives}
          saving={retroSaving}
          onCancel={resetRetroDraft}
          onDelete={onDeleteRetrospective}
          onDraftChange={setRetroDraft}
          onEdit={onEditRetrospective}
          onSubmit={onSaveRetrospective}
        />
      )}
    </div>
  );
}

// ── Task row ─────────────────────────────────────────────────────────────────

function SprintTaskRow({ isLast, task }: { isLast: boolean; task: Task }) {
  const assignee  = task.assignees?.[0]?.user;
  const sColor    = STATUS_COLOR[task.status]   ?? "#94a3b8";
  const priColor  = PRIORITY_COLOR[task.priority] ?? "#94a3b8";
  const [now]     = useState(() => Date.now());
  const overdue   = task.dueDate ? now > new Date(task.dueDate).getTime() : false;

  return (
    <article
      className={cn(
        "group relative grid items-center transition-colors hover:bg-panel-muted/40",
        !isLast && "border-b border-line/35",
      )}
      style={{ gridTemplateColumns: "minmax(0,1fr) 140px 110px 120px 72px 48px" }}
    >
      {/* Priority stripe */}
      <div className="absolute inset-y-0 left-0 w-[3px] opacity-70" style={{ background: priColor }} />

      {/* Title + key */}
      <div className="flex min-w-0 items-center gap-2.5 py-3 pl-5 pr-4">
        <span className="size-2 shrink-0 rounded-full" style={{ background: priColor }} title={`Priority: ${task.priority}`} />
        <span
          className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-[0.1em]"
          style={{ background: "#ffd40014", color: "#b8870a" }}
        >
          {task.key}
        </span>
        <Link
          href={`/projects/${task.projectId}?task=${task.id}`}
          className="min-w-0 truncate text-[13px] font-semibold text-foreground transition hover:text-primary"
          title={task.title}
        >
          {task.title}
        </Link>
      </div>

      {/* Status */}
      <div className="py-3 pr-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
          style={{ background: `${sColor}14`, color: sColor }}
        >
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: sColor }} />
          {taskStatusLabels[task.status as keyof typeof taskStatusLabels] ?? task.status}
        </span>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-2 py-3 pr-3">
        {assignee ? (
          <>
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-lg text-[8px] font-black text-white shadow-sm"
              style={{ background: "#1f1f1f" }}
              title={`${assignee.firstName} ${assignee.lastName}`}
            >
              {userInitials(assignee)}
            </span>
            <span className="truncate text-[11px] font-medium text-foreground/70">{assignee.firstName}</span>
          </>
        ) : (
          <span className="text-[11px] text-ink-soft/30">—</span>
        )}
      </div>

      {/* Due date */}
      <div className="py-3 pr-3">
        {task.dueDate ? (
          <span className={cn("text-[11px] font-semibold", overdue ? "text-red-600" : "text-ink-soft")}>
            {overdue ? "Overdue" : formatShortDate(task.dueDate)}
          </span>
        ) : (
          <span className="text-[11px] text-ink-soft/30">—</span>
        )}
      </div>

      {/* Points */}
      <div className="py-3 pr-3">
        {task.storyPoints != null ? (
          <span className="inline-flex items-center rounded-lg bg-panel-muted px-2 py-0.5 text-[11px] font-black text-foreground">
            {task.storyPoints}
          </span>
        ) : (
          <span className="text-[11px] text-ink-soft/30">—</span>
        )}
      </div>

      {/* Link arrow */}
      <div className="flex justify-center py-3">
        <Link
          href={`/projects/${task.projectId}?task=${task.id}`}
          className="flex size-7 items-center justify-center rounded-lg text-ink-soft/20 opacity-0 transition hover:bg-panel-muted hover:text-foreground group-hover:opacity-100"
          aria-label="Open task"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 7h10v10M7 17 17 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

function RetrospectivePanel({
  draft,
  editingId,
  message,
  retrospectives,
  saving,
  onCancel,
  onDelete,
  onDraftChange,
  onEdit,
  onSubmit,
}: {
  draft: RetrospectiveDraft;
  editingId: string;
  message: { text: string; ok: boolean } | null;
  retrospectives: SprintRetrospective[];
  saving: boolean;
  onCancel: () => void;
  onDelete: (retro: SprintRetrospective) => void;
  onDraftChange: Dispatch<SetStateAction<RetrospectiveDraft>>;
  onEdit: (retro: SprintRetrospective) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const filteredRetrospectives = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return retrospectives;

    return retrospectives.filter((retro) => {
      const text = [
        retro.wentWell,
        retro.improve,
        actionItemsToText(retro.actionItems),
        formatShortDate(retro.createdAt),
      ].join(" ").toLowerCase();
      return text.includes(term);
    });
  }, [query, retrospectives]);
  const formOpen = creating || Boolean(editingId);

  function startCreate() {
    onCancel();
    setCreating(true);
  }

  function startEdit(retro: SprintRetrospective) {
    setCreating(false);
    onEdit(retro);
  }

  return (
    <section className="grid gap-5 rounded-2xl border border-line bg-panel p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-dark">Sprint closeout</p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-foreground">Retrospectives</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-ink-soft">
              Capture what worked, what needs correction, and the action items that must survive the ceremony.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full border border-line bg-panel-muted px-3 py-1 text-xs font-black text-ink-soft">
              {retrospectives.length} notes
            </span>
            <button
              type="button"
              onClick={startCreate}
              className="tb-yellow-button inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              New note
            </button>
          </div>
        </div>

        <label className="mt-5 flex h-11 items-center gap-2 rounded-2xl border border-line bg-white px-3 text-sm font-bold text-foreground shadow-sm">
          <Search className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-soft/45"
            placeholder="Search retrospective notes"
          />
        </label>

        <div className="mt-4 max-h-[560px] overflow-y-auto pr-2 tb-scrollbar">
          {filteredRetrospectives.length ? (
            <div className="grid gap-2">
              {filteredRetrospectives.map((retro) => {
              const actions = Array.isArray(retro.actionItems) ? retro.actionItems : [];
              return (
                <article
                  key={retro.id}
                  className={cn(
                    "rounded-2xl border bg-white px-4 py-3 shadow-sm transition",
                    editingId === retro.id ? "border-primary shadow-[0_16px_36px_rgba(255,212,0,0.16)]" : "border-line",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
                        {formatShortDate(retro.createdAt)}
                      </p>
                      <h3 className="mt-1 truncate text-sm font-black text-foreground">Retrospective note</h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(retro)}
                        className="flex size-8 items-center justify-center rounded-xl text-ink-soft transition hover:bg-panel-muted hover:text-foreground"
                        aria-label="Edit retrospective"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(retro)}
                        className="flex size-8 items-center justify-center rounded-xl text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete retrospective"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <CompactRetroText label="Went well" value={retro.wentWell} />
                    <CompactRetroText label="Improve" value={retro.improve} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-panel-muted px-3 py-2">
                    <span className="truncate text-xs font-semibold text-ink-soft">
                      {actions.length ? actionItemsToText(actions) : "No action items"}
                    </span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-ink-soft">
                      {actions.length} actions
                    </span>
                  </div>
                </article>
              );
            })}
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary-dark">
                <FileText className="size-5" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-black text-foreground">{query.trim() ? "No matching notes" : "No retrospective recorded"}</p>
              <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-ink-soft">
                {query.trim() ? "Try another search term." : "Add the first closeout note before completing or archiving this sprint."}
              </p>
            </div>
          )}
        </div>
      </div>

      {formOpen ? (
      <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-[#f8f6ef] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-dark">
              {editingId ? "Edit note" : "New note"}
            </p>
            <h3 className="mt-1 text-base font-black text-foreground">
              {editingId ? "Update retrospective" : "Add retrospective"}
            </h3>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                onCancel();
              }}
              className="flex size-8 items-center justify-center rounded-xl text-ink-soft transition hover:bg-white hover:text-foreground"
              aria-label="Cancel edit"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4">
          <RetrospectiveField label="What went well">
            <textarea
              value={draft.wentWell}
              onChange={(event) => onDraftChange((current) => ({ ...current, wentWell: event.target.value }))}
              rows={4}
              className={retroInputClass}
              placeholder="Wins, patterns, team behaviors, delivery strengths"
            />
          </RetrospectiveField>

          <RetrospectiveField label="What should improve">
            <textarea
              value={draft.improve}
              onChange={(event) => onDraftChange((current) => ({ ...current, improve: event.target.value }))}
              rows={4}
              className={retroInputClass}
              placeholder="Bottlenecks, process gaps, quality risks, handoff issues"
            />
          </RetrospectiveField>

          <RetrospectiveField label="Action items">
            <textarea
              value={draft.actionItems}
              onChange={(event) => onDraftChange((current) => ({ ...current, actionItems: event.target.value }))}
              rows={5}
              className={retroInputClass}
              placeholder={"One action per line\nExample: Tighten QA handoff before review"}
            />
          </RetrospectiveField>
        </div>

        {message ? (
          <div
            className={cn(
              "mt-4 rounded-2xl border px-3 py-2 text-sm font-black",
              message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {message.text}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                onCancel();
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-4 text-sm font-black text-foreground transition hover:bg-panel-muted"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="tb-yellow-button inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            {saving ? "Saving..." : editingId ? "Save note" : "Add note"}
          </button>
        </div>
      </form>
      ) : (
        <div className="flex min-h-[360px] flex-col justify-between rounded-2xl border border-line bg-[#111111] p-5 text-white shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Retrospective log</p>
            <h3 className="mt-2 text-xl font-black tracking-tight">Compact by design</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
              Notes stay in a bounded searchable list, so the sprint page stays usable even when the archive grows.
            </p>
          </div>
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-3xl font-black text-primary">{retrospectives.length}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-white/45">Total notes</p>
            </div>
            <button
              type="button"
              onClick={startCreate}
              className="tb-yellow-button inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add retrospective
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function CompactRetroText({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-line bg-panel-muted/45 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-foreground">
        {value?.trim() || "No notes yet."}
      </p>
    </div>
  );
}

function RetrospectiveField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black text-foreground">{label}</span>
      {children}
    </label>
  );
}

const retroInputClass = "w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition placeholder:text-ink-soft/45 focus:border-primary focus:ring-4 focus:ring-primary/15";

// ── Small helpers ─────────────────────────────────────────────────────────────

function parseActionItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((title) => ({ title, done: false }));
}

function actionItemsToText(items: SprintRetrospective["actionItems"]) {
  if (!Array.isArray(items)) return "";
  return items.map(actionItemTitle).filter(Boolean).join("\n");
}

function actionItemTitle(item: unknown) {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const title = record.title ?? record.text ?? record.label ?? record.name;
    if (typeof title === "string") return title;
  }
  return "";
}

function StatChip({ color, icon, label }: { color: string; icon: ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color }}>
      {icon} {label}
    </span>
  );
}

function daysRemaining(endDate?: string | null): number | null {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
