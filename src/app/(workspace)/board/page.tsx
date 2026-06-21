"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowUpRight,
  AlertTriangle,
  Bug,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronsLeftRight,
  CircleDot,
  Clock3,
  FileText,
  GitBranch,
  GripVertical,
  KanbanSquare,
  List,
  ListCollapse,
  MessageSquareText,
  MoreVertical,
  Paperclip,
  Plus,
  RefreshCw,
  Rocket,
  Rows3,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import {
  createBoardColumn,
  createTaskSavedView,
  createTask,
  deleteBoardColumn,
  getProjectBoard,
  addTaskAssignee,
  listProjects,
  listSprints,
  listTaskSavedViews,
  listUsers,
  removeTaskAssignee,
  reorderBoardColumns,
  updateBoardColumn,
  updateTask,
  updateTaskBoardOrder,
  type BoardColumn,
  type Project,
  type ProjectBoard,
  type Sprint,
  type Task,
  type TaskPriority,
  type TaskSavedView,
  type TaskStatus,
  type TaskType,
  type TenantUser,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  formatShortDate,
  priorityLabels,
  taskStatusLabels,
  taskStatusOrder,
  userInitials,
} from "@/lib/workspace-ui";

type SprintFilter = "ALL" | "BACKLOG" | string;
type BoardDensity = "comfortable" | "compact";
type ViewMode     = "board" | "list";
type SwimlaneMode = "NONE" | "SPRINT" | "ASSIGNEE" | "EPIC" | "PRIORITY";
type DueFilter = "" | "OVERDUE" | "TODAY" | "UPCOMING" | "NONE";
type BoardFilters = {
  search: string;
  priority: "" | TaskPriority;
  assigneeId: string;
  due: DueFilter;
  blocked: boolean;
};
type SavedBoardConfig = {
  sprintFilter: SprintFilter;
  filters: BoardFilters;
  swimlane: SwimlaneMode;
  density: BoardDensity;
  viewMode: ViewMode;
};
type DragHandleAttributes = ReturnType<typeof useSortable>["attributes"];
type DragHandleListeners  = ReturnType<typeof useSortable>["listeners"];

const DEFAULT_BOARD_FILTERS: BoardFilters = {
  search: "",
  priority: "",
  assigneeId: "",
  due: "",
  blocked: false,
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  BACKLOG:     "#94a3b8",
  TODO:        "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  REVIEW:      "#8b5cf6",
  TESTING:     "#06b6d4",
  DONE:        "#10b981",
  CANCELLED:   "#6b7280",
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  LOW:      "#94a3b8",
  MEDIUM:   "#3b82f6",
  HIGH:     "#f59e0b",
  URGENT:   "#f97316",
  CRITICAL: "#ef4444",
};

const PRIORITY_BG: Record<TaskPriority, string> = {
  LOW:      "bg-slate-100 text-slate-500",
  MEDIUM:   "bg-blue-50 text-blue-600",
  HIGH:     "bg-amber-50 text-amber-700",
  URGENT:   "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-600",
};

const colId  = (id: string) => `column:${id}`;
const taskId = (id: string) => `task:${id}`;

