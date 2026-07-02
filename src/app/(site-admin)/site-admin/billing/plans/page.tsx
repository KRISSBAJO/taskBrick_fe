"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  archiveSiteBillingPlan,
  assignSiteBillingPlanFeature,
  createSiteBillingPlan,
  listSiteBillingFeatures,
  listSiteBillingPlans,
  removeSiteBillingPlanFeature,
  restoreSiteBillingPlan,
  syncSiteBillingPlanToStripe,
  updateSiteBillingPlan,
  updateSiteBillingPlanFeature,
  type SiteBillingFeature,
  type SiteBillingPlan,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  EmptyState,
  MetricCard,
  OperationsHero,
  OpsPanel,
  SearchInput,
  StatusBadge,
} from "../../_components/site-admin-ops-ui";

/* ─── Types ──────────────────────────────────────────────────────────────────── */

type PlanDraft = {
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  interval: string;
  trialDays: string;
  seatLimit: string;
  providerPriceId: string;
  isActive: boolean;
};

type AssignmentDraft = {
  featureId: string;
  limit: string;
  enabled: boolean;
};

const blankPlan: PlanDraft = {
  name: "",
  slug: "",
  description: "",
  price: "0",
  currency: "USD",
  interval: "month",
  trialDays: "14",
  seatLimit: "",
  providerPriceId: "",
  isActive: true,
};

const blankAssignment: AssignmentDraft = { featureId: "", limit: "", enabled: true };

const inputCls =
  "h-10 w-full rounded-[12px] bg-white px-3 text-sm font-bold text-[#111111] outline-none transition placeholder:text-[#c4bdb4] focus:ring-2 focus:ring-[#ffd400]/40 disabled:opacity-50";
