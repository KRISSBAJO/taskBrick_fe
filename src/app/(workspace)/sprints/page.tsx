"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock,
  Flag,
  KanbanSquare,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  completeSprint,
  createSprint,
  deleteSprint,
  listProjects,
  listSprints,
  startSprint,
  updateSprint,
  type Project,
  type Sprint,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/workspace-ui";

type SprintLane = "planned" | "active" | "completed";

const COMPLETED_COLS = "minmax(0,1fr) 72px 96px 96px 96px 40px";

export default function SprintsPage() {
  const { auth } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const [projects,          setProjects]          = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [sprints,           setSprints]           = useState<Sprint[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [message,           setMessage]           = useState<{ text: string; ok: boolean } | null>(null);
  const [editingSprint,     setEditingSprint]     = useState<Sprint | null>(null);
  const [showComposer,      setShowComposer]      = useState(false);
  const [showCompleted,     setShowCompleted]     = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const loadSprints = useCallback(async (projectId = selectedProjectId) => {
    setLoading(true); setMessage(null);
    try {
      const projectPage = await listProjects(auth.accessToken);
      setProjects(projectPage.data);
      const nextId = projectId || projectPage.data[0]?.id || "";
      setSelectedProjectId(nextId);
      if (!nextId) { setSprints([]); return; }
      const sprintPage = await listSprints(auth.accessToken, { projectId: nextId });
      setSprints(sprintPage.data);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to load sprints.", ok: false });
    } finally { setLoading(false); }
  }, [auth.accessToken, selectedProjectId]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadSprints(), 0);
    return () => window.clearTimeout(t);
  }, [loadSprints]);

  const grouped = useMemo(() => {
    const lanes: Record<SprintLane, Sprint[]> = { active: [], completed: [], planned: [] };
    for (const sprint of sprints) lanes[sprintLane(sprint)].push(sprint);
    return lanes;
  }, [sprints]);

  const metrics = useMemo(() => ({
    planned:   grouped.planned.length,
    active:    grouped.active.length,
    completed: grouped.completed.length,
    tasks:     sprints.reduce((s, sp) => s + (sp._count?.tasks ?? 0), 0),
  }), [grouped, sprints]);

  async function onProjectChange(id: string) {
    setSelectedProjectId(id); await loadSprints(id);
  }

  async function onSaveSprint(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget, fd = new FormData(form);
    const startDate = String(fd.get("startDate") || "");
    const endDate   = String(fd.get("endDate")   || "");
    const scheduleError = validateSprintDates(startDate, endDate);
    if (scheduleError) {
      setMessage({ text: scheduleError, ok: false });
      return;
    }

    setSaving(true); setMessage(null);
    try {
      if (editingSprint) {
        await updateSprint(auth.accessToken, editingSprint.id, {
          name: String(fd.get("name") || "").trim(),
          goal: String(fd.get("goal") || "").trim() || undefined,
          startDate: startDate ? toNoonIso(startDate) : null,
          endDate: endDate ? toNoonIso(endDate) : null,
        });
        setMessage({ text: "Sprint updated.", ok: true });
      } else {
        if (!selectedProjectId) return;
        await createSprint(auth.accessToken, {
          projectId: selectedProjectId,
          name: String(fd.get("name") || "").trim(),
          goal: String(fd.get("goal") || "").trim() || undefined,
          startDate: startDate ? toNoonIso(startDate) : undefined,
          endDate: endDate ? toNoonIso(endDate) : undefined,
        });
        setMessage({ text: "Sprint created.", ok: true });
      }
      form.reset(); setShowComposer(false); setEditingSprint(null);
      await loadSprints(selectedProjectId);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to save sprint.", ok: false });
    } finally { setSaving(false); }
  }

  async function onStartSprint(id: string) {
    setSaving(true); setMessage(null);
    try {
      await startSprint(auth.accessToken, id);
      setMessage({ text: "Sprint started.", ok: true });
      await loadSprints(selectedProjectId);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to start sprint.", ok: false });
    } finally { setSaving(false); }
  }

  async function onCompleteSprint(id: string) {
    setSaving(true); setMessage(null);
    try {
      await completeSprint(auth.accessToken, id, { moveIncompleteToBacklog: true });
      setMessage({ text: "Sprint completed. Incomplete tasks moved to backlog.", ok: true });
      await loadSprints(selectedProjectId);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to complete sprint.", ok: false });
    } finally { setSaving(false); }
  }

  async function onDeleteSprint(sprint: Sprint) {
    if (!canDeleteSprint(sprint)) {
      setMessage({
        text: "Only planned sprints with no tasks, meetings, or retrospective notes can be deleted.",
        ok: false
      });
      return;
    }

    const confirmed = await confirm({
      title: "Delete sprint?",
      description: `Delete "${sprint.name}"? This is only allowed for planned sprints with no tasks, meetings, or retrospective notes.`,
      confirmLabel: "Delete sprint",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true); setMessage(null);
    try {
      await deleteSprint(auth.accessToken, sprint.id);
      setMessage({ text: "Sprint deleted.", ok: true });
      await loadSprints(selectedProjectId);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to delete sprint.", ok: false });
    } finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Control bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-panel px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2.5 pr-2">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-foreground">
            <CalendarDays className="size-4 text-primary" />
          </span>
          <h1 className="text-[15px] font-black tracking-tight text-foreground">Sprints</h1>
        </div>

        <div className="h-5 w-px bg-line" />

        <div className="relative">
          <select
            value={selectedProjectId}
            onChange={(e) => void onProjectChange(e.target.value)}
            className="h-8 appearance-none rounded-lg border border-line bg-background pl-3 pr-7 text-[12px] font-bold text-foreground transition hover:bg-panel-muted focus:border-primary focus:outline-none"
          >
            {projects.length
              ? projects.map((p) => <option key={p.id} value={p.id}>{p.key} – {p.name}</option>)
              : <option value="">No projects</option>}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-ink-soft" />
        </div>

        <div className="h-5 w-px bg-line" />

        <div className="flex items-center gap-5">
          {[
            { label: "Active",  value: metrics.active,    color: "#10b981" },
            { label: "Planned", value: metrics.planned,   color: "#3b82f6" },
            { label: "Done",    value: metrics.completed, color: "#8b5cf6" },
            { label: "Tasks",   value: metrics.tasks,     color: "#ffd400" },
          ].map(({ color, label, value }) => (
            <div key={label} className="text-center">
              <p className="text-[15px] font-black leading-none tabular-nums" style={{ color }}>{value}</p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-ink-soft">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex flex-wrap items-center gap-1.5">
          {saving && (
            <span className="text-[11px] font-bold text-ink-soft">
              <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-amber-400" />
              Saving
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadSprints(selectedProjectId)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-background px-3 text-[12px] font-bold text-foreground transition hover:bg-panel-muted"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} /> Refresh
          </button>
          <Link
            href="/board"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-background px-3 text-[12px] font-bold text-foreground transition hover:bg-panel-muted"
          >
            <KanbanSquare className="size-3.5" /> Board
          </Link>
          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className="tb-yellow-button inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-black"
          >
            <Plus className="size-3.5" /> New sprint
          </button>
        </div>
      </div>

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {message && (
        <div className={cn(
          "rounded-xl border px-4 py-2.5 text-[13px] font-bold",
          message.ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700",
        )}>
          {message.text}
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-panel-muted" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : !selectedProject ? (
        <EmptyBoard title="No project available" body="Create a project before planning sprints." />
      ) : (
        <div className="flex flex-col gap-6">

          {/* ── Active ────────────────────────────────────────────────────────── */}
          <section>
            <LaneHeader color="#10b981" icon={<Zap className="size-3" />} label="Active" count={grouped.active.length} />
            {grouped.active.length === 0 ? (
              <EmptyLane icon={<Play className="size-4 text-emerald-400" />} title="No active sprint" body="Start a planned sprint to begin the delivery cycle." />
            ) : (
              <div className="flex flex-col gap-3">
                {grouped.active.map((sprint) => (
                  <ActiveSprintCard
                    key={sprint.id}
                    sprint={sprint}
                    saving={saving}
                    onComplete={onCompleteSprint}
                    onEdit={setEditingSprint}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Planned ───────────────────────────────────────────────────────── */}
          <section>
            <LaneHeader color="#3b82f6" icon={<CircleDot className="size-3" />} label="Planned" count={grouped.planned.length} />
            {grouped.planned.length === 0 ? (
              <EmptyLane icon={<CalendarDays className="size-4 text-blue-400" />} title="No planned sprints" body="Create a sprint to start planning the next cycle." />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
                {grouped.planned.map((sprint, idx) => (
                  <PlannedSprintRow
                    key={sprint.id}
                    sprint={sprint}
                    saving={saving}
                    isLast={idx === grouped.planned.length - 1}
                    onDelete={onDeleteSprint}
                    onEdit={setEditingSprint}
                    onStart={onStartSprint}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Completed ─────────────────────────────────────────────────────── */}
          <section>
            <button
              type="button"
              onClick={() => setShowCompleted((v) => !v)}
              className="group mb-3 flex items-center gap-2"
            >
              <LaneHeader
                color="#8b5cf6"
                icon={<CheckCircle2 className="size-3" />}
                label="Completed"
                count={grouped.completed.length}
                noMargin
              />
              <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-soft transition group-hover:text-foreground">
                {showCompleted ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                {showCompleted ? "Hide" : "Show"}
              </span>
            </button>

            {showCompleted && (
              grouped.completed.length === 0 ? (
                <EmptyLane icon={<Archive className="size-4 text-violet-400" />} title="No completed sprints" body="Completed sprints will appear here." />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
                  <div className="grid border-b border-line bg-panel-muted px-4 py-2" style={{ gridTemplateColumns: COMPLETED_COLS }}>
                    {["Sprint", "Tasks", "Start", "End", "Completed", ""].map((h) => (
                      <span key={h} className="text-[9px] font-black uppercase tracking-[0.14em] text-ink-soft/60">{h}</span>
                    ))}
                  </div>
                  {grouped.completed.map((sprint) => (
                    <CompletedSprintRow key={sprint.id} sprint={sprint} />
                  ))}
                </div>
              )
            )}
          </section>
        </div>
      )}

      {/* ── New sprint modal ─────────────────────────────────────────────────── */}
      {(showComposer || editingSprint) && (
        <SprintModal
          sprint={editingSprint}
          saving={saving}
          onClose={() => { setShowComposer(false); setEditingSprint(null); }}
          onSubmit={onSaveSprint}
        />
      )}
    </div>
  );
}

/* ─── Active sprint card ─────────────────────────────────────────────────────── */

function ActiveSprintCard({ onComplete, onEdit, saving, sprint }: {
  onComplete: (id: string) => void;
  onEdit: (sprint: Sprint) => void;
  saving: boolean;
  sprint: Sprint;
}) {
  const pct       = timeProgress(sprint.startDate, sprint.endDate);
  const daysLeft  = daysRemaining(sprint.endDate);
  const overdue   = daysLeft !== null && daysLeft < 0;
  const taskCount = sprint._count?.tasks ?? 0;

  return (
    <article className="relative w-full overflow-hidden rounded-2xl border border-emerald-900/40 bg-[#0b1710]">
      {/* subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* left glow accent */}
      <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 shadow-[0_0_12px_2px_rgba(16,185,129,0.4)]" />

      <div className="relative px-6 py-5">
        {/* Row 1: live pill + name + actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* live indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Live</span>
          </div>

          <div className="h-4 w-px bg-white/10 shrink-0" />

          {/* Sprint name */}
          <h2 className="text-[16px] font-black text-white tracking-tight">{sprint.name}</h2>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(sprint)}
              disabled={saving}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-[12px] font-semibold text-white/60 transition hover:bg-white/[0.12] hover:text-white disabled:opacity-50"
            >
              <Pencil className="size-3.5" /> Edit
            </button>
            <button
              type="button"
              onClick={() => onComplete(sprint.id)}
              disabled={saving}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-emerald-700/50 bg-emerald-950/70 px-3.5 text-[12px] font-black text-emerald-400 transition hover:bg-emerald-900/60 disabled:opacity-50"
            >
              <CheckCircle2 className="size-3.5" /> Complete sprint
            </button>
            <Link
              href={`/sprints/${sprint.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 text-[12px] font-semibold text-white/60 transition hover:bg-white/[0.12] hover:text-white"
            >
              View tasks <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Row 2: goal */}
        {sprint.goal && (
          <p className="mt-2 text-[13px] leading-relaxed text-white/40 line-clamp-1 pl-[26px]">
            {sprint.goal}
          </p>
        )}

        {/* Row 3: meta chips + progress bar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-white/50">
              <Flag className="size-3" /> {taskCount} tasks
            </span>
            {sprint.startDate && (
              <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-white/50">
                <CalendarDays className="size-3" />
                {formatShortDate(sprint.startDate)} → {sprint.endDate ? formatShortDate(sprint.endDate) : "—"}
              </span>
            )}
            {daysLeft !== null && (
              <span className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black",
                overdue
                  ? "border border-red-900/60 bg-red-950/70 text-red-400"
                  : "border border-emerald-900/60 bg-emerald-950/70 text-emerald-400",
              )}>
                <Clock className="size-3" />
                {overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {sprint.startDate && sprint.endDate && (
            <div className="flex flex-1 min-w-[120px] items-center gap-3">
              <div className="flex-1 h-[4px] overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: overdue ? "#ef4444" : "#10b981" }}
                />
              </div>
              <span className="shrink-0 text-[11px] font-black tabular-nums text-white/30">{pct}%</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─── Planned sprint row ─────────────────────────────────────────────────────── */

function PlannedSprintRow({ isLast, onDelete, onEdit, onStart, saving, sprint }: {
  isLast: boolean;
  onDelete: (sprint: Sprint) => void;
  onEdit: (sprint: Sprint) => void;
  onStart: (id: string) => void;
  saving: boolean;
  sprint: Sprint;
}) {
  const isEmpty   = canDeleteSprint(sprint);
  const taskCount = sprint._count?.tasks ?? 0;

  return (
    <div className={cn(
      "group flex items-center gap-3 px-4 py-3 transition hover:bg-panel-muted/50",
      !isLast && "border-b border-line/50",
    )}>
      <span className="size-2 shrink-0 rounded-full bg-blue-400/70" />

      <div className="min-w-0 flex-1">
        <span className="text-[13px] font-bold text-foreground">{sprint.name}</span>
        {sprint.goal && (
          <span className="ml-2 hidden truncate text-[11px] text-ink-soft sm:inline">{sprint.goal}</span>
        )}
      </div>

      <div className="hidden shrink-0 items-center gap-4 sm:flex">
        <span className="flex items-center gap-1 text-[11px] text-ink-soft">
          <Flag className="size-3 shrink-0 text-ink-soft/50" /> {taskCount}
        </span>
        {(sprint.startDate || sprint.endDate) && (
          <span className="flex items-center gap-1 text-[11px] text-ink-soft">
            <CalendarDays className="size-3 shrink-0 text-ink-soft/50" />
            {sprint.startDate ? formatShortDate(sprint.startDate) : "—"}{" → "}
            {sprint.endDate ? formatShortDate(sprint.endDate) : "—"}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onStart(sprint.id)}
          disabled={saving}
          className="tb-yellow-button inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-black disabled:opacity-50"
        >
          <Play className="size-3" /> Start
        </button>
        <Link
          href={`/sprints/${sprint.id}`}
          className="inline-flex h-7 items-center gap-1 rounded-lg border border-line px-2.5 text-[11px] font-semibold text-ink-soft transition hover:bg-panel-muted hover:text-foreground"
        >
          View <ArrowRight className="size-3" />
        </Link>
        <button
          type="button"
          onClick={() => onEdit(sprint)}
          disabled={saving}
          className="flex size-7 items-center justify-center rounded-lg text-ink-soft/45 transition hover:bg-panel-muted hover:text-foreground disabled:opacity-40"
          aria-label="Edit sprint"
        >
          <Pencil className="size-3.5" />
        </button>
        {isEmpty && (
          <button
            type="button"
            onClick={() => onDelete(sprint)}
            disabled={saving}
            className="flex size-7 items-center justify-center rounded-lg text-ink-soft/20 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-0"
            aria-label="Delete sprint"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Completed sprint row ───────────────────────────────────────────────────── */

function CompletedSprintRow({ sprint }: { sprint: Sprint }) {
  return (
    <div
      className="group grid items-center border-b border-line/40 px-4 py-2.5 text-[11px] transition last:border-b-0 hover:bg-panel-muted/40"
      style={{ gridTemplateColumns: COMPLETED_COLS }}
    >
      <div className="flex items-center gap-2 min-w-0 pr-3">
        <span className="size-1.5 shrink-0 rounded-full bg-violet-400/60" />
        <span className="truncate font-semibold text-foreground">{sprint.name}</span>
      </div>
      <span className="text-ink-soft tabular-nums">{sprint._count?.tasks ?? 0}</span>
      <span className="text-ink-soft">{formatShortDate(sprint.startDate)}</span>
      <span className="text-ink-soft">{formatShortDate(sprint.endDate)}</span>
      <span className="flex items-center gap-1 font-semibold text-violet-600">
        <CheckCircle2 className="size-3 shrink-0" />
        {formatShortDate(sprint.completedAt)}
      </span>
      <Link
        href={`/sprints/${sprint.id}`}
        className="flex size-7 items-center justify-center rounded-lg text-ink-soft/25 opacity-0 transition hover:bg-panel-muted hover:text-foreground group-hover:opacity-100"
        aria-label="View sprint"
      >
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

/* ─── New sprint modal ───────────────────────────────────────────────────────── */

function SprintModal({ onClose, onSubmit, saving, sprint }: {
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  sprint: Sprint | null;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.45)]">

        {/* Dark header */}
        <div className="relative overflow-hidden bg-[#111111] px-7 pb-6 pt-7">
          {/* grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          {/* top accent line */}
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-primary/60 to-transparent" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary">
                  <Target className="size-4 text-[#111]" />
                </span>
                <div>
                  <h2 className="text-[16px] font-black leading-none text-white">{sprint ? "Edit sprint" : "New sprint"}</h2>
                  <p className="mt-0.5 text-[11px] text-white/35">Define the plan, goal, and schedule</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/40 transition hover:bg-white/[0.12] hover:text-white"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={onSubmit} className="bg-panel px-7 py-6">
          <div className="flex flex-col gap-4">

            <ModalField label="Sprint name" required>
              <input
                name="name"
                required
                maxLength={160}
                defaultValue={sprint?.name ?? ""}
                placeholder="e.g. Sprint 2026.07"
                className={modalFieldCls}
                autoFocus
              />
            </ModalField>

            <ModalField label="Goal">
              <input
                name="goal"
                defaultValue={sprint?.goal ?? ""}
                placeholder="What will this sprint deliver?"
                className={modalFieldCls}
              />
            </ModalField>

            <div className="grid grid-cols-2 gap-4">
              <ModalField label="Start date">
                <input name="startDate" type="date" defaultValue={toDateInputValue(sprint?.startDate)} className={modalFieldCls} />
              </ModalField>
              <ModalField label="End date">
                <input name="endDate" type="date" defaultValue={toDateInputValue(sprint?.endDate)} className={modalFieldCls} />
              </ModalField>
            </div>

            {sprint ? (
              <p className="rounded-xl bg-panel-muted px-3 py-2 text-[12px] font-semibold leading-5 text-ink-soft">
                Clear both dates to keep this as a planned sprint. Active sprint start dates are protected by the backend.
              </p>
            ) : null}

          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-line pt-5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-line px-5 text-[13px] font-bold text-ink-soft transition hover:bg-panel-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="tb-yellow-button h-10 rounded-xl px-6 text-[13px] font-black disabled:opacity-55"
            >
              {saving ? "Saving..." : sprint ? "Save sprint" : "Create sprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Lane header ────────────────────────────────────────────────────────────── */

function LaneHeader({ color, count, icon, label, noMargin }: {
  color: string;
  count: number;
  icon: ReactNode;
  label: string;
  noMargin?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", noMargin ? "" : "mb-3")}>
      <span
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black"
        style={{ background: `${color}18`, color }}
      >
        {icon}{label}
      </span>
      <span
        className="rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums"
        style={{ background: `${color}14`, color }}
      >
        {count}
      </span>
    </div>
  );
}

/* ─── Empty states ───────────────────────────────────────────────────────────── */

function EmptyLane({ body, icon, title }: { body: string; icon: ReactNode; title: string }) {
  return (
    <div className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-dashed border-line bg-panel px-5">
      {icon}
      <div>
        <p className="text-[13px] font-bold text-foreground">{title}</p>
        <p className="text-[11px] text-ink-soft">{body}</p>
      </div>
    </div>
  );
}

function EmptyBoard({ body, title }: { body: string; title: string }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-panel text-center">
      <CircleDot className="size-7 text-line" />
      <h3 className="text-sm font-black text-foreground">{title}</h3>
      <p className="text-sm text-ink-soft">{body}</p>
    </div>
  );
}

/* ─── Form helpers ───────────────────────────────────────────────────────────── */

function ModalField({ children, label, required }: { children: ReactNode; label: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft">
        {label}{required && <span className="ml-0.5 text-primary">*</span>}
      </span>
      {children}
    </label>
  );
}

const modalFieldCls =
  "h-10 w-full rounded-xl border border-line bg-background px-3.5 text-[13px] font-medium text-foreground placeholder:text-ink-soft/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10";

/* ─── Pure helpers ───────────────────────────────────────────────────────────── */

function sprintLane(sprint: Sprint): SprintLane {
  if (sprint.completedAt) return "completed";
  if (!sprint.startDate) return "planned";
  return new Date(sprint.startDate).getTime() > Date.now() ? "planned" : "active";
}

function canDeleteSprint(sprint: Sprint) {
  const counts = sprint._count as (Sprint["_count"] & { meetings?: number }) | undefined;
  return (
    sprintLane(sprint) === "planned" &&
    (counts?.tasks ?? 0) === 0 &&
    (counts?.meetings ?? 0) === 0 &&
    (counts?.retrospectives ?? 0) === 0
  );
}

function validateSprintDates(startDate: string, endDate: string) {
  if (!startDate && endDate) return "Choose a start date before setting an end date.";
  if (startDate && endDate && new Date(endDate).getTime() < new Date(startDate).getTime()) {
    return "Sprint end date must be after the start date.";
  }
  return "";
}

function toDateInputValue(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function toNoonIso(v: string) { return new Date(`${v}T12:00:00`).toISOString(); }

function timeProgress(startDate?: string | null, endDate?: string | null): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end   = new Date(endDate).getTime();
  const now   = Date.now();
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

function daysRemaining(endDate?: string | null): number | null {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
