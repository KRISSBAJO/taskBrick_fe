"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Paperclip,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  UsersRound,
  Video,
  Wifi,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { FileAssetManager } from "@/components/file-asset-manager";
import { useRealtime } from "@/components/realtime-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  assignMeetingActionItem,
  cancelMeeting,
  completeMeeting,
  createMeetingAgendaItem,
  createMeetingChecklistItem,
  createMeetingComment,
  createMeetingDecision,
  getMeetingWorkspace,
  markMeetingNoShow,
  sendMeetingFollowUp,
  startMeeting,
  syncMeetingOmoFlowRuntime,
  updateLiveMeetingNotes,
  updateMeetingAgendaItem,
  updateMeetingAttendance,
  updateMeetingChecklistItem,
  updateMeetingDecision,
  type MeetingAgendaItem,
  type MeetingAttendee,
  type MeetingAttendeeStatus,
  type MeetingChecklistItem,
  type MeetingDecision,
  type MeetingDecisionStatus,
  type MeetingReminderChannel,
  type MeetingStatus,
  type MeetingWorkspace,
  type TaskPriority,
  type TaskType,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { userInitials } from "@/lib/workspace-ui";

const fieldClass =
  "h-11 w-full rounded-[10px] border border-[#ded4be] bg-white px-3 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-[#f2c400] focus:ring-4 focus:ring-[#f2c400]/15 disabled:cursor-not-allowed disabled:bg-[#f7f2e7]";
const areaClass =
  "min-h-28 w-full resize-y rounded-[12px] border border-[#ded4be] bg-white px-3 py-3 text-sm font-semibold leading-6 text-foreground shadow-sm outline-none transition focus:border-[#f2c400] focus:ring-4 focus:ring-[#f2c400]/15 disabled:cursor-not-allowed disabled:bg-[#f7f2e7]";
const buttonBase =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50";

