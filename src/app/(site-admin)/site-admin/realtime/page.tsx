"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BellRing,
  CheckCheck,
  Clock3,
  EyeOff,
  MessageSquareWarning,
  RefreshCw,
  Reply,
  SearchCheck,
  ShieldAlert,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  getSiteRealtimeOverview,
  listSiteConversations,
  listSiteMessageActivity,
  type SecurityEvent,
  type SiteConversationMetadata,
  type SiteMessageActivity,
  type SiteRealtimeOverview,
} from "@/lib/api";
import {
  EmptyState,
  MetricCard,
  OpsPanel,
  RowCard,
  SearchInput,
  StatusBadge,
  formatDate,
  formatNumber,
} from "../_components/site-admin-ops-ui";

const emptyOverview: SiteRealtimeOverview = {
  realtime: {
    namespace: "/",
    status: "unknown",
    connections: 0,
    rooms: { total: 0, tenant: 0, user: 0, conversation: 0, task: 0, memberships: 0 },
    tenants: {},
    authMethods: {},
  },
  conversations: { total: 0, group: 0, direct: 0 },
  messages: { last24h: 0, pinned: 0, reactions: 0, readReceiptsLast24h: 0 },
  deliveryHealth: { readReceiptRatio: 0, privateContentPolicy: "metadata_only" },
  abuseAndRateLimit: { events: 0, recentEvents: [] },
  recentRooms: [],
};

