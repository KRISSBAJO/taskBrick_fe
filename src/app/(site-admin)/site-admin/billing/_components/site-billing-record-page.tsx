"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  CreditCard,
  DatabaseZap,
  Fingerprint,
  RefreshCw,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  listSiteBillingEntitlements,
  listSiteBillingEvents,
  listSiteBillingInvoices,
  listSiteBillingSubscriptions,
  listSiteBillingUsageRecords,
  type SiteBillingEntitlement,
  type SiteBillingEvent,
  type SiteInvoice,
  type SiteSubscription,
  type SiteUsageRecord,
} from "@/lib/api";
import { cn } from "@/lib/cn";

export type BillingRecordsKind = "subscriptions" | "invoices" | "usage" | "events" | "entitlements";

type PageConfig = {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

const CONFIG: Record<BillingRecordsKind, PageConfig> = {
  subscriptions: {
    title: "Subscriptions",
    eyebrow: "Tenant plan state",
    description: "Inspect tenant plan assignments, provider status, seats, periods, and subscription health.",
    icon: CreditCard,
    accent: "#2563eb",
  },
  invoices: {
    title: "Invoices",
    eyebrow: "Collection records",
    description: "Review provider invoices, payment status, currencies, customer records, and hosted invoice links.",
    icon: DatabaseZap,
    accent: "#111111",
  },
  usage: {
    title: "Usage",
    eyebrow: "Metered consumption",
    description: "Track feature consumption across tenants for AI tokens, storage, automations, projects, and other billable limits.",
    icon: Activity,
    accent: "#d89b00",
  },
  events: {
    title: "Billing events",
    eyebrow: "Provider webhooks",
    description: "Audit Stripe, Paystack, and internal billing event ingestion with idempotency and processing state.",
    icon: Fingerprint,
    accent: "#dc2626",
  },
  entitlements: {
    title: "Entitlements",
    eyebrow: "Feature access",
    description: "Inspect tenant feature access, limits, seat usage, and plan-level capabilities from the platform boundary.",
    icon: ShieldCheck,
    accent: "#047857",
  },
};

type BillingRecord =
  | SiteSubscription
  | SiteInvoice
  | SiteUsageRecord
  | SiteBillingEvent
  | SiteBillingEntitlement;

export function SiteBillingRecordsPage({ kind }: { kind: BillingRecordsKind }) {
  const { auth } = useWorkspaceAuth();
  const config = CONFIG[kind];
  const Icon = config.icon;
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const baseQuery = { limit: 50, search: query || undefined };
      if (kind === "subscriptions") {
        const result = await listSiteBillingSubscriptions(auth.accessToken, baseQuery);
        setRecords(result.data);
      } else if (kind === "invoices") {
        const result = await listSiteBillingInvoices(auth.accessToken, baseQuery);
        setRecords(result.data);
      } else if (kind === "usage") {
        const result = await listSiteBillingUsageRecords(auth.accessToken, baseQuery);
        setRecords(result.data);
      } else if (kind === "events") {
        const result = await listSiteBillingEvents(auth.accessToken, baseQuery);
        setRecords(result.data);
      } else {
        const result = await listSiteBillingEntitlements(auth.accessToken, baseQuery);
        setRecords(result.data);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable to load ${config.title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, config.title, kind, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 160);
    return () => window.clearTimeout(timer);
  }, [load]);

  const metric = useMemo(() => summarize(kind, records), [kind, records]);

  return (
    <main className="mx-auto max-w-7xl space-y-5">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: `${config.accent}18` }}>
            <Icon className="size-4" aria-hidden="true" style={{ color: config.accent }} />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">{config.title}</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">
              {records.length} {config.title.toLowerCase()} · {metric.value} {metric.label.toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/site-admin/billing"
            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#fbfaf6] px-3 text-[12px] font-black text-[#5f574c] transition hover:bg-[#f0ebe0]"
            style={{ border: "1px solid #ded8c8" }}
          >
            <ArrowLeft className="size-3.5" /> Billing
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      {/* ── Search bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 rounded-[14px] bg-white px-3" style={{ border: "1px solid #ded8c8" }}>
        <Search className="size-4 text-[#8a8375]" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${config.title.toLowerCase()}...`}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold text-[#111111] outline-none placeholder:text-[#8a8375]"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-line bg-white shadow-sm">
        <div className="border-b border-line px-5 py-4">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-ink-soft">Directory</p>
          <h2 className="mt-1 text-lg font-black text-[#111111]">{records.length} {config.title.toLowerCase()} returned</h2>
        </div>
        <div className="p-4">
          {loading ? (
            <Empty text={`Loading ${config.title.toLowerCase()}...`} />
          ) : records.length === 0 ? (
            <Empty text={`No ${config.title.toLowerCase()} matched this filter.`} />
          ) : (
            <div className="grid gap-3">
              {records.map((record) => (
                <RecordRow key={recordKey(kind, record)} kind={kind} record={record} accent={config.accent} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function RecordRow({ accent, kind, record }: { accent: string; kind: BillingRecordsKind; record: BillingRecord }) {
  if (kind === "subscriptions") return <SubscriptionRow record={record as SiteSubscription} accent={accent} />;
  if (kind === "invoices") return <InvoiceRow record={record as SiteInvoice} accent={accent} />;
  if (kind === "usage") return <UsageRow record={record as SiteUsageRecord} accent={accent} />;
  if (kind === "events") return <EventRow record={record as SiteBillingEvent} accent={accent} />;
  return <EntitlementRow record={record as SiteBillingEntitlement} accent={accent} />;
}

function SubscriptionRow({ accent, record }: { accent: string; record: SiteSubscription }) {
  return (
    <Card accent={accent} status={record.status}>
      <RecordMain
        title={record.tenant?.name ?? "Unknown tenant"}
        subtitle={`@${record.tenant?.slug ?? "n/a"} - ${record.provider} - ${record.plan?.name ?? "No plan"}`}
        href={record.tenant?.id ? `/site-admin/tenants/${record.tenant.id}/billing` : undefined}
      />
      <RecordMeta label="Seats" value={record.seatCount} />
      <RecordMeta label="Period end" value={formatDate(record.currentPeriodEnd)} />
    </Card>
  );
}

function InvoiceRow({ accent, record }: { accent: string; record: SiteInvoice }) {
  return (
    <Card accent={accent} status={record.status}>
      <RecordMain
        title={record.number ?? record.providerInvoiceId ?? record.id}
        subtitle={`${record.subscription?.tenant?.name ?? "Unknown tenant"} - ${record.provider} - ${formatDate(record.createdAt)}`}
        href={record.subscription?.tenant?.id ? `/site-admin/tenants/${record.subscription.tenant.id}/billing` : undefined}
      />
      <RecordMeta label="Amount" value={formatMoney(record.total ?? record.amount, record.currency)} />
      {record.hostedInvoiceUrl ? (
        <a className="inline-flex size-10 items-center justify-center rounded-2xl border border-line bg-white text-[#111111]" href={record.hostedInvoiceUrl} target="_blank" rel="noreferrer" aria-label="Open invoice">
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      ) : null}
    </Card>
  );
}

function UsageRow({ accent, record }: { accent: string; record: SiteUsageRecord }) {
  return (
    <Card accent={accent} status={record.source}>
      <RecordMain
        title={record.featureKey}
        subtitle={`${record.tenant?.name ?? "Unknown tenant"} - ${record.subscription?.plan?.name ?? "No plan"} - ${formatDate(record.createdAt)}`}
        href={record.tenant?.id ? `/site-admin/tenants/${record.tenant.id}/billing` : undefined}
      />
      <RecordMeta label="Quantity" value={`${record.quantity} ${record.unit ?? ""}`.trim()} />
      <RecordMeta label="Window" value={`${formatDate(record.periodStart)} - ${formatDate(record.periodEnd)}`} />
    </Card>
  );
}

function EventRow({ accent, record }: { accent: string; record: SiteBillingEvent }) {
  return (
    <Card accent={accent} status={record.status}>
      <RecordMain
        title={record.type}
        subtitle={`${record.provider} - ${record.eventId} - ${record.tenant?.name ?? "Platform"} - ${formatDate(record.createdAt)}`}
        href={record.tenant?.id ? `/site-admin/tenants/${record.tenant.id}/billing` : undefined}
      />
      {record.error ? <p className="max-w-md text-xs font-bold text-red-600">{record.error}</p> : <RecordMeta label="Processed" value={formatDate(record.processedAt)} />}
    </Card>
  );
}

function EntitlementRow({ accent, record }: { accent: string; record: SiteBillingEntitlement }) {
  return (
    <Card accent={accent} status={record.subscription.status}>
      <RecordMain
        title={record.tenant.name}
        subtitle={`${record.plan.name} - seats ${record.seatUsage.used}/${record.seatUsage.limit}`}
        href={`/site-admin/tenants/${record.tenant.id}/billing`}
      />
      <RecordMeta label="Features" value={record.entitlements.length} />
      <div className="flex max-w-xl flex-wrap gap-1.5">
        {record.entitlements.slice(0, 6).map((item) => (
          <span key={item.key} className="rounded-full border border-line bg-white px-2 py-1 text-[10px] font-black text-[#111111]">
            {item.name}: {item.limit ?? (item.enabled ? "ON" : "OFF")}
          </span>
        ))}
      </div>
    </Card>
  );
}

function Card({ accent, children, status }: { accent: string; children: ReactNode; status: string }) {
  return (
    <article className="grid gap-3 rounded-3xl border border-line bg-panel-muted p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 h-10 w-1 shrink-0 rounded-full" style={{ background: accent }} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <StatusBadge value={status} />
    </article>
  );
}

function RecordMain({ href, subtitle, title }: { href?: string; subtitle: string; title: string }) {
  const content = <span className="truncate text-sm font-black text-[#111111] hover:text-[#6d5dd3]">{title}</span>;
  return (
    <div className="min-w-0">
      {href ? <Link href={href}>{content}</Link> : content}
      <p className="mt-1 truncate text-xs font-semibold text-ink-soft">{subtitle}</p>
    </div>
  );
}

function RecordMeta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">{label}</p>
      <p className="mt-1 text-sm font-black text-[#111111]">{value}</p>
    </div>
  );
}

function Metric({ accent, label, value }: { accent: string; label: string; value: ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-panel-muted p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <p className="mt-2 text-3xl font-black" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const normalized = String(value).replace(/_/g, " ").toUpperCase();
  const good = /ACTIVE|PAID|PROCESSED|DELIVERED|API/.test(normalized);
  const bad = /FAILED|CANCEL|EXPIRED|PAST|ERROR/.test(normalized);
  return (
    <span className={cn(
      "inline-flex h-8 items-center justify-center rounded-full border px-3 text-[10px] font-black uppercase tracking-[0.1em]",
      good && "border-emerald-200 bg-emerald-50 text-emerald-700",
      bad && "border-red-200 bg-red-50 text-red-700",
      !good && !bad && "border-yellow-200 bg-yellow-50 text-[#8a6500]",
    )}>
      {normalized}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-line bg-panel-muted p-8 text-center text-sm font-bold text-ink-soft">{text}</div>;
}

function summarize(kind: BillingRecordsKind, records: BillingRecord[]) {
  if (kind === "invoices") {
    const paid = (records as SiteInvoice[]).filter((item) => item.status?.toLowerCase() === "paid").length;
    return { label: "Paid", value: paid, accent: "#047857" };
  }
  if (kind === "events") {
    const failed = (records as SiteBillingEvent[]).filter((item) => item.status === "FAILED").length;
    return { label: "Failed", value: failed, accent: failed ? "#dc2626" : "#047857" };
  }
  if (kind === "usage") {
    const quantity = (records as SiteUsageRecord[]).reduce((sum, item) => sum + item.quantity, 0);
    return { label: "Quantity", value: quantity, accent: "#d89b00" };
  }
  if (kind === "entitlements") {
    const features = (records as SiteBillingEntitlement[]).reduce((sum, item) => sum + item.entitlements.length, 0);
    return { label: "Features", value: features, accent: "#047857" };
  }
  const active = (records as SiteSubscription[]).filter((item) => item.status === "ACTIVE").length;
  return { label: "Active", value: active, accent: "#2563eb" };
}

function recordKey(kind: BillingRecordsKind, record: BillingRecord) {
  if (kind === "entitlements") return (record as SiteBillingEntitlement).subscription.id;
  return "id" in record ? record.id : crypto.randomUUID();
}

function formatDate(value?: string | null) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatMoney(value?: string | number | null, currency = "USD") {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "n/a";
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
}
