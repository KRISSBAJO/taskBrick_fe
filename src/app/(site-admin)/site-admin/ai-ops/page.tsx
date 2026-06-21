"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Cpu,
  Gauge,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  getSiteAiOverview,
  listSiteAiActions,
  listSiteAiAgents,
  listSiteAiConversations,
  listSiteAiSettings,
  listSiteAiUsage,
  type AiActionStatus,
  type AiConversationStatus,
  type SiteAiAction,
  type SiteAiAgent,
  type SiteAiConversation,
  type SiteAiOverview,
  type SiteAiSettings,
  type SiteAiUsageLog,
} from "@/lib/api";
import {
  EmptyState,
  FilterButton,
  MetricCard,
  OpsPanel,
  RowCard,
  SearchInput,
  StatusBadge,
  countFrom,
  formatDate,
  formatNumber,
} from "../_components/site-admin-ops-ui";

type View = "agents" | "settings" | "conversations" | "actions" | "usage" | "safety";

const VIEWS: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "agents", label: "Agents", icon: Bot },
  { id: "settings", label: "Tenant settings", icon: Gauge },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "actions", label: "Actions", icon: Zap },
  { id: "usage", label: "Usage and cost", icon: CircleDollarSign },
  { id: "safety", label: "Safety", icon: ShieldAlert },
];

const ACTION_STATUSES: Array<"ALL" | AiActionStatus> = ["ALL", "FAILED", "RUNNING", "PENDING", "COMPLETED", "CANCELLED"];
const CONVERSATION_STATUSES: Array<"ALL" | AiConversationStatus> = ["ALL", "OPEN", "RESOLVED", "ARCHIVED"];

const emptyOverview: SiteAiOverview = {
  settings: {},
  agents: { byProvider: {} },
  conversations: { byStatus: {} },
  actions: { byStatus: {} },
  usage: { byStatus: {}, last30dTokens: 0, last30dCost: 0, averageLatencyMs: 0 },
  safety: { events: 0, recentEvents: [] },
  recentActions: [],
};

