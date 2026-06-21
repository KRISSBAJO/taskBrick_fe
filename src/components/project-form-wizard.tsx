"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FolderPlus,
  Landmark,
  Loader2,
  Pencil,
  Save,
  ShieldCheck,
  Target,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  createProject,
  createProjectBudget,
  createProjectDependency,
  createProjectMilestone,
  createProjectRisk,
  createProjectStakeholder,
  getProject,
  getTenantEntitlements,
  listTeams,
  listWorkspaces,
  updateProject,
  type BillingEntitlementFeature,
  type Project,
  type ProjectDependencyStatus,
  type ProjectStakeholderInfluence,
  type ProjectStatus,
  type TaskPriority,
  type Team,
  type Visibility,
  type Workspace,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { canCreateProjects, canEditProjectFinance, hasProjectAction } from "@/lib/project-permissions";
import { priorityLabels, projectStatusLabels } from "@/lib/workspace-ui";

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardStep = "scope" | "delivery" | "commercial" | "governance" | "review";

type ProjectFormState = {
  workspaceId: string;
  teamId: string;
  key: string;
  name: string;
  description: string;
  status: ProjectStatus;
  visibility: Visibility;
  startDate: string;
  dueDate: string;
  milestoneTitle: string;
  milestoneDueDate: string;
  riskTitle: string;
  riskSeverity: TaskPriority;
  riskMitigation: string;
  currency: string;
  contractValue: string;
  budgetPlanned: string;
  budgetActual: string;
  budgetNotes: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  locationName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timezone: string;
  billingCode: string;
  costCenter: string;
  stakeholderName: string;
  stakeholderEmail: string;
  stakeholderRole: string;
  stakeholderOrganization: string;
  stakeholderInfluence: ProjectStakeholderInfluence;
  stakeholderExternal: boolean;
  dependencyTitle: string;
  dependencyType: string;
  dependencyStatus: ProjectDependencyStatus;
  dependencyOwnerName: string;
  dependencyOwnerEmail: string;
  dependencyDueDate: string;
  dependencyUrl: string;
};

type UpdateForm = <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => void;

// ─── Constants ───────────────────────────────────────────────────────────────

const steps: Array<{ id: WizardStep; title: string; subtitle: string; Icon: LucideIcon }> = [
  { id: "scope", title: "Basics", subtitle: "Name and workspace", Icon: FolderPlus },
  { id: "delivery", title: "Timeline", subtitle: "Dates and early signals", Icon: Target },
  { id: "commercial", title: "Finance", subtitle: "Budget and client", Icon: CircleDollarSign },
  { id: "governance", title: "People", subtitle: "Owners and blockers", Icon: ShieldCheck },
  { id: "review", title: "Review", subtitle: "Ready to create", Icon: ClipboardCheck },
];

