"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Blocks,
  CheckCircle2,
  KeyRound,
  PlugZap,
  RefreshCw,
  RotateCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  getSiteIntegrationsOverview,
  listSiteIntegrations,
  listSiteWebhookDeliveries,
  listSiteWebhooks,
  retrySiteWebhookDelivery,
  rotateSiteIntegrationSecret,
  rotateSiteWebhookSecret,
  type SiteIntegration,
  type SiteIntegrationsOverview,
  type SiteWebhook,
  type SiteWebhookDelivery,
} from "@/lib/api";
import { cn } from "@/lib/cn";

type View = "catalog" | "integrations" | "webhooks" | "deliveries" | "omoflow";

const VIEWS: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "catalog", label: "Catalog", icon: Blocks },
  { id: "integrations", label: "Tenant integrations", icon: PlugZap },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "deliveries", label: "Deliveries", icon: RotateCw },
  { id: "omoflow", label: "OmoFlow", icon: ShieldCheck },
];

const emptyOverview: SiteIntegrationsOverview = {
  integrations: {},
  webhooks: {},
  deliveries: {},
  deliveriesLast24h: 0,
  recentFailures: [],
  omoflowIntegrations: [],
  providerCatalog: [],
};

export default function SiteAdminIntegrationsPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [overview, setOverview] = useState<SiteIntegrationsOverview>(emptyOverview);
  const [integrations, setIntegrations] = useState<SiteIntegration[]>([]);
  const [webhooks, setWebhooks] = useState<SiteWebhook[]>([]);
  const [deliveries, setDeliveries] = useState<SiteWebhookDelivery[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("catalog");
  const [deliveryStatus, setDeliveryStatus] = useState("FAILED");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canManage = user.platformAdminLevel === "OWNER" || user.platformAdminLevel === "ADMIN" || user.platformAdminLevel === "SUPPORT";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResult, integrationResult, webhookResult, deliveryResult] = await Promise.all([
        getSiteIntegrationsOverview(auth.accessToken),
        listSiteIntegrations(auth.accessToken, { limit: 35, search: query || undefined }),
        listSiteWebhooks(auth.accessToken, { limit: 35, search: query || undefined }),
        listSiteWebhookDeliveries(auth.accessToken, { limit: 35, search: query || undefined, status: deliveryStatus === "ALL" ? undefined : deliveryStatus }),
      ]);
      setOverview(overviewResult);
      setIntegrations(integrationResult.data);
      setWebhooks(webhookResult.data);
      setDeliveries(deliveryResult.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load integration data.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, deliveryStatus, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const totals = useMemo(() => {
    const integrationTotal = Object.values(overview.integrations).reduce((sum, statuses) => sum + Object.values(statuses).reduce((inner, count) => inner + count, 0), 0);
    const activeIntegrations = Object.values(overview.integrations).reduce((sum, statuses) => sum + (statuses.ACTIVE ?? 0), 0);
    return {
      integrations: integrationTotal,
      activeIntegrations,
      webhooks: (overview.webhooks.true ?? 0) + (overview.webhooks.false ?? 0),
      failedDeliveries: overview.deliveries.FAILED ?? 0,
      delivered: overview.deliveries.DELIVERED ?? 0,
      omoflow: overview.omoflowIntegrations.length,
    };
  }, [overview]);

  async function retryDelivery(delivery: SiteWebhookDelivery) {
    const confirmed = await confirm({
      title: `Retry ${delivery.eventType}?`,
      description: "This calls the webhook endpoint again and records a platform audit event.",
      confirmLabel: "Retry delivery",
      tone: "warning",
    });
    if (!confirmed) return;
    setBusy(`delivery:${delivery.id}`);
    try {
      await retrySiteWebhookDelivery(auth.accessToken, delivery.id);
      toast({ title: "Delivery retried", description: "Webhook retry completed and was audited.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Retry failed", description: caught instanceof Error ? caught.message : "Unable to retry webhook.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function rotateIntegrationSecretAction(integration: SiteIntegration) {
    const confirmed = await confirm({
      title: `Rotate secret for ${integration.name}?`,
      description: "A new generated secret is written for the apiKey key. Existing external clients must be updated.",
      confirmLabel: "Rotate secret",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusy(`integration:${integration.id}`);
    try {
      const result = await rotateSiteIntegrationSecret(auth.accessToken, integration.id, {
        key: "apiKey",
        reason: `Rotated from site-admin integrations by ${user.email}`,
      });
      toast({
        title: "Integration secret rotated",
        description: result.generatedSecret ? `Generated secret returned once: ${result.generatedSecret.slice(0, 8)}...` : "Secret rotated.",
        variant: "success",
      });
      await load();
    } catch (caught) {
      toast({ title: "Rotation failed", description: caught instanceof Error ? caught.message : "Unable to rotate secret.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function rotateWebhookSecretAction(webhook: SiteWebhook) {
    const confirmed = await confirm({
      title: `Rotate signing secret for ${webhook.name}?`,
      description: "A new webhook signing secret is generated. Receivers must be updated before old signatures are rejected.",
      confirmLabel: "Rotate secret",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusy(`webhook:${webhook.id}`);
    try {
      await rotateSiteWebhookSecret(auth.accessToken, webhook.id, {
        reason: `Rotated from site-admin integrations by ${user.email}`,
      });
      toast({ title: "Webhook secret rotated", description: "Signing secret was rotated and audited.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Rotation failed", description: caught instanceof Error ? caught.message : "Unable to rotate webhook secret.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "#2563eb18" }}>
            <Blocks className="size-4" style={{ color: "#2563eb" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Integrations</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">{totals.integrations} integrations · {totals.failedDeliveries} failed · {totals.omoflow} OmoFlow</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={PlugZap} label="Integrations" value={totals.integrations} tone="#111111" />
        <Metric icon={CheckCircle2} label="Active" value={totals.activeIntegrations} tone="#047857" />
        <Metric icon={Webhook} label="Webhooks" value={totals.webhooks} tone="#2563eb" />
        <Metric icon={RotateCw} label="Delivered" value={totals.delivered} tone="#6d5dd3" />
        <Metric icon={TriangleAlert} label="Failed" value={totals.failedDeliveries} tone={totals.failedDeliveries ? "#dc2626" : "#047857"} />
        <Metric icon={ShieldCheck} label="OmoFlow" value={totals.omoflow} tone="#d89b00" />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#fbfaf6] px-3" style={{ border: "1px solid #ded8c8" }}>
            <Search className="size-4 text-[#8a8375]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tenants, providers, webhooks, delivery errors..." className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#8a8375]" />
          </div>
          <select value={deliveryStatus} onChange={(event) => setDeliveryStatus(event.target.value)} className="h-12 rounded-2xl bg-[#fbfaf6] px-3 text-[12px] font-black outline-none" style={{ border: "1px solid #ded8c8" }}>
            {["FAILED", "PENDING", "DELIVERED", "CANCELLED", "ALL"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {VIEWS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => setView(item.id)} className={cn("inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-[12px] font-black transition", view === item.id ? "bg-[#111111] text-white" : "bg-[#fbfaf6] text-[#5f574c]")} style={{ border: "1px solid #ded8c8" }}>
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      {view === "catalog" ? (
        <Panel title="Global provider catalog" eyebrow="Supported providers" accent="#111111">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {overview.providerCatalog.map((provider) => {
              const active = overview.integrations[provider.provider]?.ACTIVE ?? 0;
              const error = overview.integrations[provider.provider]?.ERROR ?? 0;
              return (
                <div key={provider.provider} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#111111]">{provider.label}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8375]">{provider.category}</p>
                    </div>
                    <StatusBadge value={error ? "ATTENTION" : active ? "ACTIVE" : "READY"} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <SmallStat label="Active" value={active} />
                    <SmallStat label="Errors" value={error} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      ) : null}

      {view === "integrations" ? (
        <Panel title="Tenant integrations" eyebrow="Connected apps" accent="#2563eb">
          <DataList loading={loading} empty="No tenant integrations matched this filter.">
            {integrations.map((integration) => (
              <Row key={integration.id}>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-black text-[#111111]">{integration.name}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{integration.provider} - {integration.tenant?.name ?? integration.tenantId} - {integration.scopes.length} scopes</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <StatusBadge value={integration.status} />
                  <StatusBadge value={integration.enabled ? "ENABLED" : "DISABLED"} />
                  {canManage ? <button type="button" onClick={() => rotateIntegrationSecretAction(integration)} disabled={busy === `integration:${integration.id}`} className="inline-flex h-9 items-center gap-1 rounded-2xl bg-[#111111] px-3 text-[11px] font-black text-white disabled:opacity-50"><KeyRound className="size-3" />Rotate</button> : null}
                </div>
              </Row>
            ))}
          </DataList>
        </Panel>
      ) : null}

      {view === "webhooks" ? (
        <Panel title="Webhooks" eyebrow="Tenant endpoints" accent="#6d5dd3">
          <DataList loading={loading} empty="No webhooks matched this filter.">
            {webhooks.map((webhook) => (
              <Row key={webhook.id}>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-black text-[#111111]">{webhook.name}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold text-[#766f63]">{webhook.tenant?.name ?? webhook.tenantId} - {webhook.url}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8375]">{webhook.events.join(", ") || "No events"}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <StatusBadge value={webhook.enabled ? "ENABLED" : "DISABLED"} />
                  <StatusBadge value={webhook.failureCount ? `${webhook.failureCount} FAILURES` : "HEALTHY"} />
                  {canManage ? <button type="button" onClick={() => rotateWebhookSecretAction(webhook)} disabled={busy === `webhook:${webhook.id}`} className="inline-flex h-9 items-center gap-1 rounded-2xl bg-[#111111] px-3 text-[11px] font-black text-white disabled:opacity-50"><KeyRound className="size-3" />Rotate</button> : null}
                </div>
              </Row>
            ))}
          </DataList>
        </Panel>
      ) : null}

      {view === "deliveries" ? (
        <Panel title="Webhook deliveries" eyebrow="Retry queue" accent="#dc2626">
          <DataList loading={loading} empty="No webhook deliveries matched this filter.">
            {deliveries.map((delivery) => (
              <Row key={delivery.id}>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-black text-[#111111]">{delivery.eventType}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold text-[#766f63]">{delivery.webhook?.tenant?.name ?? delivery.tenantId} - {delivery.webhook?.name ?? delivery.webhookId} - attempts {delivery.attempts}</p>
                  {delivery.lastError ? <p className="mt-2 line-clamp-2 text-[11px] font-bold text-red-600">{delivery.lastError}</p> : null}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <StatusBadge value={delivery.status} />
                  {canManage && delivery.status !== "DELIVERED" ? <button type="button" onClick={() => retryDelivery(delivery)} disabled={busy === `delivery:${delivery.id}`} className="inline-flex h-9 items-center gap-1 rounded-2xl bg-[#ffd400] px-3 text-[11px] font-black text-[#111111] disabled:opacity-50"><RotateCw className="size-3" />Retry</button> : null}
                </div>
              </Row>
            ))}
          </DataList>
        </Panel>
      ) : null}

      {view === "omoflow" ? (
        <Panel title="OmoFlow integration monitor" eyebrow="Meeting runtime" accent="#d89b00">
          <DataList loading={loading} empty="No OmoFlow runtime integrations returned.">
            {overview.omoflowIntegrations.map((integration) => (
              <Row key={integration.id}>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-black text-[#111111]">{integration.name}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{integration.tenant?.name ?? integration.tenantId} - last sync {formatDate(integration.lastSyncAt)}</p>
                  {integration.lastError ? <p className="mt-2 line-clamp-2 text-[11px] font-bold text-red-600">{integration.lastError}</p> : null}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <StatusBadge value={integration.status} />
                  <StatusBadge value={`${integration._count?.logs ?? 0} LOGS`} />
                  {integration.tenant ? <Link href={`/site-admin/tenants/${integration.tenant.id}/integrations`} className="h-9 rounded-2xl bg-[#fbfaf6] px-3 pt-2 text-[11px] font-black text-[#111111]" style={{ border: "1px solid #ded8c8" }}>Inspect</Link> : null}
                </div>
              </Row>
            ))}
          </DataList>
        </Panel>
      ) : null}
    </div>
  );
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

function Row({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 rounded-2xl bg-[#fbfaf6] p-4 lg:grid-cols-[1fr_auto]" style={{ border: "1px solid #e7dfcf" }}>{children}</div>;
}

function DataList({ children, empty, loading }: { children: ReactNode; empty: string; loading: boolean }) {
  if (loading) return <Empty text="Loading records..." />;
  const count = Array.isArray(children) ? children.length : 1;
  if (count === 0) return <Empty text={empty} />;
  return <div className="space-y-2">{children}</div>;
}

function SmallStat({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl bg-white px-3 py-2" style={{ border: "1px solid #ded8c8" }}><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8375]">{label}</p><p className="mt-1 text-lg font-black text-[#111111]">{value}</p></div>;
}

function StatusBadge({ value }: { value: string }) {
  const upper = value.replace(/_/g, " ").toUpperCase();
  const tone = upper.includes("ACTIVE") || upper.includes("ENABLED") || upper.includes("HEALTHY") || upper.includes("DELIVERED") || upper.includes("READY")
    ? "#047857"
    : upper.includes("FAIL") || upper.includes("ERROR") || upper.includes("DISABLED") || upper.includes("ATTENTION")
      ? "#dc2626"
      : "#6d5dd3";
  return <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[9px] font-black uppercase tracking-[0.08em]" style={{ border: "1px solid #ded8c8", color: tone }}>{upper}</span>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[#ded8c8] bg-[#fbfaf6] px-4 py-8 text-center text-sm font-bold text-[#8a8375]">{text}</div>;
}

function formatDate(value?: string | null) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