export default function SiteAdminAiOpsPage() {
  const { auth } = useWorkspaceAuth();
  const [overview, setOverview] = useState<SiteAiOverview>(emptyOverview);
  const [settings, setSettings] = useState<SiteAiSettings[]>([]);
  const [agents, setAgents] = useState<SiteAiAgent[]>([]);
  const [conversations, setConversations] = useState<SiteAiConversation[]>([]);
  const [actions, setActions] = useState<SiteAiAction[]>([]);
  const [usage, setUsage] = useState<SiteAiUsageLog[]>([]);
  const [view, setView] = useState<View>("agents");
  const [query, setQuery] = useState("");
  const [actionStatus, setActionStatus] = useState<(typeof ACTION_STATUSES)[number]>("FAILED");
  const [conversationStatus, setConversationStatus] = useState<(typeof CONVERSATION_STATUSES)[number]>("OPEN");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResult, settingsResult, agentsResult, conversationsResult, actionsResult, usageResult] = await Promise.all([
        getSiteAiOverview(auth.accessToken),
        listSiteAiSettings(auth.accessToken, { limit: 35, search: query || undefined }),
        listSiteAiAgents(auth.accessToken, { limit: 35, search: query || undefined }),
        listSiteAiConversations(auth.accessToken, { limit: 35, search: query || undefined, status: conversationStatus === "ALL" ? undefined : conversationStatus }),
        listSiteAiActions(auth.accessToken, { limit: 35, search: query || undefined, status: actionStatus === "ALL" ? undefined : actionStatus }),
        listSiteAiUsage(auth.accessToken, { limit: 35, search: query || undefined }),
      ]);
      setOverview(overviewResult);
      setSettings(settingsResult.data);
      setAgents(agentsResult.data);
      setConversations(conversationsResult.data);
      setActions(actionsResult.data);
      setUsage(usageResult.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load AI operations.");
    } finally {
      setLoading(false);
    }
  }, [actionStatus, auth.accessToken, conversationStatus, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const metrics = useMemo(() => {
    const providerTotal = Object.values(overview.agents.byProvider).reduce((sum, count) => sum + count, 0);
    return {
      enabledTenants: overview.settings.true ?? overview.settings.TRUE ?? 0,
      providerTotal,
      openConversations: countFrom(overview.conversations.byStatus, ["OPEN"]),
      failedActions: countFrom(overview.actions.byStatus, ["FAILED"]),
      tokens: overview.usage.last30dTokens,
      cost: overview.usage.last30dCost,
    };
  }, [overview]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "#6d5dd318" }}>
            <Bot className="size-4" style={{ color: "#6d5dd3" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">AI operations</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">{metrics.enabledTenants} AI tenants · {metrics.failedActions} failed actions · ${Number(metrics.cost).toFixed(2)} 30d cost</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={CheckCircle2} label="AI tenants" value={metrics.enabledTenants} subtext="enabled settings" tone="#047857" />
        <MetricCard icon={Bot} label="Agents" value={metrics.providerTotal} subtext="registered agents" tone="#6d5dd3" />
        <MetricCard icon={MessageSquare} label="Open chats" value={metrics.openConversations} subtext="metadata only" tone="#2563eb" />
        <MetricCard icon={TriangleAlert} label="Failed actions" value={metrics.failedActions} subtext="agent run audit" tone={metrics.failedActions ? "#dc2626" : "#047857"} />
        <MetricCard icon={Cpu} label="Tokens 30d" value={formatNumber(metrics.tokens)} subtext={`${overview.usage.averageLatencyMs}ms avg latency`} tone="#111111" />
        <MetricCard icon={CircleDollarSign} label="Cost 30d" value={`$${Number(metrics.cost).toFixed(2)}`} subtext="estimated usage" tone="#d89b00" />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search tenant, provider, model, agent, action type, usage error..." />
          <div className="flex flex-wrap gap-2">
            {VIEWS.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" onClick={() => setView(item.id)} className="inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-[11px] font-black transition" style={{ background: view === item.id ? "#111111" : "#fbfaf6", border: "1px solid #ded8c8", color: view === item.id ? "#ffffff" : "#5f574c" }}>
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>
          {view === "actions" ? (
            <div className="flex flex-wrap gap-2">{ACTION_STATUSES.map((item) => <FilterButton key={item} active={actionStatus === item} onClick={() => setActionStatus(item)}>{item}</FilterButton>)}</div>
          ) : null}
          {view === "conversations" ? (
            <div className="flex flex-wrap gap-2">{CONVERSATION_STATUSES.map((item) => <FilterButton key={item} active={conversationStatus === item} onClick={() => setConversationStatus(item)}>{item}</FilterButton>)}</div>
          ) : null}
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      {view === "agents" ? (
        <OpsPanel accent="#6d5dd3" eyebrow="Agent inventory" title="Tenant agents by provider and model">
          {loading ? <EmptyState text="Loading AI agents..." /> : agents.length === 0 ? <EmptyState text="No agents matched the current filters." /> : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
            </div>
          )}
        </OpsPanel>
      ) : null}

      {view === "settings" ? (
        <OpsPanel accent="#047857" eyebrow="Tenant AI settings" title="Policy, model, provider, and budget limits">
          {loading ? <EmptyState text="Loading tenant AI settings..." /> : settings.length === 0 ? <EmptyState text="No tenant AI settings returned." /> : (
            <div className="space-y-3">
              {settings.map((setting) => <SettingsRow key={setting.id} setting={setting} />)}
            </div>
          )}
        </OpsPanel>
      ) : null}

      {view === "conversations" ? (
        <OpsPanel accent="#2563eb" eyebrow="Conversation metadata" title="Chat monitoring without private message exposure">
          {loading ? <EmptyState text="Loading conversation metadata..." /> : conversations.length === 0 ? <EmptyState text="No AI conversations matched the filters." /> : (
            <div className="space-y-3">
              {conversations.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} />)}
            </div>
          )}
        </OpsPanel>
      ) : null}

      {view === "actions" ? (
        <OpsPanel accent="#dc2626" eyebrow="Agent run audit" title="Actions, failures, and entity effects">
          {loading ? <EmptyState text="Loading AI actions..." /> : actions.length === 0 ? <EmptyState text="No AI actions matched the current filters." /> : (
            <div className="space-y-3">
              {actions.map((action) => <ActionRow key={action.id} action={action} />)}
            </div>
          )}
        </OpsPanel>
      ) : null}

      {view === "usage" ? (
        <OpsPanel accent="#d89b00" eyebrow="Usage and cost" title="Token, latency, provider, and model records">
          {loading ? <EmptyState text="Loading usage records..." /> : usage.length === 0 ? <EmptyState text="No usage records matched the current filters." /> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">
                  <tr>
                    <th className="px-3 py-2">Tenant</th>
                    <th className="px-3 py-2">Provider</th>
                    <th className="px-3 py-2">Tokens</th>
                    <th className="px-3 py-2">Cost</th>
                    <th className="px-3 py-2">Latency</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee8dc]">
                  {usage.map((item) => <UsageRow key={item.id} item={item} />)}
                </tbody>
              </table>
            </div>
          )}
        </OpsPanel>
      ) : null}

      {view === "safety" ? (
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <OpsPanel accent="#dc2626" eyebrow="Safety pressure" title="Abuse and safety signals">
            <div className="rounded-2xl bg-[#fbfaf6] p-5" style={{ border: "1px solid #e7dfcf" }}>
              <div className="flex items-center justify-between">
                <ShieldAlert className="size-6 text-red-600" aria-hidden="true" />
                <StatusBadge value={overview.safety.events ? "REVIEW" : "CLEAR"} />
              </div>
              <p className="mt-4 text-3xl font-black text-[#111111]">{formatNumber(overview.safety.events)}</p>
              <p className="mt-1 text-[12px] font-semibold text-[#665f54]">AI-related security signals returned by backend filters.</p>
            </div>
          </OpsPanel>
          <OpsPanel accent="#f87171" eyebrow="Recent safety events" title="Events linked to AI sources or event types">
            {overview.safety.recentEvents.length === 0 ? <EmptyState text="No AI safety events returned." /> : (
              <div className="space-y-3">
                {overview.safety.recentEvents.map((event) => (
                  <RowCard key={event.id}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={event.severity} />
                        <StatusBadge value={event.status} />
                        {event.tenant ? <Link href={`/site-admin/tenants/${event.tenant.id}`} className="text-[11px] font-black text-[#6d5dd3] hover:text-[#111111]">{event.tenant.name}</Link> : null}
                      </div>
                      <p className="mt-3 truncate text-sm font-black text-[#111111]">{event.type}</p>
                      <p className="mt-1 text-[12px] font-semibold text-[#665f54]">{event.source ?? "ai"} · {formatDate(event.createdAt)}</p>
                    </div>
                  </RowCard>
                ))}
              </div>
            )}
          </OpsPanel>
        </div>
      ) : null}
    </div>
  );
}

