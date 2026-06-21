"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Archive,
  Bell,
  Bold,
  CheckCircle2,
  Clock3,
  FileText,
  Flag,
  Highlighter,
  Inbox,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Mail,
  MailPlus,
  Minus,
  Paperclip,
  Pin,
  Quote,
  RefreshCw,
  Reply,
  Redo2,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Star,
  Strikethrough,
  Target,
  Trash2,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useRealtime } from "@/components/realtime-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  archiveInternalMailThread,
  createFileAsset,
  createInternalMailThread,
  createUploadIntent,
  deleteInternalMailThread,
  getInternalMailFolders,
  getInternalMailThread,
  listInternalMailThreads,
  listNotifications,
  listTasks,
  markInternalMailRead,
  markInternalMailUnread,
  moveInternalMailThread,
  replyInternalMailThread,
  restoreInternalMailThread,
  searchInternalMailboxes,
  setInternalMailFlag,
  setInternalMailPin,
  setInternalMailStar,
  snoozeInternalMailThread,
  type InternalMailFolder,
  type InternalMailFolderSummary,
  type InternalMailPriority,
  type InternalMailRecipient,
  type InternalMailThread,
  type InternalMailbox,
  type Notification,
  type Task,
  type UploadIntent,
  type UserSummary,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  formatShortDate,
  isOpenTask,
  priorityLabels,
  sortTasksForAttention,
  taskStatusLabels,
  userInitials as workspaceUserInitials,
} from "@/lib/workspace-ui";

export type WorkHubView = "for-you" | "inbox" | "starred" | "my-tasks";

type MailboxMode =
  | { key: "INBOX"; label: "Inbox"; folder: InternalMailFolder }
  | { key: "SENT"; label: "Sent Items"; folder: InternalMailFolder }
  | { key: "DRAFTS"; label: "Drafts"; folder: InternalMailFolder }
  | { key: "ARCHIVE"; label: "Archive"; folder: InternalMailFolder }
  | { key: "DELETED"; label: "Deleted Items"; folder: InternalMailFolder }
  | { key: "JUNK"; label: "Junk Email"; folder: InternalMailFolder }
  | { key: "SNOOZED"; label: "Snoozed"; folder: InternalMailFolder }
  | { key: "STARRED"; label: "Starred"; starredOnly: true }
  | { key: "FLAGGED"; label: "Flagged"; flaggedOnly: true }
  | { key: "PINNED"; label: "Pinned"; pinnedOnly: true };

type WorkHubState = {
  folders: InternalMailFolderSummary;
  inboxThreads: InternalMailThread[];
  starredThreads: InternalMailThread[];
  notifications: Notification[];
  myTasks: Task[];
};

type RecipientBucket = "TO" | "CC" | "BCC";

type RichMailValue = {
  html: string;
  text: string;
};

const EMPTY_FOLDERS: InternalMailFolderSummary = {
  counts: {
    INBOX: 0,
    SENT: 0,
    DRAFTS: 0,
    ARCHIVE: 0,
    DELETED: 0,
    JUNK: 0,
    SNOOZED: 0,
  },
  flagged: 0,
  pinned: 0,
  starred: 0,
  unread: 0,
};

const INITIAL_STATE: WorkHubState = {
  folders: EMPTY_FOLDERS,
  inboxThreads: [],
  myTasks: [],
  notifications: [],
  starredThreads: [],
};

const EMPTY_RICH_MAIL: RichMailValue = { html: "", text: "" };

const MAILBOXES: MailboxMode[] = [
  { key: "INBOX", label: "Inbox", folder: "INBOX" },
  { key: "SENT", label: "Sent Items", folder: "SENT" },
  { key: "DRAFTS", label: "Drafts", folder: "DRAFTS" },
  { key: "PINNED", label: "Pinned", pinnedOnly: true },
  { key: "STARRED", label: "Starred", starredOnly: true },
  { key: "FLAGGED", label: "Flagged", flaggedOnly: true },
  { key: "SNOOZED", label: "Snoozed", folder: "SNOOZED" },
  { key: "JUNK", label: "Junk Email", folder: "JUNK" },
  { key: "ARCHIVE", label: "Archive", folder: "ARCHIVE" },
  { key: "DELETED", label: "Deleted Items", folder: "DELETED" },
];

const VIEW_META: Record<WorkHubView, { icon: LucideIcon; label: string; subtitle: string }> = {
  "for-you": {
    icon: Sparkles,
    label: "For You",
    subtitle: "Unread internal mail, attention signals, and assigned work in one queue.",
  },
  inbox: {
    icon: Inbox,
    label: "Inbox",
    subtitle: "A tenant-internal mail client with folders, read state, flags, stars, archive, delete, and delivery alerts.",
  },
  starred: {
    icon: Star,
    label: "Starred",
    subtitle: "Important internal mail and watched work that should stay close.",
  },
  "my-tasks": {
    icon: Target,
    label: "My Tasks",
    subtitle: "Assigned work grouped for fast review and follow-through.",
  },
};

