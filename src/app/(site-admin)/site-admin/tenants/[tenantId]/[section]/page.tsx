"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bot,
  Building2,
  CalendarClock,
  CreditCard,
  Database,
  FileText,
  FolderKanban,
  Link2,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  listSiteTenantResource,
  type SiteTenantResourceResponse,
  type SiteTenantResourceSection,
} from "@/lib/api";

type ResourceRecord = Record<string, unknown>;

const SECTIONS: Array<{
  key: SiteTenantResourceSection;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}> = [
  { key: "users", label: "Users", title: "Tenant users", description: "Members, roles, status, and identity verification inside this tenant.", icon: Users, accent: "#2563eb" },
  { key: "projects", label: "Projects", title: "Tenant projects", description: "Delivery portfolio, visibility, status, progress, and workload counts.", icon: FolderKanban, accent: "#6d5dd3" },
  { key: "workspaces", label: "Workspaces", title: "Tenant workspaces", description: "Workspace segmentation, teams, projects, and custom-field surface.", icon: Building2, accent: "#6d5dd3" },
  { key: "teams", label: "Teams", title: "Tenant teams", description: "Team ownership, workspace placement, member counts, and project load.", icon: Users, accent: "#059669" },
  { key: "sessions", label: "Sessions", title: "Tenant sessions", description: "Active, revoked, expired, MFA-backed, and trusted-device sessions.", icon: CalendarClock, accent: "#059669" },
  { key: "security", label: "Security", title: "Tenant security", description: "Security posture, policy signals, SSO/MFA state, API keys, and events.", icon: ShieldAlert, accent: "#dc2626" },
  { key: "billing", label: "Billing", title: "Tenant billing", description: "Subscription, invoices, metered usage, seats, and billing events.", icon: CreditCard, accent: "#d89b00" },
  { key: "integrations", label: "Integrations", title: "Tenant integrations", description: "Connected providers, webhooks, delivery health, and sync state.", icon: Link2, accent: "#111111" },
  { key: "files", label: "Files", title: "Tenant files", description: "Storage footprint, upload provenance, visibility, archive, and delete state.", icon: Database, accent: "#5f574c" },
  { key: "ai", label: "AI usage", title: "Tenant AI usage", description: "AI settings, agents, token use, costs, conversations, and action state.", icon: Bot, accent: "#6d5dd3" },
  { key: "reports", label: "Reports", title: "Tenant reports", description: "Reports, dashboards, executions, exports, and reporting freshness.", icon: BarChart3, accent: "#2563eb" },
  { key: "activity", label: "Activity", title: "Tenant activity", description: "Tenant audit, platform audit, and recent security activity in one timeline.", icon: Activity, accent: "#dc2626" },
];

