import type { AuthResponse, AuthUser, PaginatedResponse, StoredAuth } from "./types";

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
export type * from "./types";

type RequestOptions = RequestInit & {
  token?: string | null;
  skipAuthRefresh?: boolean;
};

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

export {
  createSupportRequest,
  getAccountHelp,
  getAccountOverview,
  listAccountWorkspaces,
  listGuestWorkspaces,
  type AccountHelp,
  type AccountOverview,
  type AccountPage,
  type AccountWorkspace,
  type GuestWorkspace,
  type GuestWorkspacePage,
  type GuestWorkspaceProject,
  type SupportRequestPayload,
  type SupportRequestResponse,
} from "./api/accountApi";
export {
  acceptInvite,
  changePassword,
  completeSso,
  discoverSso,
  forgotPassword,
  getMe,
  login,
  logoutSession,
  refreshSession,
  register,
  resendVerification,
  resetPassword,
  startSso,
  verifyEmail,
  verifyMfaLogin,
} from "./api/authApi";
export {
  disableMfa,
  enableTotp,
  getIdentitySecurityOverview,
  listSsoProviders,
  regenerateBackupCodes,
  revokeTrustedDevice,
  setupTotp,
  updateTenantLoginPolicy,
  upsertSsoProvider,
} from "./api/identitySecurityApi";
export { listSessions, revokeSession, revokeUserSessions } from "./api/sessionApi";
export { bulkInviteTenantUsers, inviteTenantUser, listUsers, updateMyProfile } from "./api/userApi";
export { listWorkspaces } from "./api/workspaceApi";
export {
  addTeamMember,
  cancelTeamMemberInvite,
  createTeam,
  inviteTeamMember,
  listTeamMembers,
  listTeams,
  removeTeamMember,
  resendTeamMemberInvite,
  updateTeamMemberRole,
} from "./api/teamApi";
export {
  assignRole,
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  removeRoleFromUser,
  updateRole,
} from "./api/accessControlApi";
export { globalSearch } from "./api/searchApi";
export { healthReady, moduleStatus } from "./api/systemApi";
export { getCurrentTenant, updateCurrentTenant } from "./api/tenantApi";
export {
  archiveDocument,
  archiveDocumentFolder,
  createDocument,
  createDocumentFolder,
  deleteDocumentFolder,
  getDocument,
  getDocumentFolderTree,
  hardDeleteDocument,
  listDocumentFolders,
  listDocuments,
  listDocumentVersions,
  publishDocument,
  restoreDocument,
  restoreDocumentFolder,
  restoreDocumentVersion,
  updateDocument,
  updateDocumentFolder,
} from "./api/documentApi";
export {
  archiveFileAsset,
  createFileAsset,
  createUploadIntent,
  deleteFileAsset,
  listFileAssets,
  restoreFileAsset,
} from "./api/fileApi";
export {
  deleteNotification,
  deleteReadNotifications,
  getUnreadNotificationCount,
  listNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  updateNotificationPreferences,
} from "./api/notificationApi";
export {
  archiveInternalMailThread,
  createInternalMailbox,
  createInternalMailboxAlias,
  createInternalMailThread,
  deleteInternalMailThread,
  getInternalMailFolders,
  getInternalMailThread,
  listInternalMailThreads,
  markInternalMailRead,
  markInternalMailUnread,
  moveInternalMailThread,
  removeInternalMailboxMember,
  replyInternalMailThread,
  restoreInternalMailThread,
  searchInternalMailboxes,
  setInternalMailFlag,
  setInternalMailPin,
  setInternalMailStar,
  snoozeInternalMailThread,
  updateInternalMailbox,
  upsertInternalMailboxMember,
} from "./api/internalMailApi";
export {
  approveApprovalStep,
  archiveApprovalDefinition,
  cancelApproval,
  createApproval,
  createApprovalDefinition,
  getApproval,
  listApprovalDefinitions,
  listApprovals,
  listMyPendingApprovals,
  rejectApprovalStep,
  reopenApproval,
  restoreApprovalDefinition,
  updateApprovalDefinition,
} from "./api/approvalApi";
export type {
  Approval,
  ApprovalDefinition,
  ApprovalDefinitionPayload,
  ApprovalDefinitionQuery,
  ApprovalDefinitionStep,
  ApprovalPayload,
  ApprovalQuery,
  ApprovalStatus,
  ApprovalStep,
  ApprovalStepInput,
} from "./api/approvalApi";
export {
  archiveWorkflow,
  cancelWorkflowRun,
  createIntegration,
  createWebhook,
  createWorkflow,
  deleteIntegration,
  deleteWebhook,
  deleteWorkflow,
  disableIntegration,
  disableWebhook,
  enableIntegration,
  enableWebhook,
  listDeadLetterWorkflowRuns,
  listIntegrationLogs,
  listIntegrations,
  listWebhookDeliveries,
  listWebhooks,
  listWorkflowRunLogs,
  listWorkflowRuns,
  listWorkflows,
  processOmoFlowEvent,
  replaceWorkflowNodes,
  restoreWorkflow,
  retryWebhookDelivery,
  retryWorkflowRun,
  requeueWorkflowRun,
  rotateIntegrationSecret,
  rotateWebhookSecret,
  runWorkflow,
  syncIntegration,
  triggerWebhookEvent,
  updateIntegration,
  updateWebhook,
  updateWorkflow,
} from "./api/integrationWorkflowApi";
export {
  applyBoardActions,
  archiveAiAgent,
  createAiAgent,
  deleteAiAgent,
  generateBoardActionPlan,
  generateBoardSummary,
  getAiSettings,
  listAiAgents,
  restoreAiAgent,
  scanBoardRisks,
  updateAiAgent,
  updateAiSettings,
} from "./api/aiApi";
export type {
  BoardAiActionPlanResponse,
  BoardAiApplyActionsPayload,
  BoardAiApplyResponse,
  BoardAiPayload,
  BoardAiRiskScanResponse,
  BoardAiSummaryResponse,
} from "./api/aiApi";
export {
  confirmBillingCheckout,
  createBillingCheckout,
  createBillingPortal,
  cancelTenantSubscription,
  changeTenantSubscriptionPlan,
  getBillingAccountStatus,
  getCurrentTenantSubscription,
  getTenantEntitlements,
  getTenantUsageSummary,
  listBillingPlans,
  listTenantBillingEvents,
  listTenantInvoices,
  listTenantUsageRecords,
  resumeTenantSubscription,
  startTenantBillingTrial,
} from "./api/billingApi";
export {
  addConversationMember,
  addMessageReaction,
  createConversation,
  deleteConversation,
  deleteMessage,
  forwardMessage,
  getConversation,
  listConversationMembers,
  listConversations,
  listMessageReadReceipts,
  listMessages,
  listPinnedMessages,
  markMessageRead,
  pinMessage,
  removeConversationMember,
  removeMessageReaction,
  sendMessage,
  unpinMessage,
  updateConversation,
  updateMessage,
} from "./api/conversationApi";
export {
  createReport,
  exportSavedReport,
  getAnalyticsOverview,
  getBudgetAnalytics,
  getCycleTimeAnalytics,
  getProjectHealthAnalytics,
  getSlaAnalytics,
  getTeamPerformanceAnalytics,
  getVelocityAnalytics,
  listReportExecutions,
  listReportExports,
  listReports,
  runAdHocReport,
  runSavedReport,
} from "./api/reportingApi";
export {
  approveComplianceJob,
  cancelComplianceJob,
  createApiKey,
  createComplianceJob,
  getAdminOverview,
  getSecurityChecks,
  getSecurityPolicy,
  listApiKeys,
  listAuditLogs,
  listComplianceJobs,
  listSecurityEvents,
  rejectComplianceJob,
  revokeApiKey,
  runComplianceJob,
  updateSecurityEvent,
  updateSecurityPolicy,
} from "./api/adminSecurityApi";
export {
  assignSiteBillingPlanFeature,
  archiveSiteBillingPlan,
  cancelSiteSubscription,
  changeSiteSubscriptionPlan,
  createSiteBillingFeature,
  createSiteBillingPlan,
  getSiteBillingOverview,
  listSiteBillingEntitlements,
  listSiteBillingEvents,
  listSiteBillingFeatures,
  listSiteBillingInvoices,
  listSiteBillingPlans,
  listSiteBillingSubscriptions,
  listSiteBillingUsageRecords,
  removeSiteBillingPlanFeature,
  restoreSiteBillingPlan,
  resumeSiteSubscription,
  setSiteBillingFeatureActive,
  startSiteTenantTrial,
  syncSiteBillingPlanToStripe,
  updateSiteBillingFeature,
  updateSiteBillingPlan,
  updateSiteBillingPlanFeature,
  updateSiteSubscription,
} from "./api/siteAdminBillingApi";
export {
  getSiteIdentitySecurityOverview,
  listSiteLoginHistory,
  listSiteSecurityPolicies,
  listSiteSessions,
  listSiteSsoProviders,
  listSiteTrustedDevices,
  revokeSiteSession,
  revokeSiteTrustedDevice,
  sendSiteAdminPasswordReset,
} from "./api/siteAdminIdentityApi";
export {
  getSiteAdminOverview,
  getSiteAdminProfile,
  getSiteHardeningOverview,
  getSiteTenant,
  getSiteUser,
  grantPlatformAdmin,
  listPlatformAdmins,
  listPlatformAuditLogs,
  listSiteSecurityEvents,
  listSiteTenantResource,
  listSiteTenants,
  listSiteTenantUsers,
  listSiteUsers,
  resendSiteUserVerification,
  revokePlatformAdmin,
  revokeSiteUserSessions,
  updateSiteSecurityEvent,
  updateSiteTenantStatus,
  updateSiteUserStatus,
} from "./api/siteAdminCoreApi";
export {
  approveSiteComplianceJob,
  cancelSiteComplianceJob,
  getSiteAutomationOverview,
  getSiteComplianceOverview,
  getSiteIntegrationsOverview,
  getSiteMeetingOverview,
  getSiteObservabilityOverview,
  getSiteRealtimeOverview,
  listSiteApprovalDefinitions,
  listSiteApprovals,
  listSiteComplianceJobs,
  listSiteConversations,
  listSiteIntegrations,
  listSiteMeetingReminderLogs,
  listSiteMeetingTenants,
  listSiteMessageActivity,
  listSiteWebhookDeliveries,
  listSiteWebhooks,
  listSiteWorkflowRunLogs,
  listSiteWorkflowRuns,
  listSiteWorkflows,
  rejectSiteComplianceJob,
  retrySiteWebhookDelivery,
  retrySiteWorkflowRun,
  rotateSiteIntegrationSecret,
  rotateSiteWebhookSecret,
  runSiteComplianceJob,
  sitePlatformSearch,
  cancelSiteWorkflowRun,
} from "./api/siteAdminOperationsApi";
export {
  getSiteAiOverview,
  getSiteReportingOverview,
  listSiteAiActions,
  listSiteAiAgents,
  listSiteAiConversations,
  listSiteAiSettings,
  listSiteAiUsage,
  listSiteDashboards,
  listSiteReportExecutions,
  listSiteReportExports,
  listSiteReports,
} from "./api/siteAdminAiReportingApi";