export default function BoardPage() {
  const { auth } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [projects,           setProjects]           = useState<Project[]>([]);
  const [selectedProjectId,  setSelectedProjectId]  = useState("");
  const [board,              setBoard]              = useState<ProjectBoard | null>(null);
  const [sprints,            setSprints]            = useState<Sprint[]>([]);
  const [users,              setUsers]              = useState<TenantUser[]>([]);
  const [savedViews,         setSavedViews]         = useState<TaskSavedView[]>([]);
  const [sprintFilter,       setSprintFilter]       = useState<SprintFilter>("ALL");
  const [filters,            setFilters]            = useState<BoardFilters>(DEFAULT_BOARD_FILTERS);
  const [swimlane,           setSwimlane]           = useState<SwimlaneMode>("NONE");
  const [density,            setDensity]            = useState<BoardDensity>("compact");
  const [loading,            setLoading]            = useState(true);
  const [saving,             setSaving]             = useState(false);
  const [viewSaving,         setViewSaving]         = useState(false);
  const setMessage = useCallback((message: { text: string; ok: boolean } | null) => {
    if (!message?.text) return;
    toast({
      title: message.ok ? "Done" : "Action failed",
      description: message.text,
      variant: message.ok ? "success" : "error",
    });
  }, [toast]);
  const [showTaskComposer,   setShowTaskComposer]   = useState(false);
  const [showColComposer,    setShowColComposer]    = useState(false);
  const [showSaveView,       setShowSaveView]       = useState(false);
  const [saveViewName,       setSaveViewName]       = useState("");
  const [expandedTaskIds,    setExpandedTaskIds]    = useState<Set<string>>(() => new Set());
  const [activeTask,         setActiveTask]         = useState<Task | null>(null);
  const [activeColumn,       setActiveColumn]       = useState<BoardColumn | null>(null);
  const [viewMode,           setViewMode]           = useState<ViewMode>("board");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const loadBoard = useCallback(async (projectId = selectedProjectId) => {
    setLoading(true); setMessage(null);
    try {
      const page          = await listProjects(auth.accessToken);
      setProjects(page.data);
      const nextId        = projectId || page.data[0]?.id || "";
      setSelectedProjectId(nextId);
      if (!nextId) { setBoard(null); setSprints([]); setSavedViews([]); setUsers([]); return; }
      const [boardData, sprintPage, savedViewPage, userPage] = await Promise.all([
        getProjectBoard(auth.accessToken, nextId),
        listSprints(auth.accessToken, { projectId: nextId }),
        listTaskSavedViews(auth.accessToken, { projectId: nextId, limit: 100 }),
        listUsers(auth.accessToken, { limit: 100 }),
      ]);
      setBoard(normalizeBoard(boardData));
      setSprints(sprintPage.data);
      setSavedViews(savedViewPage.data);
      setUsers(userPage.data);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to load board.", ok: false });
    } finally { setLoading(false); }
  }, [auth.accessToken, selectedProjectId]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadBoard(), 0);
    return () => window.clearTimeout(t);
  }, [loadBoard]);

  const filteredBoard = useMemo(() => {
    if (!board) return null;
    return {
      ...board,
      columns: board.columns.map((col) => ({
        ...col,
        tasks: (col.tasks ?? []).filter((t) => {
          if (sprintFilter !== "ALL") {
            if (sprintFilter === "BACKLOG" && t.sprintId) return false;
            if (sprintFilter !== "BACKLOG" && t.sprintId !== sprintFilter) return false;
          }
          return taskMatchesBoardFilters(t, filters);
        }),
      })),
    };
  }, [board, filters, sprintFilter]);

  const metrics = useMemo(() => {
    const all     = board?.columns.flatMap((c) => c.tasks ?? []) ?? [];
    const visible = filteredBoard?.columns.flatMap((c) => c.tasks ?? []) ?? [];
    return {
      visible: visible.length,
      open:    all.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length,
      total:   all.length,
      points:  all.reduce((s, t) => s + (t.storyPoints ?? 0), 0),
    };
  }, [board, filteredBoard]);

  const visibleTasks = useMemo(() => filteredBoard?.columns.flatMap((c) => c.tasks ?? []) ?? [], [filteredBoard]);
  const swimlaneGroups = useMemo(
    () => filteredBoard ? groupBoardBySwimlane(filteredBoard, swimlane, sprints) : [],
    [filteredBoard, sprints, swimlane],
  );
  const boardPermissions = board?.permissions;
  const canCreateTask = Boolean(boardPermissions?.canCreateTask);
  const canMoveTasks = Boolean(boardPermissions?.canMoveTasks);
  const canManageColumns = Boolean(boardPermissions?.canManageColumns);
  const canManageSprints = Boolean(boardPermissions?.canManageSprints ?? boardPermissions?.canEditBoard);

  async function onProjectChange(id: string) {
    setSelectedProjectId(id); setSprintFilter("ALL"); setFilters(DEFAULT_BOARD_FILTERS); setSwimlane("NONE"); setExpandedTaskIds(new Set());
    await loadBoard(id);
  }

  function onDragStart(e: DragStartEvent) {
    const d = e.active.data.current;
    if (d?.type === "task") {
      const task = d.task as Task;
      if (!canMoveTasks || task.permissions?.canMove === false) return;
      setActiveTask(task); setActiveColumn(null);
    }
    if (d?.type === "column") {
      if (!canManageColumns) return;
      setActiveColumn(d.column as BoardColumn); setActiveTask(null);
    }
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveTask(null); setActiveColumn(null);
    if (!board || !e.over) return;
    const ad = e.active.data.current, od = e.over.data.current;
    if (ad?.type === "column" && od?.type === "column") {
      if (!canManageColumns) {
        setMessage({ text: "Your role cannot reorder board columns.", ok: false });
        return;
      }
      await moveColumn(ad.column.id, od.column.id); return;
    }
    if (ad?.type === "task") {
      if (!canMoveTasks || (ad.task as Task).permissions?.canMove === false) {
        setMessage({ text: "Your role cannot move tasks on this board.", ok: false });
        return;
      }
      const target = resolveOverColumn(board, od);
      if (!target) return;
      await moveTask(ad.task as Task, target, od?.type === "task" ? (od.task as Task) : null);
    }
  }

  async function moveColumn(aId: string, oId: string) {
    if (!board || aId === oId) return;
    if (!canManageColumns) {
      setMessage({ text: "Your role cannot reorder board columns.", ok: false });
      return;
    }
    const oi = board.columns.findIndex((c) => c.id === aId);
    const ni = board.columns.findIndex((c) => c.id === oId);
    if (oi < 0 || ni < 0) return;
    const next = arrayMove(board.columns, oi, ni).map((c, i) => ({ ...c, sortOrder: i }));
    setBoard({ ...board, columns: next });
    setSaving(true);
    try {
      await reorderBoardColumns(auth.accessToken, board.id, next.map((c) => ({ columnId: c.id, sortOrder: c.sortOrder })));
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to reorder.", ok: false });
      void loadBoard();
    } finally { setSaving(false); }
  }

  async function moveTask(task: Task, target: BoardColumn, over: Task | null) {
    if (!board) return;
    if (!canMoveTasks || task.permissions?.canMove === false) {
      setMessage({ text: "Your role cannot move this task.", ok: false });
      return;
    }
    const src     = board.columns.find((c) => (c.tasks ?? []).some((t) => t.id === task.id));
    if (!src) return;
    const tTasks  = target.tasks ?? [];
    const idx     = over ? Math.max(0, tTasks.findIndex((t) => t.id === over.id)) : tTasks.length;
    const next    = moveTaskOnBoard(board, task.id, target.id, idx, target.status ?? task.status);
    setBoard(next);
    setSaving(true);
    try {
      await Promise.all(
        taskOrderUpdates(board, next, [src.id, target.id]).map((t) =>
          updateTaskBoardOrder(auth.accessToken, t.id, { sortOrder: t.sortOrder, boardColumnId: t.boardColumnId ?? null, status: t.status }),
        ),
      );
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to move task.", ok: false });
      void loadBoard();
    } finally { setSaving(false); }
  }

  async function onCreateTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!board || !selectedProjectId) return;
    if (!canCreateTask) {
      setMessage({ text: "Your role cannot create tasks in this project.", ok: false });
      return;
    }
    const form = e.currentTarget, fd = new FormData(form);
    const colId2  = String(fd.get("boardColumnId") || board.columns[0]?.id || "");
    const column  = board.columns.find((c) => c.id === colId2) ?? board.columns[0];
    if (!column) return;
    const sprintId    = String(fd.get("sprintId") || "");
    const dueDate     = String(fd.get("dueDate") || "");
    const storyPoints = Number(fd.get("storyPoints") || 0);
    const estHrs      = Number(fd.get("estimateHours") || 0);
    setSaving(true); setMessage(null);
    try {
      const created = await createTask(auth.accessToken, {
        projectId: selectedProjectId, sprintId: sprintId || undefined,
        title: String(fd.get("title") || "").trim(), description: String(fd.get("description") || ""),
        type: fd.get("type") as TaskType,
        status: column.status ?? "TODO", priority: fd.get("priority") as TaskPriority,
        dueDate: dueDate ? toNoonIso(dueDate) : undefined,
        storyPoints: storyPoints > 0 ? storyPoints : undefined,
        estimateMins: estHrs > 0 ? Math.round(estHrs * 60) : undefined,
      });
      await updateTaskBoardOrder(auth.accessToken, created.id, {
        sortOrder: column.tasks?.length ?? 0, boardColumnId: column.id,
        status: column.status ?? undefined, sprintId: sprintId || undefined,
      });
      form.reset(); setShowTaskComposer(false);
      setMessage({ text: "Task created.", ok: true });
      await loadBoard(selectedProjectId);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to create task.", ok: false });
    } finally { setSaving(false); }
  }

  async function onCreateColumn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!board) return;
    if (!canManageColumns) {
      setMessage({ text: "Your role cannot create board columns.", ok: false });
      return;
    }
    const form = e.currentTarget, fd = new FormData(form);
    const status   = String(fd.get("status") || "");
    const wipLimit = Number(fd.get("wipLimit") || 0);
    setSaving(true); setMessage(null);
    try {
      await createBoardColumn(auth.accessToken, board.id, {
        name: String(fd.get("name") || "").trim(),
        status: status ? (status as TaskStatus) : undefined,
        wipLimit: wipLimit > 0 ? wipLimit : undefined,
      });
      e.currentTarget.reset(); setShowColComposer(false);
      setMessage({ text: "Column created.", ok: true });
      await loadBoard(selectedProjectId);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to create column.", ok: false });
    } finally { setSaving(false); }
  }

  async function onUpdateColumn(cId: string, payload: Partial<BoardColumn>) {
    if (!board) return;
    if (!canManageColumns) {
      setMessage({ text: "Your role cannot update board columns.", ok: false });
      return;
    }
    setSaving(true); setMessage(null);
    try {
      const updated = await updateBoardColumn(auth.accessToken, board.id, cId, payload);
      setBoard({ ...board, columns: board.columns.map((c) => c.id === cId ? { ...c, ...updated } : c) });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to update.", ok: false });
    } finally { setSaving(false); }
  }

  async function onDeleteColumn(column: BoardColumn) {
    if (!board) return;
    if (!canManageColumns) {
      setMessage({ text: "Your role cannot delete board columns.", ok: false });
      return;
    }
    const confirmed = await confirm({
      title: "Delete board column?",
      description: `Delete "${column.name}"? The backend only allows this when the column is empty.`,
      confirmLabel: "Delete column",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true); setMessage(null);
    try {
      await deleteBoardColumn(auth.accessToken, board.id, column.id);
      setBoard({ ...board, columns: board.columns.filter((c) => c.id !== column.id) });
      setMessage({ text: "Column deleted.", ok: true });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to delete.", ok: false });
    } finally { setSaving(false); }
  }

  async function onTaskSprintChange(task: Task, sprintId: string) {
    if (!board) return;
    if (!canManageSprints || task.permissions?.canEdit === false) {
      setMessage({ text: "Your role cannot assign tasks to sprints.", ok: false });
      return;
    }
    const next = sprintId || null;
    setBoard(updateTaskInBoard(board, task.id, { sprintId: next }));
    setSaving(true); setMessage(null);
    try {
      await updateTaskBoardOrder(auth.accessToken, task.id, { sortOrder: task.sortOrder, sprintId: next });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to update sprint.", ok: false });
      void loadBoard();
    } finally { setSaving(false); }
  }

  async function onQuickAddTask(columnId: string, title: string) {
    if (!board || !selectedProjectId || !title.trim()) return;
    if (!canCreateTask) {
      setMessage({ text: "Your role cannot create tasks in this project.", ok: false });
      return;
    }
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return;
    setSaving(true); setMessage(null);
    try {
      const created = await createTask(auth.accessToken, {
        projectId: selectedProjectId,
        title: title.trim(),
        status: column.status ?? "TODO",
        priority: "MEDIUM",
      });
      await updateTaskBoardOrder(auth.accessToken, created.id, {
        sortOrder: column.tasks?.length ?? 0,
        boardColumnId: column.id,
        status: column.status ?? undefined,
      });
      setMessage({ text: "Task created.", ok: true });
      await loadBoard(selectedProjectId);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to create task.", ok: false });
    } finally { setSaving(false); }
  }

  function toggleTaskExpanded(taskIdValue: string) {
    setExpandedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskIdValue)) next.delete(taskIdValue);
      else next.add(taskIdValue);
      return next;
    });
  }

  function updateFilter<K extends keyof BoardFilters>(key: K, value: BoardFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearBoardFilters() {
    setFilters(DEFAULT_BOARD_FILTERS);
    setSprintFilter("ALL");
    setSwimlane("NONE");
  }

  function applySavedView(viewId: string) {
    if (!viewId) return;
    const view = savedViews.find((item) => item.id === viewId);
    const config = getSavedBoardConfig(view);
    if (!config) return;
    setSprintFilter(config.sprintFilter);
    setFilters(config.filters);
    setSwimlane(config.swimlane);
    setDensity(config.density);
    setViewMode(config.viewMode);
  }

  async function saveCurrentView(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = saveViewName.trim();
    if (!name || !selectedProjectId) return;
    setViewSaving(true); setMessage(null);
    try {
      const created = await createTaskSavedView(auth.accessToken, {
        name,
        projectId: selectedProjectId,
        visibility: "PRIVATE",
        filters: {
          board: {
            sprintFilter,
            filters,
            swimlane,
            density,
            viewMode,
          },
        },
      });
      setSavedViews((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setSaveViewName("");
      setShowSaveView(false);
      setMessage({ text: "View saved.", ok: true });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Unable to save view.", ok: false });
    } finally { setViewSaving(false); }
  }

  async function onQuickUpdateTask(task: Task, patch: Partial<Pick<Task, "status" | "priority" | "dueDate">>) {
    if (!board) return;
    if (task.permissions?.canEdit === false) {
      setMessage({ text: "Your role cannot edit this task.", ok: false });
      return;
    }
    const before = board;
    setBoard(updateTaskInBoard(board, task.id, applyTaskCardPatch(task, patch)));
    setSaving(true); setMessage(null);
    try {
      await updateTask(auth.accessToken, task.id, patch);
    } catch (err) {
      setBoard(before);
      setMessage({ text: err instanceof Error ? err.message : "Unable to update task.", ok: false });
    } finally { setSaving(false); }
  }

  async function onQuickAssignTask(task: Task, userId: string) {
    if (!board) return;
    if (task.permissions?.canAssign === false) {
      setMessage({ text: "Your role cannot assign this task.", ok: false });
      return;
    }
    const before = board;
    const currentAssignees = getCardAssignees(task);
    const nextUser = users.find((user) => user.id === userId) ?? null;
    setBoard(updateTaskInBoard(board, task.id, applyTaskAssigneePatch(task, nextUser)));
    setSaving(true); setMessage(null);
    try {
      await Promise.all(currentAssignees.filter((person) => person.userId !== userId).map((person) =>
        removeTaskAssignee(auth.accessToken, task.id, person.userId),
      ));
      if (userId && !currentAssignees.some((person) => person.userId === userId)) {
        await addTaskAssignee(auth.accessToken, task.id, userId);
      }
      await loadBoard(selectedProjectId);
    } catch (err) {
      setBoard(before);
      setMessage({ text: err instanceof Error ? err.message : "Unable to update assignee.", ok: false });
    } finally { setSaving(false); }
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">

      {/* ── Slim control bar ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 shadow-sm">

        {/* Identity */}
        <div className="flex items-center gap-2.5 pr-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-foreground">
            <KanbanSquare className="size-4 text-primary" />
          </span>
          <h1 className="text-[14px] font-black tracking-tight text-foreground">Board</h1>
        </div>

        <div className="h-5 w-px bg-line" />

        {/* Selectors */}
        <SelectPill>
          <select
            value={selectedProjectId}
            onChange={(e) => void onProjectChange(e.target.value)}
            className={selectClass}
          >
            {projects.length
              ? projects.map((p) => <option key={p.id} value={p.id}>{p.key} – {p.name}</option>)
              : <option value="">No projects</option>}
          </select>
        </SelectPill>

        <SelectPill>
          <select value={sprintFilter} onChange={(e) => setSprintFilter(e.target.value)} className={selectClass}>
            <option value="ALL">All tasks</option>
            <option value="BACKLOG">Backlog</option>
            {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </SelectPill>

        <div className="h-5 w-px bg-line" />

        {/* Inline metrics */}
        <div className="flex items-center gap-3">
          <InlineStat label="Visible" value={metrics.visible} />
          <InlineStat label="Open" value={metrics.open} />
          <InlineStat label="Total" value={metrics.total} />
          <InlineStat label="Pts" value={metrics.points} highlight />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {saving && (
            <span className="text-[11px] font-bold text-ink-soft">
              <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-amber-400" />
              Saving
            </span>
          )}
          <GhostBtn onClick={() => void loadBoard()} icon={<RefreshCw className={cn("size-3.5", loading && "animate-spin")} />}>
            Refresh
          </GhostBtn>
          <GhostBtn
            onClick={() => setDensity((d) => d === "comfortable" ? "compact" : "comfortable")}
            icon={<Rows3 className="size-3.5" />}
          >
            {density === "comfortable" ? "Compact" : "Comfort"}
          </GhostBtn>
          <GhostBtn
            disabled={!canManageColumns}
            onClick={() => setShowColComposer((v) => !v)}
            icon={<ChevronsLeftRight className="size-3.5" />}
            title={canManageColumns ? "Add or manage columns" : "Your role cannot manage board columns"}
          >
            Column
          </GhostBtn>
          {canManageSprints ? (
            <Link
              href="/sprints"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-background px-3 text-[12px] font-bold text-foreground transition hover:bg-panel-muted"
            >
              <Rocket className="size-3.5" />
              Sprints
            </Link>
          ) : (
            <button
              type="button"
              disabled
              title="Your role cannot manage sprints for this project"
              className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border border-line bg-background px-3 text-[12px] font-bold text-ink-soft opacity-55"
            >
              <Rocket className="size-3.5" />
              Sprints
            </button>
          )}

          {/* View mode toggle */}
          <div className="flex overflow-hidden rounded-lg border border-line bg-background p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-bold transition",
                viewMode === "board" ? "bg-foreground text-white shadow-sm" : "text-ink-soft hover:text-foreground",
              )}
            >
              <KanbanSquare className="size-3.5" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-bold transition",
                viewMode === "list" ? "bg-foreground text-white shadow-sm" : "text-ink-soft hover:text-foreground",
              )}
            >
              <List className="size-3.5" />
              List
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowTaskComposer(true)}
            disabled={!canCreateTask}
            title={canCreateTask ? "Create task" : "Your role cannot create tasks in this project"}
            className="tb-yellow-button inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-black disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Plus className="size-3.5" />
            New task
          </button>
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────────── */}
      <BoardFilterBar
        assignees={users}
        filters={filters}
        onApplySavedView={applySavedView}
        onClear={clearBoardFilters}
        onFilterChange={updateFilter}
        onSaveSubmit={saveCurrentView}
        onShowSaveViewChange={setShowSaveView}
        onSwimlaneChange={setSwimlane}
        saveViewName={saveViewName}
        savedViews={savedViews}
        setSaveViewName={setSaveViewName}
        showSaveView={showSaveView}
        swimlane={swimlane}
        viewSaving={viewSaving}
      />

      {filteredBoard ? <BoardInsights board={filteredBoard} visibleTasks={visibleTasks} /> : null}


      {/* ── Composer panels ────────────────────────────────────── */}
      {showColComposer && board && canManageColumns && (
        <ColumnComposer saving={saving} onSubmit={onCreateColumn} existing={board.columns} />
      )}
      {showTaskComposer && filteredBoard && canCreateTask && (
        <TaskModal onClose={() => setShowTaskComposer(false)}>
          <TaskComposer
            board={filteredBoard} saving={saving} sprints={sprints}
            selectedSprintId={sprintFilter !== "ALL" && sprintFilter !== "BACKLOG" ? sprintFilter : ""}
            onSubmit={onCreateTask}
          />
        </TaskModal>
      )}

      {/* ── Board / List canvas ────────────────────────────────── */}
      {loading ? (
        <BoardSkeleton />
      ) : filteredBoard ? (
        viewMode === "list" ? (
          <ListView board={filteredBoard} density={density} sprints={sprints} />
        ) : swimlane !== "NONE" ? (
          <SwimlaneBoard
            density={density}
            expandedTaskIds={expandedTaskIds}
            lanes={swimlaneGroups}
            onQuickAssign={onQuickAssignTask}
            onQuickUpdate={onQuickUpdateTask}
            onToggleExpanded={toggleTaskExpanded}
            sprints={sprints}
            users={users}
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="overflow-x-auto pb-4 tb-scrollbar">
              <SortableContext
                items={filteredBoard.columns.map((c) => colId(c.id))}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex min-h-[560px] gap-3">
                  {filteredBoard.columns.map((col) => (
                    <BoardColView
                      key={col.id}
                      column={col}
                      canCreateTask={canCreateTask}
                      canManageColumns={canManageColumns}
                      canMoveTasks={canMoveTasks}
                      density={density}
                      sprints={sprints}
                      onDelete={onDeleteColumn}
                      onQuickAdd={onQuickAddTask}
                      onSprintChange={onTaskSprintChange}
                      onUpdate={onUpdateColumn}
                      users={users}
                      expandedTaskIds={expandedTaskIds}
                      onToggleExpanded={toggleTaskExpanded}
                      onQuickUpdate={onQuickUpdateTask}
                      onQuickAssign={onQuickAssignTask}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
            <DragOverlay>
              {activeTask   ? <RichTaskCard task={activeTask} dragging sprints={sprints} users={users} /> : null}
              {activeColumn ? <ColGhost column={activeColumn} /> : null}
            </DragOverlay>
          </DndContext>
        )
      ) : (
        <EmptyBoard />
      )}
    </div>
  );
}

/* ─── Board column ─────────────────────────────────────────────────────────── */

function BoardFilterBar({
  assignees,
  filters,
  onApplySavedView,
  onClear,
  onFilterChange,
  onSaveSubmit,
  onShowSaveViewChange,
  onSwimlaneChange,
  saveViewName,
  savedViews,
  setSaveViewName,
  showSaveView,
  swimlane,
  viewSaving,
}: {
  assignees: TenantUser[];
  filters: BoardFilters;
  onApplySavedView: (viewId: string) => void;
  onClear: () => void;
  onFilterChange: <K extends keyof BoardFilters>(key: K, value: BoardFilters[K]) => void;
  onSaveSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onShowSaveViewChange: (value: boolean) => void;
  onSwimlaneChange: (value: SwimlaneMode) => void;
  saveViewName: string;
  savedViews: TaskSavedView[];
  setSaveViewName: (value: string) => void;
  showSaveView: boolean;
  swimlane: SwimlaneMode;
  viewSaving: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
          <input
            value={filters.search}
            onChange={(event) => onFilterChange("search", event.target.value)}
            placeholder="Search title, key, label..."
            className="h-9 w-full rounded-lg border border-line bg-background pl-9 pr-3 text-[12px] font-semibold text-foreground outline-none transition focus:border-primary"
          />
        </label>
        <SelectPill>
          <select value={filters.priority} onChange={(event) => onFilterChange("priority", event.target.value as BoardFilters["priority"])} className={selectClass}>
            <option value="">All priorities</option>
            {(Object.keys(priorityLabels) as TaskPriority[]).map((priority) => (
              <option key={priority} value={priority}>{priorityLabels[priority]}</option>
            ))}
          </select>
        </SelectPill>
        <SelectPill>
          <select value={filters.assigneeId} onChange={(event) => onFilterChange("assigneeId", event.target.value)} className={selectClass}>
            <option value="">All assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName || user.lastName ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : user.email}
              </option>
            ))}
          </select>
        </SelectPill>
        <SelectPill>
          <select value={filters.due} onChange={(event) => onFilterChange("due", event.target.value as DueFilter)} className={selectClass}>
            <option value="">Any due date</option>
            <option value="OVERDUE">Overdue</option>
            <option value="TODAY">Due today</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="NONE">No due date</option>
          </select>
        </SelectPill>
        <button
          type="button"
          onClick={() => onFilterChange("blocked", !filters.blocked)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-black transition",
            filters.blocked ? "border-red-200 bg-red-50 text-red-600" : "border-line bg-background text-ink-soft hover:text-foreground",
          )}
        >
          <AlertTriangle className="size-3.5" />
          Blocked
        </button>
        <SelectPill>
          <select value={swimlane} onChange={(event) => onSwimlaneChange(event.target.value as SwimlaneMode)} className={selectClass}>
            <option value="NONE">No swimlane</option>
            <option value="SPRINT">By sprint</option>
            <option value="ASSIGNEE">By assignee</option>
            <option value="EPIC">By epic</option>
            <option value="PRIORITY">By priority</option>
          </select>
        </SelectPill>
        <SelectPill>
          <select defaultValue="" onChange={(event) => onApplySavedView(event.target.value)} className={selectClass}>
            <option value="">Saved views</option>
            {savedViews.map((view) => (
              <option key={view.id} value={view.id}>{view.name}</option>
            ))}
          </select>
        </SelectPill>
        <button
          type="button"
          onClick={() => onShowSaveViewChange(!showSaveView)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-background px-3 text-[12px] font-black text-foreground transition hover:bg-panel-muted"
        >
          <Save className="size-3.5" />
          Save view
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-black text-ink-soft transition hover:text-foreground"
        >
          <SlidersHorizontal className="size-3.5" />
          Reset
        </button>
      </div>
      {showSaveView ? (
        <form onSubmit={onSaveSubmit} className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-background p-2">
          <input
            value={saveViewName}
            onChange={(event) => setSaveViewName(event.target.value)}
            placeholder="Name this board view"
            className="h-9 min-w-[220px] flex-1 rounded-lg border border-line bg-white px-3 text-[12px] font-semibold text-foreground outline-none transition focus:border-primary"
            maxLength={80}
            required
          />
          <button type="submit" disabled={viewSaving} className="tb-yellow-button h-9 rounded-lg px-4 text-[12px] font-black disabled:opacity-60">
            {viewSaving ? "Saving..." : "Save private view"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function BoardInsights({ board, visibleTasks }: { board: ProjectBoard; visibleTasks: Task[] }) {
  const blocked = visibleTasks.filter((task) => task.card?.flags.isBlocked).length;
  const overdue = visibleTasks.filter((task) => task.card?.flags.isOverdue).length;
  const dueToday = visibleTasks.filter((task) => task.card?.flags.isDueToday).length;
  const unassigned = visibleTasks.filter((task) => !getCardAssignees(task).length).length;
  const done = visibleTasks.filter((task) => task.status === "DONE").length;
  const points = visibleTasks.reduce((sum, task) => sum + (task.storyPoints ?? task.card?.storyPoints ?? 0), 0);
  const completion = visibleTasks.length ? Math.round((done / visibleTasks.length) * 100) : board.summary?.completionRate ?? 0;

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <InsightTile label="Flow health" value={`${completion}%`} helper={`${done}/${visibleTasks.length} visible done`} tone="emerald" />
      <InsightTile label="Delivery pressure" value={String(blocked + overdue)} helper={`${blocked} blocked · ${overdue} overdue`} tone={blocked || overdue ? "red" : "emerald"} />
      <InsightTile label="Due focus" value={String(dueToday)} helper={`${points} visible story points`} tone="amber" />
      <InsightTile label="Ownership" value={String(unassigned)} helper="tasks without an owner" tone={unassigned ? "blue" : "emerald"} />
    </div>
  );
}

function InsightTile({ helper, label, tone, value }: { helper: string; label: string; tone: "amber" | "blue" | "emerald" | "red"; value: string }) {
  const toneClass = {
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    red: "text-red-600 bg-red-50",
  }[tone];
  return (
    <div className="rounded-xl border border-line bg-white p-3 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <span className={cn("rounded-lg px-2 py-0.5 text-[22px] font-black leading-none", toneClass)}>{value}</span>
        <span className="text-right text-[10px] font-bold text-ink-soft">{helper}</span>
      </div>
    </div>
  );
}

type SwimlaneGroup = {
  id: string;
  name: string;
  taskCount: number;
  storyPoints: number;
  columns: BoardColumn[];
};

function SwimlaneBoard({
  density,
  expandedTaskIds,
  lanes,
  onQuickAssign,
  onQuickUpdate,
  onToggleExpanded,
  sprints,
  users,
}: {
  density: BoardDensity;
  expandedTaskIds: Set<string>;
  lanes: SwimlaneGroup[];
  onQuickAssign: (task: Task, userId: string) => void;
  onQuickUpdate: (task: Task, patch: Partial<Pick<Task, "status" | "priority" | "dueDate">>) => void;
  onToggleExpanded: (taskIdValue: string) => void;
  sprints: Sprint[];
  users: TenantUser[];
}) {
  if (!lanes.length) return <EmptyBoard />;
  return (
    <div className="space-y-4 overflow-x-auto pb-4 tb-scrollbar">
      {lanes.map((lane) => (
        <section key={lane.id} className="min-w-max rounded-2xl border border-line bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">Swimlane</p>
              <h2 className="text-[16px] font-black tracking-tight text-foreground">{lane.name}</h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-black text-ink-soft">
              <span className="rounded-full border border-line bg-background px-2.5 py-1">{lane.taskCount} tasks</span>
              <span className="rounded-full border border-line bg-background px-2.5 py-1">{lane.storyPoints} pts</span>
            </div>
          </div>
          <div className="flex gap-3">
            {lane.columns.map((column) => (
              <div key={`${lane.id}-${column.id}`} className={cn("shrink-0 rounded-xl border border-line bg-background", density === "compact" ? "w-[286px]" : "w-[320px]")}>
                <div className="border-b border-line px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-[13px] font-black text-foreground">{column.name}</h3>
                    <span className="text-[10px] font-black text-ink-soft">{column.tasks?.length ?? 0}</span>
                  </div>
                </div>
                <div className="space-y-1.5 p-2">
                  {(column.tasks ?? []).length ? (
                    (column.tasks ?? []).map((task) => (
                      <RichTaskCard
                        key={task.id}
                        density={density}
                        expanded={expandedTaskIds.has(task.id)}
                        onQuickAssign={onQuickAssign}
                        onQuickUpdate={onQuickUpdate}
                        onToggleExpanded={onToggleExpanded}
                        sprints={sprints}
                        task={task}
                        users={users}
                      />
                    ))
                  ) : (
                    <div className="flex min-h-20 items-center justify-center rounded-xl border border-dashed border-line bg-white text-[11px] font-semibold text-ink-soft">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TaskQuickEdit({
  onAssign,
  onUpdate,
  task,
  users,
}: {
  onAssign?: (userId: string) => void;
  onUpdate?: (patch: Partial<Pick<Task, "status" | "priority" | "dueDate">>) => void;
  task: Task;
  users: TenantUser[];
}) {
  const primaryAssignee = getCardAssignees(task)[0]?.userId ?? "";
  const canEdit = Boolean(onUpdate);
  const canAssign = Boolean(onAssign);
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      <select
        value={task.status}
        disabled={!canEdit}
        onChange={(event) => onUpdate?.({ status: event.target.value as TaskStatus })}
        className="h-8 rounded-lg border border-line bg-white px-2 text-[11px] font-bold text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-55"
      >
        {[...taskStatusOrder, "CANCELLED" as TaskStatus].map((status) => (
          <option key={status} value={status}>{taskStatusLabels[status]}</option>
        ))}
      </select>
      <select
        value={task.priority}
        disabled={!canEdit}
        onChange={(event) => onUpdate?.({ priority: event.target.value as TaskPriority })}
        className="h-8 rounded-lg border border-line bg-white px-2 text-[11px] font-bold text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-55"
      >
        {(Object.keys(priorityLabels) as TaskPriority[]).map((priority) => (
          <option key={priority} value={priority}>{priorityLabels[priority]}</option>
        ))}
      </select>
      <select
        value={primaryAssignee}
        disabled={!canAssign}
        onChange={(event) => onAssign?.(event.target.value)}
        className="h-8 rounded-lg border border-line bg-white px-2 text-[11px] font-bold text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-55"
      >
        <option value="">Unassigned</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.firstName || user.lastName ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : user.email}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={task.dueDate ? toDateInputValue(task.dueDate) : ""}
        disabled={!canEdit}
        onChange={(event) => onUpdate?.({ dueDate: event.target.value ? toNoonIso(event.target.value) : null })}
        className="h-8 rounded-lg border border-line bg-white px-2 text-[11px] font-bold text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-55"
      />
    </div>
  );
}

function TaskSummaryPreview({ task }: { task: Task }) {
  const card = task.card;
  const checklist = card?.checklist;
  const latest = card?.comments.latest;
  const attachments = card?.attachments;
  if (!card) {
    return (
      <p className="rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] font-semibold text-ink-soft">
        Open the task for full details.
      </p>
    );
  }
  return (
    <div className="grid gap-1.5 text-[10px] font-bold text-ink-soft">
      {checklist?.total ? (
        <div className="rounded-lg border border-line bg-white p-2">
          <div className="flex items-center justify-between gap-2">
            <span>Checklist</span>
            <span>{checklist.completed}/{checklist.total}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${checklist.percent}%` }} />
          </div>
        </div>
      ) : null}
      {latest ? (
        <div className="rounded-lg border border-line bg-white p-2">
          <p className="mb-1 text-[9px] font-black uppercase tracking-[0.12em] text-ink-soft">Latest comment</p>
          <p className="line-clamp-2 text-[11px] leading-snug text-foreground">{latest.body}</p>
        </div>
      ) : null}
      {attachments?.count ? (
        <div className="rounded-lg border border-line bg-white p-2">
          <div className="flex items-center justify-between gap-2">
            <span>{attachments.count} attachments</span>
            <span>{attachments.previews.slice(0, 2).map((file) => file.kind).join(" · ") || "Files"}</span>
          </div>
        </div>
      ) : null}
      {!checklist?.total && !latest && !attachments?.count ? (
        <p className="rounded-lg border border-line bg-white px-2 py-1.5">No board preview yet. Open the task for full detail.</p>
      ) : null}
    </div>
  );
}

function BoardColView({
  canCreateTask, canManageColumns, canMoveTasks, column, density, expandedTaskIds, onDelete, onQuickAdd, onQuickAssign, onQuickUpdate, onSprintChange, onToggleExpanded, onUpdate, sprints, users,
}: {
  canCreateTask: boolean;
  canManageColumns: boolean;
  canMoveTasks: boolean;
  column: BoardColumn;
  density: BoardDensity;
  expandedTaskIds: Set<string>;
  onDelete: (col: BoardColumn) => void;
  onQuickAssign: (task: Task, userId: string) => void;
  onQuickAdd: (columnId: string, title: string) => void;
  onQuickUpdate: (task: Task, patch: Partial<Pick<Task, "status" | "priority" | "dueDate">>) => void;
  onSprintChange: (task: Task, sprintId: string) => void;
  onToggleExpanded: (taskIdValue: string) => void;
  onUpdate: (colId: string, payload: Partial<BoardColumn>) => void;
  sprints: Sprint[];
  users: TenantUser[];
}) {
  const [editing,      setEditing]      = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle,   setQuickTitle]   = useState("");
  const compact = density === "compact";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: colId(column.id),
    data: { type: "column", column },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${column.id}`,
    data: { type: "column", column },
  });
  const color        = column.status ? STATUS_COLOR[column.status] : "#ffd400";
  const metrics      = column.metrics;
  const taskCount    = metrics?.taskCount ?? column.tasks?.length ?? 0;
  const storyPoints  = metrics?.storyPoints ?? (column.tasks ?? []).reduce((sum, task) => sum + (task.storyPoints ?? 0), 0);
  const blockedCount = metrics?.blockedCount ?? (column.tasks ?? []).filter((task) => task.card?.flags.isBlocked).length;
  const overdueCount = metrics?.overdueCount ?? (column.tasks ?? []).filter((task) => task.card?.flags.isOverdue).length;
  const highCount    = metrics?.highPriorityCount ?? (column.tasks ?? []).filter((task) => task.card?.flags.isHighPriority).length;
  const completion   = metrics?.completionRate ?? 0;
  const wipLimit     = column.wip?.limit ?? column.wipLimit ?? null;
  const wipUsed      = column.wip?.used ?? taskCount;
  const wipPct       = wipLimit ? Math.min(100, Math.round((wipUsed / wipLimit) * 100)) : 0;
  const wipOver      = column.isOverWipLimit || metrics?.isOverWipLimit || Boolean(wipLimit && wipUsed > wipLimit);
  const wipColor     = wipOver ? "#ef4444" : wipPct > 75 ? "#f59e0b" : color;
  const style        = { transform: CSS.Transform.toString(transform), transition };

  /* Collapsed state */
  if (column.isCollapsed) {
    return (
      <aside
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex h-[600px] w-12 shrink-0 cursor-pointer select-none flex-col items-center overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:shadow-md",
          isDragging && "opacity-40",
        )}
      >
        <div className="h-px w-full bg-line" />
        <button
          type="button"
          disabled={!canManageColumns}
          className="mt-3 flex size-8 items-center justify-center rounded-xl bg-white text-ink-soft shadow-sm transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          {...(canManageColumns ? attributes : {})}
          {...(canManageColumns ? listeners : {})}
        >
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onUpdate(column.id, { isCollapsed: false })}
          className="mt-2 flex size-8 items-center justify-center rounded-xl border border-line bg-white text-foreground transition hover:bg-panel-muted"
          aria-label="Expand"
        >
          <ListCollapse className="size-3.5" />
        </button>
        <span className="mt-5 flex-1 [writing-mode:vertical-rl] rotate-180 text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
          {column.name}
        </span>
        <div className="mb-3 grid gap-1 text-center">
          <span className="rounded-lg bg-white px-1.5 py-1 text-[10px] font-black text-foreground shadow-sm">{taskCount}</span>
          <span className="rounded-lg border border-line bg-white px-1.5 py-1 text-[9px] font-black text-ink-soft">
            {storyPoints}pt
          </span>
        </div>
      </aside>
    );
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex shrink-0 flex-col overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_8px_24px_rgba(17,17,17,0.06)] transition",
        compact ? "w-[286px]" : "w-[320px]",
        isDragging && "opacity-40",
      )}
    >
      {/* Status strip */}
      <div className="h-px w-full shrink-0 bg-line" />

      {/* Column header */}
      <header className="shrink-0 border-b border-line bg-white px-3 pb-2.5 pt-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            disabled={!canManageColumns}
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl text-ink-soft/50 transition hover:bg-white hover:text-ink-soft hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            {...(canManageColumns ? attributes : {})}
            {...(canManageColumns ? listeners : {})}
            aria-label="Drag"
          >
            <GripVertical className="size-3.5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
              <h2 className="min-w-0 flex-1 truncate text-[15px] font-black tracking-tight text-foreground">{column.name}</h2>
            </div>
            <p className="mt-0.5 truncate text-[10.5px] font-semibold text-ink-soft">
              {taskCount} tasks · {storyPoints} pts · {wipLimit ? `WIP ${wipUsed}/${wipLimit}` : "No WIP limit"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            disabled={!canManageColumns}
            title={canManageColumns ? "Edit column" : "Your role cannot manage columns"}
            className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-ink-soft transition hover:bg-panel-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
          >
            <MoreVertical className="size-3.5" />
          </button>
        </div>

        <div className="hidden">
        {/* Status label */}
        <p className="mt-1 pl-[26px] text-[10px] font-medium text-ink-soft">
          {column.status ? taskStatusLabels[column.status] : "Custom"}&ensp;·&ensp;
          {column.wipLimit ? `WIP ${column.wipLimit}` : "No limit"}
        </p>

        {/* WIP bar */}
        {column.wipLimit ? (
          <div className="mt-2 pl-[26px]">
            <div className="h-[2px] w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${wipPct}%`, background: wipColor }} />
            </div>
          </div>
        ) : null}

        {/* Wip exceeded */}
        {column.isOverWipLimit ? (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
            WIP limit exceeded
          </p>
        ) : null}
        </div>

        {compact ? null : (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <ColumnMetric label="Open" value={taskCount} color={color} />
              <ColumnMetric label="Pts" value={storyPoints} color="#111111" />
              <ColumnMetric label="Block" value={blockedCount} color={blockedCount ? "#dc2626" : "#64748b"} />
              <ColumnMetric label="Late" value={overdueCount} color={overdueCount ? "#ea580c" : "#64748b"} />
            </div>

            <div className="mt-2 rounded-xl border border-line bg-background p-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-ink-soft">Health</span>
                <span className="text-[10px] font-black text-foreground">{completion}% done</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line/70">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${completion}%` }} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[9px] font-bold text-ink-soft">
                {wipLimit ? (
                  <span className="rounded-full border border-line bg-white px-2 py-0.5" style={{ color: wipColor }}>
                    WIP {wipUsed}/{wipLimit}
                  </span>
                ) : null}
                {highCount > 0 ? <span className="rounded-full border border-line bg-white px-2 py-0.5 text-amber-700">{highCount} high</span> : null}
              </div>
            </div>
          </>
        )}

        {wipOver ? (
          <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-black text-red-600">
            WIP limit exceeded
          </p>
        ) : null}

        {/* Column editor */}
        {editing ? (
          <ColumnEditor
            column={column}
            onCancel={() => setEditing(false)}
            onDelete={() => { setEditing(false); onDelete(column); }}
            onSubmit={(p) => { setEditing(false); onUpdate(column.id, p); }}
          />
        ) : null}
      </header>

      {/* Task drop zone */}
      <div
        ref={setDropRef}
        className={cn(
          "min-h-[220px] flex-1 overflow-y-auto bg-white px-2.5 pb-2.5 pt-2.5 tb-scrollbar",
          density === "compact" ? "space-y-1.5" : "space-y-2",
          isOver && "bg-primary/10",
        )}
        style={{ maxHeight: density === "compact" ? "calc(100vh - 275px)" : "calc(100vh - 320px)" }}
      >
        <SortableContext
          items={(column.tasks ?? []).map((t) => taskId(t.id))}
          strategy={verticalListSortingStrategy}
        >
          {(column.tasks ?? []).map((task) => (
            <SortableCard
              key={task.id}
              columnId={column.id}
              density={density}
              sprints={sprints}
              task={task}
              expanded={expandedTaskIds.has(task.id)}
              onQuickAssign={onQuickAssign}
              onQuickUpdate={onQuickUpdate}
              onSprintChange={onSprintChange}
              onToggleExpanded={onToggleExpanded}
              canMoveTasks={canMoveTasks}
              users={users}
            />
          ))}
        </SortableContext>

        {!column.tasks?.length ? (
          <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-line bg-background">
            <p className="text-[11px] text-ink-soft">Drop tasks here</p>
          </div>
        ) : null}
      </div>

      {/* Quick add */}
      <div className="shrink-0 border-t border-line bg-white px-2.5 pb-2.5 pt-2">
        {showQuickAdd ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (quickTitle.trim()) {
                onQuickAdd(column.id, quickTitle);
                setQuickTitle("");
                setShowQuickAdd(false);
              }
            }}
            className="flex items-center gap-1.5"
          >
            <input
              autoFocus
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { setShowQuickAdd(false); setQuickTitle(""); } }}
              placeholder="Task title…"
              className="min-w-0 flex-1 rounded-lg border border-line bg-background px-2.5 py-1.5 text-[12px] font-medium text-foreground placeholder:text-ink-soft/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/25"
            />
            <button
              type="submit"
              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#ffd400] text-foreground transition hover:bg-[#f5ca00]"
              aria-label="Add"
            >
              <Plus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setShowQuickAdd(false); setQuickTitle(""); }}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition hover:bg-panel-muted"
              aria-label="Cancel"
            >
              <X className="size-3" />
            </button>
          </form>
        ) : canCreateTask ? (
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-background py-1.5 text-[11px] font-black text-ink-soft transition hover:border-primary/60 hover:bg-primary/10 hover:text-foreground"
          >
            <Plus className="size-3" />
            Add task
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-background py-1.5 text-[11px] font-black text-ink-soft opacity-55"
          >
            <Plus className="size-3" />
            Add task
          </button>
        )}
      </div>

      {/* Collapse */}
      <button
        type="button"
        onClick={() => onUpdate(column.id, { isCollapsed: true })}
        disabled={!canManageColumns}
        className="shrink-0 border-t border-line bg-white py-1.5 text-[10px] font-bold text-ink-soft transition hover:bg-panel-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
      >
        Collapse
      </button>
    </section>
  );
}