function AgentCard({ agent }: { agent: SiteAiAgent }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#111111]">{agent.name}</p>
          <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{agent.provider} · {agent.model}</p>
        </div>
        <StatusBadge value={agent.enabled ? "ENABLED" : "DISABLED"} />
      </div>
      <p className="mt-3 line-clamp-2 min-h-10 text-[12px] font-semibold leading-5 text-[#665f54]">{agent.description ?? "No description provided."}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat label="Chats" value={agent._count?.conversations ?? 0} />
        <MiniStat label="Actions" value={agent._count?.actions ?? 0} />
        <MiniStat label="Usage" value={agent._count?.usageLogs ?? 0} />
      </div>
      {agent.tenant ? <Link href={`/site-admin/tenants/${agent.tenant.id}`} className="mt-3 inline-flex text-[11px] font-black text-[#6d5dd3] hover:text-[#111111]">{agent.tenant.name}</Link> : null}
    </div>
  );
}

function SettingsRow({ setting }: { setting: SiteAiSettings }) {
  return (
    <RowCard>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={setting.enabled ? "ENABLED" : "DISABLED"} />
          <StatusBadge value={setting.defaultProvider} />
          {setting.tenant ? <Link href={`/site-admin/tenants/${setting.tenant.id}`} className="text-[11px] font-black text-[#6d5dd3] hover:text-[#111111]">{setting.tenant.name}</Link> : null}
        </div>
        <p className="mt-3 truncate text-sm font-black text-[#111111]">{setting.defaultModel}</p>
        <p className="mt-1 text-[12px] font-semibold text-[#665f54]">Allowed providers: {setting.allowedProviders.join(", ") || "none"} · Retention {setting.dataRetentionDays} days</p>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:min-w-[240px]">
        <MiniStat label="Token limit" value={setting.monthlyTokenLimit ?? "n/a"} />
        <MiniStat label="Cost limit" value={setting.monthlyCostLimit ? `$${Number(setting.monthlyCostLimit).toFixed(2)}` : "n/a"} />
      </div>
    </RowCard>
  );
}

