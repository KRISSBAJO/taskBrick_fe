"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  CalendarCheck2,
  EyeOff,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Video,
  Workflow,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  getSiteMeetingOverview,
  listSiteMeetingReminderLogs,
  listSiteMeetingTenants,
  type SiteMeetingOperationsOverview,
  type SiteMeetingReminderLog,
  type SiteMeetingTenantPosture,
} from "@/lib/api";
import {
  EmptyState,
  MetricCard,
  OpsPanel,
  RowCard,
  SearchInput,
  StatusBadge,
  countFrom,
  formatDate,
  formatNumber,
} from "../_components/site-admin-ops-ui";

const emptyOverview: SiteMeetingOperationsOverview = {
  privacy: { policy: "metadata_only", redacted: [] },
  meetings: {},
  booking: { activePages: 0, requests: {} },
  reminderDelivery: {},
  policies: {
    tenantsWithSettings: 0,
    publicBookingEnabled: 0,
    calendarSyncEnabled: 0,
    whatsappEnabled: 0,
    aiMeetingEnabled: 0,
  },
  aiUsage: { requests: 0, totalTokens: 0, estimatedCost: 0 },
  topTenants: [],
  deliveryPressure: [],
};

export default function SiteAdminMeetingsPage() {
  const { auth } = useWorkspaceAuth();
  const [overview, setOverview] = useState<SiteMeetingOperationsOverview>(emptyOverview);
  const [tenants, setTenants] = useState<SiteMeetingTenantPosture[]>([]);
  const [logs, setLogs] = useState<SiteMeetingReminderLog[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResult, tenantsResult, logsResult] = await Promise.all([
        getSiteMeetingOverview(auth.accessToken, { search: query || undefined }),
        listSiteMeetingTenants(auth.accessToken, { limit: 30, search: query || undefined }),
        listSiteMeetingReminderLogs(auth.accessToken, { limit: 20, search: query || undefined }),
      ]);
      setOverview(overviewResult);
      setTenants(tenantsResult.data);
      setLogs(logsResult.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load site-admin meeting oversight.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const signals = useMemo(() => {
    const booked = Object.values(overview.meetings).reduce((sum, value) => sum + (value ?? 0), 0);
    const completed = countFrom(overview.meetings, ["COMPLETED"]);
    const failures = countFrom(overview.reminderDelivery, ["FAILED", "DEAD_LETTER"]);
    const activeRequests = countFrom(overview.booking.requests, ["CONFIRMED", "PENDING_APPROVAL"]);
    return { booked, completed, failures, activeRequests };
  }, [overview]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "#2563eb18" }}>
            <CalendarCheck2 className="size-4 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Meetings</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">{signals.booked} booked · {overview.policies.tenantsWithSettings} tenants configured · ${overview.aiUsage.estimatedCost.toFixed(2)} AI cost</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={Video} label="Booked" value={signals.booked} subtext={`${signals.completed} completed`} tone="#111111" />
        <MetricCard icon={CalendarCheck2} label="Booking pages" value={overview.booking.activePages} subtext={`${signals.activeRequests} active requests`} tone="#2563eb" />
        <MetricCard icon={Workflow} label="Reminder failures" value={signals.failures} subtext={`${overview.reminderDelivery.SENT ?? 0} sent`} tone={signals.failures ? "#dc2626" : "#047857"} />
        <MetricCard icon={ShieldCheck} label="Public booking" value={overview.policies.publicBookingEnabled} subtext="tenants enabled" tone="#047857" />
        <MetricCard icon={Bot} label="Meeting AI" value={overview.policies.aiMeetingEnabled} subtext={`${overview.aiUsage.requests} requests`} tone="#6d5dd3" />
        <MetricCard icon={SearchCheck} label="Tokens" value={formatNumber(overview.aiUsage.totalTokens)} subtext="meeting AI usage" tone="#d89b00" />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search tenant name or slug..." />
          <div className="rounded-2xl bg-[#ecfdf5] px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700" style={{ border: "1px solid #bbf7d0" }}>
            <EyeOff className="mr-1 inline size-3.5" />
            Titles, notes, attendees, and content are redacted
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <OpsPanel accent="#2563eb" eyebrow="Tenant meeting posture" title="Policies, utilization, and delivery health">
          {loading ? (
            <EmptyState text="Loading tenant meeting posture..." />
          ) : tenants.length === 0 ? (
            <EmptyState text="No tenants matched this meeting filter." />
          ) : (
            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid #e7dfcf" }}>
              <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] gap-3 border-b border-[#eee8dc] bg-[#fbfaf6] px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#8a8375]">
                <span>Tenant</span>
                <span>Meetings</span>
                <span>Reminders</span>
                <span>AI</span>
                <span>Policy</span>
              </div>
              {tenants.map((item) => {
                const meetingTotal = Object.values(item.meetings).reduce((sum, value) => sum + (value ?? 0), 0);
                const failed = countFrom(item.reminderDelivery, ["FAILED", "DEAD_LETTER"]);
                const settings = item.tenant.meetingIntegrationSettings;
                return (
                  <div key={item.tenant.id} className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] items-center gap-3 border-b border-[#eee8dc] px-4 py-3 last:border-b-0">
                    <div className="min-w-0">
                      <Link href={`/site-admin/tenants/${item.tenant.id}`} className="truncate text-[13px] font-black text-[#111111] hover:underline">{item.tenant.name}</Link>
                      <p className="truncate text-[11px] font-semibold text-[#8a8375]">@{item.tenant.slug}</p>
                    </div>
                    <span className="text-sm font-black text-[#111111]">{meetingTotal}</span>
                    <span className={failed ? "text-sm font-black text-red-600" : "text-sm font-black text-emerald-700"}>{failed} failed</span>
                    <span className="text-sm font-black text-[#6d5dd3]">${item.aiUsage.estimatedCost.toFixed(2)}</span>
                    <div className="flex flex-wrap justify-end gap-1">
                      {settings?.publicBookingEnabled ? <MiniBadge label="Booking" /> : null}
                      {settings?.calendarSyncEnabled ? <MiniBadge label="Calendar" /> : null}
                      {settings?.whatsappRemindersEnabled ? <MiniBadge label="WA" /> : null}
                      {settings?.aiMeetingProcessingEnabled ? <MiniBadge label="AI" /> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </OpsPanel>

        <OpsPanel accent="#ef4444" eyebrow="Delivery pressure" title="Failures and retry candidates">
          <div className="space-y-2">
            {overview.deliveryPressure.length ? overview.deliveryPressure.map((item, index) => (
              <RowCard key={`${item.tenant?.id ?? "tenant"}-${item.status}-${index}`}>
                <div>
                  <p className="text-[13px] font-black text-[#111111]">{item.tenant?.name ?? "Unknown tenant"}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#8a8375]">@{item.tenant?.slug ?? "unknown"} · {item.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-red-600">{item.failures}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8375]">failures</p>
                </div>
              </RowCard>
            )) : <EmptyState text="No reminder delivery pressure in this range." />}
          </div>
        </OpsPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <OpsPanel accent="#6d5dd3" eyebrow="Top tenants" title="Meeting volume leaders">
          <div className="space-y-2">
            {overview.topTenants.length ? overview.topTenants.map((item) => (
              <RowCard key={item.tenant?.id ?? "unknown"}>
                <div>
                  <p className="text-[13px] font-black text-[#111111]">{item.tenant?.name ?? "Unknown tenant"}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#8a8375]">@{item.tenant?.slug ?? "unknown"}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[#6d5dd3]">{item.meetings}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8375]">meetings</p>
                </div>
              </RowCard>
            )) : <EmptyState text="No meeting volume available yet." />}
          </div>
        </OpsPanel>

        <OpsPanel accent="#d89b00" eyebrow="Reminder delivery logs" title="Content-safe retry telemetry">
          {logs.length ? (
            <div className="space-y-2">
              {logs.map((log) => (
                <RowCard key={log.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-black text-[#111111]">{log.tenant?.name ?? "Unknown tenant"}</p>
                      <StatusBadge value={log.status} />
                    </div>
                    <p className="mt-1 truncate text-[11px] font-semibold text-[#8a8375]">
                      {log.channel} · {log.provider ?? "provider n/a"} · meeting content redacted
                    </p>
                    {log.lastError ? <p className="mt-2 line-clamp-2 text-[11px] font-bold text-red-600">{log.lastError}</p> : null}
                  </div>
                  <div className="text-right text-[11px] font-bold text-[#8a8375]">
                    <p>{formatDate(log.scheduledFor)}</p>
                    <p>{log.attempts}/{log.maxAttempts} attempts</p>
                  </div>
                </RowCard>
              ))}
            </div>
          ) : (
            <EmptyState text="No reminder logs matched this filter." />
          )}
        </OpsPanel>
      </div>
    </div>
  );
}

function MiniBadge({ label }: { label: string }) {
  return <span className="rounded-full bg-[#fbfaf6] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#5f574c]" style={{ border: "1px solid #ded8c8" }}>{label}</span>;
}