/* ─── Sortable wrapper ─────────────────────────────────────────────────────── */

function ColumnMetric({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="rounded-full border border-line bg-white px-2.5 py-1">
      <p className="inline text-[8px] font-black uppercase tracking-[0.12em] text-ink-soft">{label}</p>
      <p className="ml-1.5 inline text-[12px] font-black leading-none" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function SortableCard({
  canMoveTasks, columnId: cId, density, expanded, onQuickAssign, onQuickUpdate, onSprintChange, onToggleExpanded, sprints, task, users,
}: {
  canMoveTasks: boolean;
  columnId: string;
  density: BoardDensity;
  expanded: boolean;
  onQuickAssign: (task: Task, userId: string) => void;
  onQuickUpdate: (task: Task, patch: Partial<Pick<Task, "status" | "priority" | "dueDate">>) => void;
  onSprintChange: (task: Task, sprintId: string) => void;
  onToggleExpanded: (taskIdValue: string) => void;
  sprints: Sprint[];
  task: Task;
  users: TenantUser[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: taskId(task.id),
    data: { type: "task", task, columnId: cId },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-30")}
    >
      <RichTaskCard
        density={density}
        task={task}
        sprints={sprints}
        expanded={expanded}
        dragAttributes={canMoveTasks && task.permissions?.canMove !== false ? attributes : undefined}
        dragListeners={canMoveTasks && task.permissions?.canMove !== false ? listeners : undefined}
        onQuickAssign={task.permissions?.canAssign === false ? undefined : onQuickAssign}
        onQuickUpdate={task.permissions?.canEdit === false ? undefined : onQuickUpdate}
        onSprintChange={task.permissions?.canEdit === false ? undefined : onSprintChange}
        onToggleExpanded={onToggleExpanded}
        users={users}
      />
    </div>
  );
}

/* ─── Task card ─────────────────────────────────────────────────────────────── */

const TASK_TYPE_SHORT: Record<TaskType, string> = {
  TASK: "Task",
  BUG: "Bug",
  STORY: "Story",
  EPIC: "Epic",
  FEATURE: "Feature",
  INCIDENT: "Incident",
  APPROVAL: "Approval",
  CHANGE_REQUEST: "Change",
  MILESTONE: "Milestone",
};

function RichTaskCard({
  density = "compact",
  dragAttributes,
  dragListeners,
  dragging,
  expanded = false,
  onQuickAssign,
  onQuickUpdate,
  onSprintChange,
  onToggleExpanded,
  sprints = [],
  task,
  users = [],
}: {
  density?: BoardDensity;
  dragAttributes?: DragHandleAttributes;
  dragListeners?: DragHandleListeners;
  dragging?: boolean;
  expanded?: boolean;
  onQuickAssign?: (task: Task, userId: string) => void;
  onQuickUpdate?: (task: Task, patch: Partial<Pick<Task, "status" | "priority" | "dueDate">>) => void;
  onSprintChange?: (task: Task, sprintId: string) => void;
  onToggleExpanded?: (taskIdValue: string) => void;
  sprints?: Sprint[];
  task: Task;
  users?: TenantUser[];
}) {
  const card = task.card;
  const compact = density === "compact";
  const assignees = getCardAssignees(task);
  const labels = getCardLabels(task);
  const sprint = card?.sprint ?? sprints.find((item) => item.id === task.sprintId) ?? null;
  const due = card?.due ?? getTaskDue(task);
  const blockers = card?.dependencies.blockedByCount ?? task._count?.dependenciesTo ?? 0;
  const blocking = card?.dependencies.blockingCount ?? task._count?.dependenciesFrom ?? 0;
  const railColor = card?.colors.rail ?? PRIORITY_COLOR[task.priority];
  const statusColor = card?.colors.status ?? STATUS_COLOR[task.status];
  const dueTone = getDueTone(due.state);
  const canQuickEdit = task.permissions?.canEdit !== false && Boolean(onQuickUpdate);
  const canQuickAssign = task.permissions?.canAssign !== false && Boolean(onQuickAssign);

  return (
    <article
      {...dragAttributes}
      {...dragListeners}
      className={cn(
        "group relative cursor-grab overflow-hidden rounded-[14px] border border-line bg-white text-foreground active:cursor-grabbing",
        "shadow-[0_3px_10px_rgba(17,17,17,0.07)] transition-all duration-150",
        "hover:-translate-y-0.5 hover:border-[#cfc4a6] hover:shadow-[0_8px_18px_rgba(17,17,17,0.10)]",
        card?.flags.isBlocked && "border-red-200",
        card?.flags.isOverdue && "border-orange-200",
        dragging && "w-[292px] rotate-[1deg] shadow-2xl",
      )}
    >
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: railColor }} />

      <div className={cn("pl-3.5 pr-2.5", compact ? "py-2.5" : "py-3.5")}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-line bg-background px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-ink-soft">
                <TaskTypeGlyph type={task.type} />
                {TASK_TYPE_SHORT[task.type] ?? task.type}
              </span>
              {!compact && sprint ? (
                <span className="inline-flex max-w-[116px] items-center gap-1 truncate rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-600">
                  <Rocket className="size-3 shrink-0" />
                  <span className="truncate">{sprint.name}</span>
                </span>
              ) : !compact ? (
                <span className="rounded-lg bg-[#f4f0e2] px-2 py-1 text-[9px] font-black text-ink-soft">Backlog</span>
              ) : null}
            </div>

            <Link
              href={`/tasks/${task.id}`}
              className={cn(
                "block line-clamp-2 font-black leading-snug tracking-tight text-foreground transition hover:text-[#b8870a]",
                compact ? "mt-1.5 text-[13px]" : "mt-2 text-[14px]",
              )}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {task.title}
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {onToggleExpanded ? (
              <button
                type="button"
                onClick={() => onToggleExpanded(task.id)}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg border border-line bg-background text-ink-soft transition hover:bg-panel-muted hover:text-foreground",
                  expanded && "bg-foreground text-white hover:bg-foreground hover:text-white",
                )}
                aria-label={expanded ? "Collapse card" : "Expand card"}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <ChevronDown className={cn("size-3.5 transition", expanded && "rotate-180")} />
              </button>
            ) : null}
            <Link
              href={`/tasks/${task.id}`}
              className="flex size-7 items-center justify-center rounded-lg border border-line bg-background text-ink-soft opacity-70 transition hover:bg-foreground hover:text-white group-hover:opacity-100"
              aria-label="Open task"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className={cn("flex flex-wrap items-center gap-1.5", compact ? "mt-2" : "mt-2.5")}>
          <TaskSignalPill color={statusColor}>{taskStatusLabels[task.status]}</TaskSignalPill>
          <TaskSignalPill color={PRIORITY_COLOR[task.priority]}>{priorityLabels[task.priority]}</TaskSignalPill>
        </div>

        {!compact && labels.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {labels.slice(0, 3).map((label) => (
              <span
                key={label.id}
                className="max-w-[112px] truncate rounded-md px-1.5 py-1 text-[9px] font-black"
                style={{ background: `${label.color ?? "#64748b"}18`, color: label.color ?? "#475569" }}
                title={label.name}
              >
                {label.name}
              </span>
            ))}
            {labels.length > 3 ? <span className="rounded-md bg-[#f4f0e2] px-1.5 py-1 text-[9px] font-black text-ink-soft">+{labels.length - 3}</span> : null}
          </div>
        ) : null}

        {!compact && (blockers > 0 || blocking > 0) ? (
          <div className="mt-2 grid gap-1.5">
            {blockers > 0 ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] font-black text-red-600">
                <AlertTriangle className="size-3.5" />
                Blocked by {blockers}
              </div>
            ) : null}
            {blocking > 0 ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] font-black text-amber-700">
                <GitBranch className="size-3.5" />
                Blocking {blocking}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={cn("flex items-center gap-2 border-t border-line", compact ? "mt-2 pt-2" : "mt-3 pt-2.5")}>
          <AvatarStack people={assignees} />

          <div className="flex flex-1 items-center justify-end gap-1.5 text-[10px] font-black text-ink-soft">
            <span className={cn("inline-flex items-center gap-1 rounded-lg px-1.5 py-1", dueTone.className)}>
              <CalendarClock className="size-3" />
              {due.date ? formatShortDate(due.date) : "No due"}
            </span>
          </div>
        </div>

        {expanded ? (
          <div
            className="mt-2.5 grid gap-2 rounded-xl border border-line bg-background p-2"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <TaskQuickEdit
              task={task}
              users={users}
              onAssign={canQuickAssign ? (userId) => onQuickAssign?.(task, userId) : undefined}
              onUpdate={canQuickEdit ? (patch) => onQuickUpdate?.(task, patch) : undefined}
            />
            <TaskSummaryPreview task={task} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function TaskSignalPill({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-line bg-background px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em]" style={{ color }}>
      {children}
    </span>
  );
}

function IconCount({ icon, value }: { icon: ReactNode; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-line bg-background px-1.5 py-0.5">
      {icon}
      {value}
    </span>
  );
}

function TaskTypeGlyph({ type }: { type: TaskType }) {
  if (type === "BUG") return <Bug className="size-3" />;
  if (type === "INCIDENT") return <AlertTriangle className="size-3" />;
  if (type === "APPROVAL") return <ShieldCheck className="size-3" />;
  if (type === "EPIC" || type === "STORY" || type === "FEATURE") return <Sparkles className="size-3" />;
  if (type === "MILESTONE") return <Timer className="size-3" />;
  return <FileText className="size-3" />;
}

function AvatarStack({ people }: { people: ReturnType<typeof getCardAssignees> }) {
  if (people.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#ded6bd] bg-[#faf8ef] px-2 py-1 text-[10px] font-black text-ink-soft">
        <Users className="size-3" />
        Unassigned
      </span>
    );
  }

  return (
    <div className="flex min-w-0 items-center">
      {people.slice(0, 4).map((person, index) => (
        <span
          key={`${person.userId}-${index}`}
          className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#111111] text-[9px] font-black text-white shadow-sm"
          style={{ marginLeft: index ? -8 : 0 }}
          title={`${person.firstName} ${person.lastName}`.trim() || person.email}
        >
          {person.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsFromParts(person.firstName, person.lastName, person.email)
          )}
        </span>
      ))}
      {people.length > 4 ? (
        <span className="-ml-2 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#ffd400] text-[9px] font-black text-foreground">
          +{people.length - 4}
        </span>
      ) : null}
    </div>
  );
}