const projectCurrencyOptions = ["USD", "NGN", "GBP", "EUR", "CAD", "AUD", "ZAR", "GHS", "KES"];
const timezoneOptions = [
  "America/Chicago",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Asia/Dubai",
  "Asia/Singapore",
  "UTC",
];
const visibilityOptions: Visibility[] = ["PRIVATE", "TEAM", "WORKSPACE", "ORGANIZATION", "PUBLIC"];
const statusOptions: ProjectStatus[] = ["PLANNING", "ACTIVE", "ON_HOLD"];
const riskSeverityOptions: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"];
const stakeholderInfluenceOptions: ProjectStakeholderInfluence[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const dependencyStatusOptions: ProjectDependencyStatus[] = ["OPEN", "BLOCKED", "RESOLVED", "CANCELLED"];

const initialState: ProjectFormState = {
  workspaceId: "",
  teamId: "",
  key: "",
  name: "",
  description: "",
  status: "PLANNING",
  visibility: "TEAM",
  startDate: "",
  dueDate: "",
  milestoneTitle: "",
  milestoneDueDate: "",
  riskTitle: "",
  riskSeverity: "HIGH",
  riskMitigation: "",
  currency: "USD",
  contractValue: "",
  budgetPlanned: "",
  budgetActual: "",
  budgetNotes: "",
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  locationName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  timezone: "America/Chicago",
  billingCode: "",
  costCenter: "",
  stakeholderName: "",
  stakeholderEmail: "",
  stakeholderRole: "",
  stakeholderOrganization: "",
  stakeholderInfluence: "HIGH",
  stakeholderExternal: true,
  dependencyTitle: "",
  dependencyType: "",
  dependencyStatus: "OPEN",
  dependencyOwnerName: "",
  dependencyOwnerEmail: "",
  dependencyDueDate: "",
  dependencyUrl: "",
};

// ─── Setup checklist scoring ──────────────────────────────────────────────────

// ─── Shared form wizard ───────────────────────────────────────────────────────

export function ProjectFormWizard({
  mode = "create",
  projectId,
}: {
  mode?: "create" | "edit";
  projectId?: string;
}) {
  const router = useRouter();
  const { auth } = useWorkspaceAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<ProjectFormState>(initialState);
  const [activeStep, setActiveStep] = useState<WizardStep>("scope");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingProject, setLoadingProject] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projectEntitlement, setProjectEntitlement] = useState<BillingEntitlementFeature | null>(null);
  const [activeProjectCount, setActiveProjectCount] = useState(0);
  const [loadedProject, setLoadedProject] = useState<Project | null>(null);

  const activeStepIndex = steps.findIndex((s) => s.id === activeStep);
  const availableTeams = useMemo(
    () => teams.filter((t) => !t.workspaceId || !form.workspaceId || t.workspaceId === form.workspaceId),
    [form.workspaceId, teams],
  );

  const projectLimit = projectEntitlement?.limit;
  const roleDisabledReason =
    mode === "create" && !canCreateProjects(auth.user)
      ? "Your workspace role cannot create projects."
      : mode === "edit" && loadedProject && !hasProjectAction(loadedProject, "editProject")
        ? "Your project role cannot edit this project."
        : "";
  const disabledReason =
    roleDisabledReason ||
    (mode === "create" && projectEntitlement && projectLimit !== null && projectLimit !== undefined && activeProjectCount >= projectLimit
      ? `Your current plan includes ${projectLimit} active projects. Upgrade billing to create more.`
      : mode === "create" && projectEntitlement && (!projectEntitlement.enabled || !projectEntitlement.allowed)
        ? "Project creation is not included in the current plan."
        : "");

  const selectedWorkspace = workspaces.find((w) => w.id === form.workspaceId);
  const selectedTeam = teams.find((t) => t.id === form.teamId);
  const canEditCommercial = mode === "create" || canEditProjectFinance(loadedProject);
  const canContinue = isStepValid(activeStep, form);
  // Load workspaces/teams/entitlements
  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [workspacePage, teamPage, entitlements] = await Promise.all([
        listWorkspaces(auth.accessToken, { limit: 100 }),
        listTeams(auth.accessToken, { limit: 100 }),
        getTenantEntitlements(auth.accessToken).catch(() => null),
      ]);
      setWorkspaces(workspacePage.data);
      setTeams(teamPage.data);
      setProjectEntitlement(entitlements?.features.find((f) => f.key === "projects.limit") ?? null);
      setActiveProjectCount(entitlements?.features.find((f) => f.key === "projects.limit")?.used ?? 0);
      if (mode === "create") {
        setForm((cur) => ({
          ...cur,
          workspaceId: cur.workspaceId || workspacePage.data[0]?.id || "",
        }));
      }
    } catch (caught) {
      toast({ title: "Setup unavailable", description: messageFrom(caught), variant: "error" });
    } finally {
      setLoadingOptions(false);
    }
  }, [auth.accessToken, mode, toast]);

  // Load project for edit mode
  const loadProjectData = useCallback(async () => {
    if (mode !== "edit" || !projectId) return;
    setLoadingProject(true);
    try {
      const project = await getProject(auth.accessToken, projectId);
      setLoadedProject(project);
      setForm((cur) => ({
        ...cur,
        workspaceId: project.workspaceId ?? "",
        teamId: project.teamId ?? "",
        key: project.key,
        name: project.name,
        description: project.description ?? "",
        status: project.status,
        visibility: (project.visibility as Visibility) ?? "TEAM",
        startDate: project.startDate ? project.startDate.slice(0, 10) : "",
        dueDate: project.dueDate ? project.dueDate.slice(0, 10) : "",
        currency: project.currency ?? "USD",
        contractValue: project.contractValue != null ? String(project.contractValue) : "",
        clientName: project.clientName ?? "",
        clientEmail: project.clientEmail ?? "",
        clientPhone: project.clientPhone ?? "",
        locationName: project.locationName ?? "",
        addressLine1: project.addressLine1 ?? "",
        addressLine2: project.addressLine2 ?? "",
        city: project.city ?? "",
        state: project.state ?? "",
        country: project.country ?? "",
        postalCode: project.postalCode ?? "",
        timezone: project.timezone ?? "America/Chicago",
        billingCode: project.billingCode ?? "",
        costCenter: project.costCenter ?? "",
      }));
    } catch (caught) {
      toast({ title: "Failed to load project", description: messageFrom(caught), variant: "error" });
    } finally {
      setLoadingProject(false);
    }
  }, [auth.accessToken, mode, projectId, toast]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadOptions(), 0);
    return () => window.clearTimeout(t);
  }, [loadOptions]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadProjectData(), 0);
    return () => window.clearTimeout(t);
  }, [loadProjectData]);

  function update<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    setForm((cur) => {
      const next = { ...cur, [key]: value };
      if (key === "workspaceId") next.teamId = "";
      return next;
    });
  }

  function handleNameChange(value: string) {
    setForm((cur) => ({
      ...cur,
      name: value,
      key: cur.key || buildProjectKey(value),
    }));
  }

  function goNext() {
    if (!canContinue) {
      toast({
        title: "Complete required fields",
        description: "Project name, key, and workspace are required before continuing.",
        variant: "warning",
      });
      return;
    }
    setActiveStep(steps[Math.min(activeStepIndex + 1, steps.length - 1)].id);
  }

  function goBack() {
    setActiveStep(steps[Math.max(activeStepIndex - 1, 0)].id);
  }

  async function submitProject() {
    if (mode === "create" && disabledReason) {
      toast({ title: "Project limit reached", description: disabledReason, variant: "error" });
      return;
    }
    if (!isStepValid("scope", form)) {
      setActiveStep("scope");
      toast({ title: "Missing project basics", description: "Workspace, key, and project name are required.", variant: "warning" });
      return;
    }

    setSaving(true);
    try {
      if (mode === "edit" && projectId) {
        const payload: Parameters<typeof updateProject>[2] = {
          workspaceId: form.workspaceId || undefined,
          teamId: optionalString(form.teamId),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          status: form.status,
        };

        if (canEditCommercial) {
          Object.assign(payload, {
            currency: form.currency,
            contractValue: optionalNumber(form.contractValue),
            clientName: optionalString(form.clientName),
            clientEmail: optionalString(form.clientEmail),
            clientPhone: optionalString(form.clientPhone),
            locationName: optionalString(form.locationName),
            addressLine1: optionalString(form.addressLine1),
            addressLine2: optionalString(form.addressLine2),
            city: optionalString(form.city),
            state: optionalString(form.state),
            country: optionalString(form.country),
            postalCode: optionalString(form.postalCode),
            timezone: optionalString(form.timezone),
            billingCode: optionalString(form.billingCode),
            costCenter: optionalString(form.costCenter),
          });
        }

        await updateProject(auth.accessToken, projectId, payload);
        toast({ title: "Project saved", description: `${form.name} has been updated.`, variant: "success" });
        router.push(`/projects/${projectId}`);
      } else {
        const project = await createProject(auth.accessToken, {
          workspaceId: form.workspaceId,
          teamId: optionalString(form.teamId),
          key: form.key.trim().toUpperCase(),
          name: form.name.trim(),
          description: form.description.trim(),
          status: form.status,
          visibility: form.visibility,
          startDate: toNoonIso(form.startDate),
          dueDate: toNoonIso(form.dueDate),
          progress: form.status === "ACTIVE" ? 5 : 0,
          currency: form.currency,
          contractValue: optionalNumber(form.contractValue),
          clientName: optionalString(form.clientName),
          clientEmail: optionalString(form.clientEmail),
          clientPhone: optionalString(form.clientPhone),
          locationName: optionalString(form.locationName),
          addressLine1: optionalString(form.addressLine1),
          addressLine2: optionalString(form.addressLine2),
          city: optionalString(form.city),
          state: optionalString(form.state),
          country: optionalString(form.country),
          postalCode: optionalString(form.postalCode),
          timezone: optionalString(form.timezone),
          billingCode: optionalString(form.billingCode),
          costCenter: optionalString(form.costCenter),
        });

        const seeded = await seedProjectRecords(auth.accessToken, project, form);
        const failed = seeded.filter((r) => r.status === "rejected").length;

        toast({
          title: "Project created",
          description: failed
            ? `${project.name} was created. ${failed} optional record${failed === 1 ? "" : "s"} could not be seeded.`
            : `${project.name} is ready. Opening project room…`,
          variant: failed ? "warning" : "success",
        });
        router.push(`/projects/${project.id}`);
      }
    } catch (caught) {
      toast({
        title: mode === "edit" ? "Save failed" : "Project creation failed",
        description: messageFrom(caught),
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  const isLoading = loadingOptions || loadingProject;

  return (
    <div className="mx-auto max-w-6xl space-y-4 tb-reveal">

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-line bg-panel px-5 py-4 shadow-sm">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={mode === "edit" && projectId ? `/projects/${projectId}` : "/projects"}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft transition hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              {mode === "edit" ? "Back to project" : "Projects"}
            </Link>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
                {mode === "edit"
                  ? <Pencil className="size-5 text-[#111111]" aria-hidden="true" />
                  : <FolderPlus className="size-5 text-[#111111]" aria-hidden="true" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  {form.key && (
                    <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-black text-[#111111]">
                      {form.key}
                    </span>
                  )}
                  <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                    {form.name || (mode === "edit" ? "Edit project" : "Create project")}
                  </h1>
                </div>
                <p className="mt-1 text-sm font-medium text-ink-soft">
                  {form.description
                    ? <span className="line-clamp-1">{form.description}</span>
                    : mode === "edit"
                      ? "Update the project essentials."
                      : "Start with the essentials. Add deeper records later."}
                </p>
              </div>
            </div>
          </div>

          {/* Hero metrics */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {mode === "create" && (
              <>
                <div className="rounded-lg border border-line bg-background px-3 py-2 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">Active</p>
                  <p className="text-base font-black text-foreground">{activeProjectCount}</p>
                </div>
                <div className="rounded-lg border border-line bg-background px-3 py-2 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">Limit</p>
                  <p className="text-base font-black text-foreground">
                    {projectLimit == null ? "∞" : String(projectLimit)}
                  </p>
                </div>
              </>
            )}
            {mode === "edit" && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
                <Pencil className="size-3.5 text-primary-dark" aria-hidden="true" />
                <span className="text-xs font-black text-foreground">Editing</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Disabled banner */}
      {disabledReason && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {disabledReason}
        </div>
      )}

      {/* ── Step nav + form + sidebar ─────────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[180px_1fr]">

        {/* Vertical step nav (xl only) */}
        <nav className="hidden xl:flex xl:flex-col xl:gap-2 xl:self-start xl:sticky xl:top-20">
          {steps.map((step, index) => {
            const StepIcon = step.Icon;
            const isActive = step.id === activeStep;
            const isDone = index < activeStepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (index <= activeStepIndex || isStepValid(activeStep, form)) {
                    setActiveStep(step.id);
                  }
                }}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all",
                  isActive
                    ? "border-[#111111] bg-[#111111] text-white shadow-lg shadow-black/10"
                    : isDone
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      : "border-line bg-panel text-foreground hover:bg-panel-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg transition-all",
                    isActive
                      ? "bg-primary text-[#111111]"
                      : isDone
                        ? "bg-emerald-500 text-white"
                        : "bg-panel-muted text-ink-soft group-hover:bg-primary/20",
                  )}
                >
                  {isDone
                    ? <Check className="size-3.5" aria-hidden="true" />
                    : <StepIcon className="size-3.5" aria-hidden="true" />}
                </span>
                <div className="min-w-0">
                  <span className={cn("block text-xs font-black", isActive ? "text-white" : "")}>{step.title}</span>
                </div>
                {isActive && (
                  <span className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Form panel */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">

          {/* Horizontal tabs (hidden on xl) */}
          <div className="overflow-x-auto border-b border-line xl:hidden">
            <div className="flex min-w-max gap-0 p-2">
              {steps.map((step, index) => {
                const StepIcon = step.Icon;
                const isActive = step.id === activeStep;
                const isDone = index < activeStepIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (index <= activeStepIndex || isStepValid(activeStep, form)) {
                        setActiveStep(step.id);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all",
                      isActive
                        ? "bg-[#111111] text-white shadow-sm"
                        : isDone
                          ? "text-emerald-700 hover:bg-emerald-50"
                          : "text-ink-soft hover:text-foreground",
                    )}
                  >
                    <span className={cn(
                      "flex size-5 items-center justify-center rounded-md",
                      isActive ? "bg-primary text-[#111111]" : isDone ? "bg-emerald-500 text-white" : "bg-panel-muted",
                    )}>
                      {isDone
                        ? <Check className="size-3" aria-hidden="true" />
                        : <StepIcon className="size-3" aria-hidden="true" />}
                    </span>
                    {step.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step header */}
          <div className="border-b border-line px-5 py-4">
            {steps.map((step) => {
              if (step.id !== activeStep) return null;
              const StepIcon = step.Icon;
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-[#111111] shadow-[0_8px_20px_rgba(255,212,0,0.3)]">
                    <StepIcon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-foreground">{step.title}</h2>
                  </div>
                  <span className="ml-auto text-[11px] font-black text-ink-soft">
                    {activeStepIndex + 1} / {steps.length}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step content */}
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-ink-soft">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span className="text-sm font-semibold">Loading…</span>
            </div>
          ) : (
            <div className="p-5">
              {activeStep === "scope" && (
                <ScopeStep
                  availableTeams={availableTeams}
                  form={form}
                  loadingOptions={loadingOptions}
                  mode={mode}
                  update={update}
                  workspaces={workspaces}
                  onNameChange={handleNameChange}
                />
              )}
              {activeStep === "delivery" && <DeliveryStep form={form} mode={mode} update={update} />}
              {activeStep === "commercial" && (
                canEditCommercial ? (
                  <CommercialStep form={form} update={update} />
                ) : (
                  <RestrictedCommercialStep />
                )
              )}
              {activeStep === "governance" && <GovernanceStep form={form} mode={mode} update={update} />}
              {activeStep === "review" && (
                <ReviewStep
                  form={form}
                  mode={mode}
                  selectedTeam={selectedTeam}
                  selectedWorkspace={selectedWorkspace}
                />
              )}
            </div>
          )}

          {/* Step navigation footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
            <button
              type="button"
              onClick={
                activeStepIndex === 0
                  ? () => router.push(mode === "edit" && projectId ? `/projects/${projectId}` : "/projects")
                  : goBack
              }
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-background px-4 text-sm font-bold text-foreground transition hover:bg-panel-muted disabled:opacity-50"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              {activeStepIndex === 0 ? "Cancel" : "Back"}
            </button>

            {activeStep === "review" ? (
              <button
                type="button"
                onClick={() => void submitProject()}
                disabled={saving || isLoading || Boolean(disabledReason)}
                className="tb-yellow-button inline-flex h-10 items-center gap-2 rounded-xl px-6 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : mode === "edit" ? (
                  <Save className="size-4" aria-hidden="true" />
                ) : (
                  <FolderPlus className="size-4" aria-hidden="true" />
                )}
                {saving
                  ? mode === "edit" ? "Saving…" : "Creating…"
                  : mode === "edit" ? "Save changes" : "Create project"}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!canContinue || saving || isLoading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-[#111111] shadow-[0_8px_24px_rgba(245,212,26,0.25)] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function ScopeStep({
  availableTeams,
  form,
  loadingOptions,
  mode,
  onNameChange,
  update,
  workspaces,
}: {
  availableTeams: Team[];
  form: ProjectFormState;
  loadingOptions: boolean;
  mode: "create" | "edit";
  onNameChange: (value: string) => void;
  update: UpdateForm;
  workspaces: Workspace[];
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Workspace" required>
          <select
            value={form.workspaceId}
            onChange={(e) => update("workspaceId", e.target.value)}
            className={fieldClass}
            required
          >
            {loadingOptions && <option value="">Loading workspaces…</option>}
            {!loadingOptions && !workspaces.length && <option value="">No workspaces available</option>}
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Team">
          <select
            value={form.teamId}
            onChange={(e) => update("teamId", e.target.value)}
            className={fieldClass}
          >
            <option value="">No team</option>
            {availableTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <Field label="Key" required>
          <input
            value={form.key}
            onChange={(e) => update("key", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 16))}
            className={cn(fieldClass, "font-black uppercase tracking-widest")}
            placeholder="TB"
            maxLength={16}
            required
            readOnly={mode === "edit"}
          />
        </Field>
        <Field label="Name" required>
          <input
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            className={fieldClass}
            placeholder="Project name"
            required
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className={textareaClass}
          rows={4}
          placeholder="Optional notes"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as ProjectStatus)}
            className={fieldClass}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{projectStatusLabels[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="Visibility">
          <select
            value={form.visibility}
            onChange={(e) => update("visibility", e.target.value as Visibility)}
            className={fieldClass}
          >
            {visibilityOptions.map((v) => (
              <option key={v} value={v}>{titleCase(v)}</option>
            ))}
          </select>
        </Field>
      </div>

      {mode === "edit" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          The project key cannot be changed after creation.
        </div>
      )}
    </div>
  );
}

function DeliveryStep({ form, mode, update }: { form: ProjectFormState; mode: "create" | "edit"; update: UpdateForm }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Start date">
          <input
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className={fieldClass}
            type="date"
          />
        </Field>
        <Field label="Due date">
          <input
            value={form.dueDate}
            onChange={(e) => update("dueDate", e.target.value)}
            className={fieldClass}
            type="date"
          />
        </Field>
      </div>

      {mode === "create" && (
        <>
          <SectionPanel icon={Target} title="Milestone">
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <Field label="Title">
                <input
                  value={form.milestoneTitle}
                  onChange={(e) => update("milestoneTitle", e.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Due date">
                <input
                  value={form.milestoneDueDate}
                  onChange={(e) => update("milestoneDueDate", e.target.value)}
                  className={fieldClass}
                  type="date"
                />
              </Field>
            </div>
          </SectionPanel>

          <SectionPanel icon={AlertTriangle} title="Risk">
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <Field label="Title">
                <input
                  value={form.riskTitle}
                  onChange={(e) => update("riskTitle", e.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Severity">
                <select
                  value={form.riskSeverity}
                  onChange={(e) => update("riskSeverity", e.target.value as TaskPriority)}
                  className={fieldClass}
                >
                  {riskSeverityOptions.map((p) => (
                    <option key={p} value={p}>{priorityLabels[p]}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Mitigation">
              <input
                value={form.riskMitigation}
                onChange={(e) => update("riskMitigation", e.target.value)}
                className={fieldClass}
              />
            </Field>
          </SectionPanel>
        </>
      )}

      {mode === "edit" && (
        <div className="rounded-xl border border-line bg-background px-4 py-3 text-xs font-medium text-ink-soft">
          Milestones and risks are managed in the project console under the Planning and Risk tabs.
        </div>
      )}
    </div>
  );
}

function CommercialStep({ form, update }: { form: ProjectFormState; update: UpdateForm }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Currency">
          <select value={form.currency} onChange={(e) => update("currency", e.target.value)} className={fieldClass}>
            {projectCurrencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Contract">
          <input
            value={form.contractValue}
            onChange={(e) => update("contractValue", e.target.value)}
            className={fieldClass}
            min={0}
            step="0.01"
            type="number"
            placeholder="0"
          />
        </Field>
        <Field label="Timezone">
          <select value={form.timezone} onChange={(e) => update("timezone", e.target.value)} className={fieldClass}>
            {timezoneOptions.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </Field>
      </div>

      <SectionPanel icon={Landmark} title="Budget">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Planned budget">
            <input
              value={form.budgetPlanned}
              onChange={(e) => update("budgetPlanned", e.target.value)}
              className={fieldClass}
              min={0}
              step="0.01"
              type="number"
              placeholder="0"
            />
          </Field>
          <Field label="Actual budget">
            <input
              value={form.budgetActual}
              onChange={(e) => update("budgetActual", e.target.value)}
              className={fieldClass}
              min={0}
              step="0.01"
              type="number"
              placeholder="0"
            />
          </Field>
        </div>
        <Field label="Note">
          <input
            value={form.budgetNotes}
            onChange={(e) => update("budgetNotes", e.target.value)}
            className={fieldClass}
            placeholder="Optional note"
          />
        </Field>
      </SectionPanel>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Client">
          <input value={form.clientName} onChange={(e) => update("clientName", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Client email">
          <input value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} className={fieldClass} type="email" />
        </Field>
        <Field label="Client phone">
          <input value={form.clientPhone} onChange={(e) => update("clientPhone", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Location">
          <input value={form.locationName} onChange={(e) => update("locationName", e.target.value)} className={fieldClass} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Address line 1">
          <input value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Address line 2">
          <input value={form.addressLine2} onChange={(e) => update("addressLine2", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="City">
          <input value={form.city} onChange={(e) => update("city", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="State/region">
          <input value={form.state} onChange={(e) => update("state", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Country">
          <input value={form.country} onChange={(e) => update("country", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Postal">
          <input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Billing">
          <input value={form.billingCode} onChange={(e) => update("billingCode", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Cost center">
          <input value={form.costCenter} onChange={(e) => update("costCenter", e.target.value)} className={fieldClass} />
        </Field>
      </div>
    </div>
  );
}

function RestrictedCommercialStep() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
        <CircleDollarSign className="size-7" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-black text-foreground">Finance fields are restricted</h3>
      <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-ink-soft">
        You can update delivery details, but project budget, client, billing, and location data require budget permission.
      </p>
    </div>
  );
}

function GovernanceStep({ form, mode, update }: { form: ProjectFormState; mode: "create" | "edit"; update: UpdateForm }) {
  if (mode === "edit") {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-panel-muted">
          <ShieldCheck className="size-7 text-ink-soft" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-base font-black text-foreground">Managed in the project console</h3>
        <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-ink-soft">
          Stakeholders and dependencies live inside the project room.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <SectionPanel icon={Users} title="Stakeholder">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input value={form.stakeholderName} onChange={(e) => update("stakeholderName", e.target.value)} className={fieldClass} />
          </Field>
          <Field label="Role">
            <input value={form.stakeholderRole} onChange={(e) => update("stakeholderRole", e.target.value)} className={fieldClass} />
          </Field>
          <Field label="Email">
            <input value={form.stakeholderEmail} onChange={(e) => update("stakeholderEmail", e.target.value)} className={fieldClass} type="email" />
          </Field>
          <Field label="Organization">
            <input value={form.stakeholderOrganization} onChange={(e) => update("stakeholderOrganization", e.target.value)} className={fieldClass} />
          </Field>
          <Field label="Influence">
            <select value={form.stakeholderInfluence} onChange={(e) => update("stakeholderInfluence", e.target.value as ProjectStakeholderInfluence)} className={fieldClass}>
              {stakeholderInfluenceOptions.map((v) => <option key={v} value={v}>{titleCase(v)}</option>)}
            </select>
          </Field>
          <label className="flex h-11 items-center gap-2 pt-5 text-sm font-bold text-foreground">
            <input
              checked={form.stakeholderExternal}
              onChange={(e) => update("stakeholderExternal", e.target.checked)}
              className="size-4 accent-primary"
              type="checkbox"
            />
            External stakeholder
          </label>
        </div>
      </SectionPanel>

      <SectionPanel icon={Workflow} title="Dependency">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Dependency title">
            <input value={form.dependencyTitle} onChange={(e) => update("dependencyTitle", e.target.value)} className={fieldClass} />
          </Field>
          <Field label="Status">
            <select value={form.dependencyStatus} onChange={(e) => update("dependencyStatus", e.target.value as ProjectDependencyStatus)} className={fieldClass}>
              {dependencyStatusOptions.map((v) => <option key={v} value={v}>{titleCase(v)}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <input value={form.dependencyType} onChange={(e) => update("dependencyType", e.target.value)} className={fieldClass} />
          </Field>
          <Field label="Owner">
            <input value={form.dependencyOwnerName} onChange={(e) => update("dependencyOwnerName", e.target.value)} className={fieldClass} />
          </Field>
          <Field label="Owner email">
            <input value={form.dependencyOwnerEmail} onChange={(e) => update("dependencyOwnerEmail", e.target.value)} className={fieldClass} type="email" />
          </Field>
          <Field label="Due date">
            <input value={form.dependencyDueDate} onChange={(e) => update("dependencyDueDate", e.target.value)} className={fieldClass} type="date" />
          </Field>
        </div>
        <Field label="External link">
          <input value={form.dependencyUrl} onChange={(e) => update("dependencyUrl", e.target.value)} className={fieldClass} />
        </Field>
      </SectionPanel>
    </div>
  );
}

function ReviewStep({
  form,
  mode,
  selectedTeam,
  selectedWorkspace,
}: {
  form: ProjectFormState;
  mode: "create" | "edit";
  selectedTeam?: Team;
  selectedWorkspace?: Workspace;
}) {
  const seededItems = mode === "create"
    ? [
        form.milestoneTitle && "Milestone",
        form.riskTitle && "Risk",
        form.budgetPlanned && "Budget",
        form.stakeholderName && "Stakeholder",
        form.dependencyTitle && "Dependency",
      ].filter(Boolean)
    : [];

  return (
    <div className="grid gap-5">
      <div className="relative overflow-hidden rounded-2xl bg-[#0f1117] p-6 text-white">
        <div className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 size-24 rounded-full bg-accent/8 blur-2xl" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-block rounded-lg bg-primary px-2.5 py-1 text-[10px] font-black tracking-[0.08em] text-[#111111]">
                {form.key || "KEY"}
              </span>
              <h3 className="mt-3 text-2xl font-black">{form.name || "Untitled project"}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50 line-clamp-3">
                {form.description || "No description entered."}
              </p>
            </div>
            <span className="rounded-xl bg-primary/15 px-3 py-1.5 text-xs font-black text-primary">
              {projectStatusLabels[form.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReviewTile icon={Building2} label="Workspace" value={selectedWorkspace?.name || "Not selected"} />
        <ReviewTile icon={Users} label="Team" value={selectedTeam?.name || "No team"} />
        <ReviewTile icon={CalendarDays} label="Dates" value={dateRangeLabel(form.startDate, form.dueDate)} />
        <ReviewTile icon={CircleDollarSign} label="Commercial" value={`${form.currency} ${numberLabel(form.contractValue || form.budgetPlanned)}`} />
      </div>

      {mode === "create" && (
        <div className="rounded-2xl border border-line bg-background p-4">
          <p className="text-sm font-black text-foreground">Records created after project setup</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {seededItems.length ? (
              seededItems.map((item) => (
                <span key={String(item)} className="rounded-full border border-line bg-panel px-3 py-1 text-xs font-bold text-foreground">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-sm font-medium text-ink-soft">
                No optional seed records selected. You can add them later from the project console.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar components ───────────────────────────────────────────────────────

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionPanel({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  description?: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-background">
      <div className="flex items-start gap-3 border-b border-line bg-panel px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[#111111]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-black text-foreground">{title}</h3>
          {description && <p className="text-[11px] font-medium text-ink-soft">{description}</p>}
        </div>
      </div>
      <div className="grid gap-4 p-4">{children}</div>
    </section>
  );
}

function Field({ children, label, required }: { children: ReactNode; label: string; required?: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-foreground">
      <span>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function ReviewTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-background p-4">
      <Icon className="size-4 text-ink-soft" aria-hidden="true" />
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-foreground">{value}</p>
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-background px-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-ink-soft focus:border-primary focus:ring-4 focus:ring-primary/10";
const textareaClass =
  "min-h-[118px] w-full resize-none rounded-xl border border-line bg-background px-3 py-3 text-sm font-medium text-foreground outline-none transition placeholder:text-ink-soft focus:border-primary focus:ring-4 focus:ring-primary/10";

function isStepValid(step: WizardStep, form: ProjectFormState) {
  if (step === "scope") return Boolean(form.workspaceId && form.key.trim() && form.name.trim());
  return true;
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function toNoonIso(value: string) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : undefined;
}

function buildProjectKey(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const key = words.length > 1 ? words.map((w) => w[0]).join("") : value.slice(0, 4);
  return key.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 8);
}

function titleCase(value: string) {
  return value.toLowerCase().split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function numberLabel(value: string) {
  const parsed = optionalNumber(value);
  return parsed === undefined ? "0" : parsed.toLocaleString();
}

function dateRangeLabel(startDate: string, dueDate: string) {
  if (!startDate && !dueDate) return "No dates";
  if (startDate && dueDate) return `${startDate} → ${dueDate}`;
  return startDate || dueDate;
}

function messageFrom(caught: unknown) {
  return caught instanceof Error ? caught.message : "Please try again.";
}

async function seedProjectRecords(token: string, project: Project, form: ProjectFormState) {
  const actions: Array<Promise<unknown>> = [];

  if (optionalNumber(form.budgetPlanned) || optionalNumber(form.budgetActual) || optionalString(form.budgetNotes)) {
    actions.push(createProjectBudget(token, project.id, {
      currency: form.currency,
      planned: optionalNumber(form.budgetPlanned),
      actual: optionalNumber(form.budgetActual),
      notes: optionalString(form.budgetNotes),
    }));
  }

  if (optionalString(form.milestoneTitle)) {
    actions.push(createProjectMilestone(token, project.id, {
      title: form.milestoneTitle.trim(),
      dueDate: toNoonIso(form.milestoneDueDate),
    }));
  }

  if (optionalString(form.riskTitle)) {
    actions.push(createProjectRisk(token, project.id, {
      title: form.riskTitle.trim(),
      severity: form.riskSeverity,
      mitigation: optionalString(form.riskMitigation),
      isOpen: true,
    }));
  }

  if (optionalString(form.stakeholderName)) {
    actions.push(createProjectStakeholder(token, project.id, {
      name: form.stakeholderName.trim(),
      email: optionalString(form.stakeholderEmail),
      role: optionalString(form.stakeholderRole),
      organization: optionalString(form.stakeholderOrganization),
      influence: form.stakeholderInfluence,
      isExternal: form.stakeholderExternal,
    }));
  }

  if (optionalString(form.dependencyTitle)) {
    actions.push(createProjectDependency(token, project.id, {
      title: form.dependencyTitle.trim(),
      dependencyType: optionalString(form.dependencyType),
      status: form.dependencyStatus,
      ownerName: optionalString(form.dependencyOwnerName),
      ownerEmail: optionalString(form.dependencyOwnerEmail),
      dueDate: toNoonIso(form.dependencyDueDate),
      externalUrl: optionalString(form.dependencyUrl),
    }));
  }

  return Promise.allSettled(actions);
}