export default function MeetingCommandCenterPage() {
  const params = useParams<{ meetingId: string }>();
  const meetingId = params.meetingId;
  const auth = useWorkspaceAuth();
  const realtime = useRealtime();
  const { toast } = useToast();
  const [workspace, setWorkspace] = useState<MeetingWorkspace | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  const canManage = useMemo(
    () => auth.user.permissions.includes("manage:all") || auth.user.permissions.includes("manage:meetings"),
    [auth.user.permissions],
  );

  const loadWorkspace = useCallback(async () => {
    if (!meetingId) return;
    setError("");
    try {
      const result = await getMeetingWorkspace(auth.auth.accessToken, meetingId);
      setWorkspace(result);
      setNotesDraft((current) => (notesDirty && current ? current : result.live.notes));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load meeting workspace.");
    } finally {
      setLoading(false);
    }
  }, [auth.auth.accessToken, meetingId, notesDirty]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadWorkspace(), 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  useEffect(() => {
    if (!meetingId) return;
    realtime.emit("meeting.join", { meetingId });
    const reload = () => void loadWorkspace();
    const updateNotes = (payload: { notes?: string; version?: number }) => {
      setWorkspace((current) =>
        current
          ? {
              ...current,
              live: {
                ...current.live,
                notes: payload.notes ?? current.live.notes,
                version: payload.version ?? current.live.version,
              },
            }
          : current,
      );
      if (!notesDirty && payload.notes !== undefined) setNotesDraft(payload.notes);
    };
    const events = [
      "meeting.updated",
      "meeting.attendee.created",
      "meeting.attendee.updated",
      "meeting.attendee.removed",
      "meeting.agenda.created",
      "meeting.agenda.updated",
      "meeting.agenda.deleted",
      "meeting.comment.created",
      "meeting.comment.updated",
      "meeting.comment.deleted",
      "meeting.decision.created",
      "meeting.decision.updated",
      "meeting.decision.deleted",
      "meeting.checklist.created",
      "meeting.checklist.updated",
      "meeting.checklist.deleted",
      "meeting.attendance.updated",
      "meeting.action_item.assigned",
      "meeting.follow_up.queued",
      "meeting.omoflow.sync_requested",
    ];
    realtime.on("meeting.live_notes.updated", updateNotes);
    events.forEach((event) => realtime.on(event, reload));
    return () => {
      realtime.emit("meeting.leave", { meetingId });
      realtime.off("meeting.live_notes.updated", updateNotes);
      events.forEach((event) => realtime.off(event, reload));
    };
  }, [loadWorkspace, meetingId, notesDirty, realtime]);

  async function runMeetingStatus(action: "start" | "complete" | "cancel" | "no-show") {
    if (!workspace) return;
    setSaving(action);
    try {
      if (action === "start") await startMeeting(auth.auth.accessToken, workspace.meeting.id);
      if (action === "complete") await completeMeeting(auth.auth.accessToken, workspace.meeting.id);
      if (action === "cancel") await cancelMeeting(auth.auth.accessToken, workspace.meeting.id, { reason: "Cancelled from live workspace" });
      if (action === "no-show") await markMeetingNoShow(auth.auth.accessToken, workspace.meeting.id);
      await loadWorkspace();
      toast({ title: "Meeting updated", description: statusLabel(action), variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to update meeting", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function saveNotes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    setSaving("notes");
    try {
      const result = await updateLiveMeetingNotes(auth.auth.accessToken, workspace.meeting.id, {
        notes: notesDraft,
        version: workspace.live.version,
      });
      setWorkspace((current) => (current ? { ...current, live: { ...current.live, ...result } } : current));
      setNotesDirty(false);
      toast({ title: "Live notes saved", description: `Version ${result.version}`, variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to save notes", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") || "").trim();
    if (!body) return;
    setSaving("comment");
    try {
      await createMeetingComment(auth.auth.accessToken, workspace.meeting.id, { body });
      form.reset();
      await loadWorkspace();
      toast({ title: "Comment added", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to add comment", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function addDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") || "").trim();
    if (!title) return;
    setSaving("decision");
    try {
      await createMeetingDecision(auth.auth.accessToken, workspace.meeting.id, {
        title,
        summary: String(fd.get("summary") || "").trim() || undefined,
        impact: String(fd.get("impact") || "").trim() || undefined,
        ownerId: String(fd.get("ownerId") || "").trim() || undefined,
        status: String(fd.get("status") || "OPEN") as MeetingDecisionStatus,
      });
      form.reset();
      await loadWorkspace();
      toast({ title: "Decision logged", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to log decision", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function addChecklist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") || "").trim();
    if (!title) return;
    setSaving("checklist");
    try {
      await createMeetingChecklistItem(auth.auth.accessToken, workspace.meeting.id, {
        title,
        notes: String(fd.get("notes") || "").trim() || undefined,
        ownerId: String(fd.get("ownerId") || "").trim() || undefined,
      });
      form.reset();
      await loadWorkspace();
      toast({ title: "Checklist item added", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to add checklist item", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function updateAttendance(attendee: MeetingAttendee, status: MeetingAttendeeStatus) {
    if (!workspace) return;
    setSaving(`attendance-${attendee.id}`);
    try {
      await updateMeetingAttendance(auth.auth.accessToken, workspace.meeting.id, attendee.id, { status });
      await loadWorkspace();
    } catch (caught) {
      toast({ title: "Unable to update attendance", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function toggleAgenda(item: MeetingAgendaItem) {
    if (!workspace) return;
    setSaving(`agenda-${item.id}`);
    try {
      await updateMeetingAgendaItem(auth.auth.accessToken, workspace.meeting.id, item.id, {
        status: item.status === "DONE" ? "OPEN" : "DONE",
      });
      await loadWorkspace();
    } catch (caught) {
      toast({ title: "Unable to update agenda", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function toggleChecklist(item: MeetingChecklistItem) {
    if (!workspace) return;
    setSaving(`checklist-${item.id}`);
    try {
      await updateMeetingChecklistItem(auth.auth.accessToken, workspace.meeting.id, item.id, { isDone: !item.isDone });
      await loadWorkspace();
    } catch (caught) {
      toast({ title: "Unable to update checklist", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function updateDecisionStatus(decision: MeetingDecision, status: MeetingDecisionStatus) {
    if (!workspace) return;
    setSaving(`decision-${decision.id}`);
    try {
      await updateMeetingDecision(auth.auth.accessToken, workspace.meeting.id, decision.id, { status });
      await loadWorkspace();
    } catch (caught) {
      toast({ title: "Unable to update decision", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function addAgenda(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") || "").trim();
    if (!title) return;
    setSaving("agenda");
    try {
      await createMeetingAgendaItem(auth.auth.accessToken, workspace.meeting.id, {
        title,
        notes: String(fd.get("notes") || "").trim() || undefined,
      });
      form.reset();
      await loadWorkspace();
      toast({ title: "Agenda item added", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to add agenda item", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function assignAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") || "").trim();
    if (!title) return;
    setSaving("assign");
    try {
      const result = await assignMeetingActionItem(auth.auth.accessToken, workspace.meeting.id, {
        title,
        description: String(fd.get("description") || "").trim() || undefined,
        projectId: String(fd.get("projectId") || "").trim() || workspace.meeting.projectId || undefined,
        sprintId: String(fd.get("sprintId") || "").trim() || workspace.meeting.sprintId || undefined,
        assigneeId: String(fd.get("assigneeId") || "").trim() || undefined,
        dueDate: String(fd.get("dueDate") || "").trim() || undefined,
        priority: (String(fd.get("priority") || "MEDIUM") as TaskPriority) || "MEDIUM",
        type: (String(fd.get("type") || "TASK") as TaskType) || "TASK",
      });
      form.reset();
      await loadWorkspace();
      toast({ title: "Task created", description: result.task.key, variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to assign action", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function queueFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const body = String(fd.get("body") || "").trim();
    if (!body) return;
    const channels = ["EMAIL", fd.get("whatsapp") ? "WHATSAPP" : ""].filter(Boolean) as MeetingReminderChannel[];
    setSaving("follow-up");
    try {
      const result = await sendMeetingFollowUp(auth.auth.accessToken, workspace.meeting.id, {
        subject: String(fd.get("subject") || "").trim() || undefined,
        body,
        channels,
        includeActionItems: Boolean(fd.get("includeActionItems")),
        syncToOmoFlow: Boolean(fd.get("syncToOmoFlow")),
      });
      await loadWorkspace();
      toast({ title: "Follow-up queued", description: `${result.queued} delivery jobs`, variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to queue follow-up", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function syncOmoFlow() {
    if (!workspace) return;
    setSaving("omoflow");
    try {
      await syncMeetingOmoFlowRuntime(auth.auth.accessToken, workspace.meeting.id, {
        payload: {
          notesVersion: workspace.live.version,
          status: workspace.meeting.status,
          actionItems: workspace.checklist.length,
          decisions: workspace.decisions.length,
        },
      });
      await loadWorkspace();
      toast({ title: "OmoFlow sync queued", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to sync OmoFlow", description: messageFrom(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  if (loading) {
    return <LoadingShell />;
  }

  if (error || !workspace) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/meetings" className="inline-flex items-center gap-2 text-sm font-black text-ink-soft hover:text-foreground">
          <ArrowLeft className="size-4" />
          Meetings
        </Link>
        <div className="mt-5 rounded-[18px] border border-red-200 bg-red-50 p-6 text-sm font-black text-red-700">{error || "Meeting not found."}</div>
      </div>
    );
  }

  const meeting = workspace.meeting;
  const followUpDraft = followUpBody(workspace);

  return (
    <div className="min-h-full bg-[#faf8f1]">
      <div className="mx-auto max-w-7xl px-5 py-6">
        <header className="rounded-[22px] border border-[#ded4be] bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-b border-[#eadfc8] p-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <Link href="/meetings" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#8a8375] hover:text-foreground">
                <ArrowLeft className="size-4" />
                Meetings
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusPill status={meeting.status} />
                {realtime.status === "connected" ? <MiniPill icon={Wifi} label="Live sync" tone="green" /> : <MiniPill icon={Wifi} label="Reconnecting" tone="amber" />}
                {meeting.project ? <MiniPill label={meeting.project.key} tone="blue" /> : null}
                {meeting.sprint ? <MiniPill label={meeting.sprint.name} tone="purple" /> : null}
              </div>
              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-foreground md:text-4xl">{meeting.title}</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-ink-soft">{meeting.description || "Run the meeting, capture decisions, assign owners, and sync follow-up without leaving TaskBricks."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {meeting.meetingUrl ? (
                <a href={meeting.meetingUrl} target="_blank" rel="noreferrer" className={cn(buttonBase, "bg-black text-white hover:bg-black/85")}>
                  <Video className="size-4" />
                  Join
                </a>
              ) : null}
              {canManage ? (
                <>
                  <ActionButton disabled={saving === "start"} icon={Play} label="Start" onClick={() => void runMeetingStatus("start")} />
                  <ActionButton disabled={saving === "complete"} icon={CheckCircle2} label="Complete" onClick={() => void runMeetingStatus("complete")} />
                  <ActionButton disabled={saving === "no-show"} icon={XCircle} label="No-show" onClick={() => void runMeetingStatus("no-show")} />
                </>
              ) : null}
              <button onClick={() => void loadWorkspace()} className={cn(buttonBase, "border border-[#ded4be] bg-white text-foreground hover:bg-[#fff9d8]")}>
                <RefreshCw className="size-4" />
                Refresh
              </button>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
            <Metric label="Present" value={workspace.metrics.present} sub={`${workspace.metrics.attendees} invited`} />
            <Metric label="Agenda" value={workspace.metrics.agendaItems} sub={`${doneAgenda(workspace.agendaItems)} done`} />
            <Metric label="Decisions" value={workspace.metrics.decisions} sub={`${workspace.metrics.openDecisions} open`} />
            <Metric label="Checklist" value={`${workspace.metrics.checklistProgress}%`} sub={`${workspace.metrics.checklistDone}/${workspace.metrics.checklist}`} />
            <Metric label="Tasks" value={workspace.metrics.relatedTasks} sub={`${workspace.metrics.completedRelatedTasks} done`} />
            <Metric label="Files" value={workspace.metrics.files} sub={`${workspace.metrics.reminders} reminders`} />
          </div>
        </header>

        <main className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <section className="space-y-5">
            <Panel icon={FileText} eyebrow="Live capture" title="Notes">
              <form onSubmit={saveNotes} className="space-y-3">
                <textarea
                  value={notesDraft}
                  onChange={(event) => {
                    setNotesDirty(true);
                    setNotesDraft(event.target.value);
                    realtime.emit("meeting.typing.start", { meetingId, area: "notes" });
                  }}
                  onBlur={() => realtime.emit("meeting.typing.stop", { meetingId, area: "notes" })}
                  className="min-h-[320px] w-full resize-y rounded-[16px] border border-[#ded4be] bg-[#fffdf6] px-4 py-4 text-sm font-semibold leading-7 text-foreground outline-none transition focus:border-[#f2c400] focus:ring-4 focus:ring-[#f2c400]/15"
                  placeholder="Capture decisions, risks, blockers, follow-ups, and action items as the meeting runs..."
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold text-ink-soft">
                    Version {workspace.live.version}
                    {workspace.live.updatedAt ? ` · updated ${formatDateTime(workspace.live.updatedAt)}` : ""}
                  </p>
                  <button disabled={saving === "notes" || !notesDirty} className={cn(buttonBase, "bg-[#f5c400] text-black hover:bg-[#ffd91a]")}>
                    {saving === "notes" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                    Save notes
                  </button>
                </div>
              </form>
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel icon={ClipboardList} eyebrow="Agenda" title="Run sheet">
                <div className="space-y-3">
                  {workspace.agendaItems.map((item) => (
                    <button key={item.id} onClick={() => void toggleAgenda(item)} className="flex w-full items-start gap-3 rounded-[14px] border border-[#eadfc8] bg-white p-3 text-left transition hover:border-[#f5c400]">
                      {item.status === "DONE" ? <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" /> : <Circle className="mt-0.5 size-5 text-[#a69b88]" />}
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-foreground">{item.title}</span>
                        {item.notes ? <span className="mt-1 block text-xs font-semibold leading-5 text-ink-soft">{item.notes}</span> : null}
                      </span>
                    </button>
                  ))}
                  {!workspace.agendaItems.length ? <Empty text="No agenda items yet." /> : null}
                </div>
                {canManage ? (
                  <form onSubmit={addAgenda} className="mt-4 grid gap-2">
                    <input name="title" className={fieldClass} placeholder="Add agenda item" />
                    <input name="notes" className={fieldClass} placeholder="Notes or expected outcome" />
                    <button disabled={saving === "agenda"} className={cn(buttonBase, "bg-black text-white hover:bg-black/85")}>Add agenda</button>
                  </form>
                ) : null}
              </Panel>

              <Panel icon={UsersRound} eyebrow="Attendance" title="People in the room">
                <div className="space-y-3">
                  {workspace.attendees.map((attendee) => (
                    <div key={attendee.id} className="rounded-[14px] border border-[#eadfc8] bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff3aa] text-xs font-black text-black">
                            {attendee.user ? userInitials(attendee.user) : initialsFrom(attendee.name || attendee.email || "Guest")}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-foreground">{displayAttendee(attendee)}</p>
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8a8375]">{attendee.role}</p>
                          </div>
                        </div>
                        <AttendancePill status={attendee.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["ATTENDED", "NO_SHOW", "TENTATIVE"] as MeetingAttendeeStatus[]).map((status) => (
                          <button key={status} onClick={() => void updateAttendance(attendee, status)} className="rounded-full border border-[#ded4be] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-ink-soft hover:bg-[#fff9d8]">
                            {status.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel icon={ClipboardCheck} eyebrow="Outcomes" title="Decisions and checklist">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8375]">Decision log</h3>
                  {workspace.decisions.map((decision) => (
                    <DecisionRow key={decision.id} decision={decision} onStatus={(status) => void updateDecisionStatus(decision, status)} saving={saving === `decision-${decision.id}`} />
                  ))}
                  {!workspace.decisions.length ? <Empty text="No decisions logged yet." /> : null}
                  <form onSubmit={addDecision} className="grid gap-2 rounded-[14px] border border-dashed border-[#ded4be] bg-[#fffdf6] p-3">
                    <input name="title" className={fieldClass} placeholder="Decision title" />
                    <input name="summary" className={fieldClass} placeholder="Summary" />
                    <input name="impact" className={fieldClass} placeholder="Impact / tradeoff" />
                    <select name="status" className={fieldClass} defaultValue="OPEN">
                      {(["OPEN", "APPROVED", "REJECTED", "DEFERRED", "SUPERSEDED"] as MeetingDecisionStatus[]).map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <button disabled={saving === "decision"} className={cn(buttonBase, "bg-black text-white hover:bg-black/85")}>Log decision</button>
                  </form>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8375]">Checklist</h3>
                  {workspace.checklist.map((item) => (
                    <button key={item.id} onClick={() => void toggleChecklist(item)} className="flex w-full items-start gap-3 rounded-[14px] border border-[#eadfc8] bg-white p-3 text-left transition hover:border-[#f5c400]">
                      {item.isDone ? <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" /> : <Circle className="mt-0.5 size-5 text-[#a69b88]" />}
                      <span>
                        <span className="block text-sm font-black text-foreground">{item.title}</span>
                        {item.notes ? <span className="mt-1 block text-xs font-semibold text-ink-soft">{item.notes}</span> : null}
                      </span>
                    </button>
                  ))}
                  {!workspace.checklist.length ? <Empty text="No checklist items yet." /> : null}
                  <form onSubmit={addChecklist} className="grid gap-2 rounded-[14px] border border-dashed border-[#ded4be] bg-[#fffdf6] p-3">
                    <input name="title" className={fieldClass} placeholder="Checklist item" />
                    <input name="notes" className={fieldClass} placeholder="Notes" />
                    <button disabled={saving === "checklist"} className={cn(buttonBase, "bg-black text-white hover:bg-black/85")}>Add checklist</button>
                  </form>
                </div>
              </div>
            </Panel>

            <Panel icon={MessageSquare} eyebrow="Discussion" title="Comments">
              <div className="space-y-3">
                {workspace.comments.map((comment) => (
                  <div key={comment.id} className="rounded-[14px] border border-[#eadfc8] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-foreground">{displayUser(comment.author)}</p>
                      <p className="text-xs font-bold text-ink-soft">{formatDateTime(comment.createdAt)}</p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-ink-soft">{comment.body}</p>
                  </div>
                ))}
                {!workspace.comments.length ? <Empty text="No comments yet." /> : null}
              </div>
              <form onSubmit={addComment} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input name="body" className={fieldClass} placeholder="Add a note, blocker, or handoff comment" />
                <button disabled={saving === "comment"} className={cn(buttonBase, "bg-[#f5c400] text-black hover:bg-[#ffd91a]")}>Comment</button>
              </form>
            </Panel>
          </section>

          <aside className="space-y-5">
            <Panel icon={Sparkles} eyebrow="Action assignment" title="Create task from meeting">
              <form onSubmit={assignAction} className="grid gap-3">
                <input name="title" className={fieldClass} placeholder="Action item title" />
                <textarea name="description" className={areaClass} placeholder="Context, acceptance criteria, or owner handoff" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="dueDate" type="date" className={fieldClass} />
                  <select name="priority" className={fieldClass} defaultValue="MEDIUM">
                    {(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"] as TaskPriority[]).map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </div>
                <button disabled={saving === "assign"} className={cn(buttonBase, "bg-black text-white hover:bg-black/85")}>
                  <Sparkles className="size-4" />
                  Assign as task
                </button>
              </form>
            </Panel>

            <Panel icon={Send} eyebrow="Follow-up" title="Email and WhatsApp">
              <form onSubmit={queueFollowUp} className="grid gap-3">
                <input name="subject" className={fieldClass} defaultValue={`Follow-up: ${meeting.title}`} />
                <textarea name="body" className="min-h-44 w-full resize-y rounded-[12px] border border-[#ded4be] bg-white px-3 py-3 text-sm font-semibold leading-6 text-foreground outline-none focus:border-[#f2c400] focus:ring-4 focus:ring-[#f2c400]/15" defaultValue={followUpDraft} />
                <label className="flex items-center gap-2 text-sm font-black text-foreground"><input name="includeActionItems" type="checkbox" defaultChecked /> Include action items</label>
                <label className="flex items-center gap-2 text-sm font-black text-foreground"><input name="whatsapp" type="checkbox" /> Queue WhatsApp delivery</label>
                <label className="flex items-center gap-2 text-sm font-black text-foreground"><input name="syncToOmoFlow" type="checkbox" /> Sync handoff to OmoFlow</label>
                <button disabled={saving === "follow-up"} className={cn(buttonBase, "bg-[#f5c400] text-black hover:bg-[#ffd91a]")}>
                  <Mail className="size-4" />
                  Queue follow-up
                </button>
              </form>
            </Panel>

            <Panel icon={Bot} eyebrow="OmoFlow" title="Runtime sync">
              <p className="text-sm font-semibold leading-6 text-ink-soft">Sync meeting runtime state, notes version, decisions, and action counts to OmoFlow for runtime handoff and downstream automation.</p>
              <button onClick={() => void syncOmoFlow()} disabled={saving === "omoflow"} className={cn(buttonBase, "mt-4 w-full bg-black text-white hover:bg-black/85")}>
                <Bot className="size-4" />
                Sync OmoFlow runtime
              </button>
              <RuntimeState state={workspace.live.runtimeState} />
            </Panel>

            <Panel icon={Paperclip} eyebrow="Attachments" title="Files">
              <FileAssetManager token={auth.auth.accessToken} entityType="MEETING" entityId={meeting.id} scope="MEETING" compact canManage={canManage} onChanged={() => void loadWorkspace()} />
            </Panel>

            <Panel icon={Clock3} eyebrow="Related work" title="Tasks and timeline">
              <div className="space-y-3">
                {workspace.relatedTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-[14px] border border-[#eadfc8] bg-white p-3 transition hover:border-[#f5c400]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-foreground">{task.key}</p>
                      <span className="rounded-full bg-[#f6f0df] px-2 py-1 text-[10px] font-black text-ink-soft">{task.status}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink-soft">{task.title}</p>
                  </Link>
                ))}
                {!workspace.relatedTasks.length ? <Empty text="No related tasks yet." /> : null}
              </div>
            </Panel>
          </aside>
        </main>
      </div>
    </div>
  );
}

function Panel({ children, eyebrow, icon: Icon, title }: { children: ReactNode; eyebrow: string; icon: LucideIcon; title: string }) {
  return (
    <section className="rounded-[20px] border border-[#ded4be] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#eadfc8] px-5 py-4">
        <div className="grid size-9 place-items-center rounded-[12px] bg-[#fff3aa] text-black"><Icon className="size-4" /></div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a8375]">{eyebrow}</p>
          <h2 className="text-lg font-black text-foreground">{title}</h2>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Metric({ label, sub, value }: { label: string; sub: string; value: number | string }) {
  return (
    <div className="rounded-[16px] border border-[#eadfc8] bg-[#fffdf6] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a8375]">{label}</p>
      <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
      <p className="mt-1 text-xs font-bold text-ink-soft">{sub}</p>
    </div>
  );
}

function StatusPill({ status }: { status: MeetingStatus }) {
  const tone = status === "LIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : status === "COMPLETED" ? "bg-blue-50 text-blue-700 border-blue-200" : status === "CANCELLED" || status === "NO_SHOW" ? "bg-red-50 text-red-700 border-red-200" : "bg-[#fff9d8] text-[#6b5200] border-[#f0d15f]";
  return <span className={cn("rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em]", tone)}>{status.replace("_", " ")}</span>;
}

function MiniPill({ icon: Icon, label, tone }: { icon?: LucideIcon; label: string; tone: "green" | "amber" | "blue" | "purple" }) {
  const styles = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-[#f0d15f] bg-[#fff9d8] text-[#6b5200]",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    purple: "border-violet-200 bg-violet-50 text-violet-700",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black", styles[tone])}>{Icon ? <Icon className="size-3.5" /> : null}{label}</span>;
}

function ActionButton({ disabled, icon: Icon, label, onClick }: { disabled?: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return <button disabled={disabled} onClick={onClick} className={cn(buttonBase, "border border-[#ded4be] bg-white text-foreground hover:bg-[#fff9d8]")}><Icon className="size-4" />{label}</button>;
}

function AttendancePill({ status }: { status: MeetingAttendeeStatus }) {
  const tone = status === "ATTENDED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : status === "NO_SHOW" || status === "DECLINED" ? "bg-red-50 text-red-700 border-red-200" : "bg-[#f6f0df] text-ink-soft border-[#ded4be]";
  return <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]", tone)}>{status.replace("_", " ")}</span>;
}

function DecisionRow({ decision, onStatus, saving }: { decision: MeetingDecision; onStatus: (status: MeetingDecisionStatus) => void; saving: boolean }) {
  return (
    <div className="rounded-[14px] border border-[#eadfc8] bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-foreground">{decision.title}</p>
          {decision.summary ? <p className="mt-1 text-xs font-semibold leading-5 text-ink-soft">{decision.summary}</p> : null}
        </div>
        <select disabled={saving} value={decision.status} onChange={(event) => onStatus(event.target.value as MeetingDecisionStatus)} className="h-8 rounded-full border border-[#ded4be] bg-white px-2 text-[11px] font-black">
          {(["OPEN", "APPROVED", "REJECTED", "DEFERRED", "SUPERSEDED"] as MeetingDecisionStatus[]).map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>
    </div>
  );
}

function RuntimeState({ state }: { state: Record<string, unknown> }) {
  const omoflow = state.omoflow && typeof state.omoflow === "object" ? state.omoflow as Record<string, unknown> : null;
  if (!omoflow) return <p className="mt-3 rounded-[12px] border border-dashed border-[#ded4be] p-3 text-xs font-bold text-ink-soft">No OmoFlow runtime sync yet.</p>;
  return (
    <div className="mt-3 rounded-[12px] border border-[#eadfc8] bg-[#fffdf6] p-3 text-xs font-bold text-ink-soft">
      <p className="font-black text-foreground">{String(omoflow.status ?? "SYNC_REQUESTED")}</p>
      <p>{String(omoflow.lastSyncRequestedAt ?? "")}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[14px] border border-dashed border-[#ded4be] bg-[#fffdf6] p-5 text-center text-sm font-black text-ink-soft">{text}</div>;
}

function LoadingShell() {
  return (
    <div className="mx-auto grid min-h-[50vh] max-w-5xl place-items-center px-5">
      <div className="flex items-center gap-3 rounded-[16px] border border-[#ded4be] bg-white px-5 py-4 text-sm font-black text-foreground shadow-sm">
        <Loader2 className="size-5 animate-spin text-[#d89b00]" />
        Loading meeting workspace
      </div>
    </div>
  );
}

function doneAgenda(items: MeetingAgendaItem[]) {
  return items.filter((item) => item.status === "DONE").length;
}

function displayUser(user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return name || user?.email || "Unknown user";
}

function displayAttendee(attendee: MeetingAttendee) {
  if (attendee.user) return displayUser(attendee.user);
  return attendee.name || attendee.email || "Guest";
}

function initialsFrom(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return value.slice(0, 2).toUpperCase();
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusLabel(action: string) {
  return action === "no-show" ? "Marked no-show" : `${action[0]?.toUpperCase()}${action.slice(1)} recorded`;
}

function followUpBody(workspace: MeetingWorkspace) {
  const decisions = workspace.decisions.map((decision) => `- ${decision.title} (${decision.status})`).join("\n");
  const checklist = workspace.checklist.filter((item) => !item.isDone).map((item) => `- ${item.title}`).join("\n");
  return [
    `Thanks for joining ${workspace.meeting.title}.`,
    "",
    decisions ? `Decisions:\n${decisions}` : "Decisions:\n- No formal decisions logged yet.",
    "",
    checklist ? `Open action items:\n${checklist}` : "Open action items:\n- No open checklist items.",
    "",
    "Notes:",
    workspace.live.notes || "No notes captured yet.",
  ].join("\n");
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
