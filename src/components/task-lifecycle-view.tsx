"use client";

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  Bug,
  Calendar,
  CheckSquare,
  Eye,
  ExternalLink,
  Flag,
  GitBranch,
  Hash,
  Link2,
  ListChecks,
  MessageSquare,
  Minus,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Trash2,
  Unlink,
  UserPlus,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  addTaskAssignee,
  addTaskWatcher,
  assignTaskLabel,
  createLabel,
  createTaskChecklist,
  createTaskChecklistItem,
  createTaskComment,
  createTaskDependency,
  deleteTask,
  deleteTaskChecklist,
  deleteTaskChecklistItem,
  deleteTaskComment,
  deleteTaskDependency,
  getMe,
  getTask,
  listLabels,
  listProjectMembers,
  listTaskActivities,
  listTaskAssignees,
  listTaskChecklists,
  listTaskComments,
  listTaskDependencies,
  listTaskLabels,
  listTasks,
  listTaskWatchers,
  removeTaskAssignee,
  removeTaskLabel,
  removeTaskWatcher,
  updateTask,
  updateTaskChecklistItem,
  type AuthUser,
  type ProjectMember,
  type Task,
  type TaskActivity,
  type TaskAssignee,
  type TaskChecklist,
  type TaskComment,
  type TaskDependency,
  type TaskLabel,
  type TaskLabelAssignment,
  type TaskPriority,
  type TaskStatus,
  type TaskWatcher,
  type UserSummary,
} from "@/lib/api";
import { useConfirm } from "@/components/confirm-provider";
import { cn } from "@/lib/cn";
import {
  formatShortDate,
  priorityLabels,
  taskStatusLabels,
  taskStatusOrder,
  userInitials,
} from "@/lib/workspace-ui";
import { FileAssetManager } from "@/components/file-asset-manager";
import {
  completeQaTestRun,
  createQaDefectFromExecution,
  createQaExecution,
  createQaTestCase,
  createQaTestRun,
  getQaTaskSummary,
} from "@/lib/api/qaApi";

type TaskLifecycleMode = "page" | "drawer";

type TaskLifecycleViewProps = {
  mode?: TaskLifecycleMode;
  projectId: string;
  taskId: string;
  token: string;
  onClose?: () => void;
  onDeleted?: (taskId: string) => void;
  onUpdated?: (task: Task) => void;
};

const lifecycleStatusOrder: TaskStatus[] = [...taskStatusOrder, "CANCELLED"];

const statusColor: Record<TaskStatus, string> = {
  BACKLOG: "#94a3b8",
  TODO: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  REVIEW: "#8b5cf6",
  TESTING: "#06b6d4",
  DONE: "#10b981",
  CANCELLED: "#6b7280",
};

const priorityColor: Record<TaskPriority, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  URGENT: "#f97316",
  CRITICAL: "#ef4444",
};

