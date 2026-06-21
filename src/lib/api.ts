import type { paths } from "@/lib/generated/openapi";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4070/api/v1";

function normalizeApiBaseUrl(value: string) {
  return value
    .trim()
    .replace(/\/$/, "")
    .replace(/\/api$/, "/api/v1");
}

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `tb-fe-${crypto.randomUUID()}`;
  }

  return `tb-fe-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const API_BASE_URL = normalizeApiBaseUrl(configuredApiUrl);
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+$/i, "");
export const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_URL ?? API_ORIGIN).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "taskbricks.accessToken";
const LEGACY_REFRESH_TOKEN_KEY = "taskbricks.refreshToken";
const USER_KEY = "taskbricks.user";
const LEGACY_TRUSTED_DEVICE_KEY = "taskbricks.trustedDeviceToken";
export const AUTH_UPDATED_EVENT = "taskbricks.auth.updated";

export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  timezone?: string | null;
  locale?: string | null;
  status: string;
  roles: string[];
  permissions: string[];
  isPlatformAdmin?: boolean;
  platformAdminLevel?: PlatformAdminLevel | null;
  platformAdminScopes?: string[];
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
  trustedDeviceToken?: string;
};

export type MfaChallengeResponse = {
  requiresMfa: true;
  mfaToken: string;
  methods: string[];
  expiresAt: string;
  message: string;
};

export type AuthLifecycleResponse = {
  success: boolean;
  message: string;
  email?: string;
  tenantSlug?: string;
  requiresEmailVerification?: boolean;
  devLink?: string;
};

export type StoredAuth = {
  accessToken: string;
  user: AuthUser;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type MetaPaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type ProjectStakeholderInfluence = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ProjectDependencyStatus = "OPEN" | "BLOCKED" | "RESOLVED" | "CANCELLED";
export type ProjectDecisionStatus = "PROPOSED" | "DECIDED" | "SUPERSEDED" | "REOPENED";
export type ProjectChangeRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "IMPLEMENTED"
  | "CANCELLED";
export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "TESTING"
  | "DONE"
  | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
export type TaskType =
  | "TASK"
  | "BUG"
  | "STORY"
  | "EPIC"
  | "FEATURE"
  | "INCIDENT"
  | "APPROVAL"
  | "CHANGE_REQUEST"
  | "MILESTONE";
export type Visibility = "PRIVATE" | "TEAM" | "WORKSPACE" | "ORGANIZATION" | "PUBLIC";
export type DocumentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type CustomFieldType =
  | "TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "CURRENCY"
  | "DATE"
  | "DATETIME"
  | "BOOLEAN"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "USER"
  | "PROJECT"
  | "TASK"
  | "URL"
  | "EMAIL"
  | "PHONE"
  | "JSON";
export type SearchCategory =
  | "all"
  | "projects"
  | "tasks"
  | "files"
  | "people"
  | "teams"
  | "workspaces"
  | "messages";
export type GlobalSearchResultType =
  | "PROJECT"
  | "TASK"
  | "FILE"
  | "USER"
  | "TEAM"
  | "WORKSPACE"
  | "MESSAGE";

export type GlobalSearchResult = {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle?: string | null;
  url: string;
  score: number;
  updatedAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type GlobalSearchResponse = PaginatedResponse<GlobalSearchResult> & {
  facets: Partial<Record<GlobalSearchResultType, number>>;
  query: {
    search: string;
    category: SearchCategory;
    contextType?: string;
    contextId?: string;
  };
};

export type Workspace = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  _count?: {
    teams?: number;
    projects?: number;
  };
};

export type Team = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  workspaceId?: string | null;
  workspace?: Pick<Workspace, "id" | "name" | "slug"> | null;
  _count?: {
    members?: number;
    projects?: number;
  };
};

export type TeamMember = {
  id: string;
  teamId: string;
  userId: string;
  role?: string | null;
  createdAt?: string;
  user: UserSummary & {
    roles?: Array<{
      role: Role;
    }>;
  };
};

export type Permission = {
  id: string;
  action: string;
  subject: string;
  description?: string | null;
  createdAt?: string;
};

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
  permissions?: Array<{
    permission: Permission;
  }>;
  _count?: {
    users?: number;
  };
};

export type TenantUser = UserSummary & {
  tenantId: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  timezone?: string | null;
  locale?: string | null;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  roles?: Array<{
    role: Pick<Role, "id" | "name" | "description" | "isSystem">;
  }>;
};

export type BulkInviteUserInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  roleIds?: string[];
};

export type BulkInviteUsersResponse = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  inviteDelivery: string;
  results: Array<{
    email: string;
    status: "CREATED" | "UPDATED" | "SKIPPED" | "FAILED";
    userId: string | null;
    message: string;
  }>;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  website?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users?: number;
    workspaces?: number;
    teams?: number;
    projects?: number;
    integrations?: number;
    auditLogs?: number;
    securityEvents?: number;
  };
};

export type Project = {
  id: string;
  tenantId?: string;
  key: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  visibility?: Visibility;
  progress: number;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  currency?: string | null;
  contractValue?: number | string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  locationName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  timezone?: string | null;
  billingCode?: string | null;
  costCenter?: string | null;
  financeRedacted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  teamId?: string | null;
  workspaceId?: string | null;
  workspace?: Pick<Workspace, "id" | "name" | "slug">;
  team?: Pick<Team, "id" | "name"> | null;
  _count?: {
    tasks?: number;
    members?: number;
    milestones?: number;
    risks?: number;
    budgets?: number;
    stakeholders?: number;
    dependencies?: number;
    decisions?: number;
    changeRequests?: number;
    documents?: number;
    sprints?: number;
  };
  permissions?: ProjectPermissionMatrix;
};

export type ProjectMember = {
  id: string;
  role?: string | null;
  createdAt?: string;
  user: UserSummary;
};

export type DocumentFolder = {
  id: string;
  tenantId: string;
  parentId?: string | null;
  name: string;
  description?: string | null;
  createdById?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  children?: DocumentFolder[];
  _count?: {
    children?: number;
    documents?: number;
  };
};

export type WorkspaceDocument = {
  id: string;
  tenantId: string;
  projectId?: string | null;
  folderId?: string | null;
  slug?: string | null;
  title: string;
  summary?: string | null;
  body?: string | null;
  documentType: string;
  status: DocumentStatus;
  visibility: Visibility;
  tags?: string[] | null;
  createdById?: string | null;
  updatedById?: string | null;
  publishedAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: Pick<Project, "id" | "key" | "name"> | null;
  folder?: Pick<DocumentFolder, "id" | "name" | "parentId"> | null;
  _count?: {
    versions?: number;
  };
};

export type DocumentVersion = {
  id: string;
  documentId: string;
  version: number;
  title?: string | null;
  body?: string | null;
  summary?: string | null;
  visibility?: Visibility | null;
  status?: DocumentStatus | null;
  projectId?: string | null;
  folderId?: string | null;
  tags?: string[] | null;
  changeNote?: string | null;
  createdById?: string | null;
  createdAt: string;
};

export type DocumentPayload = {
  projectId?: string;
  folderId?: string;
  slug?: string;
  title: string;
  summary?: string;
  body?: string;
  documentType?: string;
  status?: DocumentStatus;
  visibility?: Visibility;
  tags?: string[];
  changeNote?: string;
};

export type ProjectPermissionAction =
  | "viewProject"
  | "editProject"
  | "archiveProject"
  | "restoreProject"
  | "deleteProject"
  | "manageMembers"
  | "manageMilestones"
  | "manageRisks"
  | "viewBudget"
  | "manageBudget"
  | "createTasks"
  | "editTasks"
  | "moveTasks"
  | "deleteTasks"
  | "commentTasks"
  | "viewBoard"
  | "manageBoardColumns"
  | "manageSprints"
  | "manageFiles"
  | "viewPrivateFiles";

export type ProjectPermissionMatrix = {
  projectId: string;
  key: string;
  name: string;
  status: ProjectStatus;
  visibility: Visibility;
  accessLevel: string;
  source: string;
  projectRole?: string | null;
  teamRole?: string | null;
  actions: Record<ProjectPermissionAction, boolean>;
  roles: Array<{
    role: string;
    accessLevel: string;
    description: string;
  }>;
};

export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectRisk = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  severity?: TaskPriority | null;
  mitigation?: string | null;
  isOpen: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectBudget = {
  id: string;
  projectId: string;
  currency?: string | null;
  planned?: number | string | null;
  actual?: number | string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectStakeholder = {
  id: string;
  projectId: string;
  name: string;
  email?: string | null;
  organization?: string | null;
  role?: string | null;
  influence: ProjectStakeholderInfluence;
  isExternal: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectDependency = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  dependencyType?: string | null;
  status: ProjectDependencyStatus;
  ownerName?: string | null;
  ownerEmail?: string | null;
  dueDate?: string | null;
  resolvedAt?: string | null;
  externalUrl?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectDecision = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: ProjectDecisionStatus;
  ownerName?: string | null;
  ownerEmail?: string | null;
  decidedAt?: string | null;
  effectiveAt?: string | null;
  outcome?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectChangeRequest = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  reason?: string | null;
  status: ProjectChangeRequestStatus;
  requestedByName?: string | null;
  requestedByEmail?: string | null;
  approvedByName?: string | null;
  approvedByEmail?: string | null;
  budgetImpact?: number | string | null;
  scheduleImpactDays?: number | null;
  scopeImpact?: string | null;
  riskImpact?: string | null;
  dueDate?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  implementedAt?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UserSummary = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  status?: string;
};

export type TaskLabel = {
  id: string;
  tenantId?: string;
  name: string;
  color?: string | null;
  createdAt?: string;
  _count?: {
    tasks?: number;
  };
};

export type TaskLabelAssignment = {
  id: string;
  label: TaskLabel;
};

export type TaskAssignee = {
  id: string;
  user: UserSummary;
};

export type TaskWatcher = {
  id: string;
  userId?: string;
  user?: UserSummary | null;
};

export type TaskDueState = "NONE" | "OVERDUE" | "TODAY" | "UPCOMING" | "DONE";

export type TaskBoardCardSummary = {
  key: string;
  code: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  colors: {
    status: string;
    priority: string;
    type: string;
    rail: string;
  };
  sprint?: {
    id: string;
    name: string;
    startDate?: string | null;
    endDate?: string | null;
    completedAt?: string | null;
    state: "PLANNED" | "ACTIVE" | "ENDED" | "COMPLETED" | "UNSCHEDULED" | string;
  } | null;
  assignees: Array<{
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  }>;
  labels: Array<{
    id: string;
    labelId: string;
    name: string;
    color?: string | null;
  }>;
  due: {
    state: TaskDueState;
    date?: string | null;
    daysUntil?: number | null;
  };
  storyPoints?: number | null;
  estimate: {
    estimateMins?: number | null;
    actualMins?: number | null;
    remainingMins?: number | null;
  };
  checklist: {
    checklistCount: number;
    total: number;
    completed: number;
    percent: number;
  };
  comments: {
    count: number;
    latest?: {
      id: string;
      body: string;
      authorId: string;
      author: UserSummary;
      createdAt: string;
    } | null;
  };
  attachments: {
    count: number;
    previews: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      mimeType?: string | null;
      sizeBytes?: number | null;
      kind: "IMAGE" | "PDF" | "SHEET" | "SLIDE" | "DOC" | "VIDEO" | "AUDIO" | "FILE" | string;
      createdAt: string;
    }>;
  };
  dependencies: {
    isBlocked: boolean;
    isBlocking: boolean;
    blockedByCount: number;
    blockingCount: number;
    blockers: Array<{
      id: string;
      type: string;
      task: TaskReferenceSummary;
    }>;
    blocking: Array<{
      id: string;
      type: string;
      task: TaskReferenceSummary;
    }>;
  };
  flags: {
    isBlocked: boolean;
    isBlocking: boolean;
    isOverdue: boolean;
    isDueToday: boolean;
    isHighPriority: boolean;
    hasAssignees: boolean;
    hasLabels: boolean;
    hasComments: boolean;
    hasAttachments: boolean;
    hasChecklist: boolean;
    hasSubtasks: boolean;
    isStale: boolean;
  };
  freshness: {
    createdAgeDays: number;
    updatedAgeDays: number;
    updatedAt: string;
  };
};

export type TaskBoardMetrics = {
  storyPoints: number;
  estimateMins: number;
  actualMins: number;
  remainingMins: number;
  commentCount: number;
  attachmentCount: number;
  checklistTotal: number;
  checklistCompleted: number;
  blockedByCount: number;
  blockingCount: number;
  ageDays: number;
  updatedAgeDays: number;
};

export type TaskReferenceSummary = {
  id: string;
  key: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
};

export type TaskBoardPermissions = {
  canView: boolean;
  canEdit: boolean;
  canMove: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canComment: boolean;
  canAttach: boolean;
};

export type Task = {
  id: string;
  tenantId?: string;
  projectId: string;
  sprintId?: string | null;
  boardColumnId?: string | null;
  key: string;
  title: string;
  description?: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  storyPoints?: number | null;
  estimateMins?: number | null;
  actualMins?: number | null;
  sortOrder: number;
  archivedAt?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  project?: Pick<Project, "id" | "key" | "name" | "workspaceId" | "teamId">;
  boardColumn?: Pick<BoardColumn, "id" | "name" | "status" | "sortOrder"> | null;
  sprint?: {
    id: string;
    name: string;
    startDate?: string | null;
    endDate?: string | null;
    completedAt?: string | null;
  } | null;
  assignees?: TaskAssignee[];
  reporter?: UserSummary | null;
  labels?: TaskLabelAssignment[];
  checklists?: TaskChecklist[];
  card?: TaskBoardCardSummary;
  metrics?: TaskBoardMetrics;
  permissions?: TaskBoardPermissions;
  _count?: {
    comments?: number;
    attachments?: number;
    subtasks?: number;
    checklists?: number;
    dependenciesFrom?: number;
    dependenciesTo?: number;
  };
};

export type TaskTaxonomy = {
  taskTypes: Array<{
    value: TaskType;
    label: string;
    category: string;
    workflow: TaskStatus[];
  }>;
  statuses: TaskStatus[];
  priorities: TaskPriority[];
  dependencyTypes: Array<{
    value: string;
    label: string;
    inverseLabel: string;
  }>;
  sortFields: string[];
  customFieldEntityTypes: string[];
};

export type CustomFieldOption = {
  id: string;
  customFieldId: string;
  label: string;
  value: string;
  sortOrder: number;
};

export type CustomField = {
  id: string;
  tenantId: string;
  workspaceId?: string | null;
  projectId?: string | null;
  entityType: string;
  name: string;
  type: CustomFieldType;
  required: boolean;
  config?: Record<string, unknown> | null;
  sortOrder: number;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  options?: CustomFieldOption[];
};

export type TaskSavedView = {
  id: string;
  tenantId: string;
  ownerId: string;
  projectId?: string | null;
  name: string;
  description?: string | null;
  visibility: Visibility;
  filters: Record<string, unknown>;
  columns?: Record<string, unknown> | null;
  sortBy?: string | null;
  sortDirection?: "asc" | "desc" | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: UserSummary;
  project?: Pick<Project, "id" | "key" | "name"> | null;
};

export type TaskComment = {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  author: UserSummary;
  _count?: {
    replies?: number;
  };
};

export type TaskChecklistItem = {
  id: string;
  checklistId: string;
  text: string;
  isDone: boolean;
  sortOrder: number;
};

export type TaskChecklist = {
  id: string;
  taskId: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  items: TaskChecklistItem[];
};

export type TaskActivity = {
  id: string;
  taskId: string;
  actorId?: string | null;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
};

export type TaskAttachment = {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
};

export type FileAsset = {
  id: string;
  tenantId: string;
  uploadedById?: string | null;
  scope: string;
  entityType: string;
  entityId?: string | null;
  fileName: string;
  fileUrl: string;
  storageKey?: string | null;
  provider: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  visibility: Visibility;
  metadata?: unknown;
  archivedAt?: string | null;
  deletedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: UserSummary | null;
};

export type UploadIntent = {
  provider: "local" | "s3" | "cloudinary" | string;
  method: "POST" | "PUT" | string;
  uploadUrl?: string | null;
  fileUrl: string;
  storageKey: string;
  fields: Record<string, string | number>;
  headers: Record<string, string>;
  expiresAt: string;
  maxUploadBytes: number;
  bucket?: string;
  region?: string;
  note?: string;
  scope: string;
  entityType: string;
  entityId?: string | null;
  visibility: Visibility;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
};

export type TaskDependency = {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: string;
  fromTask?: Pick<Task, "id" | "key" | "title" | "status" | "priority" | "dueDate">;
  toTask?: Pick<Task, "id" | "key" | "title" | "status" | "priority" | "dueDate">;
};

export type BoardColumn = {
  id: string;
  boardId: string;
  name: string;
  status?: TaskStatus | null;
  wipLimit?: number | null;
  isCollapsed: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  taskCount?: number;
  isOverWipLimit?: boolean;
  metrics?: {
    taskCount: number;
    storyPoints: number;
    completedStoryPoints: number;
    estimateMins: number;
    actualMins: number;
    blockedCount: number;
    overdueCount: number;
    dueTodayCount: number;
    highPriorityCount: number;
    unassignedCount: number;
    completionRate: number;
    isOverWipLimit: boolean;
  };
  wip?: {
    limit?: number | null;
    used: number;
    remaining?: number | null;
    usagePercent?: number | null;
  };
  tasks?: Task[];
};

export type ProjectBoard = {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  columns: BoardColumn[];
  summary?: {
    taskCount: number;
    completedCount: number;
    openCount: number;
    cancelledCount: number;
    storyPoints: number;
    completedStoryPoints: number;
    estimateMins: number;
    actualMins: number;
    blockedCount: number;
    blockingCount: number;
    overdueCount: number;
    dueTodayCount: number;
    highPriorityCount: number;
    unassignedCount: number;
    completionRate: number;
    generatedAt: string;
  };
  permissions?: {
    canView: boolean;
    canCreateTask: boolean;
    canMoveTasks: boolean;
    canManageColumns: boolean;
    canManageSprints?: boolean;
    canEditBoard: boolean;
    canViewReports: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type Sprint = {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  project?: Pick<Project, "id" | "tenantId" | "key" | "name">;
  _count?: {
    tasks?: number;
    retrospectives?: number;
  };
};

export type MeetingStatus = "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "ARCHIVED";
export type MeetingTypeCategory =
  | "INTERNAL"
  | "CLIENT"
  | "SALES"
  | "SUPPORT"
  | "SPRINT"
  | "STANDUP"
  | "REVIEW"
  | "INTERVIEW"
  | "TRAINING"
  | "CUSTOM";
export type MeetingLocationMode = "IN_PERSON" | "ONLINE" | "HYBRID" | "PHONE" | "TBD";
export type MeetingApprovalStatus = "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";
export type MeetingAttendeeRole = "HOST" | "CO_HOST" | "REQUIRED" | "OPTIONAL" | "GUEST" | "OBSERVER";
export type MeetingAttendeeStatus = "INVITED" | "ACCEPTED" | "DECLINED" | "TENTATIVE" | "ATTENDED" | "NO_SHOW" | "REMOVED";
export type MeetingAgendaStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "SKIPPED";
export type MeetingReminderChannel = "IN_APP" | "EMAIL" | "WHATSAPP" | "SMS" | "WEBHOOK";
export type MeetingReminderStatus = "PENDING" | "SCHEDULED" | "SENT" | "FAILED" | "CANCELLED";
export type MeetingConferenceProvider =
  | "NONE"
  | "MANUAL"
  | "GOOGLE_CALENDAR"
  | "GOOGLE_MEET"
  | "MICROSOFT_TEAMS"
  | "ZOOM"
  | "CUSTOM_URL";
export type MeetingReminderJobStatus = "QUEUED" | "PROCESSING" | "SENT" | "FAILED" | "CANCELLED" | "DEAD_LETTER";
export type MeetingAvailabilityScope = "USER" | "TEAM" | "TENANT";
export type BookingPageScope = "TENANT" | "TEAM" | "USER";
export type BookingRoutingStrategy = "DIRECT_HOST" | "ROUND_ROBIN" | "LEAST_BUSY" | "PRIORITY" | "DEPARTMENT";
export type BookingFormFieldType =
  | "TEXT"
  | "LONG_TEXT"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DATE"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "BOOLEAN"
  | "URL";
export type BookingRequestStatus = "PENDING_APPROVAL" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "RESCHEDULED" | "EXPIRED";

export type MeetingType = {
  id: string;
  tenantId: string;
  createdById?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  category: MeetingTypeCategory;
  color?: string | null;
  icon?: string | null;
  durationMins: number;
  bufferBeforeMins: number;
  bufferAfterMins: number;
  locationMode: MeetingLocationMode;
  defaultVisibility: Visibility;
  requiresApproval: boolean;
  defaultAgenda?: string[] | null;
  defaultReminderMins: number[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    meetings?: number;
  };
};

export type MeetingAttendee = {
  id: string;
  tenantId: string;
  meetingId: string;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  role: MeetingAttendeeRole;
  status: MeetingAttendeeStatus;
  isExternal: boolean;
  responseNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: UserSummary | null;
};

export type MeetingAgendaItem = {
  id: string;
  tenantId: string;
  meetingId: string;
  ownerId?: string | null;
  title: string;
  notes?: string | null;
  status: MeetingAgendaStatus;
  durationMins?: number | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  owner?: UserSummary | null;
};

export type MeetingReminder = {
  id: string;
  tenantId: string;
  meetingId: string;
  attendeeId?: string | null;
  channel: MeetingReminderChannel;
  offsetMinutes: number;
  scheduledFor: string;
  status: MeetingReminderStatus;
  destination?: string | null;
  templateKey?: string | null;
  error?: string | null;
  sentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MeetingIntegrationSettings = {
  id: string;
  tenantId: string;
  defaultConferenceProvider: MeetingConferenceProvider;
  allowedConferenceProviders: MeetingConferenceProvider[];
  defaultReminderChannels: MeetingReminderChannel[];
  calendarSyncEnabled: boolean;
  emailRemindersEnabled: boolean;
  whatsappRemindersEnabled: boolean;
  smsRemindersEnabled: boolean;
  webhookEventsEnabled: boolean;
  requireApprovedWhatsappTemplates: boolean;
  publicBookingEnabled?: boolean;
  publicBookingCreatorPermissions?: string[];
  calendarConnectionPermissions?: string[];
  whatsappConnectionPermissions?: string[];
  defaultMeetingVisibility?: Visibility;
  allowExternalGuests?: boolean;
  requireApprovalForExternalGuests?: boolean;
  maxAdvanceBookingDays?: number;
  minBookingNoticeMins?: number;
  maxMeetingDurationMins?: number;
  aiMeetingProcessingEnabled?: boolean;
  manualLinkPolicy?: Record<string, unknown> | null;
  policyConfig?: Record<string, unknown> | null;
  providerConfig?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MeetingPolicy = Required<
  Pick<
    MeetingIntegrationSettings,
    | "id"
    | "tenantId"
    | "publicBookingEnabled"
    | "publicBookingCreatorPermissions"
    | "calendarConnectionPermissions"
    | "whatsappConnectionPermissions"
    | "defaultMeetingVisibility"
    | "allowExternalGuests"
    | "requireApprovalForExternalGuests"
    | "maxAdvanceBookingDays"
    | "minBookingNoticeMins"
    | "maxMeetingDurationMins"
    | "aiMeetingProcessingEnabled"
  >
> & {
  policyConfig?: Record<string, unknown> | null;
  updatedAt?: string;
};

export type MeetingAdminAnalytics = {
  range: { from: string; to: string };
  totals: {
    booked: number;
    completed: number;
    noShows: number;
    cancelled: number;
    live: number;
    scheduled: number;
    completionRate: number;
    noShowRate: number;
    cancellationRate: number;
    meetingToTaskConversion: number;
    convertedActionItems: number;
    totalActionItems: number;
    overdueFollowUps: number;
  };
  byStatus: Partial<Record<MeetingStatus, number>>;
  bookings: Record<string, number>;
  hostUtilization: Array<{
    hostId: string;
    host: UserSummary | null;
    meetings: number;
    completed: number;
    hours: number;
    completionRate: number;
  }>;
};

export type MeetingReminderDeliverySummary = {
  byStatus: Partial<Record<MeetingReminderJobStatus, number>>;
  byChannel: Partial<Record<MeetingReminderChannel, number>>;
  failedRecent: MeetingReminderJob[];
};

export type MeetingIntegrationHealth = {
  settings: MeetingPolicy;
  providers: MeetingIntegrationStatus["providers"];
  queue: Partial<Record<MeetingReminderJobStatus, number>>;
  webhookErrors: Array<{
    id: string;
    eventType: string;
    status: string;
    attempts: number;
    responseStatus?: number | null;
    lastError?: string | null;
    createdAt: string;
    webhook?: { id: string; name: string; enabled: boolean };
  }>;
};

export type MeetingAiUsageSummary = {
  totals: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
  byType: Array<{
    requestType: string;
    status: string;
    requests: number;
    totalTokens: number;
    estimatedCost: number;
  }>;
  recentFailures: Array<{
    id: string;
    provider: string;
    model: string;
    status: string;
    requestType?: string | null;
    error?: string | null;
    createdAt: string;
  }>;
};

export type MeetingAdminOverview = {
  policy: MeetingPolicy;
  permissions: {
    canManagePolicy: boolean;
    canCreateBookingLinks: boolean;
    canConnectCalendar: boolean;
    canConnectWhatsApp: boolean;
    canUseMeetingAi: boolean;
  };
  analytics: MeetingAdminAnalytics;
  integrationHealth: MeetingIntegrationHealth;
  reminderDelivery: MeetingReminderDeliverySummary;
  aiUsage: MeetingAiUsageSummary;
  recentAudit: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: string;
  }>;
};

export type MeetingIntegrationStatus = {
  settings: MeetingIntegrationSettings;
  providers: Record<
    "google" | "microsoft" | "zoom" | "whatsapp" | "email" | "sms" | "custom",
    {
      connected: boolean;
      integrationId?: string;
      name?: string;
      scopes?: string[];
      provider?: string;
    }
  >;
  queue: Partial<Record<MeetingReminderJobStatus, number>>;
  supportedEvents: string[];
};

export type MeetingReminderJob = {
  id: string;
  tenantId: string;
  meetingId: string;
  reminderId?: string | null;
  channel: MeetingReminderChannel;
  provider?: string | null;
  status: MeetingReminderJobStatus;
  scheduledFor: string;
  destination?: string | null;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string;
  lockedAt?: string | null;
  sentAt?: string | null;
  failedAt?: string | null;
  deadLetterAt?: string | null;
  lastError?: string | null;
  createdAt?: string;
  updatedAt?: string;
  meeting?: Pick<Meeting, "id" | "tenantId" | "title" | "status" | "startAt" | "endAt" | "meetingUrl" | "conferenceProvider">;
  reminder?: Pick<MeetingReminder, "id" | "attendeeId" | "templateKey" | "offsetMinutes"> | null;
};

export type MeetingAiActionItem = {
  id: string;
  title: string;
  description?: string | null;
  ownerId?: string | null;
  ownerEmail?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  projectId?: string | null;
  sprintId?: string | null;
  taskId?: string | null;
  status?: "OPEN" | "CONVERTED" | "DONE" | "DISMISSED";
  reminderId?: string | null;
  convertedTaskId?: string | null;
  convertedTaskKey?: string | null;
};

export type MeetingAiState = {
  meetingId: string;
  enabled: boolean;
  links: {
    projectId?: string | null;
    sprintId?: string | null;
    taskId?: string | null;
    teamId?: string | null;
    clientName?: string | null;
    clientEmail?: string | null;
    clientCompany?: string | null;
  };
  summary: Record<string, unknown>;
  actionItems: MeetingAiActionItem[];
  health: {
    hasAgenda: boolean;
    hasNotes: boolean;
    openActionItems: number;
    convertedActionItems: number;
    missingOwners: number;
    missingDueDates: number;
    effectivenessScore?: number | null;
  };
};

export type MeetingActivity = {
  id: string;
  meetingId: string;
  actorId?: string | null;
  action: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  createdAt: string;
  actor?: UserSummary | null;
};

export type MeetingDecisionStatus = "OPEN" | "APPROVED" | "REJECTED" | "DEFERRED" | "SUPERSEDED";

export type MeetingComment = {
  id: string;
  tenantId: string;
  meetingId: string;
  authorId: string;
  body: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  author?: UserSummary | null;
};

export type MeetingDecision = {
  id: string;
  tenantId: string;
  meetingId: string;
  ownerId?: string | null;
  title: string;
  summary?: string | null;
  impact?: string | null;
  status: MeetingDecisionStatus;
  dueAt?: string | null;
  taskId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  owner?: UserSummary | null;
};

export type MeetingChecklistItem = {
  id: string;
  tenantId: string;
  meetingId: string;
  ownerId?: string | null;
  title: string;
  notes?: string | null;
  isDone: boolean;
  dueAt?: string | null;
  taskId?: string | null;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  owner?: UserSummary | null;
};

export type Meeting = {
  id: string;
  tenantId: string;
  meetingTypeId?: string | null;
  projectId?: string | null;
  sprintId?: string | null;
  taskId?: string | null;
  teamId?: string | null;
  hostId?: string | null;
  createdById?: string | null;
  title: string;
  description?: string | null;
  status: MeetingStatus;
  visibility: Visibility;
  approvalStatus: MeetingApprovalStatus;
  startAt: string;
  endAt: string;
  timezone: string;
  locationMode: MeetingLocationMode;
  locationName?: string | null;
  meetingUrl?: string | null;
  conferenceProvider?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientCompany?: string | null;
  liveNotes?: string | null;
  liveNotesVersion?: number;
  liveNotesUpdatedAt?: string | null;
  liveNotesUpdatedById?: string | null;
  runtimeState?: Record<string, unknown> | null;
  recurrenceRule?: string | null;
  aiEnabled: boolean;
  aiSummary?: Record<string, unknown> | null;
  approvedAt?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  completedAt?: string | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  meetingType?: Pick<MeetingType, "id" | "name" | "slug" | "category" | "color" | "durationMins" | "requiresApproval"> | null;
  project?: Pick<Project, "id" | "key" | "name" | "status"> | null;
  sprint?: Pick<Sprint, "id" | "name" | "goal" | "startDate" | "endDate" | "completedAt"> | null;
  task?: Pick<Task, "id" | "key" | "title" | "status" | "priority"> | null;
  team?: Pick<Team, "id" | "name"> | null;
  host?: UserSummary | null;
  liveNotesUpdatedBy?: UserSummary | null;
  attendees?: MeetingAttendee[];
  agendaItems?: MeetingAgendaItem[];
  reminders?: MeetingReminder[];
  _count?: {
    attendees?: number;
    agendaItems?: number;
    reminders?: number;
    activities?: number;
    comments?: number;
    decisions?: number;
    checklistItems?: number;
  };
};

export type MeetingWorkspace = {
  meeting: Meeting;
  live: {
    notes: string;
    version: number;
    updatedAt?: string | null;
    updatedBy?: UserSummary | null;
    runtimeState: Record<string, unknown>;
  };
  attendees: MeetingAttendee[];
  agendaItems: MeetingAgendaItem[];
  comments: MeetingComment[];
  decisions: MeetingDecision[];
  checklist: MeetingChecklistItem[];
  files: FileAsset[];
  relatedTasks: Task[];
  reminders: MeetingReminder[];
  reminderJobs: MeetingReminderJob[];
  activity: MeetingActivity[];
  metrics: {
    attendees: number;
    present: number;
    absent: number;
    agendaItems: number;
    decisions: number;
    openDecisions: number;
    checklist: number;
    checklistDone: number;
    checklistProgress: number;
    relatedTasks: number;
    completedRelatedTasks: number;
    files: number;
    reminders: number;
  };
};

export type MeetingAvailabilityWindow = {
  id: string;
  tenantId: string;
  ownerId?: string | null;
  teamId?: string | null;
  scope: MeetingAvailabilityScope;
  label?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  capacity: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MeetingBlackoutWindow = {
  id: string;
  tenantId: string;
  ownerId?: string | null;
  teamId?: string | null;
  title: string;
  reason?: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MeetingAvailability = {
  windows: MeetingAvailabilityWindow[];
  blackouts: MeetingBlackoutWindow[];
};

export type BookingFormField = {
  id: string;
  tenantId: string;
  pageId: string;
  fieldKey: string;
  label: string;
  type: BookingFormFieldType;
  required: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  options?: string[] | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BookingPage = {
  id: string;
  tenantId: string;
  meetingTypeId?: string | null;
  teamId?: string | null;
  ownerId?: string | null;
  createdById?: string | null;
  path: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  scope: BookingPageScope;
  routingStrategy: BookingRoutingStrategy;
  department?: string | null;
  durationMins?: number | null;
  bufferBeforeMins: number;
  bufferAfterMins: number;
  minNoticeMins: number;
  rollingWindowDays: number;
  dailyLimit?: number | null;
  weeklyLimit?: number | null;
  approvalRequired: boolean;
  allowReschedule: boolean;
  allowCancel: boolean;
  collectCompanyName: boolean;
  locationMode: MeetingLocationMode;
  locationName?: string | null;
  meetingUrl?: string | null;
  conferenceProvider?: string | null;
  timezone: string;
  brandColor?: string | null;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "logoUrl" | "website" | "status">;
  meetingType?: Pick<MeetingType, "id" | "name" | "slug" | "description" | "category" | "durationMins" | "bufferBeforeMins" | "bufferAfterMins" | "locationMode" | "requiresApproval" | "defaultAgenda" | "defaultReminderMins" | "isActive"> | null;
  team?: (Pick<Team, "id" | "name" | "description"> & {
    members?: Array<{ role?: string | null; user: UserSummary & { timezone?: string | null; avatarUrl?: string | null; status?: string } }>;
  }) | null;
  owner?: (UserSummary & { timezone?: string | null; avatarUrl?: string | null; status?: string }) | null;
  fields?: BookingFormField[];
  _count?: {
    requests?: number;
    fields?: number;
  };
};

export type BookingRequest = {
  id: string;
  tenantId: string;
  pageId: string;
  meetingId?: string | null;
  meetingTypeId?: string | null;
  teamId?: string | null;
  hostId?: string | null;
  status: BookingRequestStatus;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guestCompany?: string | null;
  guestTimezone: string;
  title: string;
  notes?: string | null;
  intakeResponses?: Record<string, unknown> | null;
  routingSnapshot?: Record<string, unknown> | null;
  startAt: string;
  endAt: string;
  locationMode: MeetingLocationMode;
  locationName?: string | null;
  meetingUrl?: string | null;
  conferenceProvider?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  page?: Pick<BookingPage, "id" | "path" | "title" | "allowCancel" | "allowReschedule">;
  meeting?: Pick<Meeting, "id" | "title" | "status" | "approvalStatus" | "startAt" | "endAt"> | null;
  host?: UserSummary | null;
  meetingType?: Pick<MeetingType, "id" | "name" | "slug"> | null;
  team?: Pick<Team, "id" | "name"> | null;
};

export type PublicBookingSlot = {
  startAt: string;
  endAt: string;
  hostId: string;
  hostName: string;
  hostAvatarUrl?: string | null;
  routingStrategy: BookingRoutingStrategy;
};

export type PublicBookingPageResponse = {
  tenant: Pick<Tenant, "id" | "name" | "slug" | "logoUrl" | "website" | "status">;
  page: Pick<
    BookingPage,
    | "id"
    | "path"
    | "title"
    | "subtitle"
    | "description"
    | "scope"
    | "routingStrategy"
    | "durationMins"
    | "minNoticeMins"
    | "rollingWindowDays"
    | "approvalRequired"
    | "allowCancel"
    | "allowReschedule"
    | "collectCompanyName"
    | "locationMode"
    | "locationName"
    | "timezone"
    | "brandColor"
    | "logoUrl"
    | "heroImageUrl"
    | "meetingType"
    | "team"
    | "fields"
  > & {
    hosts: Array<{ id: string; name: string; avatarUrl?: string | null; timezone?: string | null }>;
  };
};

export type PublicBookingSlotsResponse = {
  page: Pick<BookingPage, "id" | "path" | "title" | "timezone">;
  slots: PublicBookingSlot[];
};

export type PublicBookingCreateResponse = {
  booking: BookingRequest;
  selfService: {
    cancelUrl: string;
    rescheduleUrl: string;
    expiresAt: string;
  };
};

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "PUSH" | "WEBHOOK";
export type NotificationDeliveryStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";

export type NotificationDelivery = {
  id: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  attempts: number;
  provider?: string | null;
  providerMessageId?: string | null;
  lastError?: string | null;
  nextAttemptAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type Notification = {
  id: string;
  tenantId: string;
  userId: string;
  templateId?: string | null;
  title: string;
  body?: string | null;
  channel: NotificationChannel;
  readAt?: string | null;
  data?: Record<string, unknown> | null;
  createdAt: string;
  template?: {
    id: string;
    key: string;
    name: string;
    channel: NotificationChannel;
  } | null;
  deliveries?: NotificationDelivery[];
};

export type NotificationPreference = {
  id: string | null;
  userId: string;
  channel: NotificationChannel;
  enabled: boolean;
  locked?: boolean;
};

export type InternalMailFolder = "INBOX" | "SENT" | "DRAFTS" | "ARCHIVE" | "DELETED" | "JUNK" | "SNOOZED";
export type InternalMailPriority = "NORMAL" | "HIGH" | "URGENT";
export type InternalMailRecipientKind = "TO" | "CC" | "BCC";
export type InternalMailboxType = "USER" | "SHARED" | "TEAM" | "SYSTEM";
export type InternalMailboxStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type InternalMailboxMemberRole = "OWNER" | "MANAGER" | "MEMBER";

export type InternalMailboxAlias = {
  id: string;
  tenantId: string;
  mailboxId: string;
  localPart: string;
  address: string;
  status: InternalMailboxStatus;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InternalMailboxMember = {
  id: string;
  userId: string;
  role: InternalMailboxMemberRole;
  user?: UserSummary | null;
};

export type InternalMailbox = {
  id: string;
  tenantId: string;
  userId?: string | null;
  teamId?: string | null;
  type: InternalMailboxType;
  status: InternalMailboxStatus;
  displayName: string;
  localPart: string;
  address: string;
  primaryAddress: string;
  description?: string | null;
  canReceive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary | null;
  team?: { id: string; name: string } | null;
  aliases: InternalMailboxAlias[];
  members: InternalMailboxMember[];
};

export type InternalMailParticipant = {
  id: string;
  tenantId: string;
  threadId: string;
  userId: string;
  folder: InternalMailFolder;
  readAt?: string | null;
  starredAt?: string | null;
  flaggedAt?: string | null;
  pinnedAt?: string | null;
  archivedAt?: string | null;
  deletedAt?: string | null;
  snoozedUntil?: string | null;
  lastReadMessageId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary | null;
};

export type InternalMailRecipient = {
  id: string;
  tenantId: string;
  messageId: string;
  userId: string;
  kind: InternalMailRecipientKind;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  user?: UserSummary | null;
};

export type InternalMailMessage = {
  id: string;
  tenantId: string;
  threadId: string;
  senderId: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string | null;
  priority: InternalMailPriority;
  attachments?: unknown;
  isDraft: boolean;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: UserSummary | null;
  recipients?: InternalMailRecipient[];
};

export type InternalMailThread = {
  id: string;
  tenantId: string;
  subject: string;
  createdById: string;
  priority: InternalMailPriority;
  lastMessageAt: string;
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserSummary | null;
  participants: InternalMailParticipant[];
  messages: InternalMailMessage[];
  currentParticipant: InternalMailParticipant;
  latestMessage?: InternalMailMessage | null;
  unread: boolean;
  messageCount: number;
  recipientCount: number;
};

export type InternalMailFolderSummary = {
  counts: Record<InternalMailFolder, number>;
  unread: number;
  starred: number;
  flagged: number;
  pinned: number;
};

export type ConversationMember = {
  id: string;
  userId: string;
  user?: UserSummary | null;
};

export type MessageReaction = {
  id: string;
  messageId?: string;
  userId: string;
  emoji: string;
};

export type MessageReadReceipt = {
  id: string;
  messageId?: string;
  userId: string;
  readAt: string;
  user?: UserSummary | null;
};

export type MessageAttachment = {
  id?: string;
  name: string;
  url: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  kind?: "image" | "video" | "audio" | "file" | "link";
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  parentMessageId?: string | null;
  forwardedFromMessageId?: string | null;
  pinnedById?: string | null;
  body?: string | null;
  attachments?: MessageAttachment[] | unknown;
  metadata?: unknown;
  pinnedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: UserSummary | null;
  reactions?: MessageReaction[];
  readReceipts?: MessageReadReceipt[];
};

export type Conversation = {
  id: string;
  tenantId: string;
  title?: string | null;
  isGroup: boolean;
  createdAt: string;
  members: ConversationMember[];
  messages?: Message[];
  _count?: {
    members?: number;
    messages?: number;
  };
};

export type AuditLog = {
  id: string;
  tenantId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export type AdminOverview = {
  tenant: Pick<Tenant, "id" | "name" | "slug" | "status" | "createdAt" | "updatedAt">;
  users: Record<string, number>;
  sessions: {
    active: number;
    revoked: number;
  };
  auditLogs: number;
  securityEvents: {
    open: number;
  };
  complianceJobs: Record<string, number>;
  apiKeys: Record<string, number>;
  securityChecks: SecurityChecks;
};

export type PlatformAdminLevel = "OWNER" | "ADMIN" | "SUPPORT" | "AUDITOR";
export type PlatformAdminStatus = "ACTIVE" | "REVOKED";

export type SiteAdminProfile = {
  id: string;
  userId: string;
  level: PlatformAdminLevel;
  status: PlatformAdminStatus;
  scopes: string[];
  tenantMembership: {
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type SiteAdminOverview = {
  tenants: Record<string, number>;
  users: Record<string, number>;
  sessions: { active: number };
  securityEvents: { total: number; open: number };
  platformAdmins: number;
  platformAuditLogs: number;
  recentTenants: Tenant[];
  recentEvents: SecurityEvent[];
};

export type SiteTenantDetail = {
  tenant: Tenant;
  users: Record<string, number>;
  sessions: { active: number; revoked?: number };
  securityEvents: { open: number; total?: number };
  indices: {
    workspace: {
      workspaces: number;
      teams: number;
      integrations: number;
      webhooks: number;
      files: number;
      aiAgents: number;
      reports: number;
      dashboards: number;
    };
    projects: {
      total: number;
      byStatus: Record<ProjectStatus | string, number>;
      byVisibility: Record<Visibility | string, number>;
      overdue: number;
    };
    tasks: {
      total: number;
      open: number;
      overdue: number;
      byStatus: Record<TaskStatus | string, number>;
      byPriority: Record<TaskPriority | string, number>;
      byType: Record<TaskType | string, number>;
    };
    delivery: {
      sprints: number;
      boards: number;
      milestones: number;
      openRisks: number;
      plannedBudget: number;
      actualBudget: number;
      budgetVariance: number;
    };
    security: {
      activeSessions: number;
      revokedSessions: number;
      openSecurityEvents: number;
      totalSecurityEvents: number;
      apiKeys: number;
      auditLogs: number;
      platformAuditLogs: number;
      mfaFactors: number;
      trustedDevices: number;
      ssoProviders: number;
    };
  };
  projects: Array<
    Pick<
      Project,
      | "id"
      | "key"
      | "name"
      | "description"
      | "status"
      | "visibility"
      | "progress"
      | "startDate"
      | "dueDate"
      | "completedAt"
      | "createdAt"
      | "updatedAt"
      | "workspace"
      | "team"
      | "_count"
    >
  >;
  recentUsers: TenantUser[];
  recentTasks: Array<
    Pick<Task, "id" | "key" | "title" | "type" | "status" | "priority" | "storyPoints" | "dueDate" | "updatedAt"> & {
      project: Pick<Project, "id" | "key" | "name">;
      _count?: {
        assignees?: number;
        comments?: number;
        checklists?: number;
        attachments?: number;
      };
    }
  >;
  recentSecurityEvents: SecurityEvent[];
};

export type SiteUserDetail = {
  user: TenantUser & {
    avatarUrl?: string | null;
    failedLoginAttempts?: number;
    lockedUntil?: string | null;
    platformAdminProfile?: {
      id: string;
      level: PlatformAdminLevel;
      status: PlatformAdminStatus;
      scopes: string[];
      revokedAt?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    authSessions?: Array<AuthSession & {
      authMethod?: string;
      mfaVerifiedAt?: string | null;
      deviceName?: string | null;
      trustedDevice?: {
        id: string;
        name?: string | null;
        status: string;
        lastUsedAt?: string | null;
      } | null;
    }>;
    mfaFactors?: Array<{
      id: string;
      type: string;
      status: string;
      label?: string | null;
      lastUsedAt?: string | null;
      enabledAt?: string | null;
      disabledAt?: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    trustedDevices?: Array<{
      id: string;
      status: string;
      name?: string | null;
      ipAddress?: string | null;
      userAgent?: string | null;
      lastUsedAt?: string | null;
      expiresAt: string;
      revokedAt?: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    ssoAccounts?: Array<{
      id: string;
      providerType: string;
      email: string;
      displayName?: string | null;
      lastLoginAt?: string | null;
      createdAt: string;
      updatedAt: string;
      provider?: { id: string; name: string; type: string; status: string } | null;
    }>;
    teamMemberships?: Array<{
      id: string;
      role?: string | null;
      createdAt: string;
      team: Team & { workspace?: Pick<Workspace, "id" | "name" | "slug"> | null };
    }>;
    projectMembers?: Array<{
      id: string;
      role?: string | null;
      createdAt: string;
      project: Pick<Project, "id" | "key" | "name" | "status" | "visibility" | "progress" | "workspace">;
    }>;
    assignedTasks?: Array<{
      id: string;
      task: Pick<Task, "id" | "key" | "title" | "type" | "status" | "priority" | "dueDate" | "updatedAt"> & {
        project: Pick<Project, "id" | "key" | "name">;
      };
    }>;
    loginHistory?: Array<{
      id: string;
      tenantId?: string | null;
      tenantSlug?: string | null;
      email: string;
      method: string;
      status: string;
      reason?: string | null;
      ipAddress?: string | null;
      userAgent?: string | null;
      suspicious: boolean;
      createdAt: string;
    }>;
    emailVerificationTokens?: Array<{ id: string; expiresAt: string; usedAt?: string | null; createdAt: string }>;
    passwordResetTokens?: Array<{ id: string; expiresAt: string; usedAt?: string | null; createdAt: string }>;
    _count?: Record<string, number | undefined>;
  };
  securityEvents: SecurityEvent[];
  tenantAuditLogs: AuditLog[];
  platformAuditLogs: PlatformAuditLog[];
};

export type SiteTenantResourceSection =
  | "users"
  | "projects"
  | "workspaces"
  | "teams"
  | "sessions"
  | "security"
  | "billing"
  | "integrations"
  | "files"
  | "ai"
  | "reports"
  | "activity";

export type SiteTenantResourceResponse<T = Record<string, unknown>> = {
  tenant: Tenant;
  section: SiteTenantResourceSection;
  summary: Record<string, unknown>;
  data: T[];
  meta: MetaPaginatedResponse<T>["meta"];
};

export type SiteLoginHistory = {
  id: string;
  tenantId?: string | null;
  userId?: string | null;
  tenantSlug?: string | null;
  email: string;
  method: string;
  status: string;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  suspicious: boolean;
  metadata?: unknown;
  createdAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
  user?: UserSummary | null;
};

export type SiteTrustedDevice = {
  id: string;
  tenantId: string;
  userId: string;
  status: string;
  name?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastUsedAt?: string | null;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  user?: UserSummary;
  _count?: { sessions?: number };
};

export type SiteSsoProvider = {
  id: string;
  tenantId: string;
  type: string;
  status: string;
  name: string;
  issuerUrl?: string | null;
  authorizationUrl?: string | null;
  tokenUrl?: string | null;
  userInfoUrl?: string | null;
  redirectUri?: string | null;
  clientId?: string | null;
  scopes: string[];
  allowedDomains: string[];
  buttonLabel?: string | null;
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  _count?: { accounts?: number; loginStates?: number };
};

export type SiteSecurityPolicy = {
  id: string;
  tenantId: string;
  enforceIpAllowlist: boolean;
  ipAllowlist: string[];
  sessionTtlMinutes: number;
  maxSessionsPerUser?: number | null;
  passwordMinLength: number;
  passwordRequireUpper: boolean;
  passwordRequireLower: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  passwordHistoryCount: number;
  mfaRequired: boolean;
  allowedLoginMethods: string[];
  ssoRequired: boolean;
  domainDiscoveryEnabled: boolean;
  trustedDeviceTtlDays: number;
  auditRetentionDays: number;
  dataRetentionDays?: number | null;
  maxUploadBytes?: number | null;
  allowedUploadMimeTypes: string[];
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
};

export type SiteIdentitySecurityOverview = {
  users: Record<string, number>;
  mfa: { activeFactors: number; pendingFactors: number; requiredPolicies: number };
  trustedDevices: Record<string, number>;
  loginHistory: {
    byStatus: Record<string, number>;
    byMethod: Record<string, number>;
    suspiciousLast7Days: number;
  };
  sso: { activeProviders: number; requiredPolicies: number; domainDiscoveryPolicies: number };
  recentSuspiciousLogins: SiteLoginHistory[];
  riskyTenants: Array<Tenant & {
    securityPolicy?: Pick<SiteSecurityPolicy, "mfaRequired" | "ssoRequired" | "domainDiscoveryEnabled" | "allowedLoginMethods"> | null;
    riskScore: number;
  }>;
};

export type SiteSession = AuthSession & {
  authMethod: string;
  mfaVerifiedAt?: string | null;
  trustedDeviceId?: string | null;
  deviceFingerprint?: string | null;
  deviceName?: string | null;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  trustedDevice?: Pick<SiteTrustedDevice, "id" | "name" | "status" | "lastUsedAt" | "revokedAt"> | null;
};

export type SiteSessionsResponse = MetaPaginatedResponse<SiteSession> & {
  summary: { active: number; revoked: number; byMethod: Record<string, number> };
};

export type SiteBillingPlan = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number | string;
  currency: string;
  interval: string;
  isActive: boolean;
  trialDays?: number | null;
  seatLimit?: number | null;
  providerPriceId?: string | null;
  metadata?: unknown;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  features?: Array<{
    id: string;
    limit?: number | null;
    enabled: boolean;
    config?: unknown;
    feature: {
      id: string;
      key: string;
      name: string;
      description?: string | null;
      category?: string | null;
      unit?: string | null;
      defaultLimit?: number | null;
      metered: boolean;
      isActive: boolean;
    };
  }>;
  _count?: { subscriptions?: number; features?: number };
};

export type SiteBillingFeature = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  unit?: string | null;
  defaultLimit?: number | null;
  metered: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  plans?: Array<{
    id: string;
    planId: string;
    featureId: string;
    limit?: number | null;
    enabled: boolean;
    config?: unknown;
    plan: SiteBillingPlan;
  }>;
};

export type SiteBillingPlanPayload = {
  name: string;
  slug: string;
  description?: string;
  price?: number;
  currency?: string;
  interval?: string;
  isActive?: boolean;
  trialDays?: number;
  seatLimit?: number;
  providerPriceId?: string;
  metadata?: unknown;
};

export type SiteBillingFeaturePayload = {
  key: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  defaultLimit?: number;
  metered?: boolean;
  isActive?: boolean;
};

export type SitePlanFeaturePayload = {
  featureId: string;
  limit?: number;
  enabled?: boolean;
  config?: unknown;
};

export type SiteSubscription = {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  provider: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  seatCount: number;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  canceledAt?: string | null;
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  plan?: SiteBillingPlan;
  _count?: { invoices?: number; usageRecords?: number };
};

export type SiteInvoice = {
  id: string;
  tenantId?: string | null;
  subscriptionId: string;
  provider: string;
  providerInvoiceId?: string | null;
  number?: string | null;
  amount: number | string;
  currency: string;
  status: string;
  subtotal?: number | string | null;
  tax?: number | string | null;
  total?: number | string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  hostedInvoiceUrl?: string | null;
  invoicePdfUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  subscription?: SiteSubscription;
};

export type SiteUsageRecord = {
  id: string;
  tenantId: string;
  subscriptionId?: string | null;
  featureId?: string | null;
  featureKey: string;
  quantity: number;
  unit?: string | null;
  source: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  subscription?: Pick<SiteSubscription, "id" | "status"> & { plan?: Pick<SiteBillingPlan, "id" | "name" | "slug"> };
};

export type SiteBillingEvent = {
  id: string;
  tenantId?: string | null;
  provider: string;
  eventId: string;
  type: string;
  status: string;
  processedAt?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
};

export type SiteBillingOverview = {
  plans: number;
  features: number;
  subscriptions: Record<string, number>;
  invoices: Record<string, number>;
  usageRecords: number;
  billingEvents: Record<string, number>;
  revenue: number;
  recentSubscriptions: SiteSubscription[];
  recentBillingEvents: SiteBillingEvent[];
  tenantHealth: Array<
    Omit<Tenant, "_count"> & {
      billing?: SiteSubscription | null;
      health: string;
      _count?: Tenant["_count"] & {
        usageRecords?: number;
        billingEvents?: number;
      };
    }
  >;
};

export type SiteBillingEntitlement = {
  tenant: Pick<Tenant, "id" | "name" | "slug" | "status"> & { _count?: { users?: number } };
  subscription: Pick<SiteSubscription, "id" | "status" | "seatCount" | "currentPeriodEnd" | "trialEndsAt">;
  plan: SiteBillingPlan;
  entitlements: Array<{
    key: string;
    name: string;
    enabled: boolean;
    limit?: number | null;
    metered: boolean;
    unit?: string | null;
  }>;
  seatUsage: {
    used: number;
    limit: number;
  };
};

export type BillingPlan = SiteBillingPlan;
export type BillingInvoice = SiteInvoice;
export type BillingUsageRecord = SiteUsageRecord;

export type BillingEntitlementFeature = {
  key: string;
  name: string;
  category?: string | null;
  unit?: string | null;
  metered: boolean;
  enabled: boolean;
  allowed: boolean;
  limit?: number | null;
  used: number;
  remaining?: number | null;
  config?: unknown;
};

export type BillingEntitlements = {
  subscription: {
    id: string;
    status: string;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    trialEndsAt?: string | null;
  } | null;
  plan: Pick<BillingPlan, "id" | "name" | "slug" | "interval"> | null;
  seats: {
    used: number;
    limit?: number | null;
    remaining?: number | null;
    allowed: boolean;
  };
  features: BillingEntitlementFeature[];
};

export type BillingAccountStatus = {
  tenantId: string;
  subscription: SiteSubscription | null;
  seats: {
    used: number;
    limit?: number | null;
    remaining?: number | null;
    withinLimit: boolean;
  };
  entitlements: BillingEntitlements;
};

export type BillingCheckoutSession = {
  provider: string;
  mode?: string;
  id?: unknown;
  reference?: unknown;
  accessCode?: unknown;
  url?: unknown;
  expiresAt?: unknown;
  planId?: string | null;
  seatCount?: number;
  currency?: string;
  message?: string;
};

export type BillingPortalSession = {
  provider: string;
  mode?: string;
  id?: unknown;
  url?: unknown;
  subscriptionId?: string | null;
  message?: string;
};

export type BillingUsageSummary = {
  data: Array<{ featureKey: string; quantity: number; records: number }>;
  totalQuantity: number;
  totalRecords: number;
};

export type SiteIntegration = Omit<Integration, "encryptedSecrets"> & {
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  _count?: { logs?: number };
};

export type SiteIntegrationsOverview = {
  integrations: Record<string, Record<string, number>>;
  webhooks: Record<string, number>;
  deliveries: Record<string, number>;
  deliveriesLast24h: number;
  recentFailures: SiteWebhookDelivery[];
  omoflowIntegrations: SiteIntegration[];
  providerCatalog: Array<{ provider: string; label: string; category: string }>;
};

export type SiteWebhook = Omit<Webhook, "secret"> & {
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  _count?: { deliveries?: number };
};

export type SiteWebhookDelivery = WebhookDelivery & {
  webhook?: Pick<Webhook, "id" | "name" | "url" | "enabled" | "events"> & {
    tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  };
};

export type SiteObservabilityOverview = {
  live: { status: string; uptimeSeconds?: number; startedAt?: string; environment?: string; service?: string };
  ready: {
    status: string;
    database: { status: string; latencyMs: number };
    realtime: SiteRealtimeSnapshot;
  };
  api: {
    errors: Record<string, number>;
    errorRateSignals: number;
    recentRequests: Array<Record<string, unknown>>;
    slowEndpoints: Array<Record<string, unknown>>;
  };
  queues: {
    workflows: Record<string, number>;
    webhooks: Record<string, number>;
    compliance: Record<string, number>;
    metrics: unknown;
  };
  workers: Record<string, string>;
  sessions: { active: number };
  securityEvents: { open: number; recentApiSecurityEvents: SecurityEvent[] };
};

export type SiteRealtimeSnapshot = {
  namespace: string;
  status: string;
  connections: number;
  rooms: { total: number; tenant: number; user: number; conversation: number; task: number; memberships: number };
  tenants: Record<string, number>;
  authMethods: Record<string, number>;
};

export type SiteRealtimeOverview = {
  realtime: SiteRealtimeSnapshot;
  conversations: { total: number; group: number; direct: number };
  messages: { last24h: number; pinned: number; reactions: number; readReceiptsLast24h: number };
  deliveryHealth: { readReceiptRatio: number; privateContentPolicy: string };
  abuseAndRateLimit: { events: number; recentEvents: SecurityEvent[] };
  recentRooms: SiteConversationMetadata[];
};

export type SiteConversationMetadata = {
  id: string;
  tenantId: string;
  title?: string | null;
  isGroup: boolean;
  createdAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
  members?: Array<{ id: string; userId: string }>;
  messages?: Array<{ id: string; senderId: string; createdAt: string; updatedAt?: string; pinnedAt?: string | null }>;
  _count?: { members?: number; messages?: number };
};

export type SiteMessageActivity = {
  id: string;
  conversationId: string;
  senderId: string;
  parentMessageId?: string | null;
  forwardedFromMessageId?: string | null;
  pinnedAt?: string | null;
  attachments?: unknown;
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
  bodyRedacted: true;
  attachmentCount: number;
  conversation: Pick<SiteConversationMetadata, "id" | "tenantId" | "title" | "isGroup" | "tenant">;
  _count?: { reactions?: number; readReceipts?: number };
};

export type SiteMeetingOperationsOverview = {
  privacy: { policy: string; redacted: string[] };
  meetings: Partial<Record<MeetingStatus, number>>;
  booking: { activePages: number; requests: Record<string, number> };
  reminderDelivery: Partial<Record<MeetingReminderJobStatus, number>>;
  policies: {
    tenantsWithSettings: number;
    publicBookingEnabled: number;
    calendarSyncEnabled: number;
    whatsappEnabled: number;
    aiMeetingEnabled: number;
  };
  aiUsage: { requests: number; totalTokens: number; estimatedCost: number };
  topTenants: Array<{ tenant: Pick<Tenant, "id" | "name" | "slug" | "status"> | null; meetings: number }>;
  deliveryPressure: Array<{
    tenant: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
    status: MeetingReminderJobStatus;
    failures: number;
  }>;
};

export type SiteMeetingTenantPosture = {
  tenant: Pick<Tenant, "id" | "name" | "slug" | "status" | "_count"> & {
    meetingIntegrationSettings?: Partial<MeetingIntegrationSettings> | null;
  };
  meetings: Partial<Record<MeetingStatus, number>>;
  reminderDelivery: Partial<Record<MeetingReminderJobStatus, number>>;
  aiUsage: { requests: number; totalTokens: number; estimatedCost: number };
  privacy: "content_redacted";
};

export type SiteMeetingReminderLog = Omit<MeetingReminderJob, "meeting"> & {
  tenant: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
  meeting: Pick<Meeting, "id" | "status" | "startAt"> & { contentRedacted: true };
};

export type SiteComplianceOverview = {
  jobs: { byStatus: Record<string, number>; byType: Record<string, number> };
  policies: {
    reviewed: number;
    boundaryChecks: Array<{
      tenant: Pick<Tenant, "id" | "name" | "slug" | "status">;
      auditRetentionDays: number;
      dataRetentionDays?: number | null;
      domainDiscoveryEnabled: boolean;
      mfaRequired: boolean;
      evidence: "PASS" | "REVIEW";
    }>;
  };
  recentJobs: SiteComplianceJob[];
  evidenceTrail: Array<AuditLog & { tenant?: Pick<Tenant, "id" | "name" | "slug" | "status"> }>;
};

export type SiteComplianceJob = ComplianceJob & {
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  requestedBy?: UserSummary | null;
  approvedBy?: UserSummary | null;
};

export type SitePlatformSearchCategory = "ALL" | "TENANTS" | "USERS" | "PROJECTS" | "TASKS" | "EVENTS" | "AUDIT";

export type SitePlatformSearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  url: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
  updatedAt?: string;
  metadata?: unknown;
};

export type SitePlatformSearchResponse = MetaPaginatedResponse<SitePlatformSearchResult> & {
  facets: Record<string, number>;
  query: { search: string; category: string; tenantId?: string };
};

export type SiteWorkflow = Omit<Workflow, "nodes"> & {
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
  nodes?: WorkflowNode[];
};

export type SiteWorkflowRun = WorkflowRun & {
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
};

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type SiteApprovalDefinition = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  entityType: string;
  isActive: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
  steps?: Array<{ id: string; stepOrder: number; title: string; approverId?: string | null; approverRole?: string | null; required: boolean; escalationHours?: number | null }>;
};

export type SiteApproval = {
  id: string;
  tenantId: string;
  definitionId?: string | null;
  workflowRunId?: string | null;
  entityType: string;
  entityId: string;
  title: string;
  description?: string | null;
  status: ApprovalStatus;
  requestedById?: string | null;
  currentStep: number;
  dueDate?: string | null;
  decidedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
  steps?: Array<{ id: string; stepOrder: number; title?: string | null; approverId: string; required: boolean; status: ApprovalStatus; decidedAt?: string | null; dueDate?: string | null }>;
  workflowRun?: { id: string; status: WorkflowRunStatus; workflow?: Pick<Workflow, "id" | "name"> | null } | null;
};

export type SiteWorkflowRunLog = WorkflowRunLog & {
  run?: Pick<WorkflowRun, "id" | "tenantId" | "status"> & { workflow?: Pick<Workflow, "id" | "name"> | null };
  node?: Pick<WorkflowNode, "id" | "name" | "type" | "actionType"> | null;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
};

export type SiteAutomationOverview = {
  workflows: { byTrigger: Record<string, number> };
  runs: { byStatus: Record<string, number>; last24h: number; deadLetter: number };
  approvals: { byStatus: Record<string, number> };
  definitions: Record<string, number>;
  runtimeLogs: { errorLogs: number };
  recentFailedRuns: SiteWorkflowRun[];
};

export type AiConversationStatus = "OPEN" | "ARCHIVED" | "RESOLVED";
export type AiActionStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type AiRequestStatus = "COMPLETED" | "FAILED" | "CANCELLED";

export type SiteAiSettings = AiSettings & {
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
};

export type SiteAiAgent = AiAgent & {
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  createdBy?: UserSummary | null;
};

export type SiteAiConversation = {
  id: string;
  tenantId: string;
  agentId: string;
  userId: string;
  title?: string | null;
  status: AiConversationStatus;
  contextType?: string | null;
  contextId?: string | null;
  summary?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  agent?: Pick<AiAgent, "id" | "name" | "provider" | "model">;
  user?: UserSummary;
  _count?: { messages?: number; actions?: number; usageLogs?: number };
};

export type SiteAiAction = {
  id: string;
  tenantId: string;
  agentId?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  requestedById?: string | null;
  type: string;
  status: AiActionStatus;
  entityType?: string | null;
  entityId?: string | null;
  input?: unknown;
  output?: unknown;
  error?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  agent?: Pick<AiAgent, "id" | "name" | "provider" | "model"> | null;
  conversation?: Pick<SiteAiConversation, "id" | "title" | "status"> | null;
  requestedBy?: UserSummary | null;
};

export type SiteAiUsageLog = {
  id: string;
  tenantId: string;
  userId?: string | null;
  agentId?: string | null;
  conversationId?: string | null;
  provider: string;
  model: string;
  status: AiRequestStatus;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost?: number | null;
  latencyMs?: number | null;
  requestType?: string | null;
  error?: string | null;
  createdAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  user?: UserSummary | null;
  agent?: Pick<AiAgent, "id" | "name" | "provider" | "model"> | null;
};

export type SiteAiOverview = {
  settings: Record<string, number>;
  agents: { byProvider: Record<string, number> };
  conversations: { byStatus: Record<string, number> };
  actions: { byStatus: Record<string, number> };
  usage: { byStatus: Record<string, number>; last30dTokens: number; last30dCost: number; averageLatencyMs: number };
  safety: { events: number; recentEvents: SecurityEvent[] };
  recentActions: SiteAiAction[];
};

export type SiteDashboard = {
  id: string;
  tenantId: string;
  ownerId?: string | null;
  name: string;
  description?: string | null;
  visibility: string;
  refreshIntervalSeconds?: number | null;
  isDefault: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  owner?: UserSummary | null;
  _count?: { widgets?: number };
};

export type SiteReport = Report & {
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
};

export type SiteReportExecution = ReportExecution & {
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  requestedBy?: UserSummary | null;
};

export type SiteReportExport = ReportExport & {
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status">;
  requestedBy?: UserSummary | null;
};

export type SiteReportingOverview = {
  dashboards: Record<string, number>;
  reports: { byStatus: Record<string, number>; byType: Record<string, number> };
  executions: Record<string, number>;
  exports: Record<string, number>;
  tenantHealth: { projects: Record<string, number>; tasks: Record<string, number>; completedTasksLast30d: number };
  budget: { planned: number; actual: number };
  velocity: Array<{ id: string; name: string; completedAt?: string | null; project?: Pick<Project, "id" | "key" | "name" | "tenantId">; storyPoints: number; completedTasks: number }>;
  recentExports: SiteReportExport[];
  recentExecutions: SiteReportExecution[];
};

export type SiteHardeningOverview = {
  checks: Record<string, string | number>;
  data: Record<string, unknown>;
  qaMatrix: Array<{ area: string; status: string; evidence: string }>;
  recentPlatformAudit: PlatformAuditLog[];
};

export type PlatformAdminGrant = {
  id: string;
  userId: string;
  level: PlatformAdminLevel;
  status: PlatformAdminStatus;
  scopes: string[];
  grantedById?: string | null;
  revokedById?: string | null;
  revokedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserSummary & {
    tenantId: string;
    tenant: Pick<Tenant, "id" | "name" | "slug">;
  };
};

export type PlatformAuditLog = {
  id: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  targetTenantId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  actor?: (Partial<UserSummary> & { id: string }) | null;
  targetTenant?: Pick<Tenant, "id" | "name" | "slug"> | null;
};

export type SecurityChecks = {
  nodeEnv: string;
  swaggerProductionSafe: boolean;
  corsConfigured: boolean;
  corsOrigins: string[];
  requestBodyLimit: string;
  requestTimeoutMs: number;
  helmetEnabled: boolean;
  validationPipe: {
    whitelist: boolean;
    forbidNonWhitelisted: boolean;
    transform: boolean;
  };
  rateLimit: {
    ttlSeconds: number;
    defaultMax: number;
    authMax: number;
  };
  secretsConfigured: {
    jwtAccess: boolean;
    jwtRefresh: boolean;
    encryption: boolean;
    webhookSigning: boolean;
  };
};

export type SecurityPolicy = {
  id: string;
  tenantId: string;
  enforceIpAllowlist: boolean;
  ipAllowlist: string[];
  sessionTtlMinutes: number;
  maxSessionsPerUser?: number | null;
  passwordMinLength: number;
  passwordRequireUpper: boolean;
  passwordRequireLower: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  passwordHistoryCount: number;
  mfaRequired: boolean;
  allowedLoginMethods?: string[];
  ssoRequired?: boolean;
  domainDiscoveryEnabled?: boolean;
  trustedDeviceTtlDays?: number;
  auditRetentionDays: number;
  dataRetentionDays?: number | null;
  maxUploadBytes?: number | null;
  allowedUploadMimeTypes: string[];
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type IdentitySecurityOverview = {
  mfa: {
    enabled: boolean;
    factors: Array<{
      id: string;
      type: string;
      status: string;
      label?: string | null;
      lastUsedAt?: string | null;
      enabledAt?: string | null;
      createdAt: string;
    }>;
    backupCodes: {
      total: number;
      remaining: number;
    };
  };
  trustedDevices: Array<{
    id: string;
    status: string;
    name?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    lastUsedAt?: string | null;
    expiresAt: string;
    revokedAt?: string | null;
    createdAt: string;
  }>;
  loginHistory: Array<{
    id: string;
    email: string;
    method: string;
    status: string;
    reason?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    suspicious: boolean;
    createdAt: string;
  }>;
};

export type TotpSetupResponse = {
  factorId: string;
  secret: string;
  otpauthUrl: string;
  issuer: string;
};

export type SsoProvider = {
  id: string;
  tenantId: string;
  type: "GOOGLE" | "MICROSOFT" | "OIDC" | "SAML";
  status: "ACTIVE" | "DISABLED";
  name: string;
  issuerUrl?: string | null;
  authorizationUrl?: string | null;
  tokenUrl?: string | null;
  userInfoUrl?: string | null;
  redirectUri?: string | null;
  clientId?: string | null;
  clientSecretConfigured: boolean;
  scopes: string[];
  allowedDomains: string[];
  buttonLabel?: string | null;
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  id: string;
  tenantId: string;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary | null;
};

export type SecurityEventSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SecurityEventStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";

export type SecurityEvent = {
  id: string;
  tenantId?: string | null;
  tenant?: Pick<Tenant, "id" | "name" | "slug" | "status"> | null;
  actorId?: string | null;
  type: string;
  severity: SecurityEventSeverity;
  status: SecurityEventStatus;
  source?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  metadata?: unknown;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  createdAt: string;
  updatedAt: string;
  actor?: UserSummary | null;
  resolvedBy?: UserSummary | null;
};

export type ComplianceJobType = "DATA_EXPORT" | "DATA_DELETION" | "RETENTION_PURGE";
export type ComplianceJobStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type ComplianceJob = {
  id: string;
  tenantId: string;
  requestedById?: string | null;
  approvedById?: string | null;
  type: ComplianceJobType;
  status: ComplianceJobStatus;
  subjectType?: string | null;
  subjectId?: string | null;
  reason?: string | null;
  parameters?: unknown;
  result?: unknown;
  fileName?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  error?: string | null;
  requestedAt: string;
  approvedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requestedBy?: UserSummary | null;
  approvedBy?: UserSummary | null;
};

export type ApiKeyStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export type ApiKey = {
  id: string;
  tenantId: string;
  createdById?: string | null;
  name: string;
  prefix: string;
  scopes: string[];
  status: ApiKeyStatus;
  metadata?: unknown;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserSummary | null;
};

export type CreatedApiKey = ApiKey & {
  token: string;
};

export type IntegrationProvider =
  | "GITHUB"
  | "GITLAB"
  | "BITBUCKET"
  | "SLACK"
  | "TEAMS"
  | "GOOGLE"
  | "MICROSOFT"
  | "ZOOM"
  | "STRIPE"
  | "PAYPAL"
  | "OPENAI"
  | "ANTHROPIC"
  | "ZAPIER"
  | "CUSTOM";

export type IntegrationStatus = "ACTIVE" | "DISABLED" | "ERROR" | "REVOKED";

export type Integration = {
  id: string;
  tenantId: string;
  provider: IntegrationProvider;
  name: string;
  config?: unknown;
  externalAccountId?: string | null;
  scopes: string[];
  enabled: boolean;
  status: IntegrationStatus;
  lastSyncAt?: string | null;
  lastError?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  hasSecrets?: boolean;
  secretKeys?: string[];
  _count?: {
    logs?: number;
  };
};

export type IntegrationLog = {
  id: string;
  tenantId: string;
  integrationId: string;
  level: string;
  eventType: string;
  message: string;
  data?: unknown;
  createdAt: string;
};

export type OmoFlowRuntimeActionItem = {
  title: string;
  description?: string;
  assigneeEmail?: string;
  dueDate?: string;
  priority?: TaskPriority;
  storyPoints?: number;
};

export type OmoFlowRuntimeEvent = {
  eventId: string;
  eventType: string;
  projectId?: string;
  meeting?: {
    id?: string;
    title?: string;
    summary?: string;
    startedAt?: string;
    endedAt?: string;
    recordingUrl?: string;
    transcriptUrl?: string;
  };
  agendaItems?: unknown[];
  actionItems?: OmoFlowRuntimeActionItem[];
  payload?: unknown;
};

export type OmoFlowRuntimeResult = {
  idempotent: boolean;
  eventId: string;
  integration: Integration;
  mappedTasks: Array<Pick<Task, "id" | "projectId" | "key" | "title" | "description" | "status" | "priority" | "dueDate" | "storyPoints" | "createdAt">>;
  message: string;
};

export type WebhookDeliveryStatus = "PENDING" | "DELIVERED" | "FAILED" | "CANCELLED";

export type Webhook = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  url: string;
  signingAlgorithm: string;
  events: string[];
  enabled: boolean;
  failureCount: number;
  lastDeliveryAt?: string | null;
  lastError?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  hasSecret?: boolean;
  signingSecret?: string;
  _count?: {
    deliveries?: number;
  };
};

export type WebhookDelivery = {
  id: string;
  tenantId: string;
  webhookId: string;
  eventType: string;
  payload?: unknown;
  status: WebhookDeliveryStatus;
  attempts: number;
  nextAttemptAt?: string | null;
  lastError?: string | null;
  responseStatus?: number | null;
  responseBody?: string | null;
  requestHeaders?: unknown;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  webhook?: Pick<Webhook, "id" | "name" | "url" | "enabled" | "events">;
};

export type WorkflowRunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type WorkflowNode = {
  id?: string;
  workflowId?: string;
  key?: string | null;
  name: string;
  type: string;
  actionType?: string | null;
  config?: unknown;
  sortOrder?: number;
  enabled?: boolean;
  retryAttempts?: number;
  timeoutSeconds?: number | null;
  dependsOn?: unknown;
  onFailure?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Workflow = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  entityType: string;
  triggerType: string;
  eventType?: string | null;
  config?: unknown;
  isActive: boolean;
  createdById?: string | null;
  archivedAt?: string | null;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  _count?: {
    runs?: number;
  };
};

export type WorkflowRunLog = {
  id: string;
  runId: string;
  nodeId?: string | null;
  level: string;
  message: string;
  data?: unknown;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  tenantId: string;
  entityType?: string | null;
  entityId: string;
  eventType?: string | null;
  triggerType?: string | null;
  idempotencyKey?: string | null;
  status: WorkflowRunStatus;
  context?: unknown;
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  workflow?: Pick<Workflow, "id" | "name" | "entityType" | "triggerType" | "eventType">;
  logs?: WorkflowRunLog[];
  approvals?: Array<{
    id: string;
    title: string;
    status: string;
    currentStep: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type AiSettings = {
  id: string;
  tenantId: string;
  enabled: boolean;
  defaultProvider: string;
  defaultModel: string;
  allowedProviders: string[];
  monthlyTokenLimit?: number | null;
  monthlyCostLimit?: number | string | null;
  redactSensitiveData: boolean;
  dataRetentionDays: number;
  policy?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type AiAgent = {
  id: string;
  tenantId: string;
  createdById?: string | null;
  name: string;
  description?: string | null;
  type: string;
  provider: string;
  model: string;
  systemPrompt?: string | null;
  temperature?: number | null;
  maxOutputTokens?: number | null;
  tools: string[];
  guardrails?: unknown;
  knowledgeScope?: unknown;
  enabled: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    conversations?: number;
    actions?: number;
    usageLogs?: number;
  };
};

export type ReportStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
export type ReportExecutionStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type ReportExportStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";
export type ReportExportFormat = "CSV" | "XLSX" | "PDF" | "JSON";

export type Report = {
  id: string;
  tenantId: string;
  createdById?: string | null;
  name: string;
  description?: string | null;
  type: string;
  status: ReportStatus;
  query?: unknown;
  schedule?: string | null;
  timezone?: string | null;
  recipients?: string[];
  cacheTtlSeconds?: number | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  metadata?: unknown;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserSummary | null;
  _count?: {
    executions?: number;
    exports?: number;
  };
};

export type ReportExecution = {
  id: string;
  tenantId: string;
  reportId?: string | null;
  requestedById?: string | null;
  type: string;
  status: ReportExecutionStatus;
  parameters?: unknown;
  result?: unknown;
  summary?: unknown;
  error?: string | null;
  rowCount?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  cacheKey?: string | null;
  createdAt: string;
  updatedAt: string;
  report?: Pick<Report, "id" | "name" | "type" | "status"> | null;
};

export type ReportExport = {
  id: string;
  tenantId: string;
  reportId?: string | null;
  executionId?: string | null;
  requestedById?: string | null;
  format: ReportExportFormat;
  status: ReportExportStatus;
  fileName?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  expiresAt?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  report?: Pick<Report, "id" | "name" | "type"> | null;
  execution?: Pick<ReportExecution, "id" | "status" | "rowCount"> | null;
};

export type AnalyticsQuery = {
  projectId?: string;
  teamId?: string;
  workspaceId?: string;
  from?: string;
  to?: string;
};

export type AnalyticsOverview = {
  projects: number;
  tasks: Partial<Record<TaskStatus, number>>;
  overdueTasks: number;
  openRisks: number;
  budget: {
    planned: number;
    actual: number;
  };
  time: {
    entries: number;
    minutes: number;
  };
};

export type ProjectHealthAnalytics = {
  data: Array<Pick<Project, "id" | "key" | "name" | "status" | "progress" | "dueDate"> & {
    _count?: {
      tasks?: number;
      risks?: number;
    };
    doneTasks: number;
    overdueTasks: number;
    openRisks: number;
    completion: number;
    healthScore: number;
  }>;
  total: number;
};

export type TeamPerformanceAnalytics = {
  data: Array<Pick<Team, "id" | "name"> & {
    _count?: {
      members?: number;
      projects?: number;
    };
    tasks: number;
    doneTasks: number;
    completionRate: number;
    minutes: number;
  }>;
  total: number;
};

export type CycleTimeAnalytics = {
  data: Array<Pick<Task, "id" | "key" | "title" | "priority"> & {
    type?: string;
    createdAt: string;
    completedAt?: string | null;
    cycleTimeHours?: number | null;
  }>;
  averageCycleTimeHours: number;
  total: number;
};

export type VelocityAnalytics = {
  data: Array<Pick<Sprint, "id" | "name" | "projectId" | "startDate" | "endDate" | "completedAt"> & {
    project?: Pick<Project, "key" | "name">;
    completedTasks: number;
    storyPoints: number;
  }>;
  averageStoryPoints: number;
  total: number;
};

export type BudgetAnalytics = {
  data: Array<{
    id: string;
    currency: string;
    planned: number;
    actual: number;
    notes?: string | null;
    project: Pick<Project, "id" | "key" | "name">;
    variance: number;
    utilizationPercent: number;
  }>;
  total: number;
};

export type SlaAnalytics = {
  totalWithDueDate: number;
  breached: number;
  completedOnTime: number;
  compliancePercent: number;
};

export type ModuleStatus = {
  module?: string;
  status: string;
  [key: string]: unknown;
};

export type ReadinessResponse = {
  status: string;
  checks?: Record<string, unknown>;
  timestamp?: string;
};

type RequestOptions = RequestInit & {
  token?: string | null;
  skipAuthRefresh?: boolean;
};

type OpenApiHttpMethod = "get" | "post" | "patch" | "put" | "delete";
type OpenApiPath = keyof paths & `/api/v1/${string}`;
type OpenApiMethod<TPath extends OpenApiPath> = Extract<keyof paths[TPath], OpenApiHttpMethod>;
type OpenApiOperation<TPath extends OpenApiPath, TMethod extends OpenApiMethod<TPath>> = paths[TPath][TMethod];
type OpenApiPathParams<TPath extends OpenApiPath, TMethod extends OpenApiMethod<TPath>> =
  OpenApiOperation<TPath, TMethod> extends { parameters: { path: infer TParams } } ? TParams : Record<string, never>;
type OpenApiQuery<TPath extends OpenApiPath, TMethod extends OpenApiMethod<TPath>> =
  OpenApiOperation<TPath, TMethod> extends { parameters: { query?: infer TParams } } ? NonNullable<TParams> : never;
type OpenApiJsonBody<TPath extends OpenApiPath, TMethod extends OpenApiMethod<TPath>> =
  OpenApiOperation<TPath, TMethod> extends { requestBody: { content: { "application/json": infer TBody } } }
    ? TBody
    : never;

type ListProjectsQuery = OpenApiQuery<"/api/v1/projects", "get">;
type CreateProjectPayload = OpenApiJsonBody<"/api/v1/projects", "post">;
type UpdateProjectPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}", "patch">;
type ListTasksOpenApiQuery = OpenApiQuery<"/api/v1/tasks", "get">;
type ListTasksQuery = Omit<ListTasksOpenApiQuery, "statuses" | "priorities" | "types"> & {
  statuses?: TaskStatus[];
  priorities?: TaskPriority[];
  types?: TaskType[];
};
type CreateTaskPayload = OpenApiJsonBody<"/api/v1/tasks", "post">;
type UpdateTaskPayload = OpenApiJsonBody<"/api/v1/tasks/{taskId}", "patch">;
type CreateBoardColumnPayload = OpenApiJsonBody<"/api/v1/agile/boards/{boardId}/columns", "post">;
type UpdateBoardColumnPayload = OpenApiJsonBody<"/api/v1/agile/boards/{boardId}/columns/{columnId}", "patch">;
type ReorderBoardColumnsPayload = OpenApiJsonBody<"/api/v1/agile/boards/{boardId}/columns/reorder", "patch">;
type UpdateTaskOrderPayload = OpenApiJsonBody<"/api/v1/agile/tasks/{taskId}/order", "patch">;
type UpdateTaskStatusPayload = OpenApiJsonBody<"/api/v1/agile/tasks/{taskId}/status", "patch">;

export class ApiError extends Error {
  status: number;
  details: unknown;
  requestId?: string;

  constructor(status: number, message: string, details: unknown, requestId?: string) {
    super(message);
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

function resolveUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function resolveOpenApiPath<TPath extends OpenApiPath, TMethod extends OpenApiMethod<TPath>>(
  path: TPath,
  pathParams: OpenApiPathParams<TPath, TMethod>,
) {
  const params = pathParams as Record<string, string | number | boolean | null | undefined>;
  return path
    .replace(/^\/api\/v1/, "")
    .replace(/\{([^}]+)\}/g, (_, key: string) => {
      const value = params[key];
      if (value === undefined || value === null) {
        throw new Error(`Missing OpenAPI path parameter: ${key}`);
      }

      return encodeURIComponent(String(value));
    });
}

function resolveOpenApiQueryString(query: Record<string, unknown> | undefined) {
  if (!query) return "";

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","));
      return;
    }

    params.set(key, String(value));
  });

  const text = params.toString();
  return text ? `?${text}` : "";
}

function openApiRequest<
  TResult,
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod<TPath>,
>(
  path: TPath,
  method: TMethod,
  options: Omit<RequestOptions, "body" | "method"> & {
    body?: OpenApiJsonBody<TPath, TMethod>;
    pathParams: OpenApiPathParams<TPath, TMethod>;
    query?: OpenApiQuery<TPath, TMethod>;
  },
) {
  const { body, pathParams, query, ...requestOptions } = options;
  const requestPath = `${resolveOpenApiPath<TPath, TMethod>(path, pathParams)}${resolveOpenApiQueryString(query)}`;

  return apiRequest<TResult>(requestPath, {
    ...requestOptions,
    method: method.toUpperCase(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function readErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "TaskBricks API request failed";
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return text;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, body, skipAuthRefresh, ...init } = options;
  const requestHeaders = new Headers(headers);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (!isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (!requestHeaders.has("X-Request-Id")) {
    requestHeaders.set("X-Request-Id", createRequestId());
  }

  const response = await fetch(resolveUrl(path), {
    ...init,
    body,
    headers: requestHeaders,
    credentials: "include",
  });
  const payload = await parseResponse(response);
  const requestId = response.headers.get("x-request-id") ?? requestHeaders.get("X-Request-Id") ?? undefined;

  if (!response.ok) {
    if (response.status === 401 && token && !skipAuthRefresh && typeof window !== "undefined") {
      try {
        const refreshed = await apiRequest<AuthResponse>("/auth/refresh", {
          method: "POST",
          skipAuthRefresh: true,
        });

        setStoredAuth(refreshed);

        return apiRequest<T>(path, {
          ...options,
          token: refreshed.accessToken,
          skipAuthRefresh: true,
        });
      } catch {
        clearStoredAuth();
      }
    }

    throw new ApiError(response.status, readErrorMessage(payload), payload, requestId);
  }

  return payload as T;
}

export function unwrapPage<T>(payload: T[] | PaginatedResponse<T>) {
  return Array.isArray(payload) ? payload : payload.data;
}

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;

  const accessToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const userText = window.localStorage.getItem(USER_KEY);

  cleanupLegacyAuthTokens();

  if (!accessToken || !userText) return null;

  try {
    return {
      accessToken,
      user: JSON.parse(userText) as AuthUser,
    };
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function setStoredAuth(auth: Pick<AuthResponse, "accessToken" | "user">) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  cleanupLegacyAuthTokens();
  window.dispatchEvent(new CustomEvent(AUTH_UPDATED_EVENT, { detail: { accessToken: auth.accessToken, user: auth.user } }));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  cleanupLegacyAuthTokens();
  window.dispatchEvent(new CustomEvent(AUTH_UPDATED_EVENT, { detail: null }));
}

function cleanupLegacyAuthTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_TRUSTED_DEVICE_KEY);
}

export function login(payload: { tenantSlug: string; email: string; password: string }) {
  return apiRequest<AuthResponse | MfaChallengeResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyMfaLogin(payload: { mfaToken: string; code: string; rememberDevice?: boolean; deviceName?: string }) {
  return apiRequest<AuthResponse>("/auth/mfa/verify-login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: {
  tenantName: string;
  tenantSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  return apiRequest<AuthResponse | AuthLifecycleResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyEmail(payload: { token: string }) {
  return apiRequest<AuthResponse>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resendVerification(payload: { tenantSlug: string; email: string }) {
  return apiRequest<AuthLifecycleResponse>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function acceptInvite(payload: { token: string; password: string; firstName?: string; lastName?: string }) {
  return apiRequest<AuthResponse>("/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function forgotPassword(payload: { tenantSlug: string; email: string }) {
  return apiRequest<AuthLifecycleResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetPassword(payload: { token: string; password: string }) {
  return apiRequest<{ success: boolean; message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function changePassword(
  token: string,
  payload: { currentPassword: string; newPassword: string; revokeOtherSessions?: boolean },
) {
  return apiRequest<{ success: boolean; message: string }>("/auth/change-password", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getIdentitySecurityOverview(token: string) {
  return apiRequest<IdentitySecurityOverview>("/identity-security/overview", {
    token,
    cache: "no-store",
  });
}

export function setupTotp(token: string, payload: { label?: string } = {}) {
  return apiRequest<TotpSetupResponse>("/identity-security/mfa/totp/setup", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function enableTotp(token: string, payload: { factorId: string; code: string }) {
  return apiRequest<{ success: boolean; backupCodes: string[] }>("/identity-security/mfa/totp/enable", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function disableMfa(token: string, payload: { code?: string; currentPassword?: string }) {
  return apiRequest<{ success: boolean }>("/identity-security/mfa/disable", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function regenerateBackupCodes(token: string, payload: { code: string }) {
  return apiRequest<{ backupCodes: string[] }>("/identity-security/mfa/backup-codes/regenerate", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function revokeTrustedDevice(token: string, deviceId: string) {
  return apiRequest<{ success: boolean }>(`/identity-security/trusted-devices/${deviceId}`, {
    method: "DELETE",
    token,
  });
}

export function refreshSession() {
  return apiRequest<AuthResponse>("/auth/refresh", {
    method: "POST",
    skipAuthRefresh: true,
  });
}

export function logoutSession(token?: string) {
  return apiRequest<{ success: boolean }>("/auth/logout", {
    method: "POST",
    token,
    skipAuthRefresh: true,
  });
}

export function getMe(token: string) {
  return apiRequest<AuthUser>("/auth/me", { token, cache: "no-store" });
}

export function updateMyProfile(
  token: string,
  payload: { firstName?: string; lastName?: string; timezone?: string; locale?: string; avatarUrl?: string },
) {
  return apiRequest<TenantUser>("/users/me/profile", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function healthReady() {
  return apiRequest<ReadinessResponse>("/health/ready", { cache: "no-store" });
}

export function moduleStatus(path: string) {
  return apiRequest<ModuleStatus>(path, { cache: "no-store" });
}

function boundedLimit(value: number | undefined, fallback = 50) {
  return Math.min(Math.max(value ?? fallback, 1), 100);
}

function siteParams(query: { page?: number; limit?: number; search?: string }, fallback = 30) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, fallback)),
  });
  if (query.search) params.set("search", query.search);
  return params;
}

export function listWorkspaces(token: string, query: { page?: number; limit?: number; search?: string } = {}) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.search) params.set("search", query.search);

  return apiRequest<PaginatedResponse<Workspace>>(`/workspaces?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listTeams(token: string, query: { page?: number; limit?: number; search?: string; workspaceId?: string } = {}) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.workspaceId) params.set("workspaceId", query.workspaceId);

  return apiRequest<PaginatedResponse<Team>>(`/teams?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listMeetingTypes(
  token: string,
  query: { page?: number; limit?: number; search?: string; category?: MeetingTypeCategory; isActive?: boolean } = {},
) {
  const params = siteParams(query, 100);
  if (query.category) params.set("category", query.category);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));
  return apiRequest<PaginatedResponse<MeetingType>>(`/meetings/types?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createMeetingType(
  token: string,
  payload: {
    name: string;
    slug?: string;
    description?: string;
    category?: MeetingTypeCategory;
    durationMins?: number;
    locationMode?: MeetingLocationMode;
    defaultVisibility?: Visibility;
    requiresApproval?: boolean;
    defaultAgenda?: string[];
    defaultReminderMins?: number[];
    color?: string;
    icon?: string;
  },
) {
  return apiRequest<MeetingType>("/meetings/types", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateMeetingType(token: string, typeId: string, payload: Partial<MeetingType>) {
  return apiRequest<MeetingType>(`/meetings/types/${typeId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function listMeetings(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    projectId?: string;
    taskId?: string;
    teamId?: string;
    hostId?: string;
    meetingTypeId?: string;
    status?: MeetingStatus;
    from?: string;
    to?: string;
    includeArchived?: boolean;
  } = {},
) {
  const params = siteParams(query, 50);
  if (query.projectId) params.set("projectId", query.projectId);
  if (query.taskId) params.set("taskId", query.taskId);
  if (query.teamId) params.set("teamId", query.teamId);
  if (query.hostId) params.set("hostId", query.hostId);
  if (query.meetingTypeId) params.set("meetingTypeId", query.meetingTypeId);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.includeArchived !== undefined) params.set("includeArchived", String(query.includeArchived));
  return apiRequest<PaginatedResponse<Meeting>>(`/meetings?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getMeeting(token: string, meetingId: string) {
  return apiRequest<Meeting>(`/meetings/${meetingId}`, { token, cache: "no-store" });
}

export function createMeeting(
  token: string,
  payload: {
    title: string;
    description?: string;
    meetingTypeId?: string;
    projectId?: string;
    sprintId?: string;
    taskId?: string;
    teamId?: string;
    hostId?: string;
    startAt: string;
    endAt: string;
    timezone?: string;
    locationMode?: MeetingLocationMode;
    locationName?: string;
    meetingUrl?: string;
    conferenceProvider?: string;
    clientName?: string;
    clientEmail?: string;
    clientCompany?: string;
    visibility?: Visibility;
    attendeeIds?: string[];
    externalAttendees?: Array<{ email: string; name?: string; role?: MeetingAttendeeRole }>;
    agendaItems?: Array<{ title: string; notes?: string; durationMins?: number; sortOrder?: number }>;
    reminderOffsets?: number[];
    allowConflicts?: boolean;
    aiEnabled?: boolean;
  },
) {
  return apiRequest<Meeting>("/meetings", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateMeeting(token: string, meetingId: string, payload: Partial<Meeting> & { allowConflicts?: boolean }) {
  return apiRequest<Meeting>(`/meetings/${meetingId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function cancelMeeting(token: string, meetingId: string, payload: { reason?: string } = {}) {
  return apiRequest<Meeting>(`/meetings/${meetingId}/cancel`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function completeMeeting(token: string, meetingId: string) {
  return apiRequest<Meeting>(`/meetings/${meetingId}/complete`, {
    method: "POST",
    token,
  });
}

export function startMeeting(token: string, meetingId: string) {
  return apiRequest<Meeting>(`/meetings/${meetingId}/start`, {
    method: "POST",
    token,
  });
}

export function archiveMeeting(token: string, meetingId: string) {
  return apiRequest<Meeting>(`/meetings/${meetingId}/archive`, {
    method: "POST",
    token,
  });
}

export function restoreMeeting(token: string, meetingId: string) {
  return apiRequest<Meeting>(`/meetings/${meetingId}/restore`, {
    method: "POST",
    token,
  });
}

export function getMeetingIntegrationStatus(token: string) {
  return apiRequest<MeetingIntegrationStatus>("/meetings/integrations/status", {
    token,
    cache: "no-store",
  });
}

export function getMeetingIntegrationSettings(token: string) {
  return apiRequest<MeetingIntegrationSettings>("/meetings/integrations/settings", {
    token,
    cache: "no-store",
  });
}

export function updateMeetingIntegrationSettings(token: string, payload: Partial<MeetingIntegrationSettings>) {
  return apiRequest<MeetingIntegrationSettings>("/meetings/integrations/settings", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function getMeetingAdminOverview(
  token: string,
  query: { page?: number; limit?: number; search?: string; from?: string; to?: string; hostId?: string; projectId?: string; status?: MeetingStatus } = {},
) {
  const params = siteParams(query, 30);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.hostId) params.set("hostId", query.hostId);
  if (query.projectId) params.set("projectId", query.projectId);
  if (query.status) params.set("status", query.status);
  return apiRequest<MeetingAdminOverview>(`/meetings/admin/overview?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getMeetingPolicy(token: string) {
  return apiRequest<MeetingPolicy>("/meetings/admin/policy", {
    token,
    cache: "no-store",
  });
}

export function updateMeetingPolicy(token: string, payload: Partial<MeetingPolicy>) {
  return apiRequest<MeetingPolicy>("/meetings/admin/policy", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function getMeetingAdminAnalytics(
  token: string,
  query: { page?: number; limit?: number; search?: string; from?: string; to?: string; hostId?: string; projectId?: string; status?: MeetingStatus } = {},
) {
  const params = siteParams(query, 30);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.hostId) params.set("hostId", query.hostId);
  if (query.projectId) params.set("projectId", query.projectId);
  if (query.status) params.set("status", query.status);
  return apiRequest<MeetingAdminAnalytics>(`/meetings/admin/analytics?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listMeetingAdminReminderLogs(
  token: string,
  query: { page?: number; limit?: number; search?: string; meetingId?: string; status?: MeetingReminderJobStatus; channel?: MeetingReminderChannel; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 50);
  if (query.meetingId) params.set("meetingId", query.meetingId);
  if (query.status) params.set("status", query.status);
  if (query.channel) params.set("channel", query.channel);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<MetaPaginatedResponse<MeetingReminderJob>>(`/meetings/admin/reminder-logs?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createMeetingConference(
  token: string,
  meetingId: string,
  payload: {
    provider?: MeetingConferenceProvider;
    meetingUrl?: string;
    locationName?: string;
    calendarId?: string;
    sendUpdates?: "all" | "externalOnly" | "none";
    metadata?: Record<string, unknown>;
  },
) {
  return apiRequest<{ meeting: Partial<Meeting>; provider: MeetingConferenceProvider; message: string }>(`/meetings/${meetingId}/conference`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listMeetingReminderJobs(
  token: string,
  query: {
    page?: number;
    limit?: number;
    status?: MeetingReminderJobStatus;
    channel?: MeetingReminderChannel;
    meetingId?: string;
    dueOnly?: boolean;
    from?: string;
    to?: string;
  } = {},
) {
  const params = siteParams(query, 100);
  if (query.status) params.set("status", query.status);
  if (query.channel) params.set("channel", query.channel);
  if (query.meetingId) params.set("meetingId", query.meetingId);
  if (query.dueOnly !== undefined) params.set("dueOnly", String(query.dueOnly));
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<PaginatedResponse<MeetingReminderJob>>(`/meetings/reminder-jobs?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function processMeetingReminderJobs(token: string, payload: { limit?: number } = {}) {
  return apiRequest<{ processed: number; sent: number; failed: number; deadLetter: number; results: Array<{ id: string; status: string; provider?: string; error?: string }> }>("/meetings/reminder-jobs/process", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function retryMeetingReminderJob(token: string, jobId: string) {
  return apiRequest<{ job: MeetingReminderJob; previousStatus: MeetingReminderJobStatus }>(`/meetings/reminder-jobs/${jobId}/retry`, {
    method: "POST",
    token,
  });
}

export type MeetingAiGeneratePayload = {
  prompt?: string;
  transcript?: string;
  notes?: string;
  focusAreas?: string[];
  metadata?: Record<string, unknown>;
};

export function getMeetingAiState(token: string, meetingId: string) {
  return apiRequest<MeetingAiState>(`/meetings/${meetingId}/ai`, {
    token,
    cache: "no-store",
  });
}

export function linkMeetingAiContext(
  token: string,
  meetingId: string,
  payload: MeetingAiState["links"],
) {
  return apiRequest<MeetingAiState>(`/meetings/${meetingId}/ai/links`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function generateMeetingAiAgenda(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return apiRequest<MeetingAiState>(`/meetings/${meetingId}/ai/agenda`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function generateMeetingAiPreparationBrief(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return apiRequest<MeetingAiState>(`/meetings/${meetingId}/ai/preparation-brief`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function suggestMeetingAiAttendees(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return apiRequest<MeetingAiState>(`/meetings/${meetingId}/ai/suggest-attendees`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function detectMeetingAiRisks(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return apiRequest<MeetingAiState>(`/meetings/${meetingId}/ai/risk-detection`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function generateMeetingAiNotes(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return apiRequest<MeetingAiState>(`/meetings/${meetingId}/ai/notes`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function generateMeetingAiFollowUp(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return apiRequest<MeetingAiState>(`/meetings/${meetingId}/ai/follow-up`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function generateMeetingAiRoleSummary(
  token: string,
  meetingId: string,
  payload: MeetingAiGeneratePayload & { role?: "EXECUTIVE" | "PROJECT_MANAGER" | "ASSIGNEE"; assigneeId?: string } = {},
) {
  return apiRequest<MeetingAiState>(`/meetings/${meetingId}/ai/role-summary`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function scoreMeetingAiEffectiveness(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return apiRequest<MeetingAiState>(`/meetings/${meetingId}/ai/effectiveness-score`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function detectMeetingAiMissedDecisions(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return apiRequest<MeetingAiState>(`/meetings/${meetingId}/ai/missed-decisions`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function convertMeetingAiActionItems(
  token: string,
  meetingId: string,
  payload: {
    actionItemIds?: string[];
    defaultProjectId?: string;
    defaultSprintId?: string;
    defaultAssigneeId?: string;
    defaultDueDate?: string;
    defaultTaskType?: TaskType;
    defaultPriority?: TaskPriority;
    createChecklist?: boolean;
  } = {},
) {
  return apiRequest<{ meetingId: string; converted: number; tasks: Task[]; actionItems: MeetingAiActionItem[] }>(`/meetings/${meetingId}/ai/action-items/convert-tasks`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function scheduleMeetingAiFollowUpReminders(
  token: string,
  meetingId: string,
  payload: { actionItemIds?: string[]; dueOffsetMinutes?: number } = {},
) {
  return apiRequest<{ meetingId: string; created: MeetingReminder[]; actionItems: MeetingAiActionItem[] }>(`/meetings/${meetingId}/ai/action-items/follow-up-reminders`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listMeetingAvailability(
  token: string,
  query: { ownerId?: string; teamId?: string; scope?: MeetingAvailabilityScope } = {},
) {
  const params = new URLSearchParams();
  if (query.ownerId) params.set("ownerId", query.ownerId);
  if (query.teamId) params.set("teamId", query.teamId);
  if (query.scope) params.set("scope", query.scope);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<MeetingAvailability>(`/meetings/availability${suffix}`, {
    token,
    cache: "no-store",
  });
}

export function createMeetingAvailabilityWindow(
  token: string,
  payload: {
    ownerId?: string;
    teamId?: string;
    scope?: MeetingAvailabilityScope;
    label?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone?: string;
    capacity?: number;
  },
) {
  return apiRequest<MeetingAvailabilityWindow>("/meetings/availability/windows", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteMeetingAvailabilityWindow(token: string, windowId: string) {
  return apiRequest<{ success: boolean }>(`/meetings/availability/windows/${windowId}`, {
    method: "DELETE",
    token,
  });
}

export function listBookingPages(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    scope?: BookingPageScope;
    routingStrategy?: BookingRoutingStrategy;
    meetingTypeId?: string;
    teamId?: string;
    ownerId?: string;
    isActive?: boolean;
  } = {},
) {
  const params = siteParams(query, 50);
  if (query.scope) params.set("scope", query.scope);
  if (query.routingStrategy) params.set("routingStrategy", query.routingStrategy);
  if (query.meetingTypeId) params.set("meetingTypeId", query.meetingTypeId);
  if (query.teamId) params.set("teamId", query.teamId);
  if (query.ownerId) params.set("ownerId", query.ownerId);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));
  return apiRequest<PaginatedResponse<BookingPage>>(`/meetings/booking/pages?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export type BookingPagePayload = {
  path: string;
  title: string;
  subtitle?: string;
  description?: string;
  scope?: BookingPageScope;
  routingStrategy?: BookingRoutingStrategy;
  meetingTypeId?: string;
  teamId?: string;
  ownerId?: string;
  department?: string;
  durationMins?: number;
  bufferBeforeMins?: number;
  bufferAfterMins?: number;
  minNoticeMins?: number;
  rollingWindowDays?: number;
  dailyLimit?: number;
  weeklyLimit?: number;
  approvalRequired?: boolean;
  allowReschedule?: boolean;
  allowCancel?: boolean;
  collectCompanyName?: boolean;
  locationMode?: MeetingLocationMode;
  locationName?: string;
  meetingUrl?: string;
  conferenceProvider?: string;
  timezone?: string;
  brandColor?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
  fields?: Array<{
    fieldKey: string;
    label: string;
    type?: BookingFormFieldType;
    required?: boolean;
    placeholder?: string;
    helpText?: string;
    options?: string[];
    sortOrder?: number;
  }>;
};

export function createBookingPage(token: string, payload: BookingPagePayload) {
  return apiRequest<BookingPage>("/meetings/booking/pages", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateBookingPage(token: string, pageId: string, payload: Partial<BookingPagePayload>) {
  return apiRequest<BookingPage>(`/meetings/booking/pages/${pageId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function createBookingFormField(token: string, pageId: string, payload: NonNullable<BookingPagePayload["fields"]>[number]) {
  return apiRequest<BookingFormField>(`/meetings/booking/pages/${pageId}/fields`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateBookingFormField(token: string, pageId: string, fieldId: string, payload: Partial<NonNullable<BookingPagePayload["fields"]>[number]> & { isActive?: boolean }) {
  return apiRequest<BookingFormField>(`/meetings/booking/pages/${pageId}/fields/${fieldId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteBookingFormField(token: string, pageId: string, fieldId: string) {
  return apiRequest<{ success: boolean }>(`/meetings/booking/pages/${pageId}/fields/${fieldId}`, {
    method: "DELETE",
    token,
  });
}

export function listBookingRequests(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    scope?: BookingPageScope;
    routingStrategy?: BookingRoutingStrategy;
    meetingTypeId?: string;
    teamId?: string;
    ownerId?: string;
  } = {},
) {
  const params = siteParams(query, 50);
  if (query.scope) params.set("scope", query.scope);
  if (query.routingStrategy) params.set("routingStrategy", query.routingStrategy);
  if (query.meetingTypeId) params.set("meetingTypeId", query.meetingTypeId);
  if (query.teamId) params.set("teamId", query.teamId);
  if (query.ownerId) params.set("ownerId", query.ownerId);
  return apiRequest<PaginatedResponse<BookingRequest>>(`/meetings/booking/requests?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function resolvePublicBookingPage(tenantSlug: string, path: string) {
  const params = new URLSearchParams({ path });
  return apiRequest<PublicBookingPageResponse>(`/booking/public/${encodeURIComponent(tenantSlug)}/page?${params.toString()}`, {
    cache: "no-store",
  });
}

export function listPublicBookingSlots(tenantSlug: string, path: string, query: { from?: string; to?: string } = {}) {
  const params = new URLSearchParams({ path });
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<PublicBookingSlotsResponse>(`/booking/public/${encodeURIComponent(tenantSlug)}/slots?${params.toString()}`, {
    cache: "no-store",
  });
}

export function createPublicBooking(
  tenantSlug: string,
  payload: {
    path: string;
    startAt: string;
    hostId?: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    guestCompany?: string;
    guestTimezone?: string;
    notes?: string;
    intakeResponses?: Array<{ fieldKey: string; value?: unknown }>;
  },
) {
  return apiRequest<PublicBookingCreateResponse>(`/booking/public/${encodeURIComponent(tenantSlug)}/book`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cancelPublicBooking(token: string, payload: { reason?: string } = {}) {
  return apiRequest<BookingRequest>(`/booking/public/cancel/${encodeURIComponent(token)}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reschedulePublicBooking(token: string, payload: { startAt: string; hostId?: string }) {
  return apiRequest<PublicBookingCreateResponse>(`/booking/public/reschedule/${encodeURIComponent(token)}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function addMeetingAttendee(
  token: string,
  meetingId: string,
  payload: { userId?: string; email?: string; name?: string; role?: MeetingAttendeeRole },
) {
  return apiRequest<MeetingAttendee>(`/meetings/${meetingId}/attendees`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateMeetingAttendee(
  token: string,
  meetingId: string,
  attendeeId: string,
  payload: { role?: MeetingAttendeeRole; status?: MeetingAttendeeStatus; responseNote?: string | null },
) {
  return apiRequest<MeetingAttendee>(`/meetings/${meetingId}/attendees/${attendeeId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function createMeetingAgendaItem(
  token: string,
  meetingId: string,
  payload: { title: string; notes?: string; durationMins?: number; sortOrder?: number },
) {
  return apiRequest<MeetingAgendaItem>(`/meetings/${meetingId}/agenda`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateMeetingAgendaItem(
  token: string,
  meetingId: string,
  itemId: string,
  payload: Partial<Pick<MeetingAgendaItem, "title" | "notes" | "status" | "durationMins" | "sortOrder">>,
) {
  return apiRequest<MeetingAgendaItem>(`/meetings/${meetingId}/agenda/${itemId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function createMeetingReminder(
  token: string,
  meetingId: string,
  payload: { channel: MeetingReminderChannel; offsetMinutes: number; attendeeId?: string; destination?: string; templateKey?: string },
) {
  return apiRequest<MeetingReminder>(`/meetings/${meetingId}/reminders`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listMeetingActivity(token: string, meetingId: string) {
  return apiRequest<MeetingActivity[]>(`/meetings/${meetingId}/activity`, {
    token,
    cache: "no-store",
  });
}

export function getMeetingWorkspace(token: string, meetingId: string) {
  return apiRequest<MeetingWorkspace>(`/meetings/${meetingId}/workspace`, {
    token,
    cache: "no-store",
  });
}

export function updateLiveMeetingNotes(
  token: string,
  meetingId: string,
  payload: { notes: string; version?: number; cursor?: Record<string, unknown> },
) {
  return apiRequest<MeetingWorkspace["live"]>(`/meetings/${meetingId}/live-notes`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function createMeetingComment(token: string, meetingId: string, payload: { body: string; metadata?: Record<string, unknown> }) {
  return apiRequest<MeetingComment>(`/meetings/${meetingId}/comments`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateMeetingComment(token: string, meetingId: string, commentId: string, payload: { body: string }) {
  return apiRequest<MeetingComment>(`/meetings/${meetingId}/comments/${commentId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteMeetingComment(token: string, meetingId: string, commentId: string) {
  return apiRequest<{ success: boolean }>(`/meetings/${meetingId}/comments/${commentId}`, {
    method: "DELETE",
    token,
  });
}

export function createMeetingDecision(
  token: string,
  meetingId: string,
  payload: {
    title: string;
    summary?: string;
    impact?: string;
    status?: MeetingDecisionStatus;
    ownerId?: string;
    taskId?: string;
    dueAt?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return apiRequest<MeetingDecision>(`/meetings/${meetingId}/decisions`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateMeetingDecision(token: string, meetingId: string, decisionId: string, payload: Partial<MeetingDecision>) {
  return apiRequest<MeetingDecision>(`/meetings/${meetingId}/decisions/${decisionId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteMeetingDecision(token: string, meetingId: string, decisionId: string) {
  return apiRequest<{ success: boolean }>(`/meetings/${meetingId}/decisions/${decisionId}`, {
    method: "DELETE",
    token,
  });
}

export function createMeetingChecklistItem(
  token: string,
  meetingId: string,
  payload: { title: string; notes?: string; ownerId?: string; taskId?: string; dueAt?: string; sortOrder?: number; metadata?: Record<string, unknown> },
) {
  return apiRequest<MeetingChecklistItem>(`/meetings/${meetingId}/checklist`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateMeetingChecklistItem(
  token: string,
  meetingId: string,
  itemId: string,
  payload: Partial<Pick<MeetingChecklistItem, "title" | "notes" | "isDone" | "ownerId" | "taskId" | "dueAt" | "sortOrder" | "metadata">>,
) {
  return apiRequest<MeetingChecklistItem>(`/meetings/${meetingId}/checklist/${itemId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteMeetingChecklistItem(token: string, meetingId: string, itemId: string) {
  return apiRequest<{ success: boolean }>(`/meetings/${meetingId}/checklist/${itemId}`, {
    method: "DELETE",
    token,
  });
}

export function updateMeetingAttendance(
  token: string,
  meetingId: string,
  attendeeId: string,
  payload: { status: MeetingAttendeeStatus; responseNote?: string | null; metadata?: Record<string, unknown> },
) {
  return apiRequest<MeetingAttendee>(`/meetings/${meetingId}/attendance/${attendeeId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function markMeetingNoShow(token: string, meetingId: string) {
  return apiRequest<Meeting>(`/meetings/${meetingId}/no-show`, {
    method: "POST",
    token,
  });
}

export function assignMeetingActionItem(
  token: string,
  meetingId: string,
  payload: {
    title: string;
    description?: string;
    projectId?: string;
    sprintId?: string;
    assigneeId?: string;
    dueDate?: string;
    priority?: TaskPriority;
    type?: TaskType;
    actionItemId?: string;
  },
) {
  return apiRequest<{ task: Task; actionItemId?: string | null }>(`/meetings/${meetingId}/action-items/assign`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function sendMeetingFollowUp(
  token: string,
  meetingId: string,
  payload: {
    subject?: string;
    body: string;
    channels?: MeetingReminderChannel[];
    recipients?: string[];
    includeActionItems?: boolean;
    syncToOmoFlow?: boolean;
  },
) {
  return apiRequest<{ queued: number; reminders: MeetingReminder[] }>(`/meetings/${meetingId}/follow-up`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function syncMeetingOmoFlowRuntime(token: string, meetingId: string, payload: { provider?: string; payload?: Record<string, unknown> } = {}) {
  return apiRequest<{ meeting: Meeting; runtimeState: Record<string, unknown> }>(`/meetings/${meetingId}/omoflow/sync`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function createTeam(
  token: string,
  payload: { name: string; description?: string; workspaceId?: string },
) {
  return apiRequest<Team>("/teams", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listTeamMembers(token: string, teamId: string) {
  return apiRequest<TeamMember[]>(`/teams/${teamId}/members`, {
    token,
    cache: "no-store",
  });
}

export function addTeamMember(
  token: string,
  teamId: string,
  payload: { userId: string; role?: string },
) {
  return apiRequest<TeamMember>(`/teams/${teamId}/members`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateTeamMemberRole(token: string, teamId: string, userId: string, role?: string) {
  return addTeamMember(token, teamId, { userId, role });
}

export function removeTeamMember(token: string, teamId: string, userId: string) {
  return apiRequest<{ success: boolean }>(`/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function inviteTeamMember(
  token: string,
  teamId: string,
  payload: { email: string; firstName: string; lastName: string; teamRole?: string; roleIds?: string[] },
) {
  return apiRequest<TeamMember>(`/teams/${teamId}/invite`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function inviteTenantUser(
  token: string,
  payload: { email: string; firstName: string; lastName: string; roleIds?: string[] },
) {
  return apiRequest<TenantUser>("/users/invite", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function bulkInviteTenantUsers(
  token: string,
  payload: { users: BulkInviteUserInput[]; defaultRoleIds?: string[]; sendInvites?: boolean },
) {
  return apiRequest<BulkInviteUsersResponse>("/users/bulk-invite", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listUsers(token: string, query: { search?: string; page?: number; limit?: number } = {}) {
  const limit = Math.min(Math.max(query.limit ?? 100, 1), 100);
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(limit),
  });
  if (query.search) params.set("search", query.search);

  return apiRequest<PaginatedResponse<TenantUser>>(`/users?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function globalSearch(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: SearchCategory;
    contextType?: string;
    contextId?: string;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 24)),
  });
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.contextType) params.set("contextType", query.contextType);
  if (query.contextId) params.set("contextId", query.contextId);

  return apiRequest<GlobalSearchResponse>(`/search?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listRoles(token: string) {
  return apiRequest<Role[]>("/roles", {
    token,
    cache: "no-store",
  });
}

export function listPermissions(token: string) {
  return apiRequest<Permission[]>("/permissions", {
    token,
    cache: "no-store",
  });
}

export function createRole(
  token: string,
  payload: { name: string; description?: string; permissionIds?: string[] },
) {
  return apiRequest<Role>("/roles", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateRole(
  token: string,
  roleId: string,
  payload: { name?: string; description?: string; permissionIds?: string[] },
) {
  return apiRequest<Role>(`/roles/${roleId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteRole(token: string, roleId: string) {
  return apiRequest<{ success: boolean }>(`/roles/${roleId}`, {
    method: "DELETE",
    token,
  });
}

export function assignRole(token: string, payload: { userId: string; roleId: string }) {
  return apiRequest<{ success: boolean }>("/roles/assignments", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function removeRoleFromUser(token: string, roleId: string, userId: string) {
  return apiRequest<{ success: boolean }>(`/roles/${roleId}/users/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function getCurrentTenant(token: string) {
  return apiRequest<Tenant>("/tenants/current", {
    token,
    cache: "no-store",
  });
}

export function updateCurrentTenant(
  token: string,
  payload: { name?: string; logoUrl?: string; website?: string },
) {
  return apiRequest<Tenant>("/tenants/current", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function listProjects(
  token: string,
  query: ListProjectsQuery = {},
) {
  return openApiRequest<PaginatedResponse<Project>, "/api/v1/projects", "get">("/api/v1/projects", "get", {
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 100),
    },
    token,
    cache: "no-store",
  });
}

export function listDocumentFolders(
  token: string,
  query: { page?: number; limit?: number; search?: string; parentId?: string; includeArchived?: boolean } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.parentId) params.set("parentId", query.parentId);
  if (query.includeArchived !== undefined) params.set("includeArchived", String(query.includeArchived));

  return apiRequest<PaginatedResponse<DocumentFolder>>(`/document-folders?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getDocumentFolderTree(token: string, query: { includeArchived?: boolean } = {}) {
  const params = new URLSearchParams();
  if (query.includeArchived !== undefined) params.set("includeArchived", String(query.includeArchived));
  const suffix = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<DocumentFolder[]>(`/document-folders/tree${suffix}`, {
    token,
    cache: "no-store",
  });
}

export function createDocumentFolder(
  token: string,
  payload: { name: string; description?: string; parentId?: string },
) {
  return apiRequest<DocumentFolder>("/document-folders", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateDocumentFolder(
  token: string,
  folderId: string,
  payload: { name?: string; description?: string; parentId?: string | null },
) {
  return apiRequest<DocumentFolder>(`/document-folders/${folderId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function archiveDocumentFolder(token: string, folderId: string) {
  return apiRequest<DocumentFolder>(`/document-folders/${folderId}/archive`, {
    method: "POST",
    token,
  });
}

export function restoreDocumentFolder(token: string, folderId: string) {
  return apiRequest<DocumentFolder>(`/document-folders/${folderId}/restore`, {
    method: "POST",
    token,
  });
}

export function deleteDocumentFolder(token: string, folderId: string) {
  return apiRequest<{ success: boolean }>(`/document-folders/${folderId}`, {
    method: "DELETE",
    token,
  });
}

export function listDocuments(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    projectId?: string;
    folderId?: string;
    documentType?: string;
    status?: DocumentStatus;
    visibility?: Visibility;
    includeArchived?: boolean;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.projectId) params.set("projectId", query.projectId);
  if (query.folderId) params.set("folderId", query.folderId);
  if (query.documentType) params.set("documentType", query.documentType);
  if (query.status) params.set("status", query.status);
  if (query.visibility) params.set("visibility", query.visibility);
  if (query.includeArchived !== undefined) params.set("includeArchived", String(query.includeArchived));

  return apiRequest<PaginatedResponse<WorkspaceDocument>>(`/documents?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createDocument(token: string, payload: DocumentPayload) {
  return apiRequest<WorkspaceDocument>("/documents", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getDocument(token: string, documentId: string) {
  return apiRequest<WorkspaceDocument>(`/documents/${documentId}`, {
    token,
    cache: "no-store",
  });
}

export function updateDocument(token: string, documentId: string, payload: Partial<DocumentPayload>) {
  return apiRequest<WorkspaceDocument>(`/documents/${documentId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function publishDocument(token: string, documentId: string) {
  return apiRequest<WorkspaceDocument>(`/documents/${documentId}/publish`, {
    method: "POST",
    token,
  });
}

export function archiveDocument(token: string, documentId: string) {
  return apiRequest<WorkspaceDocument>(`/documents/${documentId}/archive`, {
    method: "POST",
    token,
  });
}

export function restoreDocument(token: string, documentId: string) {
  return apiRequest<WorkspaceDocument>(`/documents/${documentId}/restore`, {
    method: "POST",
    token,
  });
}

export function hardDeleteDocument(token: string, documentId: string) {
  return apiRequest<{ success: boolean }>(`/documents/${documentId}/hard-delete`, {
    method: "DELETE",
    token,
  });
}

export function listDocumentVersions(token: string, documentId: string) {
  return apiRequest<DocumentVersion[]>(`/documents/${documentId}/versions`, {
    token,
    cache: "no-store",
  });
}

export function restoreDocumentVersion(
  token: string,
  documentId: string,
  version: number,
  payload: { changeNote?: string } = {},
) {
  return apiRequest<WorkspaceDocument>(`/documents/${documentId}/versions/${version}/restore`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getProject(token: string, projectId: string) {
  return openApiRequest<Project, "/api/v1/projects/{projectId}", "get">(
    "/api/v1/projects/{projectId}",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function getProjectPermissions(token: string, projectId: string) {
  return apiRequest<ProjectPermissionMatrix>(`/projects/${projectId}/permissions`, {
    token,
    cache: "no-store",
  });
}

export function updateProject(
  token: string,
  projectId: string,
  payload: UpdateProjectPayload,
) {
  return openApiRequest<Project, "/api/v1/projects/{projectId}", "patch">(
    "/api/v1/projects/{projectId}",
    "patch",
    {
      pathParams: { projectId },
      token,
      body: payload,
    },
  );
}

export function deleteProject(token: string, projectId: string) {
  return apiRequest<{ success: boolean }>(`/projects/${projectId}`, {
    method: "DELETE",
    token,
  });
}

export function listProjectMembers(token: string, projectId: string) {
  return apiRequest<ProjectMember[]>(`/projects/${projectId}/members`, { token, cache: "no-store" });
}

export function upsertProjectMember(token: string, projectId: string, payload: { userId: string; role?: string }) {
  return apiRequest<ProjectMember>(`/projects/${projectId}/members`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function removeProjectMember(token: string, projectId: string, userId: string) {
  return apiRequest<{ success: boolean }>(`/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function listProjectMilestones(token: string, projectId: string) {
  return apiRequest<ProjectMilestone[]>(`/projects/${projectId}/milestones`, { token, cache: "no-store" });
}

export function createProjectMilestone(
  token: string,
  projectId: string,
  payload: { title: string; description?: string; dueDate?: string },
) {
  return apiRequest<ProjectMilestone>(`/projects/${projectId}/milestones`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateProjectMilestone(
  token: string,
  projectId: string,
  milestoneId: string,
  payload: Partial<Pick<ProjectMilestone, "title" | "description">> & {
    dueDate?: string | null;
    completedAt?: string | null;
  },
) {
  return apiRequest<ProjectMilestone>(`/projects/${projectId}/milestones/${milestoneId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteProjectMilestone(token: string, projectId: string, milestoneId: string) {
  return apiRequest<{ success: boolean }>(`/projects/${projectId}/milestones/${milestoneId}`, {
    method: "DELETE",
    token,
  });
}

export function listProjectRisks(token: string, projectId: string) {
  return apiRequest<ProjectRisk[]>(`/projects/${projectId}/risks`, { token, cache: "no-store" });
}

export function createProjectRisk(
  token: string,
  projectId: string,
  payload: { title: string; description?: string; severity?: TaskPriority; mitigation?: string; isOpen?: boolean },
) {
  return apiRequest<ProjectRisk>(`/projects/${projectId}/risks`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateProjectRisk(
  token: string,
  projectId: string,
  riskId: string,
  payload: Partial<Pick<ProjectRisk, "title" | "description" | "severity" | "mitigation" | "isOpen">>,
) {
  return apiRequest<ProjectRisk>(`/projects/${projectId}/risks/${riskId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function listProjectBudgets(token: string, projectId: string) {
  return apiRequest<ProjectBudget[]>(`/projects/${projectId}/budgets`, { token, cache: "no-store" });
}

export function createProjectBudget(
  token: string,
  projectId: string,
  payload: { currency?: string; planned?: number; actual?: number; notes?: string },
) {
  return apiRequest<ProjectBudget>(`/projects/${projectId}/budgets`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateProjectBudget(
  token: string,
  projectId: string,
  budgetId: string,
  payload: Partial<Pick<ProjectBudget, "currency" | "planned" | "actual" | "notes">>,
) {
  return apiRequest<ProjectBudget>(`/projects/${projectId}/budgets/${budgetId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteProjectBudget(token: string, projectId: string, budgetId: string) {
  return apiRequest<{ success: boolean }>(`/projects/${projectId}/budgets/${budgetId}`, {
    method: "DELETE",
    token,
  });
}

export function listProjectStakeholders(token: string, projectId: string) {
  return apiRequest<ProjectStakeholder[]>(`/projects/${projectId}/stakeholders`, { token, cache: "no-store" });
}

export function createProjectStakeholder(
  token: string,
  projectId: string,
  payload: Partial<Pick<ProjectStakeholder, "email" | "organization" | "role" | "influence" | "isExternal" | "notes">> & {
    name: string;
  },
) {
  return apiRequest<ProjectStakeholder>(`/projects/${projectId}/stakeholders`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateProjectStakeholder(
  token: string,
  projectId: string,
  stakeholderId: string,
  payload: Partial<Pick<ProjectStakeholder, "name" | "email" | "organization" | "role" | "influence" | "isExternal" | "notes">>,
) {
  return apiRequest<ProjectStakeholder>(`/projects/${projectId}/stakeholders/${stakeholderId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteProjectStakeholder(token: string, projectId: string, stakeholderId: string) {
  return apiRequest<{ success: boolean }>(`/projects/${projectId}/stakeholders/${stakeholderId}`, {
    method: "DELETE",
    token,
  });
}

export function listProjectDependencies(token: string, projectId: string) {
  return apiRequest<ProjectDependency[]>(`/projects/${projectId}/dependencies`, { token, cache: "no-store" });
}

export function createProjectDependency(
  token: string,
  projectId: string,
  payload: Partial<
    Pick<ProjectDependency, "description" | "dependencyType" | "status" | "ownerName" | "ownerEmail" | "dueDate" | "resolvedAt" | "externalUrl" | "notes">
  > & { title: string },
) {
  return apiRequest<ProjectDependency>(`/projects/${projectId}/dependencies`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateProjectDependency(
  token: string,
  projectId: string,
  dependencyId: string,
  payload: Partial<
    Pick<ProjectDependency, "title" | "description" | "dependencyType" | "status" | "ownerName" | "ownerEmail" | "dueDate" | "resolvedAt" | "externalUrl" | "notes">
  >,
) {
  return apiRequest<ProjectDependency>(`/projects/${projectId}/dependencies/${dependencyId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteProjectDependency(token: string, projectId: string, dependencyId: string) {
  return apiRequest<{ success: boolean }>(`/projects/${projectId}/dependencies/${dependencyId}`, {
    method: "DELETE",
    token,
  });
}

export function listProjectDecisions(token: string, projectId: string) {
  return apiRequest<ProjectDecision[]>(`/projects/${projectId}/decisions`, { token, cache: "no-store" });
}

export function createProjectDecision(
  token: string,
  projectId: string,
  payload: Partial<Pick<ProjectDecision, "description" | "status" | "ownerName" | "ownerEmail" | "decidedAt" | "effectiveAt" | "outcome" | "notes">> & {
    title: string;
  },
) {
  return apiRequest<ProjectDecision>(`/projects/${projectId}/decisions`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateProjectDecision(
  token: string,
  projectId: string,
  decisionId: string,
  payload: Partial<Pick<ProjectDecision, "title" | "description" | "status" | "ownerName" | "ownerEmail" | "decidedAt" | "effectiveAt" | "outcome" | "notes">>,
) {
  return apiRequest<ProjectDecision>(`/projects/${projectId}/decisions/${decisionId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteProjectDecision(token: string, projectId: string, decisionId: string) {
  return apiRequest<{ success: boolean }>(`/projects/${projectId}/decisions/${decisionId}`, {
    method: "DELETE",
    token,
  });
}

export function listProjectChangeRequests(token: string, projectId: string) {
  return apiRequest<ProjectChangeRequest[]>(`/projects/${projectId}/change-requests`, { token, cache: "no-store" });
}

export function createProjectChangeRequest(
  token: string,
  projectId: string,
  payload: Partial<
    Pick<
      ProjectChangeRequest,
      | "description"
      | "reason"
      | "status"
      | "requestedByName"
      | "requestedByEmail"
      | "approvedByName"
      | "approvedByEmail"
      | "budgetImpact"
      | "scheduleImpactDays"
      | "scopeImpact"
      | "riskImpact"
      | "dueDate"
      | "submittedAt"
      | "approvedAt"
      | "implementedAt"
      | "notes"
    >
  > & { title: string },
) {
  return apiRequest<ProjectChangeRequest>(`/projects/${projectId}/change-requests`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateProjectChangeRequest(
  token: string,
  projectId: string,
  changeRequestId: string,
  payload: Partial<
    Pick<
      ProjectChangeRequest,
      | "title"
      | "description"
      | "reason"
      | "status"
      | "requestedByName"
      | "requestedByEmail"
      | "approvedByName"
      | "approvedByEmail"
      | "budgetImpact"
      | "scheduleImpactDays"
      | "scopeImpact"
      | "riskImpact"
      | "dueDate"
      | "submittedAt"
      | "approvedAt"
      | "implementedAt"
      | "notes"
    >
  >,
) {
  return apiRequest<ProjectChangeRequest>(`/projects/${projectId}/change-requests/${changeRequestId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteProjectChangeRequest(token: string, projectId: string, changeRequestId: string) {
  return apiRequest<{ success: boolean }>(`/projects/${projectId}/change-requests/${changeRequestId}`, {
    method: "DELETE",
    token,
  });
}

export function createProject(
  token: string,
  payload: CreateProjectPayload,
) {
  return openApiRequest<Project, "/api/v1/projects", "post">("/api/v1/projects", "post", {
    pathParams: {},
    token,
    body: payload,
  });
}

export function createTask(
  token: string,
  payload: CreateTaskPayload,
) {
  return openApiRequest<Task, "/api/v1/tasks", "post">("/api/v1/tasks", "post", {
    pathParams: {},
    token,
    body: payload,
  });
}

export function getTask(token: string, taskId: string) {
  return openApiRequest<Task, "/api/v1/tasks/{taskId}", "get">(
    "/api/v1/tasks/{taskId}",
    "get",
    {
      pathParams: { taskId },
      token,
      cache: "no-store",
    },
  );
}

export function updateTask(
  token: string,
  taskId: string,
  payload: UpdateTaskPayload,
) {
  return openApiRequest<Task, "/api/v1/tasks/{taskId}", "patch">(
    "/api/v1/tasks/{taskId}",
    "patch",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function deleteTask(token: string, taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}`, {
    method: "DELETE",
    token,
  });
}

export function archiveTask(token: string, taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}/archive`, {
    method: "POST",
    token,
  });
}

export function restoreTask(token: string, taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}/restore`, {
    method: "POST",
    token,
  });
}

export function listTaskComments(token: string, taskId: string) {
  return apiRequest<TaskComment[]>(`/tasks/${taskId}/comments`, { token, cache: "no-store" });
}

export function createTaskComment(token: string, taskId: string, payload: { body: string; parentId?: string }) {
  return apiRequest<TaskComment>(`/tasks/${taskId}/comments`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteTaskComment(token: string, taskId: string, commentId: string) {
  return apiRequest<{ success: boolean }>(`/tasks/${taskId}/comments/${commentId}`, {
    method: "DELETE",
    token,
  });
}

export function listTaskChecklists(token: string, taskId: string) {
  return apiRequest<TaskChecklist[]>(`/tasks/${taskId}/checklists`, { token, cache: "no-store" });
}

export function createTaskChecklist(token: string, taskId: string, payload: { title: string }) {
  return apiRequest<TaskChecklist>(`/tasks/${taskId}/checklists`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteTaskChecklist(token: string, taskId: string, checklistId: string) {
  return apiRequest<{ success: boolean }>(`/tasks/${taskId}/checklists/${checklistId}`, {
    method: "DELETE",
    token,
  });
}

export function createTaskChecklistItem(
  token: string,
  taskId: string,
  checklistId: string,
  payload: { text: string; sortOrder?: number },
) {
  return apiRequest<TaskChecklistItem>(`/tasks/${taskId}/checklists/${checklistId}/items`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateTaskChecklistItem(
  token: string,
  taskId: string,
  checklistId: string,
  itemId: string,
  payload: Partial<Pick<TaskChecklistItem, "text" | "isDone" | "sortOrder">>,
) {
  return apiRequest<TaskChecklistItem>(`/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteTaskChecklistItem(
  token: string,
  taskId: string,
  checklistId: string,
  itemId: string,
) {
  return apiRequest<{ success: boolean }>(`/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`, {
    method: "DELETE",
    token,
  });
}

export function listTaskActivities(token: string, taskId: string) {
  return apiRequest<TaskActivity[]>(`/tasks/${taskId}/activities`, { token, cache: "no-store" });
}

export function listTaskAttachments(token: string, taskId: string) {
  return apiRequest<TaskAttachment[]>(`/tasks/${taskId}/attachments`, {
    token,
    cache: "no-store",
  });
}

export function createTaskAttachment(
  token: string,
  taskId: string,
  payload: { fileName: string; fileUrl: string; mimeType?: string; sizeBytes?: number },
) {
  return apiRequest<TaskAttachment>(`/tasks/${taskId}/attachments`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteTaskAttachment(token: string, taskId: string, attachmentId: string) {
  return apiRequest<{ success: boolean }>(`/tasks/${taskId}/attachments/${attachmentId}`, {
    method: "DELETE",
    token,
  });
}

export function createUploadIntent(
  token: string,
  payload: {
    fileName: string;
    mimeType?: string;
    sizeBytes?: number;
    scope?: string;
    entityType: string;
    entityId?: string;
    visibility?: Visibility;
  },
) {
  return apiRequest<UploadIntent>("/files/upload-intents", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listFileAssets(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    scope?: string;
    entityType?: string;
    entityId?: string;
    provider?: string;
    includeDeleted?: boolean;
    includeArchived?: boolean;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 50)),
  });
  if (query.search) params.set("search", query.search);
  if (query.scope) params.set("scope", query.scope);
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.entityId) params.set("entityId", query.entityId);
  if (query.provider) params.set("provider", query.provider);
  if (query.includeDeleted !== undefined) params.set("includeDeleted", String(query.includeDeleted));
  if (query.includeArchived !== undefined) params.set("includeArchived", String(query.includeArchived));

  return apiRequest<PaginatedResponse<FileAsset>>(`/files?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createFileAsset(
  token: string,
  payload: {
    fileName: string;
    fileUrl: string;
    storageKey?: string;
    provider?: string;
    mimeType?: string;
    sizeBytes?: number;
    scope?: string;
    entityType: string;
    entityId?: string;
    visibility?: Visibility;
    expiresAt?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return apiRequest<FileAsset>("/files", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function archiveFileAsset(token: string, fileId: string) {
  return apiRequest<FileAsset>(`/files/${fileId}/archive`, {
    method: "POST",
    token,
  });
}

export function restoreFileAsset(token: string, fileId: string) {
  return apiRequest<FileAsset>(`/files/${fileId}/restore`, {
    method: "POST",
    token,
  });
}

export function deleteFileAsset(token: string, fileId: string) {
  return apiRequest<FileAsset>(`/files/${fileId}`, {
    method: "DELETE",
    token,
  });
}

export function listTaskDependencies(token: string, taskId: string) {
  return apiRequest<{ blocking: TaskDependency[]; blockedBy: TaskDependency[] }>(`/tasks/${taskId}/dependencies`, {
    token,
    cache: "no-store",
  });
}

export function createTaskDependency(
  token: string,
  taskId: string,
  payload: { toTaskId: string; type?: string },
) {
  return apiRequest<TaskDependency>(`/tasks/${taskId}/dependencies`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteTaskDependency(token: string, taskId: string, dependencyId: string) {
  return apiRequest<{ success: boolean }>(`/tasks/${taskId}/dependencies/${dependencyId}`, {
    method: "DELETE",
    token,
  });
}

export function getTaskTaxonomy(token: string) {
  return apiRequest<TaskTaxonomy>("/tasks/taxonomy", {
    token,
    cache: "no-store",
  });
}

export function listCustomFields(
  token: string,
  query: {
    page?: number;
    limit?: number;
    entityType?: string;
    workspaceId?: string;
    projectId?: string;
    includeArchived?: boolean;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.workspaceId) params.set("workspaceId", query.workspaceId);
  if (query.projectId) params.set("projectId", query.projectId);
  if (query.includeArchived !== undefined) params.set("includeArchived", String(query.includeArchived));

  return apiRequest<PaginatedResponse<CustomField>>(`/tasks/custom-fields?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createCustomField(
  token: string,
  payload: {
    entityType?: string;
    name: string;
    type: CustomFieldType;
    workspaceId?: string;
    projectId?: string;
    required?: boolean;
    config?: Record<string, unknown>;
    sortOrder?: number;
    options?: Array<{ label: string; value: string; sortOrder?: number }>;
  },
) {
  return apiRequest<CustomField>("/tasks/custom-fields", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateCustomField(token: string, customFieldId: string, payload: Partial<CustomField>) {
  return apiRequest<CustomField>(`/tasks/custom-fields/${customFieldId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function archiveCustomField(token: string, customFieldId: string) {
  return apiRequest<CustomField>(`/tasks/custom-fields/${customFieldId}/archive`, {
    method: "POST",
    token,
  });
}

export function restoreCustomField(token: string, customFieldId: string) {
  return apiRequest<CustomField>(`/tasks/custom-fields/${customFieldId}/restore`, {
    method: "POST",
    token,
  });
}

export function listTaskSavedViews(
  token: string,
  query: { page?: number; limit?: number; projectId?: string; visibility?: Visibility } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.projectId) params.set("projectId", query.projectId);
  if (query.visibility) params.set("visibility", query.visibility);

  return apiRequest<PaginatedResponse<TaskSavedView>>(`/tasks/saved-views?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createTaskSavedView(
  token: string,
  payload: {
    name: string;
    description?: string;
    projectId?: string;
    visibility?: Visibility;
    filters: Record<string, unknown>;
    columns?: Record<string, unknown>;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    isDefault?: boolean;
  },
) {
  return apiRequest<TaskSavedView>("/tasks/saved-views", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateTaskSavedView(token: string, viewId: string, payload: Partial<TaskSavedView>) {
  return apiRequest<TaskSavedView>(`/tasks/saved-views/${viewId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteTaskSavedView(token: string, viewId: string) {
  return apiRequest<{ success: boolean }>(`/tasks/saved-views/${viewId}`, {
    method: "DELETE",
    token,
  });
}

export function bulkTaskOperation(
  token: string,
  payload: {
    operation: "UPDATE" | "ARCHIVE" | "RESTORE" | "DELETE";
    taskIds: string[];
    status?: TaskStatus;
    priority?: TaskPriority;
    type?: TaskType;
    sprintId?: string | null;
    boardColumnId?: string | null;
    dueDate?: string | null;
    storyPoints?: number | null;
    assigneeIds?: string[];
    labelIds?: string[];
  },
) {
  return apiRequest<{ success: boolean; operation: string; count: number }>("/tasks/bulk", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listLabels(token: string) {
  return apiRequest<TaskLabel[]>("/tasks/labels", { token, cache: "no-store" });
}

export function createLabel(token: string, payload: { name: string; color?: string }) {
  return apiRequest<TaskLabel>("/tasks/labels", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listTaskLabels(token: string, taskId: string) {
  return apiRequest<TaskLabelAssignment[]>(`/tasks/${taskId}/labels`, {
    token,
    cache: "no-store",
  });
}

export function assignTaskLabel(token: string, taskId: string, labelId: string) {
  return apiRequest<TaskLabelAssignment>(`/tasks/${taskId}/labels`, {
    method: "POST",
    token,
    body: JSON.stringify({ labelId }),
  });
}

export function removeTaskLabel(token: string, taskId: string, labelId: string) {
  return apiRequest<{ success: boolean }>(`/tasks/${taskId}/labels/${labelId}`, {
    method: "DELETE",
    token,
  });
}

export function listTaskAssignees(token: string, taskId: string) {
  return apiRequest<TaskAssignee[]>(`/tasks/${taskId}/assignees`, {
    token,
    cache: "no-store",
  });
}

export function addTaskAssignee(token: string, taskId: string, userId: string) {
  return apiRequest<TaskAssignee>(`/tasks/${taskId}/assignees`, {
    method: "POST",
    token,
    body: JSON.stringify({ userId }),
  });
}

export function removeTaskAssignee(token: string, taskId: string, userId: string) {
  return apiRequest<{ success: boolean }>(`/tasks/${taskId}/assignees/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function listTaskWatchers(token: string, taskId: string) {
  return apiRequest<TaskWatcher[]>(`/tasks/${taskId}/watchers`, {
    token,
    cache: "no-store",
  });
}

export function addTaskWatcher(token: string, taskId: string, userId: string) {
  return apiRequest<TaskWatcher>(`/tasks/${taskId}/watchers`, {
    method: "POST",
    token,
    body: JSON.stringify({ userId }),
  });
}

export function removeTaskWatcher(token: string, taskId: string, userId: string) {
  return apiRequest<{ success: boolean }>(`/tasks/${taskId}/watchers/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function listTasks(
  token: string,
  query: ListTasksQuery = {},
) {
  const { statuses, priorities, types, ...rest } = query;
  const apiQuery: ListTasksOpenApiQuery = {
    ...rest,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, 100),
    statuses: statuses?.join(","),
    priorities: priorities?.join(","),
    types: types?.join(","),
  };

  return openApiRequest<PaginatedResponse<Task>, "/api/v1/tasks", "get">("/api/v1/tasks", "get", {
    pathParams: {},
    query: apiQuery,
    token,
    cache: "no-store",
  });
}

export function getProjectBoard(token: string, projectId: string) {
  return openApiRequest<ProjectBoard, "/api/v1/agile/projects/{projectId}/board", "get">(
    "/api/v1/agile/projects/{projectId}/board",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function createBoardColumn(token: string, boardId: string, payload: CreateBoardColumnPayload) {
  return openApiRequest<BoardColumn, "/api/v1/agile/boards/{boardId}/columns", "post">(
    "/api/v1/agile/boards/{boardId}/columns",
    "post",
    {
      pathParams: { boardId },
      token,
      body: payload,
    },
  );
}

export function updateBoardColumn(
  token: string,
  boardId: string,
  columnId: string,
  payload: UpdateBoardColumnPayload,
) {
  return openApiRequest<BoardColumn, "/api/v1/agile/boards/{boardId}/columns/{columnId}", "patch">(
    "/api/v1/agile/boards/{boardId}/columns/{columnId}",
    "patch",
    {
      pathParams: { boardId, columnId },
      token,
      body: payload,
    },
  );
}

export function deleteBoardColumn(token: string, boardId: string, columnId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/agile/boards/{boardId}/columns/{columnId}", "delete">(
    "/api/v1/agile/boards/{boardId}/columns/{columnId}",
    "delete",
    {
      pathParams: { boardId, columnId },
      token,
    },
  );
}

export function reorderBoardColumns(
  token: string,
  boardId: string,
  columns: ReorderBoardColumnsPayload["columns"],
) {
  return openApiRequest<ProjectBoard, "/api/v1/agile/boards/{boardId}/columns/reorder", "patch">(
    "/api/v1/agile/boards/{boardId}/columns/reorder",
    "patch",
    {
      pathParams: { boardId },
      token,
      body: { columns },
    },
  );
}

export function updateTaskBoardOrder(token: string, taskId: string, payload: UpdateTaskOrderPayload) {
  return openApiRequest<Task, "/api/v1/agile/tasks/{taskId}/order", "patch">(
    "/api/v1/agile/tasks/{taskId}/order",
    "patch",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function updateTaskStatus(token: string, taskId: string, payload: UpdateTaskStatusPayload) {
  return openApiRequest<Task, "/api/v1/agile/tasks/{taskId}/status", "patch">(
    "/api/v1/agile/tasks/{taskId}/status",
    "patch",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function listSprints(
  token: string,
  query: { projectId?: string; state?: "planned" | "active" | "completed"; page?: number; limit?: number } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 100),
  });

  if (query.projectId) params.set("projectId", query.projectId);
  if (query.state) params.set("state", query.state);

  return apiRequest<PaginatedResponse<Sprint>>(`/agile/sprints?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createSprint(
  token: string,
  payload: { projectId: string; name: string; goal?: string; startDate?: string; endDate?: string },
) {
  return apiRequest<Sprint>("/agile/sprints", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateSprint(
  token: string,
  sprintId: string,
  payload: Partial<Pick<Sprint, "name" | "goal">> & {
    startDate?: string;
    endDate?: string;
    completedAt?: string;
  },
) {
  return apiRequest<Sprint>(`/agile/sprints/${sprintId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function startSprint(token: string, sprintId: string) {
  return apiRequest<Sprint>(`/agile/sprints/${sprintId}/start`, {
    method: "POST",
    token,
  });
}

export function completeSprint(
  token: string,
  sprintId: string,
  payload: { moveIncompleteToSprintId?: string; moveIncompleteToBacklog?: boolean } = {
    moveIncompleteToBacklog: true,
  },
) {
  return apiRequest<Sprint>(`/agile/sprints/${sprintId}/complete`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteSprint(token: string, sprintId: string) {
  return apiRequest<{ success: boolean }>(`/agile/sprints/${sprintId}`, {
    method: "DELETE",
    token,
  });
}

export function addSprintTasks(token: string, sprintId: string, taskIds: string[]) {
  return apiRequest<{ success: boolean; count: number }>(`/agile/sprints/${sprintId}/tasks`, {
    method: "POST",
    token,
    body: JSON.stringify({ taskIds }),
  });
}

export function removeSprintTask(token: string, sprintId: string, taskId: string) {
  return apiRequest<{ success: boolean }>(`/agile/sprints/${sprintId}/tasks/${taskId}`, {
    method: "DELETE",
    token,
  });
}

export function listNotifications(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    unreadOnly?: boolean;
    channel?: NotificationChannel;
    userId?: string;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 50),
  });
  if (query.search) params.set("search", query.search);
  if (query.unreadOnly !== undefined) params.set("unreadOnly", String(query.unreadOnly));
  if (query.channel) params.set("channel", query.channel);
  if (query.userId) params.set("userId", query.userId);

  return apiRequest<PaginatedResponse<Notification>>(`/notifications?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getUnreadNotificationCount(token: string) {
  return apiRequest<{ total: number }>("/notifications/unread-count", {
    token,
    cache: "no-store",
  });
}

export function markNotificationRead(token: string, notificationId: string) {
  return apiRequest<Notification>(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    token,
  });
}

export function markNotificationUnread(token: string, notificationId: string) {
  return apiRequest<Notification>(`/notifications/${notificationId}/unread`, {
    method: "PATCH",
    token,
  });
}

export function markAllNotificationsRead(token: string) {
  return apiRequest<{ success: boolean; updated: number }>("/notifications/read-all", {
    method: "PATCH",
    token,
  });
}

export function deleteNotification(token: string, notificationId: string) {
  return apiRequest<{ success: boolean }>(`/notifications/${notificationId}`, {
    method: "DELETE",
    token,
  });
}

export function deleteReadNotifications(token: string) {
  return apiRequest<{ success: boolean; deleted: number }>("/notifications/read", {
    method: "DELETE",
    token,
  });
}

export function getInternalMailFolders(token: string) {
  return apiRequest<InternalMailFolderSummary>("/internal-mail/folders", {
    token,
    cache: "no-store",
  });
}

export function searchInternalMailboxes(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: InternalMailboxStatus;
    type?: InternalMailboxType;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.type) params.set("type", query.type);

  return apiRequest<PaginatedResponse<InternalMailbox>>(`/internal-mail/mailboxes?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createInternalMailbox(
  token: string,
  payload: {
    displayName: string;
    localPart?: string;
    address?: string;
    type?: InternalMailboxType;
    userId?: string;
    teamId?: string;
    memberIds?: string[];
    description?: string;
  },
) {
  return apiRequest<InternalMailbox>("/internal-mail/mailboxes", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateInternalMailbox(
  token: string,
  mailboxId: string,
  payload: {
    displayName?: string;
    localPart?: string;
    address?: string;
    status?: InternalMailboxStatus;
    userId?: string;
    teamId?: string;
    description?: string;
  },
) {
  return apiRequest<InternalMailbox>(`/internal-mail/mailboxes/${mailboxId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function createInternalMailboxAlias(
  token: string,
  mailboxId: string,
  payload: { localPart?: string; address?: string; isPrimary?: boolean },
) {
  return apiRequest<InternalMailboxAlias>(`/internal-mail/mailboxes/${mailboxId}/aliases`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function upsertInternalMailboxMember(
  token: string,
  mailboxId: string,
  payload: { userId: string; role?: InternalMailboxMemberRole },
) {
  return apiRequest<InternalMailboxMember>(`/internal-mail/mailboxes/${mailboxId}/members`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function removeInternalMailboxMember(token: string, mailboxId: string, userId: string) {
  return apiRequest<{ success: boolean }>(`/internal-mail/mailboxes/${mailboxId}/members/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function listInternalMailThreads(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    folder?: InternalMailFolder;
    unreadOnly?: boolean;
    starredOnly?: boolean;
    flaggedOnly?: boolean;
    pinnedOnly?: boolean;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.folder) params.set("folder", query.folder);
  if (query.unreadOnly !== undefined) params.set("unreadOnly", String(query.unreadOnly));
  if (query.starredOnly !== undefined) params.set("starredOnly", String(query.starredOnly));
  if (query.flaggedOnly !== undefined) params.set("flaggedOnly", String(query.flaggedOnly));
  if (query.pinnedOnly !== undefined) params.set("pinnedOnly", String(query.pinnedOnly));

  return apiRequest<PaginatedResponse<InternalMailThread>>(`/internal-mail/threads?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getInternalMailThread(token: string, threadId: string, query: { markRead?: boolean } = {}) {
  const params = new URLSearchParams();
  if (query.markRead !== undefined) params.set("markRead", String(query.markRead));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<InternalMailThread>(`/internal-mail/threads/${threadId}${suffix}`, {
    token,
    cache: "no-store",
  });
}

export function createInternalMailThread(
  token: string,
  payload: {
    subject: string;
    bodyText: string;
    bodyHtml?: string;
    toIds?: string[];
    toAddresses?: string[];
    ccIds?: string[];
    ccAddresses?: string[];
    bccIds?: string[];
    bccAddresses?: string[];
    priority?: InternalMailPriority;
    attachments?: Record<string, unknown>;
    saveAsDraft?: boolean;
  },
) {
  return apiRequest<InternalMailThread>("/internal-mail/threads", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function replyInternalMailThread(
  token: string,
  threadId: string,
  payload: {
    bodyText: string;
    bodyHtml?: string;
    toIds?: string[];
    toAddresses?: string[];
    ccIds?: string[];
    ccAddresses?: string[];
    bccIds?: string[];
    bccAddresses?: string[];
    priority?: InternalMailPriority;
    attachments?: Record<string, unknown>;
  },
) {
  return apiRequest<InternalMailThread>(`/internal-mail/threads/${threadId}/reply`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function markInternalMailRead(token: string, threadId: string) {
  return apiRequest<InternalMailParticipant>(`/internal-mail/threads/${threadId}/read`, {
    method: "PATCH",
    token,
  });
}

export function markInternalMailUnread(token: string, threadId: string) {
  return apiRequest<InternalMailParticipant>(`/internal-mail/threads/${threadId}/unread`, {
    method: "PATCH",
    token,
  });
}

export function setInternalMailStar(token: string, threadId: string, value: boolean) {
  return apiRequest<InternalMailParticipant>(`/internal-mail/threads/${threadId}/star`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ value }),
  });
}

export function setInternalMailFlag(token: string, threadId: string, value: boolean) {
  return apiRequest<InternalMailParticipant>(`/internal-mail/threads/${threadId}/flag`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ value }),
  });
}

export function setInternalMailPin(token: string, threadId: string, value: boolean) {
  return apiRequest<InternalMailParticipant>(`/internal-mail/threads/${threadId}/pin`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ value }),
  });
}

export function snoozeInternalMailThread(token: string, threadId: string, snoozedUntil?: string) {
  return apiRequest<InternalMailParticipant>(`/internal-mail/threads/${threadId}/snooze`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ snoozedUntil }),
  });
}

export function moveInternalMailThread(token: string, threadId: string, folder: InternalMailFolder) {
  return apiRequest<InternalMailParticipant>(`/internal-mail/threads/${threadId}/move`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ folder }),
  });
}

export function archiveInternalMailThread(token: string, threadId: string) {
  return apiRequest<InternalMailParticipant>(`/internal-mail/threads/${threadId}/archive`, {
    method: "PATCH",
    token,
  });
}

export function restoreInternalMailThread(token: string, threadId: string) {
  return apiRequest<InternalMailParticipant>(`/internal-mail/threads/${threadId}/restore`, {
    method: "PATCH",
    token,
  });
}

export function deleteInternalMailThread(token: string, threadId: string) {
  return apiRequest<InternalMailParticipant>(`/internal-mail/threads/${threadId}`, {
    method: "DELETE",
    token,
  });
}

export function listNotificationPreferences(token: string) {
  return apiRequest<NotificationPreference[]>("/notification-preferences", {
    token,
    cache: "no-store",
  });
}

export function updateNotificationPreferences(
  token: string,
  preferences: Array<{ channel: NotificationChannel; enabled: boolean }>,
) {
  return apiRequest<NotificationPreference[]>("/notification-preferences", {
    method: "PATCH",
    token,
    body: JSON.stringify({ preferences }),
  });
}

export function listIntegrations(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    provider?: IntegrationProvider;
    status?: IntegrationStatus;
    enabled?: boolean;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.provider) params.set("provider", query.provider);
  if (query.status) params.set("status", query.status);
  if (query.enabled !== undefined) params.set("enabled", String(query.enabled));

  return apiRequest<PaginatedResponse<Integration>>(`/integrations?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createIntegration(
  token: string,
  payload: {
    provider: IntegrationProvider;
    name: string;
    config?: unknown;
    secrets?: Record<string, string>;
    externalAccountId?: string;
    scopes?: string[];
    enabled?: boolean;
  },
) {
  return apiRequest<Integration>("/integrations", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateIntegration(
  token: string,
  integrationId: string,
  payload: Partial<Pick<Integration, "name" | "provider" | "externalAccountId" | "scopes" | "enabled" | "status">> & {
    config?: unknown;
    secrets?: Record<string, string>;
  },
) {
  return apiRequest<Integration>(`/integrations/${integrationId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteIntegration(token: string, integrationId: string) {
  return apiRequest<{ success: boolean }>(`/integrations/${integrationId}`, {
    method: "DELETE",
    token,
  });
}

export function enableIntegration(token: string, integrationId: string) {
  return apiRequest<Integration>(`/integrations/${integrationId}/enable`, {
    method: "POST",
    token,
  });
}

export function disableIntegration(token: string, integrationId: string) {
  return apiRequest<Integration>(`/integrations/${integrationId}/disable`, {
    method: "POST",
    token,
  });
}

export function rotateIntegrationSecret(
  token: string,
  integrationId: string,
  payload: { key: string; value: string },
) {
  return apiRequest<Integration>(`/integrations/${integrationId}/rotate-secret`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function syncIntegration(
  token: string,
  integrationId: string,
  payload: { mode?: string; cursor?: string; payload?: unknown } = {},
) {
  return apiRequest<{ integration: Integration; queued: boolean; message?: string }>(
    `/integrations/${integrationId}/sync`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}

export function processOmoFlowEvent(token: string, payload: OmoFlowRuntimeEvent) {
  return apiRequest<OmoFlowRuntimeResult>("/integrations/omoflow/events", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listIntegrationLogs(
  token: string,
  integrationId: string,
  query: { page?: number; limit?: number; search?: string; level?: string; eventType?: string; from?: string; to?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 30)),
  });
  if (query.search) params.set("search", query.search);
  if (query.level) params.set("level", query.level);
  if (query.eventType) params.set("eventType", query.eventType);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  return apiRequest<PaginatedResponse<IntegrationLog>>(
    `/integrations/${integrationId}/logs?${params.toString()}`,
    { token, cache: "no-store" },
  );
}

export function listWebhooks(
  token: string,
  query: { page?: number; limit?: number; search?: string; enabled?: boolean; eventType?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.enabled !== undefined) params.set("enabled", String(query.enabled));
  if (query.eventType) params.set("eventType", query.eventType);

  return apiRequest<PaginatedResponse<Webhook>>(`/webhooks?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createWebhook(
  token: string,
  payload: {
    name: string;
    description?: string;
    url: string;
    events: string[];
    secret?: string;
    signingAlgorithm?: string;
    enabled?: boolean;
  },
) {
  return apiRequest<Webhook>("/webhooks", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateWebhook(
  token: string,
  webhookId: string,
  payload: Partial<Pick<Webhook, "name" | "description" | "url" | "events" | "signingAlgorithm" | "enabled">>,
) {
  return apiRequest<Webhook>(`/webhooks/${webhookId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteWebhook(token: string, webhookId: string) {
  return apiRequest<{ success: boolean }>(`/webhooks/${webhookId}`, {
    method: "DELETE",
    token,
  });
}

export function enableWebhook(token: string, webhookId: string) {
  return apiRequest<Webhook>(`/webhooks/${webhookId}/enable`, {
    method: "POST",
    token,
  });
}

export function disableWebhook(token: string, webhookId: string) {
  return apiRequest<Webhook>(`/webhooks/${webhookId}/disable`, {
    method: "POST",
    token,
  });
}

export function rotateWebhookSecret(token: string, webhookId: string, payload: { secret?: string } = {}) {
  return apiRequest<Webhook>(`/webhooks/${webhookId}/rotate-secret`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function triggerWebhookEvent(
  token: string,
  payload: { eventType: string; payload?: unknown; entityType?: string; entityId?: string },
) {
  return apiRequest<{ event: unknown; matched: number; deliveries: Array<{ delivery: WebhookDelivery; dispatched: boolean }> }>(
    "/webhook-events",
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}

export function listWebhookDeliveries(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    webhookId?: string;
    eventType?: string;
    status?: WebhookDeliveryStatus;
    from?: string;
    to?: string;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 30)),
  });
  if (query.search) params.set("search", query.search);
  if (query.webhookId) params.set("webhookId", query.webhookId);
  if (query.eventType) params.set("eventType", query.eventType);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  return apiRequest<PaginatedResponse<WebhookDelivery>>(`/webhook-deliveries?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function retryWebhookDelivery(token: string, deliveryId: string) {
  return apiRequest<WebhookDelivery>(`/webhook-deliveries/${deliveryId}/retry`, {
    method: "POST",
    token,
  });
}

export function listWorkflows(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    entityType?: string;
    triggerType?: string;
    eventType?: string;
    isActive?: boolean;
    includeArchived?: boolean;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.triggerType) params.set("triggerType", query.triggerType);
  if (query.eventType) params.set("eventType", query.eventType);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));
  if (query.includeArchived !== undefined) params.set("includeArchived", String(query.includeArchived));

  return apiRequest<PaginatedResponse<Workflow>>(`/workflows?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createWorkflow(
  token: string,
  payload: {
    name: string;
    description?: string;
    entityType: string;
    triggerType?: string;
    eventType?: string;
    isActive?: boolean;
    config?: unknown;
    nodes?: WorkflowNode[];
  },
) {
  return apiRequest<Workflow>("/workflows", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateWorkflow(
  token: string,
  workflowId: string,
  payload: Partial<Pick<Workflow, "name" | "description" | "entityType" | "triggerType" | "eventType" | "isActive">> & {
    config?: unknown;
  },
) {
  return apiRequest<Workflow>(`/workflows/${workflowId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function archiveWorkflow(token: string, workflowId: string) {
  return apiRequest<Workflow>(`/workflows/${workflowId}/archive`, {
    method: "POST",
    token,
  });
}

export function restoreWorkflow(token: string, workflowId: string) {
  return apiRequest<Workflow>(`/workflows/${workflowId}/restore`, {
    method: "POST",
    token,
  });
}

export function deleteWorkflow(token: string, workflowId: string) {
  return apiRequest<{ success: boolean }>(`/workflows/${workflowId}`, {
    method: "DELETE",
    token,
  });
}

export function replaceWorkflowNodes(token: string, workflowId: string, nodes: WorkflowNode[]) {
  return apiRequest<Workflow>(`/workflows/${workflowId}/nodes`, {
    method: "PUT",
    token,
    body: JSON.stringify({ nodes }),
  });
}

export function runWorkflow(
  token: string,
  workflowId: string,
  payload: { entityType?: string; entityId?: string; eventType?: string; idempotencyKey?: string; context?: unknown } = {},
) {
  return apiRequest<WorkflowRun>(`/workflows/${workflowId}/run`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listWorkflowRuns(
  token: string,
  query: {
    page?: number;
    limit?: number;
    workflowId?: string;
    entityType?: string;
    entityId?: string;
    status?: WorkflowRunStatus;
    from?: string;
    to?: string;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 50)),
  });
  if (query.workflowId) params.set("workflowId", query.workflowId);
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.entityId) params.set("entityId", query.entityId);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  return apiRequest<PaginatedResponse<WorkflowRun>>(`/workflow-runs?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listDeadLetterWorkflowRuns(
  token: string,
  query: Parameters<typeof listWorkflowRuns>[1] = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 50)),
  });
  if (query.workflowId) params.set("workflowId", query.workflowId);
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.entityId) params.set("entityId", query.entityId);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  return apiRequest<PaginatedResponse<WorkflowRun>>(`/workflow-runs/dead-letter?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listWorkflowRunLogs(token: string, runId: string) {
  return apiRequest<WorkflowRunLog[]>(`/workflow-runs/${runId}/logs`, {
    token,
    cache: "no-store",
  });
}

export function retryWorkflowRun(token: string, runId: string) {
  return apiRequest<WorkflowRun>(`/workflow-runs/${runId}/retry`, {
    method: "POST",
    token,
  });
}

export function requeueWorkflowRun(token: string, runId: string) {
  return apiRequest<WorkflowRun>(`/workflow-runs/${runId}/requeue`, {
    method: "POST",
    token,
  });
}

export function cancelWorkflowRun(token: string, runId: string) {
  return apiRequest<WorkflowRun>(`/workflow-runs/${runId}/cancel`, {
    method: "POST",
    token,
  });
}

export function getAiSettings(token: string) {
  return apiRequest<AiSettings>("/ai/settings", {
    token,
    cache: "no-store",
  });
}

export function updateAiSettings(token: string, payload: Partial<Pick<
  AiSettings,
  | "enabled"
  | "defaultProvider"
  | "defaultModel"
  | "allowedProviders"
  | "monthlyTokenLimit"
  | "monthlyCostLimit"
  | "redactSensitiveData"
  | "dataRetentionDays"
>> & { policy?: unknown }) {
  return apiRequest<AiSettings>("/ai/settings", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function listAiAgents(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    provider?: string;
    type?: string;
    enabled?: boolean;
    includeArchived?: boolean;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.provider) params.set("provider", query.provider);
  if (query.type) params.set("type", query.type);
  if (query.enabled !== undefined) params.set("enabled", String(query.enabled));
  if (query.includeArchived !== undefined) params.set("includeArchived", String(query.includeArchived));

  return apiRequest<PaginatedResponse<AiAgent>>(`/ai/agents?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createAiAgent(
  token: string,
  payload: {
    name: string;
    description?: string;
    type?: string;
    provider?: string;
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxOutputTokens?: number;
    tools?: string[];
    guardrails?: unknown;
    knowledgeScope?: unknown;
    enabled?: boolean;
  },
) {
  return apiRequest<AiAgent>("/ai/agents", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateAiAgent(
  token: string,
  agentId: string,
  payload: Partial<Pick<
    AiAgent,
    | "name"
    | "description"
    | "type"
    | "provider"
    | "model"
    | "systemPrompt"
    | "temperature"
    | "maxOutputTokens"
    | "tools"
    | "guardrails"
    | "knowledgeScope"
    | "enabled"
  >>,
) {
  return apiRequest<AiAgent>(`/ai/agents/${agentId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function archiveAiAgent(token: string, agentId: string) {
  return apiRequest<AiAgent>(`/ai/agents/${agentId}/archive`, {
    method: "POST",
    token,
  });
}

export function restoreAiAgent(token: string, agentId: string) {
  return apiRequest<AiAgent>(`/ai/agents/${agentId}/restore`, {
    method: "POST",
    token,
  });
}

export function deleteAiAgent(token: string, agentId: string) {
  return apiRequest<{ success: boolean } | AiAgent>(`/ai/agents/${agentId}`, {
    method: "DELETE",
    token,
  });
}

export function listAuditLogs(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    actorId?: string;
    entityType?: string;
    entityId?: string;
    ipAddress?: string;
    from?: string;
    to?: string;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 50),
  });
  if (query.search) params.set("search", query.search);
  if (query.action) params.set("action", query.action);
  if (query.actorId) params.set("actorId", query.actorId);
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.entityId) params.set("entityId", query.entityId);
  if (query.ipAddress) params.set("ipAddress", query.ipAddress);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  return apiRequest<MetaPaginatedResponse<AuditLog>>(`/admin/audit-logs?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getAdminOverview(token: string) {
  return apiRequest<AdminOverview>("/admin/overview", {
    token,
    cache: "no-store",
  });
}

export function getSiteAdminProfile(token: string) {
  return apiRequest<SiteAdminProfile>("/site-admin/me", {
    token,
    cache: "no-store",
  });
}

export function getSiteAdminOverview(token: string) {
  return apiRequest<SiteAdminOverview>("/site-admin/overview", {
    token,
    cache: "no-store",
  });
}

export function getSiteIdentitySecurityOverview(token: string) {
  return apiRequest<SiteIdentitySecurityOverview>("/site-admin/identity-security/overview", {
    token,
    cache: "no-store",
  });
}

export function listSiteLoginHistory(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; userId?: string; ipAddress?: string; method?: string; status?: string; suspicious?: boolean } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.userId) params.set("userId", query.userId);
  if (query.ipAddress) params.set("ipAddress", query.ipAddress);
  if (query.method) params.set("method", query.method);
  if (query.status) params.set("status", query.status);
  if (query.suspicious !== undefined) params.set("suspicious", String(query.suspicious));
  return apiRequest<MetaPaginatedResponse<SiteLoginHistory>>(`/site-admin/identity-security/login-history?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteTrustedDevices(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; userId?: string; ipAddress?: string; status?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.userId) params.set("userId", query.userId);
  if (query.ipAddress) params.set("ipAddress", query.ipAddress);
  if (query.status) params.set("status", query.status);
  return apiRequest<MetaPaginatedResponse<SiteTrustedDevice>>(`/site-admin/identity-security/trusted-devices?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function revokeSiteTrustedDevice(token: string, deviceId: string, payload: { reason?: string } = {}) {
  return apiRequest<SiteTrustedDevice>(`/site-admin/identity-security/trusted-devices/${deviceId}/revoke`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function listSiteSsoProviders(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.status) params.set("status", query.status);
  return apiRequest<MetaPaginatedResponse<SiteSsoProvider>>(`/site-admin/identity-security/sso-providers?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteSecurityPolicies(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  return apiRequest<MetaPaginatedResponse<SiteSecurityPolicy>>(`/site-admin/identity-security/policies?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function sendSiteAdminPasswordReset(token: string, userId: string) {
  return apiRequest<{
    success: boolean;
    sent: boolean;
    provider?: string;
    skipped?: boolean;
    message: string;
    devLink?: string;
  }>(`/site-admin/identity-security/users/${userId}/password-reset`, {
    method: "POST",
    token,
  });
}

export function listSiteSessions(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; userId?: string; ipAddress?: string; device?: string; authMethod?: string; active?: boolean } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.userId) params.set("userId", query.userId);
  if (query.ipAddress) params.set("ipAddress", query.ipAddress);
  if (query.device) params.set("device", query.device);
  if (query.authMethod) params.set("authMethod", query.authMethod);
  if (query.active !== undefined) params.set("active", String(query.active));
  return apiRequest<SiteSessionsResponse>(`/site-admin/sessions?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function revokeSiteSession(token: string, sessionId: string, payload: { reason?: string } = {}) {
  return apiRequest<SiteSession>(`/site-admin/sessions/${sessionId}/revoke`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function getBillingAccountStatus(token: string) {
  return apiRequest<BillingAccountStatus>("/billing/account", {
    token,
    cache: "no-store",
  });
}

export function listBillingPlans(
  token: string,
  query: { page?: number; limit?: number; search?: string; interval?: string; currency?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.interval) params.set("interval", query.interval);
  if (query.currency) params.set("currency", query.currency);
  return apiRequest<PaginatedResponse<BillingPlan>>(`/plans?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getCurrentTenantSubscription(token: string) {
  return apiRequest<SiteSubscription | null>("/subscriptions/current", {
    token,
    cache: "no-store",
  });
}

export function startTenantBillingTrial(token: string, payload: { planId: string; seatCount?: number }) {
  return apiRequest<SiteSubscription>("/billing/trial", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function createBillingCheckout(
  token: string,
  payload: {
    planId: string;
    seatCount?: number;
    successUrl?: string;
    cancelUrl?: string;
    provider?: "stripe" | "paystack" | "local";
  },
) {
  return apiRequest<BillingCheckoutSession>("/billing/checkout", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function createBillingPortal(token: string, payload: { returnUrl?: string } = {}) {
  return apiRequest<BillingPortalSession>("/billing/portal", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function changeTenantSubscriptionPlan(
  token: string,
  subscriptionId: string,
  payload: { planId: string; prorate?: boolean },
) {
  return apiRequest<SiteSubscription>(`/subscriptions/${subscriptionId}/change-plan`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function cancelTenantSubscription(token: string, subscriptionId: string) {
  return apiRequest<SiteSubscription>(`/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    token,
  });
}

export function resumeTenantSubscription(token: string, subscriptionId: string) {
  return apiRequest<SiteSubscription>(`/subscriptions/${subscriptionId}/resume`, {
    method: "POST",
    token,
  });
}

export function listTenantInvoices(
  token: string,
  query: { page?: number; limit?: number; search?: string; status?: string; subscriptionId?: string } = {},
) {
  const params = siteParams(query, 20);
  if (query.status) params.set("status", query.status);
  if (query.subscriptionId) params.set("subscriptionId", query.subscriptionId);
  return apiRequest<PaginatedResponse<BillingInvoice>>(`/invoices?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getTenantEntitlements(token: string) {
  return apiRequest<BillingEntitlements>("/entitlements", {
    token,
    cache: "no-store",
  });
}

export function listTenantUsageRecords(
  token: string,
  query: { page?: number; limit?: number; search?: string; featureKey?: string; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.featureKey) params.set("featureKey", query.featureKey);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<PaginatedResponse<BillingUsageRecord>>(`/usage-records?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getTenantUsageSummary(
  token: string,
  query: { featureKey?: string; from?: string; to?: string } = {},
) {
  const params = new URLSearchParams();
  if (query.featureKey) params.set("featureKey", query.featureKey);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  const suffix = params.toString();
  return apiRequest<BillingUsageSummary>(`/usage-records/summary${suffix ? `?${suffix}` : ""}`, {
    token,
    cache: "no-store",
  });
}

export function getSiteBillingOverview(token: string) {
  return apiRequest<SiteBillingOverview>("/site-admin/billing/overview", {
    token,
    cache: "no-store",
  });
}

export function listSiteBillingPlans(token: string, query: { page?: number; limit?: number; search?: string } = {}) {
  return apiRequest<MetaPaginatedResponse<SiteBillingPlan>>(`/site-admin/billing/plans?${siteParams(query, 30).toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createSiteBillingPlan(token: string, payload: SiteBillingPlanPayload) {
  return apiRequest<SiteBillingPlan>("/site-admin/billing/plans", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateSiteBillingPlan(token: string, planId: string, payload: Partial<SiteBillingPlanPayload>) {
  return apiRequest<SiteBillingPlan>(`/site-admin/billing/plans/${planId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function archiveSiteBillingPlan(token: string, planId: string) {
  return apiRequest<SiteBillingPlan>(`/site-admin/billing/plans/${planId}/archive`, {
    method: "POST",
    token,
  });
}

export function restoreSiteBillingPlan(token: string, planId: string) {
  return apiRequest<SiteBillingPlan>(`/site-admin/billing/plans/${planId}/restore`, {
    method: "POST",
    token,
  });
}

export function syncSiteBillingPlanToStripe(token: string, planId: string) {
  return apiRequest<SiteBillingPlan>(`/site-admin/billing/plans/${planId}/sync/stripe`, {
    method: "POST",
    token,
  });
}

export function assignSiteBillingPlanFeature(token: string, planId: string, payload: SitePlanFeaturePayload) {
  return apiRequest<SiteBillingPlan>(`/site-admin/billing/plans/${planId}/features`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateSiteBillingPlanFeature(
  token: string,
  planId: string,
  featureId: string,
  payload: Omit<Partial<SitePlanFeaturePayload>, "featureId">,
) {
  return apiRequest<SiteBillingPlan>(`/site-admin/billing/plans/${planId}/features/${featureId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function removeSiteBillingPlanFeature(token: string, planId: string, featureId: string) {
  return apiRequest<SiteBillingPlan>(`/site-admin/billing/plans/${planId}/features/${featureId}`, {
    method: "DELETE",
    token,
  });
}

export function listSiteBillingFeatures(token: string, query: { page?: number; limit?: number; search?: string } = {}) {
  return apiRequest<MetaPaginatedResponse<SiteBillingFeature>>(`/site-admin/billing/features?${siteParams(query, 50).toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createSiteBillingFeature(token: string, payload: SiteBillingFeaturePayload) {
  return apiRequest<SiteBillingFeature>("/site-admin/billing/features", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateSiteBillingFeature(token: string, featureId: string, payload: Partial<SiteBillingFeaturePayload>) {
  return apiRequest<SiteBillingFeature>(`/site-admin/billing/features/${featureId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function setSiteBillingFeatureActive(token: string, featureId: string, isActive: boolean) {
  return apiRequest<SiteBillingFeature>(`/site-admin/billing/features/${featureId}/${isActive ? "enable" : "disable"}`, {
    method: "POST",
    token,
  });
}

export function listSiteBillingSubscriptions(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.status) params.set("status", query.status);
  return apiRequest<MetaPaginatedResponse<SiteSubscription>>(`/site-admin/billing/subscriptions?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function updateSiteSubscription(
  token: string,
  subscriptionId: string,
  payload: { status?: string; planId?: string; seatCount?: number; cancelAtPeriodEnd?: boolean; trialEndsAt?: string; reason?: string },
) {
  return apiRequest<SiteSubscription>(`/site-admin/billing/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function changeSiteSubscriptionPlan(token: string, subscriptionId: string, payload: { planId: string; reason?: string }) {
  return apiRequest<SiteSubscription>(`/site-admin/billing/subscriptions/${subscriptionId}/change-plan`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function cancelSiteSubscription(token: string, subscriptionId: string, payload: { reason?: string } = {}) {
  return apiRequest<SiteSubscription>(`/site-admin/billing/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function resumeSiteSubscription(token: string, subscriptionId: string, payload: { reason?: string } = {}) {
  return apiRequest<SiteSubscription>(`/site-admin/billing/subscriptions/${subscriptionId}/resume`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function startSiteTenantTrial(token: string, tenantId: string, payload: { planId: string; reason?: string }) {
  return apiRequest<SiteSubscription>(`/site-admin/billing/tenants/${tenantId}/start-trial`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listSiteBillingInvoices(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  return apiRequest<MetaPaginatedResponse<SiteInvoice>>(`/site-admin/billing/invoices?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteBillingUsageRecords(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  return apiRequest<MetaPaginatedResponse<SiteUsageRecord>>(`/site-admin/billing/usage-records?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteBillingEvents(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; provider?: string; type?: string; status?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.provider) params.set("provider", query.provider);
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  return apiRequest<MetaPaginatedResponse<SiteBillingEvent>>(`/site-admin/billing/events?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteBillingEntitlements(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  return apiRequest<MetaPaginatedResponse<SiteBillingEntitlement>>(`/site-admin/billing/entitlements?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getSiteIntegrationsOverview(token: string) {
  return apiRequest<SiteIntegrationsOverview>("/site-admin/integrations/overview", {
    token,
    cache: "no-store",
  });
}

export function listSiteIntegrations(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; provider?: string; status?: string; enabled?: boolean } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.provider) params.set("provider", query.provider);
  if (query.status) params.set("status", query.status);
  if (query.enabled !== undefined) params.set("enabled", String(query.enabled));
  return apiRequest<MetaPaginatedResponse<SiteIntegration>>(`/site-admin/integrations?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function rotateSiteIntegrationSecret(token: string, integrationId: string, payload: { key?: string; value?: string; reason?: string } = {}) {
  return apiRequest<{ integration: SiteIntegration; generatedSecret?: string }>(`/site-admin/integrations/${integrationId}/rotate-secret`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function listSiteWebhooks(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; enabled?: boolean } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.enabled !== undefined) params.set("enabled", String(query.enabled));
  return apiRequest<MetaPaginatedResponse<SiteWebhook>>(`/site-admin/webhooks?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteWebhookDeliveries(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; webhookId?: string; status?: string; eventType?: string; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.webhookId) params.set("webhookId", query.webhookId);
  if (query.status) params.set("status", query.status);
  if (query.eventType) params.set("eventType", query.eventType);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<MetaPaginatedResponse<SiteWebhookDelivery>>(`/site-admin/webhook-deliveries?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function retrySiteWebhookDelivery(token: string, deliveryId: string) {
  return apiRequest<SiteWebhookDelivery>(`/site-admin/webhook-deliveries/${deliveryId}/retry`, {
    method: "POST",
    token,
  });
}

export function rotateSiteWebhookSecret(token: string, webhookId: string, payload: { value?: string; reason?: string } = {}) {
  return apiRequest<SiteWebhook & { signingSecret?: string }>(`/site-admin/webhooks/${webhookId}/rotate-secret`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function getSiteObservabilityOverview(token: string) {
  return apiRequest<SiteObservabilityOverview>("/site-admin/observability/overview", {
    token,
    cache: "no-store",
  });
}

export function getSiteRealtimeOverview(token: string) {
  return apiRequest<SiteRealtimeOverview>("/site-admin/realtime/overview", {
    token,
    cache: "no-store",
  });
}

export function listSiteConversations(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; conversationId?: string; userId?: string; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.conversationId) params.set("conversationId", query.conversationId);
  if (query.userId) params.set("userId", query.userId);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<MetaPaginatedResponse<SiteConversationMetadata>>(`/site-admin/realtime/conversations?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteMessageActivity(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; conversationId?: string; userId?: string; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.conversationId) params.set("conversationId", query.conversationId);
  if (query.userId) params.set("userId", query.userId);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<MetaPaginatedResponse<SiteMessageActivity>>(`/site-admin/realtime/message-activity?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getSiteMeetingOverview(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: MeetingStatus; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<SiteMeetingOperationsOverview>(`/site-admin/meetings/overview?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteMeetingTenants(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: MeetingStatus; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<MetaPaginatedResponse<SiteMeetingTenantPosture>>(`/site-admin/meetings/tenants?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteMeetingReminderLogs(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: MeetingReminderJobStatus; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<MetaPaginatedResponse<SiteMeetingReminderLog>>(`/site-admin/meetings/reminder-logs?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getSiteComplianceOverview(token: string) {
  return apiRequest<SiteComplianceOverview>("/site-admin/compliance/overview", {
    token,
    cache: "no-store",
  });
}

export function listSiteComplianceJobs(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; type?: ComplianceJobType; status?: ComplianceJobStatus; subjectType?: string; subjectId?: string; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  if (query.subjectType) params.set("subjectType", query.subjectType);
  if (query.subjectId) params.set("subjectId", query.subjectId);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<MetaPaginatedResponse<SiteComplianceJob>>(`/site-admin/compliance/jobs?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function approveSiteComplianceJob(token: string, jobId: string, payload: { reason?: string } = {}) {
  return apiRequest<SiteComplianceJob>(`/site-admin/compliance/jobs/${jobId}/approve`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function rejectSiteComplianceJob(token: string, jobId: string, payload: { reason?: string } = {}) {
  return apiRequest<SiteComplianceJob>(`/site-admin/compliance/jobs/${jobId}/reject`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function runSiteComplianceJob(token: string, jobId: string) {
  return apiRequest<SiteComplianceJob>(`/site-admin/compliance/jobs/${jobId}/run`, {
    method: "POST",
    token,
  });
}

export function cancelSiteComplianceJob(token: string, jobId: string, payload: { reason?: string } = {}) {
  return apiRequest<SiteComplianceJob>(`/site-admin/compliance/jobs/${jobId}/cancel`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function sitePlatformSearch(
  token: string,
  query: { page?: number; limit?: number; search?: string; category?: SitePlatformSearchCategory; tenantId?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.category) params.set("category", query.category);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  return apiRequest<SitePlatformSearchResponse>(`/site-admin/search?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getSiteAutomationOverview(token: string) {
  return apiRequest<SiteAutomationOverview>("/site-admin/automation/overview", {
    token,
    cache: "no-store",
  });
}

export function listSiteWorkflows(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; entityType?: string; triggerType?: string; active?: boolean } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.triggerType) params.set("triggerType", query.triggerType);
  if (query.active !== undefined) params.set("active", String(query.active));
  return apiRequest<MetaPaginatedResponse<SiteWorkflow>>(`/site-admin/automation/workflows?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteWorkflowRuns(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; workflowId?: string; runId?: string; status?: WorkflowRunStatus; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.workflowId) params.set("workflowId", query.workflowId);
  if (query.runId) params.set("runId", query.runId);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<MetaPaginatedResponse<SiteWorkflowRun>>(`/site-admin/automation/runs?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function retrySiteWorkflowRun(token: string, runId: string) {
  return apiRequest<SiteWorkflowRun>(`/site-admin/automation/runs/${runId}/retry`, {
    method: "POST",
    token,
  });
}

export function cancelSiteWorkflowRun(token: string, runId: string) {
  return apiRequest<SiteWorkflowRun>(`/site-admin/automation/runs/${runId}/cancel`, {
    method: "POST",
    token,
  });
}

export function listSiteApprovalDefinitions(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; entityType?: string; status?: ApprovalStatus } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.status) params.set("status", query.status);
  return apiRequest<MetaPaginatedResponse<SiteApprovalDefinition>>(`/site-admin/automation/approval-definitions?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteApprovals(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; entityType?: string; status?: ApprovalStatus } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.status) params.set("status", query.status);
  return apiRequest<MetaPaginatedResponse<SiteApproval>>(`/site-admin/automation/approvals?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteWorkflowRunLogs(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; workflowId?: string; runId?: string; status?: WorkflowRunStatus; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.workflowId) params.set("workflowId", query.workflowId);
  if (query.runId) params.set("runId", query.runId);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<MetaPaginatedResponse<SiteWorkflowRunLog>>(`/site-admin/automation/run-logs?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getSiteAiOverview(token: string) {
  return apiRequest<SiteAiOverview>("/site-admin/ai/overview", {
    token,
    cache: "no-store",
  });
}

export function listSiteAiSettings(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; provider?: string; enabled?: boolean } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.provider) params.set("provider", query.provider);
  if (query.enabled !== undefined) params.set("enabled", String(query.enabled));
  return apiRequest<MetaPaginatedResponse<SiteAiSettings>>(`/site-admin/ai/settings?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteAiAgents(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; provider?: string; model?: string; enabled?: boolean } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.provider) params.set("provider", query.provider);
  if (query.model) params.set("model", query.model);
  if (query.enabled !== undefined) params.set("enabled", String(query.enabled));
  return apiRequest<MetaPaginatedResponse<SiteAiAgent>>(`/site-admin/ai/agents?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteAiConversations(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; agentId?: string; status?: AiConversationStatus } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.agentId) params.set("agentId", query.agentId);
  if (query.status) params.set("status", query.status);
  return apiRequest<MetaPaginatedResponse<SiteAiConversation>>(`/site-admin/ai/conversations?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteAiActions(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; agentId?: string; type?: string; status?: AiActionStatus } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.agentId) params.set("agentId", query.agentId);
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  return apiRequest<MetaPaginatedResponse<SiteAiAction>>(`/site-admin/ai/actions?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteAiUsage(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; provider?: string; model?: string; status?: AiRequestStatus; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.provider) params.set("provider", query.provider);
  if (query.model) params.set("model", query.model);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<MetaPaginatedResponse<SiteAiUsageLog>>(`/site-admin/ai/usage?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getSiteReportingOverview(token: string) {
  return apiRequest<SiteReportingOverview>("/site-admin/reporting/overview", {
    token,
    cache: "no-store",
  });
}

export function listSiteDashboards(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  return apiRequest<MetaPaginatedResponse<SiteDashboard>>(`/site-admin/reporting/dashboards?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteReports(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; type?: string; status?: ReportStatus } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  return apiRequest<MetaPaginatedResponse<SiteReport>>(`/site-admin/reporting/reports?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteReportExecutions(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; reportId?: string; type?: string; status?: ReportExecutionStatus; from?: string; to?: string } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.reportId) params.set("reportId", query.reportId);
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiRequest<MetaPaginatedResponse<SiteReportExecution>>(`/site-admin/reporting/executions?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteReportExports(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; reportId?: string; status?: ReportExportStatus } = {},
) {
  const params = siteParams(query, 30);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.reportId) params.set("reportId", query.reportId);
  if (query.status) params.set("status", query.status);
  return apiRequest<MetaPaginatedResponse<SiteReportExport>>(`/site-admin/reporting/exports?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getSiteHardeningOverview(token: string) {
  return apiRequest<SiteHardeningOverview>("/site-admin/hardening/overview", {
    token,
    cache: "no-store",
  });
}

export function listSiteTenants(
  token: string,
  query: { page?: number; limit?: number; search?: string; status?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 30)),
  });
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);

  return apiRequest<MetaPaginatedResponse<Tenant>>(`/site-admin/tenants?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteUsers(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 25)),
  });
  if (query.search) params.set("search", query.search);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.status) params.set("status", query.status);

  return apiRequest<MetaPaginatedResponse<TenantUser>>(`/site-admin/users?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getSiteUser(token: string, userId: string) {
  return apiRequest<SiteUserDetail>(`/site-admin/users/${userId}`, {
    token,
    cache: "no-store",
  });
}

export function updateSiteUserStatus(
  token: string,
  userId: string,
  payload: { status: string; reason?: string },
) {
  return apiRequest<TenantUser>(`/site-admin/users/${userId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function revokeSiteUserSessions(token: string, userId: string, payload: { reason?: string } = {}) {
  return apiRequest<{ success: boolean; sessionsRevoked: number }>(`/site-admin/users/${userId}/sessions/revoke`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function resendSiteUserVerification(token: string, userId: string) {
  return apiRequest<{
    success: boolean;
    sent: boolean;
    provider?: string;
    skipped?: boolean;
    message: string;
    devLink?: string;
  }>(`/site-admin/users/${userId}/resend-verification`, {
    method: "POST",
    token,
  });
}

export function getSiteTenant(token: string, tenantId: string) {
  return apiRequest<SiteTenantDetail>(`/site-admin/tenants/${tenantId}`, {
    token,
    cache: "no-store",
  });
}

export function updateSiteTenantStatus(
  token: string,
  tenantId: string,
  payload: { status: string; reason?: string },
) {
  return apiRequest<Tenant>(`/site-admin/tenants/${tenantId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function listSiteTenantUsers(
  token: string,
  tenantId: string,
  query: { page?: number; limit?: number; search?: string; status?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 30)),
  });
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);

  return apiRequest<MetaPaginatedResponse<TenantUser>>(`/site-admin/tenants/${tenantId}/users?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listSiteTenantResource<T = Record<string, unknown>>(
  token: string,
  tenantId: string,
  section: SiteTenantResourceSection,
  query: { page?: number; limit?: number; search?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 30)),
  });
  if (query.search) params.set("search", query.search);

  if (section === "users") {
    return Promise.all([
      apiRequest<MetaPaginatedResponse<TenantUser>>(`/site-admin/tenants/${tenantId}/users?${params.toString()}`, {
        token,
        cache: "no-store",
      }),
      getSiteTenant(token, tenantId),
    ]).then(([response, detail]) => ({
      tenant: detail.tenant,
      section,
      summary: { total: response.meta.total, byStatus: detail.users },
      data: response.data as T[],
      meta: response.meta,
    }));
  }

  return apiRequest<SiteTenantResourceResponse<T>>(
    `/site-admin/tenants/${tenantId}/${section}?${params.toString()}`,
    {
      token,
      cache: "no-store",
    },
  );
}

export function listSiteSecurityEvents(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; type?: string; severity?: SecurityEventSeverity; status?: SecurityEventStatus } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 30)),
  });
  if (query.search) params.set("search", query.search);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.type) params.set("type", query.type);
  if (query.severity) params.set("severity", query.severity);
  if (query.status) params.set("status", query.status);

  return apiRequest<MetaPaginatedResponse<SecurityEvent>>(`/site-admin/security-events?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function updateSiteSecurityEvent(
  token: string,
  eventId: string,
  payload: { status?: SecurityEventStatus; severity?: SecurityEventSeverity; metadata?: unknown },
) {
  return apiRequest<SecurityEvent>(`/site-admin/security-events/${eventId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function listPlatformAuditLogs(
  token: string,
  query: { page?: number; limit?: number; search?: string; actorId?: string; tenantId?: string; action?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 30)),
  });
  if (query.search) params.set("search", query.search);
  if (query.actorId) params.set("actorId", query.actorId);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.action) params.set("action", query.action);

  return apiRequest<MetaPaginatedResponse<PlatformAuditLog>>(`/site-admin/audit-logs?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listPlatformAdmins(
  token: string,
  query: { page?: number; limit?: number; search?: string; level?: PlatformAdminLevel; status?: PlatformAdminStatus } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 30)),
  });
  if (query.search) params.set("search", query.search);
  if (query.level) params.set("level", query.level);
  if (query.status) params.set("status", query.status);

  return apiRequest<MetaPaginatedResponse<PlatformAdminGrant>>(`/site-admin/platform-admins?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function grantPlatformAdmin(
  token: string,
  payload: { userId: string; level: PlatformAdminLevel; scopes?: string[]; notes?: string },
) {
  return apiRequest<PlatformAdminGrant>("/site-admin/platform-admins", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function revokePlatformAdmin(token: string, platformAdminId: string, payload: { reason?: string } = {}) {
  return apiRequest<PlatformAdminGrant | null>(`/site-admin/platform-admins/${platformAdminId}/revoke`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function getSecurityChecks(token: string) {
  return apiRequest<SecurityChecks>("/admin/security-checks", {
    token,
    cache: "no-store",
  });
}

export function getSecurityPolicy(token: string) {
  return apiRequest<SecurityPolicy>("/admin/security-policy", {
    token,
    cache: "no-store",
  });
}

export function updateSecurityPolicy(token: string, payload: Partial<Pick<
  SecurityPolicy,
  | "enforceIpAllowlist"
  | "ipAllowlist"
  | "sessionTtlMinutes"
  | "maxSessionsPerUser"
  | "passwordMinLength"
  | "passwordRequireUpper"
  | "passwordRequireLower"
  | "passwordRequireNumber"
  | "passwordRequireSymbol"
  | "passwordHistoryCount"
  | "mfaRequired"
  | "auditRetentionDays"
  | "dataRetentionDays"
  | "maxUploadBytes"
  | "allowedUploadMimeTypes"
>> & { metadata?: unknown }) {
  return apiRequest<SecurityPolicy>("/admin/security-policy", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function listSsoProviders(token: string) {
  return apiRequest<SsoProvider[]>("/identity-security/sso-providers", {
    token,
    cache: "no-store",
  });
}

export function upsertSsoProvider(
  token: string,
  payload: {
    type: SsoProvider["type"];
    name: string;
    status?: SsoProvider["status"];
    issuerUrl?: string;
    authorizationUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    redirectUri?: string;
    clientId?: string;
    clientSecret?: string;
    scopes?: string[];
    allowedDomains?: string[];
    buttonLabel?: string;
    jitProvisioningEnabled?: boolean;
  },
) {
  return apiRequest<SsoProvider[]>("/identity-security/sso-providers", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateTenantLoginPolicy(
  token: string,
  payload: {
    allowedLoginMethods?: string[];
    ssoRequired?: boolean;
    domainDiscoveryEnabled?: boolean;
    mfaRequired?: boolean;
    trustedDeviceTtlDays?: number;
  },
) {
  return apiRequest<{
    mfaRequired: boolean;
    allowedLoginMethods: string[];
    ssoRequired: boolean;
    domainDiscoveryEnabled: boolean;
    trustedDeviceTtlDays: number;
  }>("/identity-security/login-policy", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function discoverSso(query: { email?: string; tenantSlug?: string }) {
  const params = new URLSearchParams();
  if (query.email) params.set("email", query.email);
  if (query.tenantSlug) params.set("tenantSlug", query.tenantSlug);
  return apiRequest<{
    tenant: Pick<Tenant, "id" | "name" | "slug"> | null;
    loginMethods: string[];
    ssoRequired?: boolean;
    mfaRequired?: boolean;
    providers: SsoProvider[];
  }>(`/auth/sso/discovery?${params.toString()}`, { cache: "no-store" });
}

export function startSso(query: { tenantSlug: string; providerId: string; redirectUri?: string }) {
  const params = new URLSearchParams({
    tenantSlug: query.tenantSlug,
    providerId: query.providerId,
  });
  if (query.redirectUri) params.set("redirectUri", query.redirectUri);
  return apiRequest<{ authorizationUrl: string; stateExpiresAt: string }>(`/auth/sso/start?${params.toString()}`, {
    cache: "no-store",
  });
}

export function completeSso(payload: { state: string; code: string }) {
  return apiRequest<AuthResponse>("/auth/sso/callback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listSessions(
  token: string,
  query: { page?: number; limit?: number; search?: string; userId?: string; activeOnly?: boolean; revoked?: boolean; ipAddress?: string; from?: string; to?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(Math.min(Math.max(query.limit ?? 50, 1), 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.userId) params.set("userId", query.userId);
  if (query.activeOnly !== undefined) params.set("activeOnly", String(query.activeOnly));
  if (query.revoked !== undefined) params.set("revoked", String(query.revoked));
  if (query.ipAddress) params.set("ipAddress", query.ipAddress);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  return apiRequest<PaginatedResponse<AuthSession>>(`/admin/sessions?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function revokeSession(token: string, sessionId: string) {
  return apiRequest<AuthSession>(`/admin/sessions/${sessionId}/revoke`, {
    method: "POST",
    token,
  });
}

export function revokeUserSessions(token: string, userId: string) {
  return apiRequest<{ success: boolean; revokedSessions: number }>(`/admin/users/${userId}/sessions/revoke`, {
    method: "POST",
    token,
  });
}

export function listSecurityEvents(
  token: string,
  query: { page?: number; limit?: number; search?: string; type?: string; severity?: SecurityEventSeverity; status?: SecurityEventStatus; actorId?: string; subjectType?: string; subjectId?: string; from?: string; to?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(Math.min(Math.max(query.limit ?? 50, 1), 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.type) params.set("type", query.type);
  if (query.severity) params.set("severity", query.severity);
  if (query.status) params.set("status", query.status);
  if (query.actorId) params.set("actorId", query.actorId);
  if (query.subjectType) params.set("subjectType", query.subjectType);
  if (query.subjectId) params.set("subjectId", query.subjectId);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  return apiRequest<PaginatedResponse<SecurityEvent>>(`/admin/security-events?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function updateSecurityEvent(
  token: string,
  eventId: string,
  payload: { severity?: SecurityEventSeverity; status?: SecurityEventStatus; metadata?: unknown },
) {
  return apiRequest<SecurityEvent>(`/admin/security-events/${eventId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function listComplianceJobs(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    type?: ComplianceJobType;
    status?: ComplianceJobStatus;
    subjectType?: string;
    subjectId?: string;
    from?: string;
    to?: string;
  } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(boundedLimit(query.limit, 30)),
  });
  if (query.search) params.set("search", query.search);
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  if (query.subjectType) params.set("subjectType", query.subjectType);
  if (query.subjectId) params.set("subjectId", query.subjectId);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  return apiRequest<MetaPaginatedResponse<ComplianceJob>>(`/admin/compliance-jobs?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createComplianceJob(
  token: string,
  payload: {
    type: ComplianceJobType;
    subjectType?: string;
    subjectId?: string;
    reason?: string;
    parameters?: unknown;
    expiresAt?: string;
  },
) {
  return apiRequest<ComplianceJob>("/admin/compliance-jobs", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function approveComplianceJob(token: string, jobId: string, payload: { reason?: string } = {}) {
  return apiRequest<ComplianceJob>(`/admin/compliance-jobs/${jobId}/approve`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function rejectComplianceJob(token: string, jobId: string, payload: { reason?: string } = {}) {
  return apiRequest<ComplianceJob>(`/admin/compliance-jobs/${jobId}/reject`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function runComplianceJob(token: string, jobId: string) {
  return apiRequest<ComplianceJob>(`/admin/compliance-jobs/${jobId}/run`, {
    method: "POST",
    token,
  });
}

export function cancelComplianceJob(token: string, jobId: string) {
  return apiRequest<ComplianceJob>(`/admin/compliance-jobs/${jobId}/cancel`, {
    method: "POST",
    token,
  });
}

export function listApiKeys(
  token: string,
  query: { page?: number; limit?: number; search?: string; status?: ApiKeyStatus; scope?: string; createdById?: string; from?: string; to?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(Math.min(Math.max(query.limit ?? 50, 1), 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.scope) params.set("scope", query.scope);
  if (query.createdById) params.set("createdById", query.createdById);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  return apiRequest<PaginatedResponse<ApiKey>>(`/admin/api-keys?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createApiKey(
  token: string,
  payload: { name: string; scopes?: string[]; expiresAt?: string; metadata?: unknown },
) {
  return apiRequest<CreatedApiKey>("/admin/api-keys", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function revokeApiKey(token: string, apiKeyId: string) {
  return apiRequest<ApiKey>(`/admin/api-keys/${apiKeyId}/revoke`, {
    method: "POST",
    token,
  });
}

function appendAnalyticsParams(params: URLSearchParams, query: AnalyticsQuery) {
  if (query.projectId) params.set("projectId", query.projectId);
  if (query.teamId) params.set("teamId", query.teamId);
  if (query.workspaceId) params.set("workspaceId", query.workspaceId);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
}

export function listReports(
  token: string,
  query: { page?: number; limit?: number; search?: string; type?: string; status?: ReportStatus; includeArchived?: boolean } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(Math.min(Math.max(query.limit ?? 50, 1), 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  if (query.includeArchived !== undefined) params.set("includeArchived", String(query.includeArchived));

  return apiRequest<PaginatedResponse<Report>>(`/reporting/reports?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createReport(
  token: string,
  payload: {
    name: string;
    description?: string;
    type: string;
    status?: ReportStatus;
    query?: unknown;
    schedule?: string;
    timezone?: string;
    recipients?: string[];
    cacheTtlSeconds?: number;
    nextRunAt?: string;
    metadata?: unknown;
  },
) {
  return apiRequest<Report>("/reporting/reports", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function runAdHocReport(
  token: string,
  payload: { type?: string; parameters?: AnalyticsQuery; cacheKey?: string },
) {
  return apiRequest<ReportExecution>("/reporting/reports/run", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function runSavedReport(
  token: string,
  reportId: string,
  payload: { parameters?: AnalyticsQuery; cacheKey?: string } = {},
) {
  return apiRequest<ReportExecution>(`/reporting/reports/${reportId}/run`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function exportSavedReport(
  token: string,
  reportId: string,
  payload: { format: ReportExportFormat; parameters?: AnalyticsQuery },
) {
  return apiRequest<ReportExport>(`/reporting/reports/${reportId}/exports`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listReportExecutions(
  token: string,
  query: { page?: number; limit?: number; search?: string; reportId?: string; type?: string; status?: ReportExecutionStatus; from?: string; to?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(Math.min(Math.max(query.limit ?? 20, 1), 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.reportId) params.set("reportId", query.reportId);
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  return apiRequest<PaginatedResponse<ReportExecution>>(`/reporting/executions?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listReportExports(
  token: string,
  query: { page?: number; limit?: number; search?: string; reportId?: string; format?: ReportExportFormat; status?: ReportExportStatus; from?: string; to?: string } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(Math.min(Math.max(query.limit ?? 20, 1), 100)),
  });
  if (query.search) params.set("search", query.search);
  if (query.reportId) params.set("reportId", query.reportId);
  if (query.format) params.set("format", query.format);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);

  return apiRequest<PaginatedResponse<ReportExport>>(`/reporting/exports?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getAnalyticsOverview(token: string, query: AnalyticsQuery = {}) {
  const params = new URLSearchParams();
  appendAnalyticsParams(params, query);
  return apiRequest<AnalyticsOverview>(`/reporting/analytics/overview?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getProjectHealthAnalytics(token: string, query: AnalyticsQuery = {}) {
  const params = new URLSearchParams();
  appendAnalyticsParams(params, query);
  return apiRequest<ProjectHealthAnalytics>(`/reporting/analytics/project-health?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getTeamPerformanceAnalytics(token: string, query: AnalyticsQuery = {}) {
  const params = new URLSearchParams();
  appendAnalyticsParams(params, query);
  return apiRequest<TeamPerformanceAnalytics>(`/reporting/analytics/team-performance?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getCycleTimeAnalytics(token: string, query: AnalyticsQuery = {}) {
  const params = new URLSearchParams();
  appendAnalyticsParams(params, query);
  return apiRequest<CycleTimeAnalytics>(`/reporting/analytics/cycle-time?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getVelocityAnalytics(token: string, query: AnalyticsQuery = {}) {
  const params = new URLSearchParams();
  appendAnalyticsParams(params, query);
  return apiRequest<VelocityAnalytics>(`/reporting/analytics/velocity?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getBudgetAnalytics(token: string, query: AnalyticsQuery = {}) {
  const params = new URLSearchParams();
  appendAnalyticsParams(params, query);
  return apiRequest<BudgetAnalytics>(`/reporting/analytics/budget?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function getSlaAnalytics(token: string, query: AnalyticsQuery = {}) {
  const params = new URLSearchParams();
  appendAnalyticsParams(params, query);
  return apiRequest<SlaAnalytics>(`/reporting/analytics/sla?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function listConversations(
  token: string,
  query: { page?: number; limit?: number; search?: string; isGroup?: boolean } = {},
) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 50),
  });
  if (query.search) params.set("search", query.search);
  if (query.isGroup !== undefined) params.set("isGroup", String(query.isGroup));

  return apiRequest<PaginatedResponse<Conversation>>(`/conversations?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function createConversation(
  token: string,
  payload: { title?: string; isGroup?: boolean; memberIds: string[] },
) {
  return apiRequest<Conversation>("/conversations", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getConversation(token: string, conversationId: string) {
  return apiRequest<Conversation>(`/conversations/${conversationId}`, {
    token,
    cache: "no-store",
  });
}

export function updateConversation(
  token: string,
  conversationId: string,
  payload: Partial<Pick<Conversation, "title" | "isGroup">>,
) {
  return apiRequest<Conversation>(`/conversations/${conversationId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteConversation(token: string, conversationId: string) {
  return apiRequest<{ success: boolean }>(`/conversations/${conversationId}`, {
    method: "DELETE",
    token,
  });
}

export function listConversationMembers(token: string, conversationId: string) {
  return apiRequest<ConversationMember[]>(`/conversations/${conversationId}/members`, {
    token,
    cache: "no-store",
  });
}

export function addConversationMember(token: string, conversationId: string, userId: string) {
  return apiRequest<ConversationMember[]>(`/conversations/${conversationId}/members`, {
    method: "POST",
    token,
    body: JSON.stringify({ userId }),
  });
}

export function removeConversationMember(token: string, conversationId: string, userId: string) {
  return apiRequest<{ success: boolean }>(`/conversations/${conversationId}/members/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function listMessages(
  token: string,
  conversationId: string,
  query: { page?: number; limit?: number; search?: string } = {},
) {
  const limit = Math.min(Math.max(query.limit ?? 100, 1), 100);
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(limit),
  });
  if (query.search) params.set("search", query.search);

  return apiRequest<PaginatedResponse<Message>>(`/conversations/${conversationId}/messages?${params.toString()}`, {
    token,
    cache: "no-store",
  });
}

export function sendMessage(
  token: string,
  conversationId: string,
  payload: {
    body?: string;
    attachments?: MessageAttachment[] | unknown[];
    parentMessageId?: string;
    forwardedFromMessageId?: string;
    metadata?: unknown;
  },
) {
  return apiRequest<Message>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateMessage(token: string, messageId: string, payload: { body: string }) {
  return apiRequest<Message>(`/messages/${messageId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteMessage(token: string, messageId: string) {
  return apiRequest<{ success: boolean }>(`/messages/${messageId}`, {
    method: "DELETE",
    token,
  });
}

export function listPinnedMessages(token: string, conversationId: string) {
  return apiRequest<Message[]>(`/conversations/${conversationId}/messages/pinned`, {
    token,
    cache: "no-store",
  });
}

export function pinMessage(token: string, messageId: string) {
  return apiRequest<Message>(`/messages/${messageId}/pin`, {
    method: "POST",
    token,
  });
}

export function unpinMessage(token: string, messageId: string) {
  return apiRequest<Message>(`/messages/${messageId}/unpin`, {
    method: "POST",
    token,
  });
}

export function forwardMessage(
  token: string,
  messageId: string,
  payload: { conversationIds: string[]; body?: string; includeAttachments?: boolean; metadata?: unknown },
) {
  return apiRequest<{ data: Message[]; forwarded: number }>(`/messages/${messageId}/forward`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function addMessageReaction(token: string, messageId: string, emoji: string) {
  return apiRequest<MessageReaction>(`/messages/${messageId}/reactions`, {
    method: "POST",
    token,
    body: JSON.stringify({ emoji }),
  });
}

export function removeMessageReaction(token: string, messageId: string, emoji: string) {
  return apiRequest<{ success: boolean }>(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
    method: "DELETE",
    token,
  });
}

export function listMessageReadReceipts(token: string, messageId: string) {
  return apiRequest<MessageReadReceipt[]>(`/messages/${messageId}/read-receipts`, {
    token,
    cache: "no-store",
  });
}

export function markMessageRead(token: string, messageId: string) {
  return apiRequest<MessageReadReceipt>(`/messages/${messageId}/read-receipts`, {
    method: "POST",
    token,
  });
}
