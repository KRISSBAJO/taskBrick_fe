"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  Banknote,
  CheckCircle2,
  CreditCard,
  FileText,
  Gauge,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  cancelSiteSubscription,
  changeSiteSubscriptionPlan,
  getSiteBillingOverview,
  listSiteBillingEntitlements,
  listSiteBillingEvents,
  listSiteBillingInvoices,
  listSiteBillingPlans,
  listSiteBillingSubscriptions,
  listSiteBillingUsageRecords,
  resumeSiteSubscription,
  startSiteTenantTrial,
  updateSiteSubscription,
  type SiteBillingEntitlement,
  type SiteBillingEvent,
  type SiteBillingOverview,
  type SiteBillingPlan,
  type SiteInvoice,
  type SiteSubscription,
  type SiteUsageRecord,
} from "@/lib/api";
import { cn } from "@/lib/cn";

type BillingView = "subscriptions" | "plans" | "invoices" | "usage" | "entitlements" | "webhooks";

const VIEWS: Array<{ id: BillingView; label: string; icon: LucideIcon; href: string }> = [
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard, href: "/site-admin/billing/subscriptions" },
  { id: "plans", label: "Plans", icon: PackageCheck, href: "/site-admin/billing/plans" },
  { id: "invoices", label: "Invoices", icon: FileText, href: "/site-admin/billing/invoices" },
  { id: "usage", label: "Usage", icon: Gauge, href: "/site-admin/billing/usage" },
  { id: "entitlements", label: "Entitlements", icon: ShieldCheck, href: "/site-admin/billing/entitlements" },
  { id: "webhooks", label: "Billing events", icon: Webhook, href: "/site-admin/billing/events" },
];

const STATUS_FILTERS = ["ALL", "TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"] as const;

const emptyOverview: SiteBillingOverview = {
  plans: 0,
  features: 0,
  subscriptions: {},
  invoices: {},
  usageRecords: 0,
  billingEvents: {},
  revenue: 0,
  recentSubscriptions: [],
  recentBillingEvents: [],
  tenantHealth: [],
};