export default function SiteAdminTenantResourcePage() {
  const params = useParams<{ tenantId: string; section: string }>();
  const tenantId = String(params.tenantId ?? "");
  const section = normalizeSection(String(params.section ?? ""));
  const { auth } = useWorkspaceAuth();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState<SiteTenantResourceResponse<ResourceRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const config = SECTIONS.find((item) => item.key === section) ?? SECTIONS[0];
  const HeaderIcon = config.icon;

  const loadResource = useCallback(async () => {
    if (!tenantId || !section) return;
    setLoading(true);
    setError("");
    try {
      setResource(await listSiteTenantResource<ResourceRecord>(auth.accessToken, tenantId, section, {
        page,
        limit: 30,
        search: query || undefined,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load tenant resource.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, page, query, section, tenantId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadResource();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loadResource]);

  const summaryEntries = useMemo(() => Object.entries(resource?.summary ?? {}).slice(0, 8), [resource?.summary]);

  if (!section) {
    return <EmptyState text="Unknown tenant operation section." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(17,17,17,0.08)] md:p-6" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/site-admin/tenants/${tenantId}`} className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#fbfaf6] px-3 text-[12px] font-black text-[#111111] transition hover:bg-[#ffd400]" style={{ border: "1px solid #ded8c8" }}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                Tenant detail
              </Link>
              {resource?.tenant ? <StatusBadge value={resource.tenant.status} /> : null}
            </div>
            <div className="mt-5 flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-[20px] bg-[#111111] text-white shadow-[0_16px_36px_rgba(17,17,17,0.16)]">
                <HeaderIcon className="size-6" style={{ color: config.accent === "#111111" ? "#ffd400" : config.accent }} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a8375]">{resource?.tenant?.name ?? "Tenant operations"}</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-[#111111] md:text-[40px]">{config.title}</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#665f54]">{config.description}</p>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => loadResource()} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#ffd400] px-4 text-[12px] font-black text-[#111111] shadow-[0_14px_30px_rgba(255,212,0,0.22)] transition hover:bg-[#f2c200]">
            <RefreshCw className="size-4" aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {SECTIONS.map((item) => (
            <Link
              key={item.key}
              href={`/site-admin/tenants/${tenantId}/${item.key}`}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl px-3 text-[11px] font-black transition"
              style={{
                background: item.key === section ? "#111111" : "#fbfaf6",
                border: "1px solid #ded8c8",
                color: item.key === section ? "#ffffff" : "#5f574c",
              }}
            >
              <item.icon className="size-4" style={{ color: item.key === section ? item.accent : undefined }} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {summaryEntries.length === 0 && loading ? (
          <SummaryCard label="Loading" value="..." accent={config.accent} />
        ) : summaryEntries.length === 0 ? (
          <SummaryCard label="Summary" value="No data" accent={config.accent} />
        ) : (
          summaryEntries.map(([key, value]) => <SummaryCard key={key} label={humanize(key)} value={formatSummary(value)} accent={config.accent} />)
        )}
      </section>

      <section className="overflow-hidden rounded-[26px] bg-white shadow-[0_16px_50px_rgba(17,17,17,0.07)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3 border-b border-[#eee8dc] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#fbfaf6] px-3" style={{ border: "1px solid #ded8c8" }}>
            <Search className="size-4 text-[#8a8375]" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
              placeholder={`Search ${config.label.toLowerCase()}...`}
              className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#8a8375]"
            />
          </div>
          <p className="text-[12px] font-bold text-[#766f63]">{resource?.meta.total ?? 0} records</p>
        </div>

        {error ? <div className="m-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#fbfaf6] text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">
              <tr>
                <th className="px-5 py-3">Record</th>
                <th className="px-5 py-3">Scope</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Signal</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee8dc]">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm font-bold text-[#8a8375]">Loading {config.label.toLowerCase()}...</td></tr>
              ) : (resource?.data ?? []).length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm font-bold text-[#8a8375]">No records returned for this section.</td></tr>
              ) : (
                (resource?.data ?? []).map((row, index) => (
                  <tr key={String(row.id ?? `${section}-${index}`)} className="bg-white transition hover:bg-[#fffdf2]">
                    <td className="min-w-[320px] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4f1e7] text-[#111111]" style={{ border: "1px solid #ded8c8" }}>
                          {iconForKind(row.kind, config.icon)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-black text-[#111111]">{primaryText(row)}</p>
                          <p className="truncate text-[11px] font-semibold text-[#766f63]">{secondaryText(row)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[12px] font-bold text-[#5f574c]">{scopeText(row)}</td>
                    <td className="px-5 py-4"><StatusBadge value={statusText(row)} /></td>
                    <td className="max-w-[300px] px-5 py-4 text-[12px] font-semibold text-[#665f54]">{signalText(row)}</td>
                    <td className="px-5 py-4 text-[12px] font-bold text-[#766f63]">{dateText(row)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#eee8dc] px-5 py-4">
          <p className="text-[12px] font-bold text-[#766f63]">Page {resource?.meta.page ?? page}</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="h-10 rounded-2xl bg-[#fbfaf6] px-4 text-[12px] font-black disabled:opacity-40" style={{ border: "1px solid #ded8c8" }}>Previous</button>
            <button type="button" disabled={(resource?.meta.total ?? 0) <= page * (resource?.meta.limit ?? 30)} onClick={() => setPage((value) => value + 1)} className="h-10 rounded-2xl bg-[#111111] px-4 text-[12px] font-black text-white disabled:opacity-40">Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function normalizeSection(value: string): SiteTenantResourceSection | null {
  return SECTIONS.some((item) => item.key === value) ? (value as SiteTenantResourceSection) : null;
}

function SummaryCard({ accent, label, value }: { accent: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_12px_36px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{label}</p>
      <p className="mt-2 truncate text-2xl font-black" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const upper = value.toUpperCase();
  const tone = ["ACTIVE", "COMPLETED", "SUCCESS", "DELIVERED", "RESOLVED"].includes(upper)
    ? "#047857"
    : ["SUSPENDED", "FAILED", "ERROR", "REVOKED", "CANCELLED", "DEACTIVATED", "CRITICAL"].includes(upper)
      ? "#dc2626"
      : "#6d5dd3";
  return <span className="inline-flex h-7 items-center rounded-full bg-white px-3 text-[10px] font-black uppercase tracking-[0.08em]" style={{ border: "1px solid #ded8c8", color: tone }}>{upper}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="mx-auto max-w-3xl rounded-[22px] border border-dashed border-[#ded8c8] bg-white px-5 py-16 text-center text-sm font-bold text-[#8a8375]">{text}</div>;
}

function iconForKind(kind: unknown, fallback: LucideIcon) {
  const Icon = fallback;
  const key = String(kind ?? "");
  if (key === "report") return <FileText className="size-4" aria-hidden="true" />;
  if (key === "dashboard") return <BarChart3 className="size-4" aria-hidden="true" />;
  if (key === "webhook" || key === "integration") return <Link2 className="size-4" aria-hidden="true" />;
  if (key === "agent" || key === "usage" || key === "settings") return <Bot className="size-4" aria-hidden="true" />;
  if (key === "tenantAudit" || key === "platformAudit") return <Activity className="size-4" aria-hidden="true" />;
  if (key === "subscription" || key === "invoice") return <CreditCard className="size-4" aria-hidden="true" />;
  if (key === "securityEvent") return <ShieldAlert className="size-4" aria-hidden="true" />;
  return <Icon className="size-4" aria-hidden="true" />;
}

function primaryText(row: ResourceRecord) {
  return stringValue(row.name) || stringValue(row.title) || stringValue(row.email) || stringValue(row.fileName) || stringValue(row.type) || stringValue(row.action) || stringValue(row.provider) || stringValue(row.kind) || stringValue(row.id) || "Record";
}

function secondaryText(row: ResourceRecord) {
  const project = objectValue(row.project);
  const workspace = objectValue(row.workspace);
  const user = objectValue(row.user);
  return stringValue(row.description)
    || stringValue(row.slug)
    || stringValue(row.key)
    || stringValue(row.externalAccountId)
    || stringValue(row.entityType)
    || stringValue(row.featureKey)
    || stringValue(row.model)
    || stringValue(project?.name)
    || stringValue(workspace?.name)
    || stringValue(user?.email)
    || stringValue(row.id)
    || "-";
}

function statusText(row: ResourceRecord) {
  if (typeof row.enabled === "boolean") return row.enabled ? "ACTIVE" : "DISABLED";
  return stringValue(row.status) || stringValue(row.visibility) || stringValue(row.severity) || (row.revokedAt ? "REVOKED" : "ACTIVE");
}

function scopeText(row: ResourceRecord) {
  const tenant = objectValue(row.tenant);
  const team = objectValue(row.team);
  const workspace = objectValue(row.workspace);
  return stringValue(row.kind)
    || stringValue(row.provider)
    || stringValue(row.scope)
    || stringValue(row.entityType)
    || stringValue(row.authMethod)
    || stringValue(team?.name)
    || stringValue(workspace?.name)
    || stringValue(tenant?.slug)
    || "-";
}

function signalText(row: ResourceRecord) {
  const count = objectValue(row._count);
  const parts = [
    count ? Object.entries(count).slice(0, 3).map(([key, value]) => `${humanize(key)} ${String(value)}`).join(" - ") : "",
    typeof row.sizeBytes === "number" ? `${formatBytes(row.sizeBytes)}` : "",
    typeof row.totalTokens === "number" ? `${row.totalTokens} tokens` : "",
    typeof row.failureCount === "number" ? `${row.failureCount} failures` : "",
    stringValue(row.lastError),
    stringValue(row.reason),
  ].filter(Boolean);
  return parts.join(" - ") || "-";
}

function dateText(row: ResourceRecord) {
  const value = stringValue(row.updatedAt) || stringValue(row.createdAt) || stringValue(row.lastLoginAt) || stringValue(row.expiresAt);
  return value ? formatDate(value) : "-";
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : "";
}

function objectValue(value: unknown): ResourceRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ResourceRecord) : null;
}

function formatSummary(value: unknown) {
  if (typeof value === "number") return Intl.NumberFormat("en").format(value);
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "None";
    return entries.slice(0, 3).map(([key, item]) => `${key}: ${String(item)}`).join(" / ");
  }
  return value == null ? "None" : String(value);
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
