"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import {
  Archive,
  Ban,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  approveApprovalStep,
  archiveApprovalDefinition,
  cancelApproval,
  createApproval,
  createApprovalDefinition,
  listApprovalDefinitions,
  listApprovals,
  listMyPendingApprovals,
  listUsers,
  rejectApprovalStep,
  reopenApproval,
  restoreApprovalDefinition,
  updateApprovalDefinition,
  type Approval,
  type ApprovalDefinition,
  type ApprovalStatus,
  type ApprovalStep,
  type ApprovalStepInput,
  type TenantUser,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/workspace-ui";

type ActiveTab = "pending" | "all" | "definitions";
type DecisionMode = "approve" | "reject";
type DefinitionForm = {
  id?: string;
  description: string;
  entityType: string;
  isActive: boolean;
  name: string;
  steps: DraftStep[];
};
type DraftStep = {
  approverId: string;
  approverRole: string;
  escalationHours: string;
  required: boolean;
  title: string;
};
type ApprovalForm = {
  definitionId: string;
  description: string;
  dueDate: string;
  entityId: string;
  entityType: string;
  stepApproverId: string;
  stepApproverRole: string;
  stepTitle: string;
  title: string;
};

const statusOptions: ApprovalStatus[] = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];
const entityTypes = ["PROJECT", "TASK", "DOCUMENT", "SPRINT", "MEETING", "RISK", "BUDGET", "CHANGE_REQUEST", "GENERAL"];
const inputClass = "h-12 w-full rounded-2xl border border-line bg-panel px-4 text-sm font-bold text-foreground outline-none transition placeholder:text-ink-soft/60 focus:border-primary";
const textareaClass = "w-full rounded-2xl border border-line bg-panel px-4 py-3 text-sm font-bold text-foreground outline-none transition placeholder:text-ink-soft/60 focus:border-primary";

const emptyDefinitionForm = (): DefinitionForm => ({
  description: "",
  entityType: "PROJECT",
  isActive: true,
  name: "",
  steps: [emptyDraftStep()],
});

const emptyApprovalForm = (): ApprovalForm => ({
  definitionId: "",
  description: "",
  dueDate: "",
  entityId: "",
  entityType: "PROJECT",
  stepApproverId: "",
  stepApproverRole: "",
  stepTitle: "Review request",
  title: "",
});

function emptyDraftStep(): DraftStep {
  return {
    approverId: "",
    approverRole: "",
    escalationHours: "",
    required: true,
    title: "Review request",
  };
}

