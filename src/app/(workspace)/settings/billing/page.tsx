"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  FileText,
  Gauge,
  Loader2,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  cancelTenantSubscription,
  changeTenantSubscriptionPlan,
  createBillingCheckout,
  createBillingPortal,
  getBillingAccountStatus,
  getCurrentTenantSubscription,
  getTenantEntitlements,
  getTenantUsageSummary,
  listBillingPlans,
  listTenantInvoices,
  listTenantUsageRecords,
  resumeTenantSubscription,
  startTenantBillingTrial,
  type BillingAccountStatus,
  type BillingEntitlements,
  type BillingInvoice,
  type BillingPlan,
  type BillingUsageRecord,
  type BillingUsageSummary,
  type SiteSubscription,
} from "@/lib/api";
import { getAccessProfile, roleLabel } from "@/lib/access-policy";
import { cn } from "@/lib/cn";

const compactButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition disabled:pointer-events-none disabled:opacity-55";

export default function TenantBillingPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const access = getAccessProfile(user);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [account, setAccount] = useState<BillingAccountStatus | null>(null);
  const [subscription, setSubscription] = useState<SiteSubscription | null>(null);
  const [entitlements, setEntitlements] = useState<BillingEntitlements | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [usageRecords, setUsageRecords] = useState<BillingUsageRecord[]>([]);
  const [usageSummary, setUsageSummary] = useState<BillingUsageSummary | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [seatCount, setSeatCount] = useState(1);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [planResult, accountResult, currentResult, entitlementResult, invoiceResult, usageResult, summaryResult] =
        await Promise.all([
          listBillingPlans(auth.accessToken, { limit: 100 }),
          getBillingAccountStatus(auth.accessToken),
          getCurrentTenantSubscription(auth.accessToken),
          getTenantEntitlements(auth.accessToken),
          listTenantInvoices(auth.accessToken, { limit: 20 }),
          listTenantUsageRecords(auth.accessToken, { limit: 30 }),
          getTenantUsageSummary(auth.accessToken),
        ]);
      setPlans(planResult.data);
      setAccount(accountResult);
      setSubscription(currentResult);
      setEntitlements(entitlementResult);
      setInvoices(invoiceResult.data);
      setUsageRecords(usageResult.data);
      setUsageSummary(summaryResult);
      setSeatCount(Math.max(currentResult?.seatCount ?? accountResult.seats.used ?? 1, 1));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load billing workspace.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const currencies = useMemo(() => {
    const values = Array.from(new Set(plans.map((plan) => plan.currency.toUpperCase()))).sort();
    return values.length ? values : ["USD"];
  }, [plans]);

  useEffect(() => {
    if (!currencies.includes(currency)) {
      const timer = window.setTimeout(() => setCurrency(currencies[0] ?? "USD"), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [currencies, currency]);

  const visiblePlans = useMemo(
    () => plans.filter((plan) => plan.currency.toUpperCase() === currency),
    [currency, plans],
  );

  const currentPlanId = subscription?.planId ?? entitlements?.plan?.id ?? account?.subscription?.planId ?? "";
  const currentPlan = plans.find((plan) => plan.id === currentPlanId);
  const usageByKey = useMemo(
    () => new Map((usageSummary?.data ?? []).map((item) => [item.featureKey, item])),
    [usageSummary],
  );

  if (!access.canViewBilling) {
    return (
      <main className="mx-auto max-w-4xl rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
        <ShieldCheck className="mx-auto size-10 text-ink-soft" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-black text-[#111111]">Billing is restricted</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-relaxed text-ink-soft">
          Billing plans, subscriptions, invoices, and usage limits are visible to tenant owners and billing administrators.
        </p>
      </main>
    );
  }

  async function reloadWithToast(title: string, description?: string) {
    toast({ title, description, variant: "success" });
    await load();
  }

  async function onStartTrial(plan: BillingPlan) {
    const confirmed = await confirm({
      title: `Start ${plan.name} trial?`,
      description: `This will put your workspace on the ${plan.name} plan for ${plan.trialDays ?? 14} days.`,
      confirmLabel: "Start trial",
    });
    if (!confirmed) return;

    setBusy(`trial:${plan.id}`);
    try {
      await startTenantBillingTrial(auth.accessToken, { planId: plan.id, seatCount });
      await reloadWithToast("Trial started", `${plan.name} is now active for this workspace.`);
    } catch (caught) {
      toast({ title: "Trial could not be started", description: errorMessage(caught), variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function onCheckout(plan: BillingPlan) {
    setBusy(`checkout:${plan.id}`);
    try {
      const origin = window.location.origin;
      const provider = plan.currency.toUpperCase() === "NGN" ? "paystack" : undefined;
      const session = await createBillingCheckout(auth.accessToken, {
        planId: plan.id,
        seatCount,
        provider,
        successUrl: `${origin}/settings/billing?checkout=success`,
        cancelUrl: `${origin}/settings/billing?checkout=cancelled`,
      });
      const url = typeof session.url === "string" ? session.url : "";
      if (url) {
        window.location.assign(url);
        return;
      }
      await reloadWithToast("Checkout prepared", session.message || "Billing provider returned a local continuation.");
    } catch (caught) {
      toast({ title: "Checkout could not be created", description: errorMessage(caught), variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function onManualChange(plan: BillingPlan) {
    if (!subscription) return;
    const confirmed = await confirm({
      title: `Switch to ${plan.name}?`,
      description: "This updates the current subscription record inside TaskBricks. Use checkout for paid provider billing.",
      confirmLabel: "Switch plan",
      tone: "warning",
    });
    if (!confirmed) return;

    setBusy(`change:${plan.id}`);
    try {
      await changeTenantSubscriptionPlan(auth.accessToken, subscription.id, { planId: plan.id, prorate: true });
      await reloadWithToast("Plan changed", `Workspace plan changed to ${plan.name}.`);
    } catch (caught) {
      toast({ title: "Plan could not be changed", description: errorMessage(caught), variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function onPortal() {
    setBusy("portal");
    try {
      const session = await createBillingPortal(auth.accessToken, {
        returnUrl: `${window.location.origin}/settings/billing`,
      });
      const url = typeof session.url === "string" ? session.url : "";
      if (url) {
        window.location.assign(url);
        return;
      }
      toast({ title: "Billing portal unavailable", description: session.message, variant: "info" });
    } catch (caught) {
      toast({ title: "Portal could not be opened", description: errorMessage(caught), variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function onCancelOrResume(action: "cancel" | "resume") {
    if (!subscription) return;
    const confirmed = await confirm({
      title: action === "cancel" ? "Cancel subscription?" : "Resume subscription?",
      description:
        action === "cancel"
          ? "This will cancel the current workspace subscription immediately where allowed."
          : "This will reactivate the current subscription record.",
      confirmLabel: action === "cancel" ? "Cancel subscription" : "Resume subscription",
      tone: action === "cancel" ? "danger" : "warning",
    });
    if (!confirmed) return;

    setBusy(action);
    try {
      if (action === "cancel") {
        await cancelTenantSubscription(auth.accessToken, subscription.id);
      } else {
        await resumeTenantSubscription(auth.accessToken, subscription.id);
      }
      await reloadWithToast(action === "cancel" ? "Subscription cancelled" : "Subscription resumed");
    } catch (caught) {
      toast({ title: "Subscription action failed", description: errorMessage(caught), variant: "error" });
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-line bg-white shadow-sm">
        <div className="grid gap-6 border-b border-line p-5 lg:grid-cols-[1.15fr_0.85fr] lg:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700" icon={ShieldCheck}>
                Tenant billing
              </Badge>
              <Badge className="border-yellow-200 bg-yellow-50 text-[#8a6500]" icon={Sparkles}>
                {roleLabel(user)}
              </Badge>
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.02em] text-[#111111] md:text-4xl">
              Plans, usage, and subscription control.
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-ink-soft">
              Choose a plan, start a trial, manage checkout, monitor entitlement limits, and keep invoices visible to workspace owners.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className={`${compactButton} border border-line bg-white text-[#111111] hover:bg-panel-muted`}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => void onPortal()}
                disabled={busy === "portal" || !subscription}
                className={`${compactButton} bg-[#111111] text-white hover:bg-black`}
              >
                {busy === "portal" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <WalletCards className="size-4" aria-hidden="true" />}
                Billing portal
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Current plan" value={currentPlan?.name ?? entitlements?.plan?.name ?? "No plan"} icon={PackageCheck} />
            <Metric label="Status" value={subscription?.status ?? "Not subscribed"} icon={BadgeCheck} tone={subscription?.status === "ACTIVE" ? "green" : "yellow"} />
            <Metric label="Seats" value={`${account?.seats.used ?? 0}${account?.seats.limit ? ` / ${account.seats.limit}` : ""}`} icon={Gauge} />
            <Metric label="Renews / trial ends" value={formatDate(subscription?.trialEndsAt ?? subscription?.currentPeriodEnd)} icon={CreditCard} />
          </div>
        </div>

        {error ? (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-ink-soft">Plan currency</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {currencies.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCurrency(item)}
                  className={cn(
                    "h-10 rounded-2xl border px-4 text-sm font-black transition",
                    currency === item
                      ? "border-[#111111] bg-[#111111] text-white"
                      : "border-line bg-white text-ink-soft hover:bg-panel-muted hover:text-[#111111]",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-line bg-panel-muted px-3 py-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-ink-soft">Seats</span>
            <input
              type="number"
              min={1}
              value={seatCount}
              onChange={(event) => setSeatCount(Math.max(Number(event.target.value || 1), 1))}
              className="h-9 w-20 rounded-xl border border-line bg-white px-3 text-sm font-black text-[#111111] outline-none"
            />
          </label>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[28px] border border-line bg-white p-10 text-center shadow-sm">
          <Loader2 className="mx-auto size-6 animate-spin text-ink-soft" aria-hidden="true" />
          <p className="mt-3 text-sm font-black text-[#111111]">Loading billing workspace...</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            {visiblePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                busy={busy}
                current={currentPlanId === plan.id}
                hasSubscription={Boolean(subscription)}
                onCheckout={() => void onCheckout(plan)}
                onManualChange={() => void onManualChange(plan)}
                onStartTrial={() => void onStartTrial(plan)}
                plan={plan}
              />
            ))}
            {visiblePlans.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-line bg-white p-8 text-center text-sm font-bold text-ink-soft lg:col-span-3">
                No active plans are available for {currency}. Create one in Site Admin Billing Plans.
              </div>
            ) : null}
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel eyebrow="Entitlements" title="Limits and included features" action={`${entitlements?.features.length ?? 0} features`}>
              <div className="grid gap-3">
                {(entitlements?.features ?? []).map((feature) => {
                  const usage = usageByKey.get(feature.key);
                  const used = usage?.quantity ?? feature.used;
                  const percent = feature.limit ? Math.min((used / feature.limit) * 100, 100) : 18;
                  return (
                    <div key={feature.key} className="rounded-2xl border border-line bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-[#111111]">{feature.name}</p>
                          <p className="mt-1 font-mono text-[11px] font-bold text-ink-soft">{feature.key}</p>
                        </div>
                        <span className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]",
                          feature.allowed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
                        )}>
                          {feature.allowed ? "Available" : "Blocked"}
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f1eee4]">
                        <div className="h-full rounded-full bg-[#111111]" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs font-bold text-ink-soft">
                        <span>{used} used</span>
                        <span>{limitLabel(feature.limit, feature.unit)}</span>
                      </div>
                    </div>
                  );
                })}
                {(entitlements?.features.length ?? 0) === 0 ? (
                  <EmptyBlock icon={PackageCheck} title="No entitlements yet" text="Start a trial or subscribe to a plan to activate feature limits." />
                ) : null}
              </div>
            </Panel>

            <div className="grid gap-5">
              <Panel eyebrow="Subscription" title="Current control">
                <div className="space-y-3">
                  <StatusLine label="Provider" value={subscription?.provider ?? "none"} />
                  <StatusLine label="Seats" value={`${subscription?.seatCount ?? seatCount}`} />
                  <StatusLine label="Period end" value={formatDate(subscription?.currentPeriodEnd)} />
                  <StatusLine label="Trial end" value={formatDate(subscription?.trialEndsAt)} />
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      disabled={!subscription || busy === "cancel" || subscription?.status === "CANCELLED"}
                      onClick={() => void onCancelOrResume("cancel")}
                      className={`${compactButton} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
                    >
                      <XCircle className="size-4" aria-hidden="true" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!subscription || busy === "resume" || subscription?.status !== "CANCELLED"}
                      onClick={() => void onCancelOrResume("resume")}
                      className={`${compactButton} border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                    >
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Resume
                    </button>
                  </div>
                </div>
              </Panel>

              <Panel eyebrow="Usage records" title="Recent metered events" action={`${usageSummary?.totalRecords ?? 0} total`}>
                <div className="max-h-[360px] overflow-auto pr-1 tb-scrollbar">
                  {usageRecords.slice(0, 8).map((record) => (
                    <div key={record.id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-black text-[#111111]">{record.featureKey}</p>
                        <p className="mt-1 text-[11px] font-bold text-ink-soft">{formatDate(record.createdAt)} · {record.source}</p>
                      </div>
                      <span className="rounded-xl bg-panel-muted px-2.5 py-1 text-xs font-black text-[#111111]">
                        {record.quantity} {record.unit ?? ""}
                      </span>
                    </div>
                  ))}
                  {usageRecords.length === 0 ? (
                    <EmptyBlock icon={Gauge} title="No usage yet" text="Metered usage will appear as tasks, AI, storage, and automations are consumed." />
                  ) : null}
                </div>
              </Panel>
            </div>
          </section>

          <Panel eyebrow="Invoices" title="Billing history" action={`${invoices.length} returned`}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-line text-[11px] font-black uppercase tracking-[0.16em] text-ink-soft">
                  <tr>
                    <th className="px-3 py-3">Invoice</th>
                    <th className="px-3 py-3">Provider</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Issued</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-line last:border-b-0">
                      <td className="px-3 py-4 font-black text-[#111111]">{invoice.number ?? invoice.providerInvoiceId ?? invoice.id.slice(0, 8)}</td>
                      <td className="px-3 py-4 text-xs font-black uppercase text-ink-soft">{invoice.provider}</td>
                      <td className="px-3 py-4 font-black text-[#111111]">{formatMoney(invoice.amount, invoice.currency)}</td>
                      <td className="px-3 py-4"><InvoiceStatus status={invoice.status} /></td>
                      <td className="px-3 py-4 text-xs font-bold text-ink-soft">{formatDate(invoice.createdAt)}</td>
                      <td className="px-3 py-4 text-right">
                        {invoice.hostedInvoiceUrl ? (
                          <a className="inline-flex items-center gap-1 text-xs font-black text-[#111111] underline" href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                            Open <ArrowUpRight className="size-3" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-xs font-bold text-ink-soft">Local</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length === 0 ? (
                <EmptyBlock icon={FileText} title="No invoices yet" text="Invoices will appear after checkout, renewal, or manual billing events." />
              ) : null}
            </div>
          </Panel>
        </>
      )}
    </main>
  );
}

function PlanCard({
  busy,
  current,
  hasSubscription,
  onCheckout,
  onManualChange,
  onStartTrial,
  plan,
}: {
  busy: string;
  current: boolean;
  hasSubscription: boolean;
  onCheckout: () => void;
  onManualChange: () => void;
  onStartTrial: () => void;
  plan: BillingPlan;
}) {
  const features = plan.features ?? [];
  const price = numberValue(plan.price);
  const providerLabel = plan.currency.toUpperCase() === "NGN" ? "Paystack ready" : "Card checkout";
  return (
    <article className={cn(
      "flex min-h-[420px] flex-col rounded-[28px] border bg-white p-5 shadow-sm transition",
      current ? "border-[#111111] shadow-[0_24px_70px_rgba(17,17,17,0.12)]" : "border-line hover:-translate-y-0.5 hover:shadow-md",
    )}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ink-soft">{providerLabel}</p>
          <h2 className="mt-2 text-xl font-black text-[#111111]">{plan.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-ink-soft">{plan.description || "Workspace plan with governed limits and metered usage."}</p>
        </div>
        {current ? (
          <span className="rounded-full bg-[#111111] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">Current</span>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="text-4xl font-black tracking-[-0.03em] text-[#111111]">{formatMoney(plan.price, plan.currency)}</p>
        <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-ink-soft">per {plan.interval}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <MiniStat label="Trial" value={plan.trialDays ? `${plan.trialDays} days` : "None"} />
        <MiniStat label="Seats" value={plan.seatLimit ? `${plan.seatLimit}` : "Flexible"} />
      </div>

      <div className="mt-5 flex-1 space-y-2">
        {features.slice(0, 6).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-panel-muted px-3 py-2">
            <span className="min-w-0 truncate text-xs font-black text-[#111111]">{item.feature.name}</span>
            <span className="shrink-0 text-[11px] font-bold text-ink-soft">
              {limitLabel(item.limit ?? item.feature.defaultLimit, item.feature.unit)}
            </span>
          </div>
        ))}
        {features.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-4 text-xs font-bold text-ink-soft">
            No feature limits attached yet.
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-2">
        {current ? (
          <button type="button" disabled className={`${compactButton} bg-[#111111] text-white`}>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Current plan
          </button>
        ) : (
          <>
            {plan.trialDays ? (
              <button
                type="button"
                onClick={onStartTrial}
                disabled={busy === `trial:${plan.id}`}
                className={`${compactButton} border border-line bg-white text-[#111111] hover:bg-panel-muted`}
              >
                {busy === `trial:${plan.id}` ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                Start trial
              </button>
            ) : null}
            <button
              type="button"
              onClick={price <= 0 && hasSubscription ? onManualChange : onCheckout}
              disabled={busy === `checkout:${plan.id}` || busy === `change:${plan.id}`}
              className={`${compactButton} bg-primary text-[#111111] shadow-[0_16px_34px_rgba(255,212,0,0.28)] hover:bg-primary-dark`}
            >
              {busy === `checkout:${plan.id}` || busy === `change:${plan.id}` ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CreditCard className="size-4" aria-hidden="true" />}
              {hasSubscription ? "Upgrade / switch" : "Subscribe"}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function Panel({
  action,
  children,
  eyebrow,
  title,
}: {
  action?: string;
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-line bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-ink-soft">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-black text-[#111111]">{title}</h2>
        </div>
        {action ? <span className="rounded-full border border-line bg-panel-muted px-3 py-1 text-xs font-black text-[#111111]">{action}</span> : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Metric({ icon: Icon, label, tone = "blue", value }: { icon: LucideIcon; label: string; tone?: "blue" | "green" | "yellow"; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-panel-muted p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ink-soft">{label}</p>
          <p className="mt-2 truncate text-2xl font-black text-[#111111]">{value}</p>
        </div>
        <span className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-2xl",
          tone === "green" && "bg-emerald-50 text-emerald-700",
          tone === "yellow" && "bg-yellow-50 text-[#8a6500]",
          tone === "blue" && "bg-blue-50 text-blue-700",
        )}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function Badge({ children, className, icon: Icon }: { children: ReactNode; className?: string; icon: LucideIcon }) {
  return (
    <span className={cn("inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[11px] font-black uppercase tracking-[0.15em]", className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-soft">{label}</p>
      <p className="mt-1 text-sm font-black text-[#111111]">{value}</p>
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-3 py-2">
      <span className="text-xs font-bold text-ink-soft">{label}</span>
      <span className="text-right text-sm font-black text-[#111111]">{value}</span>
    </div>
  );
}

function EmptyBlock({ icon: Icon, text, title }: { icon: LucideIcon; text: string; title: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-panel-muted p-6 text-center">
      <Icon className="mx-auto size-6 text-ink-soft" aria-hidden="true" />
      <p className="mt-3 text-sm font-black text-[#111111]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs font-medium leading-relaxed text-ink-soft">{text}</p>
    </div>
  );
}

function InvoiceStatus({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  return (
    <span className={cn(
      "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]",
      normalized === "paid" && "bg-emerald-50 text-emerald-700",
      normalized === "open" && "bg-yellow-50 text-[#8a6500]",
      normalized !== "paid" && normalized !== "open" && "bg-red-50 text-red-700",
    )}>
      {status}
    </span>
  );
}

function formatMoney(value: string | number | undefined | null, currency: string | undefined) {
  const amount = numberValue(value);
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function limitLabel(value: number | null | undefined, unit?: string | null) {
  if (value === null || value === undefined) return "Unlimited";
  return `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`;
}

function numberValue(value: string | number | undefined | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The billing action could not be completed.";
}
