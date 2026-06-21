"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  Bot,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  KeyRound,
  Loader2,
  RefreshCw,
  Save,
  Video,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  getMeetingAdminOverview,
  updateMeetingPolicy,
  type MeetingAdminOverview,
  type MeetingPolicy,
  type Visibility,
} from "@/lib/api";
import { cn } from "@/lib/cn";

const visibilityOptions: Visibility[] = ["PRIVATE", "TEAM", "WORKSPACE", "ORGANIZATION", "PUBLIC"];

const emptyOverview: MeetingAdminOverview = {
  policy: {
    id: "",
    tenantId: "",
    publicBookingEnabled: true,
    publicBookingCreatorPermissions: ["manage:meetings"],
    calendarConnectionPermissions: ["manage:meetings", "manage:integrations", "manage:tenant"],
    whatsappConnectionPermissions: ["manage:meetings", "manage:integrations", "manage:tenant"],
    defaultMeetingVisibility: "TEAM",
    allowExternalGuests: true,
    requireApprovalForExternalGuests: false,
    maxAdvanceBookingDays: 90,
    minBookingNoticeMins: 120,
    maxMeetingDurationMins: 240,
    aiMeetingProcessingEnabled: true,
  },
  permissions: {
    canManagePolicy: false,
    canCreateBookingLinks: false,
    canConnectCalendar: false,
    canConnectWhatsApp: false,
    canUseMeetingAi: false,
  },
  analytics: {
    range: { from: "", to: "" },
    totals: {
      booked: 0,
      completed: 0,
      noShows: 0,
      cancelled: 0,
      live: 0,
      scheduled: 0,
      completionRate: 0,
      noShowRate: 0,
      cancellationRate: 0,
      meetingToTaskConversion: 0,
      convertedActionItems: 0,
      totalActionItems: 0,
      overdueFollowUps: 0,
    },
    byStatus: {},
    bookings: {},
    hostUtilization: [],
  },
  integrationHealth: {
    settings: {
      id: "",
      tenantId: "",
      publicBookingEnabled: true,
      publicBookingCreatorPermissions: ["manage:meetings"],
      calendarConnectionPermissions: ["manage:meetings"],
      whatsappConnectionPermissions: ["manage:meetings"],
      defaultMeetingVisibility: "TEAM",
      allowExternalGuests: true,
      requireApprovalForExternalGuests: false,
      maxAdvanceBookingDays: 90,
      minBookingNoticeMins: 120,
      maxMeetingDurationMins: 240,
      aiMeetingProcessingEnabled: true,
    },
    providers: {
      google: { connected: false, scopes: [] },
      microsoft: { connected: false, scopes: [] },
      zoom: { connected: false, scopes: [] },
      whatsapp: { connected: false, scopes: [] },
      email: { connected: false, scopes: [] },
      sms: { connected: false, scopes: [] },
      custom: { connected: false, scopes: [] },
    },
    queue: {},
    webhookErrors: [],
  },
  reminderDelivery: { byStatus: {}, byChannel: {}, failedRecent: [] },
  aiUsage: { totals: { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCost: 0 }, byType: [], recentFailures: [] },
  recentAudit: [],
};

