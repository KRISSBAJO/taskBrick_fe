"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Archive,
  Bot,
  Brain,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
  Video,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  archiveMeeting,
  cancelMeeting,
  completeMeeting,
  createBookingPage,
  createMeeting,
  createMeetingAvailabilityWindow,
  createMeetingConference,
  createMeetingType,
  convertMeetingAiActionItems,
  detectMeetingAiMissedDecisions,
  detectMeetingAiRisks,
  generateMeetingAiAgenda,
  generateMeetingAiFollowUp,
  generateMeetingAiNotes,
  generateMeetingAiPreparationBrief,
  generateMeetingAiRoleSummary,
  getMeetingAiState,
  getMeetingIntegrationStatus,
  linkMeetingAiContext,
  listBookingPages,
  listBookingRequests,
  listMeetingAvailability,
  listMeetingReminderJobs,
  listMeetingTypes,
  listMeetings,
  listProjects,
  listSprints,
  listTeams,
  listUsers,
  processMeetingReminderJobs,
  retryMeetingReminderJob,
  restoreMeeting,
  scheduleMeetingAiFollowUpReminders,
  scoreMeetingAiEffectiveness,
  startMeeting,
  suggestMeetingAiAttendees,
  updateMeetingIntegrationSettings,
  type BookingPage,
  type BookingPageScope,
  type BookingRequest,
  type BookingRoutingStrategy,
  type Meeting,
  type MeetingAiState,
  type MeetingAvailability,
  type MeetingConferenceProvider,
  type MeetingIntegrationSettings,
  type MeetingIntegrationStatus,
  type MeetingLocationMode,
  type MeetingReminderChannel,
  type MeetingReminderJob,
  type MeetingStatus,
  type MeetingType,
  type MeetingTypeCategory,
  type Project,
  type Sprint,
  type Team,
  type TaskPriority,
  type TenantUser,
} from "@/lib/api";
import { cn } from "@/lib/cn";

type ViewMode = "meetings" | "booking" | "types" | "availability" | "integrations" | "ai";