export default function SiteAdminRealtimePage() {
  const { auth } = useWorkspaceAuth();
  const [overview, setOverview] = useState<SiteRealtimeOverview>(emptyOverview);
  const [conversations, setConversations] = useState<SiteConversationMetadata[]>([]);
  const [messages, setMessages] = useState<SiteMessageActivity[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResult, conversationsResult, messagesResult] = await Promise.all([
        getSiteRealtimeOverview(auth.accessToken),
        listSiteConversations(auth.accessToken, { limit: 30, search: query || undefined }),
        listSiteMessageActivity(auth.accessToken, { limit: 30, search: query || undefined }),
      ]);
      setOverview(overviewResult);
      setConversations(conversationsResult.data);
      setMessages(messagesResult.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load realtime oversight.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const messageSignals = useMemo(() => {
    const replies = messages.filter((message) => message.parentMessageId).length;
    const forwards = messages.filter((message) => message.forwardedFromMessageId).length;
    const attachments = messages.reduce((sum, message) => sum + message.attachmentCount, 0);
    return { replies, forwards, attachments };
  }, [messages]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "#34d39918" }}>
            <MessageSquareWarning className="size-4" style={{ color: "#34d399" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Realtime</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">{overview.realtime.connections} connections · {overview.messages.last24h} messages 24h · {overview.abuseAndRateLimit.events} abuse signals</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={Wifi} label="Connections" value={overview.realtime.connections} subtext={overview.realtime.status} tone={overview.realtime.status === "connected" ? "#047857" : "#d89b00"} />
        <MetricCard icon={Activity} label="Rooms" value={overview.realtime.rooms.total} subtext={`${overview.realtime.rooms.conversation} conversations`} tone="#2563eb" />
        <MetricCard icon={Users} label="Conversations" value={overview.conversations.total} subtext={`${overview.conversations.group} group rooms`} tone="#6d5dd3" />
        <MetricCard icon={BellRing} label="Messages 24h" value={overview.messages.last24h} subtext={`${overview.messages.reactions} reactions`} tone="#111111" />
        <MetricCard icon={CheckCheck} label="Read receipts" value={`${overview.deliveryHealth.readReceiptRatio}%`} subtext={`${overview.messages.readReceiptsLast24h} in 24h`} tone={overview.deliveryHealth.readReceiptRatio >= 50 ? "#047857" : "#d89b00"} />
        <MetricCard icon={ShieldAlert} label="Abuse signals" value={overview.abuseAndRateLimit.events} subtext="rate-limit window" tone={overview.abuseAndRateLimit.events ? "#dc2626" : "#047857"} />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search conversation titles, tenant metadata, room IDs..." />
          <div className="rounded-2xl bg-[#ecfdf5] px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700" style={{ border: "1px solid #bbf7d0" }}>
            <EyeOff className="mr-1 inline size-3.5" />
            Message bodies are redacted
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <OpsPanel accent="#34d399" eyebrow="Gateway diagnostics" title="Connection, auth, and room state">
          <div className="grid gap-3 md:grid-cols-2">
            <RoomStat label="Tenant rooms" value={overview.realtime.rooms.tenant} />
            <RoomStat label="User rooms" value={overview.realtime.rooms.user} />
            <RoomStat label="Task rooms" value={overview.realtime.rooms.task} />
            <RoomStat label="Membership links" value={overview.realtime.rooms.memberships} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Distribution title="Auth methods" values={overview.realtime.authMethods} />
            <Distribution title="Tenant connections" values={overview.realtime.tenants} truncateKeys />
          </div>
        </OpsPanel>

        <OpsPanel accent="#2563eb" eyebrow="Room activity" title="Conversation and task room metadata">
          {loading ? (
            <EmptyState text="Loading conversation room activity..." />
          ) : conversations.length === 0 ? (
            <EmptyState text="No conversation rooms matched this filter." />
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <RowCard key={conversation.id}>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-black text-[#111111]">{conversation.title || (conversation.isGroup ? "Group conversation" : "Direct conversation")}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#766f63]">
                      {conversation.tenant ? (
                        <Link href={`/site-admin/tenants/${conversation.tenant.id}`} className="hover:text-[#6d5dd3]">{conversation.tenant.name}</Link>
                      ) : "Unknown tenant"} - {conversation.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <StatusBadge value={conversation.isGroup ? "GROUP" : "DIRECT"} />
                    <StatusBadge value={`${conversation._count?.members ?? conversation.members?.length ?? 0} MEMBERS`} />
                    <StatusBadge value={`${conversation._count?.messages ?? 0} MESSAGES`} />
                    <StatusBadge value={`LATEST ${formatDate(conversation.messages?.[0]?.createdAt)}`} />
                  </div>
                </RowCard>
              ))}
            </div>
          )}
        </OpsPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <OpsPanel
          accent="#6d5dd3"
          eyebrow="Message delivery health"
          title="Metadata-only message activity"
          actions={<StatusBadge value={`${messageSignals.attachments} attachments`} />}
        >
          {loading ? (
            <EmptyState text="Loading message metadata..." />
          ) : messages.length === 0 ? (
            <EmptyState text="No message metadata matched this filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">
                  <tr>
                    <th className="px-3 py-2">Conversation</th>
                    <th className="px-3 py-2">Sender</th>
                    <th className="px-3 py-2">Delivery signals</th>
                    <th className="px-3 py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee8dc]">
                  {messages.map((message) => (
                    <tr key={message.id} className="transition hover:bg-[#fffdf2]">
                      <td className="min-w-[280px] px-3 py-3">
                        <p className="truncate text-[12px] font-black text-[#111111]">{message.conversation.title || message.conversation.id}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{message.conversation.tenant?.name ?? message.conversation.tenantId}</p>
                        <p className="mt-1 inline-flex items-center text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8375]"><EyeOff className="mr-1 size-3.5" />body redacted</p>
                      </td>
                      <td className="px-3 py-3 text-[12px] font-semibold text-[#766f63]">{message.senderId}</td>
                      <td className="min-w-[260px] px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge value={`${message._count?.readReceipts ?? 0} READS`} />
                          <StatusBadge value={`${message._count?.reactions ?? 0} REACTIONS`} />
                          {message.parentMessageId ? <StatusBadge value="REPLY" /> : null}
                          {message.forwardedFromMessageId ? <StatusBadge value="FORWARDED" /> : null}
                          {message.pinnedAt ? <StatusBadge value="PINNED" /> : null}
                          {message.attachmentCount ? <StatusBadge value={`${message.attachmentCount} FILES`} /> : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[12px] font-semibold text-[#766f63]"><Clock3 className="mr-1 inline size-3.5" />{formatDate(message.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </OpsPanel>

        <OpsPanel accent="#dc2626" eyebrow="Abuse and rate-limit" title="Tenant-scoped review queue">
          <SecurityEventList events={overview.abuseAndRateLimit.recentEvents} loading={loading} />
        </OpsPanel>
      </div>

      <OpsPanel accent="#d89b00" eyebrow="Presence and typing diagnostics" title="Operational signal coverage">
        <div className="grid gap-3 md:grid-cols-3">
          <SignalTile icon={SearchCheck} label="Presence scope" value="Tenant and room membership counts" />
          <SignalTile icon={Reply} label="Thread activity" value={`${messageSignals.replies} replies, ${messageSignals.forwards} forwards in sample`} />
          <SignalTile icon={EyeOff} label="Privacy guardrail" value={overview.deliveryHealth.privateContentPolicy.replace(/_/g, " ")} />
        </div>
      </OpsPanel>
    </div>
  );
}

function RoomStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#111111]">{formatNumber(value)}</p>
    </div>
  );
}

function Distribution({ title, truncateKeys = false, values }: { title: string; truncateKeys?: boolean; values: Record<string, number> }) {
  const entries = Object.entries(values).slice(0, 8);
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{title}</p>
      <div className="mt-3 space-y-2">
        {entries.length === 0 ? <p className="text-[11px] font-bold text-[#8a8375]">No live samples</p> : null}
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <p className="truncate text-[12px] font-bold text-[#111111]">{truncateKeys ? shortId(key) : key}</p>
            <StatusBadge value={String(value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityEventList({ events, loading }: { events: SecurityEvent[]; loading: boolean }) {
  if (loading) return <EmptyState text="Loading rate-limit events..." />;
  if (events.length === 0) return <EmptyState text="No abuse or rate-limit signals in the current observation window." />;
  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-[#111111]">{event.type}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{event.tenant?.name ?? "Platform"} - {formatDate(event.createdAt)}</p>
            </div>
            <StatusBadge value={event.severity} />
          </div>
          <p className="mt-3 line-clamp-2 text-[11px] font-semibold text-[#766f63]">{event.source ?? event.ipAddress ?? event.requestId ?? "No source metadata"}</p>
        </div>
      ))}
    </div>
  );
}

function SignalTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <Icon className="size-4 text-[#2563eb]" aria-hidden="true" />
      <p className="mt-3 text-[12px] font-black text-[#111111]">{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{value}</p>
    </div>
  );
}

function shortId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}