export {
  listMeetingTypes,
  createMeetingType,
  updateMeetingType,
  listMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  cancelMeeting,
  completeMeeting,
  startMeeting,
  archiveMeeting,
  restoreMeeting,
  getMeetingIntegrationStatus,
  getMeetingIntegrationSettings,
  updateMeetingIntegrationSettings,
  getMeetingAdminOverview,
  getMeetingPolicy,
  updateMeetingPolicy,
  getMeetingAdminAnalytics,
  listMeetingAdminReminderLogs,
  createMeetingConference,
  listMeetingReminderJobs,
  processMeetingReminderJobs,
  retryMeetingReminderJob,
  getMeetingAiState,
  linkMeetingAiContext,
  generateMeetingAiAgenda,
  generateMeetingAiPreparationBrief,
  suggestMeetingAiAttendees,
  detectMeetingAiRisks,
  generateMeetingAiNotes,
  generateMeetingAiFollowUp,
  generateMeetingAiRoleSummary,
  scoreMeetingAiEffectiveness,
  detectMeetingAiMissedDecisions,
  convertMeetingAiActionItems,
  scheduleMeetingAiFollowUpReminders,
  listMeetingAvailability,
  createMeetingAvailabilityWindow,
  deleteMeetingAvailabilityWindow,
  listBookingPages,
  createBookingPage,
  updateBookingPage,
  createBookingFormField,
  updateBookingFormField,
  deleteBookingFormField,
  listBookingRequests,
  resolvePublicBookingPage,
  listPublicBookingSlots,
  createPublicBooking,
  cancelPublicBooking,
  reschedulePublicBooking,
  addMeetingAttendee,
  updateMeetingAttendee,
  createMeetingAgendaItem,
  updateMeetingAgendaItem,
  createMeetingReminder,
  listMeetingActivity,
  getMeetingWorkspace,
  updateLiveMeetingNotes,
  createMeetingComment,
  updateMeetingComment,
  deleteMeetingComment,
  createMeetingDecision,
  updateMeetingDecision,
  deleteMeetingDecision,
  createMeetingChecklistItem,
  updateMeetingChecklistItem,
  deleteMeetingChecklistItem,
  updateMeetingAttendance,
  markMeetingNoShow,
  assignMeetingActionItem,
  sendMeetingFollowUp,
  syncMeetingOmoFlowRuntime,
} from "./api/meetingApi";
export type { BookingPagePayload, MeetingAiGeneratePayload } from "./api/meetingApi";
export {
  listProjects,
  getProject,
  getProjectPermissions,
  updateProject,
  deleteProject,
  listProjectMembers,
  upsertProjectMember,
  removeProjectMember,
  listProjectMilestones,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  listProjectRisks,
  createProjectRisk,
  updateProjectRisk,
  deleteProjectRisk,
  listProjectBudgets,
  createProjectBudget,
  updateProjectBudget,
  deleteProjectBudget,
  listProjectStakeholders,
  createProjectStakeholder,
  updateProjectStakeholder,
  deleteProjectStakeholder,
  listProjectDependencies,
  createProjectDependency,
  updateProjectDependency,
  deleteProjectDependency,
  listProjectDecisions,
  createProjectDecision,
  updateProjectDecision,
  deleteProjectDecision,
  listProjectChangeRequests,
  createProjectChangeRequest,
  updateProjectChangeRequest,
  deleteProjectChangeRequest,
  createProject,
} from "./api/projectApi";
export {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  archiveTask,
  restoreTask,
  listTaskComments,
  createTaskComment,
  deleteTaskComment,
  listTaskChecklists,
  createTaskChecklist,
  deleteTaskChecklist,
  createTaskChecklistItem,
  updateTaskChecklistItem,
  deleteTaskChecklistItem,
  listTaskActivities,
  listTaskAttachments,
  createTaskAttachment,
  deleteTaskAttachment,
  listTaskDependencies,
  createTaskDependency,
  deleteTaskDependency,
  getTaskTaxonomy,
  listCustomFields,
  createCustomField,
  updateCustomField,
  archiveCustomField,
  restoreCustomField,
  deleteCustomField,
  listTaskSavedViews,
  createTaskSavedView,
  updateTaskSavedView,
  deleteTaskSavedView,
  bulkTaskOperation,
  listLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  listTaskLabels,
  assignTaskLabel,
  removeTaskLabel,
  listTaskAssignees,
  addTaskAssignee,
  removeTaskAssignee,
  listTaskWatchers,
  addTaskWatcher,
  removeTaskWatcher,
  listTasks,
} from "./api/taskApi";
export {
  getProjectBoard,
  createBoardColumn,
  updateBoardColumn,
  deleteBoardColumn,
  reorderBoardColumns,
  updateTaskBoardOrder,
  updateTaskStatus,
  listSprints,
  createSprint,
  updateSprint,
  startSprint,
  completeSprint,
  deleteSprint,
  addSprintTasks,
  removeSprintTask,
  listSprintRetrospectives,
  createSprintRetrospective,
  updateSprintRetrospective,
  deleteSprintRetrospective,
  type SprintRetrospective,
  type SprintRetrospectiveActionItem,
} from "./api/agileApi";