const statusOptions: Array<{ label: string; value: MeetingStatus | "" }> = [
  { label: "All", value: "" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Live", value: "LIVE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Archived", value: "ARCHIVED" },
];

const typeCategories: MeetingTypeCategory[] = [
  "INTERNAL",
  "CLIENT",
  "SALES",
  "SUPPORT",
  "SPRINT",
  "STANDUP",
  "REVIEW",
  "INTERVIEW",
  "TRAINING",
  "CUSTOM",
];

const locationModes: MeetingLocationMode[] = ["ONLINE", "HYBRID", "IN_PERSON", "PHONE", "TBD"];
const bookingScopes: BookingPageScope[] = ["TENANT", "TEAM", "USER"];
const routingStrategies: BookingRoutingStrategy[] = ["DIRECT_HOST", "ROUND_ROBIN", "LEAST_BUSY", "PRIORITY", "DEPARTMENT"];
const conferenceProviders: MeetingConferenceProvider[] = ["MANUAL", "CUSTOM_URL", "GOOGLE_CALENDAR", "GOOGLE_MEET", "MICROSOFT_TEAMS", "ZOOM", "NONE"];
const reminderChannels: MeetingReminderChannel[] = ["IN_APP", "EMAIL", "WHATSAPP", "SMS", "WEBHOOK"];
const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function MeetingsPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [view, setView] = useState<ViewMode>("meetings");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [availability, setAvailability] = useState<MeetingAvailability>({ windows: [], blackouts: [] });
  const [bookingPages, setBookingPages] = useState<BookingPage[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<MeetingIntegrationStatus | null>(null);
  const [integrationSettings, setIntegrationSettings] = useState<MeetingIntegrationSettings | null>(null);
  const [reminderJobs, setReminderJobs] = useState<MeetingReminderJob[]>([]);
  const [meetingAiState, setMeetingAiState] = useState<MeetingAiState | null>(null);
  const [aiNotes, setAiNotes] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | "">("");
  const [projectFilter, setProjectFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [timeSnapshot, setTimeSnapshot] = useState({ nowMs: 0, todayKey: "" });
  const [defaultMeetingTimes, setDefaultMeetingTimes] = useState({ start: "", end: "" });
  const [siteOrigin, setSiteOrigin] = useState("");

  const canManageMeetings = user.permissions.includes("manage:all") || user.permissions.includes("manage:meetings");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const [
        meetingPage,
        typePage,
        projectPage,
        sprintPage,
        teamPage,
        userPage,
        availabilityResult,
        bookingPageResult,
        bookingRequestResult,
        integrationStatusResult,
        reminderJobResult,
      ] = await Promise.all([
        listMeetings(auth.accessToken, {
          limit: 100,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          projectId: projectFilter || undefined,
          includeArchived: statusFilter === "ARCHIVED",
        }),
        listMeetingTypes(auth.accessToken, { limit: 100 }),
        listProjects(auth.accessToken, { limit: 100 }),
        listSprints(auth.accessToken, { limit: 100 }),
        listTeams(auth.accessToken, { limit: 100 }),
        listUsers(auth.accessToken, { limit: 100 }),
        listMeetingAvailability(auth.accessToken),
        listBookingPages(auth.accessToken, { limit: 100 }),
        listBookingRequests(auth.accessToken, { limit: 100 }),
        getMeetingIntegrationStatus(auth.accessToken),
        listMeetingReminderJobs(auth.accessToken, { limit: 50 }),
      ]);
      setMeetings(meetingPage.data);
      setMeetingTypes(typePage.data);
      setProjects(projectPage.data);
      setSprints(sprintPage.data);
      setTeams(teamPage.data);
      setUsers(userPage.data);
      setAvailability(availabilityResult);
      setBookingPages(bookingPageResult.data);
      setBookingRequests(bookingRequestResult.data);
      setIntegrationStatus(integrationStatusResult);
      setIntegrationSettings(integrationStatusResult.settings);
      setReminderJobs(reminderJobResult.data);
      setSelectedMeetingId((current) => current || meetingPage.data[0]?.id || "");
      const loadedAt = new Date();
      setTimeSnapshot({ nowMs: loadedAt.getTime(), todayKey: loadedAt.toDateString() });
    } catch (error) {
      toast({
        title: "Meeting workspace failed",
        description: error instanceof Error ? error.message : "Unable to load meeting workspace.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, projectFilter, search, statusFilter, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMeetings(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMeetings]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const base = Date.now();
      setDefaultMeetingTimes({
        start: toDateTimeInput(new Date(base + 60 * 60_000)),
        end: toDateTimeInput(new Date(base + 90 * 60_000)),
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setSiteOrigin(window.location.origin), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const selectedMeeting = meetings.find((meeting) => meeting.id === selectedMeetingId) ?? meetings[0] ?? null;

  const loadMeetingAi = useCallback(async (meetingId: string) => {
    if (!meetingId) {
      setMeetingAiState(null);
      return;
    }
    try {
      setMeetingAiState(await getMeetingAiState(auth.accessToken, meetingId));
    } catch {
      setMeetingAiState(null);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!selectedMeeting?.id) {
        setMeetingAiState(null);
        return;
      }
      void loadMeetingAi(selectedMeeting.id);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadMeetingAi, selectedMeeting?.id]);

  const metrics = useMemo(() => {
    const now = timeSnapshot.nowMs;
    const todayKey = timeSnapshot.todayKey;
    const upcoming = meetings.filter((meeting) => meeting.status === "SCHEDULED" && new Date(meeting.startAt).getTime() >= now);
    return {
      total: meetings.length,
      upcoming: upcoming.length,
      today: todayKey ? meetings.filter((meeting) => new Date(meeting.startAt).toDateString() === todayKey).length : 0,
      live: meetings.filter((meeting) => meeting.status === "LIVE").length,
      aiReady: meetings.filter((meeting) => meeting.aiEnabled).length,
    };
  }, [meetings, timeSnapshot]);

  async function onCreateMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const startInput = String(fd.get("startAt") || "");
    const endInput = String(fd.get("endAt") || "");
    const attendeeIds = fd.getAll("attendeeIds").map(String).filter(Boolean);
    const externalAttendees = String(fd.get("externalAttendees") || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean)
      .map((email) => ({ email }));

    setSaving("meeting");
    try {
      const created = await createMeeting(auth.accessToken, {
        title: String(fd.get("title") || "").trim(),
        description: String(fd.get("description") || "").trim() || undefined,
        meetingTypeId: String(fd.get("meetingTypeId") || "") || undefined,
        projectId: String(fd.get("projectId") || "") || undefined,
        hostId: String(fd.get("hostId") || "") || undefined,
        startAt: new Date(startInput).toISOString(),
        endAt: new Date(endInput).toISOString(),
        timezone,
        locationMode: String(fd.get("locationMode") || "ONLINE") as MeetingLocationMode,
        meetingUrl: String(fd.get("meetingUrl") || "").trim() || undefined,
        visibility: "TEAM",
        attendeeIds,
        externalAttendees,
        agendaItems: String(fd.get("agenda") || "")
          .split("\n")
          .map((title) => title.trim())
          .filter(Boolean)
          .map((title, sortOrder) => ({ title, sortOrder })),
        reminderOffsets: [1440, 60, 10],
        aiEnabled: true,
      });
      form.reset();
      setShowComposer(false);
      setSelectedMeetingId(created.id);
      toast({ title: "Meeting scheduled", description: `${created.title} is ready.`, variant: "success" });
      await loadMeetings();
    } catch (error) {
      toast({
        title: "Meeting scheduling failed",
        description: error instanceof Error ? error.message : "Unable to create meeting.",
        variant: "error",
      });
    } finally {
      setSaving("");
    }
  }

  async function onCreateType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setSaving("type");
    try {
      await createMeetingType(auth.accessToken, {
        name: String(fd.get("name") || "").trim(),
        category: String(fd.get("category") || "CUSTOM") as MeetingTypeCategory,
        durationMins: Number(fd.get("durationMins") || 30),
        locationMode: String(fd.get("locationMode") || "ONLINE") as MeetingLocationMode,
        requiresApproval: fd.get("requiresApproval") === "on",
        defaultAgenda: String(fd.get("defaultAgenda") || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      form.reset();
      toast({ title: "Meeting type created", description: "The template is available for new meetings.", variant: "success" });
      await loadMeetings();
    } catch (error) {
      toast({ title: "Meeting type failed", description: error instanceof Error ? error.message : "Unable to create type.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onCreateAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setSaving("availability");
    try {
      await createMeetingAvailabilityWindow(auth.accessToken, {
        ownerId: String(fd.get("ownerId") || "") || undefined,
        scope: "USER",
        label: String(fd.get("label") || "").trim() || undefined,
        dayOfWeek: Number(fd.get("dayOfWeek") || 1),
        startTime: String(fd.get("startTime") || "09:00"),
        endTime: String(fd.get("endTime") || "17:00"),
        timezone,
        capacity: Number(fd.get("capacity") || 1),
      });
      form.reset();
      toast({ title: "Availability added", description: "Booking rules now include this window.", variant: "success" });
      await loadMeetings();
    } catch (error) {
      toast({ title: "Availability failed", description: error instanceof Error ? error.message : "Unable to save availability.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onCreateBookingPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const path = String(fd.get("path") || "").trim();
    const defaultField = String(fd.get("defaultField") || "").trim();
    setSaving("booking-page");
    try {
      await createBookingPage(auth.accessToken, {
        path,
        title: String(fd.get("title") || "").trim(),
        subtitle: String(fd.get("subtitle") || "").trim() || undefined,
        description: String(fd.get("description") || "").trim() || undefined,
        scope: String(fd.get("scope") || "TENANT") as BookingPageScope,
        routingStrategy: String(fd.get("routingStrategy") || "DIRECT_HOST") as BookingRoutingStrategy,
        meetingTypeId: String(fd.get("meetingTypeId") || "") || undefined,
        teamId: String(fd.get("teamId") || "") || undefined,
        ownerId: String(fd.get("ownerId") || "") || undefined,
        durationMins: Number(fd.get("durationMins") || 30),
        bufferBeforeMins: Number(fd.get("bufferBeforeMins") || 0),
        bufferAfterMins: Number(fd.get("bufferAfterMins") || 0),
        minNoticeMins: Number(fd.get("minNoticeMins") || 120),
        rollingWindowDays: Number(fd.get("rollingWindowDays") || 30),
        dailyLimit: Number(fd.get("dailyLimit") || 0) || undefined,
        weeklyLimit: Number(fd.get("weeklyLimit") || 0) || undefined,
        approvalRequired: fd.get("approvalRequired") === "on",
        allowCancel: fd.get("allowCancel") === "on",
        allowReschedule: fd.get("allowReschedule") === "on",
        collectCompanyName: fd.get("collectCompanyName") === "on",
        locationMode: String(fd.get("locationMode") || "ONLINE") as MeetingLocationMode,
        meetingUrl: String(fd.get("meetingUrl") || "").trim() || undefined,
        brandColor: String(fd.get("brandColor") || "").trim() || undefined,
        fields: [
          { fieldKey: "goal", label: "What should we cover?", type: "LONG_TEXT", required: true, sortOrder: 0 },
          ...(defaultField ? [{ fieldKey: "context", label: defaultField, type: "TEXT" as const, required: false, sortOrder: 1 }] : []),
        ],
      });
      form.reset();
      toast({ title: "Booking page created", description: "The public booking link is ready to share.", variant: "success" });
      await loadMeetings();
    } catch (error) {
      toast({ title: "Booking page failed", description: error instanceof Error ? error.message : "Unable to create booking page.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function runMeetingAction(meeting: Meeting, action: "start" | "cancel" | "complete" | "archive" | "restore") {
    const confirmed = await confirm({
      title: `${action[0].toUpperCase()}${action.slice(1)} meeting?`,
      description: `Apply ${action} to "${meeting.title}"?`,
      confirmLabel: action === "archive" ? "Archive meeting" : `${action[0].toUpperCase()}${action.slice(1)} meeting`,
      tone: action === "cancel" || action === "archive" ? "danger" : "warning",
    });
    if (!confirmed) return;

    setSaving(`${action}:${meeting.id}`);
    try {
      if (action === "cancel") await cancelMeeting(auth.accessToken, meeting.id, { reason: "Cancelled from meeting workspace" });
      if (action === "start") await startMeeting(auth.accessToken, meeting.id);
      if (action === "complete") await completeMeeting(auth.accessToken, meeting.id);
      if (action === "archive") await archiveMeeting(auth.accessToken, meeting.id);
      if (action === "restore") await restoreMeeting(auth.accessToken, meeting.id);
      await loadMeetings();
    } catch (error) {
      toast({ title: "Meeting action failed", description: error instanceof Error ? error.message : "Unable to update meeting.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onUpdateIntegrationSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const allowedConferenceProviders = fd.getAll("allowedConferenceProviders").map(String) as MeetingConferenceProvider[];
    const defaultReminderChannels = fd.getAll("defaultReminderChannels").map(String) as MeetingReminderChannel[];
    setSaving("meeting-integrations");
    try {
      const updated = await updateMeetingIntegrationSettings(auth.accessToken, {
        defaultConferenceProvider: String(fd.get("defaultConferenceProvider") || "MANUAL") as MeetingConferenceProvider,
        allowedConferenceProviders,
        defaultReminderChannels,
        calendarSyncEnabled: fd.get("calendarSyncEnabled") === "on",
        emailRemindersEnabled: fd.get("emailRemindersEnabled") === "on",
        whatsappRemindersEnabled: fd.get("whatsappRemindersEnabled") === "on",
        smsRemindersEnabled: fd.get("smsRemindersEnabled") === "on",
        webhookEventsEnabled: fd.get("webhookEventsEnabled") === "on",
        requireApprovedWhatsappTemplates: fd.get("requireApprovedWhatsappTemplates") === "on",
      });
      setIntegrationSettings(updated);
      toast({ title: "Meeting integrations updated", description: "Tenant provider policy has been saved.", variant: "success" });
      await loadMeetings();
    } catch (error) {
      toast({ title: "Settings update failed", description: error instanceof Error ? error.message : "Unable to save integration settings.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onCreateConference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const meetingId = String(fd.get("meetingId") || selectedMeeting?.id || "");
    if (!meetingId) return;
    setSaving("conference");
    try {
      const result = await createMeetingConference(auth.accessToken, meetingId, {
        provider: String(fd.get("provider") || "MANUAL") as MeetingConferenceProvider,
        meetingUrl: String(fd.get("meetingUrl") || "").trim() || undefined,
        calendarId: String(fd.get("calendarId") || "").trim() || undefined,
        sendUpdates: String(fd.get("sendUpdates") || "all") as "all" | "externalOnly" | "none",
      });
      toast({ title: "Conference ready", description: result.message, variant: "success" });
      form.reset();
      await loadMeetings();
    } catch (error) {
      toast({ title: "Conference failed", description: error instanceof Error ? error.message : "Unable to create conference.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onProcessReminderJobs() {
    setSaving("reminder-jobs");
    try {
      const result = await processMeetingReminderJobs(auth.accessToken, { limit: 25 });
      toast({ title: "Reminder queue processed", description: `${result.sent} sent, ${result.failed} failed, ${result.deadLetter} dead-lettered.`, variant: result.failed || result.deadLetter ? "warning" : "success" });
      await loadMeetings();
    } catch (error) {
      toast({ title: "Queue processing failed", description: error instanceof Error ? error.message : "Unable to process reminders.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onRetryReminderJob(jobId: string) {
    setSaving(`retry:${jobId}`);
    try {
      await retryMeetingReminderJob(auth.accessToken, jobId);
      toast({ title: "Reminder queued", description: "The reminder job is ready for retry.", variant: "success" });
      await loadMeetings();
    } catch (error) {
      toast({ title: "Retry failed", description: error instanceof Error ? error.message : "Unable to retry reminder.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function runMeetingAi(kind: "agenda" | "prep" | "attendees" | "risks" | "notes" | "followup" | "executive" | "pm" | "assignee" | "score" | "missed") {
    if (!selectedMeeting) return;
    const key = `ai:${kind}`;
    setSaving(key);
    const payload = {
      prompt: aiPrompt.trim() || undefined,
      notes: aiNotes.trim() || undefined,
      transcript: aiTranscript.trim() || undefined,
    };
    try {
      const result =
        kind === "agenda"
          ? await generateMeetingAiAgenda(auth.accessToken, selectedMeeting.id, payload)
          : kind === "prep"
            ? await generateMeetingAiPreparationBrief(auth.accessToken, selectedMeeting.id, payload)
            : kind === "attendees"
              ? await suggestMeetingAiAttendees(auth.accessToken, selectedMeeting.id, payload)
              : kind === "risks"
                ? await detectMeetingAiRisks(auth.accessToken, selectedMeeting.id, payload)
                : kind === "notes"
                  ? await generateMeetingAiNotes(auth.accessToken, selectedMeeting.id, payload)
                  : kind === "followup"
                    ? await generateMeetingAiFollowUp(auth.accessToken, selectedMeeting.id, payload)
                    : kind === "executive"
                      ? await generateMeetingAiRoleSummary(auth.accessToken, selectedMeeting.id, { ...payload, role: "EXECUTIVE" })
                      : kind === "pm"
                        ? await generateMeetingAiRoleSummary(auth.accessToken, selectedMeeting.id, { ...payload, role: "PROJECT_MANAGER" })
                        : kind === "assignee"
                          ? await generateMeetingAiRoleSummary(auth.accessToken, selectedMeeting.id, { ...payload, role: "ASSIGNEE" })
                          : kind === "score"
                            ? await scoreMeetingAiEffectiveness(auth.accessToken, selectedMeeting.id, payload)
                            : await detectMeetingAiMissedDecisions(auth.accessToken, selectedMeeting.id, payload);
      setMeetingAiState(result);
      toast({ title: "Meeting AI updated", description: `${humanize(kind)} artifact generated.`, variant: "success" });
    } catch (error) {
      toast({ title: "Meeting AI failed", description: error instanceof Error ? error.message : "Unable to run meeting AI.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onLinkMeetingAiContext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMeeting) return;
    const fd = new FormData(event.currentTarget);
    setSaving("ai:links");
    try {
      const result = await linkMeetingAiContext(auth.accessToken, selectedMeeting.id, {
        projectId: String(fd.get("projectId") || "") || null,
        sprintId: String(fd.get("sprintId") || "") || null,
        taskId: String(fd.get("taskId") || "") || null,
        teamId: String(fd.get("teamId") || "") || null,
        clientName: String(fd.get("clientName") || "").trim() || null,
        clientEmail: String(fd.get("clientEmail") || "").trim() || null,
        clientCompany: String(fd.get("clientCompany") || "").trim() || null,
      });
      setMeetingAiState(result);
      toast({ title: "Meeting context linked", description: "AI context now includes the selected work relationships.", variant: "success" });
      await loadMeetings();
    } catch (error) {
      toast({ title: "Context link failed", description: error instanceof Error ? error.message : "Unable to link meeting context.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onConvertMeetingAiActions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMeeting) return;
    const fd = new FormData(event.currentTarget);
    setSaving("ai:convert");
    try {
      const result = await convertMeetingAiActionItems(auth.accessToken, selectedMeeting.id, {
        defaultProjectId: String(fd.get("defaultProjectId") || "") || selectedMeeting.projectId || undefined,
        defaultSprintId: String(fd.get("defaultSprintId") || "") || selectedMeeting.sprintId || undefined,
        defaultAssigneeId: String(fd.get("defaultAssigneeId") || "") || undefined,
        defaultDueDate: String(fd.get("defaultDueDate") || "") || undefined,
        defaultPriority: String(fd.get("defaultPriority") || "MEDIUM") as TaskPriority,
        createChecklist: fd.get("createChecklist") === "on",
      });
      toast({ title: "Tasks created", description: `${result.converted} action items converted into TaskBricks tasks.`, variant: "success" });
      await loadMeetingAi(selectedMeeting.id);
      await loadMeetings();
    } catch (error) {
      toast({ title: "Conversion failed", description: error instanceof Error ? error.message : "Unable to convert action items.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onScheduleMeetingAiFollowUps() {
    if (!selectedMeeting) return;
    setSaving("ai:followups");
    try {
      const result = await scheduleMeetingAiFollowUpReminders(auth.accessToken, selectedMeeting.id, { dueOffsetMinutes: 1440 });
      toast({ title: "Follow-up reminders scheduled", description: `${result.created.length} reminder jobs created from open action items.`, variant: "success" });
      await loadMeetingAi(selectedMeeting.id);
      await loadMeetings();
    } catch (error) {
      toast({ title: "Reminder scheduling failed", description: error instanceof Error ? error.message : "Unable to schedule follow-ups.", variant: "error" });
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
      <header className="rounded-[26px] border border-line bg-white p-5 shadow-[0_18px_54px_rgba(17,17,17,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#111111] text-primary shadow-[0_18px_38px_rgba(17,17,17,0.18)]">
              <CalendarClock className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-soft">Tenant meeting engine</p>
              <h1 className="text-2xl font-black tracking-tight text-foreground">Meetings</h1>
              <p className="text-sm font-semibold text-ink-soft">Scheduling, attendees, agendas, reminders, AI-ready context, and audit-backed lifecycle.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/meetings/admin"
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-line bg-white px-4 text-sm font-black text-foreground transition hover:bg-panel-muted"
            >
              <ShieldCheck className="size-4" />
              Controls
            </Link>
            <button
              type="button"
              onClick={() => void loadMeetings()}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-line bg-white px-4 text-sm font-black text-foreground transition hover:bg-panel-muted"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Refresh
            </button>
            {canManageMeetings ? (
              <button
                type="button"
                onClick={() => setShowComposer((open) => !open)}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-[#111111] shadow-[0_18px_38px_rgba(255,212,0,0.24)]"
              >
                <Plus className="size-4" />
                New meeting
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric icon={CalendarClock} label="Visible" value={metrics.total} tone="#111111" />
          <Metric icon={Clock3} label="Upcoming" value={metrics.upcoming} tone="#d89b00" />
          <Metric icon={Zap} label="Today" value={metrics.today} tone="#2563eb" />
          <Metric icon={Video} label="Live" value={metrics.live} tone="#059669" />
          <Metric icon={Bot} label="AI-ready" value={metrics.aiReady} tone="#6d5dd3" />
        </div>
      </header>

      <div className="flex flex-wrap gap-2 rounded-[24px] border border-line bg-white p-2 shadow-sm">
        <ViewButton active={view === "meetings"} icon={CalendarClock} label="Schedule" onClick={() => setView("meetings")} />
        <ViewButton active={view === "booking"} icon={Route} label="Booking" onClick={() => setView("booking")} />
        <ViewButton active={view === "types"} icon={Settings2} label="Meeting types" onClick={() => setView("types")} />
        <ViewButton active={view === "availability"} icon={ShieldCheck} label="Availability" onClick={() => setView("availability")} />
        <ViewButton active={view === "ai"} icon={Brain} label="AI automation" onClick={() => setView("ai")} />
        <ViewButton active={view === "integrations"} icon={Zap} label="Integrations" onClick={() => setView("integrations")} />
      </div>

      {showComposer && canManageMeetings ? (
        <MeetingComposer
          loading={saving === "meeting"}
          defaultTimes={defaultMeetingTimes}
          meetingTypes={meetingTypes}
          onSubmit={onCreateMeeting}
          projects={projects}
          users={users}
        />
      ) : null}

      {view === "meetings" ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="overflow-hidden rounded-[26px] border border-line bg-white shadow-[0_16px_48px_rgba(17,17,17,0.055)]">
            <div className="grid gap-3 border-b border-line p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, agenda, location..."
                className={fieldClass}
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as MeetingStatus | "")} className={fieldClass}>
                {statusOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
              </select>
              <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className={fieldClass}>
                <option value="">All projects</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.key} - {project.name}</option>)}
              </select>
            </div>

            <div className="min-h-[520px]">
              {loading ? <LoadingState /> : null}
              {!loading && meetings.length === 0 ? <EmptyState text="No meetings match this view." /> : null}
              {!loading && meetings.map((meeting) => (
                <button
                  key={meeting.id}
                  type="button"
                  onClick={() => setSelectedMeetingId(meeting.id)}
                  className={cn(
                    "grid w-full gap-3 border-b border-line px-5 py-4 text-left transition hover:bg-[#fbfaf6] lg:grid-cols-[minmax(0,1fr)_170px_130px]",
                    selectedMeeting?.id === meeting.id && "bg-[#fff9d8]",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusDot status={meeting.status} />
                      <p className="truncate text-sm font-black text-foreground">{meeting.title}</p>
                      {meeting.aiEnabled ? <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-700"><Sparkles className="size-3" />AI</span> : null}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-ink-soft">{meeting.description || meeting.project?.name || "No description yet"}</p>
                  </div>
                  <div className="text-xs font-bold text-ink-soft">
                    <p className="text-foreground">{dateFormatter.format(new Date(meeting.startAt))}</p>
                    <p>{durationText(meeting.startAt, meeting.endAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-ink-soft">
                    <UsersRound className="size-4" />
                    {meeting._count?.attendees ?? meeting.attendees?.length ?? 0} people
                  </div>
                </button>
              ))}
            </div>
          </div>

          <MeetingDetailPanel
            canManage={canManageMeetings}
            meeting={selectedMeeting}
            onAction={runMeetingAction}
            saving={saving}
          />
        </section>
      ) : null}

      {view === "booking" ? (
        <BookingPagesView
          bookingPages={bookingPages}
          bookingRequests={bookingRequests}
          canManage={canManageMeetings}
          loading={saving === "booking-page"}
          meetingTypes={meetingTypes}
          onCreate={onCreateBookingPage}
          origin={siteOrigin}
          teams={teams}
          users={users}
        />
      ) : null}

      {view === "types" ? (
        <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
          <FormPanel title="Create meeting type" eyebrow="Reusable scheduling template">
            <form className="space-y-3" onSubmit={onCreateType}>
              <input name="name" required placeholder="Discovery call" className={fieldClass} />
              <div className="grid gap-3 sm:grid-cols-2">
                <select name="category" className={fieldClass} defaultValue="CUSTOM">{typeCategories.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select>
                <input name="durationMins" type="number" min={5} max={1440} defaultValue={30} className={fieldClass} />
              </div>
              <select name="locationMode" className={fieldClass} defaultValue="ONLINE">{locationModes.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select>
              <textarea name="defaultAgenda" placeholder="Agenda items, one per line" className={`${fieldClass} min-h-28 resize-none py-3`} />
              <label className="flex items-center gap-2 text-sm font-bold text-foreground">
                <input name="requiresApproval" type="checkbox" className="size-4 accent-primary" />
                Require approval before confirmation
              </label>
              <button disabled={saving === "type"} className="tb-yellow-button h-11 w-full rounded-2xl text-sm font-black">
                {saving === "type" ? "Saving..." : "Create type"}
              </button>
            </form>
          </FormPanel>
          <div className="overflow-hidden rounded-[26px] border border-line bg-white shadow-sm">
            <SectionTitle title="Meeting type catalog" eyebrow={`${meetingTypes.length} templates`} />
            <div className="divide-y divide-line">
              {meetingTypes.map((type) => (
                <div key={type.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_160px_120px]">
                  <div>
                    <p className="font-black text-foreground">{type.name}</p>
                    <p className="text-xs font-bold text-ink-soft">{humanize(type.category)} - {type.durationMins} mins - {humanize(type.locationMode)}</p>
                  </div>
                  <span className="text-xs font-black text-ink-soft">{type.requiresApproval ? "Approval required" : "Instant booking"}</span>
                  <span className={cn("text-xs font-black", type.isActive ? "text-emerald-700" : "text-ink-soft")}>{type.isActive ? "Active" : "Disabled"}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {view === "availability" ? (
        <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
          <FormPanel title="Add availability" eyebrow="Host booking windows">
            <form className="space-y-3" onSubmit={onCreateAvailability}>
              <input name="label" placeholder="Primary working hours" className={fieldClass} />
              <select name="ownerId" className={fieldClass} defaultValue={user.id}>
                {users.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName} - {member.email}</option>)}
              </select>
              <select name="dayOfWeek" className={fieldClass} defaultValue={1}>
                {weekdayLabels.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
              <div className="grid gap-3 sm:grid-cols-3">
                <input name="startTime" type="time" defaultValue="09:00" className={fieldClass} />
                <input name="endTime" type="time" defaultValue="17:00" className={fieldClass} />
                <input name="capacity" type="number" min={1} max={100} defaultValue={1} className={fieldClass} />
              </div>
              <button disabled={saving === "availability"} className="tb-yellow-button h-11 w-full rounded-2xl text-sm font-black">
                {saving === "availability" ? "Saving..." : "Add window"}
              </button>
            </form>
          </FormPanel>
          <div className="overflow-hidden rounded-[26px] border border-line bg-white shadow-sm">
            <SectionTitle title="Availability rules" eyebrow={`${availability.windows.length} windows - ${availability.blackouts.length} blackouts`} />
            <div className="divide-y divide-line">
              {availability.windows.map((window) => (
                <div key={window.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_180px_120px]">
                  <div>
                    <p className="font-black text-foreground">{window.label || weekdayLabels[window.dayOfWeek]}</p>
                    <p className="text-xs font-bold text-ink-soft">{weekdayLabels[window.dayOfWeek]} - {window.timezone}</p>
                  </div>
                  <span className="text-xs font-black text-foreground">{window.startTime} - {window.endTime}</span>
                  <span className="text-xs font-black text-ink-soft">Capacity {window.capacity}</span>
                </div>
              ))}
              {availability.windows.length === 0 ? <EmptyState text="No availability windows have been configured yet." /> : null}
            </div>
          </div>
        </section>
      ) : null}

      {view === "ai" ? (
        <MeetingAiAutomationView
          aiNotes={aiNotes}
          aiPrompt={aiPrompt}
          aiState={meetingAiState}
          aiTranscript={aiTranscript}
          canManage={canManageMeetings}
          onConvertActions={onConvertMeetingAiActions}
          onLinkContext={onLinkMeetingAiContext}
          onRun={runMeetingAi}
          onScheduleFollowUps={onScheduleMeetingAiFollowUps}
          projects={projects}
          saving={saving}
          selectedMeeting={selectedMeeting}
          setAiNotes={setAiNotes}
          setAiPrompt={setAiPrompt}
          setAiTranscript={setAiTranscript}
          sprints={sprints}
          teams={teams}
          users={users}
        />
      ) : null}

      {view === "integrations" ? (
        <MeetingIntegrationsView
          canManage={canManageMeetings}
          integrationStatus={integrationStatus}
          loading={saving === "meeting-integrations" || saving === "conference" || saving === "reminder-jobs"}
          meetings={meetings}
          onCreateConference={onCreateConference}
          onProcessReminderJobs={onProcessReminderJobs}
          onRetryReminderJob={onRetryReminderJob}
          onUpdateSettings={onUpdateIntegrationSettings}
          reminderJobs={reminderJobs}
          saving={saving}
          selectedMeetingId={selectedMeeting?.id ?? ""}
          settings={integrationSettings}
        />
      ) : null}
    </div>
  );
}

function MeetingComposer({
  defaultTimes,
  loading,
  meetingTypes,
  onSubmit,
  projects,
  users,
}: {
  defaultTimes: { start: string; end: string };
  loading: boolean;
  meetingTypes: MeetingType[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  projects: Project[];
  users: TenantUser[];
}) {
  return (
    <section className="rounded-[26px] border border-line bg-white p-5 shadow-[0_18px_54px_rgba(17,17,17,0.06)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-[#111111]"><Plus className="size-5" /></span>
        <div>
          <h2 className="text-lg font-black text-foreground">Schedule a meeting</h2>
          <p className="text-xs font-semibold text-ink-soft">Conflict checks run on host and attendee calendars before save.</p>
        </div>
      </div>
      <form className="grid gap-3 lg:grid-cols-4" onSubmit={onSubmit}>
        <input name="title" required placeholder="Meeting title" className={`${fieldClass} lg:col-span-2`} />
        <select name="meetingTypeId" className={fieldClass}>
          <option value="">No template</option>
          {meetingTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
        <select name="projectId" className={fieldClass}>
          <option value="">No project link</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.key} - {project.name}</option>)}
        </select>
        <input name="startAt" type="datetime-local" defaultValue={defaultTimes.start} className={fieldClass} />
        <input name="endAt" type="datetime-local" defaultValue={defaultTimes.end} className={fieldClass} />
        <select name="hostId" className={fieldClass}>
          <option value="">Me as host</option>
          {users.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}
        </select>
        <select name="locationMode" className={fieldClass} defaultValue="ONLINE">
          {locationModes.map((mode) => <option key={mode} value={mode}>{humanize(mode)}</option>)}
        </select>
        <select name="attendeeIds" multiple className={`${fieldClass} min-h-28 lg:col-span-2`}>
          {users.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName} - {member.email}</option>)}
        </select>
        <div className="grid gap-3 lg:col-span-2">
          <input name="meetingUrl" placeholder="Online meeting link, Google Meet, Teams, Zoom..." className={fieldClass} />
          <input name="externalAttendees" placeholder="External emails, comma separated" className={fieldClass} />
        </div>
        <textarea name="description" placeholder="Context or preparation notes" className={`${fieldClass} min-h-24 resize-none py-3 lg:col-span-2`} />
        <textarea name="agenda" placeholder="Agenda items, one per line" className={`${fieldClass} min-h-24 resize-none py-3 lg:col-span-2`} />
        <button disabled={loading} className="tb-yellow-button h-11 rounded-2xl text-sm font-black lg:col-span-4">
          {loading ? "Scheduling..." : "Schedule meeting"}
        </button>
      </form>
    </section>
  );
}

function BookingPagesView({
  bookingPages,
  bookingRequests,
  canManage,
  loading,
  meetingTypes,
  onCreate,
  origin,
  teams,
  users,
}: {
  bookingPages: BookingPage[];
  bookingRequests: BookingRequest[];
  canManage: boolean;
  loading: boolean;
  meetingTypes: MeetingType[];
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  origin: string;
  teams: Team[];
  users: TenantUser[];
}) {
  const activePages = bookingPages.filter((page) => page.isActive);
  const pendingRequests = bookingRequests.filter((request) => request.status === "PENDING_APPROVAL");

  return (
    <section className="grid gap-4 xl:grid-cols-[480px_minmax(0,1fr)]">
      <div className="rounded-[26px] border border-line bg-white p-5 shadow-[0_18px_54px_rgba(17,17,17,0.06)]">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#111111] text-primary">
            <Route className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">Public booking engine</p>
            <h2 className="text-xl font-black text-foreground">Create a bookable experience</h2>
            <p className="mt-1 text-sm font-semibold text-ink-soft">Branded pages, smart host routing, intake questions, buffers, approval flow, and self-service changes.</p>
          </div>
        </div>

        {canManage ? (
          <form className="space-y-3" onSubmit={onCreate}>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="title" required placeholder="Discovery call" className={fieldClass} />
              <input name="path" required placeholder="discovery-call or team/support" className={fieldClass} />
            </div>
            <input name="subtitle" placeholder="For teams evaluating TaskBricks" className={fieldClass} />
            <textarea name="description" placeholder="Short public description" className={`${fieldClass} min-h-20 resize-none py-3`} />

            <div className="grid gap-3 sm:grid-cols-2">
              <select name="scope" className={fieldClass} defaultValue="TENANT">
                {bookingScopes.map((scope) => <option key={scope} value={scope}>{humanize(scope)}</option>)}
              </select>
              <select name="routingStrategy" className={fieldClass} defaultValue="ROUND_ROBIN">
                {routingStrategies.map((strategy) => <option key={strategy} value={strategy}>{humanize(strategy)}</option>)}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <select name="meetingTypeId" className={fieldClass}>
                <option value="">No template</option>
                {meetingTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
              <select name="teamId" className={fieldClass}>
                <option value="">Any team</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
              <select name="ownerId" className={fieldClass}>
                <option value="">Auto host</option>
                {users.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <input name="durationMins" type="number" min={5} max={1440} defaultValue={30} className={fieldClass} title="Duration" />
              <input name="minNoticeMins" type="number" min={0} max={10080} defaultValue={120} className={fieldClass} title="Minimum notice" />
              <input name="dailyLimit" type="number" min={1} max={200} placeholder="Daily cap" className={fieldClass} />
              <input name="weeklyLimit" type="number" min={1} max={1000} placeholder="Weekly cap" className={fieldClass} />
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <input name="bufferBeforeMins" type="number" min={0} max={240} defaultValue={10} className={fieldClass} title="Buffer before" />
              <input name="bufferAfterMins" type="number" min={0} max={240} defaultValue={10} className={fieldClass} title="Buffer after" />
              <input name="rollingWindowDays" type="number" min={1} max={365} defaultValue={30} className={fieldClass} title="Rolling window" />
              <select name="locationMode" className={fieldClass} defaultValue="ONLINE">
                {locationModes.map((mode) => <option key={mode} value={mode}>{humanize(mode)}</option>)}
              </select>
            </div>

            <input name="meetingUrl" placeholder="Default online link, Google Meet, Teams, Zoom..." className={fieldClass} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="brandColor" placeholder="#ffd400" className={fieldClass} />
              <input name="defaultField" placeholder="Extra intake question label" className={fieldClass} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle name="approvalRequired" label="Approval required" />
              <Toggle name="collectCompanyName" label="Collect company" defaultChecked />
              <Toggle name="allowCancel" label="Self-service cancel" defaultChecked />
              <Toggle name="allowReschedule" label="Self-service reschedule" defaultChecked />
            </div>

            <button disabled={loading} className="tb-yellow-button h-11 w-full rounded-2xl text-sm font-black">
              {loading ? "Creating booking page..." : "Create booking page"}
            </button>
          </form>
        ) : (
          <EmptyState text="You do not have permission to manage booking pages." />
        )}
      </div>

      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric icon={Route} label="Active pages" value={activePages.length} tone="#111111" />
          <Metric icon={Clock3} label="Requests" value={bookingRequests.length} tone="#d89b00" />
          <Metric icon={ShieldCheck} label="Pending approval" value={pendingRequests.length} tone="#6d5dd3" />
        </div>

        <div className="overflow-hidden rounded-[26px] border border-line bg-white shadow-sm">
          <SectionTitle title="Public booking links" eyebrow={`${bookingPages.length} configured`} />
          <div className="divide-y divide-line">
            {bookingPages.map((page) => {
              const href = `${origin}/book/${page.tenant?.slug ?? "tenant"}/${page.path}`;
              return (
                <div key={page.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_190px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-black text-foreground">{page.title}</p>
                      <span className={cn("rounded-full px-2 py-1 text-[10px] font-black", page.isActive ? "bg-emerald-50 text-emerald-700" : "bg-panel-muted text-ink-soft")}>
                        {page.isActive ? "Live" : "Paused"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-bold text-ink-soft">{href}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill>{humanize(page.routingStrategy)}</Pill>
                      <Pill>{page.durationMins ?? page.meetingType?.durationMins ?? 30} mins</Pill>
                      <Pill>{page.approvalRequired || page.meetingType?.requiresApproval ? "Approval" : "Instant"}</Pill>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard?.writeText(href)}
                      className="h-10 rounded-2xl border border-line bg-white px-3 text-xs font-black text-foreground transition hover:bg-panel-muted"
                    >
                      Copy
                    </button>
                    <a href={href} target="_blank" rel="noreferrer" className="h-10 rounded-2xl bg-[#111111] px-3 py-3 text-xs font-black text-white">
                      Open
                    </a>
                  </div>
                </div>
              );
            })}
            {bookingPages.length === 0 ? <EmptyState text="No public booking pages yet. Create the first one from the form." /> : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-[26px] border border-line bg-white shadow-sm">
          <SectionTitle title="Recent booking requests" eyebrow="Guest flow" />
          <div className="divide-y divide-line">
            {bookingRequests.slice(0, 8).map((request) => (
              <div key={request.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px_120px]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-foreground">{request.guestName}</p>
                  <p className="truncate text-xs font-bold text-ink-soft">{request.guestEmail} - {request.page?.title ?? request.title}</p>
                </div>
                <p className="text-xs font-black text-foreground">{dateFormatter.format(new Date(request.startAt))}</p>
                <span className="text-xs font-black text-ink-soft">{humanize(request.status)}</span>
              </div>
            ))}
            {bookingRequests.length === 0 ? <EmptyState text="No guest bookings have been submitted yet." /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function MeetingAiAutomationView({
  aiNotes,
  aiPrompt,
  aiState,
  aiTranscript,
  canManage,
  onConvertActions,
  onLinkContext,
  onRun,
  onScheduleFollowUps,
  projects,
  saving,
  selectedMeeting,
  setAiNotes,
  setAiPrompt,
  setAiTranscript,
  sprints,
  teams,
  users,
}: {
  aiNotes: string;
  aiPrompt: string;
  aiState: MeetingAiState | null;
  aiTranscript: string;
  canManage: boolean;
  onConvertActions: (event: FormEvent<HTMLFormElement>) => void;
  onLinkContext: (event: FormEvent<HTMLFormElement>) => void;
  onRun: (kind: "agenda" | "prep" | "attendees" | "risks" | "notes" | "followup" | "executive" | "pm" | "assignee" | "score" | "missed") => void;
  onScheduleFollowUps: () => void;
  projects: Project[];
  saving: string;
  selectedMeeting: Meeting | null;
  setAiNotes: (value: string) => void;
  setAiPrompt: (value: string) => void;
  setAiTranscript: (value: string) => void;
  sprints: Sprint[];
  teams: Team[];
  users: TenantUser[];
}) {
  if (!selectedMeeting) {
    return <div className="rounded-[26px] border border-dashed border-line bg-white p-10 text-center text-sm font-bold text-ink-soft">Select or create a meeting before running AI automation.</div>;
  }

  const state = aiState?.summary ?? selectedMeeting.aiSummary ?? {};
  const actionItems = aiState?.actionItems ?? [];
  const health = aiState?.health;
  const agenda = recordValue(state.agenda);
  const prep = recordValue(state.preparationBrief);
  const notes = recordValue(state.notes);
  const risk = recordValue(state.riskDetection);
  const followUp = recordValue(state.followUp);
  const score = recordValue(state.effectivenessScore);
  const missed = recordValue(state.missedDecisions);
  const roleSummaries = recordValue(state.roleSummaries);
  const visibleSprints = selectedMeeting.projectId ? sprints.filter((sprint) => sprint.projectId === selectedMeeting.projectId) : sprints;

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
      <div className="grid gap-4">
        <div className="rounded-[26px] border border-line bg-white p-5 shadow-[0_18px_54px_rgba(17,17,17,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-soft">TaskBricks meeting intelligence</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">AI automation for {selectedMeeting.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink-soft">
                Build agendas, prep briefs, notes, follow-ups, role summaries, decision checks, and real TaskBricks tasks from one meeting context.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[330px]">
              <MiniMetric label="Open actions" value={health?.openActionItems ?? actionItems.filter((item) => item.status !== "CONVERTED").length} tone="#d89b00" />
              <MiniMetric label="Converted" value={health?.convertedActionItems ?? actionItems.filter((item) => item.convertedTaskId).length} tone="#059669" />
              <MiniMetric label="Score" value={health?.effectivenessScore ?? numberFrom(score.score) ?? 0} tone="#6d5dd3" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <FormPanel title="AI command center" eyebrow="Generate and refine">
            <div className="grid gap-3">
              <input value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="Optional instruction, e.g. focus on blockers and customer handoff" className={fieldClass} />
              <textarea value={aiNotes} onChange={(event) => setAiNotes(event.target.value)} placeholder="Paste meeting notes or rough bullets" className={`${fieldClass} min-h-28 resize-none py-3`} />
              <textarea value={aiTranscript} onChange={(event) => setAiTranscript(event.target.value)} placeholder="Paste transcript for notes, missed decisions, and action items" className={`${fieldClass} min-h-32 resize-none py-3`} />
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <AiRunButton icon={ClipboardList} label="Agenda" loading={saving === "ai:agenda"} onClick={() => onRun("agenda")} />
                <AiRunButton icon={FileText} label="Prep brief" loading={saving === "ai:prep"} onClick={() => onRun("prep")} />
                <AiRunButton icon={UsersRound} label="Attendees" loading={saving === "ai:attendees"} onClick={() => onRun("attendees")} />
                <AiRunButton icon={ShieldCheck} label="Risks" loading={saving === "ai:risks"} onClick={() => onRun("risks")} />
                <AiRunButton icon={FileText} label="Notes" loading={saving === "ai:notes"} onClick={() => onRun("notes")} />
                <AiRunButton icon={Send} label="Follow-up" loading={saving === "ai:followup"} onClick={() => onRun("followup")} />
                <AiRunButton icon={Target} label="Score" loading={saving === "ai:score"} onClick={() => onRun("score")} />
                <AiRunButton icon={Sparkles} label="Missed decisions" loading={saving === "ai:missed"} onClick={() => onRun("missed")} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <AiRunButton icon={Bot} label="Executive" loading={saving === "ai:executive"} onClick={() => onRun("executive")} />
                <AiRunButton icon={Bot} label="PM" loading={saving === "ai:pm"} onClick={() => onRun("pm")} />
                <AiRunButton icon={Bot} label="Assignee" loading={saving === "ai:assignee"} onClick={() => onRun("assignee")} />
              </div>
            </div>
          </FormPanel>

          <FormPanel title="Linked context" eyebrow="Project, sprint, task, client">
            <form className="space-y-3" onSubmit={onLinkContext}>
              <select name="projectId" defaultValue={selectedMeeting.projectId ?? ""} className={fieldClass} disabled={!canManage}>
                <option value="">No project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.key} - {project.name}</option>)}
              </select>
              <select name="sprintId" defaultValue={selectedMeeting.sprintId ?? ""} className={fieldClass} disabled={!canManage}>
                <option value="">No sprint</option>
                {visibleSprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
              </select>
              <select name="teamId" defaultValue={selectedMeeting.teamId ?? ""} className={fieldClass} disabled={!canManage}>
                <option value="">No team</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
              <input name="taskId" defaultValue={selectedMeeting.taskId ?? ""} placeholder="Task ID to link directly" className={fieldClass} disabled={!canManage} />
              <input name="clientName" defaultValue={selectedMeeting.clientName ?? ""} placeholder="Client contact name" className={fieldClass} disabled={!canManage} />
              <input name="clientEmail" defaultValue={selectedMeeting.clientEmail ?? ""} placeholder="Client email" className={fieldClass} disabled={!canManage} />
              <input name="clientCompany" defaultValue={selectedMeeting.clientCompany ?? ""} placeholder="Client company" className={fieldClass} disabled={!canManage} />
              <button disabled={!canManage || saving === "ai:links"} className="h-11 w-full rounded-2xl bg-[#111111] text-sm font-black text-white disabled:opacity-50">
                {saving === "ai:links" ? "Saving links..." : "Save context links"}
              </button>
            </form>
          </FormPanel>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <AiArtifactPanel title="Agenda" eyebrow="Planned conversation" empty="Run Agenda to generate an outcome-led agenda.">
            <ArtifactList items={arrayValue(agenda.items)} titleKey="title" bodyKey="objective" />
            <TextChips items={stringArray(agenda.expectedOutcomes)} />
          </AiArtifactPanel>
          <AiArtifactPanel title="Preparation brief" eyebrow="Before the call" empty="Run Prep brief to generate attendee preparation.">
            <p className="text-sm font-semibold leading-6 text-ink-soft">{stringValue(prep.brief)}</p>
            <ArtifactList items={arrayValue(prep.risks)} />
            <TextChips items={stringArray(prep.questions)} />
          </AiArtifactPanel>
          <AiArtifactPanel title="Notes and decisions" eyebrow="Transcript intelligence" empty="Paste notes/transcript and run Notes.">
            <p className="text-sm font-semibold leading-6 text-ink-soft">{stringValue(notes.summary)}</p>
            <ArtifactList items={arrayValue(notes.decisions)} titleKey="title" bodyKey="evidence" />
            <TextChips items={stringArray(notes.openQuestions)} />
          </AiArtifactPanel>
          <AiArtifactPanel title="Risk and missed decisions" eyebrow="Control checks" empty="Run Risks or Missed decisions to populate this panel.">
            <ArtifactList items={[...arrayValue(risk.deliveryRisks), ...arrayValue(risk.decisionRisks), ...arrayValue(missed.missedDecisions)]} titleKey="title" bodyKey="evidence" />
          </AiArtifactPanel>
        </div>

        <AiArtifactPanel title="Action items to TaskBricks tasks" eyebrow={`${actionItems.length} AI action items`} empty="Generate Notes first to extract action items.">
          <div className="grid gap-3">
            {actionItems.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-2xl border border-line bg-[#fbfaf6] p-4 lg:grid-cols-[minmax(0,1fr)_150px]">
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs font-bold text-ink-soft">{item.ownerEmail || item.ownerId || "No owner"} {item.dueDate ? `- due ${item.dueDate}` : "- no due date"}</p>
                  {item.description ? <p className="mt-2 text-xs font-semibold text-ink-soft">{item.description}</p> : null}
                </div>
                <div className="text-right">
                  <StatusLabel text={item.convertedTaskKey ? item.convertedTaskKey : item.status ?? "OPEN"} tone={item.convertedTaskKey ? "#059669" : "#d89b00"} />
                </div>
              </div>
            ))}
          </div>
          <form className="mt-4 grid gap-3 rounded-2xl border border-line bg-white p-4 lg:grid-cols-5" onSubmit={onConvertActions}>
            <select name="defaultProjectId" defaultValue={selectedMeeting.projectId ?? ""} className={fieldClass}>
              <option value="">Project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.key}</option>)}
            </select>
            <select name="defaultSprintId" defaultValue={selectedMeeting.sprintId ?? ""} className={fieldClass}>
              <option value="">Sprint</option>
              {visibleSprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
            </select>
            <select name="defaultAssigneeId" className={fieldClass}>
              <option value="">Assignee</option>
              {users.map((member) => <option key={member.id} value={member.id}>{member.firstName || member.email}</option>)}
            </select>
            <input name="defaultDueDate" type="date" className={fieldClass} />
            <select name="defaultPriority" defaultValue="MEDIUM" className={fieldClass}>
              {(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"] as TaskPriority[]).map((priority) => <option key={priority} value={priority}>{humanize(priority)}</option>)}
            </select>
            <label className="flex h-11 items-center gap-2 rounded-2xl border border-line bg-[#fbfaf6] px-3 text-sm font-black text-foreground lg:col-span-2">
              <input name="createChecklist" type="checkbox" className="size-4 accent-primary" defaultChecked />
              Add follow-up checklist
            </label>
            <button disabled={!canManage || saving === "ai:convert"} className="tb-yellow-button h-11 rounded-2xl text-sm font-black lg:col-span-2 disabled:opacity-50">
              {saving === "ai:convert" ? "Converting..." : "Convert open items"}
            </button>
            <button type="button" disabled={!canManage || saving === "ai:followups"} onClick={onScheduleFollowUps} className="h-11 rounded-2xl border border-line bg-white text-sm font-black text-foreground transition hover:bg-panel-muted disabled:opacity-50">
              {saving === "ai:followups" ? "Scheduling..." : "Schedule reminders"}
            </button>
          </form>
        </AiArtifactPanel>
      </div>

      <aside className="grid content-start gap-4">
        <AiArtifactPanel title="Follow-up draft" eyebrow="Send-ready summary" empty="Run Follow-up after notes are generated.">
          <p className="text-sm font-black text-foreground">{stringValue(followUp.subject)}</p>
          <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#fbfaf6] p-4 text-xs font-semibold leading-5 text-ink-soft">{stringValue(followUp.body)}</pre>
        </AiArtifactPanel>

        <AiArtifactPanel title="Role summaries" eyebrow="Executive / PM / Assignee" empty="Run a role summary to create focused views.">
          <div className="space-y-3">
            {Object.entries(roleSummaries).map(([key, value]) => {
              const record = recordValue(value);
              return (
                <div key={key} className="rounded-2xl border border-line bg-[#fbfaf6] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-soft">{humanize(key)}</p>
                  <p className="mt-1 text-sm font-black text-foreground">{stringValue(record.headline)}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-ink-soft">{stringValue(record.summary)}</p>
                </div>
              );
            })}
          </div>
        </AiArtifactPanel>

        <AiArtifactPanel title="Effectiveness" eyebrow="Meeting quality" empty="Run Score to evaluate follow-through.">
          <div className="rounded-[24px] bg-[#111111] p-5 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{stringValue(score.grade) || "Score"}</p>
            <p className="mt-2 text-5xl font-black text-primary">{numberFrom(score.score) ?? 0}</p>
            <TextChips items={[...stringArray(score.strengths), ...stringArray(score.weaknesses), ...stringArray(score.improvements)]} dark />
          </div>
        </AiArtifactPanel>
      </aside>
    </section>
  );
}

function MeetingIntegrationsView({
  canManage,
  integrationStatus,
  loading,
  meetings,
  onCreateConference,
  onProcessReminderJobs,
  onRetryReminderJob,
  onUpdateSettings,
  reminderJobs,
  saving,
  selectedMeetingId,
  settings,
}: {
  canManage: boolean;
  integrationStatus: MeetingIntegrationStatus | null;
  loading: boolean;
  meetings: Meeting[];
  onCreateConference: (event: FormEvent<HTMLFormElement>) => void;
  onProcessReminderJobs: () => void;
  onRetryReminderJob: (jobId: string) => void;
  onUpdateSettings: (event: FormEvent<HTMLFormElement>) => void;
  reminderJobs: MeetingReminderJob[];
  saving: string;
  selectedMeetingId: string;
  settings: MeetingIntegrationSettings | null;
}) {
  const queue = integrationStatus?.queue ?? {};
  const failedJobs = reminderJobs.filter((job) => job.status === "FAILED" || job.status === "DEAD_LETTER");

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
      <div className="grid gap-4">
        <div className="rounded-[26px] border border-line bg-white p-5 shadow-[0_18px_54px_rgba(17,17,17,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-soft">Provider control plane</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Integrations and reminders</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink-soft">
                Calendar conferencing, manual meeting links, WhatsApp and email reminders, webhook events, and retry-safe delivery jobs for tenant meetings.
              </p>
            </div>
            <button
              type="button"
              disabled={!canManage || loading}
              onClick={onProcessReminderJobs}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-[#111111] shadow-[0_18px_38px_rgba(255,212,0,0.22)] disabled:opacity-50"
            >
              <RefreshCw className={cn("size-4", saving === "reminder-jobs" && "animate-spin")} />
              Process due reminders
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Video} label="Connected providers" value={Object.values(integrationStatus?.providers ?? {}).filter((provider) => provider.connected).length} tone="#059669" />
            <Metric icon={Clock3} label="Queued reminders" value={queue.QUEUED ?? 0} tone="#d89b00" />
            <Metric icon={CheckCircle2} label="Sent reminders" value={queue.SENT ?? 0} tone="#2563eb" />
            <Metric icon={XCircle} label="Failures" value={(queue.FAILED ?? 0) + (queue.DEAD_LETTER ?? 0)} tone="#dc2626" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[26px] border border-line bg-white shadow-sm">
            <SectionTitle title="Provider readiness" eyebrow="OAuth and delivery state" />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {Object.entries(integrationStatus?.providers ?? {}).map(([provider, state]) => (
                <div key={provider} className="rounded-2xl border border-line bg-[#fbfaf6] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-foreground">{humanize(provider)}</p>
                    <span className={cn("rounded-full px-2 py-1 text-[10px] font-black", state.connected ? "bg-emerald-50 text-emerald-700" : "bg-panel-muted text-ink-soft")}>
                      {state.connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-ink-soft">{state.name || state.provider || "No active tenant integration"}</p>
                  {state.scopes?.length ? <p className="mt-2 line-clamp-1 text-[10px] font-black uppercase tracking-[0.1em] text-ink-soft">{state.scopes.join(", ")}</p> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[26px] border border-line bg-white shadow-sm">
            <SectionTitle title="Webhook events" eyebrow={`${integrationStatus?.supportedEvents.length ?? 0} supported`} />
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              {(integrationStatus?.supportedEvents ?? []).map((event) => (
                <Pill key={event}>{event}</Pill>
              ))}
              {!integrationStatus?.supportedEvents.length ? <EmptyState text="No webhook event metadata returned." /> : null}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[26px] border border-line bg-white shadow-sm">
          <SectionTitle title="Reminder delivery queue" eyebrow={`${reminderJobs.length} recent jobs - ${failedJobs.length} need attention`} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-[#fbfaf6] text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">
                <tr>
                  <th className="px-5 py-3">Meeting</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Attempts</th>
                  <th className="px-5 py-3">Next attempt</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reminderJobs.map((job) => (
                  <tr key={job.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-black text-foreground">{job.meeting?.title ?? job.meetingId}</p>
                      <p className="mt-1 text-xs font-bold text-ink-soft">{job.destination || "Internal participants"}</p>
                      {job.lastError ? <p className="mt-1 max-w-md text-xs font-bold text-red-600">{job.lastError}</p> : null}
                    </td>
                    <td className="px-5 py-4 text-xs font-black text-foreground">{humanize(job.channel)}</td>
                    <td className="px-5 py-4"><ReminderStatusPill status={job.status} /></td>
                    <td className="px-5 py-4 text-xs font-black text-foreground">{job.attempts}/{job.maxAttempts}</td>
                    <td className="px-5 py-4 text-xs font-bold text-ink-soft">{dateFormatter.format(new Date(job.nextAttemptAt))}</td>
                    <td className="px-5 py-4 text-right">
                      {job.status === "FAILED" || job.status === "DEAD_LETTER" ? (
                        <button
                          type="button"
                          disabled={!canManage || saving === `retry:${job.id}`}
                          onClick={() => onRetryReminderJob(job.id)}
                          className="rounded-2xl border border-line bg-white px-3 py-2 text-xs font-black text-foreground transition hover:bg-panel-muted disabled:opacity-50"
                        >
                          Retry
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-ink-soft">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {reminderJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6}><EmptyState text="No reminder jobs have been created yet. New meetings and bookings will populate this queue." /></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <FormPanel title="Tenant provider policy" eyebrow="Defaults and enabled channels">
          {settings ? (
            <form key={settings.updatedAt ?? settings.id} className="space-y-4" onSubmit={onUpdateSettings}>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">Default conference provider</span>
                <select name="defaultConferenceProvider" className={fieldClass} defaultValue={settings.defaultConferenceProvider}>
                  {conferenceProviders.map((provider) => <option key={provider} value={provider}>{humanize(provider)}</option>)}
                </select>
              </label>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">Allowed conference providers</p>
                <div className="grid gap-2">
                  {conferenceProviders.map((provider) => (
                    <label key={provider} className="flex min-h-10 items-center gap-3 rounded-2xl border border-line bg-[#fbfaf6] px-3 text-xs font-black text-foreground">
                      <input name="allowedConferenceProviders" value={provider} type="checkbox" defaultChecked={settings.allowedConferenceProviders.includes(provider)} className="size-4 accent-primary" />
                      {humanize(provider)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">Default reminder channels</p>
                <div className="grid grid-cols-2 gap-2">
                  {reminderChannels.map((channel) => (
                    <label key={channel} className="flex min-h-10 items-center gap-3 rounded-2xl border border-line bg-[#fbfaf6] px-3 text-xs font-black text-foreground">
                      <input name="defaultReminderChannels" value={channel} type="checkbox" defaultChecked={settings.defaultReminderChannels.includes(channel)} className="size-4 accent-primary" />
                      {humanize(channel)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Toggle name="calendarSyncEnabled" label="Calendar sync" defaultChecked={settings.calendarSyncEnabled} />
                <Toggle name="emailRemindersEnabled" label="Email reminders" defaultChecked={settings.emailRemindersEnabled} />
                <Toggle name="whatsappRemindersEnabled" label="WhatsApp reminders" defaultChecked={settings.whatsappRemindersEnabled} />
                <Toggle name="smsRemindersEnabled" label="SMS reminders" defaultChecked={settings.smsRemindersEnabled} />
                <Toggle name="webhookEventsEnabled" label="Webhook events" defaultChecked={settings.webhookEventsEnabled} />
                <Toggle name="requireApprovedWhatsappTemplates" label="Require WhatsApp templates" defaultChecked={settings.requireApprovedWhatsappTemplates} />
              </div>

              <button disabled={!canManage || saving === "meeting-integrations"} className="tb-yellow-button h-11 w-full rounded-2xl text-sm font-black disabled:opacity-50">
                {saving === "meeting-integrations" ? "Saving policy..." : "Save integration policy"}
              </button>
            </form>
          ) : (
            <EmptyState text="Integration settings are loading." />
          )}
        </FormPanel>

        <FormPanel title="Create or attach conference" eyebrow="Meet, Teams, Zoom, or custom link">
          <form className="space-y-3" onSubmit={onCreateConference}>
            <select name="meetingId" className={fieldClass} defaultValue={selectedMeetingId}>
              <option value="">Select meeting</option>
              {meetings.map((meeting) => <option key={meeting.id} value={meeting.id}>{meeting.title}</option>)}
            </select>
            <select name="provider" className={fieldClass} defaultValue={settings?.defaultConferenceProvider ?? "MANUAL"}>
              {conferenceProviders.map((provider) => <option key={provider} value={provider}>{humanize(provider)}</option>)}
            </select>
            <input name="meetingUrl" placeholder="Required for manual, Zoom, or custom URL" className={fieldClass} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="calendarId" placeholder="Google calendar ID or primary" className={fieldClass} />
              <select name="sendUpdates" className={fieldClass} defaultValue="all">
                <option value="all">Send all updates</option>
                <option value="externalOnly">External only</option>
                <option value="none">No provider email</option>
              </select>
            </div>
            <button disabled={!canManage || saving === "conference"} className="h-11 w-full rounded-2xl bg-[#111111] text-sm font-black text-white disabled:opacity-50">
              {saving === "conference" ? "Creating conference..." : "Create conference"}
            </button>
          </form>
        </FormPanel>
      </aside>
    </section>
  );
}

function MeetingDetailPanel({
  canManage,
  meeting,
  onAction,
  saving,
}: {
  canManage: boolean;
  meeting: Meeting | null;
  onAction: (meeting: Meeting, action: "start" | "cancel" | "complete" | "archive" | "restore") => void;
  saving: string;
}) {
  if (!meeting) {
    return <div className="rounded-[26px] border border-dashed border-line bg-white p-8 text-center text-sm font-bold text-ink-soft">Select a meeting to inspect details.</div>;
  }

  return (
    <aside className="overflow-hidden rounded-[26px] border border-line bg-white shadow-[0_16px_48px_rgba(17,17,17,0.055)]">
      <div className="border-b border-line p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <StatusPill status={meeting.status} />
            <h2 className="mt-3 text-xl font-black tracking-tight text-foreground">{meeting.title}</h2>
            <p className="mt-1 text-sm font-semibold text-ink-soft">{dateFormatter.format(new Date(meeting.startAt))} - {durationText(meeting.startAt, meeting.endAt)}</p>
          </div>
          {meeting.meetingUrl ? (
            <a href={meeting.meetingUrl} target="_blank" rel="noreferrer" className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#111111] text-primary">
              <LinkIcon className="size-4" />
            </a>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 p-5">
        <Link
          href={`/meetings/${meeting.id}`}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#111111] px-4 text-sm font-black text-white transition hover:bg-black/85"
        >
          <ClipboardList className="size-4" />
          Open live workspace
        </Link>
        <InfoLine icon={UserRound} label="Host" value={meeting.host ? `${meeting.host.firstName} ${meeting.host.lastName}` : "No host"} />
        <InfoLine icon={Video} label="Location" value={meeting.meetingUrl || humanize(meeting.locationMode)} />
        <InfoLine icon={MapPin} label="Project" value={meeting.project ? `${meeting.project.key} - ${meeting.project.name}` : "Not linked"} />
        <InfoLine icon={Sparkles} label="AI automation" value={meeting.aiEnabled ? "Agenda, summary, and action-item ready" : "Disabled"} />

        <PanelBlock title="Attendees" count={meeting.attendees?.length ?? 0}>
          {(meeting.attendees ?? []).slice(0, 8).map((attendee) => (
            <div key={attendee.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fbfaf6] px-3 py-2">
              <span className="truncate text-xs font-black text-foreground">{attendee.user ? `${attendee.user.firstName} ${attendee.user.lastName}` : attendee.email || attendee.name}</span>
              <span className="text-[10px] font-black text-ink-soft">{humanize(attendee.role)}</span>
            </div>
          ))}
        </PanelBlock>

        <PanelBlock title="Agenda" count={meeting.agendaItems?.length ?? 0}>
          {(meeting.agendaItems ?? []).slice(0, 8).map((item) => (
            <div key={item.id} className="rounded-2xl border border-line bg-white px-3 py-2">
              <p className="text-xs font-black text-foreground">{item.title}</p>
              {item.notes ? <p className="mt-1 text-[11px] font-semibold text-ink-soft">{item.notes}</p> : null}
            </div>
          ))}
        </PanelBlock>

        {canManage ? (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {meeting.status === "SCHEDULED" ? (
              <ActionButton disabled={Boolean(saving)} icon={Video} label="Start" onClick={() => onAction(meeting, "start")} />
            ) : null}
            <ActionButton disabled={Boolean(saving)} icon={CheckCircle2} label="Complete" onClick={() => onAction(meeting, "complete")} />
            {meeting.archivedAt ? (
              <ActionButton disabled={Boolean(saving)} icon={Archive} label="Restore" onClick={() => onAction(meeting, "restore")} />
            ) : (
              <ActionButton disabled={Boolean(saving)} icon={Archive} label="Archive" onClick={() => onAction(meeting, "archive")} />
            )}
            <button
              type="button"
              disabled={Boolean(saving)}
              onClick={() => onAction(meeting, "cancel")}
              className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle className="size-4" />
              Cancel meeting
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function MiniMetric({ label, tone, value }: { label: string; tone: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-[#fbfaf6] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <p className="mt-2 text-2xl font-black tabular-nums" style={{ color: tone }}>{value}</p>
    </div>
  );
}

function AiRunButton({ icon: Icon, label, loading, onClick }: { icon: LucideIcon; label: string; loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-3 text-sm font-black text-foreground transition hover:border-primary hover:bg-[#fff9d8] disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
      {label}
    </button>
  );
}

function AiArtifactPanel({ children, empty, eyebrow, title }: { children: ReactNode; empty: string; eyebrow: string; title: string }) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-line bg-white shadow-sm">
      <SectionTitle title={title} eyebrow={eyebrow} />
      <div className="space-y-3 p-5">
        {children}
        <div className="hidden only:block">
          <EmptyState text={empty} />
        </div>
      </div>
    </section>
  );
}

function ArtifactList({ bodyKey = "description", items, titleKey = "title" }: { bodyKey?: string; items: unknown[]; titleKey?: string }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {items.slice(0, 10).map((item, index) => {
        const record = recordValue(item);
        const title = stringValue(record[titleKey]) || stringValue(item) || `Item ${index + 1}`;
        const body = stringValue(record[bodyKey]) || stringValue(record.evidence) || stringValue(record.reason);
        return (
          <div key={`${title}-${index}`} className="rounded-2xl border border-line bg-[#fbfaf6] px-4 py-3">
            <p className="text-sm font-black text-foreground">{title}</p>
            {body ? <p className="mt-1 text-xs font-semibold leading-5 text-ink-soft">{body}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function TextChips({ dark, items }: { dark?: boolean; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.slice(0, 10).map((item) => (
        <span
          key={item}
          className={cn(
            "inline-flex min-h-7 items-center rounded-full px-2.5 text-[10px] font-black uppercase tracking-[0.08em]",
            dark ? "bg-white/10 text-white/70" : "border border-line bg-[#fbfaf6] text-ink-soft",
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function StatusLabel({ text, tone }: { text: string; tone: string }) {
  return (
    <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: tone, background: `${tone}16` }}>
      {text}
    </span>
  );
}

function Metric({ icon: Icon, label, tone, value }: { icon: LucideIcon; label: string; tone: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-[#fbfaf6] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">{label}</p>
        <Icon className="size-4" style={{ color: tone }} />
      </div>
      <p className="mt-3 text-3xl font-black tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function ViewButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-black transition",
        active ? "bg-[#111111] text-white shadow-[0_12px_28px_rgba(17,17,17,0.18)]" : "text-ink-soft hover:bg-panel-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-line px-5 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-soft">{eyebrow}</p>
      <h2 className="mt-1 text-base font-black text-foreground">{title}</h2>
    </div>
  );
}

function FormPanel({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) {
  return (
    <section className="rounded-[26px] border border-line bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-soft">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-black text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PanelBlock({ children, count, title }: { children: ReactNode; count: number; title: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-soft">{title}</p>
        <span className="rounded-full bg-panel-muted px-2 py-1 text-[10px] font-black text-ink-soft">{count}</span>
      </div>
      <div className="space-y-2">{children || <p className="text-xs font-bold text-ink-soft">None yet.</p>}</div>
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#fbfaf6] px-3 py-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-ink-soft" />
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">{label}</p>
        <p className="break-words text-xs font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ disabled, icon: Icon, label, onClick }: { disabled: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 items-center justify-center gap-2 rounded-2xl border border-line bg-white text-sm font-black text-foreground transition hover:bg-panel-muted disabled:opacity-50"
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex h-60 items-center justify-center gap-2 text-sm font-black text-ink-soft">
      <Loader2 className="size-4 animate-spin" />
      Loading meetings
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="p-10 text-center text-sm font-bold text-ink-soft">{text}</div>;
}

function Toggle({ defaultChecked, label, name }: { defaultChecked?: boolean; label: string; name: string }) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-line bg-[#fbfaf6] px-3 text-sm font-black text-foreground">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="size-4 accent-primary" />
      {label}
    </label>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-line bg-[#fbfaf6] px-2.5 text-[10px] font-black uppercase tracking-[0.08em] text-ink-soft">
      {children}
    </span>
  );
}

function StatusDot({ status }: { status: MeetingStatus }) {
  return <span className="size-2.5 rounded-full" style={{ background: statusColor(status) }} />;
}

function StatusPill({ status }: { status: MeetingStatus }) {
  return (
    <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]" style={{ background: `${statusColor(status)}18`, color: statusColor(status) }}>
      {humanize(status)}
    </span>
  );
}

function ReminderStatusPill({ status }: { status: MeetingReminderJob["status"] }) {
  const color =
    status === "SENT"
      ? "#059669"
      : status === "FAILED" || status === "DEAD_LETTER"
        ? "#dc2626"
        : status === "PROCESSING"
          ? "#2563eb"
          : status === "CANCELLED"
            ? "#6b7280"
            : "#d89b00";
  return (
    <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]" style={{ background: `${color}18`, color }}>
      {humanize(status)}
    </span>
  );
}

function statusColor(status: MeetingStatus) {
  if (status === "LIVE") return "#059669";
  if (status === "COMPLETED") return "#2563eb";
  if (status === "CANCELLED" || status === "NO_SHOW" || status === "ARCHIVED") return "#dc2626";
  return "#d89b00";
}

function humanize(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function durationText(startAt: string, endAt: string) {
  const mins = Math.max(0, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000));
  if (mins < 60) return `${mins} mins`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function toDateTimeInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function stringArray(value: unknown): string[] {
  return arrayValue(value).map((item) => stringValue(item)).filter(Boolean);
}

function numberFrom(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

const fieldClass =
  "h-11 w-full rounded-2xl border border-line bg-white px-3 text-sm font-bold text-foreground outline-none transition placeholder:text-ink-soft focus:border-primary focus:ring-4 focus:ring-primary/10";
