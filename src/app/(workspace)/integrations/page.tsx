"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  Copy,
  Database,
  GitBranch,
  Globe2,
  GripVertical,
  KeyRound,
  Layers3,
  Loader2,
  Mail,
  MessageSquare,
  Pause,
  Play,
  Plug,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Webhook as WebhookIcon,
  Workflow as WorkflowIcon,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  BrandedModal,
  EmptyState,
  FormField,
  PermissionGate,
  SkeletonBlock,
  StatusBadge,
  SurfaceCard,
  type TabItem,
} from "@/components/ui/foundation";
import {
  archiveAiAgent,
  archiveWorkflow,
  cancelWorkflowRun,
  createAiAgent,
  createIntegration,
  createWebhook,
  createWorkflow,
  deleteAiAgent,
  deleteIntegration,
  deleteWebhook,
  deleteWorkflow,
  disableIntegration,
  disableWebhook,
  enableIntegration,
  enableWebhook,
  getAiSettings,
  listAiAgents,
  listDeadLetterWorkflowRuns,
  listIntegrationLogs,
  listIntegrations,
  listWebhookDeliveries,
  listWebhooks,
  listWorkflowRunLogs,
  listWorkflowRuns,
  listWorkflows,
  moduleStatus,
  processOmoFlowEvent,
  replaceWorkflowNodes,
  restoreAiAgent,
  restoreWorkflow,
  requeueWorkflowRun,
  retryWebhookDelivery,
  retryWorkflowRun,
  rotateIntegrationSecret,
  rotateWebhookSecret,
  runWorkflow,
  syncIntegration,
  triggerWebhookEvent,
  updateAiSettings,
  updateWorkflow,
  type AiAgent,
  type AiSettings,
  type Integration,
  type IntegrationLog,
  type IntegrationProvider,
  type ModuleStatus,
  type Webhook,
  type WebhookDelivery,
  type WebhookDeliveryStatus,
  type Workflow,
  type WorkflowNode,
  type WorkflowRun,
  type WorkflowRunLog,
  type WorkflowRunStatus,
} from "@/lib/api";
import { cn } from "@/lib/cn";

type IntegrationTab = "catalog" | "omoflow" | "automations" | "webhooks" | "agents" | "activity";

type ProviderTemplate = {
  key: string;
  label: string;
  provider: IntegrationProvider;
  description: string;
  scopes: string[];
  icon: LucideIcon;
  tone: string;
  defaultConfig: Record<string, unknown>;
  secretKey?: string;
  externalAccountId?: string;
};

type IntegrationForm = {
  provider: IntegrationProvider;
  name: string;
  externalAccountId: string;
  baseUrl: string;
  socketUrl: string;
  authHeader: string;
  scopes: string;
  configJson: string;
  secretKey: string;
  secretValue: string;
  enabled: boolean;
};

type WebhookForm = {
  name: string;
  description: string;
  url: string;
  events: string;
  secret: string;
  enabled: boolean;
};

type AgentForm = {
  name: string;
  description: string;
  type: string;
  provider: string;
  model: string;
  systemPrompt: string;
  tools: string;
  temperature: string;
  maxOutputTokens: string;
  enabled: boolean;
};

type DraftNode = Omit<WorkflowNode, "id" | "workflowId" | "createdAt" | "updatedAt" | "config"> & {
  id: string;
  configText: string;
};

type WorkflowDraft = {
  id?: string;
  name: string;
  description: string;
  entityType: string;
  triggerType: string;
  eventType: string;
  isActive: boolean;
  configText: string;
  nodes: DraftNode[];
};

const tabs: Array<TabItem<IntegrationTab>> = [
  { id: "catalog", label: "Catalog", icon: Plug },
  { id: "omoflow", label: "OmoFlow", icon: Sparkles },
  { id: "automations", label: "Automation", icon: WorkflowIcon },
  { id: "webhooks", label: "Webhooks", icon: WebhookIcon },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "activity", label: "Runs and logs", icon: Activity },
];

const providerTemplates: ProviderTemplate[] = [
  {
    key: "omoflow",
    label: "OmoFlow",
    provider: "CUSTOM",
    description: "Meetings, agendas, video rooms, chat, calendars, attendance, and action-item sync.",
    scopes: ["meetings:read", "meetings:write", "agendas:read", "video:launch", "chat:sync", "tasks:sync"],
    icon: Sparkles,
    tone: "from-[#111111] via-[#1d1b12] to-[#3a3100]",
    externalAccountId: "omoflow-production",
    secretKey: "accessToken",
    defaultConfig: {
      app: "omoflow",
      product: "OmoFlow",
      baseUrl: "https://meeting-backend-tg9d.onrender.com/api",
      socketUrl: "https://meeting-backend-tg9d.onrender.com",
      endpoints: {
        meetings: "/meetings",
        recurringMeetings: "/meetings/recurring",
        agendas: "/agendas",
        videoRooms: "/video",
        chatRooms: "/group-chat/rooms",
        notifications: "/notifications",
      },
      syncPolicy: {
        meetingsToProjects: true,
        agendasToTasks: true,
        decisionsToActivity: true,
        actionItemsToBoard: true,
      },
    },
  },
  {
    key: "slack",
    label: "Slack",
    provider: "SLACK",
    description: "Channel notifications, delivery alerts, approval nudges, and release-room handoff.",
    scopes: ["chat:write", "channels:read", "users:read"],
    icon: MessageSquare,
    tone: "from-[#f4f1e7] via-[#fff8ca] to-[#f3f7ff]",
    secretKey: "botToken",
    defaultConfig: { app: "slack", channelStrategy: "project-channel", notifyOn: ["task.blocked", "approval.requested"] },
  },
  {
    key: "email",
    label: "Email",
    provider: "CUSTOM",
    description: "SMTP/API mail delivery for digests, client updates, approvals, and escalation paths.",
    scopes: ["mail:send", "mail:templates", "mail:delivery_status"],
    icon: Mail,
    tone: "from-[#f7fbff] via-[#fffbea] to-[#f7f4ee]",
    secretKey: "apiKey",
    defaultConfig: { app: "email", providerKey: "smtp-or-transactional", templateMode: "tenant" },
  },
  {
    key: "github",
    label: "GitHub",
    provider: "GITHUB",
    description: "Issues, pull requests, release events, code review signals, and deployment traceability.",
    scopes: ["repo", "issues:read", "pull_requests:read", "deployments:read"],
    icon: GitBranch,
    tone: "from-[#111111] via-[#1b2222] to-[#142f22]",
    secretKey: "accessToken",
    defaultConfig: { app: "github", sync: ["issues", "pull_requests", "deployments"] },
  },
  {
    key: "jira",
    label: "Jira-style",
    provider: "CUSTOM",
    description: "Backlog import, ticket links, status mirroring, release scope, and migration bridge.",
    scopes: ["issues:read", "issues:write", "projects:read"],
    icon: Layers3,
    tone: "from-[#edf4ff] via-[#fffef6] to-[#effaf4]",
    secretKey: "apiToken",
    defaultConfig: { app: "jira", providerKey: "jira-compatible", sync: ["projects", "issues", "sprints"] },
  },
  {
    key: "openai",
    label: "OpenAI",
    provider: "OPENAI",
    description: "AI agents, summaries, risk detection, planning support, and knowledge search.",
    scopes: ["ai:chat", "ai:agents", "ai:usage"],
    icon: Bot,
    tone: "from-[#111111] via-[#20201a] to-[#332d08]",
    secretKey: "apiKey",
    defaultConfig: { app: "openai", modelSource: "tenant-env", redactSensitiveData: true },
  },
];

const nodeTemplates: Array<Pick<DraftNode, "name" | "type" | "actionType" | "configText" | "retryAttempts" | "timeoutSeconds" | "onFailure"> & { icon: LucideIcon }> = [
  {
    name: "Event intake",
    type: "TRIGGER",
    actionType: "MATCH_EVENT",
    configText: prettyJson({ match: "entity.event", source: "taskbricks" }),
    retryAttempts: 0,
    timeoutSeconds: 30,
    onFailure: "STOP",
    icon: Zap,
  },
  {
    name: "Route by policy",
    type: "CONDITION",
    actionType: "EVALUATE_RULES",
    configText: prettyJson({ conditions: [{ field: "priority", op: "in", value: ["HIGH", "CRITICAL"] }] }),
    retryAttempts: 1,
    timeoutSeconds: 45,
    onFailure: "STOP",
    icon: ShieldCheck,
  },
  {
    name: "Notify owners",
    type: "ACTION",
    actionType: "SEND_NOTIFICATION",
    configText: prettyJson({ channel: "IN_APP", title: "Workflow update", body: "A monitored workflow event was processed." }),
    retryAttempts: 2,
    timeoutSeconds: 60,
    onFailure: "CONTINUE",
    icon: Bell,
  },
  {
    name: "Call integration",
    type: "ACTION",
    actionType: "CALL_WEBHOOK",
    configText: prettyJson({ integration: "omoflow", method: "POST", path: "/meetings", payload: { source: "taskbricks" } }),
    retryAttempts: 3,
    timeoutSeconds: 90,
    onFailure: "STOP",
    icon: WebhookIcon,
  },
  {
    name: "AI decision support",
    type: "ACTION",
    actionType: "RUN_AGENT",
    configText: prettyJson({ agentType: "MEETING_ACTION_AGENT", output: "task_updates" }),
    retryAttempts: 1,
    timeoutSeconds: 120,
    onFailure: "CONTINUE",
    icon: Bot,
  },
];

const emptyIntegrationForm: IntegrationForm = {
  provider: "CUSTOM",
  name: "",
  externalAccountId: "",
  baseUrl: "",
  socketUrl: "",
  authHeader: "Authorization",
  scopes: "",
  configJson: prettyJson({}),
  secretKey: "",
  secretValue: "",
  enabled: true,
};

const emptyWebhookForm: WebhookForm = {
  name: "",
  description: "",
  url: "",
  events: "task.created,task.updated,project.updated,workflow.completed",
  secret: "",
  enabled: true,
};

const defaultAgentForm: AgentForm = {
  name: "OmoFlow meeting intelligence",
  description: "Turns meeting outcomes into project updates, actions, risks, and delivery summaries.",
  type: "MEETING_ACTION_AGENT",
  provider: "openai",
  model: "gpt-4o-mini",
  systemPrompt:
    "You are TaskBricks OmoFlow Agent. Extract decisions, owners, risks, blockers, due dates, and action items from meeting context. Return concise, auditable output.",
  tools: "task.create,task.update,project.summarize,notification.send,omoflow.meetings",
  temperature: "0.2",
  maxOutputTokens: "1200",
  enabled: true,
};

const emptyDraft = (): WorkflowDraft => ({
  name: "OmoFlow meeting to delivery workflow",
  description: "Convert meeting decisions into tracked project work with notifications, audit, and agent support.",
  entityType: "MEETING",
  triggerType: "EVENT",
  eventType: "MEETING_COMPLETED",
  isActive: true,
  configText: prettyJson({ source: "integrations-console", criticality: "production" }),
  nodes: [
    createDraftNode(nodeTemplates[0], 0),
    createDraftNode(nodeTemplates[3], 1),
    createDraftNode(nodeTemplates[4], 2),
    createDraftNode(nodeTemplates[2], 3),
  ],
});

