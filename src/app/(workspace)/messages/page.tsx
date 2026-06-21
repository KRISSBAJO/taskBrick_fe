"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Check,
  CheckCheck,
  Edit3,
  FileText,
  Forward,
  Image as ImageIcon,
  Link2,
  Loader2,
  MessageCircle,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRealtime } from "@/components/realtime-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  addMessageReaction,
  createConversation,
  createFileAsset,
  createUploadIntent,
  deleteConversation,
  deleteMessage,
  forwardMessage,
  listConversations,
  listMessages,
  listPinnedMessages,
  listUsers,
  markMessageRead,
  pinMessage,
  removeMessageReaction,
  sendMessage,
  unpinMessage,
  updateMessage,
  type Conversation,
  type Message,
  type MessageAttachment,
  type MessageReaction,
  type TenantUser,
  type UploadIntent,
  type UserSummary,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { userInitials } from "@/lib/workspace-ui";

const quickReactions = ["👍", "✅", "👀", "🔥"];

const MESSAGE_PAGE_LIMIT = 60;
const messageFilters = [
  { id: "all", label: "All" },
  { id: "pinned", label: "Pinned" },
  { id: "attachments", label: "Files" },
  { id: "mine", label: "Mine" },
] as const;

type MessageFilter = typeof messageFilters[number]["id"];