export default function SiteAdminBillingPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [overview, setOverview] = useState<SiteBillingOverview>(emptyOverview);
  const [plans, setPlans] = useState<SiteBillingPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<SiteSubscription[]>([]);
  const [invoices, setInvoices] = useState<SiteInvoice[]>([]);
  const [usageRecords, setUsageRecords] = useState<SiteUsageRecord[]>([]);
  const [events, setEvents] = useState<SiteBillingEvent[]>([]);
  const [entitlements, setEntitlements] = useState<SiteBillingEntitlement[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const view = "subscriptions" as BillingView;
  const [planSelections, setPlanSelections] = useState<Record<string, string>>({});
  const [seatEdits, setSeatEdits] = useState<Record<string, string>>({});
  const [trialSelections, setTrialSelections] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canManageBilling = user.platformAdminLevel === "OWNER" || user.platformAdminLevel === "ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResult, planResult, subscriptionResult, invoiceResult, usageResult, eventResult, entitlementResult] =
        await Promise.all([
          getSiteBillingOverview(auth.accessToken),
          listSiteBillingPlans(auth.accessToken, { limit: 60, search: query || undefined }),
          listSiteBillingSubscriptions(auth.accessToken, {
            limit: 40,
            search: query || undefined,
            status: status === "ALL" ? undefined : status,
          }),
          listSiteBillingInvoices(auth.accessToken, { limit: 25, search: query || undefined }),
          listSiteBillingUsageRecords(auth.accessToken, { limit: 25, search: query || undefined }),
          listSiteBillingEvents(auth.accessToken, { limit: 25, search: query || undefined }),
          listSiteBillingEntitlements(auth.accessToken, { limit: 25, search: query || undefined }),
        ]);
      setOverview(overviewResult);
      setPlans(planResult.data);
      setSubscriptions(subscriptionResult.data);
      setInvoices(invoiceResult.data);
      setUsageRecords(usageResult.data);
      setEvents(eventResult.data);
      setEntitlements(entitlementResult.data);
      setPlanSelections((current) => {
        const next = { ...current };
        for (const subscription of subscriptionResult.data) next[subscription.id] ??= subscription.planId;
        return next;
      });
      setSeatEdits((current) => {
        const next = { ...current };
        for (const subscription of subscriptionResult.data) next[subscription.id] ??= String(subscription.seatCount);
        return next;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load billing data.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, query, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const activePlans = useMemo(() => plans.filter((plan) => plan.isActive && !plan.archivedAt), [plans]);
  const activeSubscriptions = overview.subscriptions.ACTIVE ?? 0;
  const trialingSubscriptions = overview.subscriptions.TRIALING ?? 0;
  const failedEvents = overview.billingEvents.FAILED ?? 0;
  const openBillingRisk = (overview.subscriptions.PAST_DUE ?? 0) + failedEvents;
  const defaultPlanId = activePlans[0]?.id ?? plans[0]?.id ?? "";

  async function applyPlan(subscription: SiteSubscription) {
    const planId = planSelections[subscription.id] ?? subscription.planId;
    if (!planId || planId === subscription.planId) {
      toast({ title: "No plan change", description: "Select a different plan before applying.", variant: "warning" });
      return;
    }
    const plan = plans.find((item) => item.id === planId);
    const confirmed = await confirm({
      title: `Move ${subscription.tenant?.name ?? "tenant"} to ${plan?.name ?? "selected plan"}?`,
      description: "The subscription period is reset and a platform billing audit event is recorded.",
      confirmLabel: "Change plan",
      tone: "warning",
    });
    if (!confirmed) return;
    setBusy(`plan:${subscription.id}`);
    try {
      await changeSiteSubscriptionPlan(auth.accessToken, subscription.id, {
        planId,
        reason: `Plan changed from site-admin billing by ${user.email}`,
      });
      toast({ title: "Plan changed", description: "Subscription plan was updated and audited.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Plan change failed", description: caught instanceof Error ? caught.message : "Unable to change plan.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function saveSeats(subscription: SiteSubscription) {
    const seatCount = Number(seatEdits[subscription.id] ?? subscription.seatCount);
    if (!Number.isInteger(seatCount) || seatCount < 1) {
      toast({ title: "Invalid seat count", description: "Seat count must be a whole number above zero.", variant: "warning" });
      return;
    }
    setBusy(`seats:${subscription.id}`);
    try {
      await updateSiteSubscription(auth.accessToken, subscription.id, {
        seatCount,
        reason: `Seat count changed from site-admin billing by ${user.email}`,
      });
      toast({ title: "Seats updated", description: "Subscription seat entitlement was updated.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Seat update failed", description: caught instanceof Error ? caught.message : "Unable to update seats.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function cancelSubscription(subscription: SiteSubscription) {
    const confirmed = await confirm({
      title: `Cancel ${subscription.tenant?.name ?? "tenant"} subscription?`,
      description: "This immediately moves the subscription to cancelled and records a platform billing audit event.",
      confirmLabel: "Cancel subscription",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusy(`cancel:${subscription.id}`);
    try {
      await cancelSiteSubscription(auth.accessToken, subscription.id, {
        reason: `Cancelled from site-admin billing by ${user.email}`,
      });
      toast({ title: "Subscription cancelled", description: "Tenant billing status was updated.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Cancel failed", description: caught instanceof Error ? caught.message : "Unable to cancel subscription.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function resumeSubscription(subscription: SiteSubscription) {
    const confirmed = await confirm({
      title: `Resume ${subscription.tenant?.name ?? "tenant"} subscription?`,
      description: "This reactivates the subscription and clears cancellation flags.",
      confirmLabel: "Resume subscription",
      tone: "warning",
    });
    if (!confirmed) return;
    setBusy(`resume:${subscription.id}`);
    try {
      await resumeSiteSubscription(auth.accessToken, subscription.id, {
        reason: `Resumed from site-admin billing by ${user.email}`,
      });
      toast({ title: "Subscription resumed", description: "Tenant access was restored to active billing.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Resume failed", description: caught instanceof Error ? caught.message : "Unable to resume subscription.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function startTrial(tenant: SiteBillingOverview["tenantHealth"][number]) {
    const planId = trialSelections[tenant.id] ?? defaultPlanId;
    if (!planId) {
      toast({ title: "No active plan", description: "Create or activate a plan before starting a trial.", variant: "warning" });
      return;
    }
    const plan = plans.find((item) => item.id === planId);
    const confirmed = await confirm({
      title: `Start trial for ${tenant.name}?`,
      description: `The tenant will be attached to ${plan?.name ?? "the selected plan"} and a platform audit event will be recorded.`,
      confirmLabel: "Start trial",
      tone: "warning",
    });
    if (!confirmed) return;
    setBusy(`trial:${tenant.id}`);
    try {
      await startSiteTenantTrial(auth.accessToken, tenant.id, {
        planId,
        reason: `Trial started from site-admin billing by ${user.email}`,
      });
      toast({ title: "Trial started", description: "Tenant billing health was updated.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Trial failed", description: caught instanceof Error ? caught.message : "Unable to start trial.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-[#ffd400]/15">
            <CreditCard className="size-4 text-[#b08900]" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Billing overview</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">
              {activeSubscriptions} active · {trialingSubscriptions} trialing · {openBillingRisk > 0 ? `${openBillingRisk} at risk` : "no billing risk"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/site-admin/billing/plans"
            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#fbfaf6] px-3 text-[12px] font-black text-[#5f574c] transition hover:bg-[#f0ebe0]"
            style={{ border: "1px solid #ded8c8" }}
          >
            <PackageCheck className="size-3.5" aria-hidden="true" />
            Plans
          </Link>
          <Link
            href="/site-admin/billing/features"
            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#fbfaf6] px-3 text-[12px] font-black text-[#5f574c] transition hover:bg-[#f0ebe0]"
            style={{ border: "1px solid #ded8c8" }}
          >
            <Sparkles className="size-3.5 text-[#d89b00]" aria-hidden="true" />
            Features
          </Link>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      {/* ── Metrics strip ────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={Banknote}      label="Paid revenue"  value={formatMoney(overview.revenue)}   tone="#111111" />
        <Metric icon={PackageCheck}  label="Plans"         value={overview.plans}                  tone="#6d5dd3" />
        <Metric icon={Sparkles}      label="Features"      value={overview.features}               tone="#d89b00" />
        <Metric icon={CreditCard}    label="Active subs"   value={activeSubscriptions}             tone="#047857" />
        <Metric icon={UsersRound}    label="Trial tenants" value={trialingSubscriptions}           tone="#2563eb" />
        <Metric icon={AlertTriangle} label="Billing risk"  value={openBillingRisk}                 tone={openBillingRisk ? "#dc2626" : "#047857"} />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#fbfaf6] px-3" style={{ border: "1px solid #ded8c8" }}>
            <Search className="size-4 text-[#8a8375]" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tenants, plans, invoices, usage, webhook events..." className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#8a8375]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => (
              <button key={item} type="button" onClick={() => setStatus(item)} className="h-10 rounded-2xl px-3 text-[11px] font-black transition" style={{ background: status === item ? "#111111" : "#fbfaf6", border: "1px solid #ded8c8", color: status === item ? "#ffffff" : "#5f574c" }}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {VIEWS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.id} href={item.href} className={cn("inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-[12px] font-black transition", view === item.id ? "bg-[#111111] text-white" : "bg-[#fbfaf6] text-[#5f574c]")} style={{ border: "1px solid #ded8c8" }}>
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          {view === "subscriptions" ? (
            <SubscriptionsPanel
              busy={busy}
              canManageBilling={canManageBilling}
              loading={loading}
              planSelections={planSelections}
              plans={activePlans}
              seatEdits={seatEdits}
              subscriptions={subscriptions}
              onCancel={cancelSubscription}
              onPlanChange={applyPlan}
              onResume={resumeSubscription}
              onSeatChange={(subscriptionId, value) => setSeatEdits((current) => ({ ...current, [subscriptionId]: value }))}
              onSaveSeats={saveSeats}
              onSelectPlan={(subscriptionId, planId) => setPlanSelections((current) => ({ ...current, [subscriptionId]: planId }))}
            />
          ) : null}
          {view === "plans" ? <PlansPanel loading={loading} plans={plans} /> : null}
          {view === "invoices" ? <InvoicesPanel invoices={invoices} loading={loading} /> : null}
          {view === "usage" ? <UsagePanel loading={loading} usageRecords={usageRecords} /> : null}
          {view === "entitlements" ? <EntitlementsPanel entitlements={entitlements} loading={loading} /> : null}
          {view === "webhooks" ? <WebhookPanel events={events} loading={loading} /> : null}
        </div>

        <div className="space-y-4">
          <Panel title="Tenant billing health" eyebrow="Plan coverage" accent="#f2c200">
            <div className="space-y-2">
              {overview.tenantHealth.map((tenant) => (
                <div key={tenant.id} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/site-admin/tenants/${tenant.id}/billing`} className="truncate text-[13px] font-black text-[#111111] hover:text-[#6d5dd3]">{tenant.name}</Link>
                      <p className="mt-1 text-[11px] font-semibold text-[#766f63]">@{tenant.slug} - {tenant._count?.users ?? 0} users - {tenant._count?.projects ?? 0} projects</p>
                    </div>
                    <StatusBadge value={tenant.health} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#5f574c]" style={{ border: "1px solid #ded8c8" }}>
                      {tenant.billing?.plan?.name ?? "No plan"}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#5f574c]" style={{ border: "1px solid #ded8c8" }}>
                      usage {tenant._count?.usageRecords ?? 0}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#5f574c]" style={{ border: "1px solid #ded8c8" }}>
                      events {tenant._count?.billingEvents ?? 0}
                    </span>
                  </div>
                  {canManageBilling && (!tenant.billing || tenant.health === "NO_SUBSCRIPTION" || tenant.health === "EXPIRED") ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <select value={trialSelections[tenant.id] ?? defaultPlanId} onChange={(event) => setTrialSelections((current) => ({ ...current, [tenant.id]: event.target.value }))} className="h-10 min-w-0 rounded-2xl bg-white px-3 text-[12px] font-bold outline-none" style={{ border: "1px solid #ded8c8" }}>
                        {activePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                      </select>
                      <button type="button" onClick={() => startTrial(tenant)} disabled={busy === `trial:${tenant.id}` || !defaultPlanId} className="h-10 rounded-2xl bg-[#ffd400] px-3 text-[11px] font-black text-[#111111] disabled:opacity-50">
                        Start trial
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              {overview.tenantHealth.length === 0 ? <Empty text="No tenant billing health returned." /> : null}
            </div>
          </Panel>

          <Panel title="Webhook processing" eyebrow="Stripe visibility" accent="#dc2626">
            <div className="space-y-2">
              {overview.recentBillingEvents.map((event) => (
                <div key={event.id} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[13px] font-black text-[#111111]">{event.type}</p>
                    <StatusBadge value={event.status} />
                  </div>
                  <p className="mt-1 truncate text-[11px] font-semibold text-[#766f63]">{event.provider} - {event.eventId}</p>
                  {event.error ? <p className="mt-2 line-clamp-2 text-[11px] font-bold text-red-600">{event.error}</p> : null}
                </div>
              ))}
              {overview.recentBillingEvents.length === 0 ? <Empty text="No billing webhook events returned." /> : null}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function SubscriptionsPanel({
  busy,
  canManageBilling,
  loading,
  planSelections,
  plans,
  seatEdits,
  subscriptions,
  onCancel,
  onPlanChange,
  onResume,
  onSaveSeats,
  onSeatChange,
  onSelectPlan,
}: {
  busy: string;
  canManageBilling: boolean;
  loading: boolean;
  planSelections: Record<string, string>;
  plans: SiteBillingPlan[];
  seatEdits: Record<string, string>;
  subscriptions: SiteSubscription[];
  onCancel: (subscription: SiteSubscription) => void;
  onPlanChange: (subscription: SiteSubscription) => void;
  onResume: (subscription: SiteSubscription) => void;
  onSaveSeats: (subscription: SiteSubscription) => void;
  onSeatChange: (subscriptionId: string, value: string) => void;
  onSelectPlan: (subscriptionId: string, planId: string) => void;
}) {
  return (
    <Panel title="Subscriptions" eyebrow="Tenant billing state" accent="#047857">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[#fbfaf6] text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Seats</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee8dc]">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm font-bold text-[#8a8375]">Loading subscriptions...</td></tr>
            ) : subscriptions.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm font-bold text-[#8a8375]">No subscriptions matched this filter.</td></tr>
            ) : subscriptions.map((subscription) => (
              <tr key={subscription.id} className="transition hover:bg-[#fffdf2]">
                <td className="min-w-[220px] px-4 py-4">
                  {subscription.tenant ? (
                    <Link href={`/site-admin/tenants/${subscription.tenant.id}/billing`} className="block text-[13px] font-black text-[#111111] hover:text-[#6d5dd3]">{subscription.tenant.name}</Link>
                  ) : <span className="text-[13px] font-black text-[#111111]">Unknown tenant</span>}
                  <p className="mt-1 text-[11px] font-semibold text-[#766f63]">@{subscription.tenant?.slug ?? "n/a"} - {subscription.provider}</p>
                </td>
                <td className="min-w-[240px] px-4 py-4">
                  <select disabled={!canManageBilling} value={planSelections[subscription.id] ?? subscription.planId} onChange={(event) => onSelectPlan(subscription.id, event.target.value)} className="h-10 w-full rounded-2xl bg-white px-3 text-[12px] font-bold outline-none disabled:opacity-60" style={{ border: "1px solid #ded8c8" }}>
                    {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} - {formatMoney(plan.price, plan.currency)}/{plan.interval.toLowerCase()}</option>)}
                  </select>
                </td>
                <td className="min-w-[130px] px-4 py-4">
                  <input disabled={!canManageBilling} value={seatEdits[subscription.id] ?? subscription.seatCount} onChange={(event) => onSeatChange(subscription.id, event.target.value)} inputMode="numeric" className="h-10 w-24 rounded-2xl bg-white px-3 text-[12px] font-bold outline-none disabled:opacity-60" style={{ border: "1px solid #ded8c8" }} />
                </td>
                <td className="min-w-[190px] px-4 py-4 text-[11px] font-semibold text-[#665f54]">
                  <p>{formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}</p>
                  {subscription.trialEndsAt ? <p className="mt-1 text-[#2563eb]">Trial ends {formatDate(subscription.trialEndsAt)}</p> : null}
                </td>
                <td className="px-4 py-4"><StatusBadge value={subscription.status} /></td>
                <td className="min-w-[240px] px-4 py-4">
                  <div className="flex justify-end gap-2">
                    {canManageBilling ? (
                      <>
                        <button type="button" onClick={() => onPlanChange(subscription)} disabled={busy === `plan:${subscription.id}`} className="h-9 rounded-2xl bg-[#111111] px-3 text-[11px] font-black text-white disabled:opacity-50">Apply plan</button>
                        <button type="button" onClick={() => onSaveSeats(subscription)} disabled={busy === `seats:${subscription.id}`} className="h-9 rounded-2xl bg-[#fbfaf6] px-3 text-[11px] font-black text-[#111111] disabled:opacity-50" style={{ border: "1px solid #ded8c8" }}>Seats</button>
                        {subscription.status === "CANCELLED" ? (
                          <button type="button" onClick={() => onResume(subscription)} disabled={busy === `resume:${subscription.id}`} className="inline-flex h-9 items-center gap-1 rounded-2xl px-3 text-[11px] font-black text-emerald-700 disabled:opacity-50" style={{ background: "#ecfdf5", border: "1px solid #bbf7d0" }}><RotateCcw className="size-3" />Resume</button>
                        ) : (
                          <button type="button" onClick={() => onCancel(subscription)} disabled={busy === `cancel:${subscription.id}`} className="inline-flex h-9 items-center gap-1 rounded-2xl px-3 text-[11px] font-black text-red-700 disabled:opacity-50" style={{ background: "#fff1f1", border: "1px solid #fecaca" }}><Ban className="size-3" />Cancel</button>
                        )}
                      </>
                    ) : <span className="text-[11px] font-bold text-[#8a8375]">Read only</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PlansPanel({ loading, plans }: { loading: boolean; plans: SiteBillingPlan[] }) {
  return (
    <Panel title="Plans and features" eyebrow="Catalog" accent="#6d5dd3">
      {loading ? <Empty text="Loading plans..." /> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-black text-[#111111]">{plan.name}</p>
                  <p className="mt-1 text-[12px] font-semibold text-[#766f63]">{plan.description || `${formatMoney(plan.price, plan.currency)} per ${plan.interval.toLowerCase()}`}</p>
                </div>
                <StatusBadge value={plan.isActive && !plan.archivedAt ? "ACTIVE" : "ARCHIVED"} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-[#111111]" style={{ border: "1px solid #ded8c8" }}>{formatMoney(plan.price, plan.currency)}/{plan.interval.toLowerCase()}</span>
                <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-[#111111]" style={{ border: "1px solid #ded8c8" }}>{plan.seatLimit ?? "Unlimited"} seats</span>
                <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-[#111111]" style={{ border: "1px solid #ded8c8" }}>{plan.trialDays ?? 0} trial days</span>
              </div>
              <div className="mt-4 grid gap-2">
                {(plan.features ?? []).slice(0, 8).map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2" style={{ border: "1px solid #eee8dc" }}>
                    <span className="min-w-0 truncate text-[12px] font-bold text-[#111111]">{feature.feature.name}</span>
                    <span className="shrink-0 text-[10px] font-black text-[#766f63]">{feature.enabled ? feature.limit ?? feature.feature.defaultLimit ?? "ON" : "OFF"} {feature.feature.unit ?? ""}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {plans.length === 0 ? <Empty text="No billing plans returned." /> : null}
        </div>
      )}
    </Panel>
  );
}

function InvoicesPanel({ invoices, loading }: { invoices: SiteInvoice[]; loading: boolean }) {
  return (
    <Panel title="Invoices" eyebrow="Collection status" accent="#2563eb">
      <DataList loading={loading} empty="No invoices matched this filter.">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="grid gap-3 rounded-2xl bg-[#fbfaf6] p-4 lg:grid-cols-[1fr_auto_auto]" style={{ border: "1px solid #e7dfcf" }}>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-[#111111]">{invoice.number ?? invoice.providerInvoiceId ?? invoice.id}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{invoice.subscription?.tenant?.name ?? "Unknown tenant"} - {invoice.provider} - created {formatDate(invoice.createdAt)}</p>
            </div>
            <div className="text-sm font-black text-[#111111]">{formatMoney(invoice.total ?? invoice.amount, invoice.currency)}</div>
            <div className="flex items-center gap-2">
              <StatusBadge value={invoice.status} />
              {invoice.hostedInvoiceUrl ? <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="inline-flex size-9 items-center justify-center rounded-2xl bg-white text-[#111111]" style={{ border: "1px solid #ded8c8" }} aria-label="Open invoice"><ArrowUpRight className="size-4" /></a> : null}
            </div>
          </div>
        ))}
      </DataList>
    </Panel>
  );
}

function UsagePanel({ loading, usageRecords }: { loading: boolean; usageRecords: SiteUsageRecord[] }) {
  return (
    <Panel title="Usage records" eyebrow="Metered product usage" accent="#d89b00">
      <DataList loading={loading} empty="No usage records matched this filter.">
        {usageRecords.map((record) => (
          <div key={record.id} className="grid gap-3 rounded-2xl bg-[#fbfaf6] p-4 lg:grid-cols-[1fr_auto]" style={{ border: "1px solid #e7dfcf" }}>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-[#111111]">{record.featureKey}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{record.tenant?.name ?? "Unknown tenant"} - {record.subscription?.plan?.name ?? "No plan"} - {formatDate(record.periodStart)} to {formatDate(record.periodEnd)}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-2 text-right" style={{ border: "1px solid #ded8c8" }}>
              <p className="text-xl font-black text-[#111111]">{record.quantity}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8375]">{record.unit ?? record.source}</p>
            </div>
          </div>
        ))}
      </DataList>
    </Panel>
  );
}

function EntitlementsPanel({ entitlements, loading }: { entitlements: SiteBillingEntitlement[]; loading: boolean }) {
  return (
    <Panel title="Entitlements" eyebrow="Feature access" accent="#047857">
      <DataList loading={loading} empty="No entitlement records returned.">
        {entitlements.map((item) => (
          <div key={item.subscription.id} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-black text-[#111111]">{item.tenant.name}</p>
                <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{item.plan.name} - seats {item.seatUsage.used}/{item.seatUsage.limit}</p>
              </div>
              <StatusBadge value={item.subscription.status} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {item.entitlements.slice(0, 10).map((entitlement) => (
                <div key={entitlement.key} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2" style={{ border: "1px solid #eee8dc" }}>
                  <span className="inline-flex min-w-0 items-center gap-2 truncate text-[12px] font-bold text-[#111111]">
                    {entitlement.enabled ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" /> : <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />}
                    {entitlement.name}
                  </span>
                  <span className="shrink-0 text-[10px] font-black text-[#766f63]">{entitlement.limit ?? (entitlement.enabled ? "ON" : "OFF")}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </DataList>
    </Panel>
  );
}

function WebhookPanel({ events, loading }: { events: SiteBillingEvent[]; loading: boolean }) {
  return (
    <Panel title="Stripe webhook visibility" eyebrow="Provider events" accent="#dc2626">
      <DataList loading={loading} empty="No billing events matched this filter.">
        {events.map((event) => (
          <div key={event.id} className="grid gap-3 rounded-2xl bg-[#fbfaf6] p-4 lg:grid-cols-[1fr_auto]" style={{ border: "1px solid #e7dfcf" }}>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-[#111111]">{event.type}</p>
              <p className="mt-1 truncate text-[11px] font-semibold text-[#766f63]">{event.provider} - {event.eventId} - {event.tenant?.name ?? "Platform"} - {formatDate(event.createdAt)}</p>
              {event.error ? <p className="mt-2 line-clamp-2 text-[11px] font-bold text-red-600">{event.error}</p> : null}
            </div>
            <StatusBadge value={event.status} />
          </div>
        ))}
      </DataList>
    </Panel>
  );
}

function DataList({ children, empty, loading }: { children: ReactNode; empty: string; loading: boolean }) {
  if (loading) return <Empty text="Loading records..." />;
  const count = Array.isArray(children) ? children.length : 1;
  if (count === 0) return <Empty text={empty} />;
  return <div className="space-y-2">{children}</div>;
}

function Panel({ accent, children, eyebrow, title }: { accent: string; children: ReactNode; eyebrow: string; title: string }) {
  return (
    <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_16px_50px_rgba(17,17,17,0.07)]" style={{ border: "1px solid #ded8c8" }}>
      <div className="border-b border-[#eee8dc] px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a8375]"><span className="mr-2 inline-block h-0.5 w-6 align-middle" style={{ background: accent }} />{eyebrow}</p>
        <h2 className="mt-1 text-base font-black text-[#111111]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Metric({ icon: Icon, label, tone, value }: { icon: LucideIcon; label: string; tone: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-2xl bg-white" style={{ border: "1px solid #ded8c8", color: tone }}><Icon className="size-4" /></span>
      </div>
      <p className="mt-2 truncate text-2xl font-black" style={{ color: tone }}>{value}</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const upper = String(value).replace(/_/g, " ").toUpperCase();
  const tone = upper.includes("ACTIVE") || upper.includes("PAID") || upper.includes("PROCESSED") || upper.includes("HEALTHY")
    ? "#047857"
    : upper.includes("PAST") || upper.includes("CANCEL") || upper.includes("EXPIRED") || upper.includes("FAILED") || upper.includes("NO SUBSCRIPTION")
      ? "#dc2626"
      : upper.includes("TRIAL") || upper.includes("RECEIVED")
        ? "#2563eb"
        : "#6d5dd3";
  return <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[9px] font-black uppercase tracking-[0.08em]" style={{ border: "1px solid #ded8c8", color: tone }}>{upper}</span>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[#ded8c8] bg-[#fbfaf6] px-4 py-8 text-center text-sm font-bold text-[#8a8375]">{text}</div>;
}

function formatDate(value?: string | null) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatMoney(value?: number | string | null, currency = "USD") {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "n/a";
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
}