export default function ApprovalsPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("pending");
  const [allApprovals, setAllApprovals] = useState<Approval[]>([]);
  const [approvalForm, setApprovalForm] = useState<ApprovalForm>(() => emptyApprovalForm());
  const [definitionForm, setDefinitionForm] = useState<DefinitionForm>(() => emptyDefinitionForm());
  const [definitions, setDefinitions] = useState<ApprovalDefinition[]>([]);
  const [decision, setDecision] = useState<{ approval: Approval; mode: DecisionMode; step: ApprovalStep } | null>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [detail, setDetail] = useState<Approval | null>(null);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [showApprovalComposer, setShowApprovalComposer] = useState(false);
  const [showDefinitionComposer, setShowDefinitionComposer] = useState(false);
  const [users, setUsers] = useState<TenantUser[]>([]);

  const canManageApprovals = user.permissions.includes("manage:projects") || user.permissions.includes("manage:all");
  const pendingCount = pendingApprovals.length;
  const blockedCount = allApprovals.filter((item) => item.status === "REJECTED" || item.status === "CANCELLED").length;
  const activeDefinitions = definitions.filter((definition) => definition.isActive && !definition.archivedAt).length;
  const waitingForOthers = allApprovals.filter((approval) => approval.status === "PENDING" && !approval.steps.some((step) => isMyPendingStep(step, user.id))).length;

  const visibleApprovals = useMemo(() => {
    const text = query.trim().toLowerCase();
    return allApprovals.filter((approval) => {
      if (filterStatus !== "ALL" && approval.status !== filterStatus) return false;
      if (!text) return true;
      return [approval.title, approval.description, approval.entityType, approval.entityId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text));
    });
  }, [allApprovals, filterStatus, query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage(null);
    try {
      const [pendingPage, approvalsPage, definitionPage, userPage] = await Promise.all([
        listMyPendingApprovals(auth.accessToken, { limit: 100 }),
        listApprovals(auth.accessToken, { limit: 100 }),
        listApprovalDefinitions(auth.accessToken, { includeArchived: true, limit: 100 }),
        listUsers(auth.accessToken, { limit: 100 }),
      ]);
      setPendingApprovals(pendingPage.data);
      setAllApprovals(approvalsPage.data);
      setDefinitions(definitionPage.data);
      setUsers(userPage.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load approval center.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function openApprovalComposer() {
    setApprovalForm(emptyApprovalForm());
    setShowApprovalComposer(true);
  }

  function openDefinitionComposer(definition?: ApprovalDefinition) {
    if (!definition) {
      setDefinitionForm(emptyDefinitionForm());
      setShowDefinitionComposer(true);
      return;
    }
    setDefinitionForm({
      id: definition.id,
      description: definition.description ?? "",
      entityType: definition.entityType,
      isActive: definition.isActive,
      name: definition.name,
      steps: definition.steps.map((step) => ({
        approverId: step.approverId ?? "",
        approverRole: step.approverRole ?? "",
        escalationHours: step.escalationHours ? String(step.escalationHours) : "",
        required: step.required,
        title: step.title,
      })),
    });
    setShowDefinitionComposer(true);
  }

  async function submitApproval(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payloadSteps = buildApprovalSteps(approvalForm);
    if (!approvalForm.definitionId && !payloadSteps.length) {
      setMessage({ ok: false, text: "Select a definition or choose a direct approver." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const created = await createApproval(auth.accessToken, {
        definitionId: approvalForm.definitionId || undefined,
        description: approvalForm.description.trim() || undefined,
        dueDate: approvalForm.dueDate ? new Date(`${approvalForm.dueDate}T12:00:00`).toISOString() : undefined,
        entityId: approvalForm.entityId.trim(),
        entityType: approvalForm.entityType,
        steps: approvalForm.definitionId ? undefined : payloadSteps,
        title: approvalForm.title.trim(),
      });
      setAllApprovals((current) => [created, ...current]);
      setShowApprovalComposer(false);
      setMessage({ ok: true, text: "Approval request created." });
      toast({ title: "Approval created", description: "Assigned approvers were notified.", variant: "success" });
      await load();
    } catch (caught) {
      const description = caught instanceof Error ? caught.message : "Unable to create approval.";
      setMessage({ ok: false, text: description });
      toast({ title: "Approval failed", description, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function submitDefinition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const steps = buildDefinitionSteps(definitionForm.steps);
    if (!steps.length) {
      setMessage({ ok: false, text: "Definition requires at least one resolvable approver step." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        description: definitionForm.description.trim() || undefined,
        entityType: definitionForm.entityType,
        isActive: definitionForm.isActive,
        name: definitionForm.name.trim(),
        steps,
      };
      const saved = definitionForm.id
        ? await updateApprovalDefinition(auth.accessToken, definitionForm.id, payload)
        : await createApprovalDefinition(auth.accessToken, payload);
      setDefinitions((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setShowDefinitionComposer(false);
      setMessage({ ok: true, text: definitionForm.id ? "Approval definition updated." : "Approval definition created." });
      toast({ title: "Definition saved", description: "Approval routing is ready to use.", variant: "success" });
      await load();
    } catch (caught) {
      const description = caught instanceof Error ? caught.message : "Unable to save definition.";
      setMessage({ ok: false, text: description });
      toast({ title: "Definition failed", description, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function submitDecision() {
    if (!decision) return;
    setSaving(true);
    try {
      const updated = decision.mode === "approve"
        ? await approveApprovalStep(auth.accessToken, decision.approval.id, decision.step.id, decisionComment)
        : await rejectApprovalStep(auth.accessToken, decision.approval.id, decision.step.id, decisionComment);
      replaceApproval(updated);
      setDecision(null);
      setDecisionComment("");
      toast({
        title: decision.mode === "approve" ? "Approval step approved" : "Approval step rejected",
        description: updated.status === "PENDING" ? "The request moved to the next pending step." : `Request is now ${statusLabel(updated.status)}.`,
        variant: decision.mode === "approve" ? "success" : "warning",
      });
      await load();
    } catch (caught) {
      toast({ title: "Decision failed", description: caught instanceof Error ? caught.message : "Unable to submit decision.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function archiveOrRestoreDefinition(definition: ApprovalDefinition) {
    const action = definition.archivedAt ? "restore" : "archive";
    const confirmed = await confirm({
      title: action === "archive" ? "Archive approval definition?" : "Restore approval definition?",
      description: action === "archive" ? "Existing approval requests stay intact. New requests cannot use this definition until restored." : "The definition will become available again.",
      confirmLabel: action === "archive" ? "Archive" : "Restore",
      tone: action === "archive" ? "danger" : undefined,
    });
    if (!confirmed) return;
    try {
      const updated = action === "archive"
        ? await archiveApprovalDefinition(auth.accessToken, definition.id)
        : await restoreApprovalDefinition(auth.accessToken, definition.id);
      setDefinitions((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast({ title: action === "archive" ? "Definition archived" : "Definition restored", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Definition update failed", description: caught instanceof Error ? caught.message : "Unable to update definition.", variant: "error" });
    }
  }

  async function cancelRequest(approval: Approval) {
    const confirmed = await confirm({
      title: "Cancel approval request?",
      description: "Pending steps will be cancelled and reviewers can no longer approve this request.",
      confirmLabel: "Cancel approval",
      tone: "danger",
    });
    if (!confirmed) return;
    try {
      const updated = await cancelApproval(auth.accessToken, approval.id);
      replaceApproval(updated);
      toast({ title: "Approval cancelled", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Cancel failed", description: caught instanceof Error ? caught.message : "Unable to cancel approval.", variant: "error" });
    }
  }

  async function reopenRequest(approval: Approval) {
    const confirmed = await confirm({
      title: "Reopen approval request?",
      description: "All steps will be reset to pending and reviewers will need to decide again.",
      confirmLabel: "Reopen",
    });
    if (!confirmed) return;
    try {
      const updated = await reopenApproval(auth.accessToken, approval.id);
      replaceApproval(updated);
      toast({ title: "Approval reopened", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Reopen failed", description: caught instanceof Error ? caught.message : "Unable to reopen approval.", variant: "error" });
    }
  }

  function replaceApproval(updated: Approval) {
    setAllApprovals((current) => current.map((item) => item.id === updated.id ? updated : item));
    setPendingApprovals((current) => current.map((item) => item.id === updated.id ? updated : item).filter((item) => item.status === "PENDING" && item.steps.some((step) => isMyPendingStep(step, user.id))));
    setDetail((current) => current?.id === updated.id ? updated : current);
  }

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-[28px] border border-line bg-[#111111] text-white shadow-[0_24px_70px_rgba(17,17,17,0.14)]">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Approvals</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Approval Center</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-white/58">
              Review requests, route approvals, manage definitions, and keep workflow decisions auditable.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-black text-white transition hover:bg-white/12"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={openApprovalComposer}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-[#111111] shadow-[0_18px_40px_rgba(255,212,0,0.28)] transition hover:bg-[#ffe04d]"
            >
              <Plus className="size-4" aria-hidden="true" />
              New request
            </button>
          </div>
        </div>
        <div className="grid border-t border-white/10 bg-white/[0.04] md:grid-cols-4">
          <HeroMetric label="Waiting on you" value={pendingCount} />
          <HeroMetric label="Waiting on others" value={waitingForOthers} />
          <HeroMetric label="Active definitions" value={activeDefinitions} />
          <HeroMetric label="Closed / blocked" value={blockedCount} />
        </div>
      </header>

      {message ? (
        <div className={cn("rounded-2xl border px-4 py-3 text-sm font-bold", message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800")}>
          {message.text}
        </div>
      ) : null}

      <section className="rounded-[24px] border border-line bg-panel p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>Pending</TabButton>
            <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>All approvals</TabButton>
            <TabButton active={activeTab === "definitions"} onClick={() => setActiveTab("definitions")}>Definitions</TabButton>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative min-w-0 sm:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, entity, reference..."
                className="h-11 w-full rounded-2xl border border-line bg-panel-muted pl-9 pr-3 text-sm font-bold outline-none transition focus:border-primary"
              />
            </label>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as ApprovalStatus | "ALL")}
              className="h-11 rounded-2xl border border-line bg-panel px-3 text-sm font-black outline-none focus:border-primary"
            >
              <option value="ALL">All statuses</option>
              {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-line bg-panel">
          <Loader2 className="size-5 animate-spin text-ink-soft" aria-hidden="true" />
          <span className="ml-2 text-sm font-bold text-ink-soft">Loading approvals...</span>
        </div>
      ) : error ? (
        <EmptyState title="Approval Center unavailable" description={error} />
      ) : activeTab === "definitions" ? (
        <DefinitionsPanel
          canManage={canManageApprovals}
          definitions={definitions}
          onArchiveRestore={(definition) => void archiveOrRestoreDefinition(definition)}
          onCreate={() => openDefinitionComposer()}
          onEdit={openDefinitionComposer}
          users={users}
        />
      ) : (
        <ApprovalsPanel
          approvals={activeTab === "pending" ? pendingApprovals : visibleApprovals}
          canManage={canManageApprovals}
          currentUserId={user.id}
          onCancel={(approval) => void cancelRequest(approval)}
          onDecision={(approval, step, mode) => {
            setDecision({ approval, mode, step });
            setDecisionComment("");
          }}
          onOpen={setDetail}
          onReopen={(approval) => void reopenRequest(approval)}
          users={users}
        />
      )}

      {showApprovalComposer ? (
        <ModalFrame onClose={() => setShowApprovalComposer(false)} title="New approval request" eyebrow="Routing">
          <form onSubmit={(event) => void submitApproval(event)} className="space-y-4">
            <Field label="Title">
              <input required value={approvalForm.title} onChange={(event) => setApprovalForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} placeholder="Budget increase approval" />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Entity type">
                <select value={approvalForm.entityType} onChange={(event) => setApprovalForm((current) => ({ ...current, entityType: event.target.value }))} className={inputClass}>
                  {entityTypes.map((entity) => <option key={entity} value={entity}>{entityLabel(entity)}</option>)}
                </select>
              </Field>
              <Field label="Entity ID / reference">
                <input required value={approvalForm.entityId} onChange={(event) => setApprovalForm((current) => ({ ...current, entityId: event.target.value }))} className={inputClass} placeholder="Project, task, or document id" />
              </Field>
            </div>
            <Field label="Definition">
              <select value={approvalForm.definitionId} onChange={(event) => setApprovalForm((current) => ({ ...current, definitionId: event.target.value }))} className={inputClass}>
                <option value="">Direct approver for this request</option>
                {definitions.filter((definition) => definition.isActive && !definition.archivedAt).map((definition) => (
                  <option key={definition.id} value={definition.id}>{definition.name} - {entityLabel(definition.entityType)}</option>
                ))}
              </select>
            </Field>
            {!approvalForm.definitionId ? (
              <div className="rounded-2xl border border-line bg-panel-muted p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-ink-soft">Direct approval step</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Field label="Step title">
                    <input value={approvalForm.stepTitle} onChange={(event) => setApprovalForm((current) => ({ ...current, stepTitle: event.target.value }))} className={inputClass} placeholder="Review request" />
                  </Field>
                  <Field label="Approver">
                    <select value={approvalForm.stepApproverId} onChange={(event) => setApprovalForm((current) => ({ ...current, stepApproverId: event.target.value, stepApproverRole: "" }))} className={inputClass}>
                      <option value="">Select reviewer</option>
                      {users.map((tenantUser) => <option key={tenantUser.id} value={tenantUser.id}>{displayUser(tenantUser)}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Due date">
                <input type="date" value={approvalForm.dueDate} onChange={(event) => setApprovalForm((current) => ({ ...current, dueDate: event.target.value }))} className={inputClass} />
              </Field>
              <Field label="Description">
                <input value={approvalForm.description} onChange={(event) => setApprovalForm((current) => ({ ...current, description: event.target.value }))} className={inputClass} placeholder="Decision context" />
              </Field>
            </div>
            <ModalActions saving={saving} submitLabel="Create request" onCancel={() => setShowApprovalComposer(false)} />
          </form>
        </ModalFrame>
      ) : null}

      {showDefinitionComposer ? (
        <ModalFrame onClose={() => setShowDefinitionComposer(false)} title={definitionForm.id ? "Edit definition" : "New definition"} eyebrow="Reusable routing">
          <form onSubmit={(event) => void submitDefinition(event)} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Definition name">
                <input required value={definitionForm.name} onChange={(event) => setDefinitionForm((current) => ({ ...current, name: event.target.value }))} className={inputClass} placeholder="Project budget approval" />
              </Field>
              <Field label="Entity type">
                <select value={definitionForm.entityType} onChange={(event) => setDefinitionForm((current) => ({ ...current, entityType: event.target.value }))} className={inputClass}>
                  {entityTypes.map((entity) => <option key={entity} value={entity}>{entityLabel(entity)}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea value={definitionForm.description} onChange={(event) => setDefinitionForm((current) => ({ ...current, description: event.target.value }))} className={`${textareaClass} min-h-[88px] resize-y`} placeholder="When this route should be used." />
            </Field>
            <label className="inline-flex items-center gap-2 text-sm font-black text-foreground">
              <input checked={definitionForm.isActive} onChange={(event) => setDefinitionForm((current) => ({ ...current, isActive: event.target.checked }))} type="checkbox" className="size-4 rounded border-line text-primary" />
              Active for new requests
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-ink-soft">Approval steps</p>
                <button
                  type="button"
                  onClick={() => setDefinitionForm((current) => ({ ...current, steps: [...current.steps, emptyDraftStep()] }))}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary/20 px-3 py-2 text-xs font-black text-[#111111]"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add step
                </button>
              </div>
              {definitionForm.steps.map((step, index) => (
                <div key={index} className="rounded-2xl border border-line bg-panel-muted p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-black text-foreground">Step {index + 1}</p>
                    {definitionForm.steps.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setDefinitionForm((current) => ({ ...current, steps: current.steps.filter((_, i) => i !== index) }))}
                        className="text-xs font-black text-danger"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Title">
                      <input value={step.title} onChange={(event) => updateDraftStep(setDefinitionForm, index, { title: event.target.value })} className={inputClass} />
                    </Field>
                    <Field label="Approver">
                      <select value={step.approverId} onChange={(event) => updateDraftStep(setDefinitionForm, index, { approverId: event.target.value, approverRole: "" })} className={inputClass}>
                        <option value="">Select reviewer</option>
                        {users.map((tenantUser) => <option key={tenantUser.id} value={tenantUser.id}>{displayUser(tenantUser)}</option>)}
                      </select>
                    </Field>
                    <Field label="Approver role fallback">
                      <input value={step.approverRole} onChange={(event) => updateDraftStep(setDefinitionForm, index, { approverRole: event.target.value, approverId: "" })} className={inputClass} placeholder="Owner, Project Manager..." />
                    </Field>
                    <Field label="Escalation hours">
                      <input type="number" min={1} max={8760} value={step.escalationHours} onChange={(event) => updateDraftStep(setDefinitionForm, index, { escalationHours: event.target.value })} className={inputClass} placeholder="Optional" />
                    </Field>
                  </div>
                  <label className="mt-3 inline-flex items-center gap-2 text-xs font-black text-ink-soft">
                    <input checked={step.required} onChange={(event) => updateDraftStep(setDefinitionForm, index, { required: event.target.checked })} type="checkbox" className="size-4 rounded border-line" />
                    Required step
                  </label>
                </div>
              ))}
            </div>
            <ModalActions saving={saving} submitLabel={definitionForm.id ? "Save definition" : "Create definition"} onCancel={() => setShowDefinitionComposer(false)} />
          </form>
        </ModalFrame>
      ) : null}

      {decision ? (
        <ModalFrame onClose={() => setDecision(null)} title={decision.mode === "approve" ? "Approve step" : "Reject step"} eyebrow={decision.approval.title}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-panel-muted p-4">
              <p className="text-sm font-black text-foreground">{decision.step.title ?? `Step ${decision.step.stepOrder}`}</p>
              <p className="mt-1 text-xs font-semibold text-ink-soft">Your comment will be stored in approval history.</p>
            </div>
            <Field label="Decision comment">
              <textarea value={decisionComment} onChange={(event) => setDecisionComment(event.target.value)} className={`${textareaClass} min-h-[110px] resize-y`} placeholder="Reason, context, or conditions." />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDecision(null)} className="h-11 rounded-2xl border border-line px-5 text-sm font-black text-foreground">Cancel</button>
              <button
                type="button"
                onClick={() => void submitDecision()}
                disabled={saving}
                className={cn("inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-black text-white disabled:opacity-60", decision.mode === "approve" ? "bg-emerald-600" : "bg-danger")}
              >
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : decision.mode === "approve" ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <XCircle className="size-4" aria-hidden="true" />}
                {decision.mode === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </ModalFrame>
      ) : null}

      {detail ? (
        <ModalFrame onClose={() => setDetail(null)} title={detail.title} eyebrow={`${entityLabel(detail.entityType)} - ${detail.entityId}`}>
          <ApprovalDetail approval={detail} currentUserId={user.id} onCancel={() => void cancelRequest(detail)} onDecision={(step, mode) => setDecision({ approval: detail, mode, step })} onReopen={() => void reopenRequest(detail)} users={users} canManage={canManageApprovals} />
        </ModalFrame>
      ) : null}
    </div>
  );
}

function ApprovalsPanel({
  approvals,
  canManage,
  currentUserId,
  onCancel,
  onDecision,
  onOpen,
  onReopen,
  users,
}: {
  approvals: Approval[];
  canManage: boolean;
  currentUserId: string;
  onCancel: (approval: Approval) => void;
  onDecision: (approval: Approval, step: ApprovalStep, mode: DecisionMode) => void;
  onOpen: (approval: Approval) => void;
  onReopen: (approval: Approval) => void;
  users: TenantUser[];
}) {
  if (!approvals.length) {
    return <EmptyState title="No approvals found" description="Approval requests matching this view will appear here." />;
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {approvals.map((approval) => {
        const myStep = approval.steps.find((step) => isMyPendingStep(step, currentUserId));
        return (
          <article key={approval.id} className="rounded-[24px] border border-line bg-panel p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={approval.status} />
                  <span className="rounded-full bg-panel-muted px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-ink-soft">{entityLabel(approval.entityType)}</span>
                </div>
                <h2 className="mt-3 line-clamp-2 text-lg font-black text-foreground">{approval.title}</h2>
                <p className="mt-1 text-xs font-bold text-ink-soft">
                  {approval.entityId} - requested {formatDate(approval.createdAt)}
                </p>
              </div>
              <button onClick={() => onOpen(approval)} className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-panel-muted text-foreground transition hover:bg-primary">
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
            {approval.description ? <p className="mt-3 line-clamp-2 text-sm font-semibold text-ink-soft">{approval.description}</p> : null}
            <StepTimeline approval={approval} users={users} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-soft">
                {approval.steps.filter((step) => step.status === "APPROVED").length}/{approval.steps.length} steps complete
              </div>
              <div className="flex flex-wrap gap-2">
                {myStep ? (
                  <>
                    <button onClick={() => onDecision(approval, myStep, "reject")} className="h-9 rounded-xl border border-red-200 px-3 text-xs font-black text-danger">Reject</button>
                    <button onClick={() => onDecision(approval, myStep, "approve")} className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white">Approve</button>
                  </>
                ) : null}
                {approval.status === "PENDING" ? (
                  <button onClick={() => onCancel(approval)} className="h-9 rounded-xl border border-line px-3 text-xs font-black text-foreground">Cancel</button>
                ) : canManage ? (
                  <button onClick={() => onReopen(approval)} className="h-9 rounded-xl border border-line px-3 text-xs font-black text-foreground">Reopen</button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function DefinitionsPanel({
  canManage,
  definitions,
  onArchiveRestore,
  onCreate,
  onEdit,
  users,
}: {
  canManage: boolean;
  definitions: ApprovalDefinition[];
  onArchiveRestore: (definition: ApprovalDefinition) => void;
  onCreate: () => void;
  onEdit: (definition: ApprovalDefinition) => void;
  users: TenantUser[];
}) {
  return (
    <section className="rounded-[24px] border border-line bg-panel p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary-dark">Definitions</p>
          <h2 className="mt-1 text-xl font-black text-foreground">Reusable approval routes</h2>
        </div>
        <button
          type="button"
          disabled={!canManage}
          onClick={onCreate}
          className="inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden="true" />
          New definition
        </button>
      </div>
      {!definitions.length ? (
        <EmptyState title="No approval definitions" description="Create reusable routing for budget, sprint, document, or project approvals." />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {definitions.map((definition) => (
            <article key={definition.id} className={cn("rounded-[22px] border p-4", definition.archivedAt ? "border-dashed border-line bg-panel-muted opacity-75" : "border-line bg-white")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em]", definition.isActive && !definition.archivedAt ? "bg-emerald-50 text-emerald-700" : "bg-panel-muted text-ink-soft")}>
                      {definition.archivedAt ? "Archived" : definition.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="rounded-full bg-primary/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#111111]">{entityLabel(definition.entityType)}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-foreground">{definition.name}</h3>
                  {definition.description ? <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink-soft">{definition.description}</p> : null}
                </div>
                <div className="flex gap-1">
                  <button disabled={!canManage} onClick={() => onEdit(definition)} className="rounded-xl border border-line px-3 py-2 text-xs font-black text-foreground disabled:opacity-50">Edit</button>
                  <button disabled={!canManage} onClick={() => onArchiveRestore(definition)} className="flex size-9 items-center justify-center rounded-xl border border-line text-ink-soft disabled:opacity-50">
                    {definition.archivedAt ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {definition.steps.map((step) => (
                  <div key={step.id ?? step.stepOrder} className="flex items-center gap-3 rounded-2xl bg-panel-muted p-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-foreground">{step.stepOrder}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-foreground">{step.title}</p>
                      <p className="truncate text-xs font-semibold text-ink-soft">{step.approverId ? userName(users, step.approverId) : step.approverRole ? `Role: ${step.approverRole}` : "No approver"}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">{step.required ? "Required" : "Optional"}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ApprovalDetail({
  approval,
  canManage,
  currentUserId,
  onCancel,
  onDecision,
  onReopen,
  users,
}: {
  approval: Approval;
  canManage: boolean;
  currentUserId: string;
  onCancel: () => void;
  onDecision: (step: ApprovalStep, mode: DecisionMode) => void;
  onReopen: () => void;
  users: TenantUser[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Status" value={statusLabel(approval.status)} />
        <MiniMetric label="Current step" value={approval.currentStep} />
        <MiniMetric label="Due" value={approval.dueDate ? formatDate(approval.dueDate) : "No date"} />
      </div>
      {approval.description ? <p className="rounded-2xl border border-line bg-panel-muted p-4 text-sm font-semibold leading-relaxed text-ink-soft">{approval.description}</p> : null}
      <div className="space-y-3">
        {approval.steps.map((step) => {
          const assignedToMe = isMyPendingStep(step, currentUserId);
          return (
            <div key={step.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={step.status} />
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-ink-soft">Step {step.stepOrder}</span>
                  </div>
                  <h3 className="mt-2 text-base font-black text-foreground">{step.title ?? "Approval step"}</h3>
                  <p className="mt-1 text-xs font-semibold text-ink-soft">
                    Approver: {userName(users, step.approverId)} {step.dueDate ? `- Due ${formatDate(step.dueDate)}` : ""}
                  </p>
                </div>
                {assignedToMe ? (
                  <div className="flex gap-2">
                    <button onClick={() => onDecision(step, "reject")} className="h-9 rounded-xl border border-red-200 px-3 text-xs font-black text-danger">Reject</button>
                    <button onClick={() => onDecision(step, "approve")} className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white">Approve</button>
                  </div>
                ) : null}
              </div>
              {step.comments ? (
                <div className="mt-3 rounded-xl bg-panel-muted p-3 text-sm font-semibold text-ink-soft">
                  {step.comments}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        {approval.status === "PENDING" ? (
          <button onClick={onCancel} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-red-200 px-4 text-sm font-black text-danger">
            <Ban className="size-4" aria-hidden="true" />
            Cancel request
          </button>
        ) : canManage ? (
          <button onClick={onReopen} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-line px-4 text-sm font-black text-foreground">
            <RotateCcw className="size-4" aria-hidden="true" />
            Reopen request
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StepTimeline({ approval, users }: { approval: Approval; users: TenantUser[] }) {
  return (
    <div className="mt-4 grid gap-2">
      {approval.steps.slice(0, 3).map((step) => (
        <div key={step.id} className="flex items-center gap-2 text-xs">
          <StepDot status={step.status} />
          <span className="min-w-0 flex-1 truncate font-bold text-foreground">{step.title ?? `Step ${step.stepOrder}`}</span>
          <span className="truncate font-semibold text-ink-soft">{userName(users, step.approverId)}</span>
        </div>
      ))}
      {approval.steps.length > 3 ? <p className="text-xs font-bold text-ink-soft">+{approval.steps.length - 3} more steps</p> : null}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-white/10 px-5 py-4 md:border-r last:md:border-r-0">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">{label}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-panel-muted p-4">
      <p className="text-lg font-black text-foreground">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">{label}</p>
    </div>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("h-10 rounded-2xl px-4 text-sm font-black transition", active ? "bg-[#111111] text-primary" : "bg-panel-muted text-ink-soft hover:text-foreground")}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const Icon = status === "APPROVED" ? CheckCircle2 : status === "REJECTED" ? XCircle : status === "CANCELLED" ? Ban : Clock3;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em]", statusTone(status))}>
      <Icon className="size-3.5" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}

function StepDot({ status }: { status: ApprovalStatus }) {
  return <span className={cn("size-2.5 shrink-0 rounded-full", status === "APPROVED" ? "bg-emerald-500" : status === "REJECTED" ? "bg-red-500" : status === "CANCELLED" ? "bg-slate-400" : "bg-amber-400")} />;
}

function ModalFrame({ children, eyebrow, onClose, title }: { children: ReactNode; eyebrow: string; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#111111]/45 px-4 py-6">
      <section className="max-h-[calc(100dvh-3rem)] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-line bg-panel shadow-[0_30px_90px_rgba(17,17,17,0.22)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-panel/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary-dark">{eyebrow}</p>
            <h2 className="mt-1 text-2xl font-black text-foreground">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-panel-muted text-foreground transition hover:bg-primary">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}

function ModalActions({ onCancel, saving, submitLabel }: { onCancel: () => void; saving: boolean; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2 border-t border-line pt-4">
      <button type="button" onClick={onCancel} className="h-11 rounded-2xl border border-line px-5 text-sm font-black text-foreground">Cancel</button>
      <button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-[#111111] shadow-[0_14px_30px_rgba(255,212,0,0.24)] disabled:opacity-60">
        {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
        {submitLabel}
      </button>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <section className="rounded-[24px] border border-line bg-panel p-8 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/20 text-[#111111]">
        <ClipboardCheck className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-xl font-black text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-ink-soft">{description}</p>
    </section>
  );
}

function buildApprovalSteps(form: ApprovalForm): ApprovalStepInput[] {
  if (!form.stepApproverId && !form.stepApproverRole) return [];
  return [{
    approverId: form.stepApproverId || undefined,
    approverRole: form.stepApproverRole || undefined,
    required: true,
    stepOrder: 1,
    title: form.stepTitle.trim() || "Review request",
  }];
}

function buildDefinitionSteps(steps: DraftStep[]): ApprovalStepInput[] {
  return steps
    .map((step, index) => ({
      approverId: step.approverId || undefined,
      approverRole: step.approverRole.trim() || undefined,
      escalationHours: step.escalationHours ? Number(step.escalationHours) : undefined,
      required: step.required,
      stepOrder: index + 1,
      title: step.title.trim() || `Step ${index + 1}`,
    }))
    .filter((step) => step.approverId || step.approverRole);
}

function updateDraftStep(
  setDefinitionForm: Dispatch<SetStateAction<DefinitionForm>>,
  index: number,
  patch: Partial<DraftStep>,
) {
  setDefinitionForm((current) => ({
    ...current,
    steps: current.steps.map((step, stepIndex) => stepIndex === index ? { ...step, ...patch } : step),
  }));
}

function isMyPendingStep(step: ApprovalStep, userId: string) {
  return step.approverId === userId && step.status === "PENDING";
}

function statusLabel(status: ApprovalStatus) {
  return status.toLowerCase().replace(/_/g, " ");
}

function statusTone(status: ApprovalStatus) {
  if (status === "APPROVED") return "bg-emerald-50 text-emerald-700";
  if (status === "REJECTED") return "bg-red-50 text-red-700";
  if (status === "CANCELLED") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-700";
}

function entityLabel(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

function formatDate(value: string) {
  try {
    return formatShortDate(value);
  } catch {
    return value.slice(0, 10);
  }
}

function displayUser(user: TenantUser) {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name ? `${name} (${user.email})` : user.email;
}

function userName(users: TenantUser[], userId: string) {
  const user = users.find((item) => item.id === userId);
  return user ? displayUser(user) : userId;
}
