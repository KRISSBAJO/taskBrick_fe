"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Edit3,
  ExternalLink,
  History,
  LayoutDashboard,
  LockKeyhole,
  MapPin as MapPinIcon,
  MoreVertical,
  Paperclip,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Trash2,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  createProjectBudget,
  createProjectChangeRequest,
  createProjectDecision,
  createProjectDependency,
  createProjectMilestone,
  createProjectRisk,
  createProjectStakeholder,
  createLabel,
  bulkTaskOperation,
  createCustomField,
  createTask,
  createTaskChecklist,
  createTaskChecklistItem,
  createTaskComment,
  createTaskSavedView,
  addTaskAssignee,
  assignTaskLabel,
  deleteProjectBudget,
  deleteProject,
  deleteProjectChangeRequest,
  deleteProjectDecision,
  deleteProjectDependency,
  deleteProjectMilestone,
  deleteProjectStakeholder,
  deleteTask,
  getTaskTaxonomy,
  getProject,
  getProjectPermissions,
  getTask,
  listCustomFields,
  listUsers,
  listLabels,
  listProjectBudgets,
  listProjectChangeRequests,
  listProjectDecisions,
  listProjectDependencies,
  listProjectMembers,
  listProjectMilestones,
  listProjectRisks,
  listProjectStakeholders,
  listAuditLogs,
  listTaskActivities,
  listTaskAssignees,
  listTaskChecklists,
  listTaskComments,
  listTaskLabels,
  removeTaskAssignee,
  removeTaskLabel,
  removeProjectMember,
  listTaskSavedViews,
  listTasks,
  updateProject,
  updateProjectBudget,
  updateProjectChangeRequest,
  updateProjectDecision,
  updateProjectDependency,
  updateProjectMilestone,
  updateProjectRisk,
  updateProjectStakeholder,
  updateTask,
  updateTaskChecklistItem,
  upsertProjectMember,
  type AuthUser,
  type Project,
  type ProjectBudget,
  type ProjectChangeRequest,
  type ProjectChangeRequestStatus,
  type ProjectDecision,
  type ProjectDecisionStatus,
  type ProjectDependency,
  type ProjectDependencyStatus,
  type ProjectMember,
  type ProjectMilestone,
  type ProjectPermissionMatrix,
  type ProjectRisk,
  type ProjectStakeholder,
  type ProjectStakeholderInfluence,
  type AuditLog,
  type CustomField,
  type CustomFieldType,
  type TenantUser,
  type Task,
  type TaskActivity,
  type TaskAssignee,
  type TaskChecklist,
  type TaskComment,
  type TaskLabel,
  type TaskLabelAssignment,
  type TaskPriority,
  type TaskSavedView,
  type TaskStatus,
  type TaskTaxonomy,
  type TaskType,
  type UserSummary,
  type Visibility,
} from "@/lib/api";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { TaskDetailPage } from "@/components/task-detail-page";
import { TaskLifecycleView } from "@/components/task-lifecycle-view";
import { FileAssetManager } from "@/components/file-asset-manager";
import { Tabs as FoundationTabs } from "@/components/ui/foundation";
import { cn } from "@/lib/cn";
import { canViewProjectFinance } from "@/lib/project-permissions";
import {
  formatShortDate,
  getProjectHealth,
  isOpenTask,
  isRiskTask,
  priorityLabels,
  projectStatusLabels,
  taskStatusLabels,
  taskStatusOrder,
  userInitials,
} from "@/lib/workspace-ui";

type ProjectTab = "overview" | "work" | "planning" | "files" | "finance" | "access" | "activity";

const tabs: Array<{ id: ProjectTab; label: string; Icon: LucideIcon }> = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "work", label: "Tasks", Icon: ClipboardList },
  { id: "planning", label: "Planning", Icon: Target },
  { id: "files", label: "Files", Icon: Paperclip },
  { id: "finance", label: "Finance", Icon: CircleDollarSign },
  { id: "access", label: "Access", Icon: ShieldCheck },
  { id: "activity", label: "Activity", Icon: History },
];

const visibilityOptions: Visibility[] = ["PRIVATE", "TEAM", "WORKSPACE", "ORGANIZATION", "PUBLIC"];
const projectRoleOptions = ["Owner", "Manager", "Editor", "Contributor", "Viewer", "Client"];
const projectCurrencyOptions = ["USD", "NGN", "GBP", "EUR", "CAD", "AUD", "ZAR", "GHS", "KES"];
const stakeholderInfluenceOptions: ProjectStakeholderInfluence[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const dependencyStatusOptions: ProjectDependencyStatus[] = ["OPEN", "BLOCKED", "RESOLVED", "CANCELLED"];
const decisionStatusOptions: ProjectDecisionStatus[] = ["PROPOSED", "DECIDED", "SUPERSEDED", "REOPENED"];
const changeRequestStatusOptions: ProjectChangeRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "IMPLEMENTED",
  "CANCELLED",
];

const priorityBadge: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH: "bg-amber-50 text-amber-700",
  URGENT: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
};