export function WorkHubPage({ view }: { view: WorkHubView }) {
  const { auth, user } = useWorkspaceAuth();
  const { mailVersion, notificationVersion } = useRealtime();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const threadParam = searchParams.get("thread");
  const [state, setState] = useState<WorkHubState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHub = useCallback(
    async (mode: "initial" | "refresh" | "silent" = "initial") => {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

      try {
        const [inboxThreads, starredThreads, notifications, myTasks] = await Promise.all([
          view === "for-you"
            ? listInternalMailThreads(auth.accessToken, { folder: "INBOX", limit: 30, page: 1 })
            : Promise.resolve({ data: [] }),
          view === "starred"
            ? listInternalMailThreads(auth.accessToken, { starredOnly: true, limit: 30, page: 1 })
            : Promise.resolve({ data: [] }),
          view === "for-you" ? listNotifications(auth.accessToken, { page: 1, limit: 30, userId: user.id }) : Promise.resolve({ data: [] }),
          view !== "inbox"
            ? listTasks(auth.accessToken, {
                assigneeId: user.id,
                includeArchived: false,
                limit: 80,
                page: 1,
                sortBy: "dueDate",
                sortDirection: "asc",
              })
            : Promise.resolve({ data: [] }),
        ]);

        setState({
          folders: EMPTY_FOLDERS,
          inboxThreads: inboxThreads.data,
          myTasks: myTasks.data,
          notifications: notifications.data,
          starredThreads: starredThreads.data,
        });
      } catch (caught) {
        toast({
          title: "Work Hub could not refresh",
          description: caught instanceof Error ? caught.message : "The workspace feed is unavailable.",
          variant: "error",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [auth.accessToken, toast, user.id, view],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadHub("initial"), 0);
    return () => window.clearTimeout(timeout);
  }, [loadHub]);

  useEffect(() => {
    if (mailVersion <= 0 && notificationVersion <= 0) return;
    const timeout = window.setTimeout(() => void loadHub("silent"), 0);
    return () => window.clearTimeout(timeout);
  }, [loadHub, mailVersion, notificationVersion]);

  async function refresh() {
    await loadHub("refresh");
    toast({ title: "Work Hub refreshed", variant: "success" });
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div className="rounded-2xl border border-line bg-panel px-5 py-4 shadow-sm">
          <Loader2 className="mx-auto size-5 animate-spin text-primary-dark" aria-hidden="true" />
          <p className="mt-3 text-sm font-black text-foreground">Loading Work Hub</p>
        </div>
      </div>
    );
  }

  const activeView = VIEW_META[view];
  const ActiveIcon = activeView.icon;

  return (
    <div className={cn("mx-auto w-full space-y-4", view === "inbox" ? "max-w-[calc(100vw-7rem)] px-2" : "max-w-7xl")}>
      {view !== "inbox" ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-[#111111]">
              <ActiveIcon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-dark">Work Hub</p>
              <h1 className="text-2xl font-black tracking-[-0.02em] text-foreground">{activeView.label}</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-panel px-3 text-sm font-black transition hover:bg-panel-muted disabled:opacity-60"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} aria-hidden="true" />
            Refresh
          </button>
        </section>
      ) : null}

      {view === "for-you" ? <ForYouView notifications={state.notifications} tasks={state.myTasks} threads={state.inboxThreads} /> : null}
      {view === "inbox" ? (
        <InternalMailClient
          initialThreadId={threadParam ?? undefined}
          onChanged={() => loadHub("silent")}
        />
      ) : null}
      {view === "starred" ? <StarredView tasks={state.myTasks} threads={state.starredThreads} /> : null}
      {view === "my-tasks" ? <MyTasksView tasks={state.myTasks} /> : null}
    </div>
  );
}

function InternalMailClient({
  initialThreadId,
  onChanged,
}: {
  initialThreadId?: string;
  onChanged: () => Promise<void> | void;
}) {
  const { auth } = useWorkspaceAuth();
  const { mailVersion } = useRealtime();
  const { toast } = useToast();
  const [activeMailbox, setActiveMailbox] = useState<MailboxMode>(MAILBOXES[0]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [folders, setFolders] = useState<InternalMailFolderSummary>(EMPTY_FOLDERS);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedThread, setSelectedThread] = useState<InternalMailThread | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreadId ?? "");
  const [threads, setThreads] = useState<InternalMailThread[]>([]);

  const loadThreads = useCallback(
    async (preferredThreadId = selectedThreadId) => {
      setLoading(true);
      try {
        const [folderSummary, threadPage] = await Promise.all([
          getInternalMailFolders(auth.accessToken),
          listInternalMailThreads(auth.accessToken, {
            folder: "folder" in activeMailbox ? activeMailbox.folder : undefined,
            flaggedOnly: "flaggedOnly" in activeMailbox ? activeMailbox.flaggedOnly : undefined,
            limit: 80,
            page: 1,
            pinnedOnly: "pinnedOnly" in activeMailbox ? activeMailbox.pinnedOnly : undefined,
            search: query.trim() || undefined,
            starredOnly: "starredOnly" in activeMailbox ? activeMailbox.starredOnly : undefined,
          }),
        ]);

        setFolders(folderSummary);
        setThreads(threadPage.data);

        const nextThreadId = preferredThreadId && threadPage.data.some((thread) => thread.id === preferredThreadId)
          ? preferredThreadId
          : threadPage.data[0]?.id ?? "";
        setSelectedThreadId(nextThreadId);

        if (nextThreadId) {
          const thread = await getInternalMailThread(auth.accessToken, nextThreadId, { markRead: true });
          setSelectedThread(thread);
        } else {
          setSelectedThread(null);
        }
      } catch (caught) {
        toast({
          title: "Mailbox could not load",
          description: caught instanceof Error ? caught.message : "Try refreshing your inbox.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [activeMailbox, auth.accessToken, query, selectedThreadId, toast],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadThreads(initialThreadId), 0);
    return () => window.clearTimeout(timeout);
  }, [activeMailbox, initialThreadId, loadThreads]);

  useEffect(() => {
    if (mailVersion <= 0) return;
    const timeout = window.setTimeout(() => void loadThreads(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadThreads, mailVersion]);

  async function selectThread(threadId: string) {
    setSelectedThreadId(threadId);
    try {
      const thread = await getInternalMailThread(auth.accessToken, threadId, { markRead: true });
      setSelectedThread(thread);
      setThreads((current) => current.map((item) => (item.id === threadId ? { ...item, unread: false, currentParticipant: thread.currentParticipant } : item)));
      await onChanged();
    } catch (caught) {
      toast({
        title: "Mail could not open",
        description: caught instanceof Error ? caught.message : "Try refreshing the mailbox.",
        variant: "error",
      });
    }
  }

  async function runThreadAction(action: "archive" | "delete" | "restore" | "star" | "flag" | "pin" | "unread" | "read" | "snooze" | "junk") {
    if (!selectedThread) {
      toast({ title: "Select a mail item first", variant: "warning" });
      return;
    }

    try {
      if (action === "archive") await archiveInternalMailThread(auth.accessToken, selectedThread.id);
      if (action === "delete") await deleteInternalMailThread(auth.accessToken, selectedThread.id);
      if (action === "restore") await restoreInternalMailThread(auth.accessToken, selectedThread.id);
      if (action === "star") await setInternalMailStar(auth.accessToken, selectedThread.id, !selectedThread.currentParticipant.starredAt);
      if (action === "flag") await setInternalMailFlag(auth.accessToken, selectedThread.id, !selectedThread.currentParticipant.flaggedAt);
      if (action === "pin") await setInternalMailPin(auth.accessToken, selectedThread.id, !selectedThread.currentParticipant.pinnedAt);
      if (action === "unread") await markInternalMailUnread(auth.accessToken, selectedThread.id);
      if (action === "read") await markInternalMailRead(auth.accessToken, selectedThread.id);
      if (action === "snooze") {
        const tomorrow = new Date(Date.now() + 86_400_000);
        await snoozeInternalMailThread(auth.accessToken, selectedThread.id, tomorrow.toISOString());
      }
      if (action === "junk") await moveInternalMailThread(auth.accessToken, selectedThread.id, "JUNK");

      toast({ title: "Mailbox updated", variant: "success" });
      await loadThreads();
      await onChanged();
    } catch (caught) {
      toast({
        title: "Mailbox action failed",
        description: caught instanceof Error ? caught.message : "Try again.",
        variant: "error",
      });
    }
  }

  const activeMailboxCount = mailboxCount(folders, activeMailbox);
  const hasSelectedThread = Boolean(selectedThread);

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-panel shadow-sm">
      <div className="border-b border-line bg-[#fffdf3] px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-[#111111] shadow-[0_14px_30px_rgba(255,212,0,0.28)]">
              <Inbox className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-dark">TaskBricks Mail</p>
                <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">
                  Internal
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <MailboxIcon className="size-4 text-primary-dark" modeKey={activeMailbox.key} />
                <h2 className="truncate text-lg font-black tracking-[-0.01em] text-foreground">{activeMailbox.label}</h2>
                <span className="rounded-full border border-line bg-white px-2 py-0.5 text-xs font-black text-ink-soft">{activeMailboxCount} items</span>
                {folders.unread ? <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-black text-[#111111]">{folders.unread} unread</span> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-[#111111] shadow-[0_16px_32px_rgba(255,212,0,0.22)] transition hover:bg-primary-dark"
            >
              <MailPlus className="size-4" aria-hidden="true" />
              New mail
            </button>
            <span className="hidden h-8 w-px bg-line sm:block" aria-hidden="true" />
            <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-line bg-white p-1 shadow-sm">
              <ToolbarButton disabled={!hasSelectedThread} icon={Trash2} label="Delete" onClick={() => runThreadAction("delete")} />
              <ToolbarButton disabled={!hasSelectedThread} icon={Archive} label="Archive" onClick={() => runThreadAction("archive")} />
              <ToolbarButton disabled={!hasSelectedThread} icon={ShieldAlert} label="Report" onClick={() => runThreadAction("junk")} />
              <ToolbarButton disabled={!hasSelectedThread} icon={Flag} label="Flag" onClick={() => runThreadAction("flag")} />
              <ToolbarButton disabled={!hasSelectedThread} icon={Star} label="Star" onClick={() => runThreadAction("star")} />
              <ToolbarButton
                disabled={!hasSelectedThread}
                icon={Pin}
                label={selectedThread?.currentParticipant.pinnedAt ? "Unpin" : "Pin"}
                onClick={() => runThreadAction("pin")}
              />
              <ToolbarButton disabled={!hasSelectedThread} icon={Mail} label="Read" onClick={() => runThreadAction("read")} />
              <ToolbarButton disabled={!hasSelectedThread} icon={MailPlus} label="Unread" onClick={() => runThreadAction("unread")} />
              <ToolbarButton disabled={!hasSelectedThread} icon={Clock3} label="Snooze" onClick={() => runThreadAction("snooze")} />
              {activeMailbox.key === "DELETED" ? <ToolbarButton disabled={!hasSelectedThread} icon={RefreshCw} label="Restore" onClick={() => runThreadAction("restore")} /> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-190px)] lg:grid-cols-[238px_minmax(410px,0.9fr)_minmax(0,1.55fr)]">
        <aside className="border-b border-line bg-[#f3f6fb] p-3 lg:border-b-0 lg:border-r">
          <p className="px-2 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-ink-soft">Favorites</p>
          <MailboxList folders={folders} active={activeMailbox} onSelect={setActiveMailbox} />
        </aside>

        <div className="border-b border-line lg:border-b-0 lg:border-r">
          <div className="border-b border-line bg-panel px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-panel px-3">
                <Search className="size-4 text-ink-soft" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void loadThreads();
                  }}
                  placeholder="Search internal mail"
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-ink-soft/70"
                />
              </div>
              <button
                type="button"
                onClick={() => loadThreads()}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-panel transition hover:bg-panel-muted"
                aria-label="Refresh mailbox"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex items-center border-b border-line bg-[#fbfaf5] text-xs font-black text-ink-soft">
            <div className="w-[42%] px-4 py-3">From</div>
            <div className="min-w-0 flex-1 px-3 py-3">Subject</div>
            <div className="w-24 px-3 py-3 text-right">Received</div>
          </div>

          <div className="h-[calc(100vh-328px)] min-h-[520px] overflow-y-auto tb-scrollbar">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-primary-dark" aria-hidden="true" />
              </div>
            ) : threads.length ? (
              threads.map((thread) => (
                <MailRow
                  key={thread.id}
                  active={thread.id === selectedThreadId}
                  thread={thread}
                  onClick={() => selectThread(thread.id)}
                />
              ))
            ) : (
              <EmptyState icon={Mail} title="No mail in this folder" body="Internal mail for this folder will appear here." compact />
            )}
          </div>
        </div>

        <ReadingPane
          onReplySent={async () => {
            await loadThreads(selectedThread?.id);
            await onChanged();
          }}
          selectedThread={selectedThread}
        />
      </div>

      {composeOpen ? (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          onSent={async (thread) => {
            setComposeOpen(false);
            await loadThreads(thread.id);
            await onChanged();
          }}
        />
      ) : null}
    </section>
  );
}

function MailboxList({
  active,
  folders,
  onSelect,
}: {
  active: MailboxMode;
  folders: InternalMailFolderSummary;
  onSelect: (mailbox: MailboxMode) => void;
}) {
  return (
    <div className="space-y-1">
      {MAILBOXES.map((mailbox) => {
        const count = mailboxCount(folders, mailbox);
        const selected = active.key === mailbox.key;

        return (
          <button
            key={mailbox.key}
            type="button"
            onClick={() => onSelect(mailbox)}
            className={cn(
              "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition",
              selected ? "bg-[#dbeafe] text-[#1d4ed8]" : "text-[#3d4656] hover:bg-white",
            )}
          >
            <MailboxIcon className="size-4 shrink-0" modeKey={mailbox.key} />
            <span className="min-w-0 flex-1 truncate">{mailbox.label}</span>
            {count ? <span className="text-xs font-black">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function MailRow({ active, onClick, thread }: { active: boolean; onClick: () => void; thread: InternalMailThread }) {
  const sender = thread.latestMessage?.sender ?? thread.createdBy;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid w-full grid-cols-[42%_minmax(0,1fr)_96px] items-center border-b border-line text-left transition",
        active ? "bg-[#e8edf7]" : "bg-panel hover:bg-[#f8fafc]",
        thread.unread && "font-black",
      )}
    >
      <div className="flex min-w-0 items-center gap-3 px-4 py-3">
        <input type="checkbox" aria-label="Select mail" className="size-4 rounded border-line" onClick={(event) => event.stopPropagation()} />
        <Avatar user={sender} />
        <span className="min-w-0 truncate text-sm text-[#1f5fbf]">{displayUser(sender) || "Unknown sender"}</span>
      </div>
      <div className="min-w-0 px-3 py-3">
        <div className="flex items-center gap-2">
          {thread.currentParticipant.starredAt ? <Star className="size-3.5 fill-primary text-primary-dark" aria-hidden="true" /> : null}
          {thread.currentParticipant.flaggedAt ? <Flag className="size-3.5 text-red-500" aria-hidden="true" /> : null}
          {thread.currentParticipant.pinnedAt ? <Pin className="size-3.5 text-[#2563eb]" aria-hidden="true" /> : null}
          <p className="min-w-0 truncate text-sm text-[#1f5fbf]">{thread.subject}</p>
        </div>
        <p className="mt-0.5 truncate text-xs font-semibold text-ink-soft">{mailPreview(thread)}</p>
      </div>
      <div className="px-3 py-3 text-right text-xs font-black text-[#1f5fbf]">{formatMailTime(thread.lastMessageAt)}</div>
    </button>
  );
}

function ReadingPane({
  onReplySent,
  selectedThread,
}: {
  onReplySent: () => Promise<void> | void;
  selectedThread: InternalMailThread | null;
}) {
  const { auth } = useWorkspaceAuth();
  const { toast } = useToast();
  const [replyDraft, setReplyDraft] = useState<RichMailValue>(EMPTY_RICH_MAIL);
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setReplyDraft(EMPTY_RICH_MAIL), 0);
    return () => window.clearTimeout(timeout);
  }, [selectedThread?.id]);

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedThread || !replyDraft.text.trim()) return;
    setReplying(true);
    try {
      await replyInternalMailThread(auth.accessToken, selectedThread.id, {
        bodyHtml: sanitizeMailHtml(replyDraft.html),
        bodyText: replyDraft.text.trim(),
      });
      setReplyDraft(EMPTY_RICH_MAIL);
      await onReplySent();
      toast({ title: "Reply sent", variant: "success" });
    } catch (caught) {
      toast({
        title: "Reply failed",
        description: caught instanceof Error ? caught.message : "Try again.",
        variant: "error",
      });
    } finally {
      setReplying(false);
    }
  }

  if (!selectedThread) {
    return (
      <div className="flex min-h-[520px] items-center justify-center bg-panel p-6">
        <EmptyState icon={Mail} title="Select a mail item" body="The full internal mail will open in this reading pane." />
      </div>
    );
  }

  const latest = selectedThread.messages[selectedThread.messages.length - 1] ?? selectedThread.latestMessage;
  const recipientGroups = groupRecipients(latest?.recipients ?? []);

  return (
    <div className="min-w-0 bg-panel">
      <div className="border-b border-line px-5 py-4">
        <h2 className="line-clamp-2 text-xl font-black text-foreground">{selectedThread.subject}</h2>
      </div>

      <div className="h-[calc(100vh-280px)] min-h-[568px] overflow-y-auto p-5 tb-scrollbar">
        {selectedThread.messages.map((message) => {
          const attachments = getMailAttachments(message.attachments);

          return (
            <article key={message.id} className="mb-5 rounded-2xl border border-line bg-[#fffefa] p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Avatar user={message.sender} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#1f5fbf]">{displayUser(message.sender)}</p>
                      <p className="mt-0.5 text-xs font-semibold text-ink-soft">{message.sender?.email}</p>
                    </div>
                    <p className="text-xs font-bold text-ink-soft">{formatMailDate(message.sentAt ?? message.createdAt)}</p>
                  </div>

                  <div className="mt-3 rounded-xl border border-line bg-panel px-3 py-2 text-xs font-semibold leading-5 text-ink-soft">
                    <p>To: {recipientGroups.to || "No visible recipients"}</p>
                    {recipientGroups.cc ? <p>Cc: {recipientGroups.cc}</p> : null}
                  </div>

                  {message.bodyHtml ? (
                    <div
                      className="tb-mail-body mt-5 text-sm font-semibold leading-7 text-foreground"
                      dangerouslySetInnerHTML={{ __html: sanitizeMailHtml(message.bodyHtml) }}
                    />
                  ) : (
                    <div className="mt-5 whitespace-pre-wrap text-sm font-semibold leading-7 text-foreground">{message.bodyText}</div>
                  )}

                  {attachments.length ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.fileUrl || undefined}
                          target={attachment.fileUrl ? "_blank" : undefined}
                          rel={attachment.fileUrl ? "noreferrer" : undefined}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 transition",
                            attachment.fileUrl ? "hover:border-[#2563eb] hover:bg-[#eff6ff]" : "",
                          )}
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-panel-muted text-ink-soft">
                            <Paperclip className="size-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-black text-foreground">{attachment.name}</span>
                            <span className="block text-[11px] font-semibold text-ink-soft">{formatAttachmentSize(attachment.size)}</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        <form onSubmit={handleReply} className="rounded-2xl border border-line bg-[#fbfaf5] p-4">
          <RichMailEditor minHeight="min-h-[160px]" onChange={setReplyDraft} placeholder="Write a reply" value={replyDraft} />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={replying || !replyDraft.text.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-[#111111] transition hover:bg-primary-dark disabled:opacity-60"
            >
              {replying ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Reply className="size-4" aria-hidden="true" />}
              Reply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type MailDraftAttachment = {
  id: string;
  assetId?: string;
  addedAt: string;
  error?: string;
  fileUrl?: string;
  lastModified: number;
  name: string;
  provider?: string | null;
  size: number;
  status?: "uploading" | "ready" | "failed";
  storageKey?: string | null;
  type: string;
};

function formatAttachmentSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getMailAttachments(value: unknown): MailDraftAttachment[] {
  if (!value || typeof value !== "object") return [];
  const files = (value as { files?: unknown }).files;
  if (!Array.isArray(files)) return [];

  const parsed: MailDraftAttachment[] = [];
  files.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const file = item as Partial<MailDraftAttachment>;
    if (!file.id || !file.name) return;
    const attachment: MailDraftAttachment = {
      addedAt: typeof file.addedAt === "string" ? file.addedAt : "",
      id: String(file.id),
      lastModified: typeof file.lastModified === "number" ? file.lastModified : 0,
      name: String(file.name),
      provider: typeof file.provider === "string" ? file.provider : null,
      size: typeof file.size === "number" ? file.size : 0,
      status: file.status === "uploading" || file.status === "failed" || file.status === "ready" ? file.status : "ready",
      storageKey: typeof file.storageKey === "string" ? file.storageKey : null,
      type: typeof file.type === "string" ? file.type : "application/octet-stream",
    };
    if (typeof file.assetId === "string") attachment.assetId = file.assetId;
    if (typeof file.error === "string") attachment.error = file.error;
    if (typeof file.fileUrl === "string") attachment.fileUrl = file.fileUrl;
    parsed.push(attachment);
  });
  return parsed;
}

async function uploadMailFileWithIntent(intent: UploadIntent, file: File) {
  if (!intent.uploadUrl) {
    throw new Error(intent.note || `${intent.provider} direct upload is not configured yet.`);
  }

  if (intent.provider === "cloudinary") {
    const body = new FormData();
    Object.entries(intent.fields).forEach(([key, value]) => body.append(key, String(value)));
    body.append("file", file);
    const response = await fetch(intent.uploadUrl, { method: "POST", body });
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Cloudinary upload failed.");
    const secureUrl = typeof payload.secure_url === "string" ? payload.secure_url : undefined;
    const url = typeof payload.url === "string" ? payload.url : undefined;
    return secureUrl ?? url ?? intent.fileUrl;
  }

  const response = await fetch(intent.uploadUrl, {
    method: intent.method,
    headers: intent.headers,
    body: file,
  });
  if (!response.ok) throw new Error(`${intent.provider} upload failed with status ${response.status}.`);
  return intent.fileUrl;
}

function ComposeModal({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: (thread: InternalMailThread) => Promise<void> | void;
}) {
  const { auth, user } = useWorkspaceAuth();
  const { toast } = useToast();
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<MailDraftAttachment[]>([]);
  const [bodyDraft, setBodyDraft] = useState<RichMailValue>(EMPTY_RICH_MAIL);
  const [bccRecipients, setBccRecipients] = useState<InternalMailbox[]>([]);
  const [ccRecipients, setCcRecipients] = useState<InternalMailbox[]>([]);
  const [priority, setPriority] = useState<InternalMailPriority>("NORMAL");
  const [recipientBucket, setRecipientBucket] = useState<RecipientBucket>("TO");
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientSuggestions, setRecipientSuggestions] = useState<InternalMailbox[]>([]);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState("");
  const [toRecipients, setToRecipients] = useState<InternalMailbox[]>([]);

  const recipientCount = toRecipients.length + ccRecipients.length + bccRecipients.length;
  const hasUploadingAttachments = attachments.some((attachment) => attachment.status === "uploading");
  const selectedMailboxIds = useMemo(
    () => new Set([...toRecipients, ...ccRecipients, ...bccRecipients].map((mailbox) => mailbox.id)),
    [bccRecipients, ccRecipients, toRecipients],
  );

  const visibleMailboxes = useMemo(
    () => recipientSuggestions.filter((mailbox) => !selectedMailboxIds.has(mailbox.id)).slice(0, 12),
    [recipientSuggestions, selectedMailboxIds],
  );

  useEffect(() => {
    const term = recipientSearch.trim();

    const timeout = window.setTimeout(() => {
      if (term.length < 2) {
        setRecipientSuggestions([]);
        setRecipientLoading(false);
        return;
      }

      setRecipientLoading(true);
      searchInternalMailboxes(auth.accessToken, { limit: 20, page: 1, search: term, status: "ACTIVE" })
        .then((page) => setRecipientSuggestions(page.data))
        .catch((caught) => {
          setRecipientSuggestions([]);
          toast({
            title: "Recipient search failed",
            description: caught instanceof Error ? caught.message : "Try another name or address.",
            variant: "error",
          });
        })
        .finally(() => setRecipientLoading(false));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [auth.accessToken, recipientSearch, toast]);

  function removeRecipient(mailboxId: string) {
    setToRecipients((current) => current.filter((mailbox) => mailbox.id !== mailboxId));
    setCcRecipients((current) => current.filter((mailbox) => mailbox.id !== mailboxId));
    setBccRecipients((current) => current.filter((mailbox) => mailbox.id !== mailboxId));
  }

  function setRecipientInBucket(mailbox: InternalMailbox, bucket: RecipientBucket) {
    const alreadyInBucket =
      (bucket === "TO" && toRecipients.some((item) => item.id === mailbox.id)) ||
      (bucket === "CC" && ccRecipients.some((item) => item.id === mailbox.id)) ||
      (bucket === "BCC" && bccRecipients.some((item) => item.id === mailbox.id));

    removeRecipient(mailbox.id);
    if (alreadyInBucket) return;

    if (bucket === "TO") setToRecipients((current) => [...current, mailbox]);
    if (bucket === "CC") {
      setShowCc(true);
      setCcRecipients((current) => [...current, mailbox]);
    }
    if (bucket === "BCC") {
      setShowBcc(true);
      setBccRecipients((current) => [...current, mailbox]);
    }

    setRecipientSearch("");
    setRecipientSuggestions([]);
  }

  function recipientPlacement(mailboxId: string) {
    if (toRecipients.some((item) => item.id === mailboxId)) return "TO";
    if (ccRecipients.some((item) => item.id === mailboxId)) return "CC";
    if (bccRecipients.some((item) => item.id === mailboxId)) return "BCC";
    return "";
  }

  async function uploadAttachment(file: File, attachment: MailDraftAttachment) {
    try {
      const intent = await createUploadIntent(auth.accessToken, {
        entityType: "INTERNAL_MAIL",
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        scope: "INTERNAL_MAIL",
        sizeBytes: file.size,
        visibility: "PRIVATE",
      });
      const uploadedUrl = await uploadMailFileWithIntent(intent, file);
      const created = await createFileAsset(auth.accessToken, {
        entityType: "INTERNAL_MAIL",
        fileName: file.name,
        fileUrl: uploadedUrl,
        metadata: {
          kind: file.type?.startsWith("image/") ? "image" : "file",
          source: "internal-mail-compose",
        },
        mimeType: file.type || intent.mimeType || undefined,
        provider: intent.provider,
        scope: "INTERNAL_MAIL",
        sizeBytes: file.size,
        storageKey: intent.storageKey,
        visibility: "PRIVATE",
      });

      setAttachments((current) =>
        current.map((item) =>
          item.id === attachment.id
            ? {
                ...item,
                assetId: created.id,
                error: undefined,
                fileUrl: created.fileUrl,
                provider: created.provider,
                status: "ready",
                storageKey: created.storageKey,
              }
            : item,
        ),
      );
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The file could not be uploaded.";
      setAttachments((current) =>
        current.map((item) => (item.id === attachment.id ? { ...item, error: message, status: "failed" } : item)),
      );
      toast({
        title: `${attachment.name} was not uploaded`,
        description: message,
        variant: "error",
      });
    }
  }

  function addAttachments(files: FileList | null) {
    if (!files?.length) return;
    const nextFiles = Array.from(files).map((file) => ({
      attachment: {
        addedAt: new Date().toISOString(),
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`,
        lastModified: file.lastModified,
        name: file.name,
        size: file.size,
        status: "uploading" as const,
        type: file.type || "application/octet-stream",
      } satisfies MailDraftAttachment,
      file,
    }));
    setAttachments((current) => [...current, ...nextFiles.map((item) => item.attachment)]);
    toast({
      title: nextFiles.length === 1 ? "Attachment upload started" : `${nextFiles.length} attachment uploads started`,
      description: "Files are being stored before this mail is sent.",
      variant: "success",
    });
    void Promise.all(nextFiles.map((item) => uploadAttachment(item.file, item.attachment)));
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }

  async function addTypedRecipient() {
    const term = recipientSearch.trim();
    if (!term) return;

    try {
      setRecipientLoading(true);
      const page = recipientSuggestions.length
        ? { data: recipientSuggestions }
        : await searchInternalMailboxes(auth.accessToken, { limit: 20, page: 1, search: term, status: "ACTIVE" });
      const normalized = term.toLowerCase();
      const mailbox =
        page.data.find((item) =>
          [item.address, item.primaryAddress, item.localPart, item.user?.email]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase())
            .includes(normalized),
        ) ?? page.data[0];

      if (!mailbox) {
        toast({
          title: "No internal mailbox found",
          description: "Search by name, internal address, or a user login email.",
          variant: "warning",
        });
        return;
      }

      setRecipientInBucket(mailbox, recipientBucket);
    } catch (caught) {
      toast({
        title: "Recipient could not be added",
        description: caught instanceof Error ? caught.message : "Try another name or address.",
        variant: "error",
      });
    } finally {
      setRecipientLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMail(false);
  }

  async function submitMail(saveAsDraft: boolean) {
    if ((!saveAsDraft && !toRecipients.length) || !subject.trim() || !bodyDraft.text.trim()) {
      toast({
        title: saveAsDraft ? "Subject and body are required for a draft" : "Recipients, subject, and body are required",
        variant: "warning",
      });
      return;
    }

    const uploadingCount = attachments.filter((attachment) => attachment.status === "uploading").length;
    const failedCount = attachments.filter((attachment) => attachment.status === "failed").length;
    if (uploadingCount > 0 || failedCount > 0) {
      toast({
        title: uploadingCount > 0 ? "Attachments are still uploading" : "Remove failed attachments first",
        description:
          uploadingCount > 0
            ? "Wait for the selected files to finish uploading before sending."
            : `${failedCount} attachment${failedCount === 1 ? "" : "s"} failed to upload.`,
        variant: uploadingCount > 0 ? "warning" : "error",
      });
      return;
    }

    if (saveAsDraft) setSavingDraft(true);
    else setSending(true);

    try {
      const readyAttachments = attachments.filter((attachment) => attachment.status !== "failed" && attachment.status !== "uploading");
      const thread = await createInternalMailThread(auth.accessToken, {
        attachments: readyAttachments.length ? { files: readyAttachments } : undefined,
        bccAddresses: bccRecipients.map((mailbox) => mailbox.address),
        bodyHtml: sanitizeMailHtml(bodyDraft.html),
        bodyText: bodyDraft.text.trim(),
        ccAddresses: ccRecipients.map((mailbox) => mailbox.address),
        priority,
        saveAsDraft,
        subject: subject.trim(),
        toAddresses: toRecipients.map((mailbox) => mailbox.address),
      });
      await onSent(thread);
      toast({ title: saveAsDraft ? "Draft saved" : "Internal mail sent", variant: "success" });
    } catch (caught) {
      toast({
        title: saveAsDraft ? "Draft was not saved" : "Mail was not sent",
        description: caught instanceof Error ? caught.message : "Check recipients and try again.",
        variant: "error",
      });
    } finally {
      setSending(false);
      setSavingDraft(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111111]/45 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_32px_90px_rgba(17,17,17,0.28)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-[#f8fafc] px-4 py-3">
          <button
            type="submit"
            disabled={sending || savingDraft || hasUploadingAttachments}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            Send
          </button>
          <button
            type="button"
            onClick={() => submitMail(true)}
            disabled={savingDraft || sending || hasUploadingAttachments}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-bold text-foreground transition hover:bg-panel-muted disabled:opacity-60"
          >
            {savingDraft ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
            Save draft
          </button>
          <span className="mx-1 hidden h-8 w-px bg-line sm:block" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate px-1 text-sm font-semibold text-[#4b5563]">
            From: <span className="font-black text-foreground">{user.email}</span>
          </span>
          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            className="flex size-9 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition hover:bg-panel-muted"
            aria-label="Attach file"
          >
            <Paperclip className="size-4" aria-hidden="true" />
          </button>
          <input
            ref={attachmentInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              addAttachments(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition hover:bg-panel-muted"
            aria-label="Close compose"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="border-b border-line bg-[#f3f6fb] p-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary-dark">Recipients</p>
                <h3 className="text-sm font-black text-foreground">Find mailbox</h3>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-ink-soft">{recipientCount}</span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-line bg-white p-1">
              {(["TO", "CC", "BCC"] as RecipientBucket[]).map((bucket) => (
                <button
                  key={bucket}
                  type="button"
                  onClick={() => {
                    setRecipientBucket(bucket);
                    if (bucket === "CC") setShowCc(true);
                    if (bucket === "BCC") setShowBcc(true);
                  }}
                  className={cn(
                    "h-8 rounded-lg text-xs font-black transition",
                    recipientBucket === bucket ? "bg-[#111111] text-white" : "text-ink-soft hover:bg-panel-muted",
                  )}
                >
                  {bucket === "TO" ? "To" : bucket === "CC" ? "Cc" : "Bcc"}
                </button>
              ))}
            </div>

            <div className="mt-3 flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3">
              <Search className="size-4 text-ink-soft" aria-hidden="true" />
              <input
                value={recipientSearch}
                onChange={(event) => setRecipientSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void addTypedRecipient();
                  }
                }}
                placeholder="Name or email address"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-ink-soft/70"
              />
              {recipientLoading ? <Loader2 className="size-4 animate-spin text-ink-soft" aria-hidden="true" /> : null}
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-ink-soft">
              Search users, paste a login email, or type an internal address. Press Enter to add the best match.
            </p>

            <div className="mt-3 max-h-[58vh] space-y-1 overflow-y-auto pr-1 tb-scrollbar">
              {visibleMailboxes.map((item) => {
                const placement = recipientPlacement(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRecipientInBucket(item, recipientBucket)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition",
                      placement ? "border-[#1d4ed8] bg-[#eff6ff]" : "border-line bg-white hover:border-primary",
                    )}
                  >
                    <MailboxAvatar mailbox={item} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black text-foreground">{item.displayName}</span>
                      <span className="block truncate text-[11px] font-semibold text-ink-soft">{item.address}</span>
                    </span>
                    {placement ? <span className="rounded-md bg-[#dbeafe] px-1.5 py-0.5 text-[10px] font-black text-[#1d4ed8]">{placement}</span> : null}
                  </button>
                );
              })}
              {!visibleMailboxes.length ? (
                <div className="rounded-xl border border-dashed border-line bg-white px-3 py-5 text-center text-xs font-semibold text-ink-soft">
                  {recipientSearch.trim().length < 2 ? "Start typing to search tenant mailboxes." : recipientLoading ? "Searching mailboxes..." : "No active mailbox matched."}
                </div>
              ) : null}
            </div>
          </aside>

          <div className="min-h-0 overflow-y-auto bg-white tb-scrollbar">
            <div className="border-b border-line px-4 py-3">
              <RecipientField label="To" onRemove={removeRecipient} recipients={toRecipients}>
                <button type="button" onClick={() => setShowCc((value) => !value)} className="text-xs font-bold text-[#1f5fbf] hover:underline">
                  Cc
                </button>
                <button type="button" onClick={() => setShowBcc((value) => !value)} className="text-xs font-bold text-[#1f5fbf] hover:underline">
                  Bcc
                </button>
              </RecipientField>
              {showCc ? <RecipientField label="Cc" onRemove={removeRecipient} recipients={ccRecipients} /> : null}
              {showBcc ? <RecipientField label="Bcc" onRemove={removeRecipient} recipients={bccRecipients} /> : null}

              <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px]">
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Add a subject"
                  className="h-11 min-w-0 border-b border-[#9ca3af] bg-transparent text-base font-semibold outline-none transition placeholder:text-ink-soft/70 focus:border-[#2563eb]"
                />
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as InternalMailPriority)}
                  className="h-11 rounded-xl border border-line bg-white px-3 text-sm font-black outline-none transition focus:border-[#2563eb]"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="p-4">
              <RichMailEditor minHeight="min-h-[460px]" onChange={setBodyDraft} placeholder="Write your internal email" value={bodyDraft} />
              {attachments.length ? (
                <div className="mt-3 rounded-2xl border border-line bg-[#fbfaf5] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary-dark">Attachments</p>
                    <span className="rounded-lg bg-white px-2 py-1 text-[11px] font-black text-ink-soft">{attachments.length}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-panel-muted text-ink-soft">
                          {attachment.status === "uploading" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Paperclip className="size-4" aria-hidden="true" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          {attachment.fileUrl ? (
                            <a href={attachment.fileUrl} target="_blank" rel="noreferrer" className="block truncate text-xs font-black text-[#1d4ed8] hover:underline">
                              {attachment.name}
                            </a>
                          ) : (
                            <span className="block truncate text-xs font-black text-foreground">{attachment.name}</span>
                          )}
                          <span
                            className={cn(
                              "block text-[11px] font-semibold",
                              attachment.status === "failed" ? "text-red-700" : attachment.status === "uploading" ? "text-[#1d4ed8]" : "text-ink-soft",
                            )}
                          >
                            {attachment.status === "failed"
                              ? attachment.error || "Upload failed"
                              : attachment.status === "uploading"
                                ? "Uploading..."
                                : `${formatAttachmentSize(attachment.size)} uploaded`}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.id)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-700"
                          aria-label={`Remove ${attachment.name}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-[#f8fafc] px-5 py-3">
          <p className="text-xs font-semibold text-ink-soft">Internal delivery stays inside this tenant workspace.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => submitMail(true)}
              disabled={savingDraft || sending || hasUploadingAttachments}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-black text-foreground transition hover:bg-panel-muted disabled:opacity-60"
            >
              {savingDraft ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
              Save draft
            </button>
          <button
            type="submit"
            disabled={sending || savingDraft || hasUploadingAttachments}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-[#111111] shadow-[0_14px_28px_rgba(255,212,0,0.22)] transition hover:bg-primary-dark disabled:opacity-60"
          >
            {sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            Send
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function RecipientField({
  children,
  label,
  onRemove,
  recipients,
}: {
  children?: ReactNode;
  label: string;
  onRemove: (mailboxId: string) => void;
  recipients: InternalMailbox[];
}) {
  return (
    <div className="flex min-h-11 items-center gap-3 border-b border-[#d1d5db] py-1.5">
      <span className="w-10 shrink-0 rounded-lg border border-line bg-white px-2 py-1 text-center text-sm font-bold text-ink-soft">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {recipients.length ? (
          recipients.map((recipient) => {
            return (
              <span key={recipient.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#e8f0ff] px-2 py-1 text-xs font-black text-[#1f5fbf]">
                <span className="max-w-[220px] truncate">{recipient.displayName}</span>
                <span className="hidden max-w-[240px] truncate font-semibold text-[#5b6f91] sm:inline">{recipient.address}</span>
                <button
                  type="button"
                  onClick={() => onRemove(recipient.id)}
                  className="rounded-full px-1 text-[#1f5fbf] hover:bg-white"
                  aria-label={`Remove ${recipient.displayName}`}
                >
                  x
                </button>
              </span>
            );
          })
        ) : (
          <span className="text-sm font-semibold text-ink-soft/70">Search or paste an internal address</span>
        )}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-3">{children}</div> : null}
    </div>
  );
}

function MailboxAvatar({ mailbox }: { mailbox: InternalMailbox }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8eef9] text-xs font-black text-[#1f2937]">
      {mailboxInitials(mailbox)}
    </span>
  );
}

const editorFontOptions = ["Aptos", "Arial", "Inter", "Georgia", "Times New Roman", "Courier New"];
const editorSizeOptions = [
  { label: "10", value: "1" },
  { label: "12", value: "2" },
  { label: "14", value: "3" },
  { label: "18", value: "4" },
  { label: "24", value: "5" },
  { label: "32", value: "6" },
];
const editorColorOptions = [
  { label: "Black", value: "#111111" },
  { label: "Gray", value: "#4b5563" },
  { label: "Blue", value: "#2563eb" },
  { label: "Green", value: "#059669" },
  { label: "Red", value: "#dc2626" },
  { label: "Gold", value: "#b88900" },
];
const editorHighlightOptions = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fff3a3" },
  { label: "Green", value: "#dcfce7" },
  { label: "Blue", value: "#dbeafe" },
  { label: "Pink", value: "#ffe4e6" },
];

function RichMailEditor({
  minHeight,
  onChange,
  placeholder,
  value,
}: {
  minHeight: string;
  onChange: (value: RichMailValue) => void;
  placeholder: string;
  value: RichMailValue;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!value.html && editor.innerHTML) {
      editor.innerHTML = "";
    }
  }, [value.html]);

  function syncValue() {
    const editor = editorRef.current;
    if (!editor) return;
    onChange({
      html: sanitizeMailHtml(editor.innerHTML),
      text: editor.innerText.replace(/\n{3,}/g, "\n\n"),
    });
  }

  function runCommand(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  }

  function runHighlight(value: string) {
    if (!value) return;
    editorRef.current?.focus();
    document.execCommand("hiliteColor", false, value);
    document.execCommand("backColor", false, value);
    syncValue();
  }

  function createLink() {
    const url = window.prompt("Paste a URL");
    if (!url) return;
    const safeUrl = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:") ? url : `https://${url}`;
    runCommand("createLink", safeUrl);
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-white", focused ? "border-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.08)]" : "border-line")}>
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-[#f8fafc] px-2 py-2">
        <EditorButton icon={Undo2} label="Undo" onClick={() => runCommand("undo")} />
        <EditorButton icon={Redo2} label="Redo" onClick={() => runCommand("redo")} />
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <select
          aria-label="Font family"
          defaultValue="Aptos"
          onChange={(event) => runCommand("fontName", event.target.value)}
          className="h-8 rounded-lg border border-line bg-white px-2 text-xs font-bold text-foreground outline-none"
        >
          {editorFontOptions.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
        <select
          aria-label="Font size"
          defaultValue="3"
          onChange={(event) => runCommand("fontSize", event.target.value)}
          className="h-8 rounded-lg border border-line bg-white px-2 text-xs font-bold text-foreground outline-none"
        >
          {editorSizeOptions.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Paragraph format"
          defaultValue="p"
          onChange={(event) => runCommand("formatBlock", event.target.value)}
          className="h-8 rounded-lg border border-line bg-white px-2 text-xs font-bold text-foreground outline-none"
        >
          <option value="p">Body</option>
          <option value="h2">Heading</option>
          <option value="h3">Subhead</option>
          <option value="blockquote">Quote</option>
        </select>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <EditorButton icon={Bold} label="Bold" onClick={() => runCommand("bold")} />
        <EditorButton icon={Italic} label="Italic" onClick={() => runCommand("italic")} />
        <EditorButton icon={Underline} label="Underline" onClick={() => runCommand("underline")} />
        <EditorButton icon={Strikethrough} label="Strikethrough" onClick={() => runCommand("strikeThrough")} />
        <select
          aria-label="Text color"
          defaultValue="#111111"
          onChange={(event) => runCommand("foreColor", event.target.value)}
          className="h-8 rounded-lg border border-line bg-white px-2 text-xs font-bold text-foreground outline-none"
          title="Text color"
        >
          {editorColorOptions.map((color) => (
            <option key={color.value} value={color.value}>
              {color.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Highlight"
          defaultValue=""
          onChange={(event) => runHighlight(event.target.value)}
          className="h-8 rounded-lg border border-line bg-white px-2 text-xs font-bold text-foreground outline-none"
          title="Highlight"
        >
          {editorHighlightOptions.map((color) => (
            <option key={color.label} value={color.value}>
              {color.label}
            </option>
          ))}
        </select>
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <EditorButton icon={List} label="Bullet list" onClick={() => runCommand("insertUnorderedList")} />
        <EditorButton icon={ListOrdered} label="Numbered list" onClick={() => runCommand("insertOrderedList")} />
        <EditorButton icon={IndentDecrease} label="Decrease indent" onClick={() => runCommand("outdent")} />
        <EditorButton icon={IndentIncrease} label="Increase indent" onClick={() => runCommand("indent")} />
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <EditorButton icon={AlignLeft} label="Align left" onClick={() => runCommand("justifyLeft")} />
        <EditorButton icon={AlignCenter} label="Align center" onClick={() => runCommand("justifyCenter")} />
        <EditorButton icon={AlignRight} label="Align right" onClick={() => runCommand("justifyRight")} />
        <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
        <EditorButton icon={Quote} label="Quote" onClick={() => runCommand("formatBlock", "blockquote")} />
        <EditorButton icon={Link2} label="Link" onClick={createLink} />
        <EditorButton icon={Minus} label="Horizontal rule" onClick={() => runCommand("insertHorizontalRule")} />
        <span className="min-w-[160px] flex-1" />
        <button
          type="button"
          onClick={() => {
            editorRef.current?.focus();
            document.execCommand("removeFormat");
            syncValue();
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-black text-ink-soft transition hover:bg-white hover:text-foreground"
        >
          <Highlighter className="size-3.5" aria-hidden="true" />
          Clear format
        </button>
      </div>
      <div className="relative">
        {!value.text.trim() ? (
          <div className="pointer-events-none absolute left-4 top-4 text-sm font-semibold text-ink-soft/70">{placeholder}</div>
        ) : null}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={() => {
            setFocused(false);
            syncValue();
          }}
          onFocus={() => setFocused(true)}
          onInput={syncValue}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            syncValue();
          }}
          className={cn("tb-mail-editor max-h-[58vh] overflow-y-auto px-4 py-4 text-sm font-semibold leading-7 text-foreground outline-none tb-scrollbar", minHeight)}
        />
      </div>
    </div>
  );
}

function EditorButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-lg text-ink-soft transition hover:bg-white hover:text-foreground"
      aria-label={label}
      title={label}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

function ForYouView({ notifications, tasks, threads }: { notifications: Notification[]; tasks: Task[]; threads: InternalMailThread[] }) {
  const attentionTasks = sortTasksForAttention(tasks.filter(isOpenTask)).slice(0, 5);
  const unreadMail = threads.filter((thread) => thread.unread).slice(0, 5);
  const unreadNotifications = notifications.filter((notification) => !notification.readAt).slice(0, 5);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Panel eyebrow="Mailbox" title="Unread internal mail">
        <div className="space-y-2">
          {unreadMail.length ? unreadMail.map((thread) => <MailSummaryLink key={thread.id} thread={thread} />) : <EmptyState icon={Inbox} title="No unread mail" body="New internal email will appear here." compact />}
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel eyebrow="Assigned" title="Needs attention">
          <div className="space-y-3">
            {attentionTasks.length ? attentionTasks.map((task) => <TaskRow key={task.id} task={task} />) : <EmptyState icon={CheckCircle2} title="No urgent assigned work" body="Your open tasks are clear for this view." compact />}
          </div>
        </Panel>
        <Panel eyebrow="Signals" title="Notifications">
          <div className="space-y-2">
            {unreadNotifications.length ? unreadNotifications.map((item) => <NotificationItem key={item.id} notification={item} />) : <EmptyState icon={Bell} title="No unread notifications" body="Workspace signals will appear here." compact />}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StarredView({ tasks, threads }: { tasks: Task[]; threads: InternalMailThread[] }) {
  const highPriorityTasks = sortTasksForAttention(tasks.filter((task) => isOpenTask(task) && (task.priority === "CRITICAL" || task.priority === "URGENT" || task.priority === "HIGH"))).slice(0, 8);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel eyebrow="Starred mail" title="Important internal email" className="min-h-[560px]">
        <div className="space-y-2">
          {threads.length ? threads.map((thread) => <MailSummaryLink key={thread.id} thread={thread} />) : <EmptyState icon={Star} title="No starred mail yet" body="Star internal email to keep it close." />}
        </div>
      </Panel>
      <Panel eyebrow="Watched work" title="Priority tasks" className="min-h-[560px]">
        <div className="space-y-3">
          {highPriorityTasks.length ? highPriorityTasks.map((task) => <TaskRow key={task.id} task={task} />) : <EmptyState icon={Target} title="No high-priority tasks" body="Important assigned work will appear here." />}
        </div>
      </Panel>
    </div>
  );
}

function MyTasksView({ tasks }: { tasks: Task[] }) {
  const [filter, setFilter] = useState<"all" | "open" | "done" | "overdue">("open");
  const filteredTasks = useMemo(() => {
    if (filter === "all") return tasks;
    if (filter === "done") return tasks.filter((task) => !isOpenTask(task));
    if (filter === "overdue") return tasks.filter((task) => isOpenTask(task) && isTaskOverdue(task));
    return tasks.filter(isOpenTask);
  }, [filter, tasks]);

  const filters: Array<{ key: typeof filter; label: string; count: number }> = [
    { key: "open", label: "Open", count: tasks.filter(isOpenTask).length },
    { key: "overdue", label: "Overdue", count: tasks.filter((task) => isOpenTask(task) && isTaskOverdue(task)).length },
    { key: "done", label: "Done", count: tasks.filter((task) => !isOpenTask(task)).length },
    { key: "all", label: "All", count: tasks.length },
  ];

  return (
    <Panel eyebrow="Assigned work" title="My Tasks" className="min-h-[640px]">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-black transition",
              filter === item.key ? "border-[#111111] bg-[#111111] text-white" : "border-line bg-panel hover:border-primary hover:bg-primary/10",
            )}
          >
            {item.label}
            <span className={cn("rounded-lg px-1.5 py-0.5 text-[11px]", filter === item.key ? "bg-white/10 text-primary" : "bg-[#f4f1e8] text-ink-soft")}>
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        {filteredTasks.length ? filteredTasks.map((task) => <TaskRow key={task.id} task={task} wide />) : <EmptyState icon={CheckCircle2} title="No tasks in this view" body="Change the filter to inspect more assigned work." />}
      </div>
    </Panel>
  );
}

function MailSummaryLink({ thread }: { thread: InternalMailThread }) {
  return (
    <Link
      href={`/work-hub/inbox?thread=${thread.id}`}
      className="flex items-center gap-3 rounded-2xl border border-line bg-[#fffefa] p-3 transition hover:border-primary hover:bg-primary/10"
    >
      <Avatar user={thread.latestMessage?.sender ?? thread.createdBy} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-foreground">{thread.subject}</span>
        <span className="mt-0.5 line-clamp-1 text-xs font-semibold text-ink-soft">{mailPreview(thread)}</span>
      </span>
      <span className="text-xs font-black text-ink-soft">{formatMailTime(thread.lastMessageAt)}</span>
    </Link>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <Link
      href={notificationHref(notification)}
      className="flex items-start gap-3 rounded-2xl border border-line bg-[#fffefa] p-3 transition hover:border-primary hover:bg-primary/10"
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/25 text-[#111111]">
        <Bell className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block line-clamp-1 text-sm font-black text-foreground">{notification.title}</span>
        <span className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-ink-soft">{notification.body || "Workspace notification"}</span>
      </span>
    </Link>
  );
}

function TaskRow({ task, wide = false }: { task: Task; wide?: boolean }) {
  const assignee = task.assignees?.[0]?.user ?? null;
  return (
    <Link
      href={`/tasks/${task.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-line bg-[#fffefa] p-3 transition hover:border-primary hover:bg-primary/10",
        wide && "sm:p-4",
      )}
    >
      <span className={cn("h-12 w-1.5 shrink-0 rounded-full", taskPriorityRail(task.priority))} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-line bg-panel px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">
            {task.key}
          </span>
          <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]", taskStatusTone(task.status))}>
            {taskStatusLabels[task.status] ?? task.status}
          </span>
          <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]", taskPriorityTone(task.priority))}>
            {priorityLabels[task.priority] ?? task.priority}
          </span>
        </div>
        <p className="mt-2 line-clamp-1 text-sm font-black text-foreground">{task.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-soft">
          <span>{task.project?.name ?? "No project"}</span>
          <span className="text-line">/</span>
          <span>{task.dueDate ? formatShortDate(task.dueDate) : "No due date"}</span>
          <span className="text-line">/</span>
          <span>{assignee ? displayUser(assignee) : "Unassigned"}</span>
        </div>
      </div>
      <Avatar user={assignee} />
    </Link>
  );
}

function ToolbarButton({
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-xl border border-transparent px-2.5 text-sm font-black text-[#334155] transition hover:border-line hover:bg-[#fff7bf] disabled:cursor-not-allowed disabled:text-[#94a3b8] disabled:hover:border-transparent disabled:hover:bg-transparent"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function Panel({ children, className, eyebrow, title }: { children: ReactNode; className?: string; eyebrow: string; title: string }) {
  return (
    <section className={cn("overflow-hidden rounded-3xl border border-line bg-panel shadow-sm", className)}>
      <div className="border-b border-line px-5 py-4">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-ink-soft">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-black text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyState({ body, compact = false, icon: Icon, title }: { body: string; compact?: boolean; icon: LucideIcon; title: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-[#fffefa] px-5 text-center", compact ? "py-8" : "min-h-[260px] py-10")}>
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/20 text-[#111111]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-black text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-ink-soft">{body}</p>
    </div>
  );
}

function Avatar({ user }: { user?: UserSummary | null }) {
  if (user?.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover ring-1 ring-line" />;
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#d6dce7] text-[11px] font-black text-[#334155]">
      {workspaceUserInitials(user)}
    </span>
  );
}

function mailboxCount(folders: InternalMailFolderSummary, mailbox: MailboxMode) {
  if (mailbox.key === "PINNED") return folders.pinned;
  if (mailbox.key === "STARRED") return folders.starred;
  if (mailbox.key === "FLAGGED") return folders.flagged;
  return "folder" in mailbox ? folders.counts[mailbox.folder] ?? 0 : 0;
}

function MailboxIcon({ className, modeKey }: { className?: string; modeKey: MailboxMode["key"] }) {
  if (modeKey === "SENT") return <Send className={className} aria-hidden="true" />;
  if (modeKey === "DRAFTS") return <FileText className={className} aria-hidden="true" />;
  if (modeKey === "ARCHIVE") return <Archive className={className} aria-hidden="true" />;
  if (modeKey === "DELETED") return <Trash2 className={className} aria-hidden="true" />;
  if (modeKey === "JUNK") return <ShieldAlert className={className} aria-hidden="true" />;
  if (modeKey === "PINNED") return <Pin className={className} aria-hidden="true" />;
  if (modeKey === "STARRED") return <Star className={className} aria-hidden="true" />;
  if (modeKey === "FLAGGED") return <Flag className={className} aria-hidden="true" />;
  if (modeKey === "SNOOZED") return <Clock3 className={className} aria-hidden="true" />;
  return <Inbox className={className} aria-hidden="true" />;
}

function groupRecipients(recipients: InternalMailRecipient[] = []) {
  const visible = recipients.filter((recipient) => recipient.kind !== "BCC");
  return {
    cc: visible.filter((recipient) => recipient.kind === "CC").map((recipient) => displayUser(recipient.user)).join(", "),
    to: visible.filter((recipient) => recipient.kind === "TO").map((recipient) => displayUser(recipient.user)).join(", "),
  };
}

function displayUser(user?: UserSummary | null) {
  if (!user) return "";
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
}

function mailboxInitials(mailbox: InternalMailbox) {
  const source = mailbox.displayName || mailbox.localPart || mailbox.address;
  const parts = source
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  return `${parts[0]?.[0] ?? "M"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function mailPreview(thread: InternalMailThread) {
  return thread.latestMessage?.bodyText?.replace(/\s+/g, " ").trim() || "No body";
}

function sanitizeMailHtml(input?: string | null) {
  if (!input) return "";
  const allowedTags = new Set([
    "a",
    "b",
    "blockquote",
    "br",
    "div",
    "em",
    "font",
    "h2",
    "h3",
    "hr",
    "i",
    "li",
    "ol",
    "p",
    "s",
    "span",
    "strike",
    "strong",
    "u",
    "ul",
  ]);
  const voidTags = new Set(["br", "hr"]);
  const allowedStyles = new Set([
    "background-color",
    "color",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "margin-left",
    "text-align",
    "text-decoration",
  ]);

  function safeStyle(attrs: string) {
    const styleMatch = attrs.match(/\s+style\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const raw = styleMatch?.[2] ?? styleMatch?.[3] ?? styleMatch?.[4] ?? "";
    if (!raw) return "";
    const rules = raw
      .split(";")
      .map((rule) => rule.trim())
      .map((rule) => {
        const [name, ...valueParts] = rule.split(":");
        const property = name?.trim().toLowerCase();
        const value = valueParts.join(":").trim();
        if (!property || !value || !allowedStyles.has(property)) return "";
        if (/url\s*\(|expression\s*\(|javascript:/i.test(value)) return "";
        if (!/^[#(),.%\w\s-]+$/.test(value)) return "";
        return `${property}: ${value}`;
      })
      .filter(Boolean);
    return rules.length ? ` style="${rules.join("; ")}"` : "";
  }

  function safeFontAttributes(attrs: string) {
    const output: string[] = [];
    const color = attrs.match(/\s+color\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const face = attrs.match(/\s+face\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const size = attrs.match(/\s+size\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const colorValue = color?.[2] ?? color?.[3] ?? color?.[4] ?? "";
    const faceValue = face?.[2] ?? face?.[3] ?? face?.[4] ?? "";
    const sizeValue = size?.[2] ?? size?.[3] ?? size?.[4] ?? "";
    if (/^#[0-9a-f]{3,8}$/i.test(colorValue) || /^[a-z]+$/i.test(colorValue)) output.push(`color="${colorValue}"`);
    if (/^[\w\s,-]+$/.test(faceValue)) output.push(`face="${faceValue}"`);
    if (/^[1-7]$/.test(sizeValue)) output.push(`size="${sizeValue}"`);
    return output.length ? ` ${output.join(" ")}` : "";
  }

  return input
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<(\/?)([a-z0-9]+)([^>]*)>/gi, (match, closing: string, tagName: string, attrs: string) => {
      const tag = tagName.toLowerCase();
      if (!allowedTags.has(tag)) return "";
      if (voidTags.has(tag)) return `<${tag}>`;
      if (closing) return `</${tag}>`;
      if (tag === "font") return `<font${safeFontAttributes(attrs)}>`;
      if (tag !== "a") return `<${tag}${safeStyle(attrs)}>`;

      const hrefMatch = attrs.match(/\s+href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawHref = hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? "";
      const href = rawHref.trim();
      const safeHref = /^(https?:\/\/|mailto:)/i.test(href) ? href.replace(/"/g, "%22") : "#";
      return `<a href="${safeHref}" target="_blank" rel="noreferrer"${safeStyle(attrs)}>`;
    });
}

function notificationHref(notification: Notification) {
  const data = notification.data ?? {};
  const internalMailThreadId = typeof data.internalMailThreadId === "string" ? data.internalMailThreadId : "";
  const projectId = typeof data.projectId === "string" ? data.projectId : "";
  const taskId = typeof data.taskId === "string" ? data.taskId : "";
  if (internalMailThreadId) return `/work-hub/inbox?thread=${internalMailThreadId}`;
  if (taskId) return `/tasks/${taskId}`;
  if (projectId) return `/projects/${projectId}`;
  return "/work-hub/for-you";
}

function isTaskOverdue(task: Task) {
  if (!task.dueDate || !isOpenTask(task)) return false;
  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

function formatMailTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", weekday: "short" }).format(date);
}

function formatMailDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function taskPriorityRail(priority: Task["priority"]) {
  if (priority === "CRITICAL" || priority === "URGENT") return "bg-red-500";
  if (priority === "HIGH") return "bg-amber-500";
  if (priority === "LOW") return "bg-blue-500";
  return "bg-emerald-500";
}

function taskPriorityTone(priority: Task["priority"]) {
  if (priority === "CRITICAL" || priority === "URGENT") return "bg-red-50 text-red-700";
  if (priority === "HIGH") return "bg-amber-50 text-amber-700";
  if (priority === "LOW") return "bg-blue-50 text-blue-700";
  return "bg-emerald-50 text-emerald-700";
}

function taskStatusTone(status: Task["status"]) {
  if (status === "DONE") return "bg-emerald-50 text-emerald-700";
  if (status === "IN_PROGRESS" || status === "REVIEW" || status === "TESTING") return "bg-blue-50 text-blue-700";
  if (status === "CANCELLED") return "bg-red-50 text-red-700";
  return "bg-[#f4f1e8] text-ink-soft";
}
