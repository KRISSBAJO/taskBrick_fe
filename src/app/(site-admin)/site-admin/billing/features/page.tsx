"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Layers,
  PackageCheck,
  Plus,
  RefreshCw,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  createSiteBillingFeature,
  listSiteBillingFeatures,
  setSiteBillingFeatureActive,
  updateSiteBillingFeature,
  type SiteBillingFeature,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { EmptyState, OpsPanel, SearchInput, StatusBadge } from "../../_components/site-admin-ops-ui";

type FeatureDraft = {
  key: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  defaultLimit: string;
  metered: boolean;
  isActive: boolean;
};

const blankFeature: FeatureDraft = {
  key: "",
  name: "",
  description: "",
  category: "workspace",
  unit: "",
  defaultLimit: "",
  metered: false,
  isActive: true,
};

const fieldInputClass = "h-11 rounded-2xl bg-white px-3 text-sm font-bold text-[#111111] outline-none disabled:opacity-60";

export default function SiteAdminBillingFeaturesPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [features, setFeatures] = useState<SiteBillingFeature[]>([]);
  const [query, setQuery] = useState("");
  const [selectedFeatureId, setSelectedFeatureId] = useState("");
  const [createDraft, setCreateDraft] = useState<FeatureDraft>(blankFeature);
  const [editFeatureState, setEditFeatureState] = useState<{ draft: FeatureDraft; featureId: string }>({ draft: blankFeature, featureId: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const canManageBilling = user.platformAdminLevel === "OWNER" || user.platformAdminLevel === "ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listSiteBillingFeatures(auth.accessToken, { limit: 100, search: query || undefined });
      setFeatures(result.data);
      setSelectedFeatureId((current) => current || result.data[0]?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load feature catalog.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 150);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selectedFeature = useMemo(
    () => features.find((feature) => feature.id === selectedFeatureId) ?? features[0],
    [features, selectedFeatureId],
  );
  const editDraft = selectedFeature && editFeatureState.featureId === selectedFeature.id ? editFeatureState.draft : selectedFeature ? featureToDraft(selectedFeature) : blankFeature;
  if (selectedFeature && editFeatureState.featureId !== selectedFeature.id) {
    setEditFeatureState({ draft: featureToDraft(selectedFeature), featureId: selectedFeature.id });
  }

  const activeFeatures = features.filter((feature) => feature.isActive).length;
  const meteredFeatures = features.filter((feature) => feature.metered).length;
  const assignedPlans = features.reduce((sum, feature) => sum + (feature.plans?.length ?? 0), 0);

  async function createFeature() {
    if (!canManageBilling) return;
    const payload = draftToFeaturePayload(createDraft);
    if (!payload.key || !payload.name) {
      toast({ title: "Missing feature details", description: "Feature key and name are required.", variant: "warning" });
      return;
    }
    setBusy("create-feature");
    try {
      const created = await createSiteBillingFeature(auth.accessToken, payload);
      toast({ title: "Feature created", description: `${created.name} is now available for plan assignment.`, variant: "success" });
      setCreateDraft(blankFeature);
      setSelectedFeatureId(created.id);
      await load();
    } catch (caught) {
      toast({ title: "Feature creation failed", description: caught instanceof Error ? caught.message : "Unable to create feature.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function saveFeature() {
    if (!canManageBilling || !selectedFeature) return;
    setBusy(`save:${selectedFeature.id}`);
    try {
      const updated = await updateSiteBillingFeature(auth.accessToken, selectedFeature.id, draftToFeaturePayload(editDraft));
      toast({ title: "Feature updated", description: `${updated.name} was saved and audited.`, variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Feature update failed", description: caught instanceof Error ? caught.message : "Unable to update feature.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function toggleFeature(feature: SiteBillingFeature) {
    if (!canManageBilling) return;
    const nextActive = !feature.isActive;
    const confirmed = await confirm({
      title: `${nextActive ? "Enable" : "Disable"} ${feature.name}?`,
      description: nextActive
        ? "The feature becomes available for new plan assignments."
        : "Existing plan records remain, but the feature is no longer available for new active catalog work.",
      confirmLabel: nextActive ? "Enable feature" : "Disable feature",
      tone: nextActive ? "warning" : "danger",
    });
    if (!confirmed) return;
    setBusy(`toggle:${feature.id}`);
    try {
      await setSiteBillingFeatureActive(auth.accessToken, feature.id, nextActive);
      toast({ title: nextActive ? "Feature enabled" : "Feature disabled", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Feature action failed", description: caught instanceof Error ? caught.message : "Unable to update feature status.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-emerald-50">
            <Layers className="size-4 text-emerald-700" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Feature catalog</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">
              {activeFeatures} active · {meteredFeatures} metered · {assignedPlans} plan link{assignedPlans !== 1 ? "s" : ""}
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
          <Link
            href="/site-admin/billing/plans"
            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#fbfaf6] px-3 text-[12px] font-black text-[#5f574c] transition hover:bg-[#f0ebe0]"
            style={{ border: "1px solid #ded8c8" }}
          >
            <PackageCheck className="size-3.5" /> Plans
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="grid gap-5">
          <OpsPanel accent="#111111" eyebrow="Create" title="New feature">
            <FeatureDraftForm
              disabled={!canManageBilling || busy === "create-feature"}
              draft={createDraft}
              onChange={setCreateDraft}
              onNameChange={(name) => setCreateDraft((current) => ({ ...current, name, key: current.key || keyify(name) }))}
            />
            <button
              type="button"
              onClick={() => void createFeature()}
              disabled={!canManageBilling || busy === "create-feature"}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#ffd400] text-sm font-black text-[#111111] disabled:opacity-50"
            >
              <Plus className="size-4" /> Create feature
            </button>
          </OpsPanel>

          <OpsPanel accent="#6d5dd3" eyebrow="Directory" title="Features">
            <SearchInput value={query} onChange={setQuery} placeholder="Search features..." />
            <div className="mt-4 grid gap-2">
              {loading ? <EmptyState text="Loading features..." /> : null}
              {!loading && features.length === 0 ? <EmptyState text="No features found." /> : null}
              {features.map((feature) => (
                <button
                  type="button"
                  key={feature.id}
                  onClick={() => setSelectedFeatureId(feature.id)}
                  className={cn(
                    "rounded-2xl p-3 text-left transition",
                    selectedFeature?.id === feature.id ? "bg-[#111111] text-white" : "bg-[#fbfaf6] text-[#111111] hover:bg-[#fff6bf]",
                  )}
                  style={{ border: selectedFeature?.id === feature.id ? "1px solid #111111" : "1px solid #e7dfcf" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-black">{feature.name}</span>
                    <span className={cn("text-[10px] font-black", selectedFeature?.id === feature.id ? "text-[#ffd400]" : "text-[#766f63]")}>
                      {feature.metered ? "METERED" : "FIXED"}
                    </span>
                  </div>
                  <p className={cn("mt-1 truncate text-[11px] font-semibold", selectedFeature?.id === feature.id ? "text-white/55" : "text-[#766f63]")}>
                    {feature.key} - {feature.plans?.length ?? 0} plans
                  </p>
                </button>
              ))}
            </div>
          </OpsPanel>
        </div>

        <div className="grid gap-5">
          <OpsPanel
            accent="#047857"
            eyebrow="Selected feature"
            title={selectedFeature ? selectedFeature.name : "No feature selected"}
            actions={selectedFeature ? <StatusBadge value={selectedFeature.isActive ? "ACTIVE" : "DISABLED"} /> : null}
          >
            {selectedFeature ? (
              <>
                <FeatureDraftForm
                  disabled={!canManageBilling || busy === `save:${selectedFeature.id}`}
                  draft={editDraft}
                  onChange={(draft) => setEditFeatureState({ draft, featureId: selectedFeature.id })}
                  onNameChange={(name) => setEditFeatureState((current) => ({ draft: { ...(current.featureId === selectedFeature.id ? current.draft : editDraft), name }, featureId: selectedFeature.id }))}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void saveFeature()} disabled={!canManageBilling || busy === `save:${selectedFeature.id}`} className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#111111] px-3 text-[12px] font-black text-white disabled:opacity-50">
                    <Save className="size-4" /> Save changes
                  </button>
                  <button type="button" onClick={() => void toggleFeature(selectedFeature)} disabled={!canManageBilling || busy === `toggle:${selectedFeature.id}`} className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#fbfaf6] px-3 text-[12px] font-black text-[#111111] disabled:opacity-50" style={{ border: "1px solid #ded8c8" }}>
                    {selectedFeature.isActive ? <ToggleLeft className="size-4" /> : <ToggleRight className="size-4" />}
                    {selectedFeature.isActive ? "Disable" : "Enable"}
                  </button>
                </div>
              </>
            ) : <EmptyState text="Select a feature to edit." />}
          </OpsPanel>

          <OpsPanel accent="#fbbf24" eyebrow="Usage" title="Plans using this feature">
            {selectedFeature?.plans?.length ? (
              <div className="grid gap-3">
                {selectedFeature.plans.map((planFeature) => (
                  <div key={planFeature.id} className="grid gap-3 rounded-2xl bg-[#fbfaf6] p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]" style={{ border: "1px solid #e7dfcf" }}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {planFeature.enabled ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Bot className="size-4 text-[#8a8375]" />}
                        <p className="truncate text-sm font-black text-[#111111]">{planFeature.plan.name}</p>
                      </div>
                      <p className="mt-1 truncate text-[11px] font-semibold text-[#766f63]">
                        {planFeature.plan.slug} - {formatMoney(planFeature.plan.price, planFeature.plan.currency)}/{planFeature.plan.interval}
                      </p>
                    </div>
                    <StatusBadge value={planFeature.enabled ? "ENABLED" : "DISABLED"} />
                    <span className="inline-flex h-8 items-center rounded-full bg-white px-3 text-[10px] font-black text-[#111111]" style={{ border: "1px solid #ded8c8" }}>
                      {planFeature.limit ?? selectedFeature.defaultLimit ?? "Unlimited"} {selectedFeature.unit ?? ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : <EmptyState text="This feature is not assigned to any plan yet." />}
          </OpsPanel>
        </div>
      </div>
    </div>
  );
}

function FeatureDraftForm({
  disabled,
  draft,
  onChange,
  onNameChange,
}: {
  disabled: boolean;
  draft: FeatureDraft;
  onChange: (draft: FeatureDraft) => void;
  onNameChange: (name: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Name">
          <input disabled={disabled} value={draft.name} onChange={(event) => onNameChange(event.target.value)} className={fieldInputClass} style={{ border: "1px solid #ded8c8" }} placeholder="AI token usage" />
        </Field>
        <Field label="Feature key">
          <input disabled={disabled} value={draft.key} onChange={(event) => onChange({ ...draft, key: keyify(event.target.value) })} className={fieldInputClass} style={{ border: "1px solid #ded8c8" }} placeholder="ai.tokens" />
        </Field>
      </div>
      <Field label="Description">
        <textarea disabled={disabled} value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} className={`${fieldInputClass} min-h-20 py-3`} style={{ border: "1px solid #ded8c8" }} placeholder="What this feature unlocks..." />
      </Field>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Category">
          <input disabled={disabled} value={draft.category} onChange={(event) => onChange({ ...draft, category: event.target.value })} className={fieldInputClass} style={{ border: "1px solid #ded8c8" }} placeholder="automation" />
        </Field>
        <Field label="Unit">
          <input disabled={disabled} value={draft.unit} onChange={(event) => onChange({ ...draft, unit: event.target.value })} className={fieldInputClass} style={{ border: "1px solid #ded8c8" }} placeholder="runs" />
        </Field>
        <Field label="Default limit">
          <input disabled={disabled} value={draft.defaultLimit} onChange={(event) => onChange({ ...draft, defaultLimit: event.target.value })} inputMode="numeric" className={fieldInputClass} style={{ border: "1px solid #ded8c8" }} placeholder="Unlimited" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#fbfaf6] px-3 text-[12px] font-black text-[#111111]" style={{ border: "1px solid #ded8c8" }}>
          <input type="checkbox" disabled={disabled} checked={draft.metered} onChange={(event) => onChange({ ...draft, metered: event.target.checked })} />
          Metered
        </label>
        <label className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#fbfaf6] px-3 text-[12px] font-black text-[#111111]" style={{ border: "1px solid #ded8c8" }}>
          <input type="checkbox" disabled={disabled} checked={draft.isActive} onChange={(event) => onChange({ ...draft, isActive: event.target.checked })} />
          Active
        </label>
      </div>
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

function featureToDraft(feature: SiteBillingFeature): FeatureDraft {
  return {
    key: feature.key,
    name: feature.name,
    description: feature.description ?? "",
    category: feature.category ?? "",
    unit: feature.unit ?? "",
    defaultLimit: feature.defaultLimit == null ? "" : String(feature.defaultLimit),
    metered: Boolean(feature.metered),
    isActive: Boolean(feature.isActive),
  };
}

function draftToFeaturePayload(draft: FeatureDraft) {
  return {
    key: keyify(draft.key),
    name: draft.name.trim(),
    description: optionalText(draft.description),
    category: optionalText(draft.category),
    unit: optionalText(draft.unit),
    defaultLimit: optionalNumber(draft.defaultLimit),
    metered: draft.metered,
    isActive: draft.isActive,
  };
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalNumber(value: string) {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function keyify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "");
}

function formatMoney(value?: number | string | null, currency = "USD") {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "n/a";
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
}