function AttachmentPreviewStrip({ previews }: { previews: NonNullable<Task["card"]>["attachments"]["previews"] }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {previews.slice(0, 3).map((file) => (
        <div key={file.id} className="min-w-0 rounded-xl border border-[#ded6bd] bg-white p-1.5">
          <div className="flex h-10 items-center justify-center rounded-lg bg-[#f4f0e2] text-[10px] font-black text-foreground">
            {file.kind === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file.fileUrl} alt="" className="h-full w-full rounded-lg object-cover" />
            ) : (
              file.kind
            )}
          </div>
          <p className="mt-1 truncate text-[9px] font-bold text-ink-soft">{file.fileName}</p>
        </div>
      ))}
    </div>
  );
}

function getCardAssignees(task: Task) {
  if (task.card?.assignees?.length) return task.card.assignees;
  return (task.assignees ?? []).map((assignee) => ({
    id: assignee.id,
    userId: assignee.user.id,
    email: assignee.user.email,
    firstName: assignee.user.firstName,
    lastName: assignee.user.lastName,
    avatarUrl: assignee.user.avatarUrl,
  }));
}

function getCardLabels(task: Task) {
  if (task.card?.labels?.length) return task.card.labels;
  return (task.labels ?? []).map(({ id, label }) => ({
    id,
    labelId: label.id,
    name: label.name,
    color: label.color,
  }));
}