const labelColors = ["#ffd400", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#f97316"];

type QaExecutionStatus = "UNTESTED" | "PASSED" | "FAILED" | "BLOCKED" | "SKIPPED" | "FLAKY";
type QaTestCasePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type QaTestCaseType =
  | "FUNCTIONAL"
  | "REGRESSION"
  | "SMOKE"
  | "INTEGRATION"
  | "PERFORMANCE"
  | "SECURITY"
  | "ACCESSIBILITY"
  | "ACCEPTANCE";
type QaExecutionSummary = {
  blocked: number;
  failed: number;
  flaky: number;
  passed: number;
  passRate: number;
  ready: boolean;
  skipped: number;
  total: number;
  untested: number;
};
type QaLinkedTestCase = {
  id?: string;
  linkType?: string;
  testCaseId?: string;
  testCase: {
    automationKey?: string | null;
    id: string;
    priority?: QaTestCasePriority;
    status?: string;
    title: string;
    type?: QaTestCaseType;
  };
};
type QaLatestExecution = {
  actualResult?: string | null;
  defectTask?: { id: string; key: string; status: TaskStatus; title: string } | null;
  executedAt?: string | null;
  failureMessage?: string | null;
  id: string;
  status: QaExecutionStatus;
  testCaseId?: string | null;
  testRunId?: string;
  updatedAt?: string;
};
type QaTaskSummary = {
  evidence: unknown[];
  executions: QaExecutionSummary;
  latestExecutions: QaLatestExecution[];
  linkedTestCases: QaLinkedTestCase[];
};
type QaDraft = {
  expectedResult: string;
  title: string;
};

const emptyQaExecutionSummary: QaExecutionSummary = {
  blocked: 0,
  failed: 0,
  flaky: 0,
  passed: 0,
  passRate: 0,
  ready: false,
  skipped: 0,
  total: 0,
  untested: 0,
};

export function TaskLifecycleView({
  mode = "page",
  onClose,
  onDeleted,
  onUpdated,
  projectId,
  taskId,
  token,
}: TaskLifecycleViewProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [checklists, setChecklists] = useState<TaskChecklist[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [dependencies, setDependencies] = useState<{ blocking: TaskDependency[]; blockedBy: TaskDependency[] }>({
    blocking: [],
    blockedBy: [],
  });
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [taskLabels, setTaskLabels] = useState<TaskLabelAssignment[]>([]);
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);
  const [watchers, setWatchers] = useState<TaskWatcher[]>([]);
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [qaSummary, setQaSummary] = useState<QaTaskSummary | null>(null);
  const [qaDraft, setQaDraft] = useState<QaDraft>({ expectedResult: "", title: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(labelColors[0]);
  const { confirm } = useConfirm();

  const loadTask = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const [
        taskData,
        commentData,
        checklistData,
        activityData,
        dependencyData,
        qaSummaryData,
      ] = await Promise.all([
        getTask(token, taskId),
        listTaskComments(token, taskId),
        listTaskChecklists(token, taskId),
        listTaskActivities(token, taskId),
        listTaskDependencies(token, taskId),
        getQaTaskSummary(token, taskId).then(normalizeQaTaskSummary).catch(() => null),
      ]);

      setTask(taskData);
      setComments(commentData);
      setChecklists(checklistData);
      setActivities(activityData);
      setDependencies(dependencyData);
      setTaskLabels(taskData.labels ?? []);
      setAssignees(taskData.assignees ?? []);
      setQaSummary(qaSummaryData);

      const [labelResult, taskLabelResult, assigneeResult, watcherResult, memberResult, meResult, relatedResult] =
        await Promise.allSettled([
          listLabels(token),
          listTaskLabels(token, taskId),
          listTaskAssignees(token, taskId),
          listTaskWatchers(token, taskId),
          listProjectMembers(token, projectId),
          getMe(token),
          listTasks(token, { projectId }),
        ] as const);

      if (labelResult.status === "fulfilled") setLabels(labelResult.value);
      if (taskLabelResult.status === "fulfilled") setTaskLabels(taskLabelResult.value);
      if (assigneeResult.status === "fulfilled") setAssignees(assigneeResult.value);
      if (watcherResult.status === "fulfilled") setWatchers(watcherResult.value);
      if (memberResult.status === "fulfilled") setProjectMembers(memberResult.value);
      if (meResult.status === "fulfilled") setCurrentUser(meResult.value);
      if (relatedResult.status === "fulfilled") {
        setRelatedTasks(relatedResult.value.data.filter((candidate) => candidate.id !== taskId));
      }
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to load task lifecycle.",
        ok: false,
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId, token]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTask(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadTask]);

  const assignedLabelIds = useMemo(
    () => new Set(taskLabels.map((item) => item.label.id)),
    [taskLabels],
  );

  const availableLabels = useMemo(
    () => labels.filter((label) => !assignedLabelIds.has(label.id)),
    [assignedLabelIds, labels],
  );

  const assigneeIds = useMemo(
    () => new Set(assignees.map((item) => item.user.id)),
    [assignees],
  );

  const candidateUsers = useMemo(() => {
    const users = new Map<string, UserSummary>();

    projectMembers.forEach((member) => users.set(member.user.id, member.user));
    assignees.forEach((assignee) => users.set(assignee.user.id, assignee.user));

    if (currentUser) {
      users.set(currentUser.id, authUserToSummary(currentUser));
    }

    return [...users.values()].sort((left, right) =>
      displayName(left).localeCompare(displayName(right)),
    );
  }, [assignees, currentUser, projectMembers]);

  const assignableUsers = useMemo(
    () => candidateUsers.filter((user) => !assigneeIds.has(user.id)),
    [assigneeIds, candidateUsers],
  );

  const watcherIds = useMemo(
    () => new Set(watchers.map((item) => item.user?.id ?? item.userId).filter(Boolean)),
    [watchers],
  );

  const watchableUsers = useMemo(
    () => candidateUsers.filter((user) => !watcherIds.has(user.id)),
    [candidateUsers, watcherIds],
  );

  const dependencyIds = useMemo(
    () => new Set(dependencies.blocking.map((dependency) => dependency.toTaskId)),
    [dependencies.blocking],
  );

  const dependencyTargetTasks = useMemo(
    () => relatedTasks.filter((candidate) => !dependencyIds.has(candidate.id)),
    [dependencyIds, relatedTasks],
  );

  const dependencyStats = useMemo(
    () => ({
      blocking: dependencies.blocking.length,
      blockedBy: dependencies.blockedBy.length,
      blockers: dependencies.blockedBy.filter((dependency) => /BLOCK|DEPEND/i.test(dependency.type)).length,
    }),
    [dependencies],
  );

  const checklistStats = useMemo(() => {
    const total = checklists.reduce((sum, checklist) => sum + checklist.items.length, 0);
    const done = checklists.reduce(
      (sum, checklist) => sum + checklist.items.filter((item) => item.isDone).length,
      0,
    );

    return {
      done,
      total,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  }, [checklists]);

  const qaExecutionByCase = useMemo(() => {
    const map = new Map<string, QaLatestExecution>();
    for (const execution of qaSummary?.latestExecutions ?? []) {
      if (execution.testCaseId) map.set(execution.testCaseId, execution);
    }
    return map;
  }, [qaSummary]);

  const qaStats = qaSummary?.executions ?? emptyQaExecutionSummary;

  async function refreshQaSummary() {
    try {
      setQaSummary(normalizeQaTaskSummary(await getQaTaskSummary(token, taskId)));
    } catch {
      setQaSummary(null);
    }
  }

  async function refreshActivity() {
    try {
      setActivities(await listTaskActivities(token, taskId));
    } catch {
      // Activity is secondary; keep the primary workflow moving.
    }
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task) return;

    const fd = new FormData(event.currentTarget);
    const status = fd.get("status") as TaskStatus;
    const dueDate = String(fd.get("dueDate") || "");
    const storyPoints = Number(fd.get("storyPoints") || 0);
    const estimateHours = Number(fd.get("estimateHours") || 0);

    setSaving(true);
    setMessage(null);

    try {
      const updated = await updateTask(token, task.id, {
        title: String(fd.get("title") || "").trim(),
        description: String(fd.get("description") || ""),
        status,
        priority: fd.get("priority") as TaskPriority,
        dueDate: dueDate ? toNoonIso(dueDate) : null,
        storyPoints: storyPoints || undefined,
        estimateMins: estimateHours ? Math.round(estimateHours * 60) : undefined,
        completedAt: status === "DONE" ? task.completedAt ?? new Date().toISOString() : null,
      });

      setTask(updated);
      setAssignees(updated.assignees ?? assignees);
      setTaskLabels(updated.labels ?? taskLabels);
      onUpdated?.(updated);
      setMessage({ text: "Task saved.", ok: true });
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to save task.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function archiveTask() {
    if (!task) return;
    setSaving(true);
    setMessage(null);

    try {
      const updated = await updateTask(token, task.id, {
        status: "CANCELLED",
        completedAt: null,
      });
      setTask(updated);
      onUpdated?.(updated);
      setMessage({ text: "Task archived.", ok: true });
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to archive task.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function reopenTask() {
    if (!task) return;
    setSaving(true);
    setMessage(null);

    try {
      const updated = await updateTask(token, task.id, {
        status: "TODO",
        completedAt: null,
      });
      setTask(updated);
      onUpdated?.(updated);
      setMessage({ text: "Task reopened.", ok: true });
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to reopen task.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeTaskPermanently() {
    if (!task) return;
    const confirmed = await confirm({
      title: "Delete task permanently?",
      description: `Permanently delete ${task.key}? This cannot be undone.`,
      confirmLabel: "Delete task",
      tone: "danger",
    });
    if (!confirmed) return;

    setSaving(true);
    setMessage(null);

    try {
      await deleteTask(token, task.id);
      onDeleted?.(task.id);
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to delete task.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = commentText.trim();
    if (!body) return;

    setSaving(true);
    setMessage(null);

    try {
      const comment = await createTaskComment(token, taskId, { body });
      setComments((current) => [...current, comment]);
      setCommentText("");
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to add comment.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeComment(commentId: string) {
    const confirmed = await confirm({
      title: "Delete comment?",
      description: "This removes the comment from the task discussion.",
      confirmLabel: "Delete comment",
      tone: "danger",
    });
    if (!confirmed) return;

    setSaving(true);
    setMessage(null);

    try {
      await deleteTaskComment(token, taskId, commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to delete comment.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function addChecklist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = String(new FormData(form).get("title") || "").trim();
    if (!title) return;

    setSaving(true);
    setMessage(null);

    try {
      const checklist = await createTaskChecklist(token, taskId, { title });
      setChecklists((current) => [...current, checklist]);
      form.reset();
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to create checklist.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeChecklist(checklistId: string) {
    const confirmed = await confirm({
      title: "Delete checklist?",
      description: "This removes the checklist and all of its items from the task.",
      confirmLabel: "Delete checklist",
      tone: "danger",
    });
    if (!confirmed) return;

    setSaving(true);
    setMessage(null);

    try {
      await deleteTaskChecklist(token, taskId, checklistId);
      setChecklists((current) => current.filter((checklist) => checklist.id !== checklistId));
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to delete checklist.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function addChecklistItem(event: FormEvent<HTMLFormElement>, checklistId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const text = String(new FormData(form).get("text") || "").trim();
    if (!text) return;

    setSaving(true);
    setMessage(null);

    try {
      const item = await createTaskChecklistItem(token, taskId, checklistId, { text });
      setChecklists((current) =>
        current.map((checklist) =>
          checklist.id === checklistId
            ? { ...checklist, items: [...checklist.items, item] }
            : checklist,
        ),
      );
      form.reset();
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to add checklist item.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleChecklistItem(checklistId: string, itemId: string, isDone: boolean) {
    try {
      const updated = await updateTaskChecklistItem(token, taskId, checklistId, itemId, { isDone });
      setChecklists((current) =>
        current.map((checklist) =>
          checklist.id === checklistId
            ? {
                ...checklist,
                items: checklist.items.map((item) => (item.id === itemId ? updated : item)),
              }
            : checklist,
        ),
      );
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to update checklist item.",
        ok: false,
      });
    }
  }

  async function removeChecklistItem(checklistId: string, itemId: string) {
    setSaving(true);
    setMessage(null);

    try {
      await deleteTaskChecklistItem(token, taskId, checklistId, itemId);
      setChecklists((current) =>
        current.map((checklist) =>
          checklist.id === checklistId
            ? { ...checklist, items: checklist.items.filter((item) => item.id !== itemId) }
            : checklist,
        ),
      );
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to delete checklist item.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function assignLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const labelId = String(new FormData(form).get("labelId") || "");
    if (!labelId) return;

    setSaving(true);
    setMessage(null);

    try {
      const assignment = await assignTaskLabel(token, taskId, labelId);
      setTaskLabels((current) => mergeAssignment(current, assignment));
      form.reset();
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to assign label.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function createAndAssignLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    if (!name) return;

    setSaving(true);
    setMessage(null);

    try {
      const label = await createLabel(token, {
        name,
        color: String(fd.get("color") || newLabelColor),
      });
      setLabels((current) => mergeLabel(current, label));
      const assignment = await assignTaskLabel(token, taskId, label.id);
      setTaskLabels((current) => mergeAssignment(current, assignment));
      form.reset();
      setNewLabelColor(labelColors[0]);
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to create label.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function unassignLabel(labelId: string) {
    setSaving(true);
    setMessage(null);

    try {
      await removeTaskLabel(token, taskId, labelId);
      setTaskLabels((current) => current.filter((item) => item.label.id !== labelId));
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to remove label.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function addAssignee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const userId = String(new FormData(form).get("userId") || "");
    if (!userId) return;

    setSaving(true);
    setMessage(null);

    try {
      const assignee = await addTaskAssignee(token, taskId, userId);
      setAssignees((current) => mergeAssignee(current, assignee));
      form.reset();
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to assign user.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function unassignUser(userId: string) {
    setSaving(true);
    setMessage(null);

    try {
      await removeTaskAssignee(token, taskId, userId);
      setAssignees((current) => current.filter((assignee) => assignee.user.id !== userId));
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to remove assignee.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function addWatcher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const userId = String(new FormData(form).get("userId") || "");
    if (!userId) return;

    setSaving(true);
    setMessage(null);

    try {
      await addTaskWatcher(token, taskId, userId);
      setWatchers(await listTaskWatchers(token, taskId));
      form.reset();
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to add watcher.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function unwatchTask(userId: string) {
    setSaving(true);
    setMessage(null);

    try {
      await removeTaskWatcher(token, taskId, userId);
      setWatchers((current) => current.filter((watcher) => (watcher.user?.id ?? watcher.userId) !== userId));
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to remove watcher.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function addDependency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const toTaskId = String(fd.get("toTaskId") || "");
    const type = String(fd.get("type") || "BLOCKS").trim().toUpperCase();
    if (!toTaskId) return;

    setSaving(true);
    setMessage(null);

    try {
      const dependency = await createTaskDependency(token, taskId, { toTaskId, type });
      setDependencies((current) => ({
        ...current,
        blocking: mergeDependency(current.blocking, dependency),
      }));
      form.reset();
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to create dependency.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeDependency(dependencyId: string) {
    setSaving(true);
    setMessage(null);

    try {
      await deleteTaskDependency(token, taskId, dependencyId);
      setDependencies((current) => ({
        ...current,
        blocking: current.blocking.filter((dependency) => dependency.id !== dependencyId),
      }));
      void refreshActivity();
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to remove dependency.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function addQaTestCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task) return;
    const title = qaDraft.title.trim();
    if (!title) return;

    setSaving(true);
    setMessage(null);

    try {
      await createQaTestCase(token, {
        expectedResult: qaDraft.expectedResult.trim() || undefined,
        linkType: "COVERS",
        priority: "MEDIUM",
        projectId,
        status: "ACTIVE",
        taskId,
        title,
        type: "FUNCTIONAL",
      });
      setQaDraft({ expectedResult: "", title: "" });
      await refreshQaSummary();
      void refreshActivity();
      setMessage({ text: "QA test case linked to task.", ok: true });
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to create QA test case.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function recordQaResult(testCase: QaLinkedTestCase["testCase"], status: QaExecutionStatus) {
    if (!task) return;

    setSaving(true);
    setMessage(null);

    try {
      const run = await createQaTestRun(token, {
        name: `${task.key} manual QA - ${testCase.title}`.slice(0, 240),
        projectId,
        source: "MANUAL",
        status: "RUNNING",
        taskId,
        testCaseIds: [testCase.id],
      }) as { id?: string };
      if (!run.id) throw new Error("QA run was not created.");
      await createQaExecution(token, run.id, {
        executedAt: new Date().toISOString(),
        status,
        taskId,
        testCaseId: testCase.id,
        title: testCase.title,
      });
      await completeQaTestRun(token, run.id);
      await refreshQaSummary();
      void refreshActivity();
      setMessage({ text: `QA result recorded: ${qaStatusLabel(status)}.`, ok: true });
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to record QA result.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  async function createDefectFromQa(execution: QaLatestExecution, testCase: QaLinkedTestCase["testCase"]) {
    if (!execution.testRunId) {
      setMessage({ text: "This QA result is missing its run reference.", ok: false });
      return;
    }
    const confirmed = await confirm({
      title: "Create bug from failed test?",
      description: `Create a board bug for "${testCase.title}" and link it to this QA result.`,
      confirmLabel: "Create bug",
      tone: "danger",
    });
    if (!confirmed) return;

    setSaving(true);
    setMessage(null);

    try {
      await createQaDefectFromExecution(token, execution.testRunId, execution.id, {
        description: `QA failure from ${task?.key ?? "task"}: ${testCase.title}`,
        priority: "HIGH",
        title: `Fix QA failure: ${testCase.title}`.slice(0, 180),
        type: "BUG",
      });
      await refreshQaSummary();
      void refreshActivity();
      setMessage({ text: "Bug created from QA failure.", ok: true });
    } catch (caught) {
      setMessage({
        text: caught instanceof Error ? caught.message : "Unable to create QA defect.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Shell mode={mode}>
        <TaskSkeleton />
      </Shell>
    );
  }

  if (!task) {
    return (
      <Shell mode={mode}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-bold text-red-700">
            {message?.text ?? "Task could not be loaded."}
          </p>
          {mode === "page" ? (
            <Link
              href={`/projects/${projectId}`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700"
            >
              <ArrowLeft className="size-4" />
              Back to project
            </Link>
          ) : null}
        </div>
      </Shell>
    );
  }

  const taskIsArchived = task.status === "CANCELLED";
  const sColor = statusColor[task.status] ?? "#94a3b8";
  const pColor = priorityColor[task.priority] ?? "#94a3b8";

  return (
    <Shell mode={mode}>
      {mode === "drawer" ? (
        <div className="sticky top-0 z-10 border-b border-line bg-background/95 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                Task lifecycle
              </p>
              <h2 className="mt-1 truncate text-lg font-black text-foreground">
                {task.key}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-ink-soft transition hover:text-foreground"
              aria-label="Close task detail"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-1.5 text-sm text-ink-soft">
            <Link href="/projects" className="transition hover:text-foreground">
              Projects
            </Link>
            <span>/</span>
            <Link href={`/projects/${projectId}`} className="transition hover:text-foreground">
              {task.project?.name ?? "Project"}
            </Link>
            <span>/</span>
            <span className="font-bold text-foreground">{task.key}</span>
          </nav>
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-sm font-bold text-foreground transition hover:bg-panel-muted"
          >
            <ArrowLeft className="size-4" />
            Back to project
          </Link>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111] text-white">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <SignalPill color={sColor}>{taskStatusLabels[task.status]}</SignalPill>
              <SignalPill color={pColor}>{priorityLabels[task.priority]}</SignalPill>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.08] px-2 py-0.5 text-[10px] font-black tracking-widest text-primary">
                <Hash className="size-2.5" />
                {task.key}
              </span>
            </div>
            <h1 className="mt-2.5 text-xl font-black leading-snug tracking-tight sm:text-2xl">
              {task.title}
            </h1>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 sm:flex-col sm:items-end sm:gap-y-1.5 lg:flex-row lg:items-center lg:gap-x-5">
            <HeaderStat icon={Calendar} label="Due" value={formatShortDate(task.dueDate)} />
            <HeaderStat icon={Users} label="Assignees" value={String(assignees.length)} />
            <HeaderStat icon={CheckSquare} label="Checklist" value={`${checklistStats.done}/${checklistStats.total}`} />
            {dependencyStats.blockers > 0 && (
              <HeaderStat icon={GitBranch} label="Blockers" value={String(dependencyStats.blockers)} danger />
            )}
          </div>
        </div>

        {checklistStats.total > 0 && (
          <div className="border-t border-white/[0.08] px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${checklistStats.percent}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] font-bold tabular-nums text-white/40">
                {checklistStats.percent}%
              </span>
            </div>
          </div>
        )}
      </section>

      {message ? <Notice message={message} /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          <SectionCard icon={MessageSquare} title="Conversation" defaultOpen>
            <div className="space-y-3">
              {comments.length ? (
                comments.map((comment) => (
                  <article key={comment.id} className="rounded-xl border border-line bg-background p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar user={comment.author} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {displayName(comment.author)}
                          </p>
                          <p className="text-[11px] text-ink-soft">
                            {formatShortDate(comment.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeComment(comment.id)}
                        disabled={saving}
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                      {comment.body}
                    </p>
                  </article>
                ))
              ) : (
                <EmptyState icon={MessageSquare} text="No comments yet." />
              )}
            </div>

            <form onSubmit={addComment} className="mt-4 grid gap-2">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                className="min-h-24 resize-none rounded-xl border border-line bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none"
                placeholder="Add a decision, blocker, or update..."
                required
              />
              <button
                type="submit"
                disabled={saving || !commentText.trim()}
                className="h-10 w-fit rounded-lg bg-primary px-4 text-sm font-black text-[#111111] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-55"
              >
                {saving ? "Posting..." : "Post comment"}
              </button>
            </form>
          </SectionCard>

          <SectionCard icon={ListChecks} title="Checklists" defaultOpen={checklists.length > 0}>
            <div className="space-y-4">
              {checklists.length ? (
                checklists.map((checklist) => {
                  const total = checklist.items.length;
                  const done = checklist.items.filter((item) => item.isDone).length;
                  const pct = total ? Math.round((done / total) * 100) : 0;

                  return (
                    <div key={checklist.id} className="rounded-xl border border-line bg-background p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-black text-foreground">
                            {checklist.title}
                          </h4>
                          <p className="mt-0.5 text-[11px] font-semibold text-ink-soft">
                            {done}/{total} complete
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void removeChecklist(checklist.id)}
                          disabled={saving}
                          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                          aria-label="Delete checklist"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      {total > 0 ? (
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      ) : null}
                      <div className="mt-3 space-y-1">
                        {checklist.items.map((item) => (
                          <div
                            key={item.id}
                            className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-panel"
                          >
                            <input
                              type="checkbox"
                              checked={item.isDone}
                              onChange={(event) =>
                                void toggleChecklistItem(checklist.id, item.id, event.target.checked)
                              }
                              className="size-4 rounded accent-primary"
                            />
                            <span
                              className={cn(
                                "min-w-0 flex-1 text-sm text-foreground",
                                item.isDone && "text-ink-soft line-through",
                              )}
                            >
                              {item.text}
                            </span>
                            <button
                              type="button"
                              onClick={() => void removeChecklistItem(checklist.id, item.id)}
                              disabled={saving}
                              className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-soft opacity-0 transition hover:bg-red-50 hover:text-red-700 group-hover:opacity-100 disabled:opacity-40"
                              aria-label="Delete checklist item"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <form
                        onSubmit={(event) => void addChecklistItem(event, checklist.id)}
                        className="mt-3 flex gap-2"
                      >
                        <input
                          name="text"
                          required
                          placeholder="Add item"
                          className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-panel px-3 text-sm text-foreground placeholder:text-ink-soft focus:border-primary focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-panel px-3 text-sm font-bold text-foreground transition hover:bg-panel-muted disabled:opacity-55"
                        >
                          <Plus className="size-3.5" />
                          Add
                        </button>
                      </form>
                    </div>
                  );
                })
              ) : (
                <EmptyState icon={ListChecks} text="No checklists yet." />
              )}
            </div>
            <form onSubmit={addChecklist} className="mt-4 flex gap-2">
              <input
                name="title"
                required
                placeholder="New checklist title"
                className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-background px-3 text-sm text-foreground placeholder:text-ink-soft focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-black text-[#111111] transition hover:bg-primary-dark disabled:opacity-55"
              >
                Create
              </button>
            </form>
          </SectionCard>

          <SectionCard icon={ShieldCheck} title="QA validation" defaultOpen={Boolean(qaSummary?.linkedTestCases.length)}>
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-4">
                <QaStat label="Pass rate" tone={qaStats.ready ? "good" : qaStats.failed || qaStats.blocked ? "danger" : "neutral"} value={`${qaStats.passRate}%`} />
                <QaStat label="Passed" tone="good" value={String(qaStats.passed)} />
                <QaStat label="Failed" tone={qaStats.failed ? "danger" : "neutral"} value={String(qaStats.failed)} />
                <QaStat label="Blocked" tone={qaStats.blocked ? "danger" : "neutral"} value={String(qaStats.blocked)} />
              </div>

              <div className="rounded-xl border border-line bg-background p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-foreground">Linked test cases</h4>
                    <p className="text-[11px] font-semibold text-ink-soft">
                      Manual QA history is saved per execution. Failed results can raise bug tasks.
                    </p>
                  </div>
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]",
                    qaStats.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                  )}>
                    {qaStats.ready ? "Ready" : qaSummary?.linkedTestCases.length ? "Needs QA" : "No coverage"}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {qaSummary?.linkedTestCases.length ? (
                    qaSummary.linkedTestCases.map((link) => {
                      const testCase = link.testCase;
                      const latest = qaExecutionByCase.get(testCase.id);
                      return (
                        <article key={link.id ?? testCase.id} className="rounded-xl border border-line bg-panel p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="rounded-md bg-background px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-ink-soft">
                                  {testCase.type?.replaceAll("_", " ") ?? "Functional"}
                                </span>
                                <span className="rounded-md bg-background px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-ink-soft">
                                  {testCase.priority ?? "MEDIUM"}
                                </span>
                                <QaStatusBadge status={latest?.status ?? "UNTESTED"} />
                              </div>
                              <h5 className="mt-2 text-sm font-black text-foreground">{testCase.title}</h5>
                              {latest?.defectTask ? (
                                <Link
                                  href={`/tasks/${latest.defectTask.id}`}
                                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1 text-[11px] font-black text-red-700"
                                >
                                  <Bug className="size-3.5" />
                                  Defect {latest.defectTask.key}
                                </Link>
                              ) : latest?.updatedAt ? (
                                <p className="mt-1 text-[11px] font-semibold text-ink-soft">
                                  Last run {formatShortDate(latest.updatedAt)}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap justify-end gap-1.5">
                              {(["PASSED", "FAILED", "BLOCKED", "SKIPPED"] as QaExecutionStatus[]).map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => void recordQaResult(testCase, status)}
                                  disabled={saving}
                                  className={cn(
                                    "h-8 rounded-lg border px-2.5 text-[11px] font-black transition disabled:opacity-50",
                                    status === "PASSED" && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                                    status === "FAILED" && "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                                    status === "BLOCKED" && "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
                                    status === "SKIPPED" && "border-line bg-background text-ink-soft hover:bg-panel-muted",
                                  )}
                                >
                                  {qaStatusLabel(status)}
                                </button>
                              ))}
                              {latest && latest.status === "FAILED" && !latest.defectTask ? (
                                <button
                                  type="button"
                                  onClick={() => void createDefectFromQa(latest, testCase)}
                                  disabled={saving}
                                  className="h-8 rounded-lg border border-line bg-foreground px-2.5 text-[11px] font-black text-white transition hover:bg-black disabled:opacity-50"
                                >
                                  Create bug
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <EmptyState icon={ShieldAlert} text="No linked QA cases yet." compact />
                  )}
                </div>
              </div>

              <form onSubmit={addQaTestCase} className="grid gap-2 rounded-xl border border-line bg-background p-3">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input
                    value={qaDraft.title}
                    onChange={(event) => setQaDraft((current) => ({ ...current, title: event.target.value }))}
                    required
                    placeholder="Test case title"
                    className={fieldClass}
                  />
                  <input
                    value={qaDraft.expectedResult}
                    onChange={(event) => setQaDraft((current) => ({ ...current, expectedResult: event.target.value }))}
                    placeholder="Expected result"
                    className={fieldClass}
                  />
                  <button
                    type="submit"
                    disabled={saving || !qaDraft.title.trim()}
                    className="h-10 rounded-lg bg-primary px-4 text-sm font-black text-[#111111] transition hover:bg-primary-dark disabled:opacity-55"
                  >
                    Add QA case
                  </button>
                </div>
              </form>
            </div>
          </SectionCard>

          <SectionCard icon={GitBranch} title="Dependencies and blockers" defaultOpen={dependencies.blocking.length > 0 || dependencies.blockedBy.length > 0}>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-line bg-background p-3.5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-foreground">This task blocks</h4>
                    <p className="text-[11px] font-semibold text-ink-soft">
                      Downstream work waiting on this task.
                    </p>
                  </div>
                  <span className="rounded-lg bg-panel-muted px-2 py-1 text-[11px] font-black text-ink-soft">
                    {dependencyStats.blocking}
                  </span>
                </div>
                <div className="space-y-2">
                  {dependencies.blocking.length ? (
                    dependencies.blocking.map((dependency) => (
                      <DependencyRow
                        key={dependency.id}
                        dependency={dependency}
                        direction="blocking"
                        onRemove={() => void removeDependency(dependency.id)}
                        saving={saving}
                      />
                    ))
                  ) : (
                    <EmptyState icon={GitBranch} text="No downstream dependencies." compact />
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-line bg-background p-3.5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-foreground">Blocked by</h4>
                    <p className="text-[11px] font-semibold text-ink-soft">
                      Upstream dependencies that can slow delivery.
                    </p>
                  </div>
                  <span className="rounded-lg bg-red-50 px-2 py-1 text-[11px] font-black text-red-700">
                    {dependencyStats.blockedBy}
                  </span>
                </div>
                <div className="space-y-2">
                  {dependencies.blockedBy.length ? (
                    dependencies.blockedBy.map((dependency) => (
                      <DependencyRow
                        key={dependency.id}
                        dependency={dependency}
                        direction="blockedBy"
                        saving={saving}
                      />
                    ))
                  ) : (
                    <EmptyState icon={GitBranch} text="No active blockers." compact />
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={addDependency} className="mt-4 grid gap-2 rounded-xl border border-line bg-background p-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
              <select
                name="toTaskId"
                required
                defaultValue=""
                disabled={!dependencyTargetTasks.length}
                className={fieldClass}
              >
                <option value="" disabled>
                  {dependencyTargetTasks.length ? "Select related task" : "No project tasks available"}
                </option>
                {dependencyTargetTasks.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.key} - {candidate.title}
                  </option>
                ))}
              </select>
              <select name="type" defaultValue="BLOCKS" className={fieldClass}>
                <option value="BLOCKS">Blocks</option>
                <option value="RELATES_TO">Relates to</option>
                <option value="DUPLICATES">Duplicates</option>
              </select>
              <button
                type="submit"
                disabled={saving || !dependencyTargetTasks.length}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-black text-[#111111] transition hover:bg-primary-dark disabled:opacity-55"
              >
                Add link
              </button>
            </form>
          </SectionCard>

          <FileAssetManager
            token={token}
            entityType="TASK"
            entityId={taskId}
            scope="TASK"
            title="Task files"
            compact
            onChanged={() => void refreshActivity()}
          />

          <SectionCard icon={Zap} title="Activity" defaultOpen={false}>
            <div className="space-y-2">
              {activities.length ? (
                activities.slice(0, 18).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-xl border border-line bg-background px-3 py-2.5"
                  >
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {humanizeActivity(activity.action)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-soft">
                        {formatShortDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={Zap} text="No activity yet." />
              )}
            </div>
          </SectionCard>
        </div>

        <div className="min-w-0 space-y-5 xl:sticky xl:top-20 xl:self-start">
          <SectionCard icon={Flag} title="Properties" compact defaultOpen>
            <form onSubmit={saveTask} className="grid gap-3">
              <Field label="Title">
                <input
                  key={`${task.id}-${task.updatedAt}-title`}
                  name="title"
                  defaultValue={task.title}
                  required
                  className={fieldClass}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Field label="Status">
                  <select
                    key={`${task.id}-${task.updatedAt}-status`}
                    name="status"
                    defaultValue={task.status}
                    className={fieldClass}
                  >
                    {lifecycleStatusOrder.map((status) => (
                      <option key={status} value={status}>
                        {taskStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    key={`${task.id}-${task.updatedAt}-priority`}
                    name="priority"
                    defaultValue={task.priority}
                    className={fieldClass}
                  >
                    {(Object.keys(priorityLabels) as TaskPriority[]).map((priority) => (
                      <option key={priority} value={priority}>
                        {priorityLabels[priority]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Due date">
                <input
                  key={`${task.id}-${task.updatedAt}-due`}
                  name="dueDate"
                  type="date"
                  defaultValue={dateInputValue(task.dueDate)}
                  className={fieldClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Story points">
                  <input
                    key={`${task.id}-${task.updatedAt}-points`}
                    name="storyPoints"
                    type="number"
                    min={0}
                    defaultValue={task.storyPoints ?? ""}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Est. hours">
                  <input
                    key={`${task.id}-${task.updatedAt}-hours`}
                    name="estimateHours"
                    type="number"
                    min={0}
                    step="0.5"
                    defaultValue={task.estimateMins ? task.estimateMins / 60 : ""}
                    className={fieldClass}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  key={`${task.id}-${task.updatedAt}-description`}
                  name="description"
                  defaultValue={task.description ?? ""}
                  rows={5}
                  className="min-h-28 resize-none rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none"
                />
              </Field>
              <button
                type="submit"
                disabled={saving}
                className="tb-yellow-button h-10 rounded-lg text-sm font-black disabled:cursor-not-allowed disabled:opacity-55"
              >
                {saving ? "Saving..." : "Save task"}
              </button>
            </form>
          </SectionCard>

          <SectionCard icon={Users} title="Assignees" compact defaultOpen={assignees.length > 0}>
            <div className="space-y-2">
              {assignees.length ? (
                assignees.map((assignee) => (
                  <PersonRow
                    key={assignee.id}
                    user={assignee.user}
                    action={
                      <button
                        type="button"
                        onClick={() => void unassignUser(assignee.user.id)}
                        disabled={saving}
                        className="inline-flex size-7 items-center justify-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                        aria-label="Remove assignee"
                      >
                        <X className="size-3.5" />
                      </button>
                    }
                  />
                ))
              ) : (
                <EmptyState icon={Users} text="No assignees." compact />
              )}
            </div>
            <form onSubmit={addAssignee} className="mt-3 flex gap-2">
              <select
                name="userId"
                className={cn(fieldClass, "min-w-0 flex-1")}
                disabled={!assignableUsers.length}
                defaultValue=""
              >
                <option value="" disabled>
                  {assignableUsers.length ? "Select user" : "No users available"}
                </option>
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {displayName(user)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving || !assignableUsers.length}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-panel px-3 text-sm font-bold text-foreground transition hover:bg-panel-muted disabled:opacity-50"
                aria-label="Assign user"
              >
                <UserPlus className="size-4" />
              </button>
            </form>
          </SectionCard>

          <SectionCard icon={Eye} title="Watchers" compact defaultOpen={false}>
            <div className="space-y-2">
              {watchers.length ? (
                watchers.map((watcher) => {
                  const user = watcher.user;
                  const userId = user?.id ?? watcher.userId ?? "";
                  return user ? (
                    <PersonRow
                      key={watcher.id}
                      user={user}
                      action={
                        <button
                          type="button"
                          onClick={() => void unwatchTask(userId)}
                          disabled={saving || !userId}
                          className="inline-flex size-7 items-center justify-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                          aria-label="Remove watcher"
                        >
                          <X className="size-3.5" />
                        </button>
                      }
                    />
                  ) : (
                    <div key={watcher.id} className="rounded-xl border border-line bg-background p-3 text-xs font-bold text-ink-soft">
                      Watcher {userId || watcher.id}
                    </div>
                  );
                })
              ) : (
                <EmptyState icon={Eye} text="No watchers." compact />
              )}
            </div>
            <form onSubmit={addWatcher} className="mt-3 flex gap-2">
              <select
                name="userId"
                className={cn(fieldClass, "min-w-0 flex-1")}
                disabled={!watchableUsers.length}
                defaultValue=""
              >
                <option value="" disabled>
                  {watchableUsers.length ? "Select watcher" : "No users available"}
                </option>
                {watchableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {displayName(user)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving || !watchableUsers.length}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-panel px-3 text-sm font-bold text-foreground transition hover:bg-panel-muted disabled:opacity-50"
                aria-label="Add watcher"
              >
                <Eye className="size-4" />
              </button>
            </form>
          </SectionCard>

          <SectionCard icon={Tag} title="Labels" compact defaultOpen={taskLabels.length > 0}>
            <div className="flex flex-wrap gap-2">
              {taskLabels.length ? (
                taskLabels.map((assignment) => (
                  <button
                    key={assignment.id}
                    type="button"
                    onClick={() => void unassignLabel(assignment.label.id)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black transition hover:opacity-75 disabled:opacity-45"
                    style={{
                      borderColor: `${assignment.label.color ?? "#ffd400"}55`,
                      background: `${assignment.label.color ?? "#ffd400"}18`,
                      color: assignment.label.color ?? "#111111",
                    }}
                    title="Remove label"
                  >
                    {assignment.label.name}
                    <X className="size-3" />
                  </button>
                ))
              ) : (
                <EmptyState icon={Tag} text="No labels." compact />
              )}
            </div>

            <form onSubmit={assignLabel} className="mt-3 flex gap-2">
              <select
                name="labelId"
                className={cn(fieldClass, "min-w-0 flex-1")}
                disabled={!availableLabels.length}
                defaultValue=""
              >
                <option value="" disabled>
                  {availableLabels.length ? "Select label" : "No labels available"}
                </option>
                {availableLabels.map((label) => (
                  <option key={label.id} value={label.id}>
                    {label.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving || !availableLabels.length}
                className="h-10 rounded-lg border border-line bg-panel px-3 text-sm font-bold text-foreground transition hover:bg-panel-muted disabled:opacity-50"
              >
                Add
              </button>
            </form>

            <form onSubmit={createAndAssignLabel} className="mt-3 grid gap-2">
              <input
                name="name"
                required
                placeholder="New label"
                className={fieldClass}
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {labelColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewLabelColor(color)}
                      className={cn(
                        "size-6 rounded-full border transition",
                        newLabelColor === color ? "border-foreground ring-2 ring-primary/35" : "border-line",
                      )}
                      style={{ background: color }}
                      aria-label={`Use label color ${color}`}
                    />
                  ))}
                </div>
                <input type="hidden" name="color" value={newLabelColor} />
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-lg bg-primary px-3 text-sm font-black text-[#111111] transition hover:bg-primary-dark disabled:opacity-55"
                >
                  Create
                </button>
              </div>
            </form>
          </SectionCard>

          {task.project ? (
            <SectionCard icon={ExternalLink} title="Project" compact defaultOpen={false}>
              <Link
                href={`/projects/${task.project.id}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-background p-3 transition hover:border-primary/50 hover:bg-panel-muted"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-black text-[#111111]">
                  {task.project.key.slice(0, 3)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-foreground">{task.project.name}</p>
                  <p className="text-[11px] text-ink-soft">{task.project.key}</p>
                </div>
                <ExternalLink className="size-4 text-ink-soft" />
              </Link>
            </SectionCard>
          ) : null}

          <SectionCard icon={Archive} title="Task controls" compact defaultOpen={false} danger={taskIsArchived}>
            <div className="grid gap-2">
              {taskIsArchived ? (
                <button
                  type="button"
                  onClick={() => void reopenTask()}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-panel text-sm font-black text-foreground transition hover:bg-panel-muted disabled:opacity-55"
                >
                  <RotateCcw className="size-4" />
                  Reopen task
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void archiveTask()}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-panel text-sm font-black text-foreground transition hover:bg-panel-muted disabled:opacity-55"
                >
                  <Archive className="size-4" />
                  Archive task
                </button>
              )}
              <button
                type="button"
                onClick={() => void removeTaskPermanently()}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-55"
              >
                <Trash2 className="size-4" />
                Delete task
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </Shell>
  );
}

function QaStat({ label, tone, value }: { label: string; tone: "danger" | "good" | "neutral"; value: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        tone === "good" && "border-emerald-200 bg-emerald-50",
        tone === "danger" && "border-red-200 bg-red-50",
        tone === "neutral" && "border-line bg-background",
      )}
    >
      <p
        className={cn(
          "text-[22px] font-black leading-none tabular-nums",
          tone === "good" && "text-emerald-700",
          tone === "danger" && "text-red-700",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">{label}</p>
    </div>
  );
}

function QaStatusBadge({ status }: { status: QaExecutionStatus }) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em]",
        status === "PASSED" && "bg-emerald-50 text-emerald-700",
        status === "FAILED" && "bg-red-50 text-red-700",
        status === "BLOCKED" && "bg-amber-50 text-amber-700",
        status === "SKIPPED" && "bg-slate-100 text-slate-600",
        status === "FLAKY" && "bg-purple-50 text-purple-700",
        status === "UNTESTED" && "bg-background text-ink-soft",
      )}
    >
      {qaStatusLabel(status)}
    </span>
  );
}

function Shell({ children, mode }: { children: ReactNode; mode: TaskLifecycleMode }) {
  if (mode === "drawer") {
    return (
      <div className="h-full min-h-0 overflow-y-auto bg-background tb-scrollbar">
        <div className="space-y-5 p-4 sm:p-5">{children}</div>
      </div>
    );
  }

  return <div className="mx-auto grid max-w-6xl gap-5">{children}</div>;
}

function SectionCard({
  children,
  compact,
  danger,
  defaultOpen = true,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  compact?: boolean;
  danger?: boolean;
  defaultOpen?: boolean;
  icon: LucideIcon;
  title: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-panel shadow-sm",
        danger ? "border-red-200" : "border-line",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors sm:px-5",
          danger ? "hover:bg-red-50/40" : "hover:bg-panel-muted/50",
        )}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            danger ? "bg-red-50" : "bg-panel-muted",
          )}
        >
          <Icon className={cn("size-4", danger ? "text-red-500" : "text-ink-soft")} />
        </span>

        <h3
          className={cn(
            "flex-1 text-sm font-black",
            danger ? "text-red-700" : "text-foreground",
          )}
        >
          {title}
        </h3>

        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border transition",
            danger
              ? "border-red-200 text-red-400 hover:bg-red-100"
              : "border-line text-ink-soft hover:bg-panel-muted",
          )}
          aria-label={open ? "Collapse section" : "Expand section"}
        >
          {open ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
        </span>
      </button>

      {open && (
        <>
          <div className={cn("border-t", danger ? "border-red-100" : "border-line")} />
          <div className={compact ? "p-4" : "p-4 sm:p-5"}>{children}</div>
        </>
      )}
    </section>
  );
}

function HeaderStat({
  danger,
  icon: Icon,
  label,
  value,
}: {
  danger?: boolean;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("size-3.5 shrink-0", danger ? "text-red-400" : "text-white/35")} />
      <span className={cn("text-[12px] font-bold tabular-nums", danger ? "text-red-300" : "text-white/70")}>
        {value}
      </span>
      <span className="text-[10px] text-white/30">{label}</span>
    </div>
  );
}

function SignalPill({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black"
      style={{
        background: `${color}22`,
        borderColor: `${color}55`,
        color,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-ink-soft">
      {label}
      {children}
    </label>
  );
}

function PersonRow({ action, user }: { action?: ReactNode; user: UserSummary }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-background p-2.5">
      <Avatar user={user} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{displayName(user)}</p>
        <p className="truncate text-[11px] text-ink-soft">{user.email}</p>
      </div>
      {action}
    </div>
  );
}

function DependencyRow({
  dependency,
  direction,
  onRemove,
  saving,
}: {
  dependency: TaskDependency;
  direction: "blocking" | "blockedBy";
  onRemove?: () => void;
  saving: boolean;
}) {
  const linkedTask = direction === "blocking" ? dependency.toTask : dependency.fromTask;
  const status = linkedTask?.status;

  return (
    <article className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          direction === "blockedBy" ? "bg-red-50 text-red-700" : "bg-primary/20 text-[#111111]",
        )}
      >
        <Link2 className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-black text-foreground">
            {linkedTask ? `${linkedTask.key} - ${linkedTask.title}` : dependency.toTaskId}
          </p>
          <span className="rounded-md bg-background px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-ink-soft">
            {dependency.type.replaceAll("_", " ")}
          </span>
        </div>
        <p className="mt-1 text-[11px] font-semibold text-ink-soft">
          {status ? taskStatusLabels[status] : "Linked task"} {linkedTask?.dueDate ? `- due ${formatShortDate(linkedTask.dueDate)}` : ""}
        </p>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={saving}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
          aria-label="Remove dependency"
        >
          <Unlink className="size-3.5" />
        </button>
      ) : null}
    </article>
  );
}

function Avatar({ user }: { user: UserSummary }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0f1117] text-[10px] font-black text-white">
      {userInitials(user)}
    </span>
  );
}

function Notice({ message }: { message: { text: string; ok: boolean } }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-bold",
        message.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {message.text}
    </div>
  );
}

function EmptyState({
  compact,
  icon: Icon,
  text,
}: {
  compact?: boolean;
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-xl border border-dashed border-line bg-background text-center",
        compact ? "px-3 py-4" : "px-5 py-8",
      )}
    >
      <Icon className="size-5 text-ink-soft" />
      <p className="mt-2 text-sm font-semibold text-ink-soft">{text}</p>
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="h-48 animate-pulse rounded-2xl bg-panel-muted" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="h-52 animate-pulse rounded-2xl bg-panel-muted" />
          <div className="h-64 animate-pulse rounded-2xl bg-panel-muted" />
        </div>
        <div className="space-y-4">
          <div className="h-72 animate-pulse rounded-2xl bg-panel-muted" />
          <div className="h-40 animate-pulse rounded-2xl bg-panel-muted" />
        </div>
      </div>
    </div>
  );
}

function displayName(user: UserSummary) {
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
}

function authUserToSummary(user: AuthUser): UserSummary {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
  };
}

function mergeAssignment(current: TaskLabelAssignment[], next: TaskLabelAssignment) {
  return current.some((item) => item.label.id === next.label.id)
    ? current.map((item) => (item.label.id === next.label.id ? next : item))
    : [...current, next];
}

function mergeAssignee(current: TaskAssignee[], next: TaskAssignee) {
  return current.some((item) => item.user.id === next.user.id)
    ? current.map((item) => (item.user.id === next.user.id ? next : item))
    : [...current, next];
}

function mergeDependency(current: TaskDependency[], next: TaskDependency) {
  return current.some((item) => item.id === next.id)
    ? current.map((item) => (item.id === next.id ? next : item))
    : [...current, next];
}

function mergeLabel(current: TaskLabel[], next: TaskLabel) {
  return current.some((item) => item.id === next.id)
    ? current.map((item) => (item.id === next.id ? next : item))
    : [...current, next].sort((left, right) => left.name.localeCompare(right.name));
}

function humanizeActivity(action: string) {
  return action
    .replace(/^task\./, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toNoonIso(date: string) {
  return new Date(`${date}T12:00:00`).toISOString();
}

function dateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function qaStatusLabel(status: QaExecutionStatus) {
  return status.toLowerCase().replaceAll("_", " ");
}

function normalizeQaTaskSummary(value: unknown): QaTaskSummary {
  const source = isRecord(value) ? value : {};
  return {
    evidence: Array.isArray(source.evidence) ? source.evidence : [],
    executions: normalizeQaExecutionSummary(source.executions),
    latestExecutions: Array.isArray(source.latestExecutions)
      ? source.latestExecutions.filter(isRecord).map(normalizeQaLatestExecution)
      : [],
    linkedTestCases: Array.isArray(source.linkedTestCases)
      ? source.linkedTestCases.filter(isRecord).map(normalizeQaLinkedCase).filter((item) => item.testCase.id)
      : [],
  };
}

function normalizeQaExecutionSummary(value: unknown): QaExecutionSummary {
  const source = isRecord(value) ? value : {};
  return {
    blocked: readNumber(source.blocked),
    failed: readNumber(source.failed),
    flaky: readNumber(source.flaky),
    passed: readNumber(source.passed),
    passRate: readNumber(source.passRate),
    ready: source.ready === true,
    skipped: readNumber(source.skipped),
    total: readNumber(source.total),
    untested: readNumber(source.untested),
  };
}

function normalizeQaLatestExecution(source: Record<string, unknown>): QaLatestExecution {
  const defectTask = isRecord(source.defectTask)
    ? {
        id: readString(source.defectTask.id),
        key: readString(source.defectTask.key),
        status: readTaskStatus(source.defectTask.status),
        title: readString(source.defectTask.title),
      }
    : null;

  return {
    actualResult: readNullableString(source.actualResult),
    defectTask: defectTask?.id ? defectTask : null,
    executedAt: readNullableString(source.executedAt),
    failureMessage: readNullableString(source.failureMessage),
    id: readString(source.id),
    status: readQaExecutionStatus(source.status),
    testCaseId: readNullableString(source.testCaseId),
    testRunId: readString(source.testRunId),
    updatedAt: readString(source.updatedAt),
  };
}

function normalizeQaLinkedCase(source: Record<string, unknown>): QaLinkedTestCase {
  const testCaseSource = isRecord(source.testCase) ? source.testCase : {};
  return {
    id: readString(source.id),
    linkType: readString(source.linkType),
    testCaseId: readString(source.testCaseId),
    testCase: {
      automationKey: readNullableString(testCaseSource.automationKey),
      id: readString(testCaseSource.id),
      priority: readQaPriority(testCaseSource.priority),
      status: readString(testCaseSource.status),
      title: readString(testCaseSource.title),
      type: readQaType(testCaseSource.type),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readQaExecutionStatus(value: unknown): QaExecutionStatus {
  return value === "PASSED" || value === "FAILED" || value === "BLOCKED" || value === "SKIPPED" || value === "FLAKY"
    ? value
    : "UNTESTED";
}

function readQaPriority(value: unknown): QaTestCasePriority {
  return value === "LOW" || value === "HIGH" || value === "CRITICAL" ? value : "MEDIUM";
}

function readQaType(value: unknown): QaTestCaseType {
  if (
    value === "REGRESSION"
    || value === "SMOKE"
    || value === "INTEGRATION"
    || value === "PERFORMANCE"
    || value === "SECURITY"
    || value === "ACCESSIBILITY"
    || value === "ACCEPTANCE"
  ) {
    return value;
  }
  return "FUNCTIONAL";
}

function readTaskStatus(value: unknown): TaskStatus {
  return lifecycleStatusOrder.includes(value as TaskStatus) ? value as TaskStatus : "BACKLOG";
}

const fieldClass =
  "h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none";