function ConversationRow({ conversation }: { conversation: SiteAiConversation }) {
  return (
    <RowCard>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={conversation.status} />
          <StatusBadge value={conversation.contextType ?? "general"} />
          {conversation.tenant ? <Link href={`/site-admin/tenants/${conversation.tenant.id}`} className="text-[11px] font-black text-[#6d5dd3] hover:text-[#111111]">{conversation.tenant.name}</Link> : null}
        </div>
        <p className="mt-3 truncate text-sm font-black text-[#111111]">{conversation.title ?? "Untitled conversation"}</p>
        <p className="mt-1 line-clamp-2 text-[12px] font-semibold text-[#665f54]">{conversation.summary ?? "Summary unavailable. Message bodies stay inside tenant-scoped chat contexts."}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 lg:min-w-[280px]">
        <MiniStat label="Messages" value={conversation._count?.messages ?? 0} />
        <MiniStat label="Actions" value={conversation._count?.actions ?? 0} />
        <MiniStat label="Updated" value={formatDate(conversation.updatedAt)} />
      </div>
    </RowCard>
  );
}

function ActionRow({ action }: { action: SiteAiAction }) {
  return (
    <RowCard>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={action.status} />
          <StatusBadge value={action.type} />
          {action.tenant ? <Link href={`/site-admin/tenants/${action.tenant.id}`} className="text-[11px] font-black text-[#6d5dd3] hover:text-[#111111]">{action.tenant.name}</Link> : null}
        </div>
        <p className="mt-3 truncate text-sm font-black text-[#111111]">{action.agent?.name ?? "Agent action"} · {action.entityType ?? "entity"}:{action.entityId ?? "n/a"}</p>
        {action.error ? <p className="mt-1 line-clamp-2 text-[12px] font-bold text-red-700">{action.error}</p> : <p className="mt-1 text-[12px] font-semibold text-[#665f54]">Completed {formatDate(action.completedAt)} · Updated {formatDate(action.updatedAt)}</p>}
      </div>
      <div className="flex items-center justify-start lg:justify-end">
        {action.status === "FAILED" ? <TriangleAlert className="size-5 text-red-600" aria-hidden="true" /> : <Activity className="size-5 text-[#6d5dd3]" aria-hidden="true" />}
      </div>
    </RowCard>
  );
}

function UsageRow({ item }: { item: SiteAiUsageLog }) {
  return (
    <tr className="text-[12px] font-semibold text-[#5f574c]">
      <td className="px-3 py-3">
        {item.tenant ? <Link href={`/site-admin/tenants/${item.tenant.id}`} className="font-black text-[#111111] hover:text-[#6d5dd3]">{item.tenant.name}</Link> : "n/a"}
      </td>
      <td className="px-3 py-3">
        <span className="font-black text-[#111111]">{item.provider}</span>
        <p className="mt-0.5 text-[11px] text-[#766f63]">{item.model}</p>
      </td>
      <td className="px-3 py-3">{formatNumber(item.totalTokens)}</td>
      <td className="px-3 py-3">${Number(item.estimatedCost ?? 0).toFixed(4)}</td>
      <td className="px-3 py-3">{item.latencyMs ?? 0}ms</td>
      <td className="px-3 py-3"><StatusBadge value={item.status} /></td>
    </tr>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2" style={{ border: "1px solid #eee8dc" }}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8a8375]">{label}</p>
      <p className="mt-1 truncate text-[12px] font-black text-[#111111]">{typeof value === "number" ? formatNumber(value) : value}</p>
    </div>
  );
}