export default function MeetingAdminPage() {
  const { auth } = useWorkspaceAuth();
  const { toast } = useToast();
  const [overview, setOverview] = useState<MeetingAdminOverview>(emptyOverview);
  const [draft, setDraft] = useState<MeetingPolicy>(emptyOverview.policy);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getMeetingAdminOverview(auth.accessToken);
      setOverview(result);
      setDraft(result.policy);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load meeting controls.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateMeetingPolicy(auth.accessToken, draft);
      setDraft(updated);
      setOverview((prev) => ({ ...prev, policy: updated }));
      toast({ title: "Meeting policy updated", description: "Tenant meeting controls are now active.", variant: "success" });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to update meeting policy.";
      setError(message);
      toast({ title: "Policy update failed", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const deliveryFailures = useMemo(
    () => (overview.reminderDelivery.byStatus.FAILED ?? 0) + (overview.reminderDelivery.byStatus.DEAD_LETTER ?? 0),
    [overview.reminderDelivery.byStatus],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ── Page header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#111111] text-[#ffd400] shadow-md">
            <Video className="size-6" aria-hidden="true" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ffd400]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#7a6300]">
              <span className="size-1.5 rounded-full bg-[#ffd400]" aria-hidden="true" />
              Meeting operations
            </div>
            <h1 className="mt-1 text-2xl font-black text-[#111111]">Controls &amp; Analytics</h1>
            <p className="text-sm font-medium text-[#68645b]">Govern booking, AI processing, and delivery across your workspace.</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/meetings"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e8e0c8] bg-white px-4 text-[12px] font-bold text-[#111111] shadow-sm transition hover:border-black/20 hover:shadow"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" /> Meetings
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e8e0c8] bg-white px-4 text-[12px] font-bold text-[#111111] shadow-sm transition hover:border-black/20 hover:shadow"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden="true" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !overview.permissions.canManagePolicy}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#ffd400] px-5 text-[12px] font-black text-[#111111] shadow-sm transition hover:-translate-y-px hover:bg-[#f2c200] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Save className="size-3.5" aria-hidden="true" />}
            Save policy
          </button>
        </div>
      </header>

      {/* ── Error banner ── */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-bold text-red-700">{error}</div>
      ) : null}

      {/* ── Metric strip ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={CalendarCheck2} label="Booked" value={overview.analytics.totals.booked} sub={`${overview.analytics.totals.scheduled} scheduled`} tone="#111111" />
        <MetricCard icon={CheckCircle2} label="Completion" value={`${overview.analytics.totals.completionRate}%`} sub={`${overview.analytics.totals.completed} meetings`} tone="#059669" />
        <MetricCard icon={Clock3} label="No-shows" value={`${overview.analytics.totals.noShowRate}%`} sub={`${overview.analytics.totals.noShows} missed`} tone={overview.analytics.totals.noShows ? "#dc2626" : "#059669"} />
        <MetricCard icon={Workflow} label="Task rate" value={`${overview.analytics.totals.meetingToTaskConversion}%`} sub={`${overview.analytics.totals.convertedActionItems} converted`} tone="#6d5dd3" />
        <MetricCard icon={Activity} label="Failures" value={deliveryFailures} sub={`${overview.reminderDelivery.byStatus.SENT ?? 0} sent`} tone={deliveryFailures ? "#dc2626" : "#059669"} />
        <MetricCard icon={Bot} label="AI cost" value={`$${overview.aiUsage.totals.estimatedCost.toFixed(2)}`} sub={`${overview.aiUsage.totals.requests} requests`} tone="#7c3aed" />
      </div>

      {/* ── Policy + Access posture ── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">

        {/* Policy panel */}
        <Panel eyebrow="Tenant policy" title="Governance controls" accent="#ffd400">
          <FieldGroup label="Feature switches">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Toggle
                label="Public booking pages"
                description="Allow visitors to book via public links"
                checked={draft.publicBookingEnabled}
                onChange={(v) => setDraft((p) => ({ ...p, publicBookingEnabled: v }))}
              />
              <Toggle
                label="External guests"
                description="Permit people outside the workspace to join"
                checked={draft.allowExternalGuests}
                onChange={(v) => setDraft((p) => ({ ...p, allowExternalGuests: v }))}
              />
              <Toggle
                label="Guest approval required"
                description="External guests must be approved first"
                checked={draft.requireApprovalForExternalGuests}
                onChange={(v) => setDraft((p) => ({ ...p, requireApprovalForExternalGuests: v }))}
              />
              <Toggle
                label="AI meeting automation"
                description="Transcribe, summarise, and convert to tasks"
                checked={draft.aiMeetingProcessingEnabled}
                onChange={(v) => setDraft((p) => ({ ...p, aiMeetingProcessingEnabled: v }))}
              />
            </div>
          </FieldGroup>

          <FieldGroup label="Booking limits" className="mt-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SelectField
                label="Default visibility"
                value={draft.defaultMeetingVisibility}
                options={visibilityOptions}
                onChange={(v) => setDraft((p) => ({ ...p, defaultMeetingVisibility: v as Visibility }))}
              />
              <NumberField
                label="Advance booking"
                unit="days"
                value={draft.maxAdvanceBookingDays}
                onChange={(v) => setDraft((p) => ({ ...p, maxAdvanceBookingDays: v }))}
              />
              <NumberField
                label="Min notice"
                unit="mins"
                value={draft.minBookingNoticeMins}
                onChange={(v) => setDraft((p) => ({ ...p, minBookingNoticeMins: v }))}
              />
              <NumberField
                label="Max duration"
                unit="mins"
                value={draft.maxMeetingDurationMins}
                onChange={(v) => setDraft((p) => ({ ...p, maxMeetingDurationMins: v }))}
              />
            </div>
          </FieldGroup>

          <FieldGroup label="Permission gates" className="mt-5">
            <div className="grid gap-3 lg:grid-cols-3">
              <PermissionField
                label="Booking link creators"
                value={draft.publicBookingCreatorPermissions}
                onChange={(v) => setDraft((p) => ({ ...p, publicBookingCreatorPermissions: v }))}
              />
              <PermissionField
                label="Calendar connectors"
                value={draft.calendarConnectionPermissions}
                onChange={(v) => setDraft((p) => ({ ...p, calendarConnectionPermissions: v }))}
              />
              <PermissionField
                label="WhatsApp connectors"
                value={draft.whatsappConnectionPermissions}
                onChange={(v) => setDraft((p) => ({ ...p, whatsappConnectionPermissions: v }))}
              />
            </div>
          </FieldGroup>
        </Panel>

        {/* Access posture panel */}
        <Panel eyebrow="Access posture" title="Your capabilities" accent="#111111">
          <div className="space-y-2">
            <Capability label="Create booking links" active={overview.permissions.canCreateBookingLinks} />
            <Capability label="Connect calendar &amp; video" active={overview.permissions.canConnectCalendar} />
            <Capability label="Connect WhatsApp reminders" active={overview.permissions.canConnectWhatsApp} />
            <Capability label="Use meeting AI" active={overview.permissions.canUseMeetingAi} />
            <Capability label="Manage tenant policy" active={overview.permissions.canManagePolicy} />
          </div>
        </Panel>
      </div>

      {/* ── Integrations + Hosts + Audit ── */}
      <div className="grid gap-5 xl:grid-cols-3">

        {/* Provider health */}
        <Panel eyebrow="Provider health" title="Integration status" accent="#2563eb">
          <div className="space-y-2">
            {Object.entries(overview.integrationHealth.providers).map(([name, provider]) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-xl border border-[#e8e0c8] bg-[#faf9f5] px-4 py-3 transition hover:border-black/15 hover:bg-white"
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    provider.connected ? "bg-emerald-500" : "bg-[#ccc7bb]",
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1 text-sm font-bold capitalize text-[#111111]">{name}</span>
                {provider.connected ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
                    {(provider.scopes ?? []).length} scopes
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-[#68645b]">Not connected</span>
                )}
              </div>
            ))}
          </div>
        </Panel>

        {/* Host utilization */}
        <Panel eyebrow="Host utilization" title="Workload by host" accent="#10b981">
          <div className="space-y-3">
            {overview.analytics.hostUtilization.length ? (
              overview.analytics.hostUtilization.map((host) => {
                const name = host.host
                  ? `${host.host.firstName} ${host.host.lastName}`.trim() || host.host.email
                  : "Unassigned";
                const initials = name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <div key={host.hostId} className="rounded-xl border border-[#e8e0c8] bg-[#faf9f5] p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[10px] font-black text-white">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-[#111111]">{name}</p>
                          <span className="shrink-0 text-xs font-black text-emerald-600">{host.hours}h</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8e0c8]">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${Math.min(host.completionRate, 100)}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-[#68645b]">
                          {host.meetings} meetings · {host.completed} completed
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <Empty text="No host utilization data yet." />
            )}
          </div>
        </Panel>

        {/* Audit trail */}
        <Panel eyebrow="Audit trail" title="Recent activity" accent="#ef4444">
          {overview.recentAudit.length ? (
            <div className="relative">
              <div className="absolute left-[7px] top-2 h-[calc(100%-16px)] w-px bg-[#e8e0c8]" aria-hidden="true" />
              <div className="space-y-3">
                {overview.recentAudit.map((item) => (
                  <div key={item.id} className="flex gap-3 pl-1">
                    <div className="relative mt-1.5 flex size-3 shrink-0 items-center justify-center">
                      <span className="size-2 rounded-full bg-[#ffd400] ring-2 ring-white" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="text-[12px] font-bold leading-snug text-[#111111]">{item.action}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-[#f5f2e6] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#68645b]">
                          {item.entityType}
                        </span>
                        <span className="text-[10px] text-[#68645b]">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Empty text="No audit events yet." />
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ── Metric card ─────────────────────────────────────────────────────────── */

function MetricCard({ icon: Icon, label, sub, tone, value }: { icon: LucideIcon; label: string; sub: string; tone: string; value: number | string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e8e0c8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#68645b]">{label}</p>
          <p className="mt-2 text-[28px] font-black leading-none tracking-tight" style={{ color: tone }}>{value}</p>
          <p className="mt-1.5 truncate text-[11px] font-semibold text-[#68645b]">{sub}</p>
        </div>
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${tone}14`, color: tone }}
        >
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ backgroundColor: `${tone}28` }} />
    </div>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────────── */

function Panel({ accent, children, eyebrow, title }: { accent: string; children: ReactNode; eyebrow: string; title: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e8e0c8] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#e8e0c8] px-6 py-4">
        <div className="h-5 w-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden="true" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#68645b]">{eyebrow}</p>
          <h2 className="text-[15px] font-black text-[#111111]">{title}</h2>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

/* ── FieldGroup ──────────────────────────────────────────────────────────── */

function FieldGroup({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <div className={className}>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#68645b]">{label}</p>
      {children}
    </div>
  );
}

/* ── Toggle ──────────────────────────────────────────────────────────────── */

function Toggle({ checked, description, label, onChange }: { checked: boolean; description?: string; label: string; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-4 rounded-xl border border-[#e8e0c8] bg-[#faf9f5] px-4 py-3.5 text-left transition hover:border-black/15 hover:bg-white"
    >
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-[#111111]">{label}</p>
        {description ? <p className="mt-0.5 text-[11px] text-[#68645b]">{description}</p> : null}
      </div>
      <div
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-[#111111]" : "bg-[#d4ccbb]",
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5",
          )}
        />
      </div>
    </button>
  );
}

/* ── NumberField ─────────────────────────────────────────────────────────── */

function NumberField({ label, onChange, unit, value }: { label: string; unit?: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#68645b]">{label}</span>
      <div className="relative mt-1.5">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-11 w-full rounded-xl border border-[#e8e0c8] bg-white px-3 text-sm font-bold text-[#111111] outline-none transition focus:border-[#111111]"
          style={unit ? { paddingRight: "2.75rem" } : undefined}
        />
        {unit ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#68645b]">
            {unit}
          </span>
        ) : null}
      </div>
    </label>
  );
}

/* ── SelectField ─────────────────────────────────────────────────────────── */

function SelectField({ label, onChange, options, value }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#68645b]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-[#e8e0c8] bg-white px-3 text-sm font-bold text-[#111111] outline-none transition focus:border-[#111111]"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>
        ))}
      </select>
    </label>
  );
}

/* ── PermissionField ─────────────────────────────────────────────────────── */

function PermissionField({ label, onChange, value }: { label: string; value: string[]; onChange: (value: string[]) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#68645b]">{label}</span>
      <textarea
        value={value.join(", ")}
        onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        rows={3}
        className="mt-1.5 w-full resize-none rounded-xl border border-[#e8e0c8] bg-white px-3 py-2.5 text-[12px] font-semibold text-[#111111] outline-none transition focus:border-[#111111]"
        placeholder="permission:scope, ..."
      />
    </label>
  );
}

/* ── Capability ──────────────────────────────────────────────────────────── */

function Capability({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e8e0c8] bg-[#faf9f5] px-4 py-3.5">
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-emerald-50" : "bg-red-50",
        )}
      >
        <KeyRound
          className={cn("size-3.5", active ? "text-emerald-600" : "text-red-500")}
          aria-hidden="true"
        />
      </div>
      <span className="flex-1 text-[13px] font-bold text-[#111111]">{label}</span>
      <span
        className={cn(
          "rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
          active
            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
            : "border-red-100 bg-red-50 text-red-600",
        )}
      >
        {active ? "Allowed" : "Blocked"}
      </span>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#e8e0c8] bg-[#faf9f5] px-4 py-10 text-center text-sm font-semibold text-[#68645b]">
      {text}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