const priorityDot: Record<TaskPriority, string> = {
  LOW: "bg-gray-400",
  MEDIUM: "bg-blue-400",
  HIGH: "bg-amber-500",
  URGENT: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

const statusPill: Record<TaskStatus, string> = {
  BACKLOG: "bg-gray-100 text-gray-600",
  TODO: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  REVIEW: "bg-violet-50 text-violet-700",
  TESTING: "bg-cyan-50 text-cyan-700",
  DONE: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-600",
};

const statusLeftBar: Record<TaskStatus, string> = {
  BACKLOG: "bg-gray-300",
  TODO: "bg-blue-400",
  IN_PROGRESS: "bg-amber-400",
  REVIEW: "bg-violet-400",
  TESTING: "bg-cyan-400",
  DONE: "bg-emerald-400",
  CANCELLED: "bg-red-300",
};

const lifecycleTaskStatuses: TaskStatus[] = [...taskStatusOrder, "CANCELLED"];
const taskTypes: TaskType[] = ["TASK", "STORY", "BUG", "EPIC", "FEATURE", "INCIDENT", "APPROVAL", "CHANGE_REQUEST", "MILESTONE"];
const customFieldTypes: CustomFieldType[] = ["TEXT", "NUMBER", "DATE", "BOOLEAN", "SINGLE_SELECT", "MULTI_SELECT", "USER", "URL", "JSON"];
const filterControlClass =
  "h-10 min-w-0 rounded-xl border border-line bg-panel px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary";

type WorkViewMode = "list" | "table" | "backlog";

type WorkFilters = {
  search: string;
  status: "" | TaskStatus;
  priority: "" | TaskPriority;
  type: "" | TaskType;
  assigneeId: string;
  dueFrom: string;
  dueTo: string;
  storyPointsMin: string;
  storyPointsMax: string;
  isOverdue: boolean;
  unassigned: boolean;
  hasAttachments: boolean;
  hasDependencies: boolean;
  isBlocked: boolean;
  isBlocking: boolean;
  includeArchived: boolean;
  includeDeleted: boolean;
  sortBy: "updatedAt" | "dueDate" | "priority" | "status" | "storyPoints" | "createdAt" | "title" | "sprintName";
  sortDirection: "asc" | "desc";
};

const defaultWorkFilters: WorkFilters = {
  search: "",
  status: "",
  priority: "",
  type: "",
  assigneeId: "",
  dueFrom: "",
  dueTo: "",
  storyPointsMin: "",
  storyPointsMax: "",
  isOverdue: false,
  unassigned: false,
  hasAttachments: false,
  hasDependencies: false,
  isBlocked: false,
  isBlocking: false,
  includeArchived: false,
  includeDeleted: false,
  sortBy: "updatedAt",
  sortDirection: "desc",
};

const statusAccentColor: Record<Project["status"], string> = {
  ACTIVE: "#10b981",
  PLANNING: "#3b82f6",
  ON_HOLD: "#f59e0b",
  COMPLETED: "#8b5cf6",
  ARCHIVED: "#9ca3af",
};

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth } = useWorkspaceAuth();
  const projectId = params.projectId;
  const requestedTaskId = searchParams.get("task");

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [savedViews, setSavedViews] = useState<TaskSavedView[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaskTaxonomy | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [projectPermissions, setProjectPermissions] = useState<ProjectPermissionMatrix | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [budgets, setBudgets] = useState<ProjectBudget[]>([]);
  const [stakeholders, setStakeholders] = useState<ProjectStakeholder[]>([]);
  const [dependencies, setDependencies] = useState<ProjectDependency[]>([]);
  const [decisions, setDecisions] = useState<ProjectDecision[]>([]);
  const [changeRequests, setChangeRequests] = useState<ProjectChangeRequest[]>([]);
  const [activeTab, setActiveTab] = useState<ProjectTab>("overview");
  const [workFilters, setWorkFilters] = useState<WorkFilters>(defaultWorkFilters);
  const [workViewMode, setWorkViewMode] = useState<WorkViewMode>("list");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showTaskComposer, setShowTaskComposer] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const setMessage = useToastMessageDispatcher();
  const [error, setError] = useState("");

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [projectData, permissionData] = await Promise.all([
        getProject(auth.accessToken, projectId),
        getProjectPermissions(auth.accessToken, projectId),
      ]);
      const canLoadBudget = permissionData.actions.viewBudget || permissionData.actions.manageBudget;
      const [
        taskPage,
        memberData,
        milestoneData,
        riskData,
        budgetData,
        stakeholderData,
        dependencyData,
        decisionData,
        changeRequestData,
        savedViewPage,
        customFieldPage,
        taxonomyData,
      ] =
        await Promise.all([
          listTasks(auth.accessToken, taskQueryFromFilters(projectId, workFilters)),
          listProjectMembers(auth.accessToken, projectId),
          listProjectMilestones(auth.accessToken, projectId),
          listProjectRisks(auth.accessToken, projectId),
          canLoadBudget ? listProjectBudgets(auth.accessToken, projectId) : Promise.resolve([]),
          listProjectStakeholders(auth.accessToken, projectId),
          listProjectDependencies(auth.accessToken, projectId),
          listProjectDecisions(auth.accessToken, projectId),
          listProjectChangeRequests(auth.accessToken, projectId),
          listTaskSavedViews(auth.accessToken, { projectId, limit: 100 }),
          listCustomFields(auth.accessToken, { projectId, entityType: "TASK", limit: 100 }),
          getTaskTaxonomy(auth.accessToken),
        ]);

      setProject({ ...projectData, permissions: permissionData });
      setTasks(taskPage.data);
      setSavedViews(savedViewPage.data);
      setCustomFields(customFieldPage.data);
      setTaxonomy(taxonomyData);
      setMembers(memberData);
      setMilestones(milestoneData);
      setRisks(riskData);
      setBudgets(canLoadBudget ? budgetData : []);
      setStakeholders(stakeholderData);
      setDependencies(dependencyData);
      setDecisions(decisionData);
      setChangeRequests(changeRequestData);
      setProjectPermissions(permissionData);

      if (permissionData.actions.manageMembers) {
        try {
          const users = await listUsers(auth.accessToken, { limit: 100 });
          setTenantUsers(users.data);
        } catch {
          setTenantUsers([]);
        }
      } else {
        setTenantUsers([]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load project.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, projectId, workFilters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadProject(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadProject]);

  useEffect(() => {
    setSelectedTaskIds((current) => current.filter((taskId) => tasks.some((task) => task.id === taskId)));
  }, [tasks]);

  // ?task= URL now renders a standalone full page (early return below)

  const openTasks = tasks.filter(isOpenTask);
  const completedTasks = tasks.filter((t) => t.status === "DONE");
  const riskTasks = tasks.filter(isRiskTask);
  const activeRisks = risks.filter((r) => r.isOpen);
  const openDependencies = dependencies.filter((dependency) => ["OPEN", "BLOCKED"].includes(dependency.status));
  const openChangeRequests = changeRequests.filter((request) => ["DRAFT", "SUBMITTED", "APPROVED"].includes(request.status));
  const activeMilestones = milestones.filter((m) => !m.completedAt);
  const sortedTasks = useMemo(() => sortTasks(tasks, workFilters), [tasks, workFilters]);
  const plannedBudget = budgets.reduce((s, b) => s + Number(b.planned ?? 0), 0);
  const actualBudget = budgets.reduce((s, b) => s + Number(b.actual ?? 0), 0);
  const currency = budgets[0]?.currency || project?.currency || "USD";
  const contractValue = Number(project?.contractValue ?? 0);
  const financeCeiling = contractValue || plannedBudget;
  const health = project ? getProjectHealth(project) : "Needs review";
  const { confirm } = useConfirm();
  const projectActions = projectPermissions?.actions ?? project?.permissions?.actions;
  const projectForPermissionChecks = project ? { ...project, permissions: projectPermissions ?? project.permissions } : null;
  const canViewBudget = canViewProjectFinance(projectForPermissionChecks);
  const canEditProject = Boolean(projectActions?.editProject);
  const canArchiveProject = Boolean(projectActions?.archiveProject);
  const canRestoreProject = Boolean(projectActions?.restoreProject);
  const canDeleteProject = Boolean(projectActions?.deleteProject);
  const canCreateTasks = projectActions?.createTasks ?? false;
  const canEditTasks = projectActions?.editTasks ?? false;
  const canManageFiles = Boolean(projectActions?.manageFiles);
  const canManageBudget = Boolean(projectActions?.manageBudget);
  const canManageGovernance = canEditProject;
  const visibleTabs = tabs.filter((tab) => tab.id !== "finance" || canViewBudget);
  const visibleActiveTab = visibleTabs.some((tab) => tab.id === activeTab) ? activeTab : "overview";

  async function reloadWithMessage(msg?: string) {
    await loadProject();
    if (msg) setMessage(msg);
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;
    const fd = new FormData(event.currentTarget);
    const startDate = String(fd.get("startDate") || "");
    const dueDate = String(fd.get("dueDate") || "");
    const nullableString = (key: string) => {
      const value = String(fd.get(key) ?? "").trim();
      return value || null;
    };
    const contractValue = Number(fd.get("contractValue") || 0);
    setSaving(true);
    setMessage("");
    try {
      const payload: Parameters<typeof updateProject>[2] = {
        name: String(fd.get("name") || ""),
        description: String(fd.get("description") || ""),
        status: fd.get("status") as Project["status"],
        visibility: fd.get("visibility") as Visibility,
        progress: Number(fd.get("progress") || 0),
        startDate: startDate ? toNoonIso(startDate) : null,
        dueDate: dueDate ? toNoonIso(dueDate) : null,
      };

      if (canManageBudget) {
        Object.assign(payload, {
          currency: String(fd.get("currency") || project.currency || "USD").toUpperCase(),
          contractValue: Number.isFinite(contractValue) && contractValue >= 0 ? contractValue : 0,
          clientName: nullableString("clientName"),
          clientEmail: nullableString("clientEmail"),
          clientPhone: nullableString("clientPhone"),
          locationName: nullableString("locationName"),
          addressLine1: nullableString("addressLine1"),
          addressLine2: nullableString("addressLine2"),
          city: nullableString("city"),
          state: nullableString("state"),
          country: nullableString("country"),
          postalCode: nullableString("postalCode"),
          timezone: nullableString("timezone"),
          billingCode: nullableString("billingCode"),
          costCenter: nullableString("costCenter"),
        });
      }

      const updated = await updateProject(auth.accessToken, project.id, payload);
      setProject(updated);
      setShowEditProject(false);
      setMessage("Project updated.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update project.");
    } finally {
      setSaving(false);
    }
  }

  async function setProjectStatus(status: Project["status"], successMsg: string) {
    if (!project) return;
    const allowed =
      status === "ARCHIVED"
        ? canArchiveProject
        : project.status === "ARCHIVED" && status === "ACTIVE"
          ? canRestoreProject
          : canEditProject;
    if (!allowed) {
      setMessage("You do not have permission for this project action.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateProject(auth.accessToken, project.id, {
        status,
        progress: status === "COMPLETED" ? 100 : project.progress,
        completedAt: status === "COMPLETED" ? new Date().toISOString() : undefined,
      });
      setProject(updated);
      setMessage(successMsg);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update project status.");
    } finally {
      setSaving(false);
    }
  }

  async function archiveProject() {
    const confirmed = await confirm({
      title: "Archive project?",
      description: "Archived projects stay available for records and reporting, but are removed from active delivery.",
      confirmLabel: "Archive project",
      tone: "warning",
    });
    if (!confirmed) return;
    await setProjectStatus("ARCHIVED", "Project archived.");
  }

  async function restoreProject() {
    await setProjectStatus("ACTIVE", "Project restored to active.");
  }

  async function completeProject() {
    const confirmed = await confirm({
      title: "Mark project complete?",
      description: "This sets progress to 100% and records the project as completed.",
      confirmLabel: "Mark complete",
      tone: "warning",
    });
    if (!confirmed) return;
    await setProjectStatus("COMPLETED", "Project marked complete.");
  }

  async function removeProject() {
    if (!project) return;
    if (!canDeleteProject) {
      setMessage("You do not have permission to delete projects.");
      return;
    }
    const confirmed = await confirm({
      title: "Delete project permanently?",
      description: `Delete "${project.name}" and its project records where the backend allows it. This is not an archive action.`,
      confirmLabel: "Delete project",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true);
    setMessage("");
    try {
      await deleteProject(auth.accessToken, project.id);
      router.push("/projects");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to delete project.");
    } finally {
      setSaving(false);
    }
  }

  async function createProjectTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreateTasks) {
      setMessage("Your project role cannot create tasks.");
      return;
    }
    const form = event.currentTarget;
    const fd = new FormData(form);
    const dueDate = String(fd.get("dueDate") || "");
    setSaving(true);
    setMessage("");
    try {
      const task = await createTask(auth.accessToken, {
        projectId,
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        type: fd.get("type") as TaskType,
        status: fd.get("status") as TaskStatus,
        priority: fd.get("priority") as TaskPriority,
        dueDate: dueDate ? toNoonIso(dueDate) : undefined,
        storyPoints: Number(fd.get("storyPoints") || 0) || undefined,
      });
      setTasks((current) => [task, ...current]);
      setShowTaskComposer(false);
      form.reset();
      setMessage("Task created.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to create task.");
    } finally {
      setSaving(false);
    }
  }

  async function quickUpdateTask(taskId: string, payload: Parameters<typeof updateTask>[2]) {
    if (!canEditTasks) {
      setMessage("Your project role cannot edit tasks.");
      return;
    }
    setMessage("");
    try {
      const updated = await updateTask(auth.accessToken, taskId, payload);
      setTasks((current) => current.map((t) => (t.id === taskId ? updated : t)));
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update task.");
    }
  }

  function applySavedView(view: TaskSavedView) {
    const savedFilters = normalizeSavedWorkFilters(view.filters);
    setWorkFilters({
      ...defaultWorkFilters,
      ...savedFilters,
      sortBy: (view.sortBy as WorkFilters["sortBy"]) || savedFilters.sortBy || defaultWorkFilters.sortBy,
      sortDirection: view.sortDirection || savedFilters.sortDirection || defaultWorkFilters.sortDirection,
    });
    setMessage(`Saved view applied: ${view.name}`);
  }

  async function saveCurrentView(name: string, visibility: Visibility) {
    const viewName = name.trim();
    if (!viewName) {
      setMessage("Saved view name is required.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const view = await createTaskSavedView(auth.accessToken, {
        projectId,
        name: viewName,
        visibility,
        filters: workFilters,
        columns: { mode: workViewMode },
        sortBy: workFilters.sortBy,
        sortDirection: workFilters.sortDirection,
      });
      setSavedViews((current) => [view, ...current]);
      setMessage("Task view saved.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to save task view.");
    } finally {
      setSaving(false);
    }
  }

  function toggleTaskSelection(taskId: string) {
    setSelectedTaskIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  }

  function toggleAllVisibleTasks() {
    const visibleIds = sortedTasks.map((task) => task.id);
    const everyVisibleSelected = visibleIds.length > 0 && visibleIds.every((taskId) => selectedTaskIds.includes(taskId));
    setSelectedTaskIds(everyVisibleSelected ? [] : visibleIds);
  }

  async function runBulkTaskOperation(
    operation: "ARCHIVE" | "RESTORE" | "DELETE",
  ) {
    if (!canEditTasks && operation === "RESTORE") {
      setMessage("Your project role cannot restore tasks.");
      return;
    }
    if (!projectActions?.deleteTasks && operation !== "RESTORE") {
      setMessage("Your project role cannot archive or delete tasks.");
      return;
    }
    if (selectedTaskIds.length === 0) return;

    const confirmed = await confirm({
      title: `${titleCase(operation)} selected tasks?`,
      description:
        operation === "DELETE"
          ? "Selected tasks will be soft-deleted and hidden from active views. They can be restored where permissions allow."
          : "This will update every selected task in this project view.",
      confirmLabel: titleCase(operation),
      tone: operation === "DELETE" ? "danger" : "warning",
    });
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    try {
      await bulkTaskOperation(auth.accessToken, { operation, taskIds: selectedTaskIds });
      setSelectedTaskIds([]);
      await reloadWithMessage(`${selectedTaskIds.length} task${selectedTaskIds.length === 1 ? "" : "s"} updated.`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update selected tasks.");
    } finally {
      setSaving(false);
    }
  }

  async function bulkUpdateTaskField(payload: Partial<Pick<Task, "status" | "priority" | "type">>) {
    if (!canEditTasks || selectedTaskIds.length === 0) return;
    setSaving(true);
    setMessage("");
    try {
      await bulkTaskOperation(auth.accessToken, {
        operation: "UPDATE",
        taskIds: selectedTaskIds,
        ...payload,
      });
      await reloadWithMessage(`${selectedTaskIds.length} selected task${selectedTaskIds.length === 1 ? "" : "s"} updated.`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to bulk update tasks.");
    } finally {
      setSaving(false);
    }
  }

  async function createTaskCustomField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEditTasks) {
      setMessage("Your project role cannot manage task fields.");
      return;
    }
    const form = event.currentTarget;
    const fd = new FormData(form);
    setSaving(true);
    setMessage("");
    try {
      const field = await createCustomField(auth.accessToken, {
        projectId,
        entityType: "TASK",
        name: String(fd.get("name") || ""),
        type: fd.get("type") as CustomFieldType,
        required: fd.get("required") === "on",
      });
      setCustomFields((current) => [...current, field].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      form.reset();
      setMessage("Task field created.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to create task field.");
    } finally {
      setSaving(false);
    }
  }

  async function createMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectActions?.manageMilestones) {
      setMessage("Your project role cannot manage milestones.");
      return;
    }
    const form = event.currentTarget;
    const fd = new FormData(form);
    const dueDate = String(fd.get("dueDate") || "");
    setSaving(true);
    setMessage("");
    try {
      const milestone = await createProjectMilestone(auth.accessToken, projectId, {
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        dueDate: dueDate ? toNoonIso(dueDate) : undefined,
      });
      setMilestones((current) => [...current, milestone].sort(compareMilestones));
      form.reset();
      setMessage("Milestone created.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to create milestone.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleMilestone(milestone: ProjectMilestone) {
    if (!projectActions?.manageMilestones) {
      setMessage("Your project role cannot manage milestones.");
      return;
    }
    try {
      const updated = await updateProjectMilestone(auth.accessToken, projectId, milestone.id, {
        completedAt: milestone.completedAt ? null : new Date().toISOString(),
      });
      setMilestones((current) => current.map((m) => (m.id === milestone.id ? updated : m)));
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update milestone.");
    }
  }

  async function updateMilestoneDetails(milestoneId: string, payload: Parameters<typeof updateProjectMilestone>[3]) {
    if (!projectActions?.manageMilestones) {
      setMessage("Your project role cannot manage milestones.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateProjectMilestone(auth.accessToken, projectId, milestoneId, payload);
      setMilestones((current) => current.map((m) => (m.id === milestoneId ? updated : m)).sort(compareMilestones));
      setMessage("Milestone corrected.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to correct milestone.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMilestone(milestone: ProjectMilestone) {
    if (!projectActions?.manageMilestones) {
      setMessage("Your project role cannot manage milestones.");
      return;
    }
    const confirmed = await confirm({
      title: "Delete milestone?",
      description: `Remove "${milestone.title}" from this project timeline. This action is audited.`,
      confirmLabel: "Delete milestone",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true);
    setMessage("");
    try {
      await deleteProjectMilestone(auth.accessToken, projectId, milestone.id);
      setMilestones((current) => current.filter((m) => m.id !== milestone.id));
      setMessage("Milestone deleted.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to delete milestone.");
    } finally {
      setSaving(false);
    }
  }

  async function createRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectActions?.manageRisks) {
      setMessage("Your project role cannot manage risks.");
      return;
    }
    const form = event.currentTarget;
    const fd = new FormData(form);
    setSaving(true);
    setMessage("");
    try {
      const risk = await createProjectRisk(auth.accessToken, projectId, {
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        severity: fd.get("severity") as TaskPriority,
        mitigation: String(fd.get("mitigation") || ""),
        isOpen: true,
      });
      setRisks((current) => [risk, ...current]);
      form.reset();
      setMessage("Risk created.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to create risk.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRisk(risk: ProjectRisk) {
    if (!projectActions?.manageRisks) {
      setMessage("Your project role cannot manage risks.");
      return;
    }
    try {
      const updated = await updateProjectRisk(auth.accessToken, projectId, risk.id, {
        isOpen: !risk.isOpen,
      });
      setRisks((current) => current.map((r) => (r.id === risk.id ? updated : r)));
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update risk.");
    }
  }

  async function createStakeholder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageGovernance) {
      setMessage("Your project role cannot manage stakeholders.");
      return;
    }
    const form = event.currentTarget;
    const fd = new FormData(form);
    setSaving(true);
    setMessage("");
    try {
      const stakeholder = await createProjectStakeholder(auth.accessToken, projectId, {
        name: String(fd.get("name") || ""),
        email: optionalString(fd, "email"),
        organization: optionalString(fd, "organization"),
        role: optionalString(fd, "role"),
        influence: fd.get("influence") as ProjectStakeholderInfluence,
        isExternal: fd.get("isExternal") === "on",
        notes: optionalString(fd, "notes"),
      });
      setStakeholders((current) => [stakeholder, ...current]);
      form.reset();
      setMessage("Stakeholder added.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to add stakeholder.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStakeholder(stakeholderId: string, payload: Parameters<typeof updateProjectStakeholder>[3]) {
    if (!canManageGovernance) {
      setMessage("Your project role cannot manage stakeholders.");
      return;
    }
    try {
      const stakeholder = await updateProjectStakeholder(auth.accessToken, projectId, stakeholderId, payload);
      setStakeholders((current) => current.map((item) => (item.id === stakeholderId ? stakeholder : item)));
      setMessage("Stakeholder updated.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update stakeholder.");
    }
  }

  async function removeStakeholder(stakeholder: ProjectStakeholder) {
    if (!canManageGovernance) return;
    const confirmed = await confirm({
      title: "Remove stakeholder?",
      description: `${stakeholder.name} will be removed from this project stakeholder register.`,
      confirmLabel: "Remove stakeholder",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true);
    setMessage("");
    try {
      await deleteProjectStakeholder(auth.accessToken, projectId, stakeholder.id);
      setStakeholders((current) => current.filter((item) => item.id !== stakeholder.id));
      setMessage("Stakeholder removed.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to remove stakeholder.");
    } finally {
      setSaving(false);
    }
  }

  async function createDependency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageGovernance) {
      setMessage("Your project role cannot manage dependencies.");
      return;
    }
    const form = event.currentTarget;
    const fd = new FormData(form);
    const dueDate = String(fd.get("dueDate") || "");
    setSaving(true);
    setMessage("");
    try {
      const dependency = await createProjectDependency(auth.accessToken, projectId, {
        title: String(fd.get("title") || ""),
        dependencyType: optionalString(fd, "dependencyType"),
        ownerName: optionalString(fd, "ownerName"),
        ownerEmail: optionalString(fd, "ownerEmail"),
        dueDate: dueDate ? toNoonIso(dueDate) : undefined,
        externalUrl: optionalString(fd, "externalUrl"),
        status: fd.get("status") as ProjectDependencyStatus,
        notes: optionalString(fd, "notes"),
      });
      setDependencies((current) => [dependency, ...current]);
      form.reset();
      setMessage("Dependency added.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to add dependency.");
    } finally {
      setSaving(false);
    }
  }

  async function updateDependency(dependencyId: string, payload: Parameters<typeof updateProjectDependency>[3]) {
    if (!canManageGovernance) {
      setMessage("Your project role cannot manage dependencies.");
      return;
    }
    try {
      const dependency = await updateProjectDependency(auth.accessToken, projectId, dependencyId, payload);
      setDependencies((current) => current.map((item) => (item.id === dependencyId ? dependency : item)));
      setMessage("Dependency updated.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update dependency.");
    }
  }

  async function removeDependency(dependency: ProjectDependency) {
    if (!canManageGovernance) return;
    const confirmed = await confirm({
      title: "Delete dependency?",
      description: `"${dependency.title}" will be removed from this project dependency tracker.`,
      confirmLabel: "Delete dependency",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true);
    setMessage("");
    try {
      await deleteProjectDependency(auth.accessToken, projectId, dependency.id);
      setDependencies((current) => current.filter((item) => item.id !== dependency.id));
      setMessage("Dependency deleted.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to delete dependency.");
    } finally {
      setSaving(false);
    }
  }

  async function createDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageGovernance) {
      setMessage("Your project role cannot manage decisions.");
      return;
    }
    const form = event.currentTarget;
    const fd = new FormData(form);
    const decidedAt = String(fd.get("decidedAt") || "");
    setSaving(true);
    setMessage("");
    try {
      const decision = await createProjectDecision(auth.accessToken, projectId, {
        title: String(fd.get("title") || ""),
        status: fd.get("status") as ProjectDecisionStatus,
        ownerName: optionalString(fd, "ownerName"),
        decidedAt: decidedAt ? toNoonIso(decidedAt) : undefined,
        outcome: optionalString(fd, "outcome"),
        notes: optionalString(fd, "notes"),
      });
      setDecisions((current) => [decision, ...current]);
      form.reset();
      setMessage("Decision recorded.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to record decision.");
    } finally {
      setSaving(false);
    }
  }

  async function updateDecision(decisionId: string, payload: Parameters<typeof updateProjectDecision>[3]) {
    if (!canManageGovernance) {
      setMessage("Your project role cannot manage decisions.");
      return;
    }
    try {
      const decision = await updateProjectDecision(auth.accessToken, projectId, decisionId, payload);
      setDecisions((current) => current.map((item) => (item.id === decisionId ? decision : item)));
      setMessage("Decision updated.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update decision.");
    }
  }

  async function removeDecision(decision: ProjectDecision) {
    if (!canManageGovernance) return;
    const confirmed = await confirm({
      title: "Delete decision?",
      description: `"${decision.title}" will be removed from the project decision log.`,
      confirmLabel: "Delete decision",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true);
    setMessage("");
    try {
      await deleteProjectDecision(auth.accessToken, projectId, decision.id);
      setDecisions((current) => current.filter((item) => item.id !== decision.id));
      setMessage("Decision deleted.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to delete decision.");
    } finally {
      setSaving(false);
    }
  }

  async function createChangeRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageGovernance) {
      setMessage("Your project role cannot manage change requests.");
      return;
    }
    const form = event.currentTarget;
    const fd = new FormData(form);
    const dueDate = String(fd.get("dueDate") || "");
    const budgetImpact = optionalNumber(fd, "budgetImpact");
    const scheduleImpactDays = optionalNumber(fd, "scheduleImpactDays");
    setSaving(true);
    setMessage("");
    try {
      const changeRequest = await createProjectChangeRequest(auth.accessToken, projectId, {
        title: String(fd.get("title") || ""),
        status: fd.get("status") as ProjectChangeRequestStatus,
        requestedByName: optionalString(fd, "requestedByName"),
        dueDate: dueDate ? toNoonIso(dueDate) : undefined,
        budgetImpact,
        scheduleImpactDays,
        reason: optionalString(fd, "reason"),
        scopeImpact: optionalString(fd, "scopeImpact"),
        riskImpact: optionalString(fd, "riskImpact"),
      });
      setChangeRequests((current) => [changeRequest, ...current]);
      form.reset();
      setMessage("Change request created.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to create change request.");
    } finally {
      setSaving(false);
    }
  }

  async function updateChangeRequest(changeRequestId: string, payload: Parameters<typeof updateProjectChangeRequest>[3]) {
    if (!canManageGovernance) {
      setMessage("Your project role cannot manage change requests.");
      return;
    }
    try {
      const changeRequest = await updateProjectChangeRequest(auth.accessToken, projectId, changeRequestId, payload);
      setChangeRequests((current) => current.map((item) => (item.id === changeRequestId ? changeRequest : item)));
      setMessage("Change request updated.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update change request.");
    }
  }

  async function removeChangeRequest(changeRequest: ProjectChangeRequest) {
    if (!canManageGovernance) return;
    const confirmed = await confirm({
      title: "Delete change request?",
      description: `"${changeRequest.title}" will be removed from change control.`,
      confirmLabel: "Delete change request",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true);
    setMessage("");
    try {
      await deleteProjectChangeRequest(auth.accessToken, projectId, changeRequest.id);
      setChangeRequests((current) => current.filter((item) => item.id !== changeRequest.id));
      setMessage("Change request deleted.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to delete change request.");
    } finally {
      setSaving(false);
    }
  }

  async function createBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageBudget) {
      setMessage("Your project role cannot manage budget.");
      return;
    }
    const form = event.currentTarget;
    const fd = new FormData(form);
    setSaving(true);
    setMessage("");
    try {
      const budget = await createProjectBudget(auth.accessToken, projectId, {
        currency: String(fd.get("currency") || "USD").toUpperCase(),
        planned: Number(fd.get("planned") || 0),
        actual: Number(fd.get("actual") || 0),
        notes: String(fd.get("notes") || ""),
      });
      setBudgets((current) => [budget, ...current]);
      form.reset();
      setMessage("Budget line created.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to create budget line.");
    } finally {
      setSaving(false);
    }
  }

  async function updateBudgetLine(budgetId: string, payload: Parameters<typeof updateProjectBudget>[3]) {
    if (!canManageBudget) {
      setMessage("Your project role cannot manage budget.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const budget = await updateProjectBudget(auth.accessToken, projectId, budgetId, payload);
      setBudgets((current) => current.map((item) => (item.id === budgetId ? budget : item)));
      setMessage("Budget line corrected.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to correct budget line.");
    } finally {
      setSaving(false);
    }
  }

  async function removeBudgetLine(budget: ProjectBudget) {
    if (!canManageBudget) {
      setMessage("Your project role cannot manage budget.");
      return;
    }
    const confirmed = await confirm({
      title: "Delete budget line?",
      description: `Remove the ${budget.currency || currency} budget line from this project. This action is audited.`,
      confirmLabel: "Delete budget line",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true);
    setMessage("");
    try {
      await deleteProjectBudget(auth.accessToken, projectId, budget.id);
      setBudgets((current) => current.filter((item) => item.id !== budget.id));
      setMessage("Budget line deleted.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to delete budget line.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProjectMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !projectActions?.manageMembers) {
      setMessage("Your project role cannot manage members.");
      return;
    }
    const form = event.currentTarget;
    const fd = new FormData(form);
    const userId = String(fd.get("userId") || "");
    const role = String(fd.get("role") || "Contributor");
    if (!userId) return;
    setSaving(true);
    setMessage("");
    try {
      await upsertProjectMember(auth.accessToken, project.id, { userId, role });
      form.reset();
      await reloadWithMessage("Project access updated.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update project access.");
    } finally {
      setSaving(false);
    }
  }

  async function removeProjectMemberAccess(member: ProjectMember) {
    if (!project || !projectActions?.manageMembers) {
      setMessage("Your project role cannot manage members.");
      return;
    }
    const confirmed = await confirm({
      title: "Remove project access?",
      description: `${displayUserName(member.user)} will lose direct project membership. Team or global roles may still grant access.`,
      confirmLabel: "Remove access",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true);
    setMessage("");
    try {
      await removeProjectMember(auth.accessToken, project.id, member.user.id);
      await reloadWithMessage("Project member removed.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to remove project member.");
    } finally {
      setSaving(false);
    }
  }

  // Full-page task detail when ?task= is in the URL
  if (requestedTaskId) {
    return (
      <TaskDetailPage
        taskId={requestedTaskId}
        projectId={projectId}
        token={auth.accessToken}
      />
    );
  }

  if (loading) return <PageLoading />;

  if (error || !project) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8">
        <h1 className="text-lg font-bold text-red-700">Project unavailable</h1>
        <p className="mt-2 text-sm text-red-600">{error || "Project was not found."}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-6 rounded-xl border border-line bg-panel px-4 py-2 text-sm font-semibold text-foreground hover:bg-panel-muted"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      {/* ── Hero ── */}
      <section className="relative z-30 overflow-visible rounded-2xl bg-[#111111] text-white shadow-[0_24px_80px_rgba(17,17,17,0.18)]">
        {/* Top accent line */}
        <div className="h-[3px] rounded-t-2xl bg-gradient-to-r from-primary via-primary/50 to-transparent" />

        {/* Slim breadcrumb / meta bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-2">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/40 transition hover:text-white/80"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Projects
          </Link>
          <div className="flex items-center gap-3 text-[11px] text-white/35">
            {project.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" aria-hidden="true" />
                Due {formatShortDate(project.dueDate)}
              </span>
            )}
            {project.workspace?.name && (
              <span className="hidden sm:block">{project.workspace.name}</span>
            )}
            {project.team?.name && (
              <span className="hidden md:block">{project.team.name}</span>
            )}
            {project.clientName && (
              <span className="hidden lg:flex items-center gap-1">
                <Building2 className="size-3" aria-hidden="true" />
                {project.clientName}
              </span>
            )}
            {projectLocationLabel(project) && (
              <span className="hidden xl:flex items-center gap-1">
                <MapPinIcon className="size-3" aria-hidden="true" />
                {projectLocationLabel(project)}
              </span>
            )}
          </div>
        </div>

        {/* Main content row */}
        <div className="flex items-center gap-4 px-5 py-4 xl:gap-6">
          {/* Identity + title */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-black text-[#111111]">
                {project.key}
              </span>
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{
                  background: `${statusAccentColor[project.status]}22`,
                  color: statusAccentColor[project.status],
                }}
              >
                {projectStatusLabels[project.status]}
              </span>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-bold",
                  health === "On track" && "bg-emerald-500/20 text-emerald-400",
                  health === "At risk" && "bg-red-500/20 text-red-400",
                  health === "Complete" && "bg-violet-500/20 text-violet-400",
                  health === "Needs review" && "bg-amber-500/20 text-amber-400",
                )}
              >
                {health}
              </span>
            </div>
            <h1 className="truncate text-xl font-black leading-snug tracking-tight xl:text-2xl">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 line-clamp-1 max-w-2xl text-xs leading-relaxed text-white/45">
                {project.description}
              </p>
            )}
          </div>

          {/* Inline KPI strip */}
          <div className="hidden shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] lg:flex">
            <InlineKPI
              label="Open tasks"
              value={openTasks.length}
              sub={`${tasks.length} total`}
              color="#ffd400"
            />
            <InlineKPI
              label="Progress"
              value={`${project.progress}%`}
              sub={`${completedTasks.length} done`}
              color="#10b981"
            />
            <InlineKPI
              label="Active risks"
              value={activeRisks.length}
              sub={`${riskTasks.length} flagged`}
              color="#f59e0b"
            />
            {canViewBudget ? (
              <InlineKPI
                label="Budget spent"
                value={formatMoney(actualBudget, currency)}
                sub={`of ${formatMoney(financeCeiling, currency)}`}
                color="#8b5cf6"
              />
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void loadProject()}
              disabled={saving}
              aria-label="Refresh"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw className={cn("size-4", saving && "animate-spin")} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setShowEditProject(true)}
              disabled={!canEditProject}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-[#111111] transition hover:bg-primary-dark"
              title={canEditProject ? "Edit project" : "Your project role cannot edit settings"}
            >
              <Edit3 className="size-3.5" aria-hidden="true" />
              Edit
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionMenu((v) => !v)}
                aria-label="More actions"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
              >
                <MoreVertical className="size-4" aria-hidden="true" />
              </button>
              {showActionMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-panel text-foreground shadow-[0_24px_70px_rgba(17,17,17,0.24)]">
                    <button
                      type="button"
                      onClick={() => {
                        void setProjectStatus("ACTIVE", "Project activated.");
                        setShowActionMenu(false);
                      }}
                      disabled={saving || project.status === "ACTIVE" || !canEditProject}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-panel-muted disabled:opacity-40"
                    >
                      <PlayCircle className="size-4 text-emerald-500" aria-hidden="true" />
                      Set active
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void setProjectStatus("ON_HOLD", "Project put on hold.");
                        setShowActionMenu(false);
                      }}
                      disabled={saving || project.status === "ON_HOLD" || !canEditProject}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-panel-muted disabled:opacity-40"
                    >
                      <PauseCircle className="size-4 text-amber-500" aria-hidden="true" />
                      Put on hold
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void completeProject();
                        setShowActionMenu(false);
                      }}
                      disabled={saving || project.status === "COMPLETED" || !canEditProject}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-panel-muted disabled:opacity-40"
                    >
                      <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" />
                      Mark complete
                    </button>
                    {project.status === "ARCHIVED" ? (
                      <button
                        type="button"
                        onClick={() => {
                          void restoreProject();
                          setShowActionMenu(false);
                        }}
                        disabled={saving || !canRestoreProject}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-panel-muted disabled:opacity-40"
                      >
                        <RotateCcw className="size-4 text-blue-500" aria-hidden="true" />
                        Restore project
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          void archiveProject();
                          setShowActionMenu(false);
                        }}
                        disabled={saving || !canArchiveProject}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-panel-muted disabled:opacity-40"
                      >
                        <Archive className="size-4 text-amber-500" aria-hidden="true" />
                        Archive project
                      </button>
                    )}
                    <div className="mx-4 my-1 border-t border-line" />
                    <button
                      type="button"
                      onClick={() => {
                        void removeProject();
                        setShowActionMenu(false);
                      }}
                      disabled={saving || !canDeleteProject}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete project
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress footer strip */}
        <div className="h-[2px] bg-white/[0.06]">
          <div
            className="h-full bg-primary/70 transition-all duration-700"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </section>

      {/* ── Tab bar ── */}
      <FoundationTabs
        active={visibleActiveTab}
        onChange={setActiveTab}
        items={visibleTabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: tab.Icon,
          count:
            tab.id === "work"
              ? tasks.length
              : tab.id === "planning"
                ? milestones.length + risks.length + stakeholders.length + dependencies.length + decisions.length + changeRequests.length
              : tab.id === "finance"
                  ? budgets.length + members.length
                : tab.id === "access"
                  ? members.length
                  : tab.id === "activity"
                    ? undefined
                  : undefined,
        }))}
      />

      {visibleActiveTab === "overview" && (
        <OverviewTab
          canViewBudget={canViewBudget}
          milestones={activeMilestones}
          project={project}
          risks={activeRisks}
          tasks={tasks}
          onGoPlanning={() => setActiveTab("planning")}
          onGoWork={() => setActiveTab("work")}
          onOpenTask={setSelectedTaskId}
        />
      )}

      {visibleActiveTab === "work" && (
        <WorkTab
          canCreateTasks={canCreateTasks}
          canEditTasks={canEditTasks}
          canDeleteTasks={Boolean(projectActions?.deleteTasks)}
          customFields={customFields}
          filters={workFilters}
          members={members}
          onApplySavedView={applySavedView}
          onBulkFieldUpdate={bulkUpdateTaskField}
          onBulkOperation={runBulkTaskOperation}
          onClearSelection={() => setSelectedTaskIds([])}
          onCreateCustomField={createTaskCustomField}
          saving={saving}
          savedViews={savedViews}
          selectedTaskIds={selectedTaskIds}
          showComposer={showTaskComposer}
          sortedTasks={sortedTasks}
          tasks={tasks}
          taxonomy={taxonomy}
          viewMode={workViewMode}
          onFiltersChange={setWorkFilters}
          onRefresh={() => void loadProject()}
          onResetFilters={() => setWorkFilters(defaultWorkFilters)}
          onCreateTask={createProjectTask}
          onOpenTask={setSelectedTaskId}
          onQuickUpdate={quickUpdateTask}
          onSaveView={saveCurrentView}
          onToggleAllTasks={toggleAllVisibleTasks}
          onToggleComposer={() => setShowTaskComposer((v) => !v)}
          onToggleTaskSelection={toggleTaskSelection}
          onViewModeChange={setWorkViewMode}
        />
      )}

      {visibleActiveTab === "planning" && (
        <PlanningTab
          canManageGovernance={canManageGovernance}
          canManageMilestones={Boolean(projectActions?.manageMilestones)}
          canManageRisks={Boolean(projectActions?.manageRisks)}
          changeRequests={changeRequests}
          decisions={decisions}
          dependencies={dependencies}
          milestones={milestones}
          openChangeRequests={openChangeRequests.length}
          openDependencies={openDependencies.length}
          risks={risks}
          saving={saving}
          stakeholders={stakeholders}
          onCreateChangeRequest={createChangeRequest}
          onCreateDecision={createDecision}
          onCreateDependency={createDependency}
          onCreateMilestone={createMilestone}
          onCreateRisk={createRisk}
          onCreateStakeholder={createStakeholder}
          onDeleteChangeRequest={removeChangeRequest}
          onDeleteDecision={removeDecision}
          onDeleteDependency={removeDependency}
          onDeleteMilestone={removeMilestone}
          onDeleteStakeholder={removeStakeholder}
          onUpdateChangeRequest={updateChangeRequest}
          onUpdateDecision={updateDecision}
          onUpdateDependency={updateDependency}
          onUpdateMilestone={updateMilestoneDetails}
          onUpdateStakeholder={updateStakeholder}
          onToggleMilestone={toggleMilestone}
          onToggleRisk={toggleRisk}
        />
      )}

      {visibleActiveTab === "files" && (
        <FileAssetManager
          token={auth.accessToken}
          entityType="PROJECT"
          entityId={project.id}
          scope="PROJECT"
          title="Project files and delivery evidence"
          canManage={canManageFiles}
          onChanged={() => void loadProject()}
        />
      )}

      {visibleActiveTab === "finance" && canViewBudget && (
        <FinanceTeamTab
          actualBudget={actualBudget}
          budgets={budgets}
          canManageBudget={canManageBudget}
          canArchiveProject={canArchiveProject}
          canDeleteProject={canDeleteProject}
          canRestoreProject={canRestoreProject}
          currency={currency}
          members={members}
          plannedBudget={plannedBudget}
          project={project}
          saving={saving}
          onArchive={archiveProject}
          onCreateBudget={createBudget}
          onDeleteBudget={removeBudgetLine}
          onDelete={removeProject}
          onUpdateBudget={updateBudgetLine}
          onSetStatus={setProjectStatus}
          onRestore={restoreProject}
        />
      )}

      {visibleActiveTab === "access" && (
        <AccessTab
          members={members}
          permissions={projectPermissions}
          saving={saving}
          tenantUsers={tenantUsers}
          onRemoveMember={removeProjectMemberAccess}
          onSaveMember={saveProjectMember}
        />
      )}

      {visibleActiveTab === "activity" && (
        <ProjectActivityTab
          projectId={project.id}
          token={auth.accessToken}
        />
      )}

      {showEditProject && (
        <EditProjectDialog
          canManageBudget={canManageBudget}
          project={project}
          saving={saving}
          onClose={() => setShowEditProject(false)}
          onSubmit={saveProject}
        />
      )}

      {selectedTaskId && (
        <div className="fixed inset-0 z-50 bg-[#111111]/45 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="absolute inset-y-0 right-0 w-full max-w-5xl overflow-hidden border-l border-line bg-background shadow-[0_24px_80px_rgba(17,17,17,0.26)]">
            <TaskLifecycleView
              mode="drawer"
              taskId={selectedTaskId}
              projectId={projectId}
              token={auth.accessToken}
              onClose={() => setSelectedTaskId(null)}
              onDeleted={(taskId) => {
                setTasks((current) => current.filter((t) => t.id !== taskId));
                setSelectedTaskId(null);
              }}
              onUpdated={(task) => {
                setTasks((current) => current.map((t) => (t.id === task.id ? task : t)));
                void reloadWithMessage();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overview tab ────────────────────────────────────────────────────────────

function OverviewTab({
  canViewBudget,
  milestones,
  onGoPlanning,
  onGoWork,
  onOpenTask,
  project,
  risks,
  tasks,
}: {
  canViewBudget: boolean;
  milestones: ProjectMilestone[];
  onGoPlanning: () => void;
  onGoWork: () => void;
  onOpenTask: (id: string) => void;
  project: Project;
  risks: ProjectRisk[];
  tasks: Task[];
}) {
  const attentionTasks = sortTasks(tasks.filter(isOpenTask)).slice(0, 6);
  const health = getProjectHealth(project);
  const profileFacts = [
    ...(canViewBudget
      ? [
          { label: "Client", value: project.clientName || "Not assigned" },
          { label: "Currency", value: project.currency || "USD" },
          {
            label: "Contract",
            value: formatMoney(Number(project.contractValue ?? 0), project.currency || "USD"),
          },
        ]
      : []),
    ...(canViewBudget
      ? [
          { label: "Location", value: projectLocationLabel(project) || "No location" },
          { label: "Billing", value: project.billingCode || "No billing code" },
          { label: "Cost center", value: project.costCenter || "No cost center" },
        ]
      : []),
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      {/* Left column */}
      <div className="grid gap-5">
        {/* About card */}
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-foreground">About this project</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {project.description || "No description yet."}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold",
                health === "On track" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                health === "At risk" && "border-red-200 bg-red-50 text-red-700",
                health === "Complete" && "border-violet-200 bg-violet-50 text-violet-700",
                health === "Needs review" && "border-amber-200 bg-amber-50 text-amber-700",
              )}
            >
              {health}
            </span>
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-soft">Overall progress</span>
              <span className="font-black text-foreground">{project.progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {profileFacts.map((fact) => (
              <div key={fact.label} className="rounded-xl border border-line bg-background px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
                  {fact.label}
                </p>
                <p className="mt-1 truncate text-sm font-bold text-foreground">{fact.value}</p>
              </div>
            ))}
          </div>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" aria-hidden="true" />
              Due {formatShortDate(project.dueDate)}
            </span>
            {project.workspace?.name && (
              <span className="flex items-center gap-1">{project.workspace.name}</span>
            )}
            {project.team?.name && <span>{project.team.name}</span>}
          </div>
        </Card>

        {/* Needs attention */}
        <Card
          title="Needs attention"
          action={
            <button
              type="button"
              onClick={onGoWork}
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft transition hover:text-foreground"
            >
              All tasks
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          }
        >
          {attentionTasks.length ? (
            <div className="divide-y divide-line">
              {attentionTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onOpenTask(task.id)}
                  className="flex w-full items-center gap-3 py-3 text-left transition hover:opacity-80 first:pt-0 last:pb-0"
                >
                  <span
                    className={cn("size-1.5 shrink-0 rounded-full", priorityDot[task.priority])}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="mr-2 text-xs font-black text-primary">{task.key}</span>
                    <span className="text-sm font-medium text-foreground line-clamp-1">
                      {task.title}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold",
                      priorityBadge[task.priority],
                    )}
                  >
                    {priorityLabels[task.priority]}
                  </span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {formatShortDate(task.dueDate)}
                  </span>
                  <ChevronRight className="size-3.5 shrink-0 text-ink-soft" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <Empty label="No open tasks need attention." />
          )}
        </Card>
      </div>

      {/* Right sidebar */}
      <div className="grid content-start gap-5">
        {/* Milestones */}
        <Card
          title="Next milestones"
          action={
            <button
              type="button"
              onClick={onGoPlanning}
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft transition hover:text-foreground"
            >
              Plan
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          }
        >
          {milestones.length ? (
            <div className="grid gap-2">
              {milestones.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 rounded-xl border border-line bg-background p-3"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{m.title}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{formatShortDate(m.dueDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty label="No active milestones." />
          )}
        </Card>

        {/* Risks */}
        <Card title="Open risks">
          {risks.length ? (
            <div className="grid gap-2">
              {risks.slice(0, 5).map((risk) => (
                <div
                  key={risk.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/60 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{risk.title}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold",
                        priorityBadge[risk.severity ?? "HIGH"],
                      )}
                    >
                      {priorityLabels[risk.severity ?? "HIGH"]}
                    </span>
                  </div>
                  {(risk.mitigation || risk.description) && (
                    <p className="mt-1.5 text-xs text-ink-soft line-clamp-2">
                      {risk.mitigation || risk.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty label="No open risks." />
          )}
        </Card>

        {/* Project facts */}
        <Card title="Project facts">
          <InfoRow label="Workspace" value={project.workspace?.name ?? "—"} />
          <InfoRow label="Team" value={project.team?.name ?? "Unassigned"} />
          {canViewBudget ? <InfoRow label="Client" value={project.clientName ?? "Not assigned"} /> : null}
          {canViewBudget ? <InfoRow label="Location" value={projectLocationLabel(project) || "Not set"} /> : null}
          {canViewBudget ? <InfoRow label="Address" value={projectAddressLabel(project) || "Not set"} /> : null}
          {canViewBudget ? <InfoRow label="Currency" value={project.currency ?? "USD"} /> : null}
          {canViewBudget ? (
            <InfoRow label="Contract" value={formatMoney(Number(project.contractValue ?? 0), project.currency || "USD")} />
          ) : null}
          <InfoRow label="Due" value={formatShortDate(project.dueDate)} />
          <InfoRow label="Status" value={projectStatusLabels[project.status]} />
        </Card>
      </div>
    </div>
  );
}

// ─── Work / Tasks tab ─────────────────────────────────────────────────────────

function WorkTab({
  canCreateTasks,
  canDeleteTasks,
  canEditTasks,
  customFields,
  filters,
  members,
  onApplySavedView,
  onBulkFieldUpdate,
  onBulkOperation,
  onClearSelection,
  onCreateCustomField,
  onCreateTask,
  onFiltersChange,
  onOpenTask,
  onQuickUpdate,
  onRefresh,
  onResetFilters,
  onSaveView,
  onToggleAllTasks,
  onToggleComposer,
  onToggleTaskSelection,
  onViewModeChange,
  saving,
  savedViews,
  selectedTaskIds,
  showComposer,
  sortedTasks,
  tasks,
  taxonomy,
  viewMode,
}: {
  canCreateTasks: boolean;
  canDeleteTasks: boolean;
  canEditTasks: boolean;
  customFields: CustomField[];
  filters: WorkFilters;
  members: ProjectMember[];
  onApplySavedView: (view: TaskSavedView) => void;
  onBulkFieldUpdate: (payload: Partial<Pick<Task, "status" | "priority" | "type">>) => void;
  onBulkOperation: (operation: "ARCHIVE" | "RESTORE" | "DELETE") => void;
  onClearSelection: () => void;
  onCreateCustomField: (event: FormEvent<HTMLFormElement>) => void;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => void;
  onFiltersChange: (filters: WorkFilters) => void;
  onOpenTask: (id: string) => void;
  onQuickUpdate: (taskId: string, payload: Parameters<typeof updateTask>[2]) => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  onSaveView: (name: string, visibility: Visibility) => void;
  onToggleAllTasks: () => void;
  onToggleComposer: () => void;
  onToggleTaskSelection: (taskId: string) => void;
  onViewModeChange: (mode: WorkViewMode) => void;
  saving: boolean;
  savedViews: TaskSavedView[];
  selectedTaskIds: string[];
  showComposer: boolean;
  sortedTasks: Task[];
  tasks: Task[];
  taxonomy: TaskTaxonomy | null;
  viewMode: WorkViewMode;
}) {
  const selectedCount = selectedTaskIds.length;
  const allVisibleSelected =
    sortedTasks.length > 0 && sortedTasks.every((task) => selectedTaskIds.includes(task.id));
  const availableTaskTypes = taxonomy?.taskTypes?.length
    ? taxonomy.taskTypes.map((item) => item.value)
    : taskTypes;

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="size-4 text-ink-soft" aria-hidden="true" />
          <h2 className="text-base font-black text-foreground">Tasks</h2>
          <span className="rounded-full bg-[#ffd400]/20 px-2.5 py-0.5 text-xs font-black text-[#7a6300]">
            {tasks.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode pills */}
          <div className="flex items-center gap-0.5 rounded-xl border border-line bg-panel p-1">
            {(["list", "table", "backlog"] as WorkViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={cn(
                  "h-7 rounded-lg px-3 text-xs font-black transition",
                  viewMode === mode
                    ? "bg-foreground text-[#ffd400]"
                    : "text-ink-soft hover:text-foreground",
                )}
              >
                {titleCase(mode)}
              </button>
            ))}
          </div>

          <Link
            href="/board"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-2 text-xs font-semibold text-ink-soft transition hover:text-foreground"
          >
            <ExternalLink className="size-3" aria-hidden="true" />
            Board
          </Link>

          <button
            type="button"
            onClick={onToggleComposer}
            disabled={!canCreateTasks}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-[#111111] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            title={canCreateTasks ? "Create task" : "Your project role cannot create tasks"}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            New task
          </button>
        </div>
      </div>

      {/* ── Toolbar (saved views + custom fields) ── */}
      <TaskViewCommandBar
        allVisibleSelected={allVisibleSelected}
        canDeleteTasks={canDeleteTasks}
        canEditTasks={canEditTasks}
        customFields={customFields}
        onApplySavedView={onApplySavedView}
        onBulkFieldUpdate={onBulkFieldUpdate}
        onBulkOperation={onBulkOperation}
        onClearSelection={onClearSelection}
        onCreateCustomField={onCreateCustomField}
        onSaveView={onSaveView}
        onToggleAllTasks={onToggleAllTasks}
        saving={saving}
        savedViews={savedViews}
        selectedCount={selectedCount}
        taskTypes={availableTaskTypes}
      />

      {/* ── Filter strip ── */}
      <TaskFilterBar
        filters={filters}
        members={members}
        resultCount={tasks.length}
        onChange={onFiltersChange}
        onRefresh={onRefresh}
        onReset={onResetFilters}
      />

      {/* ── New task modal ── */}
      <TaskComposerModal
        open={showComposer}
        onClose={onToggleComposer}
        onSubmit={onCreateTask}
        saving={saving}
      />

      {/* ── Task list ── */}
      {sortedTasks.length ? (
        <TaskCollection
          canEditTasks={canEditTasks}
          onOpenTask={onOpenTask}
          onQuickUpdate={onQuickUpdate}
          onToggleTaskSelection={onToggleTaskSelection}
          selectedTaskIds={selectedTaskIds}
          tasks={sortedTasks}
          viewMode={viewMode}
        />
      ) : (
        <Empty label="No tasks yet. Create the first task to start delivery." icon={ClipboardList} />
      )}
    </div>
  );
}

function TaskViewCommandBar({
  allVisibleSelected,
  canDeleteTasks,
  canEditTasks,
  customFields,
  onApplySavedView,
  onBulkFieldUpdate,
  onBulkOperation,
  onClearSelection,
  onCreateCustomField,
  onSaveView,
  onToggleAllTasks,
  saving,
  savedViews,
  selectedCount,
  taskTypes,
}: {
  allVisibleSelected: boolean;
  canDeleteTasks: boolean;
  canEditTasks: boolean;
  customFields: CustomField[];
  onApplySavedView: (view: TaskSavedView) => void;
  onBulkFieldUpdate: (payload: Partial<Pick<Task, "status" | "priority" | "type">>) => void;
  onBulkOperation: (operation: "ARCHIVE" | "RESTORE" | "DELETE") => void;
  onClearSelection: () => void;
  onCreateCustomField: (event: FormEvent<HTMLFormElement>) => void;
  onSaveView: (name: string, visibility: Visibility) => void;
  onToggleAllTasks: () => void;
  saving: boolean;
  savedViews: TaskSavedView[];
  selectedCount: number;
  taskTypes: TaskType[];
}) {
  const [viewName, setViewName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");
  const [showFields, setShowFields] = useState(false);

  return (
    <div className="space-y-2">
      {/* Saved views + custom fields toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-panel px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            defaultValue=""
            onChange={(event) => {
              const view = savedViews.find((item) => item.id === event.target.value);
              if (view) onApplySavedView(view);
              event.currentTarget.value = "";
            }}
            className="h-8 rounded-xl border border-line bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
          >
            <option value="">Saved views</option>
            {savedViews.map((view) => (
              <option key={view.id} value={view.id}>{view.name}</option>
            ))}
          </select>
          <input
            value={viewName}
            onChange={(event) => setViewName(event.target.value)}
            placeholder="View name…"
            className="h-8 w-[140px] rounded-xl border border-line bg-background px-3 text-xs font-semibold text-foreground placeholder:text-ink-soft outline-none focus:border-primary"
          />
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as Visibility)}
            className="h-8 rounded-xl border border-line bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
          >
            <option value="PRIVATE">Private</option>
            <option value="WORKSPACE">Workspace</option>
            <option value="ORGANIZATION">Org</option>
          </select>
          <button
            type="button"
            disabled={saving || !viewName.trim()}
            onClick={() => { onSaveView(viewName, visibility); setViewName(""); }}
            className="h-8 rounded-xl border border-line bg-background px-3 text-xs font-black text-foreground transition hover:bg-panel-muted disabled:opacity-50"
          >
            Save view
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowFields((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition",
            showFields
              ? "bg-foreground text-[#ffd400]"
              : "border border-line bg-background text-ink-soft hover:text-foreground",
          )}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          Fields{customFields.length > 0 ? ` (${customFields.length})` : ""}
        </button>
      </div>

      {/* Custom fields panel */}
      {showFields && (
        <div className="rounded-2xl border border-line bg-background p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wider text-ink-soft">Task fields</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {customFields.length ? (
              customFields.slice(0, 8).map((field) => (
                <span key={field.id} className="rounded-lg border border-line bg-panel px-2 py-1 text-[11px] font-bold text-foreground">
                  {field.name}<span className="ml-1 text-ink-soft">{titleCase(field.type)}</span>
                </span>
              ))
            ) : (
              <span className="text-xs font-semibold text-ink-soft">No custom fields yet.</span>
            )}
          </div>
          <form onSubmit={onCreateCustomField} className="flex flex-wrap gap-2">
            <input
              name="name"
              placeholder="Field name"
              required
              disabled={!canEditTasks || saving}
              className="h-9 min-w-[150px] flex-1 rounded-xl border border-line bg-panel px-3 text-xs font-semibold text-foreground outline-none focus:border-primary"
            />
            <select
              name="type"
              defaultValue="TEXT"
              disabled={!canEditTasks || saving}
              className="h-9 rounded-xl border border-line bg-panel px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
            >
              {customFieldTypes.map((type) => (
                <option key={type} value={type}>{titleCase(type)}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!canEditTasks || saving}
              className="h-9 rounded-xl bg-primary px-4 text-xs font-black text-[#111111] transition hover:bg-primary-dark disabled:opacity-50"
            >
              Add field
            </button>
          </form>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#ffd400]/40 bg-[#ffd400]/10 px-3 py-2">
          <button
            type="button"
            onClick={onToggleAllTasks}
            className={cn(
              "h-8 rounded-xl border px-3 text-xs font-black transition",
              allVisibleSelected
                ? "border-[#ffd400] bg-[#ffd400] text-[#111111]"
                : "border-line bg-white text-ink-soft hover:text-foreground",
            )}
          >
            {allVisibleSelected ? "Deselect all" : "Select all"}
          </button>
          <span className="text-xs font-black text-foreground">{selectedCount} selected</span>
          <span className="h-4 w-px bg-[#e8e0c8]" />
          <select
            disabled={!canEditTasks || saving}
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) onBulkFieldUpdate({ status: event.target.value as TaskStatus });
              event.currentTarget.value = "";
            }}
            className="h-8 rounded-xl border border-line bg-white px-2 text-xs font-semibold text-foreground disabled:opacity-50"
          >
            <option value="">Set status</option>
            {lifecycleTaskStatuses.map((s) => (
              <option key={s} value={s}>{taskStatusLabels[s]}</option>
            ))}
          </select>
          <select
            disabled={!canEditTasks || saving}
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) onBulkFieldUpdate({ priority: event.target.value as TaskPriority });
              event.currentTarget.value = "";
            }}
            className="h-8 rounded-xl border border-line bg-white px-2 text-xs font-semibold text-foreground disabled:opacity-50"
          >
            <option value="">Set priority</option>
            {(Object.keys(priorityLabels) as TaskPriority[]).map((p) => (
              <option key={p} value={p}>{priorityLabels[p]}</option>
            ))}
          </select>
          <select
            disabled={!canEditTasks || saving}
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) onBulkFieldUpdate({ type: event.target.value as TaskType });
              event.currentTarget.value = "";
            }}
            className="h-8 rounded-xl border border-line bg-white px-2 text-xs font-semibold text-foreground disabled:opacity-50"
          >
            <option value="">Set type</option>
            {taskTypes.map((type) => (
              <option key={type} value={type}>{titleCase(type)}</option>
            ))}
          </select>
          <span className="h-4 w-px bg-[#e8e0c8]" />
          <button
            type="button"
            disabled={!canDeleteTasks || saving}
            onClick={() => onBulkOperation("ARCHIVE")}
            className="h-8 rounded-xl border border-line bg-white px-3 text-xs font-black text-foreground transition hover:bg-panel-muted disabled:opacity-50"
          >
            Archive
          </button>
          <button
            type="button"
            disabled={!canEditTasks || saving}
            onClick={() => onBulkOperation("RESTORE")}
            className="h-8 rounded-xl border border-line bg-white px-3 text-xs font-black text-foreground transition hover:bg-panel-muted disabled:opacity-50"
          >
            Restore
          </button>
          <button
            type="button"
            disabled={!canDeleteTasks || saving}
            onClick={() => onBulkOperation("DELETE")}
            className="h-8 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="ml-auto inline-flex size-8 items-center justify-center rounded-xl text-ink-soft transition hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function TaskCollection({
  canEditTasks,
  onOpenTask,
  onQuickUpdate,
  onToggleTaskSelection,
  selectedTaskIds,
  tasks,
  viewMode,
}: {
  canEditTasks: boolean;
  onOpenTask: (id: string) => void;
  onQuickUpdate: (taskId: string, payload: Parameters<typeof updateTask>[2]) => void;
  onToggleTaskSelection: (taskId: string) => void;
  selectedTaskIds: string[];
  tasks: Task[];
  viewMode: WorkViewMode;
}) {
  if (viewMode === "table") {
    return (
      <div className="overflow-x-auto rounded-2xl border border-line bg-background tb-scrollbar">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
          <thead className="bg-panel-muted text-[11px] font-black uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="w-10 px-3 py-3" />
              <th className="px-3 py-3">Task</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Priority</th>
              <th className="px-3 py-3">Assignee</th>
              <th className="px-3 py-3">Sprint</th>
              <th className="px-3 py-3 text-right">Points</th>
              <th className="px-3 py-3">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tasks.map((task) => (
              <tr key={task.id} className="transition hover:bg-panel-muted/70">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.includes(task.id)}
                    onChange={() => onToggleTaskSelection(task.id)}
                    className="size-4 rounded border-line accent-[#ffd400]"
                    aria-label={`Select ${task.key}`}
                  />
                </td>
                <td className="max-w-[320px] px-3 py-3">
                  <button type="button" onClick={() => onOpenTask(task.id)} className="text-left">
                    <span className="mr-2 text-xs font-black text-primary">{task.key}</span>
                    <span className="font-bold text-foreground hover:underline">{task.title}</span>
                    {task.archivedAt || task.deletedAt ? (
                      <span className="ml-2 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-700">
                        {task.deletedAt ? "Deleted" : "Archived"}
                      </span>
                    ) : null}
                  </button>
                </td>
                <td className="px-3 py-3 text-xs font-bold text-ink-soft">{titleCase(task.type)}</td>
                <td className="px-3 py-3">
                  {canEditTasks ? (
                    <select
                      className="h-8 rounded-lg border border-line bg-panel px-2 text-xs font-semibold text-foreground"
                      value={task.status}
                      onChange={(event) => onQuickUpdate(task.id, { status: event.target.value as TaskStatus })}
                    >
                      {lifecycleTaskStatuses.map((status) => (
                        <option key={status} value={status}>
                          {taskStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-ink-soft">{taskStatusLabels[task.status]}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className={cn("rounded-lg px-2 py-1 text-xs font-bold", priorityBadge[task.priority])}>
                    {priorityLabels[task.priority]}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs font-semibold text-ink-soft">
                  {task.assignees?.[0]?.user ? displayUserName(task.assignees[0].user) : "Unassigned"}
                </td>
                <td className="px-3 py-3 text-xs font-semibold text-ink-soft">{task.sprint?.name ?? "Backlog"}</td>
                <td className="px-3 py-3 text-right text-xs font-black text-foreground">{task.storyPoints ?? 0}</td>
                <td className="px-3 py-3 text-xs text-ink-soft">{formatShortDate(task.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (viewMode === "backlog") {
    const grouped = lifecycleTaskStatuses
      .map((status) => ({ status, tasks: tasks.filter((task) => task.status === status) }))
      .filter((group) => group.tasks.length > 0);

    return (
      <div className="space-y-3">
        {grouped.map((group) => (
          <section key={group.status} className="overflow-hidden rounded-2xl border border-line bg-panel">
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
              <span className={cn("size-2.5 shrink-0 rounded-full", statusLeftBar[group.status])} />
              <h3 className="text-sm font-black text-foreground">{taskStatusLabels[group.status]}</h3>
              <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-[11px] font-black text-ink-soft">
                {group.tasks.length}
              </span>
            </div>
            <div className="space-y-1.5 p-3">
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  selected={selectedTaskIds.includes(task.id)}
                  task={task}
                  onOpen={() => onOpenTask(task.id)}
                  onQuickUpdate={canEditTasks ? onQuickUpdate : undefined}
                  onToggleSelected={() => onToggleTaskSelection(task.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          selected={selectedTaskIds.includes(task.id)}
          task={task}
          onOpen={() => onOpenTask(task.id)}
          onQuickUpdate={canEditTasks ? onQuickUpdate : undefined}
          onToggleSelected={() => onToggleTaskSelection(task.id)}
        />
      ))}
    </div>
  );
}

function TaskFilterBar({
  filters,
  members,
  onChange,
  onRefresh,
  onReset,
  resultCount,
}: {
  filters: WorkFilters;
  members: ProjectMember[];
  onChange: (filters: WorkFilters) => void;
  onRefresh: () => void;
  onReset: () => void;
  resultCount: number;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const update = <K extends keyof WorkFilters>(key: K, value: WorkFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const activeFilters = [
    filters.search, filters.status, filters.priority, filters.type, filters.assigneeId,
    filters.dueFrom, filters.dueTo, filters.storyPointsMin, filters.storyPointsMax,
    filters.isOverdue, filters.unassigned, filters.hasAttachments, filters.hasDependencies,
    filters.isBlocked, filters.isBlocking, filters.includeArchived, filters.includeDeleted,
  ].filter(Boolean).length;

  const hasAdvanced = !!(filters.dueFrom || filters.dueTo || filters.storyPointsMin || filters.storyPointsMax ||
    filters.isOverdue || filters.unassigned || filters.isBlocked || filters.isBlocking ||
    filters.hasDependencies || filters.hasAttachments || filters.includeArchived || filters.includeDeleted);

  return (
    <div className="rounded-2xl border border-line bg-panel">
      {/* Main row */}
      <div className="flex flex-wrap items-center gap-2 p-3">
        <label className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <input
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Search tasks…"
            className="h-9 w-full rounded-xl border border-line bg-background pl-9 pr-3 text-xs font-semibold text-foreground outline-none transition focus:border-primary"
          />
        </label>
        <select
          value={filters.status}
          onChange={(event) => update("status", event.target.value as WorkFilters["status"])}
          className="h-9 rounded-xl border border-line bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
        >
          <option value="">Status</option>
          {lifecycleTaskStatuses.map((s) => <option key={s} value={s}>{taskStatusLabels[s]}</option>)}
        </select>
        <select
          value={filters.priority}
          onChange={(event) => update("priority", event.target.value as WorkFilters["priority"])}
          className="h-9 rounded-xl border border-line bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
        >
          <option value="">Priority</option>
          {(Object.keys(priorityLabels) as TaskPriority[]).map((p) => <option key={p} value={p}>{priorityLabels[p]}</option>)}
        </select>
        <select
          value={filters.type}
          onChange={(event) => update("type", event.target.value as WorkFilters["type"])}
          className="h-9 rounded-xl border border-line bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
        >
          <option value="">Type</option>
          {taskTypes.map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}
        </select>
        <select
          value={filters.assigneeId}
          onChange={(event) => update("assigneeId", event.target.value)}
          className="h-9 rounded-xl border border-line bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
        >
          <option value="">Assignee</option>
          {members.map((m) => <option key={m.user.id} value={m.user.id}>{displayUserName(m.user)}</option>)}
        </select>
        <select
          value={`${filters.sortBy}:${filters.sortDirection}`}
          onChange={(event) => {
            const [sortBy, sortDirection] = event.target.value.split(":") as [WorkFilters["sortBy"], WorkFilters["sortDirection"]];
            onChange({ ...filters, sortBy, sortDirection });
          }}
          className="h-9 rounded-xl border border-line bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
        >
          <option value="updatedAt:desc">Recent</option>
          <option value="dueDate:asc">Due soon</option>
          <option value="priority:desc">Priority</option>
          <option value="storyPoints:desc">Points</option>
          <option value="sprintName:asc">Sprint</option>
          <option value="title:asc">A–Z</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-xl bg-background px-2.5 py-1.5 text-[11px] font-black text-ink-soft">
            {resultCount}{activeFilters > 0 ? ` · ${activeFilters} filters` : ""}
          </span>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-black transition",
              showAdvanced || hasAdvanced
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-line bg-background text-ink-soft hover:text-foreground",
            )}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            {hasAdvanced ? `+${activeFilters}` : "More"}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-line bg-background text-ink-soft transition hover:text-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
          </button>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="h-9 rounded-xl border border-line bg-background px-3 text-xs font-black text-ink-soft transition hover:text-foreground"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="border-t border-line p-3 space-y-3">
          <div className="flex flex-wrap gap-3">
            <Field label="Due from">
              <Input type="date" value={filters.dueFrom} onChange={(e) => update("dueFrom", e.target.value)} />
            </Field>
            <Field label="Due to">
              <Input type="date" value={filters.dueTo} onChange={(e) => update("dueTo", e.target.value)} />
            </Field>
            <Field label="Min pts">
              <Input min={0} type="number" value={filters.storyPointsMin} onChange={(e) => update("storyPointsMin", e.target.value)} />
            </Field>
            <Field label="Max pts">
              <Input min={0} type="number" value={filters.storyPointsMax} onChange={(e) => update("storyPointsMax", e.target.value)} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterToggle label="Overdue" active={filters.isOverdue} onClick={() => update("isOverdue", !filters.isOverdue)} />
            <FilterToggle label="Unassigned" active={filters.unassigned} onClick={() => update("unassigned", !filters.unassigned)} />
            <FilterToggle label="Blocked" active={filters.isBlocked} onClick={() => update("isBlocked", !filters.isBlocked)} />
            <FilterToggle label="Blocking" active={filters.isBlocking} onClick={() => update("isBlocking", !filters.isBlocking)} />
            <FilterToggle label="Has links" active={filters.hasDependencies || filters.hasAttachments} onClick={() => {
              const enabled = !(filters.hasDependencies || filters.hasAttachments);
              onChange({ ...filters, hasAttachments: enabled, hasDependencies: enabled });
            }} />
            <FilterToggle label="Archived" active={filters.includeArchived} onClick={() => update("includeArchived", !filters.includeArchived)} />
            <FilterToggle label="Deleted" active={filters.includeDeleted} onClick={() => update("includeDeleted", !filters.includeDeleted)} />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterToggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-xl border px-3 text-xs font-black transition",
        active
          ? "border-primary bg-primary text-[#111111]"
          : "border-line bg-background text-ink-soft hover:bg-panel-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

// ─── Planning tab ─────────────────────────────────────────────────────────────

function PlanningTab({
  canManageGovernance,
  canManageMilestones,
  canManageRisks,
  changeRequests,
  decisions,
  dependencies,
  milestones,
  openChangeRequests,
  openDependencies,
  onCreateMilestone,
  onCreateRisk,
  onCreateStakeholder,
  onCreateDependency,
  onCreateDecision,
  onCreateChangeRequest,
  onDeleteStakeholder,
  onDeleteDependency,
  onDeleteMilestone,
  onDeleteDecision,
  onDeleteChangeRequest,
  onUpdateStakeholder,
  onUpdateDependency,
  onUpdateMilestone,
  onUpdateDecision,
  onUpdateChangeRequest,
  onToggleMilestone,
  onToggleRisk,
  risks,
  saving,
  stakeholders,
}: {
  canManageGovernance: boolean;
  canManageMilestones: boolean;
  canManageRisks: boolean;
  changeRequests: ProjectChangeRequest[];
  decisions: ProjectDecision[];
  dependencies: ProjectDependency[];
  milestones: ProjectMilestone[];
  openChangeRequests: number;
  openDependencies: number;
  onCreateMilestone: (event: FormEvent<HTMLFormElement>) => void;
  onCreateRisk: (event: FormEvent<HTMLFormElement>) => void;
  onCreateStakeholder: (event: FormEvent<HTMLFormElement>) => void;
  onCreateDependency: (event: FormEvent<HTMLFormElement>) => void;
  onCreateDecision: (event: FormEvent<HTMLFormElement>) => void;
  onCreateChangeRequest: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteStakeholder: (stakeholder: ProjectStakeholder) => void;
  onDeleteDependency: (dependency: ProjectDependency) => void;
  onDeleteMilestone: (milestone: ProjectMilestone) => void;
  onDeleteDecision: (decision: ProjectDecision) => void;
  onDeleteChangeRequest: (changeRequest: ProjectChangeRequest) => void;
  onUpdateStakeholder: (stakeholderId: string, payload: Parameters<typeof updateProjectStakeholder>[3]) => void;
  onUpdateDependency: (dependencyId: string, payload: Parameters<typeof updateProjectDependency>[3]) => void;
  onUpdateMilestone: (milestoneId: string, payload: Parameters<typeof updateProjectMilestone>[3]) => void;
  onUpdateDecision: (decisionId: string, payload: Parameters<typeof updateProjectDecision>[3]) => void;
  onUpdateChangeRequest: (changeRequestId: string, payload: Parameters<typeof updateProjectChangeRequest>[3]) => void;
  onToggleMilestone: (m: ProjectMilestone) => void;
  onToggleRisk: (r: ProjectRisk) => void;
  risks: ProjectRisk[];
  saving: boolean;
  stakeholders: ProjectStakeholder[];
}) {
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [showStakeholderForm, setShowStakeholderForm] = useState(false);
  const [showDependencyForm, setShowDependencyForm] = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  const compactInput = "h-9 rounded-lg border border-line bg-background px-3 text-sm text-foreground placeholder:text-ink-soft";
  const compactSelect = "h-9 rounded-lg border border-line bg-background px-3 text-sm font-semibold text-foreground";

  function handleCreateMilestone(e: FormEvent<HTMLFormElement>) {
    onCreateMilestone(e);
    setShowMilestoneForm(false);
  }

  function handleUpdateMilestone(e: FormEvent<HTMLFormElement>, milestone: ProjectMilestone) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dueDate = String(fd.get("dueDate") || "");
    onUpdateMilestone(milestone.id, {
      title: String(fd.get("title") || ""),
      description: String(fd.get("description") || ""),
      dueDate: dueDate ? toNoonIso(dueDate) : null,
    });
    setEditingMilestoneId(null);
  }

  function handleCreateRisk(e: FormEvent<HTMLFormElement>) {
    onCreateRisk(e);
    setShowRiskForm(false);
  }

  function handleCreateStakeholder(e: FormEvent<HTMLFormElement>) {
    onCreateStakeholder(e);
    setShowStakeholderForm(false);
  }

  function handleCreateDependency(e: FormEvent<HTMLFormElement>) {
    onCreateDependency(e);
    setShowDependencyForm(false);
  }

  function handleCreateDecision(e: FormEvent<HTMLFormElement>) {
    onCreateDecision(e);
    setShowDecisionForm(false);
  }

  function handleCreateChangeRequest(e: FormEvent<HTMLFormElement>) {
    onCreateChangeRequest(e);
    setShowChangeForm(false);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <InfoTile label="Milestones" value={`${milestones.filter((item) => !item.completedAt).length} open`} />
        <InfoTile label="Risks" value={`${risks.filter((item) => item.isOpen).length} open`} />
        <InfoTile label="Stakeholders" value={`${stakeholders.length} mapped`} />
        <InfoTile label="Dependencies" value={`${openDependencies} open`} />
        <InfoTile label="Decisions" value={`${decisions.length} logged`} />
        <InfoTile label="Changes" value={`${openChangeRequests} active`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card
          title="Stakeholder register"
          action={
            <button
              type="button"
              onClick={() => setShowStakeholderForm((v) => !v)}
              disabled={!canManageGovernance}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-[#111111] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus className="size-3.5" aria-hidden="true" />
              Add
            </button>
          }
        >
          {showStakeholderForm && (
            <form onSubmit={handleCreateStakeholder} className="mb-4 grid gap-3 rounded-xl border border-line bg-background p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Name">
                  <Input name="name" placeholder="Stakeholder name" required />
                </Field>
                <Field label="Role">
                  <Input name="role" placeholder="Sponsor, client, approver" />
                </Field>
                <Field label="Email">
                  <Input name="email" type="email" placeholder="name@company.com" />
                </Field>
                <Field label="Organization">
                  <Input name="organization" placeholder="Company or department" />
                </Field>
                <Field label="Influence">
                  <select name="influence" defaultValue="MEDIUM" className={compactSelect}>
                    {stakeholderInfluenceOptions.map((value) => (
                      <option key={value} value={value}>
                        {titleCase(value)}
                      </option>
                    ))}
                  </select>
                </Field>
                <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-foreground">
                  <input name="isExternal" type="checkbox" className="size-4 accent-primary" />
                  External stakeholder
                </label>
              </div>
              <textarea name="notes" rows={2} placeholder="Expectations, escalation notes, approval rules" className={cn(compactInput, "h-auto py-2")} />
              <FormActions saving={saving} submitLabel="Save stakeholder" onCancel={() => setShowStakeholderForm(false)} />
            </form>
          )}

          <div className="divide-y divide-line">
            {stakeholders.map((stakeholder) => (
              <div key={stakeholder.id} className="grid gap-3 py-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-foreground">{stakeholder.name}</p>
                    <span className="rounded-md bg-panel-muted px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                      {titleCase(stakeholder.influence)}
                    </span>
                    {stakeholder.isExternal && (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">External</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-soft">
                    {[stakeholder.role, stakeholder.organization, stakeholder.email].filter(Boolean).join(" - ") || "No stakeholder detail"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={stakeholder.influence}
                    disabled={!canManageGovernance}
                    onChange={(event) => void onUpdateStakeholder(stakeholder.id, { influence: event.target.value as ProjectStakeholderInfluence })}
                    className={cn(compactSelect, "w-28")}
                  >
                    {stakeholderInfluenceOptions.map((value) => (
                      <option key={value} value={value}>
                        {titleCase(value)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void onDeleteStakeholder(stakeholder)}
                    disabled={!canManageGovernance}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    aria-label="Remove stakeholder"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            {!stakeholders.length && <Empty label="No stakeholders mapped yet." />}
          </div>
        </Card>

        <Card
          title="Dependencies and blockers"
          action={
            <button
              type="button"
              onClick={() => setShowDependencyForm((v) => !v)}
              disabled={!canManageGovernance}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-[#111111] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add
            </button>
          }
        >
          {showDependencyForm && (
            <form onSubmit={handleCreateDependency} className="mb-4 grid gap-3 rounded-xl border border-line bg-background p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Title">
                  <Input name="title" placeholder="Dependency or blocker" required />
                </Field>
                <Field label="Status">
                  <select name="status" defaultValue="OPEN" className={compactSelect}>
                    {dependencyStatusOptions.map((value) => (
                      <option key={value} value={value}>
                        {titleCase(value)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Type">
                  <Input name="dependencyType" placeholder="Vendor, legal, design, data" />
                </Field>
                <Field label="Owner">
                  <Input name="ownerName" placeholder="Owner name" />
                </Field>
                <Field label="Owner email">
                  <Input name="ownerEmail" type="email" placeholder="owner@company.com" />
                </Field>
                <Field label="Due date">
                  <Input name="dueDate" type="date" />
                </Field>
              </div>
              <Input name="externalUrl" placeholder="External tracker or vendor URL" />
              <textarea name="notes" rows={2} placeholder="Resolution path and current status" className={cn(compactInput, "h-auto py-2")} />
              <FormActions saving={saving} submitLabel="Save dependency" onCancel={() => setShowDependencyForm(false)} />
            </form>
          )}

          <div className="divide-y divide-line">
            {dependencies.map((dependency) => (
              <div key={dependency.id} className="grid gap-3 py-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-foreground">{dependency.title}</p>
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", dependency.status === "BLOCKED" ? "bg-red-50 text-red-700" : dependency.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                      {titleCase(dependency.status)}
                    </span>
                    {dependency.externalUrl && (
                      <a href={dependency.externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
                        Link <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-soft">
                    {[dependency.dependencyType, dependency.ownerName, dependency.dueDate ? `Due ${formatShortDate(dependency.dueDate)}` : null].filter(Boolean).join(" - ") || "No owner or due date"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={dependency.status}
                    disabled={!canManageGovernance}
                    onChange={(event) => void onUpdateDependency(dependency.id, { status: event.target.value as ProjectDependencyStatus })}
                    className={cn(compactSelect, "w-32")}
                  >
                    {dependencyStatusOptions.map((value) => (
                      <option key={value} value={value}>
                        {titleCase(value)}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => void onDeleteDependency(dependency)} disabled={!canManageGovernance} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-red-50 hover:text-red-600 disabled:opacity-40" aria-label="Delete dependency">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            {!dependencies.length && <Empty label="No external dependencies tracked." />}
          </div>
        </Card>

        {/* Milestones */}
      <Card
        title="Milestones"
        action={
          <button
            type="button"
            onClick={() => setShowMilestoneForm((v) => !v)}
            disabled={!canManageMilestones}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-[#111111] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add milestone
          </button>
        }
      >
        {showMilestoneForm && (
          <form
            onSubmit={handleCreateMilestone}
            className="mb-4 grid gap-3 rounded-xl border border-line bg-background p-4"
          >
            <Field label="Title">
              <Input name="title" placeholder="Milestone title" required />
            </Field>
            <Field label="Description">
              <Input name="description" placeholder="Optional context" />
            </Field>
            <Field label="Due date">
              <Input name="dueDate" type="date" />
            </Field>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="h-9 rounded-lg bg-primary px-4 text-sm font-bold text-[#111111] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save milestone"}
              </button>
              <button
                type="button"
                onClick={() => setShowMilestoneForm(false)}
                className="h-9 rounded-lg border border-line bg-panel px-4 text-sm font-medium text-foreground hover:bg-panel-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-2">
          {milestones.map((m) => (
            <div key={m.id} className="rounded-xl border border-line bg-background p-3">
              {editingMilestoneId === m.id ? (
                <form onSubmit={(event) => handleUpdateMilestone(event, m)} className="grid gap-3">
                  <Field label="Milestone title">
                    <Input name="title" defaultValue={m.title} required />
                  </Field>
                  <Field label="Description">
                    <Input name="description" defaultValue={m.description ?? ""} placeholder="Optional context" />
                  </Field>
                  <Field label="Due date">
                    <Input name="dueDate" type="date" defaultValue={dateInputValue(m.dueDate)} />
                  </Field>
                  <FormActions saving={saving} submitLabel="Save correction" onCancel={() => setEditingMilestoneId(null)} />
                </form>
              ) : (
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                  <div className="flex min-w-0 items-start gap-3">
                    <CheckCircle2
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        m.completedAt ? "text-emerald-500" : "text-ink-soft",
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-semibold text-foreground",
                          m.completedAt && "line-through text-ink-soft",
                        )}
                      >
                        {m.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {m.dueDate ? `Due ${formatShortDate(m.dueDate)}` : "No due date"}
                      </p>
                      {m.description && (
                        <p className="mt-1.5 text-xs text-ink-soft">{m.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void onToggleMilestone(m)}
                      disabled={!canManageMilestones}
                      className="h-8 rounded-lg border border-line bg-panel px-3 text-xs font-bold text-foreground transition hover:bg-panel-muted disabled:opacity-50"
                    >
                      {m.completedAt ? "Reopen" : "Complete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMilestoneId(m.id)}
                      disabled={!canManageMilestones}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-line text-ink-soft transition hover:bg-panel-muted hover:text-foreground disabled:opacity-50"
                      aria-label="Edit milestone"
                    >
                      <Edit3 className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteMilestone(m)}
                      disabled={!canManageMilestones}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-line text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label="Delete milestone"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!milestones.length && <Empty label="No milestones yet." />}
        </div>
      </Card>

      {/* Risk register */}
      <Card
        title="Risk register"
        action={
          <button
            type="button"
            onClick={() => setShowRiskForm((v) => !v)}
            disabled={!canManageRisks}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-[#111111] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add risk
          </button>
        }
      >
        {showRiskForm && (
          <form
            onSubmit={handleCreateRisk}
            className="mb-4 grid gap-3 rounded-xl border border-line bg-background p-4"
          >
            <Field label="Title">
              <Input name="title" placeholder="Risk title" required />
            </Field>
            <Field label="Severity">
              <select
                name="severity"
                defaultValue="HIGH"
                className="h-10 w-full rounded-lg border border-line bg-panel px-3 text-sm text-foreground"
              >
                {(Object.keys(priorityLabels) as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {priorityLabels[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mitigation plan">
              <Input name="mitigation" placeholder="How will you address this?" />
            </Field>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="h-9 rounded-lg bg-primary px-4 text-sm font-bold text-[#111111] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save risk"}
              </button>
              <button
                type="button"
                onClick={() => setShowRiskForm(false)}
                className="h-9 rounded-lg border border-line bg-panel px-4 text-sm font-medium text-foreground hover:bg-panel-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-2">
          {risks.map((risk) => (
            <button
              key={risk.id}
              type="button"
              onClick={() => void onToggleRisk(risk)}
              disabled={!canManageRisks}
              className="rounded-xl border border-line bg-background p-3 text-left transition hover:border-primary"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{risk.title}</p>
                <div className="flex shrink-0 gap-1.5">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold",
                      priorityBadge[risk.severity ?? "HIGH"],
                    )}
                  >
                    {priorityLabels[risk.severity ?? "HIGH"]}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold",
                      risk.isOpen
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {risk.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
              </div>
              {(risk.mitigation || risk.description) && (
                <p className="mt-1.5 text-xs text-ink-soft line-clamp-2">
                  {risk.mitigation || risk.description}
                </p>
              )}
            </button>
          ))}
          {!risks.length && <Empty label="No risks logged." />}
        </div>
      </Card>

        <Card
          title="Decision log"
          action={
            <button
              type="button"
              onClick={() => setShowDecisionForm((v) => !v)}
              disabled={!canManageGovernance}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-[#111111] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add
            </button>
          }
        >
          {showDecisionForm && (
            <form onSubmit={handleCreateDecision} className="mb-4 grid gap-3 rounded-xl border border-line bg-background p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Title">
                  <Input name="title" placeholder="Decision title" required />
                </Field>
                <Field label="Status">
                  <select name="status" defaultValue="DECIDED" className={compactSelect}>
                    {decisionStatusOptions.map((value) => (
                      <option key={value} value={value}>
                        {titleCase(value)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Owner">
                  <Input name="ownerName" placeholder="Decision owner" />
                </Field>
                <Field label="Decision date">
                  <Input name="decidedAt" type="date" />
                </Field>
              </div>
              <textarea name="outcome" rows={2} placeholder="Outcome and expected operating impact" className={cn(compactInput, "h-auto py-2")} />
              <textarea name="notes" rows={2} placeholder="Alternatives, assumptions, or evidence" className={cn(compactInput, "h-auto py-2")} />
              <FormActions saving={saving} submitLabel="Save decision" onCancel={() => setShowDecisionForm(false)} />
            </form>
          )}

          <div className="divide-y divide-line">
            {decisions.map((decision) => (
              <div key={decision.id} className="grid gap-3 py-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-foreground">{decision.title}</p>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {titleCase(decision.status)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-soft">
                    {[decision.ownerName, decision.decidedAt ? `Decided ${formatShortDate(decision.decidedAt)}` : null, decision.outcome].filter(Boolean).join(" - ") || "No decision context yet"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={decision.status}
                    disabled={!canManageGovernance}
                    onChange={(event) => void onUpdateDecision(decision.id, { status: event.target.value as ProjectDecisionStatus })}
                    className={cn(compactSelect, "w-32")}
                  >
                    {decisionStatusOptions.map((value) => (
                      <option key={value} value={value}>
                        {titleCase(value)}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => void onDeleteDecision(decision)} disabled={!canManageGovernance} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-red-50 hover:text-red-600 disabled:opacity-40" aria-label="Delete decision">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            {!decisions.length && <Empty label="No project decisions recorded." />}
          </div>
        </Card>

        <Card
          title="Change control"
          action={
            <button
              type="button"
              onClick={() => setShowChangeForm((v) => !v)}
              disabled={!canManageGovernance}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-[#111111] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add
            </button>
          }
        >
          {showChangeForm && (
            <form onSubmit={handleCreateChangeRequest} className="mb-4 grid gap-3 rounded-xl border border-line bg-background p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Title">
                  <Input name="title" placeholder="Scope, budget, or schedule change" required />
                </Field>
                <Field label="Status">
                  <select name="status" defaultValue="SUBMITTED" className={compactSelect}>
                    {changeRequestStatusOptions.map((value) => (
                      <option key={value} value={value}>
                        {titleCase(value)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Requested by">
                  <Input name="requestedByName" placeholder="Requester" />
                </Field>
                <Field label="Due date">
                  <Input name="dueDate" type="date" />
                </Field>
                <Field label="Budget impact">
                  <Input name="budgetImpact" type="number" min={0} step="0.01" placeholder="0" />
                </Field>
                <Field label="Schedule impact">
                  <Input name="scheduleImpactDays" type="number" placeholder="Days" />
                </Field>
              </div>
              <textarea name="reason" rows={2} placeholder="Why this change is needed" className={cn(compactInput, "h-auto py-2")} />
              <textarea name="scopeImpact" rows={2} placeholder="Scope impact" className={cn(compactInput, "h-auto py-2")} />
              <textarea name="riskImpact" rows={2} placeholder="Risk impact" className={cn(compactInput, "h-auto py-2")} />
              <FormActions saving={saving} submitLabel="Save change" onCancel={() => setShowChangeForm(false)} />
            </form>
          )}

          <div className="divide-y divide-line">
            {changeRequests.map((changeRequest) => (
              <div key={changeRequest.id} className="grid gap-3 py-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-foreground">{changeRequest.title}</p>
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", changeRequest.status === "APPROVED" || changeRequest.status === "IMPLEMENTED" ? "bg-emerald-50 text-emerald-700" : changeRequest.status === "REJECTED" || changeRequest.status === "CANCELLED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700")}>
                      {titleCase(changeRequest.status)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-soft">
                    {[
                      changeRequest.requestedByName,
                      changeRequest.dueDate ? `Due ${formatShortDate(changeRequest.dueDate)}` : null,
                      Number(changeRequest.budgetImpact ?? 0) > 0 ? `Budget impact ${Number(changeRequest.budgetImpact).toLocaleString()}` : null,
                      typeof changeRequest.scheduleImpactDays === "number" ? `${changeRequest.scheduleImpactDays} day schedule impact` : null,
                    ].filter(Boolean).join(" - ") || "No change impact recorded"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={changeRequest.status}
                    disabled={!canManageGovernance}
                    onChange={(event) => void onUpdateChangeRequest(changeRequest.id, { status: event.target.value as ProjectChangeRequestStatus })}
                    className={cn(compactSelect, "w-36")}
                  >
                    {changeRequestStatusOptions.map((value) => (
                      <option key={value} value={value}>
                        {titleCase(value)}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => void onDeleteChangeRequest(changeRequest)} disabled={!canManageGovernance} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-red-50 hover:text-red-600 disabled:opacity-40" aria-label="Delete change request">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            {!changeRequests.length && <Empty label="No scope, budget, or schedule changes logged." />}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Finance & team tab ───────────────────────────────────────────────────────

function FinanceTeamTab({
  actualBudget,
  budgets,
  canArchiveProject,
  canDeleteProject,
  canManageBudget,
  canRestoreProject,
  currency,
  members,
  onArchive,
  onCreateBudget,
  onDelete,
  onDeleteBudget,
  onRestore,
  onSetStatus,
  onUpdateBudget,
  plannedBudget,
  project,
  saving,
}: {
  actualBudget: number;
  budgets: ProjectBudget[];
  canArchiveProject: boolean;
  canDeleteProject: boolean;
  canManageBudget: boolean;
  canRestoreProject: boolean;
  currency: string;
  members: ProjectMember[];
  onArchive: () => void;
  onCreateBudget: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onDeleteBudget: (budget: ProjectBudget) => void;
  onRestore: () => void;
  onSetStatus: (status: Project["status"], successMsg: string) => Promise<void>;
  onUpdateBudget: (budgetId: string, payload: Parameters<typeof updateProjectBudget>[3]) => void;
  plannedBudget: number;
  project: Project;
  saving: boolean;
}) {
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const variance = plannedBudget - actualBudget;
  const contractValue = Number(project.contractValue ?? 0);
  const financeBase = contractValue || plannedBudget;
  const remaining = financeBase - actualBudget;
  const utilization = financeBase > 0 ? Math.min(100, Math.round((actualBudget / financeBase) * 100)) : 0;

  function handleCreateBudget(e: FormEvent<HTMLFormElement>) {
    onCreateBudget(e);
    setShowBudgetForm(false);
  }

  function handleUpdateBudget(e: FormEvent<HTMLFormElement>, budget: ProjectBudget) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onUpdateBudget(budget.id, {
      currency: String(fd.get("currency") || budget.currency || currency).toUpperCase(),
      planned: optionalNumber(fd, "planned"),
      actual: optionalNumber(fd, "actual"),
      notes: String(fd.get("notes") || ""),
    });
    setEditingBudgetId(null);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="grid gap-5">
        {/* Budget summary */}
        <Card title="Budget control">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FinanceKPI label="Contract" value={formatMoney(contractValue, currency)} />
            <FinanceKPI label="Planned" value={formatMoney(plannedBudget, currency)} />
            <FinanceKPI label="Actual" value={formatMoney(actualBudget, currency)} />
            <FinanceKPI
              label={contractValue ? "Remaining" : "Variance"}
              value={formatMoney(contractValue ? remaining : variance, currency)}
              accent={(contractValue ? remaining : variance) >= 0 ? "#10b981" : "#ef4444"}
            />
          </div>
          <div className="mt-4 rounded-xl border border-line bg-background p-3">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-black uppercase tracking-[0.16em] text-ink-soft">
                Spend utilization
              </span>
              <span className="font-black text-foreground">{utilization}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel-muted">
              <div
                className={cn("h-full rounded-full", utilization > 90 ? "bg-red-500" : utilization > 70 ? "bg-amber-500" : "bg-emerald-500")}
                style={{ width: `${utilization}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              {project.clientName ? `${project.clientName} contract` : "Project contract"} tracked in {currency}.
            </p>
          </div>

          {/* Budget lines */}
          {budgets.length > 0 && (
            <div className="mt-4 grid gap-2">
              {budgets.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-line bg-background p-3"
                >
                  {editingBudgetId === b.id ? (
                    <form onSubmit={(event) => handleUpdateBudget(event, b)} className="grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Currency">
                          <select
                            className="h-10 min-w-0 rounded-lg border border-line bg-panel px-3 text-sm font-semibold text-foreground"
                            name="currency"
                            defaultValue={b.currency || currency}
                          >
                            {projectCurrencyOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Planned">
                          <Input min={0} name="planned" placeholder="0" type="number" defaultValue={Number(b.planned ?? 0)} />
                        </Field>
                        <Field label="Actual">
                          <Input min={0} name="actual" placeholder="0" type="number" defaultValue={Number(b.actual ?? 0)} />
                        </Field>
                      </div>
                      <Field label="Notes">
                        <Input name="notes" placeholder="Budget note" defaultValue={b.notes ?? ""} />
                      </Field>
                      <FormActions saving={saving} submitLabel="Save correction" onCancel={() => setEditingBudgetId(null)} />
                    </form>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {b.currency || "USD"}
                          </span>
                          <span className="text-xs text-ink-soft">
                            {formatMoney(Number(b.actual ?? 0), b.currency)} actual /{" "}
                            {formatMoney(Number(b.planned ?? 0), b.currency)} planned
                          </span>
                        </div>
                        {b.notes && <p className="mt-1.5 text-xs text-ink-soft">{b.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingBudgetId(b.id)}
                          disabled={!canManageBudget}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-line text-ink-soft transition hover:bg-panel-muted hover:text-foreground disabled:opacity-50"
                          aria-label="Edit budget line"
                        >
                          <Edit3 className="size-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDeleteBudget(b)}
                          disabled={!canManageBudget}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-line text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label="Delete budget line"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!budgets.length && !showBudgetForm && (
            <Empty label="No budget lines yet." className="mt-4" />
          )}

          {showBudgetForm ? (
            <form
              onSubmit={handleCreateBudget}
              className="mt-4 grid gap-3 rounded-xl border border-line bg-background p-4"
            >
              <div className="grid grid-cols-3 gap-3">
                <Field label="Currency">
                  <select
                    className="h-10 min-w-0 rounded-lg border border-line bg-panel px-3 text-sm font-semibold text-foreground"
                    name="currency"
                    defaultValue={currency}
                  >
                    {projectCurrencyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Planned">
                  <Input min={0} name="planned" placeholder="0" type="number" />
                </Field>
                <Field label="Actual">
                  <Input min={0} name="actual" placeholder="0" type="number" />
                </Field>
              </div>
              <Field label="Notes">
                <Input name="notes" placeholder="Budget note" />
              </Field>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-lg bg-primary px-4 text-sm font-bold text-[#111111] disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save budget"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBudgetForm(false)}
                  className="h-9 rounded-lg border border-line bg-panel px-4 text-sm font-medium text-foreground hover:bg-panel-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowBudgetForm(true)}
              disabled={!canManageBudget}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add budget line
            </button>
          )}
        </Card>

        <Card title="Commercial profile">
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoTile label="Client" value={project.clientName || "Not assigned"} />
            <InfoTile label="Client email" value={project.clientEmail || "Not set"} />
            <InfoTile label="Phone" value={project.clientPhone || "Not set"} />
            <InfoTile label="Currency" value={project.currency || currency} />
            <InfoTile label="Billing code" value={project.billingCode || "Not set"} />
            <InfoTile label="Cost center" value={project.costCenter || "Not set"} />
            <InfoTile label="Location" value={projectLocationLabel(project) || "Not set"} className="sm:col-span-2" />
            <InfoTile label="Address" value={projectAddressLabel(project) || "Not set"} className="sm:col-span-2" />
          </div>
        </Card>
      </div>

      <div className="grid content-start gap-5">
        {/* Team */}
        <Card title="Project team">
          {members.length ? (
            <div className="grid gap-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-background p-3"
                >
                  {member.user.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt=""
                      className="size-9 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#172026] text-xs font-bold text-white">
                      {userInitials(member.user)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {`${member.user.firstName} ${member.user.lastName}`.trim() ||
                        member.user.email}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {member.role || "Project member"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty label="No project members assigned yet." />
          )}
        </Card>

        {/* Administration */}
        <Card title="Administration">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void onSetStatus("ACTIVE", "Project activated.")}
                disabled={saving || project.status === "ACTIVE"}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlayCircle className="size-4" aria-hidden="true" />
                Active
              </button>
              <button
                type="button"
                onClick={() => void onSetStatus("ON_HOLD", "Project put on hold.")}
                disabled={saving || project.status === "ON_HOLD"}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PauseCircle className="size-4" aria-hidden="true" />
                On hold
              </button>
            </div>
            <button
              type="button"
              onClick={() => void onSetStatus("COMPLETED", "Project marked complete.")}
              disabled={saving || project.status === "COMPLETED"}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Mark complete
            </button>
            {project.status === "ARCHIVED" ? (
              <button
                type="button"
                onClick={onRestore}
                disabled={!canRestoreProject}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line bg-background text-sm font-semibold text-foreground transition hover:bg-panel-muted"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Restore project
              </button>
            ) : (
              <button
                type="button"
                onClick={onArchive}
                disabled={!canArchiveProject}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line bg-background text-sm font-semibold text-foreground transition hover:bg-panel-muted"
              >
                <Archive className="size-4" aria-hidden="true" />
                Archive project
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              disabled={!canDeleteProject}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete empty project
            </button>
            <p className="text-xs leading-5 text-ink-soft">
              Archive is the safe soft-delete. Hard delete only works on empty projects.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Task composer ────────────────────────────────────────────────────────────

const permissionSections: Array<{
  label: string;
  actions: Array<{ key: keyof ProjectPermissionMatrix["actions"]; label: string }>;
}> = [
  {
    label: "Project control",
    actions: [
      { key: "viewProject", label: "View" },
      { key: "editProject", label: "Edit settings" },
      { key: "archiveProject", label: "Archive" },
      { key: "restoreProject", label: "Restore" },
      { key: "deleteProject", label: "Delete" },
    ],
  },
  {
    label: "Delivery work",
    actions: [
      { key: "createTasks", label: "Create tasks" },
      { key: "editTasks", label: "Edit tasks" },
      { key: "deleteTasks", label: "Delete tasks" },
      { key: "commentTasks", label: "Comment" },
    ],
  },
  {
    label: "Operations",
    actions: [
      { key: "manageMembers", label: "Members" },
      { key: "manageMilestones", label: "Milestones" },
      { key: "manageRisks", label: "Risks" },
      { key: "manageBudget", label: "Budget" },
      { key: "manageFiles", label: "Files" },
      { key: "viewPrivateFiles", label: "Private files" },
    ],
  },
];

function AccessTab({
  members,
  onRemoveMember,
  onSaveMember,
  permissions,
  saving,
  tenantUsers,
}: {
  members: ProjectMember[];
  onRemoveMember: (member: ProjectMember) => void;
  onSaveMember: (event: FormEvent<HTMLFormElement>) => void;
  permissions: ProjectPermissionMatrix | null;
  saving: boolean;
  tenantUsers: TenantUser[];
}) {
  const canManageMembers = Boolean(permissions?.actions.manageMembers);
  const memberIds = new Set(members.map((member) => member.user.id));
  const assignableUsers = tenantUsers.filter((user) => !memberIds.has(user.id));

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="grid gap-5">
        <section className="overflow-hidden rounded-2xl border border-line bg-[#111111] text-white shadow-sm">
          <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-black text-primary">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Enterprise access matrix
              </div>
              <h2 className="mt-4 text-2xl font-black">
                {permissions?.accessLevel.replace(/_/g, " ") ?? "Loading access"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/58">
                Access is resolved from global RBAC, project membership, team membership, task participation, and project visibility. Backend guards enforce the same actions shown here.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <AccessChip label="Source" value={permissions?.source ?? "unknown"} />
                <AccessChip label="Project role" value={permissions?.projectRole ?? "none"} />
                <AccessChip label="Team role" value={permissions?.teamRole ?? "none"} />
                <AccessChip label="Visibility" value={permissions?.visibility ?? "TEAM"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {permissionSections.flatMap((section) => section.actions).slice(0, 8).map((item) => (
                <PermissionTile key={item.key} allowed={Boolean(permissions?.actions[item.key])} label={item.label} />
              ))}
            </div>
          </div>
        </section>

        <Card title="Action permissions">
          <div className="grid gap-4 lg:grid-cols-3">
            {permissionSections.map((section) => (
              <div key={section.label} className="rounded-2xl border border-line bg-background p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-ink-soft">{section.label}</p>
                <div className="mt-3 grid gap-2">
                  {section.actions.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl bg-panel px-3 py-2">
                      <span className="text-sm font-semibold text-foreground">{item.label}</span>
                      <span
                        className={cn(
                          "rounded-lg px-2 py-1 text-[10px] font-black",
                          permissions?.actions[item.key] ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
                        )}
                      >
                        {permissions?.actions[item.key] ? "Allowed" : "Blocked"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Project role catalog">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(permissions?.roles ?? []).map((role) => (
              <div key={role.role} className="rounded-2xl border border-line bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-foreground">{role.role}</p>
                  <span className="rounded-lg bg-primary/20 px-2 py-1 text-[10px] font-black text-[#111111]">
                    {role.accessLevel.replace("PROJECT_", "")}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">{role.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid content-start gap-5">
        <Card
          title="Member access"
          action={
            <span className="inline-flex items-center gap-1 rounded-lg bg-panel-muted px-2 py-1 text-[10px] font-black text-ink-soft">
              <Users className="size-3" aria-hidden="true" />
              {members.length}
            </span>
          }
        >
          {canManageMembers ? (
            <form onSubmit={onSaveMember} className="mb-4 grid gap-3 rounded-2xl border border-line bg-background p-4">
              <Field label="User">
                <select name="userId" required className="h-10 rounded-lg border border-line bg-panel px-3 text-sm text-foreground">
                  <option value="">Select user</option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {displayUserName(user)} - {user.email}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Project role">
                <select name="role" defaultValue="Contributor" className="h-10 rounded-lg border border-line bg-panel px-3 text-sm text-foreground">
                  {projectRoleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </Field>
              <button
                type="submit"
                disabled={saving || assignableUsers.length === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus className="size-4" aria-hidden="true" />
                Grant access
              </button>
              {tenantUsers.length === 0 ? (
                <p className="text-xs font-semibold text-ink-soft">Tenant user directory is unavailable for this account.</p>
              ) : null}
            </form>
          ) : (
            <div className="mb-4 rounded-2xl border border-line bg-background p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 size-4 text-ink-soft" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-ink-soft">
                  Your current project role can view access, but cannot grant or remove project membership.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            {members.map((member) => (
              <div key={member.id} className="rounded-2xl border border-line bg-background p-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#172026] text-xs font-black text-white">
                    {userInitials(member.user)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-foreground">{displayUserName(member.user)}</p>
                    <p className="truncate text-xs text-ink-soft">{member.user.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-primary/20 px-2 py-1 text-[10px] font-black text-[#111111]">
                        {member.role || "Contributor"}
                      </span>
                      <span className="rounded-lg bg-panel-muted px-2 py-1 text-[10px] font-black text-ink-soft">
                        Direct project member
                      </span>
                    </div>
                  </div>
                  {canManageMembers ? (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(member)}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-700"
                      title="Remove project access"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {!members.length ? <Empty label="No direct project members yet." /> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AccessChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2">
      <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-white/40">{label}</span>
      <span className="mt-0.5 block text-xs font-black text-white">{value.replace(/_/g, " ")}</span>
    </span>
  );
}

function PermissionTile({ allowed, label }: { allowed: boolean; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/8 p-3">
      <p className="text-xs font-semibold text-white/50">{label}</p>
      <p className={cn("mt-1 text-lg font-black", allowed ? "text-emerald-300" : "text-red-300")}>
        {allowed ? "Yes" : "No"}
      </p>
    </div>
  );
}

function ProjectActivityTab({
  projectId,
  token,
}: {
  projectId: string;
  token: string;
}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const setMessage = useToastMessageDispatcher();

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const page = await listAuditLogs(token, {
        entityId: projectId,
        limit: 80,
      });
      setLogs(page.data);
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Project activity is unavailable for this account.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadActivity(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadActivity]);

  return (
    <Card
      title="Project activity"
      action={
        <button
          type="button"
          onClick={() => void loadActivity()}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-background px-3 text-xs font-bold text-ink-soft transition hover:text-foreground"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden="true" />
          Refresh
        </button>
      }
    >
      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-panel-muted" />
          ))}
        </div>
      ) : logs.length ? (
        <div className="relative">
          <div className="absolute left-[18px] top-2 h-[calc(100%-1rem)] w-px bg-line" aria-hidden="true" />
          <div className="grid gap-3">
            {logs.map((log) => (
              <article key={log.id} className="relative flex gap-3 rounded-2xl border border-line bg-background p-3">
                <span className="relative z-10 mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-primary">
                  <History className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-foreground">{humanAction(log.action)}</p>
                    <span className="rounded-md bg-panel-muted px-1.5 py-0.5 text-[9px] font-black text-ink-soft">
                      {log.entityType}
                    </span>
                  </div>
                  <p className="mt-1 break-all text-xs text-ink-soft">{log.entityId ?? projectId}</p>
                  <p className="mt-1 text-[11px] font-bold text-ink-soft/60">
                    {formatDateTime(log.createdAt)}
                    {log.ipAddress ? ` - ${log.ipAddress}` : ""}
                  </p>
                  {log.oldValue || log.newValue ? (
                    <details className="mt-2 rounded-xl border border-line bg-panel p-3">
                      <summary className="cursor-pointer text-xs font-black text-foreground">
                        Show audit payload
                      </summary>
                      <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-[#111111] p-3 text-[11px] leading-relaxed text-white tb-scrollbar">
                        {JSON.stringify({ before: log.oldValue ?? null, after: log.newValue ?? null }, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <Empty label="No project audit events found yet." icon={History} />
      )}
    </Card>
  );
}

function TaskComposerModal({
  open,
  onClose,
  onSubmit,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[#111111]/45 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={saving ? undefined : onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-modal-title"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_34px_100px_rgba(17,17,17,0.28)]"
      >
        <div className="h-1 bg-[#ffd400]" />
        <div className="flex items-center gap-3 border-b border-line px-6 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#ffd400] text-[#111111]">
            <Plus className="size-4" aria-hidden="true" />
          </span>
          <h2 id="new-task-modal-title" className="flex-1 text-base font-black text-foreground">
            New task
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close dialog"
            className="flex size-8 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:bg-panel-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Title">
                <Input maxLength={240} name="title" placeholder="What needs to be done?" required />
              </Field>
            </div>
            <Field label="Type">
              <select name="type" defaultValue="TASK" className="h-10 w-full rounded-xl border border-line bg-background px-3 text-sm text-foreground">
                {taskTypes.map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select name="status" defaultValue="TODO" className="h-10 w-full rounded-xl border border-line bg-background px-3 text-sm text-foreground">
                {taskStatusOrder.slice(0, 5).map((s) => <option key={s} value={s}>{taskStatusLabels[s]}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select name="priority" defaultValue="MEDIUM" className="h-10 w-full rounded-xl border border-line bg-background px-3 text-sm text-foreground">
                {(Object.keys(priorityLabels) as TaskPriority[]).map((p) => <option key={p} value={p}>{priorityLabels[p]}</option>)}
              </select>
            </Field>
            <Field label="Due date">
              <Input name="dueDate" type="date" />
            </Field>
            <Field label="Story points">
              <Input min={0} name="storyPoints" type="number" placeholder="0" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Input name="description" placeholder="Optional context…" />
              </Field>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-9 rounded-xl border border-line bg-background px-4 text-sm font-bold text-foreground transition hover:bg-panel-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 rounded-xl bg-[#ffd400] px-5 text-sm font-black text-[#111111] transition hover:bg-[#f6b900] disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  onOpen,
  onQuickUpdate,
  onToggleSelected,
  selected,
  task,
}: {
  onOpen: () => void;
  onQuickUpdate?: (taskId: string, payload: Parameters<typeof updateTask>[2]) => void;
  onToggleSelected: () => void;
  selected: boolean;
  task: Task;
}) {
  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-xl border px-4 py-2.5 transition-all hover:shadow-sm",
        selected
          ? "border-[#ffd400]/50 bg-[#ffd400]/8"
          : "border-line bg-white hover:border-[#d8d0bc]",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelected}
        className="size-4 shrink-0 accent-[#ffd400]"
        aria-label={`Select ${task.key}`}
      />

      {/* Status left-bar */}
      <span className={cn("h-6 w-[3px] shrink-0 rounded-full", statusLeftBar[task.status])} />

      {/* Main content */}
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-[10px] font-black text-primary">{task.key}</span>
          <span className={cn("size-1.5 shrink-0 rounded-full", priorityDot[task.priority])} />
          <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {task.title}
          </span>
          {(task.archivedAt ?? task.deletedAt) ? (
            <span className="ml-1 shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-700">
              {task.deletedAt ? "Deleted" : "Archived"}
            </span>
          ) : null}
        </div>
        {task.description && (
          <p className="mt-0.5 truncate text-[11px] text-ink-soft">{task.description}</p>
        )}
      </button>

      {/* Sprint chip */}
      {task.sprint?.name && (
        <span className="hidden shrink-0 rounded-lg bg-panel-muted px-2 py-0.5 text-[10px] font-bold text-ink-soft sm:block">
          {task.sprint.name}
        </span>
      )}

      {/* Status */}
      {onQuickUpdate ? (
        <select
          className={cn("h-7 shrink-0 rounded-full border-0 px-2.5 text-[11px] font-bold outline-none ring-1 ring-inset ring-line", statusPill[task.status])}
          value={task.status}
          onChange={(e) => onQuickUpdate(task.id, { status: e.target.value as TaskStatus })}
        >
          {taskStatusOrder.map((s) => <option key={s} value={s}>{taskStatusLabels[s]}</option>)}
        </select>
      ) : (
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold", statusPill[task.status])}>
          {taskStatusLabels[task.status]}
        </span>
      )}

      {/* Priority */}
      {onQuickUpdate ? (
        <select
          className={cn("h-7 shrink-0 rounded-lg border px-2 text-[11px] font-bold outline-none", priorityBadge[task.priority])}
          value={task.priority}
          onChange={(e) => onQuickUpdate(task.id, { priority: e.target.value as TaskPriority })}
        >
          {(Object.keys(priorityLabels) as TaskPriority[]).map((p) => (
            <option key={p} value={p}>{priorityLabels[p]}</option>
          ))}
        </select>
      ) : (
        <span className={cn("shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold", priorityBadge[task.priority])}>
          {priorityLabels[task.priority]}
        </span>
      )}

      {/* Assignee avatar */}
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#172026] text-[9px] font-black text-white">
        {userInitials(task.assignees?.[0]?.user)}
      </span>

      {/* Story points */}
      {task.storyPoints ? (
        <span className="shrink-0 text-[11px] font-black text-ink-soft">{task.storyPoints}pt</span>
      ) : null}

      {/* Due date */}
      <span className="w-14 shrink-0 text-right text-[11px] text-ink-soft">
        {formatShortDate(task.dueDate)}
      </span>
    </div>
  );
}

// ─── Edit project dialog ──────────────────────────────────────────────────────

function EditProjectDialog({
  canManageBudget,
  onClose,
  onSubmit,
  project,
  saving,
}: {
  canManageBudget: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  project: Project;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-primary">
              Project settings
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-foreground">Edit project</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-line bg-background text-ink-soft transition hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[calc(88vh-138px)] overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-ink-soft">
                Delivery control
              </p>
            </div>
          <Field label="Name">
            <Input name="name" defaultValue={project.name} required />
          </Field>
          <Field label="Status">
            <select
              className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground"
              name="status"
              defaultValue={project.status}
            >
              {(Object.keys(projectStatusLabels) as Project["status"][]).map((s) => (
                <option key={s} value={s}>
                  {projectStatusLabels[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Visibility">
            <select
              className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground"
              name="visibility"
              defaultValue={project.visibility ?? "TEAM"}
            >
              {visibilityOptions.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {titleCase(visibility)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Progress (%)">
            <Input
              max={100}
              min={0}
              name="progress"
              type="number"
              defaultValue={project.progress}
            />
          </Field>
          <Field label="Start date">
            <Input name="startDate" type="date" defaultValue={dateInputValue(project.startDate)} />
          </Field>
          <Field label="Due date">
            <Input name="dueDate" type="date" defaultValue={dateInputValue(project.dueDate)} />
          </Field>
          <label className="grid gap-1 text-xs font-semibold text-ink-soft sm:col-span-2">
            Description
            <textarea
              className="min-h-28 rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground resize-none"
              name="description"
              defaultValue={project.description ?? ""}
            />
          </label>
          {canManageBudget ? (
          <>
          <div className="mt-2 sm:col-span-2">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-ink-soft">
              Commercial profile
            </p>
          </div>
          <Field label="Currency">
            <select
              className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground"
              name="currency"
              defaultValue={project.currency ?? "USD"}
            >
              {projectCurrencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Contract value">
            <Input min={0} name="contractValue" type="number" defaultValue={Number(project.contractValue ?? 0)} />
          </Field>
          <Field label="Client / sponsor">
            <Input name="clientName" defaultValue={project.clientName ?? ""} placeholder="Client or sponsor" />
          </Field>
          <Field label="Client email">
            <Input name="clientEmail" defaultValue={project.clientEmail ?? ""} placeholder="stakeholder@company.com" type="email" />
          </Field>
          <Field label="Client phone">
            <Input name="clientPhone" defaultValue={project.clientPhone ?? ""} placeholder="+1 555 0100" />
          </Field>
          <Field label="Billing code">
            <Input name="billingCode" defaultValue={project.billingCode ?? ""} placeholder="PO / billing reference" />
          </Field>
          <Field label="Cost center">
            <Input name="costCenter" defaultValue={project.costCenter ?? ""} placeholder="Department code" />
          </Field>
          <Field label="Timezone">
            <Input name="timezone" defaultValue={project.timezone ?? ""} placeholder="America/Chicago" />
          </Field>
          <div className="mt-2 sm:col-span-2">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-ink-soft">
              Location
            </p>
          </div>
          <Field label="Location name">
            <Input name="locationName" defaultValue={project.locationName ?? ""} placeholder="Office, region, or site" />
          </Field>
          <Field label="Country">
            <Input name="country" defaultValue={project.country ?? ""} placeholder="Country" />
          </Field>
          <Field label="Address line 1">
            <Input name="addressLine1" defaultValue={project.addressLine1 ?? ""} placeholder="Street address" />
          </Field>
          <Field label="Address line 2">
            <Input name="addressLine2" defaultValue={project.addressLine2 ?? ""} placeholder="Suite, floor, unit" />
          </Field>
          <Field label="City">
            <Input name="city" defaultValue={project.city ?? ""} placeholder="City" />
          </Field>
          <Field label="State / region">
            <Input name="state" defaultValue={project.state ?? ""} placeholder="State or region" />
          </Field>
          <Field label="Postal code">
            <Input name="postalCode" defaultValue={project.postalCode ?? ""} placeholder="Postal code" />
          </Field>
          </>
          ) : (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 sm:col-span-2">
              Commercial, client, billing, and location fields require project budget permission.
            </div>
          )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-line bg-background px-4 text-sm font-semibold text-foreground hover:bg-panel-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-xl bg-primary px-4 text-sm font-bold text-[#111111] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Task detail slide-over ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TaskDetailPanel({
  currentUser,
  onClose,
  onDeleted,
  onUpdated,
  projectMembers,
  taskId,
  token,
}: {
  currentUser: AuthUser;
  onClose: () => void;
  onDeleted: (taskId: string) => void;
  onUpdated: (task: Task) => void;
  projectMembers: ProjectMember[];
  taskId: string;
  token: string;
}) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [checklists, setChecklists] = useState<TaskChecklist[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [taskLabels, setTaskLabels] = useState<TaskLabelAssignment[]>([]);
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const setMessage = useToastMessageDispatcher();
  const [newLabelColor, setNewLabelColor] = useState("#ffd400");
  const { confirm } = useConfirm();

  const loadTask = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [
        taskData,
        commentData,
        checklistData,
        activityData,
        labelData,
        taskLabelData,
        assigneeData,
      ] = await Promise.all([
        getTask(token, taskId),
        listTaskComments(token, taskId),
        listTaskChecklists(token, taskId),
        listTaskActivities(token, taskId),
        listLabels(token),
        listTaskLabels(token, taskId),
        listTaskAssignees(token, taskId),
      ]);
      setTask(taskData);
      setComments(commentData);
      setChecklists(checklistData);
      setActivities(activityData);
      setLabels(labelData);
      setTaskLabels(taskLabelData);
      setAssignees(assigneeData);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to load task.");
    } finally {
      setLoading(false);
    }
  }, [taskId, token]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTask(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadTask]);

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task) return;
    const fd = new FormData(event.currentTarget);
    const dueDate = String(fd.get("dueDate") || "");
    const status = fd.get("status") as TaskStatus;
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateTask(token, task.id, {
        title: String(fd.get("title") || ""),
        description: String(fd.get("description") || ""),
        status,
        priority: fd.get("priority") as TaskPriority,
        dueDate: dueDate ? toNoonIso(dueDate) : undefined,
        storyPoints: Number(fd.get("storyPoints") || 0) || undefined,
        estimateMins: Number(fd.get("estimateHours") || 0)
          ? Number(fd.get("estimateHours") || 0) * 60
          : undefined,
        completedAt:
          status === "DONE" ? (task.completedAt ?? new Date().toISOString()) : undefined,
      });
      setTask(updated);
      onUpdated(updated);
      setMessage("Task updated.");
      void loadTask();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update task.");
    } finally {
      setSaving(false);
    }
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") || "");
    if (!body.trim()) return;
    setSaving(true);
    try {
      const comment = await createTaskComment(token, taskId, { body });
      setComments((current) => [...current, comment]);
      form.reset();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to add comment.");
    } finally {
      setSaving(false);
    }
  }

  async function addChecklist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = String(new FormData(form).get("title") || "");
    if (!title.trim()) return;
    setSaving(true);
    try {
      const checklist = await createTaskChecklist(token, taskId, { title });
      setChecklists((current) => [...current, checklist]);
      form.reset();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to create checklist.");
    } finally {
      setSaving(false);
    }
  }

  async function addChecklistItem(event: FormEvent<HTMLFormElement>, checklistId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const text = String(new FormData(form).get("text") || "");
    if (!text.trim()) return;
    setSaving(true);
    try {
      const item = await createTaskChecklistItem(token, taskId, checklistId, { text });
      setChecklists((current) =>
        current.map((cl) =>
          cl.id === checklistId ? { ...cl, items: [...cl.items, item] } : cl,
        ),
      );
      form.reset();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to add item.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleChecklistItem(checklistId: string, itemId: string, isDone: boolean) {
    try {
      const updated = await updateTaskChecklistItem(token, taskId, checklistId, itemId, {
        isDone,
      });
      setChecklists((current) =>
        current.map((cl) =>
          cl.id === checklistId
            ? { ...cl, items: cl.items.map((it) => (it.id === itemId ? updated : it)) }
            : cl,
        ),
      );
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update item.");
    }
  }

  async function archiveTask() {
    if (!task) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateTask(token, task.id, {
        status: "CANCELLED",
        completedAt: null,
      });
      setTask(updated);
      onUpdated(updated);
      setMessage("Task archived.");
      void loadTask();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to archive task.");
    } finally {
      setSaving(false);
    }
  }

  async function reopenTask() {
    if (!task) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateTask(token, task.id, {
        status: "TODO",
        completedAt: null,
      });
      setTask(updated);
      onUpdated(updated);
      setMessage("Task reopened.");
      void loadTask();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to reopen task.");
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
    setMessage("");
    try {
      const assignee = await addTaskAssignee(token, taskId, userId);
      setAssignees((current) => mergeAssignee(current, assignee));
      form.reset();
      void loadTask();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to assign user.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAssignee(userId: string) {
    setSaving(true);
    setMessage("");
    try {
      await removeTaskAssignee(token, taskId, userId);
      setAssignees((current) => current.filter((assignee) => assignee.user.id !== userId));
      void loadTask();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to remove assignee.");
    } finally {
      setSaving(false);
    }
  }

  async function addExistingLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const labelId = String(new FormData(form).get("labelId") || "");
    if (!labelId) return;
    setSaving(true);
    setMessage("");
    try {
      const assignment = await assignTaskLabel(token, taskId, labelId);
      setTaskLabels((current) => mergeLabelAssignment(current, assignment));
      form.reset();
      void loadTask();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to add label.");
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
    setMessage("");
    try {
      const label = await createLabel(token, {
        name,
        color: String(fd.get("color") || newLabelColor),
      });
      setLabels((current) => mergeLabel(current, label));
      const assignment = await assignTaskLabel(token, taskId, label.id);
      setTaskLabels((current) => mergeLabelAssignment(current, assignment));
      setNewLabelColor("#ffd400");
      form.reset();
      void loadTask();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to create label.");
    } finally {
      setSaving(false);
    }
  }

  async function unassignLabel(labelId: string) {
    setSaving(true);
    setMessage("");
    try {
      await removeTaskLabel(token, taskId, labelId);
      setTaskLabels((current) => current.filter((item) => item.label.id !== labelId));
      void loadTask();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to remove label.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTask() {
    if (!task) return;
    const confirmed = await confirm({
      title: "Delete task?",
      description: `Delete ${task.key}? This removes the task where your permissions and backend rules allow it.`,
      confirmLabel: "Delete task",
      tone: "danger",
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      await deleteTask(token, task.id);
      onDeleted(task.id);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to delete task.");
    } finally {
      setSaving(false);
    }
  }

  const assignedLabelIds = new Set(taskLabels.map((item) => item.label.id));
  const availableLabels = labels.filter((label) => !assignedLabelIds.has(label.id));
  const assignedUserIds = new Set(assignees.map((assignee) => assignee.user.id));
  const candidateUsers = uniqueUsers([
    ...projectMembers.map((member) => member.user),
    ...assignees.map((assignee) => assignee.user),
    authUserToSummary(currentUser),
  ]);
  const assignableUsers = candidateUsers.filter((candidate) => !assignedUserIds.has(candidate.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <aside className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line bg-panel px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-primary">Task</p>
            <h2 className="mt-0.5 text-lg font-bold text-foreground">
              {task?.key ?? "Loading…"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-line bg-background text-ink-soft transition hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 tb-scrollbar">
          {loading && <PageLoading compact />}
          {!loading && task && (
            <div className="grid gap-5">
              {/* Edit form */}
              <Card title="Details">
                <form onSubmit={saveTask} className="grid gap-3">
                  <Field label="Title">
                    <Input name="title" defaultValue={task.title} required />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Status">
                      <select
                        className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground"
                        name="status"
                        defaultValue={task.status}
                      >
                        {lifecycleTaskStatuses.map((s) => (
                          <option key={s} value={s}>
                            {taskStatusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Priority">
                      <select
                        className="h-10 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground"
                        name="priority"
                        defaultValue={task.priority}
                      >
                        {(Object.keys(priorityLabels) as TaskPriority[]).map((p) => (
                          <option key={p} value={p}>
                            {priorityLabels[p]}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Due date">
                      <Input
                        name="dueDate"
                        type="date"
                        defaultValue={dateInputValue(task.dueDate)}
                      />
                    </Field>
                    <Field label="Story points">
                      <Input
                        min={0}
                        name="storyPoints"
                        type="number"
                        defaultValue={task.storyPoints ?? ""}
                      />
                    </Field>
                    <Field label="Estimate (hours)">
                      <Input
                        min={0}
                        name="estimateHours"
                        type="number"
                        defaultValue={
                          task.estimateMins ? Math.round(task.estimateMins / 60) : ""
                        }
                      />
                    </Field>
                  </div>
                  <label className="grid gap-1 text-xs font-semibold text-ink-soft">
                    Description
                    <textarea
                      className="min-h-24 rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground resize-none"
                      name="description"
                      defaultValue={task.description ?? ""}
                    />
                  </label>
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {task.status === "CANCELLED" ? (
                        <button
                          type="button"
                          onClick={() => void reopenTask()}
                          disabled={saving}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-panel px-3 text-sm font-semibold text-foreground transition hover:bg-panel-muted disabled:opacity-60"
                        >
                          <RotateCcw className="size-3.5" aria-hidden="true" />
                          Reopen
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void archiveTask()}
                          disabled={saving}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-panel px-3 text-sm font-semibold text-foreground transition hover:bg-panel-muted disabled:opacity-60"
                        >
                          <Archive className="size-3.5" aria-hidden="true" />
                          Archive
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void removeTask()}
                        disabled={saving}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-9 rounded-xl bg-primary px-4 text-sm font-bold text-[#111111] disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save task"}
                    </button>
                  </div>
                </form>
              </Card>

              {/* Assignees */}
              <Card title="Assignees">
                <div className="grid gap-2">
                  {assignees.map((assignee) => (
                    <div
                      key={assignee.id}
                      className="flex items-center gap-2.5 rounded-xl border border-line bg-background p-2.5"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#111111] text-[10px] font-black text-white">
                        {userInitials(assignee.user)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">
                          {displayUserName(assignee.user)}
                        </p>
                        <p className="truncate text-xs text-ink-soft">{assignee.user.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeAssignee(assignee.user.id)}
                        disabled={saving}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        aria-label="Remove assignee"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  {!assignees.length && <Empty label="No assignees yet." />}
                </div>
                <form onSubmit={addAssignee} className="mt-3 flex gap-2">
                  <select
                    name="userId"
                    defaultValue=""
                    disabled={!assignableUsers.length}
                    className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-background px-3 text-sm text-foreground disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {assignableUsers.length ? "Select project member" : "No users available"}
                    </option>
                    {assignableUsers.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {displayUserName(candidate)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={saving || !assignableUsers.length}
                    className="h-10 rounded-xl bg-primary px-3 text-sm font-bold text-[#111111] disabled:opacity-60"
                  >
                    Assign
                  </button>
                </form>
              </Card>

              {/* Labels */}
              <Card title="Labels">
                <div className="flex flex-wrap gap-2">
                  {taskLabels.map((assignment) => (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => void unassignLabel(assignment.label.id)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black transition hover:opacity-75 disabled:opacity-50"
                      style={{
                        borderColor: `${assignment.label.color ?? "#ffd400"}55`,
                        background: `${assignment.label.color ?? "#ffd400"}18`,
                        color: assignment.label.color ?? "#111111",
                      }}
                      title="Remove label"
                    >
                      {assignment.label.name}
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  ))}
                  {!taskLabels.length && <Empty label="No labels yet." />}
                </div>
                <form onSubmit={addExistingLabel} className="mt-3 flex gap-2">
                  <select
                    name="labelId"
                    defaultValue=""
                    disabled={!availableLabels.length}
                    className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-background px-3 text-sm text-foreground disabled:opacity-60"
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
                    className="h-10 rounded-xl border border-line bg-panel px-3 text-sm font-bold text-foreground hover:bg-panel-muted disabled:opacity-60"
                  >
                    Add
                  </button>
                </form>
                <form onSubmit={createAndAssignLabel} className="mt-3 grid gap-2">
                  <Input name="name" placeholder="New label" required />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {["#ffd400", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#f97316"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewLabelColor(color)}
                          className={cn(
                            "size-6 rounded-full border transition",
                            newLabelColor === color
                              ? "border-foreground ring-2 ring-primary/40"
                              : "border-line",
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
                      className="h-9 rounded-xl bg-primary px-3 text-sm font-bold text-[#111111] disabled:opacity-60"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </Card>

              {/* Comments */}
              <Card title="Comments">
                <div className="grid gap-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-line bg-background p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#172026] text-[10px] font-bold text-white">
                          {userInitials(comment.author)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {`${comment.author.firstName} ${comment.author.lastName}`.trim() ||
                              comment.author.email}
                          </p>
                          <p className="text-xs text-ink-soft">
                            {formatShortDate(comment.createdAt)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2.5 whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {comment.body}
                      </p>
                    </div>
                  ))}
                  {!comments.length && <Empty label="No comments yet." />}
                </div>
                <form onSubmit={addComment} className="mt-3 grid gap-2">
                  <textarea
                    className="min-h-20 rounded-xl border border-line bg-background px-3 py-2 text-sm text-foreground resize-none"
                    name="body"
                    placeholder="Write a comment…"
                    required
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-9 w-fit rounded-xl bg-primary px-4 text-sm font-bold text-[#111111] disabled:opacity-60"
                  >
                    Add comment
                  </button>
                </form>
              </Card>

              {/* Checklists */}
              <Card title="Checklists">
                <div className="grid gap-3">
                  {checklists.map((cl) => (
                    <div key={cl.id} className="rounded-xl border border-line bg-background p-3">
                      <h4 className="text-sm font-bold text-foreground">{cl.title}</h4>
                      <div className="mt-2.5 grid gap-2">
                        {cl.items.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2.5 text-sm text-foreground"
                          >
                            <input
                              type="checkbox"
                              checked={item.isDone}
                              onChange={(e) =>
                                void toggleChecklistItem(cl.id, item.id, e.target.checked)
                              }
                              className="rounded"
                            />
                            <span className={cn(item.isDone && "text-ink-soft line-through")}>
                              {item.text}
                            </span>
                          </label>
                        ))}
                      </div>
                      <form
                        onSubmit={(e) => void addChecklistItem(e, cl.id)}
                        className="mt-3 flex gap-2"
                      >
                        <Input name="text" placeholder="Add item" required className="flex-1" />
                        <button
                          type="submit"
                          className="h-10 rounded-xl border border-line bg-panel px-3 text-sm font-semibold text-foreground hover:bg-panel-muted"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
                <form onSubmit={addChecklist} className="mt-3 flex gap-2">
                  <Input name="title" placeholder="New checklist title" required className="flex-1" />
                  <button
                    type="submit"
                    className="h-10 rounded-xl bg-primary px-3 text-sm font-bold text-[#111111]"
                  >
                    Create
                  </button>
                </form>
              </Card>

              {/* Activity */}
              <Card title="Activity">
                <div className="grid gap-2">
                  {activities.slice(0, 10).map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-xl border border-line bg-background px-3 py-2.5"
                    >
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {formatShortDate(activity.createdAt)}
                      </p>
                    </div>
                  ))}
                  {!activities.length && <Empty label="No activity yet." />}
                </div>
              </Card>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function Card({
  action,
  children,
  className,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-panel shadow-sm",
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function InlineKPI({
  color,
  label,
  sub,
  value,
}: {
  color: string;
  label: string;
  sub: string;
  value: string | number;
}) {
  return (
    <div className="border-r border-white/[0.08] px-4 py-3 last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 text-lg font-black leading-none" style={{ color }}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-white/30">{sub}</p>
    </div>
  );
}

function FinanceKPI({
  accent,
  label,
  value,
}: {
  accent?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-background p-3">
      <p className="text-xs font-semibold text-ink-soft">{label}</p>
      <p
        className="mt-1.5 text-xl font-black text-foreground"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm last:border-0">
      <span className="text-ink-soft">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function InfoTile({ className, label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={cn("rounded-xl border border-line bg-background px-3 py-2.5", className)}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-ink-soft">
      {label}
      {children}
    </label>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 min-w-0 rounded-lg border border-line bg-background px-3 text-sm text-foreground placeholder:text-ink-soft",
        className,
      )}
    />
  );
}

function FormActions({
  onCancel,
  saving,
  submitLabel,
}: {
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="submit"
        disabled={saving}
        className="h-9 rounded-lg bg-primary px-4 text-sm font-bold text-[#111111] disabled:opacity-60"
      >
        {saving ? "Saving..." : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="h-9 rounded-lg border border-line bg-panel px-4 text-sm font-medium text-foreground hover:bg-panel-muted"
      >
        Cancel
      </button>
    </div>
  );
}

function useToastMessageDispatcher() {
  const { toast } = useToast();

  return useCallback(
    (message: string) => {
      const description = message.trim();
      if (!description) return;

      const variant = toastVariantFromMessage(description);
      toast({
        title:
          variant === "error"
            ? "Action failed"
            : variant === "warning"
              ? "Check required"
              : "Done",
        description,
        variant,
      });
    },
    [toast],
  );
}

function toastVariantFromMessage(message: string): "success" | "error" | "warning" | "info" {
  if (/unable|failed|not found|cannot|do not have permission|role cannot|unavailable|error/i.test(message)) {
    return "error";
  }
  if (/required|select|missing|limit|archived/i.test(message)) {
    return "warning";
  }
  if (/created|updated|saved|applied|restored|removed|deleted|corrected|recorded|added|reopened|complete|assigned/i.test(message)) {
    return "success";
  }
  return "info";
}

function Empty({
  className,
  icon: Icon,
  label,
}: {
  className?: string;
  icon?: LucideIcon;
  label: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-line bg-background px-4 py-6 text-center",
        className,
      )}
    >
      {Icon && <Icon className="mx-auto mb-2 size-6 text-ink-soft" aria-hidden="true" />}
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function PageLoading({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("grid gap-4", compact ? "" : "mx-auto max-w-[1400px]")}>
      {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-panel-muted" />
      ))}
    </div>
  );
}

// ─── Pure utilities ───────────────────────────────────────────────────────────

function normalizeSavedWorkFilters(value: Record<string, unknown>): Partial<WorkFilters> {
  const normalized: Partial<WorkFilters> = {};
  for (const key of Object.keys(defaultWorkFilters) as Array<keyof WorkFilters>) {
    const raw = value[key];
    if (typeof defaultWorkFilters[key] === "boolean") {
      normalized[key] = Boolean(raw) as never;
    } else if (typeof raw === "string") {
      normalized[key] = raw as never;
    }
  }
  return normalized;
}

function taskQueryFromFilters(projectId: string, filters: WorkFilters): Parameters<typeof listTasks>[1] {
  return {
    projectId,
    limit: 100,
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    type: filters.type || undefined,
    assigneeId: filters.assigneeId || undefined,
    dueFrom: filters.dueFrom ? toNoonIso(filters.dueFrom) : undefined,
    dueTo: filters.dueTo ? toNoonIso(filters.dueTo) : undefined,
    storyPointsMin: filters.storyPointsMin ? Number(filters.storyPointsMin) : undefined,
    storyPointsMax: filters.storyPointsMax ? Number(filters.storyPointsMax) : undefined,
    hasAttachments: filters.hasAttachments || undefined,
    hasDependencies: filters.hasDependencies || undefined,
    isBlocked: filters.isBlocked || undefined,
    isBlocking: filters.isBlocking || undefined,
    includeArchived: filters.includeArchived || undefined,
    includeDeleted: filters.includeDeleted || undefined,
    isOverdue: filters.isOverdue || undefined,
    unassigned: filters.unassigned || undefined,
    sortBy: filters.sortBy,
    sortDirection: filters.sortDirection,
  };
}

function sortTasks(tasks: Task[], filters: WorkFilters = defaultWorkFilters) {
  const w: Record<TaskPriority, number> = {
    CRITICAL: 5,
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };
  return [...tasks].sort((a, b) => {
    const direction = filters.sortDirection === "asc" ? 1 : -1;
    if (filters.sortBy === "priority") return (w[a.priority] - w[b.priority]) * direction;
    if (filters.sortBy === "status") return (taskStatusOrder.indexOf(a.status) - taskStatusOrder.indexOf(b.status)) * direction;
    if (filters.sortBy === "storyPoints") return ((a.storyPoints ?? 0) - (b.storyPoints ?? 0)) * direction;
    if (filters.sortBy === "title") return a.title.localeCompare(b.title) * direction;
    if (filters.sortBy === "sprintName") return (a.sprint?.name ?? "Backlog").localeCompare(b.sprint?.name ?? "Backlog") * direction;
    if (filters.sortBy === "dueDate") {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return (aDue - bDue) * direction;
    }
    const field = filters.sortBy === "createdAt" ? "createdAt" : "updatedAt";
    const aTime = a[field] ? new Date(a[field]).getTime() : 0;
    const bTime = b[field] ? new Date(b[field]).getTime() : 0;
    return (aTime - bTime) * direction;
  });
}

function compareMilestones(a: ProjectMilestone, b: ProjectMilestone) {
  const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
  const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
  return at - bt;
}

function toNoonIso(date: string) {
  return new Date(`${date}T12:00:00`).toISOString();
}

function dateInputValue(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

function optionalNumber(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDateTime(value?: string | null) {
  if (!value) return "No date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(d);
}

function humanAction(action: string) {
  return action
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function displayUserName(user: UserSummary) {
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function projectLocationLabel(project: Project) {
  return [project.locationName, project.city, project.state, project.country]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(", ");
}

function projectAddressLabel(project: Project) {
  return [project.addressLine1, project.addressLine2, project.city, project.state, project.postalCode, project.country]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(", ");
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

function uniqueUsers(users: UserSummary[]) {
  const byId = new Map<string, UserSummary>();
  users.forEach((user) => byId.set(user.id, user));
  return [...byId.values()].sort((a, b) => displayUserName(a).localeCompare(displayUserName(b)));
}

function mergeAssignee(current: TaskAssignee[], next: TaskAssignee) {
  return current.some((item) => item.user.id === next.user.id)
    ? current.map((item) => (item.user.id === next.user.id ? next : item))
    : [...current, next];
}

function mergeLabel(current: TaskLabel[], next: TaskLabel) {
  return current.some((item) => item.id === next.id)
    ? current.map((item) => (item.id === next.id ? next : item))
    : [...current, next].sort((a, b) => a.name.localeCompare(b.name));
}

function mergeLabelAssignment(current: TaskLabelAssignment[], next: TaskLabelAssignment) {
  return current.some((item) => item.label.id === next.label.id)
    ? current.map((item) => (item.label.id === next.label.id ? next : item))
    : [...current, next];
}

function formatMoney(value: number, currency?: string | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
