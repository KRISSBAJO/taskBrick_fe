import type {
  BookingFormField,
  BookingPage,
  BookingRequest,
  Meeting,
  MeetingActivity,
  MeetingAdminAnalytics,
  MeetingAdminOverview,
  MeetingAgendaItem,
  MeetingAiActionItem,
  MeetingAiState,
  MeetingAttendee,
  MeetingAvailability,
  MeetingAvailabilityWindow,
  MeetingChecklistItem,
  MeetingComment,
  MeetingConferenceProvider,
  MeetingDecision,
  MeetingIntegrationSettings,
  MeetingIntegrationStatus,
  MeetingPolicy,
  MeetingReminder,
  MeetingReminderJob,
  MeetingReminderJobStatus,
  MeetingType,
  MeetingWorkspace,
  MetaPaginatedResponse,
  PaginatedResponse,
  PublicBookingCreateResponse,
  PublicBookingPageResponse,
  PublicBookingSlotsResponse,
  Task,
} from "../api";
import {
  boundedLimit,
  openApiRequest,
  type OpenApiJsonBody,
  type OpenApiQuery,
} from "./request";

type ListMeetingTypesQuery = OpenApiQuery<"/api/v1/meetings/types", "get">;
type CreateMeetingTypePayload = OpenApiJsonBody<"/api/v1/meetings/types", "post">;
type UpdateMeetingTypePayload = OpenApiJsonBody<"/api/v1/meetings/types/{typeId}", "patch">;
type ListMeetingsQuery = OpenApiQuery<"/api/v1/meetings", "get">;
type CreateMeetingPayload = OpenApiJsonBody<"/api/v1/meetings", "post">;
type UpdateMeetingPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}", "patch">;
type CancelMeetingPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/cancel", "post">;
type UpdateMeetingIntegrationSettingsPayload = OpenApiJsonBody<"/api/v1/meetings/integrations/settings", "patch">;
type MeetingAdminOverviewQuery = OpenApiQuery<"/api/v1/meetings/admin/overview", "get">;
type MeetingAdminAnalyticsQuery = OpenApiQuery<"/api/v1/meetings/admin/analytics", "get">;
type UpdateMeetingPolicyPayload = OpenApiJsonBody<"/api/v1/meetings/admin/policy", "patch">;
type MeetingAdminReminderLogsQuery = OpenApiQuery<"/api/v1/meetings/admin/reminder-logs", "get">;
type CreateMeetingConferencePayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/conference", "post">;
type ListMeetingReminderJobsQuery = OpenApiQuery<"/api/v1/meetings/reminder-jobs", "get">;
type ProcessMeetingReminderJobsPayload = OpenApiJsonBody<"/api/v1/meetings/reminder-jobs/process", "post">;
type LinkMeetingContextPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/ai/links", "patch">;
export type MeetingAiGeneratePayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/ai/agenda", "post">;
type MeetingAiRoleSummaryPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/ai/role-summary", "post">;
type ConvertMeetingActionItemsPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/ai/action-items/convert-tasks", "post">;
type ScheduleMeetingFollowUpsPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/ai/action-items/follow-up-reminders", "post">;
type MeetingAvailabilityQuery = OpenApiQuery<"/api/v1/meetings/availability", "get">;
type CreateMeetingAvailabilityWindowPayload = OpenApiJsonBody<"/api/v1/meetings/availability/windows", "post">;
type ListBookingPagesQuery = OpenApiQuery<"/api/v1/meetings/booking/pages", "get">;
type CreateBookingPagePayload = OpenApiJsonBody<"/api/v1/meetings/booking/pages", "post">;
type UpdateBookingPagePayload = OpenApiJsonBody<"/api/v1/meetings/booking/pages/{pageId}", "patch">;
type CreateBookingFormFieldPayload = OpenApiJsonBody<"/api/v1/meetings/booking/pages/{pageId}/fields", "post">;
type UpdateBookingFormFieldPayload = OpenApiJsonBody<"/api/v1/meetings/booking/pages/{pageId}/fields/{fieldId}", "patch">;
type ListBookingRequestsQuery = OpenApiQuery<"/api/v1/meetings/booking/requests", "get">;
type PublicBookingPageQuery = OpenApiQuery<"/api/v1/booking/public/{tenantSlug}/page", "get">;
type PublicBookingSlotsQuery = OpenApiQuery<"/api/v1/booking/public/{tenantSlug}/slots", "get">;
type CreatePublicBookingPayload = OpenApiJsonBody<"/api/v1/booking/public/{tenantSlug}/book", "post">;
type CancelPublicBookingPayload = OpenApiJsonBody<"/api/v1/booking/public/cancel/{token}", "post">;
type ReschedulePublicBookingPayload = OpenApiJsonBody<"/api/v1/booking/public/reschedule/{token}", "post">;
type AddMeetingAttendeePayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/attendees", "post">;
type UpdateMeetingAttendeePayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/attendees/{attendeeId}", "patch">;
type CreateMeetingAgendaItemPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/agenda", "post">;
type UpdateMeetingAgendaItemPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/agenda/{itemId}", "patch">;
type CreateMeetingReminderPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/reminders", "post">;
type UpdateLiveMeetingNotesPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/live-notes", "patch">;
type CreateMeetingCommentPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/comments", "post">;
type UpdateMeetingCommentPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/comments/{commentId}", "patch">;
type CreateMeetingDecisionPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/decisions", "post">;
type UpdateMeetingDecisionPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/decisions/{decisionId}", "patch">;
type CreateMeetingChecklistItemPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/checklist", "post">;
type UpdateMeetingChecklistItemPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/checklist/{itemId}", "patch">;
type UpdateMeetingAttendancePayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/attendance/{attendeeId}", "patch">;
type AssignMeetingActionItemPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/action-items/assign", "post">;
type SendMeetingFollowUpPayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/follow-up", "post">;
type SyncMeetingRuntimePayload = OpenApiJsonBody<"/api/v1/meetings/{meetingId}/omoflow/sync", "post">;
export type BookingPagePayload = CreateBookingPagePayload;
export function listMeetingTypes(
  token: string,
  query: ListMeetingTypesQuery = {},
) {
  return openApiRequest<PaginatedResponse<MeetingType>, "/api/v1/meetings/types", "get">("/api/v1/meetings/types", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 100),
    },
  });
}