export default function MessagesPage() {
  const { auth, user }       = useWorkspaceAuth();
  const { emit, off, on, status } = useRealtime();
  const { toast }            = useToast();
  const typingTimeout        = useRef<number | null>(null);
  const messageEndRef        = useRef<HTMLDivElement | null>(null);
  const composerRef          = useRef<HTMLTextAreaElement | null>(null);
  const attachmentFileRef    = useRef<HTMLInputElement | null>(null);

  const [conversations,            setConversations]            = useState<Conversation[]>([]);
  const [users,                    setUsers]                    = useState<TenantUser[]>([]);
  const [activeConversationId,     setActiveConversationId]     = useState("");
  const [messages,                 setMessages]                 = useState<Message[]>([]);
  const [conversationSearch,       setConversationSearch]       = useState("");
  const [messageSearch,            setMessageSearch]            = useState("");
  const [composer,                 setComposer]                 = useState("");
  const [loadingConversations,     setLoadingConversations]     = useState(true);
  const [loadingMessages,          setLoadingMessages]          = useState(false);
  const [sending,                  setSending]                  = useState(false);
  const [showNewConversation,      setShowNewConversation]      = useState(false);
  const [editingMessageId,         setEditingMessageId]         = useState("");
  const [editBody,                 setEditBody]                 = useState("");
  const [deleteTarget,             setDeleteTarget]             = useState<Message | null>(null);
  const [deleteConversationTarget, setDeleteConversationTarget] = useState<Conversation | null>(null);
  const [typingUsers,              setTypingUsers]              = useState<Set<string>>(new Set());
  const [messagePage,              setMessagePage]              = useState(1);
  const [hasOlderMessages,         setHasOlderMessages]         = useState(false);
  const [loadingOlder,             setLoadingOlder]             = useState(false);
  const [pinnedMessages,           setPinnedMessages]           = useState<Message[]>([]);
  const [replyTarget,              setReplyTarget]              = useState<Message | null>(null);
  const [forwardTarget,            setForwardTarget]            = useState<Message | null>(null);
  const [forwardConversationIds,   setForwardConversationIds]   = useState<Set<string>>(new Set());
  const [attachmentDraft,          setAttachmentDraft]          = useState<MessageAttachment[]>([]);
  const [showAttachmentPanel,      setShowAttachmentPanel]      = useState(false);
  const [attachmentUrl,            setAttachmentUrl]            = useState("");
  const [attachmentName,           setAttachmentName]           = useState("");
  const [uploadingAttachment,       setUploadingAttachment]       = useState(false);
  const [messageFilter,            setMessageFilter]            = useState<MessageFilter>("all");

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;
  const usersById          = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const activeTitle        = activeConversation ? conversationTitle(activeConversation, user.id) : "Messages";
  const activeMembers      = activeConversation?.members ?? [];
  const messagesById       = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);

  /* ── Data loading ──────────────────────────────────────────── */

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const page = await listConversations(auth.accessToken, { limit: 100, search: conversationSearch.trim() || undefined });
      setConversations(page.data);
      setActiveConversationId((cur) => {
        const urlId = readConversationIdFromUrl();
        if (urlId && page.data.some((c) => c.id === urlId)) return urlId;
        if (page.data.some((c) => c.id === cur)) return cur;
        return page.data[0]?.id ?? "";
      });
    } catch (err) {
      toast({ title: "Conversations unavailable", description: err instanceof Error ? err.message : "Unable to load.", variant: "error" });
    } finally { setLoadingConversations(false); }
  }, [auth.accessToken, conversationSearch, toast]);

  const loadMessages = useCallback(async (
    conversationId = activeConversationId,
    pageNumber = 1,
    mode: "replace" | "prepend" = "replace",
  ) => {
    if (!conversationId) {
      setMessages([]);
      setPinnedMessages([]);
      setHasOlderMessages(false);
      setMessagePage(1);
      return;
    }
    if (mode === "replace") setLoadingMessages(true);
    else setLoadingOlder(true);
    try {
      const page    = await listMessages(auth.accessToken, conversationId, { limit: MESSAGE_PAGE_LIMIT, page: pageNumber, search: messageSearch.trim() || undefined });
      const ordered = [...page.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages((current) => mode === "prepend" ? mergeMessages(ordered, current) : ordered);
      setMessagePage(page.page);
      setHasOlderMessages(page.page < page.totalPages);
      void markVisibleMessagesRead(auth.accessToken, ordered, user.id);
    } catch (err) {
      toast({ title: "Messages unavailable", description: err instanceof Error ? err.message : "Unable to load.", variant: "error" });
    } finally {
      if (mode === "replace") setLoadingMessages(false);
      else setLoadingOlder(false);
    }
  }, [activeConversationId, auth.accessToken, messageSearch, toast, user.id]);

  const loadPinned = useCallback(async (conversationId = activeConversationId) => {
    if (!conversationId) {
      setPinnedMessages([]);
      return;
    }
    try {
      const pinned = await listPinnedMessages(auth.accessToken, conversationId);
      setPinnedMessages(pinned);
    } catch {
      setPinnedMessages([]);
    }
  }, [activeConversationId, auth.accessToken]);

  useEffect(() => { const t = window.setTimeout(() => void loadConversations(), 200); return () => window.clearTimeout(t); }, [loadConversations]);
  useEffect(() => { const t = window.setTimeout(() => { listUsers(auth.accessToken, { limit: 100 }).then((p) => setUsers(p.data)).catch(() => setUsers([])); }, 0); return () => window.clearTimeout(t); }, [auth.accessToken]);
  useEffect(() => { const t = window.setTimeout(() => void loadMessages(activeConversationId), 120); return () => window.clearTimeout(t); }, [activeConversationId, loadMessages]);
  useEffect(() => { const t = window.setTimeout(() => void loadPinned(activeConversationId), 120); return () => window.clearTimeout(t); }, [activeConversationId, loadPinned]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReplyTarget(null);
      setForwardTarget(null);
      setForwardConversationIds(new Set());
      setAttachmentDraft([]);
      setShowAttachmentPanel(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeConversationId]);
  useEffect(() => { messageEndRef.current?.scrollIntoView({ block: "end" }); }, [messages.length, activeConversationId]);

  /* ── Realtime ──────────────────────────────────────────────── */

  useEffect(() => {
    if (!activeConversationId) return undefined;
    emit("conversation.join", { conversationId: activeConversationId });
    window.history.replaceState(null, "", `/messages?conversation=${activeConversationId}`);

    function onMessageCreated(message: Message) {
      if (message.conversationId !== activeConversationId) return;
      setMessages((cur) => appendMessage(cur, message));
      if (message.pinnedAt) setPinnedMessages((cur) => appendMessage(cur, message));
      setTypingUsers((cur) => { const s = new Set(cur); s.delete(message.senderId); return s; });
      if (message.senderId !== user.id) void markMessageRead(auth.accessToken, message.id);
      void loadConversations();
    }
    function onMessageUpdated(message: Message) {
      if (message.conversationId !== activeConversationId) return;
      setMessages((cur) => cur.map((m) => m.id === message.id ? { ...m, ...message } : m));
      setPinnedMessages((cur) => message.pinnedAt
        ? appendMessage(cur.filter((m) => m.id !== message.id), message).sort((a, b) => new Date(b.pinnedAt ?? b.createdAt).getTime() - new Date(a.pinnedAt ?? a.createdAt).getTime())
        : cur.filter((m) => m.id !== message.id));
      void loadConversations();
    }
    function onMessageDeleted(payload: { conversationId?: string; messageId?: string }) {
      if (payload.conversationId !== activeConversationId || !payload.messageId) return;
      setMessages((cur) => cur.filter((m) => m.id !== payload.messageId));
      setPinnedMessages((cur) => cur.filter((m) => m.id !== payload.messageId));
      void loadConversations();
    }
    function onReactionUpdated(payload: { conversationId?: string; messageId?: string; removed?: boolean; reaction?: MessageReaction; userId?: string; emoji?: string }) {
      if (payload.conversationId !== activeConversationId || !payload.messageId) return;
      setMessages((cur) => cur.map((m) => {
        if (m.id !== payload.messageId) return m;
        if (payload.removed) return { ...m, reactions: (m.reactions ?? []).filter((r) => !(r.userId === payload.userId && r.emoji === payload.emoji)) };
        if (!payload.reaction) return m;
        return { ...m, reactions: [...(m.reactions ?? []).filter((r) => r.id !== payload.reaction!.id), payload.reaction] };
      }));
    }
    function onTypingStarted(payload: { conversationId?: string; userId?: string }) {
      if (payload.conversationId !== activeConversationId || !payload.userId || payload.userId === user.id) return;
      setTypingUsers((cur) => new Set(cur).add(payload.userId!));
    }
    function onTypingStopped(payload: { conversationId?: string; userId?: string }) {
      if (payload.conversationId !== activeConversationId || !payload.userId) return;
      setTypingUsers((cur) => { const s = new Set(cur); s.delete(payload.userId!); return s; });
    }

    on("message.created",          onMessageCreated);
    on("message.updated",          onMessageUpdated);
    on("message.deleted",          onMessageDeleted);
    on("message.reaction.updated", onReactionUpdated);
    on("typing.started",           onTypingStarted);
    on("typing.stopped",           onTypingStopped);

    return () => {
      emit("conversation.leave", { conversationId: activeConversationId });
      off("message.created",          onMessageCreated);
      off("message.updated",          onMessageUpdated);
      off("message.deleted",          onMessageDeleted);
      off("message.reaction.updated", onReactionUpdated);
      off("typing.started",           onTypingStarted);
      off("typing.stopped",           onTypingStopped);
    };
  }, [activeConversationId, auth.accessToken, emit, loadConversations, off, on, user.id]);

  /* ── Handlers ──────────────────────────────────────────────── */

  async function onSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = composer.trim();
    if (!activeConversationId || (!body && !attachmentDraft.length)) return;
    setSending(true); stopTyping();
    try {
      const created = await sendMessage(auth.accessToken, activeConversationId, {
        body,
        attachments: attachmentDraft.length ? attachmentDraft : undefined,
        parentMessageId: replyTarget?.id,
      });
      setComposer("");
      setReplyTarget(null);
      setAttachmentDraft([]);
      setShowAttachmentPanel(false);
      setMessages((cur) => appendMessage(cur, created));
      void loadConversations();
    } catch (err) { toast({ title: "Message not sent", description: err instanceof Error ? err.message : "Please try again.", variant: "error" }); }
    finally { setSending(false); }
  }

  function onComposerChange(value: string) {
    setComposer(value);
    if (!activeConversationId) return;
    emit("typing.start", { conversationId: activeConversationId });
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => stopTyping(), 1200);
  }

  function onComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  function stopTyping() {
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = null;
    if (activeConversationId) emit("typing.stop", { conversationId: activeConversationId });
  }

  async function onCreateConversation(payload: { title?: string; isGroup: boolean; memberIds: string[] }) {
    try {
      const created = await createConversation(auth.accessToken, payload);
      setShowNewConversation(false);
      setConversations((cur) => [created, ...cur.filter((c) => c.id !== created.id)]);
      setActiveConversationId(created.id);
      toast({ title: "Conversation created", variant: "success" });
    } catch (err) { toast({ title: "Unable to create conversation", description: err instanceof Error ? err.message : "Please try again.", variant: "error" }); }
  }

  async function onSaveEdit(message: Message) {
    const body = editBody.trim(); if (!body) return;
    try {
      const updated = await updateMessage(auth.accessToken, message.id, { body });
      setMessages((cur) => cur.map((m) => m.id === message.id ? { ...m, ...updated } : m));
      setEditingMessageId(""); setEditBody(""); toast({ title: "Message updated", variant: "success" });
    } catch (err) { toast({ title: "Unable to update message", description: err instanceof Error ? err.message : "Please try again.", variant: "error" }); }
  }

  async function onDeleteMessage() {
    if (!deleteTarget) return;
    try {
      await deleteMessage(auth.accessToken, deleteTarget.id);
      setMessages((cur) => cur.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null); toast({ title: "Message deleted", variant: "success" });
    } catch (err) { toast({ title: "Unable to delete message", description: err instanceof Error ? err.message : "Please try again.", variant: "error" }); }
  }

  async function onDeleteConversation() {
    if (!deleteConversationTarget) return;
    try {
      await deleteConversation(auth.accessToken, deleteConversationTarget.id);
      setConversations((cur) => cur.filter((c) => c.id !== deleteConversationTarget.id));
      if (activeConversationId === deleteConversationTarget.id) { setActiveConversationId(""); setMessages([]); window.history.replaceState(null, "", "/messages"); }
      setDeleteConversationTarget(null); toast({ title: "Conversation deleted", variant: "success" });
    } catch (err) { toast({ title: "Unable to delete conversation", description: err instanceof Error ? err.message : "Please try again.", variant: "error" }); }
  }

  async function onReact(message: Message, emoji: string) {
    const mine = message.reactions?.some((r) => r.userId === user.id && r.emoji === emoji);
    try {
      if (mine) {
        await removeMessageReaction(auth.accessToken, message.id, emoji);
        setMessages((cur) => cur.map((m) => m.id === message.id ? { ...m, reactions: (m.reactions ?? []).filter((r) => !(r.userId === user.id && r.emoji === emoji)) } : m));
      } else {
        const reaction = await addMessageReaction(auth.accessToken, message.id, emoji);
        setMessages((cur) => cur.map((m) => m.id === message.id ? { ...m, reactions: [...(m.reactions ?? []).filter((r) => r.id !== reaction.id), reaction] } : m));
      }
    } catch (err) { toast({ title: "Reaction failed", description: err instanceof Error ? err.message : "Please try again.", variant: "error" }); }
  }

  async function onLoadOlderMessages() {
    if (!activeConversationId || !hasOlderMessages || loadingOlder) return;
    await loadMessages(activeConversationId, messagePage + 1, "prepend");
  }

  async function onTogglePin(message: Message) {
    try {
      const updated = message.pinnedAt
        ? await unpinMessage(auth.accessToken, message.id)
        : await pinMessage(auth.accessToken, message.id);
      setMessages((cur) => cur.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      setPinnedMessages((cur) => updated.pinnedAt
        ? appendMessage(cur.filter((item) => item.id !== updated.id), updated).sort((a, b) => new Date(b.pinnedAt ?? b.createdAt).getTime() - new Date(a.pinnedAt ?? a.createdAt).getTime())
        : cur.filter((item) => item.id !== updated.id));
      toast({ title: updated.pinnedAt ? "Message pinned" : "Message unpinned", variant: "success" });
    } catch (err) {
      toast({ title: "Pin action failed", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    }
  }

  async function onForwardMessage() {
    if (!forwardTarget || !forwardConversationIds.size) return;
    try {
      const result = await forwardMessage(auth.accessToken, forwardTarget.id, {
        conversationIds: [...forwardConversationIds],
        includeAttachments: true,
        metadata: { source: "messages.workspace" },
      });
      if (result.data.some((message) => message.conversationId === activeConversationId)) {
        setMessages((cur) => mergeMessages(cur, result.data.filter((message) => message.conversationId === activeConversationId)));
      }
      setForwardTarget(null);
      setForwardConversationIds(new Set());
      void loadConversations();
      toast({ title: `Forwarded to ${result.forwarded} conversation${result.forwarded === 1 ? "" : "s"}`, variant: "success" });
    } catch (err) {
      toast({ title: "Message not forwarded", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    }
  }

  function onStartForward(message: Message) {
    setForwardTarget(message);
    setForwardConversationIds(new Set(activeConversationId ? [activeConversationId] : []));
  }

  function onAddAttachment() {
    const url = attachmentUrl.trim();
    if (!url) return;
    const attachment: MessageAttachment = {
      id: createLocalId(),
      name: attachmentName.trim() || fileNameFromUrl(url),
      url,
      mimeType: guessMimeType(url),
      kind: attachmentKind(url),
    };
    setAttachmentDraft((current) => [...current, attachment]);
    setAttachmentUrl("");
    setAttachmentName("");
  }

  async function onUploadAttachment(file?: File) {
    if (!file || !activeConversationId || uploadingAttachment) return;
    setUploadingAttachment(true);
    try {
      const intent = await createUploadIntent(auth.accessToken, {
        entityType: "CONVERSATION",
        entityId: activeConversationId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        scope: "CHAT",
        sizeBytes: file.size,
        visibility: "TEAM",
      });
      const fileUrl = await uploadWithIntent(intent, file);
      const asset = await createFileAsset(auth.accessToken, {
        entityType: "CONVERSATION",
        entityId: activeConversationId,
        fileName: file.name,
        fileUrl,
        storageKey: intent.storageKey,
        provider: intent.provider,
        mimeType: file.type || intent.mimeType || undefined,
        sizeBytes: file.size,
        scope: "CHAT",
        visibility: "TEAM",
        metadata: { source: "messages-composer", conversationId: activeConversationId },
      });
      setAttachmentDraft((current) => [
        ...current,
        {
          id: asset.id,
          name: asset.fileName,
          url: asset.fileUrl,
          mimeType: asset.mimeType ?? file.type ?? undefined,
          sizeBytes: asset.sizeBytes ?? file.size,
          kind: attachmentKindFromMime(asset.fileUrl, asset.mimeType ?? file.type),
        },
      ]);
      setShowAttachmentPanel(false);
      toast({ title: "File ready to send", description: asset.fileName, variant: "success" });
    } catch (err) {
      toast({ title: "Upload unavailable", description: err instanceof Error ? err.message : "Please try another file or paste a link.", variant: "error" });
    } finally {
      setUploadingAttachment(false);
      if (attachmentFileRef.current) attachmentFileRef.current.value = "";
    }
  }

  function onRemoveAttachment(id?: string) {
    setAttachmentDraft((current) => current.filter((attachment) => attachment.id !== id));
  }

  function toggleForwardConversation(id: string) {
    setForwardConversationIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const typingText = [...typingUsers].map((id) => usersById.get(id)).filter(Boolean).map((u) => displayName(u!)).slice(0, 2).join(", ");

  /* ── Message groups (consecutive same-sender + date breaks) ── */

  const filteredMessages = useMemo(() => {
    if (messageFilter === "pinned") return messages.filter((message) => Boolean(message.pinnedAt));
    if (messageFilter === "attachments") return messages.filter((message) => messageAttachments(message).length > 0);
    if (messageFilter === "mine") return messages.filter((message) => message.senderId === user.id);
    return messages;
  }, [messageFilter, messages, user.id]);

  const messageGroups = useMemo(() => buildMessageGroups(filteredMessages), [filteredMessages]);

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div className="grid h-[calc(100dvh-7rem)] min-h-[560px] max-h-[920px] overflow-hidden rounded-2xl border border-line bg-panel shadow-sm lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_260px]">

      {/* ── Left: conversation list (dark) ─────────────────────── */}
      <aside
        className="flex min-h-0 flex-col border-r border-white/[0.07]"
        style={{ background: "linear-gradient(180deg,#0f1117 0%,#101318 100%)" }}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-white/[0.07] px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/80">Messages</p>
              <h1 className="text-[16px] font-black text-white">Team chat</h1>
            </div>
            <button
              type="button"
              onClick={() => setShowNewConversation(true)}
              className="tb-yellow-button flex size-8 items-center justify-center rounded-xl"
              aria-label="New conversation"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/25" />
            <input
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder="Search…"
              className="h-8 w-full rounded-xl border border-white/[0.09] bg-white/[0.06] pl-9 pr-3 text-[12px] text-white placeholder:text-white/25 transition focus:border-primary/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="min-h-0 flex-1 overflow-y-auto tb-scrollbar">
          {loadingConversations ? (
            <div className="grid gap-1.5 p-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-[60px] animate-pulse rounded-xl bg-white/[0.05]" style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
          ) : conversations.length ? (
            <div className="p-2">
              {conversations.map((conv) => (
                <ConversationRow
                  key={conv.id}
                  active={conv.id === activeConversationId}
                  conversation={conv}
                  currentUserId={user.id}
                  onDelete={() => setDeleteConversationTarget(conv)}
                  onSelect={() => setActiveConversationId(conv.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 p-6 text-center">
              <MessageCircle className="size-8 text-white/15" />
              <p className="text-[13px] font-black text-white/60">No conversations yet</p>
              <p className="text-[11px] text-white/30">Start a DM or create a group room.</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Middle: message thread ─────────────────────────────── */}
      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-background">
        {activeConversation ? (
          <>
            {/* Chat header */}
            <div className="flex min-h-[68px] shrink-0 flex-wrap items-center gap-3 border-b border-line bg-panel/80 px-4 py-3 backdrop-blur-sm">
              <AvatarStack conversation={activeConversation} currentUserId={user.id} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[14px] font-black text-foreground">{activeTitle}</h2>
                <p className="text-[11px] text-ink-soft">
                  {activeMembers.length} members
                  <span className={cn("ml-2 inline-flex items-center gap-1 text-[10px] font-bold", status === "connected" ? "text-emerald-600" : "text-amber-600")}>
                    <span className={cn("size-1.5 rounded-full", status === "connected" ? "bg-emerald-500" : "bg-amber-400")} />
                    {status === "connected" ? "Live" : "Reconnecting"}
                  </span>
                </p>
              </div>
              {/* Message search */}
              <div className="relative min-w-[160px] flex-1 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
                <input
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  placeholder="Search in chat"
                  className="h-8 w-full rounded-xl border border-line bg-background pl-9 pr-3 text-[12px] text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none sm:w-[200px]"
                />
              </div>
              <div className="flex h-8 items-center rounded-xl border border-line bg-background p-0.5">
                {messageFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setMessageFilter(filter.id)}
                    className={cn(
                      "h-7 rounded-lg px-2 text-[11px] font-black transition",
                      messageFilter === filter.id ? "bg-[#111111] text-white" : "text-ink-soft hover:bg-panel-muted hover:text-foreground",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void loadMessages(activeConversation.id)}
                className="flex size-8 items-center justify-center rounded-xl border border-line bg-background text-ink-soft transition hover:bg-panel-muted hover:text-foreground"
              >
                <RefreshCw className={cn("size-3.5", loadingMessages && "animate-spin")} />
              </button>
            </div>

            {pinnedMessages.length ? (
              <div className="shrink-0 border-b border-line bg-[#111111] px-4 py-2 text-white">
                <div className="mx-auto flex max-w-3xl items-center gap-2 overflow-x-auto tb-scrollbar">
                  <span className="inline-flex h-8 shrink-0 items-center gap-2 rounded-xl bg-primary px-3 text-[11px] font-black text-[#111111]">
                    <Pin className="size-3.5" />Pinned
                  </span>
                  {pinnedMessages.slice(0, 4).map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => setMessageFilter("pinned")}
                      className="min-w-[190px] max-w-[260px] truncate rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-left text-[12px] font-bold text-white/80 transition hover:border-primary/50"
                    >
                      {message.body || messageAttachments(message)[0]?.name || "Pinned attachment"}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Message feed */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth px-4 py-5 tb-scrollbar">
              {loadingMessages ? (
                <div className="flex h-full min-h-[400px] items-center justify-center gap-2 text-[13px] font-bold text-ink-soft">
                  <Loader2 className="size-4 animate-spin" />Loading messages
                </div>
              ) : filteredMessages.length ? (
                <div className="mx-auto flex max-w-3xl flex-col gap-0.5 pb-2">
                  {hasOlderMessages && messageFilter === "all" ? (
                    <button
                      type="button"
                      onClick={onLoadOlderMessages}
                      disabled={loadingOlder}
                      className="mx-auto mb-3 inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-panel px-3 text-[12px] font-black text-foreground transition hover:bg-panel-muted disabled:opacity-55"
                    >
                      {loadingOlder ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                      Load older messages
                    </button>
                  ) : null}
                  {messageGroups.map((group) => (
                    <div key={group.key}>
                      {/* Date separator */}
                      {group.type === "date" ? (
                        <div className="my-4 flex items-center gap-3">
                          <div className="h-px flex-1 bg-line" />
                          <span className="rounded-full border border-line bg-panel px-3 py-0.5 text-[10px] font-black text-ink-soft">
                            {group.label}
                          </span>
                          <div className="h-px flex-1 bg-line" />
                        </div>
                      ) : (
                        <MessageBubble
                          currentUserId={user.id}
                          editing={editingMessageId === group.message.id}
                          editBody={editBody}
                          message={group.message}
                          parentMessage={group.message.parentMessageId ? messagesById.get(group.message.parentMessageId) ?? null : null}
                          showAvatar={group.showAvatar}
                          showSender={group.showSender}
                          onCancelEdit={() => { setEditingMessageId(""); setEditBody(""); }}
                          onChangeEdit={setEditBody}
                          onDelete={() => setDeleteTarget(group.message)}
                          onForward={() => onStartForward(group.message)}
                          onReply={() => { setReplyTarget(group.message); composerRef.current?.focus(); }}
                          onTogglePin={() => onTogglePin(group.message)}
                          onReact={(emoji) => onReact(group.message, emoji)}
                          onSaveEdit={() => onSaveEdit(group.message)}
                          onStartEdit={() => { setEditingMessageId(group.message.id); setEditBody(group.message.body ?? ""); }}
                        />
                      )}
                    </div>
                  ))}
                  {typingText ? <TypingIndicator text={`${typingText} is typing`} /> : null}
                  <div ref={messageEndRef} />
                </div>
              ) : (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 text-center">
                  <span
                    className="flex size-14 items-center justify-center rounded-2xl"
                    style={{ background: "linear-gradient(135deg,#0f1117 0%,#161b27 100%)" }}
                  >
                    <MessageCircle className="size-6 text-white/30" />
                  </span>
                  <div>
                    <p className="text-[14px] font-black text-foreground">{messages.length ? "No matching messages" : "No messages yet"}</p>
                    <p className="mt-1 text-[13px] text-ink-soft">{messages.length ? "Change the filter or search to widen the thread." : "Be the first to send a message."}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <form onSubmit={onSend} className="max-h-[270px] shrink-0 overflow-y-auto border-t border-line bg-panel p-3 tb-scrollbar">
              <div className="mx-auto grid max-w-3xl gap-2">
                {replyTarget ? (
                  <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
                    <Reply className="mt-0.5 size-4 shrink-0 text-[#111111]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#111111]/65">Replying to {displayName(replyTarget.sender)}</p>
                      <p className="truncate text-[12px] font-bold text-[#111111]">{replyTarget.body || messageAttachments(replyTarget)[0]?.name || "Attachment"}</p>
                    </div>
                    <button type="button" onClick={() => setReplyTarget(null)} className="flex size-7 items-center justify-center rounded-lg text-[#111111]/50 hover:bg-[#111111]/10 hover:text-[#111111]">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : null}

                {attachmentDraft.length ? (
                  <div className="flex gap-2 overflow-x-auto rounded-xl border border-line bg-background p-2 tb-scrollbar">
                    {attachmentDraft.map((attachment) => (
                      <AttachmentPreview key={attachment.id ?? attachment.url} attachment={attachment} onRemove={() => onRemoveAttachment(attachment.id)} />
                    ))}
                  </div>
                ) : null}

                {showAttachmentPanel ? (
                  <div className="grid gap-3 rounded-xl border border-line bg-background p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-line bg-panel px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-black text-foreground">Upload from this device</p>
                        <p className="text-[10px] font-bold text-ink-soft">Registered through TaskBricks files before the message is sent.</p>
                      </div>
                      <input
                        ref={attachmentFileRef}
                        type="file"
                        className="hidden"
                        onChange={(event) => void onUploadAttachment(event.target.files?.[0])}
                      />
                      <button
                        type="button"
                        onClick={() => attachmentFileRef.current?.click()}
                        disabled={uploadingAttachment || !activeConversationId}
                        className="tb-yellow-button inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[12px] font-black disabled:opacity-55"
                      >
                        {uploadingAttachment ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
                        {uploadingAttachment ? "Uploading" : "Choose file"}
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                    <input
                      value={attachmentUrl}
                      onChange={(event) => setAttachmentUrl(event.target.value)}
                      placeholder="Paste image, video, document, or link URL"
                      className="h-9 rounded-xl border border-line bg-panel px-3 text-[12px] font-semibold text-foreground outline-none focus:border-primary"
                    />
                    <input
                      value={attachmentName}
                      onChange={(event) => setAttachmentName(event.target.value)}
                      placeholder="Display name"
                      className="h-9 rounded-xl border border-line bg-panel px-3 text-[12px] font-semibold text-foreground outline-none focus:border-primary"
                    />
                    <button type="button" onClick={onAddAttachment} disabled={!attachmentUrl.trim()} className="tb-yellow-button h-9 rounded-xl px-3 text-[12px] font-black disabled:opacity-55">
                      Add link
                    </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttachmentPanel((current) => !current)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-background text-ink-soft transition hover:bg-panel-muted hover:text-foreground"
                >
                  <Paperclip className="size-4" />
                </button>
                <div className="relative flex-1">
                  <textarea
                    ref={composerRef}
                    value={composer}
                    onChange={(e) => onComposerChange(e.target.value)}
                    onKeyDown={onComposerKeyDown}
                    rows={1}
                    placeholder="Message your team  ·  Enter to send, Shift+Enter for newline"
                    className="max-h-36 min-h-[40px] w-full resize-none overflow-y-auto rounded-xl border border-line bg-background px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-ink-soft/60 transition focus:border-primary focus:outline-none tb-scrollbar"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || uploadingAttachment || (!composer.trim() && !attachmentDraft.length)}
                  className="tb-yellow-button flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[12px] font-black disabled:opacity-55"
                >
                  <Send className="size-3.5" />
                  Send
                </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 p-8 text-center">
            <span
              className="flex size-16 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg,#0f1117 0%,#161b27 100%)" }}
            >
              <MessageCircle className="size-7 text-white/30" />
            </span>
            <div>
              <h2 className="text-[15px] font-black text-foreground">Select a conversation</h2>
              <p className="mt-1 text-[13px] text-ink-soft">Pick a thread or start a new one.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewConversation(true)}
              className="tb-yellow-button inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-[13px] font-black"
            >
              <Plus className="size-4" />New conversation
            </button>
          </div>
        )}
      </section>

      {/* ── Right: conversation details ─────────────────────────── */}
      <aside className="hidden min-h-0 flex-col overflow-hidden border-l border-line bg-panel xl:flex">
        <ConversationDetails
          conversation={activeConversation}
          currentUserId={user.id}
          onTogglePin={onTogglePin}
          pinnedMessages={pinnedMessages}
        />
      </aside>

      {/* ── Modals ─────────────────────────────────────────────── */}
      {showNewConversation && (
        <NewConversationModal
          currentUserId={user.id}
          onClose={() => setShowNewConversation(false)}
          onCreate={onCreateConversation}
          users={users}
        />
      )}

      {forwardTarget && (
        <ForwardMessageModal
          conversations={conversations}
          currentUserId={user.id}
          message={forwardTarget}
          onClose={() => { setForwardTarget(null); setForwardConversationIds(new Set()); }}
          onForward={onForwardMessage}
          onToggleConversation={toggleForwardConversation}
          selectedConversationIds={forwardConversationIds}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this message?"
        description="The message will be removed from this conversation for every member."
        confirmLabel="Delete message"
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDeleteMessage}
      />
      <ConfirmDialog
        open={Boolean(deleteConversationTarget)}
        title="Delete conversation?"
        description="This removes the conversation and all messages for every member."
        confirmLabel="Delete conversation"
        onClose={() => setDeleteConversationTarget(null)}
        onConfirm={onDeleteConversation}
      />
    </div>
  );
}

/* ─── Conversation row (dark sidebar) ─────────────────────────────────────── */

function ConversationRow({ active, conversation, currentUserId, onDelete, onSelect }: {
  active: boolean;
  conversation: Conversation;
  currentUserId: string;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const latest = conversation.messages?.[0];
  const title  = conversationTitle(conversation, currentUserId);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl transition",
        active ? "bg-white/[0.10]" : "hover:bg-white/[0.05]",
      )}
    >
      {active && <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-primary" />}
      <button type="button" onClick={onSelect} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
        <AvatarStack conversation={conversation} currentUserId={currentUserId} dark />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-bold text-white">{title}</span>
            {conversation.isGroup && (
              <span className="shrink-0 rounded-md bg-white/[0.1] px-1.5 py-0.5 text-[8px] font-black text-white/50">GRP</span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-white/35">
            {latest?.body ?? `${conversation._count?.members ?? conversation.members.length} members`}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-[10px] text-white/25">
            {latest ? shortTime(latest.createdAt) : shortTime(conversation.createdAt)}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex size-6 items-center justify-center rounded-md text-white/20 opacity-0 transition hover:bg-red-950/60 hover:text-red-400 group-hover:opacity-100"
          >
            <Trash2 className="size-3" />
          </button>
        </span>
      </button>
    </article>
  );
}

/* ─── Message bubble ───────────────────────────────────────────────────────── */

function MessageBubble({ currentUserId, editing, editBody, message, parentMessage, showAvatar, showSender, onCancelEdit, onChangeEdit, onDelete, onForward, onReact, onReply, onSaveEdit, onStartEdit, onTogglePin }: {
  currentUserId: string;
  editing: boolean;
  editBody: string;
  message: Message;
  parentMessage?: Message | null;
  showAvatar: boolean;
  showSender: boolean;
  onCancelEdit: () => void;
  onChangeEdit: (v: string) => void;
  onDelete: () => void;
  onForward: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onSaveEdit: () => void;
  onStartEdit: () => void;
  onTogglePin: () => void;
}) {
  const mine            = message.senderId === currentUserId;
  const groupedReactions = groupReactions(message.reactions ?? [], currentUserId);
  const readCount       = message.readReceipts?.length ?? 0;
  const attachments     = messageAttachments(message);

  return (
    <article className={cn("group flex items-end gap-2", mine ? "flex-row-reverse" : "flex-row", showAvatar ? "mt-3" : "mt-0.5")}>
      {/* Avatar (left side only, other person's messages) */}
      {!mine ? (
        <div className="mb-0.5 w-8 shrink-0">
          {showAvatar ? (
            <span className="flex size-8 items-center justify-center rounded-full bg-[#111111] text-[9px] font-black text-white">
              {userInitials(message.sender)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className={cn("flex max-w-[min(600px,78%)] flex-col", mine ? "items-end" : "items-start")}>
        {/* Sender name (first in group, other's messages) */}
        {!mine && showSender && (
          <p className="mb-1 px-1 text-[10px] font-bold text-ink-soft">{displayName(message.sender)}</p>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "relative rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
            mine
              ? "rounded-br-sm bg-primary text-[#111111]"
              : "rounded-bl-sm border border-line bg-white text-foreground",
          )}
        >
          {editing ? (
            <div className="grid gap-2 min-w-[260px]">
              <textarea
                value={editBody}
                onChange={(e) => onChangeEdit(e.target.value)}
                rows={3}
                className="resize-none rounded-xl border border-line bg-background px-3 py-2 text-[13px] text-foreground focus:border-primary focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancelEdit} className="h-7 rounded-lg border border-line px-2.5 text-[11px] font-bold text-foreground">Cancel</button>
                <button type="button" onClick={onSaveEdit} className="h-7 rounded-lg bg-foreground px-2.5 text-[11px] font-black text-white">Save</button>
              </div>
            </div>
          ) : (
            <>
              {message.forwardedFromMessageId ? (
                <p className={cn("mb-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", mine ? "bg-[#111111]/10 text-[#111111]/55" : "bg-panel-muted text-ink-soft")}>
                  <Forward className="size-3" />Forwarded
                </p>
              ) : null}
              {message.pinnedAt ? (
                <p className={cn("mb-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]", mine ? "bg-[#111111]/10 text-[#111111]/55" : "bg-primary/20 text-[#111111]")}>
                  <Pin className="size-3" />Pinned
                </p>
              ) : null}
              {parentMessage ? (
                <div className={cn("mb-2 rounded-xl border-l-4 px-3 py-2", mine ? "border-[#111111]/25 bg-[#111111]/10" : "border-primary bg-primary/10")}>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] opacity-60">{displayName(parentMessage.sender)}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] font-semibold opacity-80">{parentMessage.body || messageAttachments(parentMessage)[0]?.name || "Attachment"}</p>
                </div>
              ) : message.parentMessageId ? (
                <div className={cn("mb-2 rounded-xl px-3 py-2 text-[12px] font-semibold opacity-70", mine ? "bg-[#111111]/10" : "bg-panel-muted")}>
                  Reply to an earlier message
                </div>
              ) : null}
              {message.body ? <p className="whitespace-pre-wrap break-words">{message.body}</p> : null}
              {attachments.length ? (
                <div className="mt-2 grid gap-2">
                  {attachments.map((attachment) => (
                    <MessageAttachmentView key={attachment.id ?? attachment.url} attachment={attachment} mine={mine} />
                  ))}
                </div>
              ) : null}
              {/* Time + read receipt */}
              <div className={cn("mt-1 flex items-center gap-1 text-[10px]", mine ? "justify-end text-[#111111]/45" : "text-ink-soft/50")}>
                <span>{shortTime(message.createdAt)}</span>
                {message.updatedAt && message.updatedAt !== message.createdAt && <span>· edited</span>}
                {mine && (readCount > 1 ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
              </div>
            </>
          )}
        </div>

        {/* Reactions */}
        {groupedReactions.length > 0 && (
          <div className={cn("mt-1 flex flex-wrap gap-1", mine && "justify-end")}>
            {groupedReactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact(r.emoji)}
                className={cn(
                  "rounded-full border bg-panel px-2 py-0.5 text-[11px] font-bold shadow-sm transition hover:border-primary",
                  r.mine && "border-primary/50 bg-primary/15",
                )}
              >
                {r.emoji} {r.count}
              </button>
            ))}
          </div>
        )}

        {/* Action toolbar — appears on hover */}
        {!editing && (
          <div className={cn(
            "mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100",
            mine && "flex-row-reverse",
          )}>
            <button type="button" onClick={onReply} className="flex size-7 items-center justify-center rounded-lg border border-line bg-panel text-ink-soft shadow-sm transition hover:bg-panel-muted hover:text-foreground" aria-label="Reply">
              <Reply className="size-3.5" />
            </button>
            <button type="button" onClick={onTogglePin} className={cn("flex size-7 items-center justify-center rounded-lg border bg-panel shadow-sm transition hover:bg-panel-muted", message.pinnedAt ? "border-primary text-[#111111]" : "border-line text-ink-soft hover:text-foreground")} aria-label={message.pinnedAt ? "Unpin" : "Pin"}>
              <Pin className="size-3.5" />
            </button>
            <button type="button" onClick={onForward} className="flex size-7 items-center justify-center rounded-lg border border-line bg-panel text-ink-soft shadow-sm transition hover:bg-panel-muted hover:text-foreground" aria-label="Forward">
              <Forward className="size-3.5" />
            </button>
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(emoji)}
                className="flex size-7 items-center justify-center rounded-lg border border-line bg-panel text-[12px] shadow-sm transition hover:border-primary/40 hover:bg-primary/10"
              >
                {emoji}
              </button>
            ))}
            {mine && (
              <>
                <button type="button" onClick={onStartEdit} className="flex size-7 items-center justify-center rounded-lg border border-line bg-panel text-ink-soft shadow-sm transition hover:bg-panel-muted hover:text-foreground" aria-label="Edit">
                  <Edit3 className="size-3.5" />
                </button>
                <button type="button" onClick={onDelete} className="flex size-7 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100" aria-label="Delete">
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/* ─── Right panel: conversation details ────────────────────────────────────── */

function AttachmentPreview({ attachment, onRemove }: { attachment: MessageAttachment; onRemove: () => void }) {
  return (
    <div className="flex min-w-[190px] max-w-[260px] items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2">
      <AttachmentIcon attachment={attachment} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-black text-foreground">{attachment.name}</p>
        <p className="truncate text-[10px] font-bold text-ink-soft">{attachment.kind ?? "file"}</p>
      </div>
      <button type="button" onClick={onRemove} className="flex size-7 items-center justify-center rounded-lg text-ink-soft hover:bg-panel-muted hover:text-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function MessageAttachmentView({ attachment, mine }: { attachment: MessageAttachment; mine: boolean }) {
  if (attachment.kind === "image") {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-black/10 bg-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attachment.url} alt={attachment.name} className="max-h-64 w-full object-cover" />
        <span className={cn("block truncate px-3 py-2 text-[11px] font-bold", mine ? "text-[#111111]/65" : "text-ink-soft")}>{attachment.name}</span>
      </a>
    );
  }

  if (attachment.kind === "video") {
    return (
      <div className="overflow-hidden rounded-xl border border-black/10 bg-black/5">
        <video src={attachment.url} controls className="max-h-64 w-full" />
        <a href={attachment.url} target="_blank" rel="noreferrer" className={cn("block truncate px-3 py-2 text-[11px] font-bold underline", mine ? "text-[#111111]/65" : "text-ink-soft")}>{attachment.name}</a>
      </div>
    );
  }

  return (
    <a href={attachment.url} target="_blank" rel="noreferrer" className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 transition hover:opacity-80", mine ? "border-[#111111]/15 bg-[#111111]/10" : "border-line bg-panel-muted")}>
      <AttachmentIcon attachment={attachment} />
      <span className="min-w-0 flex-1 truncate text-[12px] font-black">{attachment.name}</span>
      <Link2 className="size-3.5 shrink-0 opacity-60" />
    </a>
  );
}

function AttachmentIcon({ attachment }: { attachment: MessageAttachment }) {
  const Icon = attachment.kind === "image" ? ImageIcon : attachment.kind === "link" ? Link2 : FileText;
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[#111111]">
      <Icon className="size-4" />
    </span>
  );
}

function ForwardMessageModal({
  conversations,
  currentUserId,
  message,
  onClose,
  onForward,
  onToggleConversation,
  selectedConversationIds,
}: {
  conversations: Conversation[];
  currentUserId: string;
  message: Message;
  onClose: () => void;
  onForward: () => void;
  onToggleConversation: (conversationId: string) => void;
  selectedConversationIds: Set<string>;
}) {
  return (
    <div className="fixed inset-0 z-[66] flex items-center justify-center px-4">
      <button type="button" className="absolute inset-0 bg-[#111111]/55 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <section className="relative flex max-h-[88dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-dark">Forward message</p>
            <h2 className="text-[16px] font-black text-foreground">Choose conversations</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-xl text-ink-soft transition hover:bg-panel-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="border-b border-line bg-background px-5 py-4">
          <div className="rounded-xl border border-line bg-panel px-3 py-2">
            <p className="line-clamp-3 text-[13px] font-semibold text-foreground">{message.body || messageAttachments(message)[0]?.name || "Attachment"}</p>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 tb-scrollbar">
          {conversations.map((conversation) => {
            const checked = selectedConversationIds.has(conversation.id);
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onToggleConversation(conversation.id)}
                className={cn(
                  "mb-1.5 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                  checked ? "border-primary/50 bg-primary/10" : "border-line bg-background hover:bg-panel-muted",
                )}
              >
                <AvatarStack conversation={conversation} currentUserId={currentUserId} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-black text-foreground">{conversationTitle(conversation, currentUserId)}</span>
                  <span className="block text-[11px] font-semibold text-ink-soft">{conversation.members.length} members</span>
                </span>
                <span className={cn("flex size-5 items-center justify-center rounded-full border", checked ? "border-primary bg-primary text-[#111111]" : "border-line")}>
                  {checked && <Check className="size-3" />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <p className="text-[12px] font-bold text-ink-soft">{selectedConversationIds.size} selected</p>
          <button type="button" onClick={onForward} disabled={!selectedConversationIds.size} className="tb-yellow-button inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-black disabled:opacity-55">
            <Forward className="size-4" />Forward
          </button>
        </div>
      </section>
    </div>
  );
}

function ConversationDetails({ conversation, currentUserId, onTogglePin, pinnedMessages }: {
  conversation: Conversation | null;
  currentUserId: string;
  onTogglePin: (message: Message) => void;
  pinnedMessages: Message[];
}) {
  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Users className="size-7 text-line" />
        <p className="text-[13px] font-black text-foreground">Conversation details</p>
        <p className="text-[12px] text-ink-soft">Select a thread to see members.</p>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-line px-4 py-4">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-dark">Room details</p>
        <h2 className="mt-1 text-[15px] font-black text-foreground">{conversationTitle(conversation, currentUserId)}</h2>
        <p className="mt-0.5 text-[11px] text-ink-soft">{conversation.isGroup ? "Group" : "Direct"} · {conversation.members.length} members</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 tb-scrollbar">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-ink-soft">Pinned</p>
        <div className="mt-3 grid gap-2">
          {pinnedMessages.length ? pinnedMessages.slice(0, 5).map((message) => (
            <button
              key={message.id}
              type="button"
              onClick={() => onTogglePin(message)}
              className="rounded-xl border border-line bg-background p-3 text-left transition hover:border-primary/40"
            >
              <span className="flex items-center gap-2 text-[11px] font-black text-foreground">
                <Pin className="size-3.5 text-primary-dark" />
                {displayName(message.sender)}
              </span>
              <span className="mt-1 line-clamp-2 text-[12px] font-semibold text-ink-soft">{message.body || messageAttachments(message)[0]?.name || "Pinned attachment"}</span>
            </button>
          )) : (
            <div className="rounded-xl border border-dashed border-line bg-background p-3 text-[12px] font-semibold text-ink-soft">
              No pinned messages.
            </div>
          )}
        </div>
        <p className="mt-5 text-[9px] font-black uppercase tracking-[0.16em] text-ink-soft">Members</p>
        <div className="mt-3 grid gap-2">
          {conversation.members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-xl border border-line bg-background p-2.5 transition hover:border-primary/30">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[9px] font-black text-white">
                {userInitials(member.user)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-foreground">{displayName(member.user)}</p>
                <p className="truncate text-[10px] text-ink-soft">{member.user?.email ?? member.userId}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── New conversation modal ───────────────────────────────────────────────── */

function NewConversationModal({ currentUserId, onClose, onCreate, users }: {
  currentUserId: string;
  onClose: () => void;
  onCreate: (payload: { title?: string; isGroup: boolean; memberIds: string[] }) => void;
  users: TenantUser[];
}) {
  const [query,    setQuery]    = useState("");
  const [isGroup,  setIsGroup]  = useState(false);
  const [title,    setTitle]    = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const available = useMemo(() => {
    const n = query.trim().toLowerCase();
    return users.filter((u) => u.id !== currentUserId).filter((u) => !n || [u.firstName, u.lastName, u.email].join(" ").toLowerCase().includes(n));
  }, [currentUserId, query, users]);

  function toggleUser(id: string) {
    setSelected((cur) => {
      const next = new Set(isGroup ? cur : []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const memberIds = [...selected];
    if (!memberIds.length) return;
    onCreate({ isGroup, memberIds, title: isGroup ? title.trim() || undefined : undefined });
  }

  return (
    <div className="fixed inset-0 z-[64] flex items-center justify-center px-4">
      <button type="button" className="absolute inset-0 bg-[#111111]/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <form onSubmit={submit} className="relative flex max-h-[88dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_40px_100px_rgba(0,0,0,0.3)]">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-dark">New thread</p>
            <h2 className="text-[16px] font-black text-foreground">Start a conversation</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-xl text-ink-soft transition hover:bg-panel-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        {/* Options */}
        <div className="grid gap-2.5 border-b border-line px-5 py-4">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-background px-3 py-2.5 transition hover:border-primary/40">
            <input type="checkbox" checked={isGroup} onChange={(e) => { setIsGroup(e.target.checked); setSelected(new Set()); }} className="accent-[#ffd400]" />
            <span className="text-[13px] font-bold text-foreground">Group conversation</span>
          </label>
          {isGroup && (
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="Group name" className="h-9 rounded-xl border border-line bg-background px-3 text-[13px] text-foreground placeholder:text-ink-soft focus:border-primary focus:outline-none" />
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find people…" className="h-9 w-full rounded-xl border border-line bg-background pl-9 pr-3 text-[13px] text-foreground placeholder:text-ink-soft focus:border-primary focus:outline-none" />
          </div>
        </div>

        {/* User list */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 tb-scrollbar">
          {available.map((u) => {
            const checked = selected.has(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleUser(u.id)}
                className={cn(
                  "mb-1.5 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                  checked ? "border-primary/40 bg-primary/[0.07]" : "border-line bg-background hover:bg-panel-muted",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[10px] font-black text-white">{userInitials(u)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-foreground">{displayName(u)}</span>
                  <span className="block truncate text-[11px] text-ink-soft">{u.email}</span>
                </span>
                <span className={cn("flex size-5 items-center justify-center rounded-full border transition", checked ? "border-primary bg-primary text-[#111111]" : "border-line")}>
                  {checked && <Check className="size-3" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <p className="text-[12px] font-bold text-ink-soft">{selected.size} selected</p>
          <button
            type="submit"
            disabled={selected.size === 0 || (!isGroup && selected.size !== 1)}
            className="tb-yellow-button inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-[13px] font-black disabled:opacity-55"
          >
            <Plus className="size-4" />Create thread
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Avatar stack ─────────────────────────────────────────────────────────── */

function AvatarStack({ conversation, currentUserId, dark }: { conversation: Conversation; currentUserId: string; dark?: boolean }) {
  const people  = conversation.members.filter((m) => m.userId !== currentUserId).slice(0, 2);
  const primary = people[0]?.user ?? conversation.members[0]?.user;
  const bg      = dark ? "bg-white/[0.15]" : "bg-[#111111]";
  const text    = dark ? "text-white" : "text-white";

  if (!conversation.isGroup) {
    return (
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-black", bg, text)}>
        {userInitials(primary)}
      </span>
    );
  }
  return (
    <span className="relative flex size-9 shrink-0">
      <span className={cn("absolute left-0 top-0.5 flex size-7 items-center justify-center rounded-full text-[9px] font-black ring-2", bg, text, dark ? "ring-[#0f1117]" : "ring-panel")}>
        {userInitials(people[0]?.user)}
      </span>
      <span className="absolute bottom-0.5 right-0 flex size-7 items-center justify-center rounded-full bg-primary text-[9px] font-black text-[#111111] ring-2 ring-panel">
        {userInitials(people[1]?.user)}
      </span>
    </span>
  );
}

/* ─── Typing indicator ─────────────────────────────────────────────────────── */

function TypingIndicator({ text }: { text: string }) {
  return (
    <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-ink-soft">
      <span className="flex gap-0.5">
        {[0, 120, 240].map((delay) => (
          <span key={delay} className="size-1.5 animate-bounce rounded-full bg-ink-soft/40" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </span>
      {text}
    </div>
  );
}

/* ─── Pure helpers ─────────────────────────────────────────────────────────── */

type MessageGroup =
  | { type: "date"; key: string; label: string }
  | { type: "message"; key: string; message: Message; showAvatar: boolean; showSender: boolean };

function buildMessageGroups(messages: Message[]): MessageGroup[] {
  const result: MessageGroup[] = [];
  let lastDate  = "";
  let lastSenderId = "";

  for (const message of messages) {
    const date = new Date(message.createdAt);
    const dateKey = date.toDateString();

    if (dateKey !== lastDate) {
      result.push({ type: "date", key: `date-${dateKey}`, label: formatDateLabel(date) });
      lastDate     = dateKey;
      lastSenderId = "";
    }

    const isFirstInGroup = message.senderId !== lastSenderId;
    result.push({ type: "message", key: message.id, message, showAvatar: isFirstInGroup, showSender: isFirstInGroup });
    lastSenderId = message.senderId;
  }
  return result;
}

function formatDateLabel(date: Date): string {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (d === today)          return "Today";
  if (d === today - 86400000) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupReactions(reactions: NonNullable<Message["reactions"]>, currentUserId: string) {
  const grouped = new Map<string, { emoji: string; count: number; mine: boolean }>();
  reactions.forEach((r) => {
    const cur = grouped.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    cur.count += 1;
    cur.mine = cur.mine || r.userId === currentUserId;
    grouped.set(r.emoji, cur);
  });
  return [...grouped.values()];
}

function appendMessage(messages: Message[], message: Message) {
  if (messages.some((m) => m.id === message.id)) return messages;
  return [...messages, message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function mergeMessages(left: Message[], right: Message[]) {
  const byId = new Map<string, Message>();
  [...left, ...right].forEach((message) => {
    byId.set(message.id, { ...(byId.get(message.id) ?? {}), ...message });
  });
  return [...byId.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function messageAttachments(message: Message): MessageAttachment[] {
  if (!Array.isArray(message.attachments)) return [];
  return message.attachments
    .map((attachment) => normalizeAttachment(attachment))
    .filter((attachment): attachment is MessageAttachment => Boolean(attachment));
}

function normalizeAttachment(value: unknown): MessageAttachment | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const url = typeof record.url === "string" ? record.url : typeof record.fileUrl === "string" ? record.fileUrl : "";
  if (!url) return null;
  const name = typeof record.name === "string" ? record.name : typeof record.fileName === "string" ? record.fileName : fileNameFromUrl(url);
  const mimeType = typeof record.mimeType === "string" ? record.mimeType : guessMimeType(url);
  const kind = typeof record.kind === "string" ? record.kind as MessageAttachment["kind"] : attachmentKind(url);
  return {
    id: typeof record.id === "string" ? record.id : url,
    name,
    url,
    mimeType,
    sizeBytes: typeof record.sizeBytes === "number" ? record.sizeBytes : null,
    kind,
  };
}

function fileNameFromUrl(value: string) {
  try {
    const url = new URL(value);
    const last = url.pathname.split("/").filter(Boolean).pop();
    return decodeURIComponent(last || "Attachment");
  } catch {
    return value.split("/").filter(Boolean).pop() || "Attachment";
  }
}

function guessMimeType(value: string) {
  const lower = value.split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(lower)) return "image/*";
  if (/\.(mp4|webm|mov|m4v)$/.test(lower)) return "video/*";
  if (/\.(mp3|wav|ogg|m4a)$/.test(lower)) return "audio/*";
  return "application/octet-stream";
}

function attachmentKind(value: string): MessageAttachment["kind"] {
  const mime = guessMimeType(value);
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  try {
    const url = new URL(value);
    if (!/\.[a-z0-9]{2,6}$/i.test(url.pathname)) return "link";
  } catch {
    return "file";
  }
  return "file";
}

function attachmentKindFromMime(value: string, mimeType?: string | null): MessageAttachment["kind"] {
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType?.startsWith("video/")) return "video";
  if (mimeType?.startsWith("audio/")) return "audio";
  return attachmentKind(value);
}

function createLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function uploadWithIntent(intent: UploadIntent, file: File) {
  if (!intent.uploadUrl) {
    throw new Error(intent.note || `${intent.provider} direct upload is not fully configured yet.`);
  }

  if (intent.provider === "cloudinary") {
    const body = new FormData();
    Object.entries(intent.fields).forEach(([key, value]) => body.append(key, String(value)));
    body.append("file", file);
    const response = await fetch(intent.uploadUrl, { method: "POST", body });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
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

async function markVisibleMessagesRead(token: string, messages: Message[], currentUserId: string) {
  const unread = messages.filter((m) => m.senderId !== currentUserId).filter((m) => !(m.readReceipts ?? []).some((r) => r.userId === currentUserId)).slice(-10);
  await Promise.allSettled(unread.map((m) => markMessageRead(token, m.id)));
}

function conversationTitle(conversation: Conversation, currentUserId: string) {
  if (conversation.title) return conversation.title;
  const names = conversation.members.filter((m) => m.userId !== currentUserId).map((m) => displayName(m.user)).filter(Boolean);
  return names.join(", ") || "Conversation";
}

function displayName(user?: Pick<UserSummary, "email" | "firstName" | "lastName"> | null) {
  if (!user) return "Unknown";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

function shortTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d);
}

function readConversationIdFromUrl() {
  if (typeof window === "undefined") return "";
  return new URL(window.location.href).searchParams.get("conversation") ?? "";
}