const inputBorder = { border: "1px solid #ded8c8" } as const;

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default function SiteAdminBillingPlansPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SiteBillingPlan[]>([]);
  const [features, setFeatures] = useState<SiteBillingFeature[]>([]);
  const [query, setQuery] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<PlanDraft>(blankPlan);
  const [editPlanState, setEditPlanState] = useState<{ draft: PlanDraft; planId: string }>({ draft: blankPlan, planId: "" });
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentDraft>(blankAssignment);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canManageBilling = user.platformAdminLevel === "OWNER" || user.platformAdminLevel === "ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [planResult, featureResult] = await Promise.all([
        listSiteBillingPlans(auth.accessToken, { limit: 100, search: query || undefined }),
        listSiteBillingFeatures(auth.accessToken, { limit: 100 }),
      ]);
      setPlans(planResult.data);
      setFeatures(featureResult.data);
      setSelectedPlanId((current) => current || planResult.data[0]?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load plan catalog.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 150);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0],
    [plans, selectedPlanId],
  );
  const editDraft =
    selectedPlan && editPlanState.planId === selectedPlan.id
      ? editPlanState.draft
      : selectedPlan
        ? planToDraft(selectedPlan)
        : blankPlan;
  if (selectedPlan && editPlanState.planId !== selectedPlan.id) {
    setEditPlanState({ draft: planToDraft(selectedPlan), planId: selectedPlan.id });
  }

  const activePlans = plans.filter((plan) => plan.isActive && !plan.archivedAt).length;
  const totalSubscriptions = plans.reduce((sum, plan) => sum + (plan._count?.subscriptions ?? 0), 0);
  const availableFeatures = selectedPlan ? unassignedFeatures(features, selectedPlan) : features;
  const assignmentFeatureId = assignmentDraft.featureId || availableFeatures[0]?.id || "";

  /* ── actions ─────────────────────────────────────────────────────────────── */

  async function createPlan() {
    if (!canManageBilling) return;
    const payload = draftToPlanPayload(createDraft);
    if (!payload.name || !payload.slug) {
      toast({ title: "Missing plan details", description: "Plan name and slug are required.", variant: "warning" });
      return;
    }
    setBusy("create-plan");
    try {
      const created = await createSiteBillingPlan(auth.accessToken, payload);
      toast({ title: "Plan created", description: `${created.name} is now available.`, variant: "success" });
      setCreateDraft(blankPlan);
      setComposerOpen(false);
      setSelectedPlanId(created.id);
      await load();
    } catch (caught) {
      toast({ title: "Plan creation failed", description: caught instanceof Error ? caught.message : "Unable to create plan.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function savePlan() {
    if (!canManageBilling || !selectedPlan) return;
    setBusy(`save:${selectedPlan.id}`);
    try {
      const updated = await updateSiteBillingPlan(auth.accessToken, selectedPlan.id, draftToPlanPayload(editDraft));
      toast({ title: "Plan updated", description: `${updated.name} was saved.`, variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Plan update failed", description: caught instanceof Error ? caught.message : "Unable to update plan.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function toggleArchive(plan: SiteBillingPlan) {
    if (!canManageBilling) return;
    const restoring = Boolean(plan.archivedAt);
    const confirmed = await confirm({
      title: `${restoring ? "Restore" : "Archive"} ${plan.name}?`,
      description: restoring
        ? "The plan becomes selectable again for platform billing operations."
        : "The plan is hidden from new billing assignment but existing subscriptions keep their history.",
      confirmLabel: restoring ? "Restore plan" : "Archive plan",
      tone: restoring ? "warning" : "danger",
    });
    if (!confirmed) return;
    setBusy(`archive:${plan.id}`);
    try {
      await (restoring ? restoreSiteBillingPlan(auth.accessToken, plan.id) : archiveSiteBillingPlan(auth.accessToken, plan.id));
      toast({ title: restoring ? "Plan restored" : "Plan archived", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Plan action failed", description: caught instanceof Error ? caught.message : "Unable to update plan status.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function syncStripe(plan: SiteBillingPlan) {
    if (!canManageBilling) return;
    const confirmed = await confirm({
      title: `Sync ${plan.name} to Stripe?`,
      description: "This creates Stripe Product and Price records and stores the returned Stripe price id on the plan.",
      confirmLabel: "Sync Stripe",
      tone: "warning",
    });
    if (!confirmed) return;
    setBusy(`stripe:${plan.id}`);
    try {
      await syncSiteBillingPlanToStripe(auth.accessToken, plan.id);
      toast({ title: "Stripe sync complete", description: "Checkout will use the synced Stripe price id.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Stripe sync failed", description: caught instanceof Error ? caught.message : "Unable to sync Stripe plan.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function assignFeature() {
    if (!canManageBilling || !selectedPlan || !assignmentFeatureId) return;
    setBusy(`assign:${selectedPlan.id}`);
    try {
      await assignSiteBillingPlanFeature(auth.accessToken, selectedPlan.id, {
        featureId: assignmentFeatureId,
        limit: optionalNumber(assignmentDraft.limit),
        enabled: assignmentDraft.enabled,
      });
      toast({ title: "Feature assigned", description: "Plan entitlement was updated.", variant: "success" });
      setAssignmentDraft(blankAssignment);
      await load();
    } catch (caught) {
      toast({ title: "Feature assignment failed", description: caught instanceof Error ? caught.message : "Unable to assign feature.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function updateEntitlement(featureId: string, patch: { limit?: string; enabled?: boolean }) {
    if (!canManageBilling || !selectedPlan) return;
    setBusy(`entitlement:${selectedPlan.id}:${featureId}`);
    try {
      await updateSiteBillingPlanFeature(auth.accessToken, selectedPlan.id, featureId, {
        limit: patch.limit === undefined ? undefined : optionalNumber(patch.limit),
        enabled: patch.enabled,
      });
      toast({ title: "Entitlement updated", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Entitlement update failed", description: caught instanceof Error ? caught.message : "Unable to update entitlement.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function removeEntitlement(featureId: string, featureName: string) {
    if (!canManageBilling || !selectedPlan) return;
    const confirmed = await confirm({
      title: `Remove ${featureName} from ${selectedPlan.name}?`,
      description: "Tenants on this plan will lose this entitlement after enforcement is applied.",
      confirmLabel: "Remove feature",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusy(`remove:${selectedPlan.id}:${featureId}`);
    try {
      await removeSiteBillingPlanFeature(auth.accessToken, selectedPlan.id, featureId);
      toast({ title: "Feature removed", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Remove failed", description: caught instanceof Error ? caught.message : "Unable to remove feature.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5">

      <OperationsHero
        icon={PackageCheck}
        label="Billing"
        title="Plans"
        description="Catalog, pricing, and entitlements for tenant subscriptions"
      >
        <Link
          href="/site-admin/billing"
          className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-[#fbfaf6] px-3 text-[12px] font-black text-[#5f574c] transition hover:bg-[#f0ebe0]"
          style={{ border: "1px solid #ded8c8" }}
        >
          <ArrowLeft className="size-3.5" /> Billing
        </Link>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-[#fbfaf6] px-3 text-[12px] font-black text-[#5f574c] transition hover:bg-[#f0ebe0]"
          style={{ border: "1px solid #ded8c8" }}
        >
          <RefreshCw className="size-3.5" /> Refresh
        </button>
        <button
          type="button"
          onClick={() => setComposerOpen((open) => !open)}
          disabled={!canManageBilling}
          className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-[#ffd400] px-4 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300 disabled:opacity-50"
        >
          {composerOpen ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {composerOpen ? "Close" : "New plan"}
        </button>
      </OperationsHero>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {/* ── Metrics ──────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={PackageCheck} label="Plans" tone="#6d5dd3" value={plans.length} subtext="In catalog" />
        <MetricCard icon={CheckCircle2} label="Active" tone="#047857" value={activePlans} subtext="Open for new subscriptions" />
        <MetricCard icon={CreditCard} label="Subscriptions" tone="#d89b00" value={totalSubscriptions} subtext="Across all plans" />
        <MetricCard icon={ShieldCheck} label="Features" tone="#111111" value={features.length} subtext="In feature catalog" />
      </div>

      {/* ── New plan composer ────────────────────────────────────────────────── */}
      {composerOpen && (
        <OpsPanel
          accent="#ffd400"
          eyebrow="New plan"
          title="Create a plan"
          actions={
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-[#fbfaf6] px-3 text-[12px] font-black text-[#5f574c] transition hover:bg-[#f0ebe0]"
              style={{ border: "1px solid #ded8c8" }}
            >
              Cancel
            </button>
          }
        >
          <PlanDraftForm
            disabled={!canManageBilling || busy === "create-plan"}
            draft={createDraft}
            onChange={setCreateDraft}
            onNameChange={(name) =>
              setCreateDraft((c) => ({ ...c, name, slug: c.slug || slugify(name) }))
            }
          />
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => void createPlan()}
              disabled={!canManageBilling || busy === "create-plan"}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#ffd400] px-6 text-sm font-black text-[#111111] shadow-[0_4px_18px_rgba(255,212,0,0.28)] transition hover:bg-amber-300 disabled:opacity-50"
            >
              <Plus className="size-4" /> Create plan
            </button>
          </div>
        </OpsPanel>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">

        {/* ── Catalog ──────────────────────────────────────────────────────── */}
        <OpsPanel accent="#6d5dd3" eyebrow="Catalog" title={`All plans (${plans.length})`}>
          <SearchInput value={query} onChange={setQuery} placeholder="Search plans…" />

          <div className="mt-3 grid gap-2">
            {loading && <EmptyState text="Loading plans…" />}
            {!loading && plans.length === 0 && <EmptyState text="No plans yet. Create one to start billing tenants." />}

            {plans.map((plan) => {
              const sel = selectedPlan?.id === plan.id;
              const statusColor = plan.archivedAt ? "#d89b00" : plan.isActive ? "#047857" : "#a09890";
              const statusLabel = plan.archivedAt ? "Archived" : plan.isActive ? "Active" : "Inactive";
              return (
                <button
                  type="button"
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "w-full rounded-2xl p-3.5 text-left transition-all duration-200",
                    sel
                      ? "bg-[#111111] shadow-[0_8px_24px_rgba(17,17,17,0.22)]"
                      : "bg-[#fbfaf6] hover:bg-[#fff8d6] hover:shadow-sm",
                  )}
                  style={{ border: sel ? "1px solid #2e2e2e" : "1px solid #e7dfcf" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cn("truncate text-sm font-black", sel ? "text-white" : "text-[#111111]")}>
                        {plan.name}
                      </p>
                      <p className={cn("mt-1 flex items-center gap-1.5 text-[11px] font-semibold", sel ? "text-white/40" : "text-[#a09890]")}>
                        <span className="size-1.5 shrink-0 rounded-full" style={{ background: statusColor }} aria-hidden="true" />
                        {statusLabel} · {plan._count?.subscriptions ?? 0} subscriber{(plan._count?.subscriptions ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn("text-[15px] font-black leading-tight", sel ? "text-[#ffd400]" : "text-[#111111]")}>
                        {formatMoney(plan.price, plan.currency)}
                      </p>
                      <p className={cn("text-[10px] font-semibold", sel ? "text-white/35" : "text-[#a09890]")}>
                        /{plan.interval}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </OpsPanel>

        {/* ── Selected plan ────────────────────────────────────────────────── */}
        <div className="grid content-start gap-5">

          <OpsPanel
            accent="#ffd400"
            eyebrow="Plan settings"
            title={selectedPlan ? selectedPlan.name : "No plan selected"}
            actions={
              selectedPlan ? (
                <StatusBadge
                  value={selectedPlan.archivedAt ? "ARCHIVED" : selectedPlan.isActive ? "ACTIVE" : "INACTIVE"}
                />
              ) : undefined
            }
          >
            {selectedPlan ? (
              <>
                <PlanDraftForm
                  disabled={!canManageBilling || busy === `save:${selectedPlan.id}`}
                  draft={editDraft}
                  onChange={(draft) => setEditPlanState({ draft, planId: selectedPlan.id })}
                  onNameChange={(name) =>
                    setEditPlanState((c) => ({
                      draft: { ...(c.planId === selectedPlan.id ? c.draft : editDraft), name },
                      planId: selectedPlan.id,
                    }))
                  }
                />
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#eee8dc] pt-4">
                  <button
                    type="button"
                    onClick={() => void savePlan()}
                    disabled={!canManageBilling || busy === `save:${selectedPlan.id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#111111] px-4 text-[12px] font-black text-white transition hover:bg-[#2a2a2a] disabled:opacity-50"
                  >
                    <Save className="size-4" /> Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => void syncStripe(selectedPlan)}
                    disabled={!canManageBilling || selectedPlan.currency.toUpperCase() === "NGN" || busy === `stripe:${selectedPlan.id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#fbfaf6] px-4 text-[12px] font-black text-[#5f574c] transition hover:bg-[#f0ebe0] disabled:opacity-50"
                    style={{ border: "1px solid #ded8c8" }}
                  >
                    <Zap className="size-4" /> Sync Stripe
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleArchive(selectedPlan)}
                    disabled={!canManageBilling || busy === `archive:${selectedPlan.id}`}
                    className={cn(
                      "ml-auto inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-4 text-[12px] font-black transition disabled:opacity-50",
                      selectedPlan.archivedAt ? "text-[#5f574c] hover:bg-[#f0ebe0]" : "text-red-600 hover:bg-red-50",
                    )}
                    style={{ border: selectedPlan.archivedAt ? "1px solid #ded8c8" : "1px solid #fecaca" }}
                  >
                    {selectedPlan.archivedAt ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
                    {selectedPlan.archivedAt ? "Restore plan" : "Archive plan"}
                  </button>
                </div>
              </>
            ) : (
              <EmptyState text="Select a plan from the catalog to edit its settings." />
            )}
          </OpsPanel>

          {/* ── Entitlements ─────────────────────────────────────────────────── */}
          <OpsPanel
            accent="#047857"
            eyebrow="Entitlements"
            title="Features & limits"
            actions={
              selectedPlan ? (
                <span className="text-[11px] font-black text-[#8a8375]">
                  {selectedPlan.features?.length ?? 0} assigned
                </span>
              ) : undefined
            }
          >
            {selectedPlan ? (
              <>
                {/* Add feature */}
                <div
                  className="grid items-end gap-2.5 rounded-2xl border border-dashed border-[#ded8c8] bg-[#fbfaf6] p-4 sm:grid-cols-[minmax(0,1fr)_120px_auto_auto]"
                >
                  <Field label="Feature">
                    <select
                      value={assignmentFeatureId}
                      onChange={(e) => setAssignmentDraft((c) => ({ ...c, featureId: e.target.value }))}
                      disabled={!canManageBilling || availableFeatures.length === 0}
                      className={cn(inputCls, "cursor-pointer")}
                      style={inputBorder}
                    >
                      <option value="">Select feature…</option>
                      {availableFeatures.map((f) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.key})</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Limit">
                    <input
                      value={assignmentDraft.limit}
                      onChange={(e) => setAssignmentDraft((c) => ({ ...c, limit: e.target.value }))}
                      placeholder="Unlimited"
                      inputMode="numeric"
                      className={inputCls}
                      style={inputBorder}
                    />
                  </Field>
                  <label
                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-white px-3 text-[11px] font-black text-[#111111]"
                    style={inputBorder}
                  >
                    <input
                      type="checkbox"
                      checked={assignmentDraft.enabled}
                      onChange={(e) => setAssignmentDraft((c) => ({ ...c, enabled: e.target.checked }))}
                      className="accent-[#111111]"
                    />
                    Enabled
                  </label>
                  <button
                    type="button"
                    onClick={() => void assignFeature()}
                    disabled={!canManageBilling || !assignmentFeatureId || busy === `assign:${selectedPlan.id}`}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[12px] bg-[#111111] px-4 text-[12px] font-black text-white transition hover:bg-[#2a2a2a] disabled:opacity-50"
                  >
                    <Plus className="size-4" /> Add
                  </button>
                </div>

                {/* Feature list */}
                <div className="mt-4 grid gap-2.5">
                  {selectedPlan.features?.length ? (
                    selectedPlan.features.map((pf) => (
                      <EntitlementRow
                        key={`${pf.id}:${pf.limit ?? "unlimited"}`}
                        busy={busy}
                        canManage={canManageBilling}
                        featureId={pf.feature.id}
                        name={pf.feature.name}
                        featureKey={pf.feature.key}
                        limit={pf.limit}
                        enabled={pf.enabled}
                        unit={pf.feature.unit}
                        onRemove={() => void removeEntitlement(pf.feature.id, pf.feature.name)}
                        onUpdate={(patch) => void updateEntitlement(pf.feature.id, patch)}
                      />
                    ))
                  ) : (
                    <EmptyState text="No features assigned yet. Add one above to define what this plan includes." />
                  )}
                </div>
              </>
            ) : (
              <EmptyState text="Select a plan to manage its entitlements." />
            )}
          </OpsPanel>
        </div>
      </div>
    </div>
  );
}

/* ─── PlanDraftForm ──────────────────────────────────────────────────────────── */

function PlanDraftForm({
  disabled,
  draft,
  onChange,
  onNameChange,
}: {
  disabled: boolean;
  draft: PlanDraft;
  onChange: (draft: PlanDraft) => void;
  onNameChange: (name: string) => void;
}) {
  return (
    <div className="grid gap-4">
      {/* Identity */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input
            disabled={disabled}
            value={draft.name}
            onChange={(e) => onNameChange(e.target.value)}
            className={inputCls}
            style={inputBorder}
            placeholder="Business"
          />
        </Field>
        <Field label="Slug">
          <input
            disabled={disabled}
            value={draft.slug}
            onChange={(e) => onChange({ ...draft, slug: slugify(e.target.value) })}
            className={cn(inputCls, "font-mono text-[13px]")}
            style={inputBorder}
            placeholder="business"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          disabled={disabled}
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          className={cn(inputCls, "h-auto min-h-[72px] resize-none py-2.5")}
          style={inputBorder}
          placeholder="Who this plan is for…"
        />
      </Field>

      <SectionDivider label="Pricing" />

      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Price">
          <input
            disabled={disabled}
            value={draft.price}
            onChange={(e) => onChange({ ...draft, price: e.target.value })}
            inputMode="decimal"
            className={inputCls}
            style={inputBorder}
          />
        </Field>
        <Field label="Currency">
          <input
            disabled={disabled}
            value={draft.currency}
            onChange={(e) => onChange({ ...draft, currency: e.target.value.toUpperCase().slice(0, 3) })}
            className={inputCls}
            style={inputBorder}
          />
        </Field>
        <Field label="Interval">
          <select
            disabled={disabled}
            value={draft.interval}
            onChange={(e) => onChange({ ...draft, interval: e.target.value })}
            className={cn(inputCls, "cursor-pointer")}
            style={inputBorder}
          >
            <option value="month">Month</option>
            <option value="year">Year</option>
            <option value="week">Week</option>
          </select>
        </Field>
        <Field label="Trial days">
          <input
            disabled={disabled}
            value={draft.trialDays}
            onChange={(e) => onChange({ ...draft, trialDays: e.target.value })}
            inputMode="numeric"
            className={inputCls}
            style={inputBorder}
          />
        </Field>
      </div>

      <SectionDivider label="Configuration" />

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Seat limit">
          <input
            disabled={disabled}
            value={draft.seatLimit}
            onChange={(e) => onChange({ ...draft, seatLimit: e.target.value })}
            inputMode="numeric"
            className={inputCls}
            style={inputBorder}
            placeholder="Unlimited"
          />
        </Field>
        <Field label="Provider price ID">
          <input
            disabled={disabled}
            value={draft.providerPriceId}
            onChange={(e) => onChange({ ...draft, providerPriceId: e.target.value })}
            className={cn(inputCls, "font-mono text-[12px]")}
            style={inputBorder}
            placeholder="price_…"
          />
        </Field>
        <label
          className="mt-6 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-[#fbfaf6] px-3 text-[12px] font-black text-[#111111]"
          style={inputBorder}
        >
          <input
            type="checkbox"
            disabled={disabled}
            checked={draft.isActive}
            onChange={(e) => onChange({ ...draft, isActive: e.target.checked })}
            className="accent-[#111111]"
          />
          Active
        </label>
      </div>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-[#eee8dc]" />
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#c4bdb4]">{label}</span>
      <span className="h-px flex-1 bg-[#eee8dc]" />
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{label}</span>
      {children}
    </label>
  );
}

/* ─── EntitlementRow ─────────────────────────────────────────────────────────── */

function EntitlementRow({
  busy,
  canManage,
  enabled,
  featureId,
  featureKey,
  limit,
  name,
  onRemove,
  onUpdate,
  unit,
}: {
  busy: string;
  canManage: boolean;
  enabled: boolean;
  featureId: string;
  featureKey: string;
  limit?: number | null;
  name: string;
  onRemove: () => void;
  onUpdate: (patch: { limit?: string; enabled?: boolean }) => void;
  unit?: string | null;
}) {
  const [limitDraft, setLimitDraft] = useState(limit == null ? "" : String(limit));

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl bg-[#fbfaf6] p-3.5 sm:flex-row sm:items-center"
      style={{ border: "1px solid #e7dfcf" }}
    >
      {/* Feature info */}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <span
          className="mt-0.5 size-2 shrink-0 rounded-full"
          style={{ background: enabled ? "#047857" : "#c4bdb4" }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#111111]">{name}</p>
          <p className="truncate text-[11px] font-semibold text-[#a09890]">
            {featureKey}{unit ? ` · ${unit}` : ""}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex shrink-0 items-center gap-1.5">
        <input
          value={limitDraft}
          onChange={(e) => setLimitDraft(e.target.value)}
          disabled={!canManage}
          inputMode="numeric"
          className="h-9 w-24 rounded-[10px] bg-white px-3 text-[11px] font-bold outline-none transition placeholder:text-[#c4bdb4] focus:ring-2 focus:ring-[#ffd400]/40 disabled:opacity-50"
          style={inputBorder}
          placeholder="Unlimited"
        />
        <button
          type="button"
          disabled={!canManage || busy.startsWith("entitlement:")}
          onClick={() => onUpdate({ limit: limitDraft })}
          className="inline-flex size-9 items-center justify-center rounded-[10px] bg-[#111111] text-white transition hover:bg-[#2a2a2a] disabled:opacity-50"
          title="Save limit"
        >
          <Save className="size-3.5" />
        </button>
        <button
          type="button"
          disabled={!canManage || busy.includes(featureId)}
          onClick={() => onUpdate({ enabled: !enabled })}
          className={cn(
            "h-9 rounded-[10px] px-3 text-[11px] font-black transition disabled:opacity-50",
            enabled ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-white text-[#766f63] hover:bg-[#f5f0e4]",
          )}
          style={{ border: "1px solid #e7dfcf" }}
        >
          {enabled ? "On" : "Off"}
        </button>
        <button
          type="button"
          disabled={!canManage || busy.includes(featureId)}
          onClick={onRemove}
          className="inline-flex size-9 items-center justify-center rounded-[10px] bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          style={{ border: "1px solid #fecaca" }}
          aria-label="Remove feature"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function planToDraft(plan: SiteBillingPlan): PlanDraft {
  return {
    name: plan.name,
    slug: plan.slug,
    description: plan.description ?? "",
    price: String(plan.price ?? 0),
    currency: plan.currency ?? "USD",
    interval: plan.interval ?? "month",
    trialDays: plan.trialDays == null ? "" : String(plan.trialDays),
    seatLimit: plan.seatLimit == null ? "" : String(plan.seatLimit),
    providerPriceId: plan.providerPriceId ?? "",
    isActive: Boolean(plan.isActive),
  };
}

function draftToPlanPayload(draft: PlanDraft) {
  return {
    name: draft.name.trim(),
    slug: slugify(draft.slug),
    description: optionalText(draft.description),
    price: Number(draft.price || 0),
    currency: draft.currency.trim().toUpperCase() || "USD",
    interval: draft.interval || "month",
    trialDays: optionalNumber(draft.trialDays),
    seatLimit: optionalNumber(draft.seatLimit),
    providerPriceId: optionalText(draft.providerPriceId),
    isActive: draft.isActive,
  };
}

function unassignedFeatures(features: SiteBillingFeature[], plan: SiteBillingPlan) {
  const assigned = new Set((plan.features ?? []).map((f) => f.feature.id));
  return features.filter((f) => f.isActive && !assigned.has(f.id));
}

function optionalText(value: string) {
  const t = value.trim();
  return t || undefined;
}

function optionalNumber(value: string) {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function formatMoney(value?: number | string | null, currency = "USD") {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "n/a";
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
}