function getTaskDue(task: Task) {
  if (task.completedAt) return { state: "DONE" as const, date: task.dueDate ?? null, daysUntil: null };
  if (!task.dueDate) return { state: "NONE" as const, date: null, daysUntil: null };
  const due = new Date(task.dueDate);
  const today = new Date();
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const daysUntil = Math.round((dueStart - todayStart) / 86_400_000);
  return {
    state: daysUntil < 0 ? "OVERDUE" as const : daysUntil === 0 ? "TODAY" as const : "UPCOMING" as const,
    date: task.dueDate,
    daysUntil,
  };
}

function getDueTone(state: ReturnType<typeof getTaskDue>["state"]) {
  if (state === "OVERDUE") return { className: "bg-red-50 text-red-600" };
  if (state === "TODAY") return { className: "bg-amber-50 text-amber-700" };
  if (state === "DONE") return { className: "bg-emerald-50 text-emerald-700" };
  if (state === "UPCOMING") return { className: "bg-blue-50 text-blue-600" };
  return { className: "bg-[#f4f0e2] text-ink-soft" };
}

function getTaskEstimateLabel(task: Task) {
  const estimateMins = task.card?.estimate.estimateMins ?? task.estimateMins;
  const actualMins = task.card?.estimate.actualMins ?? task.actualMins;
  if (typeof estimateMins !== "number" && typeof actualMins !== "number") return "";
  if (typeof estimateMins === "number" && typeof actualMins === "number" && actualMins > 0) {
    return `${formatMinutes(actualMins)}/${formatMinutes(estimateMins)}`;
  }
  return typeof estimateMins === "number" ? formatMinutes(estimateMins) : formatMinutes(actualMins ?? 0);
}