export default function IntegrationsPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<IntegrationTab>("catalog");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([]);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState("");
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [deadLetterRuns, setDeadLetterRuns] = useState<WorkflowRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [selectedRunLogs, setSelectedRunLogs] = useState<WorkflowRunLog[]>([]);
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [moduleHealth, setModuleHealth] = useState<Record<string, ModuleStatus>>({});
  const [workflowDraft, setWorkflowDraft] = useState<WorkflowDraft>(() => emptyDraft());
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [integrationForm, setIntegrationForm] = useState<IntegrationForm>(emptyIntegrationForm);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [webhookForm, setWebhookForm] = useState<WebhookForm>(emptyWebhookForm);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentForm, setAgentForm] = useState<AgentForm>(defaultAgentForm);
  const [secretRotation, setSecretRotation] = useState<{ type: "integration" | "webhook"; id: string; label: string } | null>(null);
  const [secretKey, setSecretKey] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [copied, setCopied] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const canManageIntegrations = user.permissions.includes("manage:all") || user.permissions.includes("manage:tenant") || user.permissions.includes("manage:integrations");
  const canManageWorkflows = user.permissions.includes("manage:all") || user.permissions.includes("manage:projects");
  const canManageAi = user.permissions.includes("manage:all") || user.permissions.includes("manage:ai");

  const loadConsole = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [
        integrationResult,
        webhookResult,
        deliveryResult,
        workflowResult,
        runResult,
        deadLetterResult,
        agentResult,
        settingsResult,
        integrationStatus,
        workflowStatus,
        aiStatus,
      ] = await Promise.allSettled([
        listIntegrations(auth.accessToken, { limit: 100, search: query || undefined }),
        listWebhooks(auth.accessToken, { limit: 100, search: query || undefined }),
        listWebhookDeliveries(auth.accessToken, { limit: 40 }),
        listWorkflows(auth.accessToken, { limit: 100, includeArchived: true, search: query || undefined }),
        listWorkflowRuns(auth.accessToken, { limit: 50 }),
        listDeadLetterWorkflowRuns(auth.accessToken, { limit: 25 }),
        listAiAgents(auth.accessToken, { limit: 100, includeArchived: true, search: query || undefined }),
        getAiSettings(auth.accessToken),
        moduleStatus("/integrations/status"),
        moduleStatus("/workflows/status"),
        moduleStatus("/ai/status"),
      ]);

      const nextIntegrations = settledPage(integrationResult);
      setIntegrations(nextIntegrations);
      setWebhooks(settledPage(webhookResult));
      setDeliveries(settledPage(deliveryResult));
      const nextWorkflows = settledPage(workflowResult);
      setWorkflows(nextWorkflows);
      setWorkflowRuns(settledPage(runResult));
      setDeadLetterRuns(settledPage(deadLetterResult));
      setAgents(settledPage(agentResult));
      if (settingsResult.status === "fulfilled") setAiSettings(settingsResult.value);
      setModuleHealth({
        integrations: settledValue(integrationStatus),
        workflows: settledValue(workflowStatus),
        ai: settledValue(aiStatus),
      });

      const omoflow = nextIntegrations.find(isOmoFlowIntegration);
      if (omoflow) {
        setSelectedIntegrationId((current) => current || omoflow.id);
      }
      const activeWorkflow = nextWorkflows.find((workflow) => !workflow.archivedAt && workflow.name.toLowerCase().includes("omoflow")) ?? nextWorkflows[0];
      if (activeWorkflow) {
        setWorkflowDraft((current) => (current.id ? current : workflowToDraft(activeWorkflow)));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load integration console.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConsole();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadConsole]);

  useEffect(() => {
    if (!selectedIntegrationId) {
      const timer = window.setTimeout(() => setIntegrationLogs([]), 0);
      return () => window.clearTimeout(timer);
    }

    let alive = true;
    void listIntegrationLogs(auth.accessToken, selectedIntegrationId, { limit: 20 })
      .then((result) => {
        if (alive) setIntegrationLogs(result.data);
      })
      .catch(() => {
        if (alive) setIntegrationLogs([]);
      });

    return () => {
      alive = false;
    };
  }, [auth.accessToken, selectedIntegrationId]);

  const omoflowIntegration = useMemo(() => integrations.find(isOmoFlowIntegration), [integrations]);
  const filteredIntegrations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return integrations;
    return integrations.filter((integration) => {
      return [
        integration.name,
        integration.provider,
        integration.status,
        integration.externalAccountId ?? "",
        integration.scopes.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [integrations, query]);

  const metrics = useMemo(() => {
    const activeIntegrations = integrations.filter((integration) => integration.enabled && integration.status === "ACTIVE").length;
    const providers = new Set(integrations.map((integration) => providerDisplay(integration))).size;
    const healthyWebhooks = webhooks.filter((webhook) => webhook.enabled && !webhook.lastError).length;
    const failedDeliveries = deliveries.filter((delivery) => delivery.status === "FAILED").length;
    const activeWorkflows = workflows.filter((workflow) => workflow.isActive && !workflow.archivedAt).length;
    const liveAgents = agents.filter((agent) => agent.enabled && !agent.archivedAt).length;
    return { activeIntegrations, providers, healthyWebhooks, failedDeliveries, activeWorkflows, liveAgents };
  }, [agents, deliveries, integrations, webhooks, workflows]);

  function openProvider(template: ProviderTemplate) {
    const config = { ...template.defaultConfig };
    const baseUrl = typeof config.baseUrl === "string" ? config.baseUrl : "";
    const socketUrl = typeof config.socketUrl === "string" ? config.socketUrl : "";
    setIntegrationForm({
      provider: template.provider,
      name: template.label === "OmoFlow" ? "OmoFlow workspace" : `${template.label} integration`,
      externalAccountId: template.externalAccountId ?? "",
      baseUrl,
      socketUrl,
      authHeader: "Authorization",
      scopes: template.scopes.join(", "),
      configJson: prettyJson(config),
      secretKey: template.secretKey ?? "",
      secretValue: "",
      enabled: true,
    });
    setIntegrationModalOpen(true);
  }

  async function onSubmitIntegration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageIntegrations) return;
    setSaving("integration");
    try {
      const config = parseJsonObject(integrationForm.configJson, "Integration config");
      const payloadConfig = {
        ...config,
        ...(integrationForm.baseUrl.trim() ? { baseUrl: integrationForm.baseUrl.trim() } : {}),
        ...(integrationForm.socketUrl.trim() ? { socketUrl: integrationForm.socketUrl.trim() } : {}),
        ...(integrationForm.authHeader.trim() ? { authHeader: integrationForm.authHeader.trim() } : {}),
      };
      const secrets =
        integrationForm.secretKey.trim() && integrationForm.secretValue
          ? { [integrationForm.secretKey.trim()]: integrationForm.secretValue }
          : undefined;
      const integration = await createIntegration(auth.accessToken, {
        provider: integrationForm.provider,
        name: integrationForm.name,
        externalAccountId: emptyToUndefined(integrationForm.externalAccountId),
        config: payloadConfig,
        scopes: csv(integrationForm.scopes),
        secrets,
        enabled: integrationForm.enabled,
      });
      setIntegrations((current) => [integration, ...current.filter((item) => item.id !== integration.id)]);
      setSelectedIntegrationId(integration.id);
      setIntegrationModalOpen(false);
      toast({ title: "Integration connected", description: `${integration.name} is ready for sync and automation.`, variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to connect integration", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onToggleIntegration(integration: Integration) {
    if (!canManageIntegrations) return;
    setSaving(integration.id);
    try {
      const updated = integration.enabled
        ? await disableIntegration(auth.accessToken, integration.id)
        : await enableIntegration(auth.accessToken, integration.id);
      setIntegrations((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast({ title: updated.enabled ? "Integration enabled" : "Integration disabled", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to update integration", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onSyncIntegration(integration: Integration) {
    if (!canManageIntegrations) return;
    setSaving(`sync-${integration.id}`);
    try {
      const result = await syncIntegration(auth.accessToken, integration.id, {
        mode: "manual",
        payload: { source: "integrations-console", requestedBy: user.id },
      });
      setIntegrations((current) => current.map((item) => (item.id === result.integration.id ? result.integration : item)));
      toast({ title: "Sync queued", description: result.message ?? "Provider worker handoff recorded.", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to sync integration", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onProcessOmoFlowRuntimeEvent(projectId?: string) {
    if (!canManageIntegrations) return;
    setSaving("omoflow-runtime");
    try {
      const result = await processOmoFlowEvent(auth.accessToken, {
        eventId: `manual-${Date.now()}`,
        eventType: "meeting.completed",
        projectId: emptyToUndefined(projectId ?? ""),
        meeting: {
          id: `meeting-${Date.now()}`,
          title: "OmoFlow delivery review",
          summary: "Imported from OmoFlow runtime to validate meeting-to-task handoff, audit logging, and idempotency.",
          endedAt: new Date().toISOString(),
        },
        actionItems: [
          {
            title: "Review OmoFlow imported actions",
            description: "Confirm owners, due dates, and sprint placement after OmoFlow meeting import.",
            priority: "HIGH",
            storyPoints: 3,
          },
          {
            title: "Attach meeting evidence to delivery work",
            description: "Link agenda decisions, notes, transcript, and follow-up tasks back to the project timeline.",
            priority: "MEDIUM",
            storyPoints: 2,
          },
        ],
        payload: { source: "integrations-console" },
      });
      toast({
        title: result.idempotent ? "OmoFlow event already processed" : "OmoFlow event processed",
        description: result.message,
        variant: "success",
      });
      await loadConsole();
    } catch (caught) {
      toast({ title: "Unable to process OmoFlow event", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onDeleteIntegration(integration: Integration) {
    if (!canManageIntegrations) return;
    const ok = await confirm({
      title: `Delete ${integration.name}?`,
      description: "This removes the integration configuration and its logs from this tenant.",
      confirmLabel: "Delete integration",
    });
    if (!ok) return;
    setSaving(`delete-${integration.id}`);
    try {
      await deleteIntegration(auth.accessToken, integration.id);
      setIntegrations((current) => current.filter((item) => item.id !== integration.id));
      if (selectedIntegrationId === integration.id) setSelectedIntegrationId("");
      toast({ title: "Integration deleted", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to delete integration", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onSubmitWebhook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageIntegrations) return;
    setSaving("webhook");
    try {
      const webhook = await createWebhook(auth.accessToken, {
        name: webhookForm.name,
        description: emptyToUndefined(webhookForm.description),
        url: webhookForm.url,
        events: csv(webhookForm.events),
        secret: emptyToUndefined(webhookForm.secret),
        signingAlgorithm: "hmac-sha256",
        enabled: webhookForm.enabled,
      });
      setWebhooks((current) => [webhook, ...current]);
      setWebhookModalOpen(false);
      if (webhook.signingSecret) copyText(webhook.signingSecret, "Webhook signing secret copied");
      toast({ title: "Webhook created", description: `${webhook.name} is ready to receive signed events.`, variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to create webhook", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  function openOmoFlowWebhook() {
    const baseUrl = omoflowBaseUrl(omoflowIntegration);
    setWebhookForm({
      name: "OmoFlow event handoff",
      description: "TaskBricks outbound events for OmoFlow meeting and action-item sync.",
      url: `${baseUrl.replace(/\/$/, "")}/webhooks/taskbricks`,
      events: "task.created,task.updated,project.updated,sprint.completed,workflow.completed",
      secret: "",
      enabled: true,
    });
    setWebhookModalOpen(true);
  }

  async function onToggleWebhook(webhook: Webhook) {
    if (!canManageIntegrations) return;
    setSaving(webhook.id);
    try {
      const updated = webhook.enabled ? await disableWebhook(auth.accessToken, webhook.id) : await enableWebhook(auth.accessToken, webhook.id);
      setWebhooks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast({ title: updated.enabled ? "Webhook enabled" : "Webhook disabled", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to update webhook", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onDeleteWebhook(webhook: Webhook) {
    if (!canManageIntegrations) return;
    const ok = await confirm({
      title: `Delete ${webhook.name}?`,
      description: "This removes the outgoing endpoint and its delivery history.",
      confirmLabel: "Delete webhook",
    });
    if (!ok) return;
    setSaving(`delete-${webhook.id}`);
    try {
      await deleteWebhook(auth.accessToken, webhook.id);
      setWebhooks((current) => current.filter((item) => item.id !== webhook.id));
      toast({ title: "Webhook deleted", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to delete webhook", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onRetryDelivery(delivery: WebhookDelivery) {
    setSaving(delivery.id);
    try {
      const updated = await retryWebhookDelivery(auth.accessToken, delivery.id);
      setDeliveries((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast({ title: "Delivery retry requested", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to retry delivery", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onRotateSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!secretRotation || !canManageIntegrations) return;
    setSaving("secret");
    try {
      if (secretRotation.type === "integration") {
        const updated = await rotateIntegrationSecret(auth.accessToken, secretRotation.id, { key: secretKey, value: secretValue });
        setIntegrations((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const updated = await rotateWebhookSecret(auth.accessToken, secretRotation.id, { secret: emptyToUndefined(secretValue) });
        setWebhooks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        if (updated.signingSecret) copyText(updated.signingSecret, "New webhook signing secret copied");
      }
      setSecretRotation(null);
      setSecretKey("");
      setSecretValue("");
      toast({ title: "Secret rotated", description: "Secret material is not shown again after this operation.", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to rotate secret", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  function selectWorkflow(workflow: Workflow) {
    setWorkflowDraft(workflowToDraft(workflow));
  }

  function addNode(template = nodeTemplates[2]) {
    setWorkflowDraft((current) => ({
      ...current,
      nodes: [...current.nodes, createDraftNode(template, current.nodes.length)],
    }));
  }

  function updateNode(id: string, patch: Partial<DraftNode>) {
    setWorkflowDraft((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    }));
  }

  function removeNode(id: string) {
    setWorkflowDraft((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => node.id !== id),
    }));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWorkflowDraft((current) => {
      const oldIndex = current.nodes.findIndex((node) => node.id === active.id);
      const newIndex = current.nodes.findIndex((node) => node.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return current;
      return { ...current, nodes: arrayMove(current.nodes, oldIndex, newIndex) };
    });
  }

  async function saveWorkflow() {
    if (!canManageWorkflows) return;
    setSaving("workflow");
    try {
      const config = parseJsonObject(workflowDraft.configText, "Workflow config");
      const nodes = workflowDraft.nodes.map(serializeNode);
      const payload = {
        name: workflowDraft.name,
        description: emptyToUndefined(workflowDraft.description),
        entityType: workflowDraft.entityType,
        triggerType: workflowDraft.triggerType,
        eventType: emptyToUndefined(workflowDraft.eventType),
        isActive: workflowDraft.isActive,
        config,
      };
      const workflow = workflowDraft.id
        ? await updateWorkflow(auth.accessToken, workflowDraft.id, payload)
        : await createWorkflow(auth.accessToken, { ...payload, nodes });
      const withNodes = workflowDraft.id ? await replaceWorkflowNodes(auth.accessToken, workflow.id, nodes) : workflow;
      setWorkflowDraft(workflowToDraft(withNodes));
      setWorkflows((current) => [withNodes, ...current.filter((item) => item.id !== withNodes.id)]);
      toast({ title: "Workflow saved", description: `${withNodes.nodes.length} automation nodes are persisted.`, variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to save workflow", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onArchiveWorkflow(workflow: Workflow) {
    if (!canManageWorkflows) return;
    setSaving(`archive-${workflow.id}`);
    try {
      const updated = workflow.archivedAt
        ? await restoreWorkflow(auth.accessToken, workflow.id)
        : await archiveWorkflow(auth.accessToken, workflow.id);
      setWorkflows((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      if (workflowDraft.id === workflow.id) setWorkflowDraft(workflowToDraft(updated));
      toast({ title: updated.archivedAt ? "Workflow archived" : "Workflow restored", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to update workflow", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onDeleteWorkflow(workflow: Workflow) {
    if (!canManageWorkflows) return;
    const ok = await confirm({
      title: `Delete ${workflow.name}?`,
      description: "If this workflow has runs, the backend may archive it instead of hard deleting it.",
      confirmLabel: "Delete workflow",
    });
    if (!ok) return;
    setSaving(`delete-workflow-${workflow.id}`);
    try {
      await deleteWorkflow(auth.accessToken, workflow.id);
      setWorkflows((current) => current.filter((item) => item.id !== workflow.id));
      if (workflowDraft.id === workflow.id) setWorkflowDraft(emptyDraft());
      toast({ title: "Workflow removed", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to remove workflow", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onRunWorkflow(workflowId = workflowDraft.id) {
    if (!workflowId || !canManageWorkflows) return;
    setSaving(`run-${workflowId}`);
    try {
      const run = await runWorkflow(auth.accessToken, workflowId, {
        entityType: workflowDraft.entityType,
        entityId: `manual-${Date.now()}`,
        eventType: workflowDraft.eventType,
        context: { source: "integrations-console", omoflowIntegrationId: omoflowIntegration?.id },
      });
      setWorkflowRuns((current) => [run, ...current]);
      toast({ title: "Workflow run started", description: run.status, variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to run workflow", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onRetryRun(run: WorkflowRun) {
    setSaving(run.id);
    try {
      const updated = await retryWorkflowRun(auth.accessToken, run.id);
      setWorkflowRuns((current) => [updated, ...current.filter((item) => item.id !== updated.id)]);
      toast({ title: "Run retry started", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to retry run", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onCancelRun(run: WorkflowRun) {
    setSaving(run.id);
    try {
      const updated = await cancelWorkflowRun(auth.accessToken, run.id);
      setWorkflowRuns((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast({ title: "Run cancelled", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to cancel run", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onInspectRun(run: WorkflowRun) {
    setSelectedRunId(run.id);
    setSaving(`logs-${run.id}`);
    try {
      const logs = await listWorkflowRunLogs(auth.accessToken, run.id);
      setSelectedRunLogs(logs);
    } catch (caught) {
      setSelectedRunLogs([]);
      toast({ title: "Unable to load run logs", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onRequeueRun(run: WorkflowRun) {
    setSaving(`requeue-${run.id}`);
    try {
      const updated = await requeueWorkflowRun(auth.accessToken, run.id);
      setWorkflowRuns((current) => [updated, ...current.filter((item) => item.id !== updated.id)]);
      setDeadLetterRuns((current) => current.filter((item) => item.id !== run.id));
      toast({ title: "Run requeued", description: "The worker can pick it up again.", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to requeue run", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  function installOmoFlowTemplate(template: "meeting-actions" | "risk-review" | "sprint-ceremony") {
    const drafts: Record<typeof template, WorkflowDraft> = {
      "meeting-actions": {
        ...emptyDraft(),
        name: "OmoFlow meeting actions to TaskBricks",
        description: "Capture decisions from OmoFlow meetings, generate actions, notify owners, and update project activity.",
      },
      "risk-review": {
        ...emptyDraft(),
        name: "Critical risk to OmoFlow review room",
        description: "When a critical project risk appears, create an OmoFlow review handoff and notify the accountable team.",
        entityType: "PROJECT_RISK",
        eventType: "RISK_CRITICAL",
        nodes: [
          createDraftNode(nodeTemplates[0], 0),
          createDraftNode(nodeTemplates[1], 1),
          createDraftNode(nodeTemplates[3], 2),
          createDraftNode(nodeTemplates[2], 3),
        ],
      },
      "sprint-ceremony": {
        ...emptyDraft(),
        name: "Sprint ceremony automation",
        description: "Schedule sprint ceremonies, connect OmoFlow meeting rooms, and post summary tasks after completion.",
        entityType: "SPRINT",
        eventType: "SPRINT_PLANNED",
        nodes: [
          createDraftNode(nodeTemplates[0], 0),
          createDraftNode(nodeTemplates[3], 1),
          createDraftNode(nodeTemplates[4], 2),
        ],
      },
    };
    setWorkflowDraft(drafts[template]);
    setActiveTab("automations");
    toast({ title: "Template loaded", description: "Review the workflow and save it when ready.", variant: "info" });
  }

  async function onSubmitAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageAi) return;
    setSaving("agent");
    try {
      const agent = await createAiAgent(auth.accessToken, {
        name: agentForm.name,
        description: emptyToUndefined(agentForm.description),
        type: agentForm.type,
        provider: agentForm.provider,
        model: agentForm.model,
        systemPrompt: agentForm.systemPrompt,
        tools: csv(agentForm.tools),
        temperature: Number(agentForm.temperature),
        maxOutputTokens: Number(agentForm.maxOutputTokens),
        enabled: agentForm.enabled,
        guardrails: {
          redactSensitiveData: true,
          requireHumanApprovalForExternalWrites: true,
          allowedWriteTargets: ["Task", "ProjectActivity", "Notification"],
        },
        knowledgeScope: {
          apps: ["taskbricks", "omoflow"],
          includeMeetings: true,
          includeProjects: true,
          includeTasks: true,
        },
      });
      setAgents((current) => [agent, ...current]);
      setAgentModalOpen(false);
      toast({ title: "Agent created", description: `${agent.name} is available for workflows.`, variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to create agent", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onArchiveAgent(agent: AiAgent) {
    if (!canManageAi) return;
    setSaving(agent.id);
    try {
      const updated = agent.archivedAt
        ? await restoreAiAgent(auth.accessToken, agent.id)
        : await archiveAiAgent(auth.accessToken, agent.id);
      setAgents((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast({ title: updated.archivedAt ? "Agent archived" : "Agent restored", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to update agent", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onDeleteAgent(agent: AiAgent) {
    if (!canManageAi) return;
    const ok = await confirm({
      title: `Delete ${agent.name}?`,
      description: "Agents with conversations, actions, or usage may be archived by the backend.",
      confirmLabel: "Delete agent",
    });
    if (!ok) return;
    setSaving(`delete-agent-${agent.id}`);
    try {
      await deleteAiAgent(auth.accessToken, agent.id);
      setAgents((current) => current.filter((item) => item.id !== agent.id));
      toast({ title: "Agent removed", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to remove agent", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onUpdateAiSettings() {
    if (!aiSettings || !canManageAi) return;
    setSaving("ai-settings");
    try {
      const updated = await updateAiSettings(auth.accessToken, {
        enabled: aiSettings.enabled,
        defaultProvider: aiSettings.defaultProvider,
        defaultModel: aiSettings.defaultModel,
        allowedProviders: aiSettings.allowedProviders,
        monthlyTokenLimit: aiSettings.monthlyTokenLimit ?? undefined,
        monthlyCostLimit: aiSettings.monthlyCostLimit ?? undefined,
        redactSensitiveData: aiSettings.redactSensitiveData,
        dataRetentionDays: aiSettings.dataRetentionDays,
        policy: aiSettings.policy,
      });
      setAiSettings(updated);
      toast({ title: "AI settings saved", variant: "success" });
    } catch (caught) {
      toast({ title: "Unable to save AI settings", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onSendTestEvent(webhook?: Webhook) {
    if (!canManageIntegrations) return;
    setSaving("test-event");
    try {
      const result = await triggerWebhookEvent(auth.accessToken, {
        eventType: "workflow.completed",
        entityType: "WORKFLOW",
        entityId: workflowDraft.id ?? "preview",
        payload: {
          id: `evt_${Date.now()}`,
          source: "integrations-console",
          targetWebhookId: webhook?.id,
          workflow: workflowDraft.name,
        },
      });
      toast({ title: "Test event dispatched", description: `${result.matched} matching webhook${result.matched === 1 ? "" : "s"}.`, variant: "success" });
      void loadConsole();
    } catch (caught) {
      toast({ title: "Unable to dispatch test event", description: errorMessage(caught), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function copyText(text: string, title = "Copied") {
    try {
      await window.navigator.clipboard.writeText(text);
      setCopied(text);
      toast({ title, variant: "success" });
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      toast({ title: "Clipboard unavailable", variant: "warning" });
    }
  }

  return (
    <div className="flex min-h-0 flex-col">
      {/* ── Dark hero ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0f1117 0%,#161b27 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative px-6 pt-7 lg:px-8">
          {/* Title row */}
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-center gap-4">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: "linear-gradient(135deg,#ffe45c 0%,#ffd400 46%,#f6b900 100%)",
                  boxShadow: "0 0 20px rgba(255,212,0,0.35)",
                }}
              >
                <Plug className="size-6 text-[#111111]" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Platform</p>
                <h1 className="text-2xl font-black text-white">Integrations</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <button type="button" onClick={() => void loadConsole()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.07] px-4 text-sm font-black text-white transition hover:bg-white/[0.12]">
                <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden="true" />
                Refresh
              </button>
              <PermissionGate permission="manage:integrations">
                <button type="button" onClick={() => openProvider(providerTemplates[0])} className="tb-yellow-button inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-black">
                  <Sparkles className="size-4" aria-hidden="true" />
                  Connect OmoFlow
                </button>
              </PermissionGate>
            </div>
          </div>

          {/* KPI chips */}
          <div className="mt-5 grid grid-cols-3 gap-2 xl:grid-cols-6">
            <HeroChip label="Integrations" value={metrics.activeIntegrations} icon={Plug} tone="yellow" loading={loading} />
            <HeroChip label="Providers" value={metrics.providers} icon={Globe2} tone="blue" loading={loading} />
            <HeroChip label="Webhooks" value={metrics.healthyWebhooks} icon={WebhookIcon} tone="green" loading={loading} />
            <HeroChip label="Workflows" value={metrics.activeWorkflows} icon={WorkflowIcon} tone="blue" loading={loading} />
            <HeroChip label="Agents" value={metrics.liveAgents} icon={Bot} tone="blue" loading={loading} />
            <HeroChip label="Failed" value={metrics.failedDeliveries} icon={AlertTriangle} tone={metrics.failedDeliveries > 0 ? "red" : "green"} loading={loading} />
          </div>

          {/* Tab bar */}
          <div className="mt-5 flex gap-1 overflow-x-auto tb-scrollbar">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-black transition",
                    active
                      ? "bg-background text-foreground shadow-[0_-1px_0_0_var(--line)]"
                      : "text-white/45 hover:bg-white/[0.08] hover:text-white/80",
                  )}
                >
                  {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Filter strip ── */}
      <div className="border-b border-line bg-panel px-6 py-3 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex-1" style={{ minWidth: 200, maxWidth: 320 }}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search providers, workflows, webhooks…"
              className="h-9 w-full rounded-lg border border-line bg-background pl-9 pr-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary"
            />
          </label>
          <HealthPill label="Integrations" status={moduleHealth.integrations?.status} />
          <HealthPill label="Workflows" status={moduleHealth.workflows?.status} />
          <HealthPill label="AI" status={moduleHealth.ai?.status} />
        </div>
      </div>

      {/* ── Error ── */}
      {error ? (
        <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 lg:mx-8">
          {error}
        </div>
      ) : null}

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-auto bg-background px-6 py-5 tb-scrollbar lg:px-8">
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <SkeletonBlock className="h-[320px]" />
            <SkeletonBlock className="h-[320px]" />
            <SkeletonBlock className="h-[320px]" />
          </div>
        ) : (
          <>
            {activeTab === "catalog" ? (
            <CatalogTab
              canManage={canManageIntegrations}
              integrations={filteredIntegrations}
              onDelete={onDeleteIntegration}
              onOpenProvider={openProvider}
              onRotate={(integration) => {
                setSecretRotation({ type: "integration", id: integration.id, label: integration.name });
                setSecretKey(integration.secretKeys?.[0] ?? "apiKey");
                setSecretValue("");
              }}
              onSelect={setSelectedIntegrationId}
              onSync={onSyncIntegration}
              onToggle={onToggleIntegration}
              providerTemplates={providerTemplates}
              saving={saving}
              selectedIntegrationId={selectedIntegrationId}
            />
          ) : null}

          {activeTab === "omoflow" ? (
            <OmoFlowTab
              canManage={canManageIntegrations}
              integration={omoflowIntegration}
              onConnect={() => openProvider(providerTemplates[0])}
              onCreateWebhook={openOmoFlowWebhook}
              onInstallTemplate={installOmoFlowTemplate}
              onProcessRuntimeEvent={onProcessOmoFlowRuntimeEvent}
              onRotate={() => {
                if (!omoflowIntegration) return;
                setSecretRotation({ type: "integration", id: omoflowIntegration.id, label: omoflowIntegration.name });
                setSecretKey(omoflowIntegration.secretKeys?.[0] ?? "accessToken");
                setSecretValue("");
              }}
              onSync={() => omoflowIntegration && onSyncIntegration(omoflowIntegration)}
              saving={saving}
            />
          ) : null}

          {activeTab === "automations" ? (
            <AutomationTab
              canManage={canManageWorkflows}
              draft={workflowDraft}
              onAddNode={addNode}
              onArchive={onArchiveWorkflow}
              onDelete={onDeleteWorkflow}
              onDragEnd={onDragEnd}
              onNew={() => setWorkflowDraft(emptyDraft())}
              onRemoveNode={removeNode}
              onRun={onRunWorkflow}
              onSave={saveWorkflow}
              onSelect={selectWorkflow}
              onUpdateDraft={(patch) => setWorkflowDraft((current) => ({ ...current, ...patch }))}
              onUpdateNode={updateNode}
              saving={saving}
              workflows={workflows}
            />
          ) : null}

          {activeTab === "webhooks" ? (
            <WebhooksTab
              canManage={canManageIntegrations}
              copied={copied}
              deliveries={deliveries}
              onCopy={copyText}
              onCreate={() => {
                setWebhookForm(emptyWebhookForm);
                setWebhookModalOpen(true);
              }}
              onDelete={onDeleteWebhook}
              onRetryDelivery={onRetryDelivery}
              onRotate={(webhook) => {
                setSecretRotation({ type: "webhook", id: webhook.id, label: webhook.name });
                setSecretKey("signingSecret");
                setSecretValue("");
              }}
              onSendTest={onSendTestEvent}
              onToggle={onToggleWebhook}
              saving={saving}
              webhooks={webhooks}
            />
          ) : null}

          {activeTab === "agents" ? (
            <AgentsTab
              agents={agents}
              aiSettings={aiSettings}
              canManage={canManageAi}
              onArchive={onArchiveAgent}
              onCreate={() => {
                setAgentForm({
                  ...defaultAgentForm,
                  provider: aiSettings?.defaultProvider ?? defaultAgentForm.provider,
                  model: aiSettings?.defaultModel ?? defaultAgentForm.model,
                });
                setAgentModalOpen(true);
              }}
              onDelete={onDeleteAgent}
              onSaveSettings={onUpdateAiSettings}
              onSettingsChange={setAiSettings}
              saving={saving}
            />
          ) : null}

          {activeTab === "activity" ? (
            <ActivityTab
              deadLetterRuns={deadLetterRuns}
              deliveries={deliveries}
              integrationLogs={integrationLogs}
              integrations={integrations}
              onCancelRun={onCancelRun}
              onInspectRun={onInspectRun}
              onRequeueRun={onRequeueRun}
              onRetryDelivery={onRetryDelivery}
              onRetryRun={onRetryRun}
              onSelectIntegration={setSelectedIntegrationId}
              saving={saving}
              selectedIntegrationId={selectedIntegrationId}
              selectedRunId={selectedRunId}
              selectedRunLogs={selectedRunLogs}
              workflowRuns={workflowRuns}
            />
          ) : null}
        </>
        )}
      </div>

      <BrandedModal
        open={integrationModalOpen}
        onClose={() => setIntegrationModalOpen(false)}
        title="Connect provider"
        description="Secrets are encrypted by the backend and remain write-only in this console."
      >
        <form onSubmit={onSubmitIntegration} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Provider">
              <select value={integrationForm.provider} onChange={(event) => setIntegrationForm((form) => ({ ...form, provider: event.target.value as IntegrationProvider }))} className={fieldClass}>
                {["CUSTOM", "SLACK", "GITHUB", "GITLAB", "BITBUCKET", "GOOGLE", "MICROSOFT", "ZOOM", "OPENAI", "ANTHROPIC", "ZAPIER"].map((provider) => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Name">
              <input required value={integrationForm.name} onChange={(event) => setIntegrationForm((form) => ({ ...form, name: event.target.value }))} className={fieldClass} />
            </FormField>
            <FormField label="External account">
              <input value={integrationForm.externalAccountId} onChange={(event) => setIntegrationForm((form) => ({ ...form, externalAccountId: event.target.value }))} className={fieldClass} />
            </FormField>
            <FormField label="Base URL">
              <input value={integrationForm.baseUrl} onChange={(event) => setIntegrationForm((form) => ({ ...form, baseUrl: event.target.value }))} className={fieldClass} placeholder="https://api.provider.com" />
            </FormField>
            <FormField label="Socket URL">
              <input value={integrationForm.socketUrl} onChange={(event) => setIntegrationForm((form) => ({ ...form, socketUrl: event.target.value }))} className={fieldClass} placeholder="https://socket.provider.com" />
            </FormField>
            <FormField label="Auth header">
              <input value={integrationForm.authHeader} onChange={(event) => setIntegrationForm((form) => ({ ...form, authHeader: event.target.value }))} className={fieldClass} />
            </FormField>
          </div>
          <FormField label="Scopes">
            <input value={integrationForm.scopes} onChange={(event) => setIntegrationForm((form) => ({ ...form, scopes: event.target.value }))} className={fieldClass} />
          </FormField>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Secret key">
              <input value={integrationForm.secretKey} onChange={(event) => setIntegrationForm((form) => ({ ...form, secretKey: event.target.value }))} className={fieldClass} placeholder="apiKey" />
            </FormField>
            <FormField label="Secret value">
              <input value={integrationForm.secretValue} onChange={(event) => setIntegrationForm((form) => ({ ...form, secretValue: event.target.value }))} className={fieldClass} type="password" autoComplete="new-password" />
            </FormField>
          </div>
          <FormField label="Config JSON">
            <textarea value={integrationForm.configJson} onChange={(event) => setIntegrationForm((form) => ({ ...form, configJson: event.target.value }))} rows={10} className={cn(fieldClass, "h-auto font-mono text-xs normal-case tracking-normal")} />
          </FormField>
          <label className="flex items-center gap-2 text-sm font-bold text-foreground">
            <input type="checkbox" checked={integrationForm.enabled} onChange={(event) => setIntegrationForm((form) => ({ ...form, enabled: event.target.checked }))} />
            Enabled
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIntegrationModalOpen(false)} className="tb-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving === "integration"} className="tb-btn-primary">
              {saving === "integration" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plug className="size-4" aria-hidden="true" />}
              Connect
            </button>
          </div>
        </form>
      </BrandedModal>

      <BrandedModal
        open={webhookModalOpen}
        onClose={() => setWebhookModalOpen(false)}
        title="Create outgoing webhook"
        description="TaskBricks signs outbound JSON events with HMAC SHA-256."
      >
        <form onSubmit={onSubmitWebhook} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Name">
              <input required value={webhookForm.name} onChange={(event) => setWebhookForm((form) => ({ ...form, name: event.target.value }))} className={fieldClass} />
            </FormField>
            <FormField label="URL">
              <input required value={webhookForm.url} onChange={(event) => setWebhookForm((form) => ({ ...form, url: event.target.value }))} className={fieldClass} placeholder="https://example.com/webhooks/taskbricks" />
            </FormField>
          </div>
          <FormField label="Description">
            <input value={webhookForm.description} onChange={(event) => setWebhookForm((form) => ({ ...form, description: event.target.value }))} className={fieldClass} />
          </FormField>
          <FormField label="Events">
            <input required value={webhookForm.events} onChange={(event) => setWebhookForm((form) => ({ ...form, events: event.target.value }))} className={fieldClass} />
          </FormField>
          <FormField label="Optional signing secret">
            <input value={webhookForm.secret} onChange={(event) => setWebhookForm((form) => ({ ...form, secret: event.target.value }))} className={fieldClass} type="password" autoComplete="new-password" />
          </FormField>
          <label className="flex items-center gap-2 text-sm font-bold text-foreground">
            <input type="checkbox" checked={webhookForm.enabled} onChange={(event) => setWebhookForm((form) => ({ ...form, enabled: event.target.checked }))} />
            Enabled
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setWebhookModalOpen(false)} className="tb-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving === "webhook"} className="tb-btn-primary">
              {saving === "webhook" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <WebhookIcon className="size-4" aria-hidden="true" />}
              Create webhook
            </button>
          </div>
        </form>
      </BrandedModal>

      <BrandedModal
        open={agentModalOpen}
        onClose={() => setAgentModalOpen(false)}
        title="Create AI agent"
        description="Agents can be attached to workflows for summaries, planning, risk analysis, and OmoFlow meeting handoff."
      >
        <form onSubmit={onSubmitAgent} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Name">
              <input required value={agentForm.name} onChange={(event) => setAgentForm((form) => ({ ...form, name: event.target.value }))} className={fieldClass} />
            </FormField>
            <FormField label="Type">
              <input value={agentForm.type} onChange={(event) => setAgentForm((form) => ({ ...form, type: event.target.value }))} className={fieldClass} />
            </FormField>
            <FormField label="Provider">
              <input value={agentForm.provider} onChange={(event) => setAgentForm((form) => ({ ...form, provider: event.target.value }))} className={fieldClass} />
            </FormField>
            <FormField label="Model">
              <input value={agentForm.model} onChange={(event) => setAgentForm((form) => ({ ...form, model: event.target.value }))} className={fieldClass} />
            </FormField>
            <FormField label="Temperature">
              <input value={agentForm.temperature} onChange={(event) => setAgentForm((form) => ({ ...form, temperature: event.target.value }))} className={fieldClass} type="number" min="0" max="2" step="0.1" />
            </FormField>
            <FormField label="Max tokens">
              <input value={agentForm.maxOutputTokens} onChange={(event) => setAgentForm((form) => ({ ...form, maxOutputTokens: event.target.value }))} className={fieldClass} type="number" min="1" max="16000" />
            </FormField>
          </div>
          <FormField label="Description">
            <input value={agentForm.description} onChange={(event) => setAgentForm((form) => ({ ...form, description: event.target.value }))} className={fieldClass} />
          </FormField>
          <FormField label="Tools">
            <input value={agentForm.tools} onChange={(event) => setAgentForm((form) => ({ ...form, tools: event.target.value }))} className={fieldClass} />
          </FormField>
          <FormField label="System prompt">
            <textarea value={agentForm.systemPrompt} onChange={(event) => setAgentForm((form) => ({ ...form, systemPrompt: event.target.value }))} rows={8} className={cn(fieldClass, "h-auto normal-case tracking-normal")} />
          </FormField>
          <label className="flex items-center gap-2 text-sm font-bold text-foreground">
            <input type="checkbox" checked={agentForm.enabled} onChange={(event) => setAgentForm((form) => ({ ...form, enabled: event.target.checked }))} />
            Enabled
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAgentModalOpen(false)} className="tb-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving === "agent"} className="tb-btn-primary">
              {saving === "agent" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Bot className="size-4" aria-hidden="true" />}
              Create agent
            </button>
          </div>
        </form>
      </BrandedModal>

      <BrandedModal
        open={Boolean(secretRotation)}
        onClose={() => setSecretRotation(null)}
        title="Rotate secret"
        description="The value is sent once and stored encrypted by the backend."
      >
        <form onSubmit={onRotateSecret} className="grid gap-4">
          <div className="rounded-2xl border border-line bg-panel-muted p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-ink-soft">Target</p>
            <p className="mt-1 text-sm font-black text-foreground">{secretRotation?.label}</p>
          </div>
          {secretRotation?.type === "integration" ? (
            <FormField label="Secret key">
              <input required value={secretKey} onChange={(event) => setSecretKey(event.target.value)} className={fieldClass} />
            </FormField>
          ) : null}
          <FormField label="Secret value">
            <input required={secretRotation?.type === "integration"} value={secretValue} onChange={(event) => setSecretValue(event.target.value)} className={fieldClass} type="password" autoComplete="new-password" />
          </FormField>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSecretRotation(null)} className="tb-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving === "secret"} className="tb-btn-primary">
              {saving === "secret" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
              Rotate
            </button>
          </div>
        </form>
      </BrandedModal>
    </div>
  );
}

function CatalogTab({
  canManage,
  integrations,
  onDelete,
  onOpenProvider,
  onRotate,
  onSelect,
  onSync,
  onToggle,
  providerTemplates,
  saving,
  selectedIntegrationId,
}: {
  canManage: boolean;
  integrations: Integration[];
  onDelete: (integration: Integration) => void;
  onOpenProvider: (template: ProviderTemplate) => void;
  onRotate: (integration: Integration) => void;
  onSelect: (id: string) => void;
  onSync: (integration: Integration) => void;
  onToggle: (integration: Integration) => void;
  providerTemplates: ProviderTemplate[];
  saving: string;
  selectedIntegrationId: string;
}) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providerTemplates.map((template) => (
          <ProviderTemplateCard key={template.key} canManage={canManage} template={template} onConnect={() => onOpenProvider(template)} />
        ))}
      </section>

      <SurfaceCard title="Connected providers">
        {integrations.length ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                active={selectedIntegrationId === integration.id}
                canManage={canManage}
                integration={integration}
                onDelete={() => onDelete(integration)}
                onRotate={() => onRotate(integration)}
                onSelect={() => onSelect(integration.id)}
                onSync={() => onSync(integration)}
                onToggle={() => onToggle(integration)}
                saving={saving}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={Plug} title="No integrations connected" message="Connect OmoFlow, Slack, GitHub, OpenAI, or a custom provider." />
        )}
      </SurfaceCard>
    </div>
  );
}

function ProviderTemplateCard({ canManage, onConnect, template }: { canManage: boolean; onConnect: () => void; template: ProviderTemplate }) {
  const Icon = template.icon;
  const isOmoFlow = template.key === "omoflow";
  return (
    <section
      className={cn(
        "group relative flex min-h-[292px] flex-col overflow-hidden rounded-2xl border bg-panel shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_24px_70px_rgba(17,17,17,0.12)]",
        isOmoFlow ? "border-[#111111] bg-[#111111] text-white" : "border-line text-foreground",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1", isOmoFlow ? "bg-primary" : "bg-[#111111] opacity-80")} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_16px_36px_rgba(255,212,0,0.22)]",
              isOmoFlow ? "bg-primary text-[#111111]" : "bg-primary text-[#111111]",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <span
            className={cn(
              "inline-flex h-7 items-center rounded-full border px-2.5 text-[10px] font-black uppercase tracking-[0.12em]",
              isOmoFlow ? "border-primary/40 bg-primary/10 text-primary" : "border-line bg-panel-muted text-ink-soft",
            )}
          >
            {template.provider}
          </span>
        </div>
        <div className="mt-5">
          <h2 className={cn("text-2xl font-black tracking-normal", isOmoFlow ? "text-white" : "text-foreground")}>{template.label}</h2>
          <p className={cn("mt-2 min-h-[66px] text-sm font-semibold leading-relaxed", isOmoFlow ? "text-white/72" : "text-ink-soft")}>
            {template.description}
          </p>
        </div>
        <div className="mt-auto pt-5">
          <div className="flex flex-wrap gap-2">
            {template.scopes.slice(0, 5).map((scope) => (
              <span
                key={scope}
                className={cn(
                  "rounded-lg border px-2 py-1 text-[11px] font-black",
                  isOmoFlow ? "border-white/10 bg-white/[0.06] text-white/70" : "border-line bg-panel-muted text-ink-soft",
                )}
              >
                {scope}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onConnect}
            disabled={!canManage}
            className={cn(
              "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-black transition disabled:opacity-50",
              isOmoFlow
                ? "border-primary bg-primary text-[#111111] hover:bg-primary/90"
                : "border-[#111111] bg-[#111111] text-white hover:bg-[#2a2a2a]",
            )}
          >
            <Plus className="size-4" aria-hidden="true" />
            Connect provider
          </button>
        </div>
      </div>
    </section>
  );
}

function IntegrationCard({
  active,
  canManage,
  integration,
  onDelete,
  onRotate,
  onSelect,
  onSync,
  onToggle,
  saving,
}: {
  active: boolean;
  canManage: boolean;
  integration: Integration;
  onDelete: () => void;
  onRotate: () => void;
  onSelect: () => void;
  onSync: () => void;
  onToggle: () => void;
  saving: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid gap-4 rounded-2xl border bg-background p-4 text-left shadow-sm transition",
        active ? "border-primary shadow-[0_18px_60px_rgba(255,212,0,0.16)]" : "border-line hover:border-primary/50",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black text-foreground">{integration.name}</h3>
            <StatusBadge tone={integration.status === "ACTIVE" ? "success" : integration.status === "ERROR" ? "danger" : "neutral"}>{integration.status}</StatusBadge>
          </div>
          <p className="mt-1 text-xs font-bold text-ink-soft">{providerDisplay(integration)} · {integration.externalAccountId || "tenant scoped"}</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/20 text-[#111111]">
          <Plug className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Scopes" value={integration.scopes.length} />
        <MiniStat label="Secrets" value={integration.secretKeys?.length ?? 0} />
        <MiniStat label="Logs" value={integration._count?.logs ?? 0} />
      </div>
      {integration.lastError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{integration.lastError}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <ActionButton disabled={!canManage || saving === `sync-${integration.id}`} icon={RefreshCw} label="Sync" onClick={onSync} />
        <ActionButton disabled={!canManage || saving === integration.id} icon={integration.enabled ? Pause : Play} label={integration.enabled ? "Disable" : "Enable"} onClick={onToggle} />
        <ActionButton disabled={!canManage} icon={KeyRound} label="Rotate" onClick={onRotate} />
        <ActionButton danger disabled={!canManage || saving === `delete-${integration.id}`} icon={Trash2} label="Delete" onClick={onDelete} />
      </div>
    </button>
  );
}

function OmoFlowTab({
  canManage,
  integration,
  onConnect,
  onCreateWebhook,
  onInstallTemplate,
  onProcessRuntimeEvent,
  onRotate,
  onSync,
  saving,
}: {
  canManage: boolean;
  integration?: Integration;
  onConnect: () => void;
  onCreateWebhook: () => void;
  onInstallTemplate: (template: "meeting-actions" | "risk-review" | "sprint-ceremony") => void;
  onProcessRuntimeEvent: (projectId?: string) => void;
  onRotate: () => void;
  onSync: () => void;
  saving: string;
}) {
  const baseUrl = omoflowBaseUrl(integration);
  const socketUrl = omoflowSocketUrl(integration);
  const [runtimeProjectId, setRuntimeProjectId] = useState("");
  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="overflow-hidden rounded-2xl border border-line bg-[#111111] text-white shadow-sm">
        <div className="relative p-6">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,212,0,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,212,0,0.12)_1px,transparent_1px)] bg-[size:42px_42px] opacity-35" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-[#111111] shadow-[0_22px_70px_rgba(255,212,0,0.28)]">
                <Sparkles className="size-7" aria-hidden="true" />
              </span>
              <StatusBadge tone={integration ? "success" : "warning"}>{integration ? "Connected" : "Not connected"}</StatusBadge>
            </div>
            <h2 className="mt-6 text-3xl font-black">OmoFlow bridge</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              Meetings, agendas, video rooms, group chat, calendars, attendance, and post-meeting work handoff connected to TaskBricks projects and tasks.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <EndpointCard label="API" value={baseUrl} />
              <EndpointCard label="Socket" value={socketUrl} />
              <EndpointCard label="Meetings" value="/api/meetings" />
              <EndpointCard label="Video" value="/api/video" />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {integration ? (
                <>
                  <button type="button" onClick={onSync} disabled={!canManage || saving === `sync-${integration.id}`} className="tb-btn-primary">
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Sync OmoFlow
                  </button>
                  <button type="button" onClick={onRotate} disabled={!canManage} className="tb-btn-secondary bg-white text-[#111111] hover:bg-white/90">
                    <KeyRound className="size-4" aria-hidden="true" />
                    Rotate token
                  </button>
                </>
              ) : (
                <button type="button" onClick={onConnect} disabled={!canManage} className="tb-btn-primary">
                  <Plug className="size-4" aria-hidden="true" />
                  Connect OmoFlow
                </button>
              )}
              <button type="button" onClick={onCreateWebhook} disabled={!canManage || !integration} className="tb-btn-secondary bg-white text-[#111111] hover:bg-white/90 disabled:opacity-50">
                <WebhookIcon className="size-4" aria-hidden="true" />
                Handoff webhook
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5">
        <SurfaceCard title="Automation templates">
          <div className="grid gap-3">
            <TemplateButton icon={MessageSquare} title="Meeting actions" text="Meeting completed to tasks, comments, owners, and activity." onClick={() => onInstallTemplate("meeting-actions")} />
            <TemplateButton icon={AlertTriangle} title="Risk review room" text="Critical risk to OmoFlow review meeting and escalation." onClick={() => onInstallTemplate("risk-review")} />
            <TemplateButton icon={Rocket} title="Sprint ceremony" text="Sprint planning to recurring ceremonies and summary tasks." onClick={() => onInstallTemplate("sprint-ceremony")} />
          </div>
        </SurfaceCard>

        <SurfaceCard title="Capability map">
          <div className="grid gap-2">
            {["Meeting notes to task evidence", "Agenda decisions to owners", "Video rooms from project risks", "Group chat to project activity", "Calendar ceremonies from sprint planning", "AI summary from OpenAI-backed agent"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-line bg-background px-3 py-2.5">
                <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                <span className="text-sm font-bold text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Runtime import">
          <div className="grid gap-3">
            <p className="text-sm font-semibold leading-6 text-ink-soft">
              Process an OmoFlow meeting event through the backend runtime. Add a project ID to create mapped tasks from meeting action items.
            </p>
            <input
              value={runtimeProjectId}
              onChange={(event) => setRuntimeProjectId(event.target.value)}
              placeholder="Project ID for task mapping"
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() => onProcessRuntimeEvent(runtimeProjectId)}
              disabled={!canManage || saving === "omoflow-runtime"}
              className="tb-btn-primary justify-center disabled:opacity-50"
            >
              {saving === "omoflow-runtime" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Process OmoFlow event
            </button>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function AutomationTab({
  canManage,
  draft,
  onAddNode,
  onArchive,
  onDelete,
  onDragEnd,
  onNew,
  onRemoveNode,
  onRun,
  onSave,
  onSelect,
  onUpdateDraft,
  onUpdateNode,
  saving,
  workflows,
}: {
  canManage: boolean;
  draft: WorkflowDraft;
  onAddNode: (template?: typeof nodeTemplates[number]) => void;
  onArchive: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onNew: () => void;
  onRemoveNode: (id: string) => void;
  onRun: () => void;
  onSave: () => void;
  onSelect: (workflow: Workflow) => void;
  onUpdateDraft: (patch: Partial<WorkflowDraft>) => void;
  onUpdateNode: (id: string, patch: Partial<DraftNode>) => void;
  saving: string;
  workflows: Workflow[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <SurfaceCard title="Workflow library" action={<button type="button" onClick={onNew} className="tb-btn-secondary"><Plus className="size-4" />New</button>}>
        <div className="grid max-h-[740px] gap-3 overflow-y-auto pr-1 tb-scrollbar">
          {workflows.length ? workflows.map((workflow) => (
            <button key={workflow.id} type="button" onClick={() => onSelect(workflow)} className={cn("rounded-2xl border p-4 text-left transition", draft.id === workflow.id ? "border-primary bg-primary/10" : "border-line bg-background hover:border-primary/40")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-foreground">{workflow.name}</h3>
                  <p className="mt-1 text-xs font-bold text-ink-soft">{workflow.entityType} · {workflow.eventType ?? workflow.triggerType}</p>
                </div>
                <StatusBadge tone={workflow.archivedAt ? "neutral" : workflow.isActive ? "success" : "warning"}>{workflow.archivedAt ? "Archived" : workflow.isActive ? "Active" : "Paused"}</StatusBadge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <MiniStat label="Nodes" value={workflow.nodes.length} />
                <MiniStat label="Runs" value={workflow._count?.runs ?? 0} />
                <MiniStat label="Last" value={workflow.lastRunAt ? "Yes" : "No"} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton disabled={!canManage} icon={Archive} label={workflow.archivedAt ? "Restore" : "Archive"} onClick={() => onArchive(workflow)} />
                <ActionButton danger disabled={!canManage} icon={Trash2} label="Delete" onClick={() => onDelete(workflow)} />
              </div>
            </button>
          )) : <EmptyState icon={WorkflowIcon} title="No workflows yet" />}
        </div>
      </SurfaceCard>

      <div className="grid gap-5">
        <SurfaceCard title="Workflow designer">
          <div className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-4">
              <FormField label="Name" className="lg:col-span-2">
                <input value={draft.name} onChange={(event) => onUpdateDraft({ name: event.target.value })} className={fieldClass} />
              </FormField>
              <FormField label="Entity">
                <input value={draft.entityType} onChange={(event) => onUpdateDraft({ entityType: event.target.value.toUpperCase() })} className={fieldClass} />
              </FormField>
              <FormField label="Event">
                <input value={draft.eventType} onChange={(event) => onUpdateDraft({ eventType: event.target.value.toUpperCase() })} className={fieldClass} />
              </FormField>
            </div>
            <FormField label="Description">
              <input value={draft.description} onChange={(event) => onUpdateDraft({ description: event.target.value })} className={fieldClass} />
            </FormField>
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
              <FormField label="Trigger">
                <select value={draft.triggerType} onChange={(event) => onUpdateDraft({ triggerType: event.target.value })} className={fieldClass}>
                  {["EVENT", "MANUAL", "SCHEDULE", "WEBHOOK", "APPROVAL"].map((type) => <option key={type}>{type}</option>)}
                </select>
              </FormField>
              <FormField label="Config JSON">
                <input value={draft.configText} onChange={(event) => onUpdateDraft({ configText: event.target.value })} className={cn(fieldClass, "font-mono text-xs normal-case tracking-normal")} />
              </FormField>
              <label className="flex h-full items-end gap-2 pb-3 text-sm font-bold text-foreground">
                <input type="checkbox" checked={draft.isActive} onChange={(event) => onUpdateDraft({ isActive: event.target.checked })} />
                Active
              </label>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Node graph"
          action={
            <div className="flex flex-wrap gap-2">
              {nodeTemplates.map((template) => (
                <button key={template.name} type="button" onClick={() => onAddNode(template)} className="tb-btn-secondary">
                  <template.icon className="size-4" aria-hidden="true" />
                  {template.type}
                </button>
              ))}
            </div>
          }
        >
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={draft.nodes.map((node) => node.id)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-3">
                {draft.nodes.map((node, index) => (
                  <SortableNodeRow key={node.id} canManage={canManage} index={index} node={node} onRemove={() => onRemoveNode(node.id)} onUpdate={(patch) => onUpdateNode(node.id, patch)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onRun} disabled={!canManage || !draft.id || saving === `run-${draft.id}`} className="tb-btn-secondary">
              <Play className="size-4" aria-hidden="true" />
              Run
            </button>
            <button type="button" onClick={onSave} disabled={!canManage || saving === "workflow"} className="tb-btn-primary">
              {saving === "workflow" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              Save workflow
            </button>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function SortableNodeRow({ canManage, index, node, onRemove, onUpdate }: { canManage: boolean; index: number; node: DraftNode; onRemove: () => void; onUpdate: (patch: Partial<DraftNode>) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-2xl border border-line bg-background p-4 shadow-sm", isDragging && "border-primary shadow-[0_18px_70px_rgba(17,17,17,0.18)]")}
    >
      <div className="grid gap-3 lg:grid-cols-[auto_1.3fr_0.8fr_0.9fr_auto]">
        <button type="button" disabled={!canManage} className="flex size-10 items-center justify-center rounded-xl border border-line bg-panel-muted text-ink-soft" {...attributes} {...listeners}>
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <FormField label={`Node ${index + 1}`}>
          <input value={node.name} onChange={(event) => onUpdate({ name: event.target.value })} className={fieldClass} />
        </FormField>
        <FormField label="Type">
          <select value={node.type} onChange={(event) => onUpdate({ type: event.target.value })} className={fieldClass}>
            {["TRIGGER", "CONDITION", "ACTION", "APPROVAL", "WAIT"].map((type) => <option key={type}>{type}</option>)}
          </select>
        </FormField>
        <FormField label="Action">
          <input value={node.actionType ?? ""} onChange={(event) => onUpdate({ actionType: event.target.value })} className={fieldClass} />
        </FormField>
        <button type="button" disabled={!canManage} onClick={onRemove} className="mt-5 flex size-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700">
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[0.6fr_0.6fr_0.8fr_2fr]">
        <FormField label="Retries">
          <input type="number" min="0" max="10" value={node.retryAttempts ?? 0} onChange={(event) => onUpdate({ retryAttempts: Number(event.target.value) })} className={fieldClass} />
        </FormField>
        <FormField label="Timeout">
          <input type="number" min="1" max="300" value={node.timeoutSeconds ?? 60} onChange={(event) => onUpdate({ timeoutSeconds: Number(event.target.value) })} className={fieldClass} />
        </FormField>
        <FormField label="Failure">
          <select value={node.onFailure ?? "STOP"} onChange={(event) => onUpdate({ onFailure: event.target.value })} className={fieldClass}>
            {["STOP", "CONTINUE", "RETRY", "ESCALATE"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </FormField>
        <FormField label="Config JSON">
          <input value={node.configText} onChange={(event) => onUpdate({ configText: event.target.value })} className={cn(fieldClass, "font-mono text-xs normal-case tracking-normal")} />
        </FormField>
      </div>
    </section>
  );
}

function WebhooksTab({
  canManage,
  copied,
  deliveries,
  onCopy,
  onCreate,
  onDelete,
  onRetryDelivery,
  onRotate,
  onSendTest,
  onToggle,
  saving,
  webhooks,
}: {
  canManage: boolean;
  copied: string;
  deliveries: WebhookDelivery[];
  onCopy: (text: string, title?: string) => void;
  onCreate: () => void;
  onDelete: (webhook: Webhook) => void;
  onRetryDelivery: (delivery: WebhookDelivery) => void;
  onRotate: (webhook: Webhook) => void;
  onSendTest: (webhook?: Webhook) => void;
  onToggle: (webhook: Webhook) => void;
  saving: string;
  webhooks: Webhook[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <SurfaceCard title="Outgoing webhooks" action={<button type="button" onClick={onCreate} disabled={!canManage} className="tb-btn-primary"><Plus className="size-4" />New webhook</button>}>
        {webhooks.length ? (
          <div className="grid gap-3">
            {webhooks.map((webhook) => (
              <section key={webhook.id} className="rounded-2xl border border-line bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-black text-foreground">{webhook.name}</h3>
                      <StatusBadge tone={webhook.enabled ? "success" : "neutral"}>{webhook.enabled ? "Enabled" : "Disabled"}</StatusBadge>
                      {webhook.failureCount ? <StatusBadge tone="danger">{webhook.failureCount} failures</StatusBadge> : null}
                    </div>
                    <p className="mt-1 truncate text-xs font-bold text-ink-soft">{webhook.url}</p>
                  </div>
                  <button type="button" onClick={() => onCopy(webhook.url)} className="flex size-9 items-center justify-center rounded-xl border border-line bg-panel-muted text-ink-soft">
                    {copied === webhook.url ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {webhook.events.map((event) => <span key={event} className="rounded-lg bg-primary/15 px-2 py-1 text-[11px] font-black text-[#111111]">{event}</span>)}
                </div>
                {webhook.lastError ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{webhook.lastError}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton disabled={!canManage || saving === webhook.id} icon={webhook.enabled ? Pause : Play} label={webhook.enabled ? "Disable" : "Enable"} onClick={() => onToggle(webhook)} />
                  <ActionButton disabled={!canManage} icon={WebhookIcon} label="Test" onClick={() => onSendTest(webhook)} />
                  <ActionButton disabled={!canManage} icon={KeyRound} label="Rotate" onClick={() => onRotate(webhook)} />
                  <ActionButton danger disabled={!canManage || saving === `delete-${webhook.id}`} icon={Trash2} label="Delete" onClick={() => onDelete(webhook)} />
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState icon={WebhookIcon} title="No outgoing webhooks" message="Create signed event delivery for OmoFlow and external systems." />
        )}
      </SurfaceCard>

      <SurfaceCard title="Recent deliveries">
        <div className="grid max-h-[660px] gap-3 overflow-y-auto pr-1 tb-scrollbar">
          {deliveries.length ? deliveries.slice(0, 12).map((delivery) => (
            <DeliveryRow key={delivery.id} delivery={delivery} onRetry={() => onRetryDelivery(delivery)} saving={saving === delivery.id} />
          )) : <EmptyState icon={Activity} title="No delivery activity" />}
        </div>
      </SurfaceCard>
    </div>
  );
}

function AgentsTab({
  agents,
  aiSettings,
  canManage,
  onArchive,
  onCreate,
  onDelete,
  onSaveSettings,
  onSettingsChange,
  saving,
}: {
  agents: AiAgent[];
  aiSettings: AiSettings | null;
  canManage: boolean;
  onArchive: (agent: AiAgent) => void;
  onCreate: () => void;
  onDelete: (agent: AiAgent) => void;
  onSaveSettings: () => void;
  onSettingsChange: (settings: AiSettings) => void;
  saving: string;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <SurfaceCard title="AI controls">
        {aiSettings ? (
          <div className="grid gap-4">
            <label className="flex items-center gap-2 text-sm font-bold text-foreground">
              <input type="checkbox" checked={aiSettings.enabled} onChange={(event) => onSettingsChange({ ...aiSettings, enabled: event.target.checked })} />
              Tenant AI enabled
            </label>
            <FormField label="Default provider">
              <input value={aiSettings.defaultProvider} onChange={(event) => onSettingsChange({ ...aiSettings, defaultProvider: event.target.value })} className={fieldClass} />
            </FormField>
            <FormField label="Default model">
              <input value={aiSettings.defaultModel} onChange={(event) => onSettingsChange({ ...aiSettings, defaultModel: event.target.value })} className={fieldClass} />
            </FormField>
            <FormField label="Allowed providers">
              <input value={aiSettings.allowedProviders.join(", ")} onChange={(event) => onSettingsChange({ ...aiSettings, allowedProviders: csv(event.target.value) })} className={fieldClass} />
            </FormField>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <FormField label="Monthly tokens">
                <input type="number" value={aiSettings.monthlyTokenLimit ?? ""} onChange={(event) => onSettingsChange({ ...aiSettings, monthlyTokenLimit: event.target.value ? Number(event.target.value) : null })} className={fieldClass} />
              </FormField>
              <FormField label="Retention days">
                <input type="number" value={aiSettings.dataRetentionDays} onChange={(event) => onSettingsChange({ ...aiSettings, dataRetentionDays: Number(event.target.value) })} className={fieldClass} />
              </FormField>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-foreground">
              <input type="checkbox" checked={aiSettings.redactSensitiveData} onChange={(event) => onSettingsChange({ ...aiSettings, redactSensitiveData: event.target.checked })} />
              Redact sensitive data
            </label>
            <button type="button" onClick={onSaveSettings} disabled={!canManage || saving === "ai-settings"} className="tb-btn-primary justify-center">
              {saving === "ai-settings" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save AI settings
            </button>
          </div>
        ) : (
          <EmptyState icon={Bot} title="AI settings unavailable" />
        )}
      </SurfaceCard>

      <SurfaceCard title="Agent registry" action={<button type="button" onClick={onCreate} disabled={!canManage} className="tb-btn-primary"><Plus className="size-4" />New agent</button>}>
        {agents.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {agents.map((agent) => (
              <section key={agent.id} className="rounded-2xl border border-line bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-foreground">{agent.name}</h3>
                    <p className="mt-1 text-xs font-bold text-ink-soft">{agent.provider} · {agent.model} · {agent.type}</p>
                  </div>
                  <StatusBadge tone={agent.archivedAt ? "neutral" : agent.enabled ? "success" : "warning"}>{agent.archivedAt ? "Archived" : agent.enabled ? "Live" : "Paused"}</StatusBadge>
                </div>
                {agent.description ? <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{agent.description}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {agent.tools.slice(0, 4).map((tool) => <span key={tool} className="rounded-lg bg-panel-muted px-2 py-1 text-[11px] font-bold text-ink-soft">{tool}</span>)}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniStat label="Chats" value={agent._count?.conversations ?? 0} />
                  <MiniStat label="Actions" value={agent._count?.actions ?? 0} />
                  <MiniStat label="Usage" value={agent._count?.usageLogs ?? 0} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton disabled={!canManage || saving === agent.id} icon={Archive} label={agent.archivedAt ? "Restore" : "Archive"} onClick={() => onArchive(agent)} />
                  <ActionButton danger disabled={!canManage || saving === `delete-agent-${agent.id}`} icon={Trash2} label="Delete" onClick={() => onDelete(agent)} />
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState icon={Bot} title="No agents registered" message="Create an agent for OmoFlow meeting intelligence, risk review, sprint planning, or reporting." />
        )}
      </SurfaceCard>
    </div>
  );
}

function ActivityTab({
  deadLetterRuns,
  deliveries,
  integrationLogs,
  integrations,
  onCancelRun,
  onInspectRun,
  onRequeueRun,
  onRetryDelivery,
  onRetryRun,
  onSelectIntegration,
  saving,
  selectedIntegrationId,
  selectedRunId,
  selectedRunLogs,
  workflowRuns,
}: {
  deadLetterRuns: WorkflowRun[];
  deliveries: WebhookDelivery[];
  integrationLogs: IntegrationLog[];
  integrations: Integration[];
  onCancelRun: (run: WorkflowRun) => void;
  onInspectRun: (run: WorkflowRun) => void;
  onRequeueRun: (run: WorkflowRun) => void;
  onRetryDelivery: (delivery: WebhookDelivery) => void;
  onRetryRun: (run: WorkflowRun) => void;
  onSelectIntegration: (id: string) => void;
  saving: string;
  selectedIntegrationId: string;
  selectedRunId: string;
  selectedRunLogs: WorkflowRunLog[];
  workflowRuns: WorkflowRun[];
}) {
  const selectedRun = workflowRuns.find((run) => run.id === selectedRunId) ?? deadLetterRuns.find((run) => run.id === selectedRunId);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="grid gap-5">
      <SurfaceCard title="Workflow runs" action={<StatusBadge tone={deadLetterRuns.length ? "danger" : "success"}>{deadLetterRuns.length} dead-letter</StatusBadge>}>
        <div className="grid gap-3">
          {workflowRuns.length ? workflowRuns.map((run) => (
            <section key={run.id} className={cn("rounded-2xl border bg-background p-4", run.id === selectedRunId ? "border-primary shadow-[0_0_0_3px_rgba(255,212,0,0.16)]" : "border-line")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-foreground">{run.workflow?.name ?? run.workflowId}</h3>
                  <p className="mt-1 text-xs font-bold text-ink-soft">{run.entityType ?? "ENTITY"} · {run.eventType ?? run.triggerType ?? "MANUAL"} · {formatDateTime(run.createdAt)}</p>
                </div>
                <StatusBadge tone={runStatusTone(run.status)}>{run.status}</StatusBadge>
              </div>
              {run.error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{run.error}</p> : null}
              {run.logs?.length ? (
                <div className="mt-3 grid gap-2">
                  {run.logs.slice(0, 3).map((log) => (
                    <div key={log.id} className="rounded-xl bg-panel-muted px-3 py-2 text-xs font-bold text-ink-soft">
                      {log.level} · {log.message}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton disabled={saving === `logs-${run.id}`} icon={Database} label="Inspect" onClick={() => onInspectRun(run)} />
                <ActionButton disabled={saving === run.id || run.status === "RUNNING"} icon={RefreshCw} label="Retry" onClick={() => onRetryRun(run)} />
                <ActionButton disabled={saving === run.id || !["PENDING", "RUNNING"].includes(run.status)} icon={X} label="Cancel" onClick={() => onCancelRun(run)} />
              </div>
            </section>
          )) : <EmptyState icon={Activity} title="No workflow runs yet" />}
        </div>
      </SurfaceCard>

      <SurfaceCard title="Dead-letter queue">
        <div className="grid gap-3">
          {deadLetterRuns.length ? deadLetterRuns.map((run) => (
            <section key={run.id} className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-red-950">{run.workflow?.name ?? run.workflowId}</h3>
                  <p className="mt-1 text-xs font-bold text-red-700">{run.entityType ?? "ENTITY"} / {run.eventType ?? run.triggerType ?? "MANUAL"} / {formatDateTime(run.createdAt)}</p>
                </div>
                <StatusBadge tone="danger">{run.status}</StatusBadge>
              </div>
              {run.error ? <p className="mt-3 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700">{run.error}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton disabled={saving === `logs-${run.id}`} icon={Database} label="Inspect" onClick={() => onInspectRun(run)} />
                <ActionButton disabled={saving === `requeue-${run.id}`} icon={RefreshCw} label="Requeue" onClick={() => onRequeueRun(run)} />
              </div>
            </section>
          )) : <EmptyState icon={CheckCircle2} title="No failed runs" message="Dead-lettered automation failures will appear here for inspection and requeue." />}
        </div>
      </SurfaceCard>

      </div>

      <div className="grid gap-5">
        <SurfaceCard title="Selected run timeline">
          {selectedRun ? (
            <div className="grid gap-3">
              <div className="rounded-2xl border border-line bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-foreground">{selectedRun.workflow?.name ?? selectedRun.workflowId}</p>
                    <p className="mt-1 truncate text-xs font-bold text-ink-soft">{selectedRun.id}</p>
                  </div>
                  <StatusBadge tone={runStatusTone(selectedRun.status)}>{selectedRun.status}</StatusBadge>
                </div>
                {selectedRun.error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{selectedRun.error}</p> : null}
              </div>
              <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1 tb-scrollbar">
                {selectedRunLogs.length ? selectedRunLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-line bg-background px-3 py-2">
                    <p className="text-xs font-black text-foreground">{log.message}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">{log.level} / {log.nodeId ?? "runtime"} / {formatDateTime(log.createdAt)}</p>
                    {log.data ? <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-[#111111] p-2 text-[10px] text-white/80 tb-scrollbar">{safeJson(log.data)}</pre> : null}
                  </div>
                )) : <EmptyState icon={Database} title="No logs loaded" message="Inspect a workflow run to load detailed runtime logs." />}
              </div>
            </div>
          ) : (
            <EmptyState icon={Database} title="Select a run" message="Open a recent or dead-lettered run to inspect runtime events." />
          )}
        </SurfaceCard>

        <SurfaceCard title="Integration logs" action={
          <select value={selectedIntegrationId} onChange={(event) => onSelectIntegration(event.target.value)} className="h-9 max-w-[200px] rounded-xl border border-line bg-background px-3 text-xs font-bold text-foreground">
            <option value="">Select integration</option>
            {integrations.map((integration) => <option key={integration.id} value={integration.id}>{integration.name}</option>)}
          </select>
        }>
          <div className="grid max-h-[340px] gap-2 overflow-y-auto pr-1 tb-scrollbar">
            {integrationLogs.length ? integrationLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-line bg-background px-3 py-2">
                <p className="text-xs font-black text-foreground">{log.eventType}</p>
                <p className="mt-1 text-xs text-ink-soft">{log.message}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">{log.level} · {formatDateTime(log.createdAt)}</p>
              </div>
            )) : <EmptyState icon={Database} title="No logs selected" />}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Webhook delivery queue">
          <div className="grid max-h-[340px] gap-3 overflow-y-auto pr-1 tb-scrollbar">
            {deliveries.length ? deliveries.slice(0, 8).map((delivery) => (
              <DeliveryRow key={delivery.id} delivery={delivery} onRetry={() => onRetryDelivery(delivery)} saving={saving === delivery.id} compact />
            )) : <EmptyState icon={WebhookIcon} title="No webhook deliveries" />}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function DeliveryRow({ compact, delivery, onRetry, saving }: { compact?: boolean; delivery: WebhookDelivery; onRetry: () => void; saving: boolean }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-background p-3", compact && "rounded-xl")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-foreground">{delivery.webhook?.name ?? delivery.webhookId}</p>
          <p className="mt-1 text-xs font-bold text-ink-soft">{delivery.eventType} · {formatDateTime(delivery.createdAt)}</p>
        </div>
        <StatusBadge tone={deliveryTone(delivery.status)}>{delivery.status}</StatusBadge>
      </div>
      {delivery.lastError ? <p className="mt-2 line-clamp-2 text-xs font-bold text-red-700">{delivery.lastError}</p> : null}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-ink-soft">{delivery.attempts} attempts</span>
        <button type="button" onClick={onRetry} disabled={saving || delivery.status === "DELIVERED"} className="h-8 rounded-xl border border-line bg-panel-muted px-3 text-[11px] font-black text-foreground disabled:opacity-50">
          {saving ? "Retrying" : "Retry"}
        </button>
      </div>
    </section>
  );
}

function HeroChip({
  icon: Icon,
  label,
  loading,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  loading: boolean;
  tone: "yellow" | "red" | "green" | "blue";
  value: number;
}) {
  const color =
    tone === "yellow" ? "#ffd400"
    : tone === "red" ? "#f87171"
    : tone === "green" ? "#34d399"
    : "#60a5fa";
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
      <Icon className="size-4 shrink-0" style={{ color }} aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-white/40">{label}</p>
        <p className="text-lg font-black leading-tight" style={{ color }}>{loading ? "—" : value}</p>
      </div>
    </div>
  );
}

function HealthPill({ label, status }: { label: string; status?: string }) {
  const ready = status === "ready";
  return (
    <span className={cn("inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black", ready ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line bg-panel-muted text-ink-soft")}>
      <span className={cn("size-2 rounded-full", ready ? "bg-emerald-500" : "bg-amber-400")} />
      {label}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel-muted px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">{label}</p>
      <p className="mt-1 text-sm font-black text-foreground">{value}</p>
    </div>
  );
}

function EndpointCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-white/75">{value}</p>
    </div>
  );
}

function TemplateButton({ icon: Icon, onClick, text, title }: { icon: LucideIcon; onClick: () => void; text: string; title: string }) {
  return (
    <button type="button" onClick={onClick} className="group flex items-center gap-3 rounded-2xl border border-line bg-background p-3 text-left transition hover:border-primary/70 hover:bg-primary/10">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-[#111111]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-soft">{text}</span>
      </span>
      <ArrowRight className="size-4 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </button>
  );
}

function ActionButton({ danger, disabled, icon: Icon, label, onClick }: { danger?: boolean; disabled?: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[12px] font-black transition disabled:opacity-50",
        danger ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-line bg-panel text-foreground hover:bg-panel-muted",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

function settledPage<T>(result: PromiseSettledResult<{ data: T[] }>) {
  return result.status === "fulfilled" ? result.value.data : [];
}

function settledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : { status: "unavailable" } as ModuleStatus;
}

function createDraftNode(template: typeof nodeTemplates[number], index: number): DraftNode {
  return {
    id: createLocalId(),
    key: `${template.type.toLowerCase()}-${index + 1}`,
    name: template.name,
    type: template.type,
    actionType: template.actionType,
    configText: template.configText,
    sortOrder: index,
    enabled: true,
    retryAttempts: template.retryAttempts,
    timeoutSeconds: template.timeoutSeconds,
    onFailure: template.onFailure,
    positionX: 120 + index * 240,
    positionY: 120,
  };
}

function workflowToDraft(workflow: Workflow): WorkflowDraft {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description ?? "",
    entityType: workflow.entityType,
    triggerType: workflow.triggerType,
    eventType: workflow.eventType ?? "",
    isActive: workflow.isActive,
    configText: prettyJson(workflow.config ?? {}),
    nodes: workflow.nodes.map((node, index) => ({
      id: node.id ?? createLocalId(),
      key: node.key,
      name: node.name,
      type: node.type,
      actionType: node.actionType,
      configText: prettyJson(node.config ?? {}),
      sortOrder: node.sortOrder ?? index,
      enabled: node.enabled ?? true,
      retryAttempts: node.retryAttempts ?? 0,
      timeoutSeconds: node.timeoutSeconds ?? 60,
      dependsOn: node.dependsOn,
      onFailure: node.onFailure ?? "STOP",
      positionX: node.positionX ?? 120 + index * 240,
      positionY: node.positionY ?? 120,
    })),
  };
}

function serializeNode(node: DraftNode, index: number): WorkflowNode {
  return {
    key: node.key || `${node.type.toLowerCase()}-${index + 1}`,
    name: node.name,
    type: node.type,
    actionType: emptyToUndefined(node.actionType ?? ""),
    config: parseJsonObject(node.configText, `${node.name} config`),
    sortOrder: index,
    enabled: node.enabled ?? true,
    retryAttempts: Number(node.retryAttempts ?? 0),
    timeoutSeconds: Number(node.timeoutSeconds ?? 60),
    dependsOn: node.dependsOn,
    onFailure: emptyToUndefined(node.onFailure ?? ""),
    positionX: node.positionX ?? 120 + index * 240,
    positionY: node.positionY ?? 120,
  };
}

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseJsonObject(text: string, label: string) {
  try {
    const parsed = text.trim() ? JSON.parse(text) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON object`);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : `${label} is invalid JSON`);
  }
}

function createLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function csv(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function emptyToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isOmoFlowIntegration(integration: Integration) {
  const config = asRecord(integration.config);
  return config.app === "omoflow" || config.product === "OmoFlow" || integration.name.toLowerCase().includes("omoflow");
}

function providerDisplay(integration: Integration) {
  const config = asRecord(integration.config);
  if (typeof config.product === "string") return config.product;
  if (typeof config.app === "string") return config.app;
  if (typeof config.providerKey === "string") return config.providerKey;
  return integration.provider;
}

function omoflowBaseUrl(integration?: Integration) {
  const config = asRecord(integration?.config);
  return typeof config.baseUrl === "string" ? config.baseUrl : "http://localhost:5500/api";
}

function omoflowSocketUrl(integration?: Integration) {
  const config = asRecord(integration?.config);
  return typeof config.socketUrl === "string" ? config.socketUrl : "http://localhost:5500";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function deliveryTone(status: WebhookDeliveryStatus): "neutral" | "success" | "warning" | "danger" {
  if (status === "DELIVERED") return "success";
  if (status === "FAILED" || status === "CANCELLED") return "danger";
  if (status === "PENDING") return "warning";
  return "neutral";
}

function runStatusTone(status: WorkflowRunStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED" || status === "CANCELLED") return "danger";
  if (status === "RUNNING") return "info";
  if (status === "PENDING") return "warning";
  return "neutral";
}

function formatDateTime(value?: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

const fieldClass =
  "h-11 rounded-xl border border-line bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary";
