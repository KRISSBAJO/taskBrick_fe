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