function formatMinutes(value: number) {
  if (value < 60) return `${value}m`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function initialsFromParts(firstName?: string, lastName?: string, email?: string) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return (initials || email?.slice(0, 2) || "UN").toUpperCase();
}

function TaskCard({
  density = "compact",
  dragAttributes,
  dragListeners,
  dragging,
  onSprintChange,
  sprints = [],
  task,
}: {
  density?: BoardDensity;
  dragAttributes?: DragHandleAttributes;
  dragListeners?: DragHandleListeners;
  dragging?: boolean;
  onSprintChange?: (task: Task, sprintId: string) => void;
  sprints?: Sprint[];
  task: Task;
}) {
  const [sprintMenuPos, setSprintMenuPos] = useState<{ top: number; right: number } | null>(null);
  const assignee      = task.assignees?.[0]?.user;
  const priColor      = PRIORITY_COLOR[task.priority];
  const currentSprint = sprints.find((s) => s.id === task.sprintId);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-line/60 bg-panel",
        "transition-all duration-150 hover:border-[#ffd400]/40 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
        dragging && "w-[264px] rotate-[1deg] shadow-xl",
      )}
    >
      {/* Priority left stripe */}
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: priColor }} />

      <div className="py-2.5 pl-3.5 pr-3">
        {/* Row 1: key + title + assignee/drag stack */}
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-black tracking-widest" style={{ color: "#b8870a" }}>
              {task.key}
            </span>
            <Link
              href={`/projects/${task.projectId}?task=${task.id}`}
              className="mt-0.5 block line-clamp-2 text-[12px] font-semibold leading-snug text-foreground transition hover:text-primary"
            >
              {task.title}
            </Link>
          </div>

          {/* Right column: assignee + drag handle */}
          <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
            <span
              className="flex size-[22px] items-center justify-center rounded-md text-[7px] font-black text-white"
              style={{ background: "#1e1b2e" }}
              title={assignee ? `${assignee.firstName} ${assignee.lastName}` : "Unassigned"}
            >
              {userInitials(assignee)}
            </span>
            <button
              type="button"
              className="flex size-4 items-center justify-center text-ink-soft/20 opacity-0 transition group-hover:opacity-100 hover:text-ink-soft"
              {...dragAttributes}
              {...dragListeners}
              aria-label="Drag task"
            >
              <GripVertical className="size-3" />
            </button>
          </div>
        </div>

        {/* Row 2: priority · pts · comments · sprint icon · due */}
        <div className="mt-2 flex items-center gap-1.5">
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: priColor }} />
          <span className="text-[9px] font-semibold text-ink-soft">{priorityLabels[task.priority]}</span>
          {task.storyPoints != null && (
            <span className="text-[9px] text-ink-soft/60">· {task.storyPoints}pt</span>
          )}
          {(task._count?.comments ?? 0) > 0 && (
            <span className="text-[9px] text-ink-soft/60">· {task._count!.comments}c</span>
          )}

          <div className="flex-1" />

          {/* Sprint icon trigger */}
          {onSprintChange && sprints.length > 0 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setSprintMenuPos(
                    sprintMenuPos
                      ? null
                      : { top: rect.bottom + 4, right: window.innerWidth - rect.right },
                  );
                }}
                title={currentSprint?.name ?? "Backlog — click to assign sprint"}
                className={cn(
                  "flex items-center gap-1 rounded-md px-1 py-0.5 text-[9px] font-semibold transition hover:bg-panel-muted",
                  currentSprint ? "text-blue-500" : "text-ink-soft/30 hover:text-ink-soft",
                )}
              >
                <Rocket className="size-3 shrink-0" />
                {currentSprint && (
                  <span className="max-w-[52px] truncate">{currentSprint.name}</span>
                )}
              </button>

              {sprintMenuPos && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSprintMenuPos(null)} />
                  <div
                    className="fixed z-50 min-w-[148px] overflow-hidden rounded-xl border border-line bg-panel shadow-xl"
                    style={{ top: sprintMenuPos.top, right: sprintMenuPos.right }}
                  >
                    <button
                      type="button"
                      onClick={() => { onSprintChange(task, ""); setSprintMenuPos(null); }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold transition hover:bg-panel-muted",
                        !task.sprintId ? "text-foreground" : "text-ink-soft",
                      )}
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-ink-soft/30" />
                      Backlog
                    </button>
                    {sprints.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { onSprintChange(task, s.id); setSprintMenuPos(null); }}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold transition hover:bg-panel-muted",
                          task.sprintId === s.id ? "text-blue-600" : "text-ink-soft",
                        )}
                      >
                        <Rocket
                          className="size-3 shrink-0"
                          style={{ color: task.sprintId === s.id ? "#3b82f6" : undefined }}
                        />
                        <span className="truncate">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {task.dueDate && (
            <span className="text-[9px] font-medium text-ink-soft/70">
              {formatShortDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─── Column editor ────────────────────────────────────────────────────────── */

function ColumnEditor({ column, onCancel, onDelete, onSubmit }: {
  column: BoardColumn;
  onCancel: () => void;
  onDelete: () => void;
  onSubmit: (payload: Partial<BoardColumn>) => void;
}) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd       = new FormData(e.currentTarget);
    const status   = String(fd.get("status") || "");
    const wipLimit = Number(fd.get("wipLimit") || 0);
    onSubmit({ name: String(fd.get("name") || "").trim(), status: status ? (status as TaskStatus) : null, wipLimit: wipLimit > 0 ? wipLimit : null });
  }
  return (
    <form onSubmit={submit} className="mt-3 grid gap-2 rounded-xl border border-line bg-background p-3">
      <input name="name" defaultValue={column.name} placeholder="Column name" className={fieldClass} required />
      <select name="status" defaultValue={column.status ?? ""} className={fieldClass}>
        <option value="">Custom column</option>
        {taskStatusOrder.map((s) => <option key={s} value={s}>{taskStatusLabels[s]}</option>)}
        <option value="CANCELLED">Cancelled</option>
      </select>
      <input name="wipLimit" type="number" min={0} defaultValue={column.wipLimit ?? ""} placeholder="WIP limit" className={fieldClass} />
      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[11px] font-bold text-red-600"
        >
          <Trash2 className="size-3" />Delete
        </button>
        <div className="flex gap-1.5">
          <button type="button" onClick={onCancel} className="h-8 rounded-lg border border-line px-2.5 text-[11px] font-bold text-ink-soft transition hover:text-foreground">
            Cancel
          </button>
          <button type="submit" className="inline-flex h-8 items-center gap-1 rounded-lg bg-foreground px-2.5 text-[11px] font-black text-white">
            <Save className="size-3" />Save
          </button>
        </div>
      </div>
    </form>
  );
}

/* ─── Task composer ────────────────────────────────────────────────────────── */

function TaskComposer({ board, onSubmit, saving, selectedSprintId, sprints }: {
  board: ProjectBoard;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  selectedSprintId: string;
  sprints: Sprint[];
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-ink-soft">Create task</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Title">
          <input name="title" required maxLength={240} placeholder="Task title" className={fieldClass} />
        </FormField>
        <FormField label="Type">
          <select name="type" defaultValue="TASK" className={fieldClass}>
            {(Object.keys(TASK_TYPE_SHORT) as TaskType[]).map((type) => (
              <option key={type} value={type}>{TASK_TYPE_SHORT[type]}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Column">
          <select name="boardColumnId" defaultValue={board.columns[0]?.id} className={fieldClass}>
            {board.columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Sprint">
          <select name="sprintId" defaultValue={selectedSprintId} className={fieldClass}>
            <option value="">Backlog</option>
            {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
        <FormField label="Priority">
          <select name="priority" defaultValue="MEDIUM" className={fieldClass}>
            {(Object.keys(priorityLabels) as TaskPriority[]).map((p) => (
              <option key={p} value={p}>{priorityLabels[p]}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Due">
          <input name="dueDate" type="date" className={fieldClass} />
        </FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Pts"><input name="storyPoints" type="number" min={0} className={fieldClass} /></FormField>
          <FormField label="Hrs"><input name="estimateHours" type="number" min={0} step="0.5" className={fieldClass} /></FormField>
        </div>
        <FormField label="Description" className="sm:col-span-2 lg:col-span-3">
          <textarea
            name="description"
            placeholder="Optional context. Comments, checklist, files, and activity live in task detail."
            className="min-h-24 w-full resize-y rounded-lg border border-line bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none"
          />
        </FormField>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="max-w-md text-xs font-semibold text-ink-soft">
          Use the task detail page for comments, checklist, dependencies, attachments, and activity.
        </p>
        <button type="submit" disabled={saving} className="tb-yellow-button h-10 rounded-xl px-5 text-[13px] font-black disabled:opacity-55">
          {saving ? "Creating…" : "Create task"}
        </button>
      </div>
    </form>
  );
}

/* ─── Task modal ───────────────────────────────────────────────────────────── */

function TaskModal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 pt-16"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-panel shadow-2xl ring-1 ring-line">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#ffd400]">
              <Plus className="size-3.5 text-foreground" />
            </span>
            <p className="text-[13px] font-black text-foreground">New Task</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-ink-soft transition hover:bg-panel-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Column composer ──────────────────────────────────────────────────────── */

function ColumnComposer({ existing, onSubmit, saving }: {
  existing: BoardColumn[];
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  const used = new Set(existing.map((c) => c.status).filter(Boolean));
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-ink-soft">Add column</p>
      <div className="grid gap-3 md:grid-cols-[1fr_200px_120px_auto]">
        <FormField label="Column name">
          <input name="name" required maxLength={80} placeholder="e.g. QA sign-off" className={fieldClass} />
        </FormField>
        <FormField label="Mapped status">
          <select name="status" defaultValue="" className={fieldClass}>
            <option value="">Custom workflow</option>
            {([...taskStatusOrder, "CANCELLED" as TaskStatus]).map((s) => (
              <option key={s} value={s} disabled={used.has(s)}>{taskStatusLabels[s]}</option>
            ))}
          </select>
        </FormField>
        <FormField label="WIP limit">
          <input name="wipLimit" type="number" min={0} placeholder="None" className={fieldClass} />
        </FormField>
        <button type="submit" disabled={saving} className="mt-5 h-9 rounded-xl bg-foreground px-4 text-[12px] font-black text-white disabled:opacity-55">
          Add
        </button>
      </div>
    </form>
  );
}

/* ─── Micro components ─────────────────────────────────────────────────────── */

function InlineStat({ highlight, label, value }: { highlight?: boolean; label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-[17px] font-black leading-none" style={{ color: highlight ? "#ffd400" : "#111111" }}>
        {value}
      </p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-ink-soft">{label}</p>
    </div>
  );
}

function GhostBtn({
  children,
  disabled,
  icon,
  onClick,
  title,
}: {
  children: ReactNode;
  disabled?: boolean;
  icon: ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-background px-3 text-[12px] font-bold text-foreground transition hover:bg-panel-muted disabled:cursor-not-allowed disabled:text-ink-soft disabled:opacity-55"
    >
      {icon}{children}
    </button>
  );
}

function SelectPill({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-ink-soft" />
    </div>
  );
}

function ColGhost({ column }: { column: BoardColumn }) {
  const color = column.status ? STATUS_COLOR[column.status] : "#ffd400";
  return (
    <div className="w-[280px] rounded-2xl border border-primary/30 bg-panel shadow-2xl">
      <div className="h-[3px] w-full rounded-t-2xl" style={{ background: color }} />
      <div className="p-3">
        <p className="text-[13px] font-black text-foreground">{column.name}</p>
        <p className="mt-0.5 text-[10px] text-ink-soft">{column.tasks?.length ?? 0} tasks</p>
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex gap-3.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-[600px] w-[280px] shrink-0 animate-pulse rounded-2xl bg-panel-muted"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

function EmptyBoard() {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-line bg-panel">
      <div className="text-center">
        <CircleDot className="mx-auto size-8 text-line" />
        <h3 className="mt-3 text-sm font-black text-foreground">No board available</h3>
        <p className="mt-1 text-sm text-ink-soft">Create a project first, then return to the board.</p>
      </div>
    </div>
  );
}

function FormField({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <label className={cn("grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft", className)}>
      {label}{children}
    </label>
  );
}

/* ─── List view ────────────────────────────────────────────────────────────── */

const LIST_COLS = "grid-cols-[minmax(0,1fr)_156px_130px_150px_96px_64px_48px]";

function ListView({ board, density, sprints }: {
  board: ProjectBoard;
  density: BoardDensity;
  sprints: Sprint[];
}) {
  const renderedAt = Date.now();
  const allTasks = board.columns.flatMap((col) => col.tasks ?? []);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">

      {/* Table header */}
      <div className={cn("sticky top-0 z-10 grid items-center border-b-2 border-line bg-panel-muted/90 px-5 py-3 backdrop-blur-sm", LIST_COLS)}>
        {["Title", "Status", "Assignee", "Sprint", "Due", "Pts", ""].map((col) => (
          <span key={col} className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft/65">{col}</span>
        ))}
      </div>

      {allTasks.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-8">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-panel-muted">
            <CircleDot className="size-5 text-ink-soft/40" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-black text-foreground">No tasks found</p>
            <p className="mt-1 text-[12px] text-ink-soft">Try changing the sprint or project filter</p>
          </div>
        </div>
      ) : (
        allTasks.map((task, idx) => (
          <TaskListRow
            key={task.id}
            task={task}
            density={density}
            sprints={sprints}
            renderedAt={renderedAt}
            isLast={idx === allTasks.length - 1}
          />
        ))
      )}
    </div>
  );
}

function TaskListRow({ density, isLast, renderedAt, sprints, task }: {
  density: BoardDensity;
  isLast?: boolean;
  renderedAt: number;
  sprints: Sprint[];
  task: Task;
}) {
  const assignee = task.assignees?.[0]?.user;
  const sprint   = sprints.find((s) => s.id === task.sprintId);
  const priColor = PRIORITY_COLOR[task.priority];
  const sColor   = task.status ? STATUS_COLOR[task.status] : "#94a3b8";
  const compact  = density === "compact";
  const overdue  = task.dueDate ? renderedAt > new Date(task.dueDate).getTime() : false;

  return (
    <article
      className={cn(
        "group relative grid items-center transition-colors hover:bg-panel-muted/40",
        LIST_COLS,
        compact ? "py-2.5" : "py-3.5",
        !isLast && "border-b border-line/35",
      )}
    >
      {/* Priority stripe */}
      <div className="absolute inset-y-0 left-0 w-[4px] transition-opacity group-hover:opacity-100" style={{ background: priColor, opacity: 0.7 }} />

      {/* Title + key + priority dot */}
      <div className="flex min-w-0 items-center gap-2.5 pl-5 pr-4">
        <span
          className="size-2 shrink-0 rounded-full ring-[2.5px] ring-white"
          style={{ background: priColor }}
          title={`Priority: ${task.priority}`}
        />
        <span
          className="inline-flex shrink-0 items-center rounded-md px-2 py-1 text-[10px] font-black tracking-[0.12em]"
          style={{ background: "#ffd40016", color: "#b8870a" }}
        >
          {task.key}
        </span>
        <Link
          href={`/projects/${task.projectId}?task=${task.id}`}
          className="min-w-0 truncate text-[13px] font-semibold leading-snug text-foreground transition hover:text-primary"
          title={task.title}
        >
          {task.title}
        </Link>
      </div>

      {/* Status */}
      <div className="pr-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold"
          style={{ background: `${sColor}14`, color: sColor }}
        >
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: sColor }} />
          {taskStatusLabels[task.status] ?? task.status}
        </span>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-2 pr-3">
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
          <span className="text-[11px] text-ink-soft/25">—</span>
        )}
      </div>

      {/* Sprint */}
      <div className="pr-3">
        {sprint ? (
          <span className="truncate text-[11px] font-medium text-foreground/75">{sprint.name}</span>
        ) : (
          <span className="rounded-md bg-panel-muted px-2 py-0.5 text-[10px] font-bold text-ink-soft/50">Backlog</span>
        )}
      </div>

      {/* Due */}
      <div className="pr-3">
        {task.dueDate ? (
          <span
            className={cn(
              "text-[11px] font-semibold",
              overdue ? "font-bold text-red-500" : "text-foreground/65",
            )}
          >
            {formatShortDate(task.dueDate)}
          </span>
        ) : (
          <span className="text-[11px] text-ink-soft/25">—</span>
        )}
      </div>

      {/* Story points */}
      <div>
        {task.storyPoints != null ? (
          <span className="inline-flex items-center rounded-lg bg-panel-muted px-2.5 py-1 text-[11px] font-black text-foreground/70">
            {task.storyPoints}pt
          </span>
        ) : (
          <span className="text-[11px] text-ink-soft/25">—</span>
        )}
      </div>

      {/* Open */}
      <div className="flex justify-center">
        <Link
          href={`/projects/${task.projectId}?task=${task.id}`}
          className="flex size-7 items-center justify-center rounded-lg text-ink-soft/30 opacity-0 transition hover:bg-panel-muted hover:text-foreground group-hover:opacity-100"
          aria-label="Open task"
        >
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

/* ─── Pure logic (unchanged from original) ─────────────────────────────────── */

function taskMatchesBoardFilters(task: Task, filters: BoardFilters) {
  const query = filters.search.trim().toLowerCase();
  if (query) {
    const labels = getCardLabels(task).map((label) => label.name).join(" ");
    const haystack = [
      task.title,
      task.key,
      task.card?.code,
      task.card?.sprint?.name,
      task.type,
      taskStatusLabels[task.status],
      priorityLabels[task.priority],
      labels,
    ].filter(Boolean).join(" ").toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (filters.priority && task.priority !== filters.priority) return false;
  if (filters.assigneeId) {
    const people = getCardAssignees(task);
    if (filters.assigneeId === "UNASSIGNED") {
      if (people.length) return false;
    } else if (!people.some((person) => person.userId === filters.assigneeId)) {
      return false;
    }
  }
  if (filters.due) {
    const due = task.card?.due ?? getTaskDue(task);
    if (filters.due === "NONE" && due.state !== "NONE") return false;
    if (filters.due !== "NONE" && due.state !== filters.due) return false;
  }
  if (filters.blocked && !task.card?.flags.isBlocked && !(task.card?.dependencies.blockedByCount ?? task._count?.dependenciesTo ?? 0)) {
    return false;
  }
  return true;
}

function getSavedBoardConfig(view?: TaskSavedView): SavedBoardConfig | null {
  const boardConfig = view?.filters?.board;
  if (!boardConfig || typeof boardConfig !== "object") return null;
  const config = boardConfig as {
    sprintFilter?: SprintFilter;
    filters?: Partial<BoardFilters>;
    swimlane?: SwimlaneMode;
    density?: BoardDensity;
    viewMode?: ViewMode;
  };
  return {
    sprintFilter: typeof config.sprintFilter === "string" ? config.sprintFilter : "ALL",
    filters: { ...DEFAULT_BOARD_FILTERS, ...(config.filters ?? {}) },
    swimlane: isSwimlaneMode(config.swimlane) ? config.swimlane : "NONE",
    density: config.density === "comfortable" ? "comfortable" : "compact",
    viewMode: config.viewMode === "list" ? "list" : "board",
  };
}

function isSwimlaneMode(value: unknown): value is SwimlaneMode {
  return value === "NONE" || value === "SPRINT" || value === "ASSIGNEE" || value === "EPIC" || value === "PRIORITY";
}

function groupBoardBySwimlane(board: ProjectBoard, mode: SwimlaneMode, sprints: Sprint[]): SwimlaneGroup[] {
  if (mode === "NONE") {
    const tasks = board.columns.flatMap((column) => column.tasks ?? []);
    return [{
      id: "all",
      name: "All tasks",
      taskCount: tasks.length,
      storyPoints: tasks.reduce((sum, task) => sum + (task.storyPoints ?? task.card?.storyPoints ?? 0), 0),
      columns: board.columns,
    }];
  }
  const groups = new Map<string, { id: string; name: string; sort: number }>();
  const sprintOrder = new Map(sprints.map((sprint, index) => [sprint.id, index]));
  for (const task of board.columns.flatMap((column) => column.tasks ?? [])) {
    const lane = getTaskSwimlane(task, mode, sprints, sprintOrder);
    groups.set(lane.id, lane);
  }
  return Array.from(groups.values())
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
    .map((lane) => {
      const columns = board.columns.map((column) => ({
        ...column,
        tasks: (column.tasks ?? []).filter((task) => getTaskSwimlane(task, mode, sprints, sprintOrder).id === lane.id),
      }));
      const tasks = columns.flatMap((column) => column.tasks ?? []);
      return {
        id: lane.id,
        name: lane.name,
        taskCount: tasks.length,
        storyPoints: tasks.reduce((sum, task) => sum + (task.storyPoints ?? task.card?.storyPoints ?? 0), 0),
        columns,
      };
    });
}

function getTaskSwimlane(task: Task, mode: SwimlaneMode, sprints: Sprint[], sprintOrder: Map<string, number>) {
  if (mode === "SPRINT") {
    const sprint = task.card?.sprint ?? sprints.find((item) => item.id === task.sprintId);
    return sprint
      ? { id: `sprint:${sprint.id}`, name: sprint.name, sort: sprintOrder.get(sprint.id) ?? 10_000 }
      : { id: "sprint:none", name: "Backlog", sort: 20_000 };
  }
  if (mode === "ASSIGNEE") {
    const person = getCardAssignees(task)[0];
    return person
      ? { id: `assignee:${person.userId}`, name: `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || person.email, sort: 0 }
      : { id: "assignee:none", name: "Unassigned", sort: 20_000 };
  }
  if (mode === "EPIC") {
    if (task.type === "EPIC") return { id: `epic:${task.id}`, name: task.title, sort: 0 };
    const epicLabel = getCardLabels(task).find((label) => /epic/i.test(label.name));
    return epicLabel
      ? { id: `epic-label:${epicLabel.labelId}`, name: epicLabel.name, sort: 1 }
      : { id: "epic:none", name: "No epic", sort: 20_000 };
  }
  if (mode === "PRIORITY") {
    const priorities = Object.keys(priorityLabels) as TaskPriority[];
    return { id: `priority:${task.priority}`, name: priorityLabels[task.priority], sort: priorities.indexOf(task.priority) };
  }
  return { id: "all", name: "All tasks", sort: 0 };
}

function applyTaskCardPatch(task: Task, patch: Partial<Pick<Task, "status" | "priority" | "dueDate">>): Partial<Task> {
  const nextCard = task.card ? {
    ...task.card,
    status: patch.status ?? task.card.status,
    priority: patch.priority ?? task.card.priority,
    colors: {
      ...task.card.colors,
      status: patch.status ? STATUS_COLOR[patch.status] : task.card.colors.status,
      priority: patch.priority ? PRIORITY_COLOR[patch.priority] : task.card.colors.priority,
      rail: patch.priority ? PRIORITY_COLOR[patch.priority] : task.card.colors.rail,
    },
    due: patch.dueDate !== undefined ? getTaskDue({ ...task, dueDate: patch.dueDate }) : task.card.due,
    flags: patch.dueDate !== undefined ? {
      ...task.card.flags,
      isOverdue: getTaskDue({ ...task, dueDate: patch.dueDate }).state === "OVERDUE",
      isDueToday: getTaskDue({ ...task, dueDate: patch.dueDate }).state === "TODAY",
    } : task.card.flags,
  } : undefined;
  return {
    ...patch,
    card: nextCard,
  };
}

function applyTaskAssigneePatch(task: Task, user: TenantUser | null): Partial<Task> {
  if (!task.card) return {};
  return {
    card: {
      ...task.card,
      assignees: user ? [{
        id: `optimistic-${user.id}`,
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      }] : [],
      flags: {
        ...task.card.flags,
        hasAssignees: Boolean(user),
      },
    },
  };
}

function toDateInputValue(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeBoard(board: ProjectBoard): ProjectBoard {
  return {
    ...board,
    columns: [...board.columns]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ ...c, tasks: [...(c.tasks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder) })),
  };
}

function resolveOverColumn(board: ProjectBoard, od: Record<string, unknown> | undefined) {
  if (od?.type === "column") return od.column as BoardColumn;
  if (od?.type === "task")   return board.columns.find((c) => c.id === (od.columnId as string)) ?? null;
  return null;
}

function moveTaskOnBoard(board: ProjectBoard, movedId: string, targetColId: string, targetIdx: number, nextStatus: TaskStatus) {
  let moved: Task | null = null;
  const stripped = board.columns.map((c) => {
    const next = (c.tasks ?? []).filter((t) => { if (t.id !== movedId) return true; moved = t; return false; });
    return { ...c, tasks: next.map((t, i) => ({ ...t, sortOrder: i })) };
  });
  if (!moved) return board;
  return {
    ...board,
    columns: stripped.map((c) => {
      if (c.id !== targetColId || !moved) return c;
      const next = [...(c.tasks ?? [])];
      next.splice(Math.min(targetIdx, next.length), 0, { ...moved, boardColumnId: targetColId, status: nextStatus });
      return { ...c, tasks: next.map((t, i) => ({ ...t, sortOrder: i })) };
    }),
  };
}

function taskOrderUpdates(prev: ProjectBoard, next: ProjectBoard, colIds: string[]) {
  const affected = new Set(colIds);
  const before   = new Map(prev.columns.flatMap((c) => c.tasks ?? []).map((t) => [t.id, t]));
  return next.columns
    .filter((c) => affected.has(c.id))
    .flatMap((c) => c.tasks ?? [])
    .filter((t) => {
      const p = before.get(t.id);
      return !p || p.sortOrder !== t.sortOrder || (p.boardColumnId ?? null) !== (t.boardColumnId ?? null) || p.status !== t.status;
    });
}

function updateTaskInBoard(board: ProjectBoard, id: string, patch: Partial<Task>) {
  return { ...board, columns: board.columns.map((c) => ({ ...c, tasks: (c.tasks ?? []).map((t) => t.id === id ? { ...t, ...patch } : t) })) };
}

function toNoonIso(v: string) { return new Date(`${v}T12:00:00`).toISOString(); }

const fieldClass =
  "h-9 w-full rounded-lg border border-line bg-background px-3 text-[13px] text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none";

const selectClass =
  "h-8 appearance-none rounded-lg border border-line bg-background pl-3 pr-7 text-[12px] font-bold text-foreground transition hover:bg-panel-muted focus:border-primary focus:outline-none";