export function createMeetingType(token: string, payload: CreateMeetingTypePayload) {
  return openApiRequest<MeetingType, "/api/v1/meetings/types", "post">("/api/v1/meetings/types", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function updateMeetingType(token: string, typeId: string, payload: UpdateMeetingTypePayload) {
  return openApiRequest<MeetingType, "/api/v1/meetings/types/{typeId}", "patch">("/api/v1/meetings/types/{typeId}", "patch", {
    token,
    pathParams: { typeId },
    body: payload,
  });
}

export function listMeetings(
  token: string,
  query: ListMeetingsQuery = {},
) {
  return openApiRequest<PaginatedResponse<Meeting>, "/api/v1/meetings", "get">("/api/v1/meetings", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 50),
    },
  });
}

export function getMeeting(token: string, meetingId: string) {
  return openApiRequest<Meeting, "/api/v1/meetings/{meetingId}", "get">("/api/v1/meetings/{meetingId}", "get", {
    token,
    cache: "no-store",
    pathParams: { meetingId },
  });
}

export function createMeeting(token: string, payload: CreateMeetingPayload) {
  return openApiRequest<Meeting, "/api/v1/meetings", "post">("/api/v1/meetings", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function updateMeeting(token: string, meetingId: string, payload: UpdateMeetingPayload) {
  return openApiRequest<Meeting, "/api/v1/meetings/{meetingId}", "patch">("/api/v1/meetings/{meetingId}", "patch", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function cancelMeeting(token: string, meetingId: string, payload: CancelMeetingPayload = {}) {
  return openApiRequest<Meeting, "/api/v1/meetings/{meetingId}/cancel", "post">("/api/v1/meetings/{meetingId}/cancel", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function completeMeeting(token: string, meetingId: string) {
  return openApiRequest<Meeting, "/api/v1/meetings/{meetingId}/complete", "post">("/api/v1/meetings/{meetingId}/complete", "post", {
    token,
    pathParams: { meetingId },
  });
}

export function startMeeting(token: string, meetingId: string) {
  return openApiRequest<Meeting, "/api/v1/meetings/{meetingId}/start", "post">("/api/v1/meetings/{meetingId}/start", "post", {
    token,
    pathParams: { meetingId },
  });
}

export function archiveMeeting(token: string, meetingId: string) {
  return openApiRequest<Meeting, "/api/v1/meetings/{meetingId}/archive", "post">("/api/v1/meetings/{meetingId}/archive", "post", {
    token,
    pathParams: { meetingId },
  });
}

export function restoreMeeting(token: string, meetingId: string) {
  return openApiRequest<Meeting, "/api/v1/meetings/{meetingId}/restore", "post">("/api/v1/meetings/{meetingId}/restore", "post", {
    token,
    pathParams: { meetingId },
  });
}

export function getMeetingIntegrationStatus(token: string) {
  return openApiRequest<MeetingIntegrationStatus, "/api/v1/meetings/integrations/status", "get">("/api/v1/meetings/integrations/status", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function getMeetingIntegrationSettings(token: string) {
  return openApiRequest<MeetingIntegrationSettings, "/api/v1/meetings/integrations/settings", "get">("/api/v1/meetings/integrations/settings", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function updateMeetingIntegrationSettings(token: string, payload: UpdateMeetingIntegrationSettingsPayload) {
  return openApiRequest<MeetingIntegrationSettings, "/api/v1/meetings/integrations/settings", "patch">("/api/v1/meetings/integrations/settings", "patch", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function getMeetingAdminOverview(
  token: string,
  query: MeetingAdminOverviewQuery = {},
) {
  return openApiRequest<MeetingAdminOverview, "/api/v1/meetings/admin/overview", "get">("/api/v1/meetings/admin/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query,
  });
}

export function getMeetingPolicy(token: string) {
  return openApiRequest<MeetingPolicy, "/api/v1/meetings/admin/policy", "get">("/api/v1/meetings/admin/policy", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function updateMeetingPolicy(token: string, payload: UpdateMeetingPolicyPayload) {
  return openApiRequest<MeetingPolicy, "/api/v1/meetings/admin/policy", "patch">("/api/v1/meetings/admin/policy", "patch", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function getMeetingAdminAnalytics(
  token: string,
  query: MeetingAdminAnalyticsQuery = {},
) {
  return openApiRequest<MeetingAdminAnalytics, "/api/v1/meetings/admin/analytics", "get">("/api/v1/meetings/admin/analytics", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query,
  });
}

export function listMeetingAdminReminderLogs(
  token: string,
  query: MeetingAdminReminderLogsQuery = {},
) {
  return openApiRequest<MetaPaginatedResponse<MeetingReminderJob>, "/api/v1/meetings/admin/reminder-logs", "get">("/api/v1/meetings/admin/reminder-logs", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 50),
    },
  });
}

export function createMeetingConference(token: string, meetingId: string, payload: CreateMeetingConferencePayload) {
  return openApiRequest<{ meeting: Partial<Meeting>; provider: MeetingConferenceProvider; message: string }, "/api/v1/meetings/{meetingId}/conference", "post">("/api/v1/meetings/{meetingId}/conference", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function listMeetingReminderJobs(
  token: string,
  query: ListMeetingReminderJobsQuery = {},
) {
  return openApiRequest<PaginatedResponse<MeetingReminderJob>, "/api/v1/meetings/reminder-jobs", "get">("/api/v1/meetings/reminder-jobs", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 100),
    },
  });
}

export function processMeetingReminderJobs(token: string, payload: ProcessMeetingReminderJobsPayload = {}) {
  return openApiRequest<{ processed: number; sent: number; failed: number; deadLetter: number; results: Array<{ id: string; status: string; provider?: string; error?: string }> }, "/api/v1/meetings/reminder-jobs/process", "post">("/api/v1/meetings/reminder-jobs/process", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function retryMeetingReminderJob(token: string, jobId: string) {
  return openApiRequest<{ job: MeetingReminderJob; previousStatus: MeetingReminderJobStatus }, "/api/v1/meetings/reminder-jobs/{jobId}/retry", "post">("/api/v1/meetings/reminder-jobs/{jobId}/retry", "post", {
    token,
    pathParams: { jobId },
  });
}

export function getMeetingAiState(token: string, meetingId: string) {
  return openApiRequest<MeetingAiState, "/api/v1/meetings/{meetingId}/ai", "get">("/api/v1/meetings/{meetingId}/ai", "get", {
    token,
    cache: "no-store",
    pathParams: { meetingId },
  });
}

export function linkMeetingAiContext(
  token: string,
  meetingId: string,
  payload: LinkMeetingContextPayload,
) {
  return openApiRequest<MeetingAiState, "/api/v1/meetings/{meetingId}/ai/links", "patch">("/api/v1/meetings/{meetingId}/ai/links", "patch", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function generateMeetingAiAgenda(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return openApiRequest<MeetingAiState, "/api/v1/meetings/{meetingId}/ai/agenda", "post">("/api/v1/meetings/{meetingId}/ai/agenda", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function generateMeetingAiPreparationBrief(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return openApiRequest<MeetingAiState, "/api/v1/meetings/{meetingId}/ai/preparation-brief", "post">("/api/v1/meetings/{meetingId}/ai/preparation-brief", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function suggestMeetingAiAttendees(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return openApiRequest<MeetingAiState, "/api/v1/meetings/{meetingId}/ai/suggest-attendees", "post">("/api/v1/meetings/{meetingId}/ai/suggest-attendees", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function detectMeetingAiRisks(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return openApiRequest<MeetingAiState, "/api/v1/meetings/{meetingId}/ai/risk-detection", "post">("/api/v1/meetings/{meetingId}/ai/risk-detection", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function generateMeetingAiNotes(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return openApiRequest<MeetingAiState, "/api/v1/meetings/{meetingId}/ai/notes", "post">("/api/v1/meetings/{meetingId}/ai/notes", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function generateMeetingAiFollowUp(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return openApiRequest<MeetingAiState, "/api/v1/meetings/{meetingId}/ai/follow-up", "post">("/api/v1/meetings/{meetingId}/ai/follow-up", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function generateMeetingAiRoleSummary(
  token: string,
  meetingId: string,
  payload: MeetingAiRoleSummaryPayload = {},
) {
  return openApiRequest<MeetingAiState, "/api/v1/meetings/{meetingId}/ai/role-summary", "post">("/api/v1/meetings/{meetingId}/ai/role-summary", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function scoreMeetingAiEffectiveness(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return openApiRequest<MeetingAiState, "/api/v1/meetings/{meetingId}/ai/effectiveness-score", "post">("/api/v1/meetings/{meetingId}/ai/effectiveness-score", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function detectMeetingAiMissedDecisions(token: string, meetingId: string, payload: MeetingAiGeneratePayload = {}) {
  return openApiRequest<MeetingAiState, "/api/v1/meetings/{meetingId}/ai/missed-decisions", "post">("/api/v1/meetings/{meetingId}/ai/missed-decisions", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function convertMeetingAiActionItems(
  token: string,
  meetingId: string,
  payload: ConvertMeetingActionItemsPayload = {},
) {
  return openApiRequest<{ meetingId: string; converted: number; tasks: Task[]; actionItems: MeetingAiActionItem[] }, "/api/v1/meetings/{meetingId}/ai/action-items/convert-tasks", "post">("/api/v1/meetings/{meetingId}/ai/action-items/convert-tasks", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function scheduleMeetingAiFollowUpReminders(
  token: string,
  meetingId: string,
  payload: ScheduleMeetingFollowUpsPayload = {},
) {
  return openApiRequest<{ meetingId: string; created: MeetingReminder[]; actionItems: MeetingAiActionItem[] }, "/api/v1/meetings/{meetingId}/ai/action-items/follow-up-reminders", "post">("/api/v1/meetings/{meetingId}/ai/action-items/follow-up-reminders", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function listMeetingAvailability(
  token: string,
  query: MeetingAvailabilityQuery = {},
) {
  return openApiRequest<MeetingAvailability, "/api/v1/meetings/availability", "get">("/api/v1/meetings/availability", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query,
  });
}

export function createMeetingAvailabilityWindow(token: string, payload: CreateMeetingAvailabilityWindowPayload) {
  return openApiRequest<MeetingAvailabilityWindow, "/api/v1/meetings/availability/windows", "post">("/api/v1/meetings/availability/windows", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function deleteMeetingAvailabilityWindow(token: string, windowId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/meetings/availability/windows/{windowId}", "delete">("/api/v1/meetings/availability/windows/{windowId}", "delete", {
    token,
    pathParams: { windowId },
  });
}

export function listBookingPages(
  token: string,
  query: ListBookingPagesQuery = {},
) {
  return openApiRequest<PaginatedResponse<BookingPage>, "/api/v1/meetings/booking/pages", "get">("/api/v1/meetings/booking/pages", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 50),
    },
  });
}

export function createBookingPage(token: string, payload: BookingPagePayload) {
  return openApiRequest<BookingPage, "/api/v1/meetings/booking/pages", "post">("/api/v1/meetings/booking/pages", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function updateBookingPage(token: string, pageId: string, payload: UpdateBookingPagePayload) {
  return openApiRequest<BookingPage, "/api/v1/meetings/booking/pages/{pageId}", "patch">("/api/v1/meetings/booking/pages/{pageId}", "patch", {
    token,
    pathParams: { pageId },
    body: payload,
  });
}

export function createBookingFormField(token: string, pageId: string, payload: CreateBookingFormFieldPayload) {
  return openApiRequest<BookingFormField, "/api/v1/meetings/booking/pages/{pageId}/fields", "post">("/api/v1/meetings/booking/pages/{pageId}/fields", "post", {
    token,
    pathParams: { pageId },
    body: payload,
  });
}

export function updateBookingFormField(token: string, pageId: string, fieldId: string, payload: UpdateBookingFormFieldPayload) {
  return openApiRequest<BookingFormField, "/api/v1/meetings/booking/pages/{pageId}/fields/{fieldId}", "patch">("/api/v1/meetings/booking/pages/{pageId}/fields/{fieldId}", "patch", {
    token,
    pathParams: { pageId, fieldId },
    body: payload,
  });
}

export function deleteBookingFormField(token: string, pageId: string, fieldId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/meetings/booking/pages/{pageId}/fields/{fieldId}", "delete">("/api/v1/meetings/booking/pages/{pageId}/fields/{fieldId}", "delete", {
    token,
    pathParams: { pageId, fieldId },
  });
}

export function listBookingRequests(
  token: string,
  query: ListBookingRequestsQuery = {},
) {
  return openApiRequest<PaginatedResponse<BookingRequest>, "/api/v1/meetings/booking/requests", "get">("/api/v1/meetings/booking/requests", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 50),
    },
  });
}

export function resolvePublicBookingPage(tenantSlug: string, path: string) {
  const query: PublicBookingPageQuery = { path };
  return openApiRequest<PublicBookingPageResponse, "/api/v1/booking/public/{tenantSlug}/page", "get">("/api/v1/booking/public/{tenantSlug}/page", "get", {
    cache: "no-store",
    pathParams: { tenantSlug },
    query,
  });
}

export function listPublicBookingSlots(tenantSlug: string, path: string, query: { from?: string; to?: string } = {}) {
  const publicQuery: PublicBookingSlotsQuery = { path, ...query };
  return openApiRequest<PublicBookingSlotsResponse, "/api/v1/booking/public/{tenantSlug}/slots", "get">("/api/v1/booking/public/{tenantSlug}/slots", "get", {
    cache: "no-store",
    pathParams: { tenantSlug },
    query: publicQuery,
  });
}

export function createPublicBooking(tenantSlug: string, payload: CreatePublicBookingPayload) {
  return openApiRequest<PublicBookingCreateResponse, "/api/v1/booking/public/{tenantSlug}/book", "post">("/api/v1/booking/public/{tenantSlug}/book", "post", {
    pathParams: { tenantSlug },
    body: payload,
  });
}

export function cancelPublicBooking(token: string, payload: CancelPublicBookingPayload = {}) {
  return openApiRequest<BookingRequest, "/api/v1/booking/public/cancel/{token}", "post">("/api/v1/booking/public/cancel/{token}", "post", {
    pathParams: { token },
    body: payload,
  });
}

export function reschedulePublicBooking(token: string, payload: ReschedulePublicBookingPayload) {
  return openApiRequest<PublicBookingCreateResponse, "/api/v1/booking/public/reschedule/{token}", "post">("/api/v1/booking/public/reschedule/{token}", "post", {
    pathParams: { token },
    body: payload,
  });
}

export function addMeetingAttendee(
  token: string,
  meetingId: string,
  payload: AddMeetingAttendeePayload,
) {
  return openApiRequest<MeetingAttendee, "/api/v1/meetings/{meetingId}/attendees", "post">("/api/v1/meetings/{meetingId}/attendees", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function updateMeetingAttendee(
  token: string,
  meetingId: string,
  attendeeId: string,
  payload: UpdateMeetingAttendeePayload,
) {
  return openApiRequest<MeetingAttendee, "/api/v1/meetings/{meetingId}/attendees/{attendeeId}", "patch">("/api/v1/meetings/{meetingId}/attendees/{attendeeId}", "patch", {
    token,
    pathParams: { meetingId, attendeeId },
    body: payload,
  });
}

export function createMeetingAgendaItem(
  token: string,
  meetingId: string,
  payload: CreateMeetingAgendaItemPayload,
) {
  return openApiRequest<MeetingAgendaItem, "/api/v1/meetings/{meetingId}/agenda", "post">("/api/v1/meetings/{meetingId}/agenda", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function updateMeetingAgendaItem(
  token: string,
  meetingId: string,
  itemId: string,
  payload: UpdateMeetingAgendaItemPayload,
) {
  return openApiRequest<MeetingAgendaItem, "/api/v1/meetings/{meetingId}/agenda/{itemId}", "patch">("/api/v1/meetings/{meetingId}/agenda/{itemId}", "patch", {
    token,
    pathParams: { meetingId, itemId },
    body: payload,
  });
}

export function createMeetingReminder(
  token: string,
  meetingId: string,
  payload: CreateMeetingReminderPayload,
) {
  return openApiRequest<MeetingReminder, "/api/v1/meetings/{meetingId}/reminders", "post">("/api/v1/meetings/{meetingId}/reminders", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function listMeetingActivity(token: string, meetingId: string) {
  return openApiRequest<MeetingActivity[], "/api/v1/meetings/{meetingId}/activity", "get">("/api/v1/meetings/{meetingId}/activity", "get", {
    token,
    cache: "no-store",
    pathParams: { meetingId },
  });
}

export function getMeetingWorkspace(token: string, meetingId: string) {
  return openApiRequest<MeetingWorkspace, "/api/v1/meetings/{meetingId}/workspace", "get">("/api/v1/meetings/{meetingId}/workspace", "get", {
    token,
    cache: "no-store",
    pathParams: { meetingId },
  });
}

export function updateLiveMeetingNotes(
  token: string,
  meetingId: string,
  payload: UpdateLiveMeetingNotesPayload,
) {
  return openApiRequest<MeetingWorkspace["live"], "/api/v1/meetings/{meetingId}/live-notes", "patch">("/api/v1/meetings/{meetingId}/live-notes", "patch", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function createMeetingComment(token: string, meetingId: string, payload: CreateMeetingCommentPayload) {
  return openApiRequest<MeetingComment, "/api/v1/meetings/{meetingId}/comments", "post">("/api/v1/meetings/{meetingId}/comments", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function updateMeetingComment(token: string, meetingId: string, commentId: string, payload: UpdateMeetingCommentPayload) {
  return openApiRequest<MeetingComment, "/api/v1/meetings/{meetingId}/comments/{commentId}", "patch">("/api/v1/meetings/{meetingId}/comments/{commentId}", "patch", {
    token,
    pathParams: { meetingId, commentId },
    body: payload,
  });
}

export function deleteMeetingComment(token: string, meetingId: string, commentId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/meetings/{meetingId}/comments/{commentId}", "delete">("/api/v1/meetings/{meetingId}/comments/{commentId}", "delete", {
    token,
    pathParams: { meetingId, commentId },
  });
}

export function createMeetingDecision(token: string, meetingId: string, payload: CreateMeetingDecisionPayload) {
  return openApiRequest<MeetingDecision, "/api/v1/meetings/{meetingId}/decisions", "post">("/api/v1/meetings/{meetingId}/decisions", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function updateMeetingDecision(token: string, meetingId: string, decisionId: string, payload: UpdateMeetingDecisionPayload) {
  return openApiRequest<MeetingDecision, "/api/v1/meetings/{meetingId}/decisions/{decisionId}", "patch">("/api/v1/meetings/{meetingId}/decisions/{decisionId}", "patch", {
    token,
    pathParams: { meetingId, decisionId },
    body: payload,
  });
}

export function deleteMeetingDecision(token: string, meetingId: string, decisionId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/meetings/{meetingId}/decisions/{decisionId}", "delete">("/api/v1/meetings/{meetingId}/decisions/{decisionId}", "delete", {
    token,
    pathParams: { meetingId, decisionId },
  });
}

export function createMeetingChecklistItem(token: string, meetingId: string, payload: CreateMeetingChecklistItemPayload) {
  return openApiRequest<MeetingChecklistItem, "/api/v1/meetings/{meetingId}/checklist", "post">("/api/v1/meetings/{meetingId}/checklist", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function updateMeetingChecklistItem(
  token: string,
  meetingId: string,
  itemId: string,
  payload: UpdateMeetingChecklistItemPayload,
) {
  return openApiRequest<MeetingChecklistItem, "/api/v1/meetings/{meetingId}/checklist/{itemId}", "patch">("/api/v1/meetings/{meetingId}/checklist/{itemId}", "patch", {
    token,
    pathParams: { meetingId, itemId },
    body: payload,
  });
}

export function deleteMeetingChecklistItem(token: string, meetingId: string, itemId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/meetings/{meetingId}/checklist/{itemId}", "delete">("/api/v1/meetings/{meetingId}/checklist/{itemId}", "delete", {
    token,
    pathParams: { meetingId, itemId },
  });
}

export function updateMeetingAttendance(
  token: string,
  meetingId: string,
  attendeeId: string,
  payload: UpdateMeetingAttendancePayload,
) {
  return openApiRequest<MeetingAttendee, "/api/v1/meetings/{meetingId}/attendance/{attendeeId}", "patch">("/api/v1/meetings/{meetingId}/attendance/{attendeeId}", "patch", {
    token,
    pathParams: { meetingId, attendeeId },
    body: payload,
  });
}

export function markMeetingNoShow(token: string, meetingId: string) {
  return openApiRequest<Meeting, "/api/v1/meetings/{meetingId}/no-show", "post">("/api/v1/meetings/{meetingId}/no-show", "post", {
    token,
    pathParams: { meetingId },
  });
}

export function assignMeetingActionItem(token: string, meetingId: string, payload: AssignMeetingActionItemPayload) {
  return openApiRequest<{ task: Task; actionItemId?: string | null }, "/api/v1/meetings/{meetingId}/action-items/assign", "post">("/api/v1/meetings/{meetingId}/action-items/assign", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function sendMeetingFollowUp(token: string, meetingId: string, payload: SendMeetingFollowUpPayload) {
  return openApiRequest<{ queued: number; reminders: MeetingReminder[] }, "/api/v1/meetings/{meetingId}/follow-up", "post">("/api/v1/meetings/{meetingId}/follow-up", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}

export function syncMeetingOmoFlowRuntime(token: string, meetingId: string, payload: SyncMeetingRuntimePayload = {}) {
  return openApiRequest<{ meeting: Meeting; runtimeState: Record<string, unknown> }, "/api/v1/meetings/{meetingId}/omoflow/sync", "post">("/api/v1/meetings/{meetingId}/omoflow/sync", "post", {
    token,
    pathParams: { meetingId },
    body: payload,
  });
}
