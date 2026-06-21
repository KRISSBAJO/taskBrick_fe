"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Database,
  Fingerprint,
  Gauge,
  KeyRound,
  Loader2,
  Lock,
  Play,
  Plus,
  RefreshCw,
  Save,
  ServerCog,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  assignRole,
  approveComplianceJob,
  cancelComplianceJob,
  createApiKey,
  createComplianceJob,
  createRole,
  deleteRole,
  getAdminOverview,
  getCurrentTenant,
  getSecurityPolicy,
  listSsoProviders,
  listApiKeys,
  listAuditLogs,
  listComplianceJobs,
  listNotificationPreferences,
  listPermissions,
  listRoles,
  listSecurityEvents,
  listSessions,
  listUsers,
  removeRoleFromUser,
  revokeApiKey,
  revokeSession,
  revokeUserSessions,
  runComplianceJob,
  rejectComplianceJob,
  updateTenantLoginPolicy,
  updateCurrentTenant,
  updateMyProfile,
  updateNotificationPreferences,
  updateRole,
  updateSecurityEvent,
  updateSecurityPolicy,
  upsertSsoProvider,
  type AdminOverview,
  type ApiKey,
  type AuditLog,
  type AuthSession,
  type ComplianceJob,
  type ComplianceJobStatus,
  type ComplianceJobType,
  type CreatedApiKey,
  type NotificationChannel,
  type NotificationPreference,
  type Permission,
  type Role,
  type SecurityEvent,
  type SecurityEventStatus,
  type SecurityPolicy,
  type SsoProvider,
  type Tenant,
  type TenantUser,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { getAccessProfile, roleLabel } from "@/lib/access-policy";
import { formatShortDate } from "@/lib/workspace-ui";

type AdminTab = "overview" | "tenant" | "roles" | "security" | "compliance" | "access" | "profile";

const tabs: Array<{ id: AdminTab; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "tenant", label: "Tenant", icon: ServerCog },
  { id: "roles", label: "Roles", icon: UserCog },
  { id: "security", label: "Security", icon: ShieldAlert },
  { id: "compliance", label: "Compliance", icon: ClipboardCheck },
  { id: "access", label: "Sessions and keys", icon: KeyRound },
  { id: "profile", label: "Profile and alerts", icon: Bell },
];

const channels: NotificationChannel[] = ["IN_APP", "EMAIL", "SMS", "PUSH", "WEBHOOK"];
const complianceTypes: ComplianceJobType[] = ["DATA_EXPORT", "DATA_DELETION", "RETENTION_PURGE"];
const complianceStatuses: ComplianceJobStatus[] = ["REQUESTED", "APPROVED", "REJECTED", "QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED", "EXPIRED"];
const loginMethods = ["PASSWORD", "GOOGLE", "MICROSOFT", "OIDC", "SAML"] as const;

const emptyOverview: AdminOverview = {
  apiKeys: {},
  auditLogs: 0,
  complianceJobs: {},
  securityChecks: {
    corsConfigured: false,
    corsOrigins: [],
    helmetEnabled: true,
    nodeEnv: "unknown",
    rateLimit: { authMax: 0, defaultMax: 0, ttlSeconds: 0 },
    requestBodyLimit: "",
    requestTimeoutMs: 0,
    secretsConfigured: { encryption: false, jwtAccess: false, jwtRefresh: false, webhookSigning: false },
    swaggerProductionSafe: false,
    validationPipe: { forbidNonWhitelisted: true, transform: true, whitelist: true },
  },
  securityEvents: { open: 0 },
  sessions: { active: 0, revoked: 0 },
  tenant: { createdAt: "", id: "", name: "", slug: "", status: "", updatedAt: "" },
  users: {},
};

export default function AdminPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const access = getAccessProfile(user);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
  const [ssoProviders, setSsoProviders] = useState<SsoProvider[]>([]);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [complianceJobs, setComplianceJobs] = useState<ComplianceJob[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState("");

  const canManageTenant = access.canManageTenant;
  const canManageRoles = access.canManageRoles;
  const canManageSecurity = access.canManageSecurity;
  const canManageCompliance = access.canManageCompliance;
  const visibleTabs = tabs.filter((tab) => {
    if (tab.id === "tenant") return access.canManageTenant;
    if (tab.id === "roles") return access.canManageRoles || access.canManageUsers;
    if (tab.id === "security") return access.canViewSecurity;
    if (tab.id === "compliance") return access.canViewCompliance;
    if (tab.id === "access") return access.canViewSecurity;
    return true;
  });

  const loadAdmin = useCallback(async () => {
    if (!access.canViewAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const [
        overviewData,
        tenantData,
        roleResult,
        permissionResult,
        userResult,
        policyResult,
        ssoResult,
        sessionResult,
        keyResult,
        complianceResult,
        eventResult,
        auditResult,
        preferenceResult,
      ] = await Promise.allSettled([
        getAdminOverview(auth.accessToken),
        getCurrentTenant(auth.accessToken),
        listRoles(auth.accessToken),
        listPermissions(auth.accessToken),
        listUsers(auth.accessToken, { limit: 100 }),
        getSecurityPolicy(auth.accessToken),
        listSsoProviders(auth.accessToken),
        listSessions(auth.accessToken, { limit: 30 }),
        listApiKeys(auth.accessToken, { limit: 30 }),
        listComplianceJobs(auth.accessToken, { limit: 30 }),
        listSecurityEvents(auth.accessToken, { limit: 30 }),
        listAuditLogs(auth.accessToken, { limit: 30 }),
        listNotificationPreferences(auth.accessToken),
      ] as const);

      if (overviewData.status === "fulfilled") setOverview(overviewData.value);
      if (tenantData.status === "fulfilled") setTenant(tenantData.value);
      if (roleResult.status === "fulfilled") setRoles(roleResult.value);
      if (permissionResult.status === "fulfilled") setPermissions(permissionResult.value);
      if (userResult.status === "fulfilled") setUsers(userResult.value.data);
      if (policyResult.status === "fulfilled") setPolicy(policyResult.value);
      if (ssoResult.status === "fulfilled") setSsoProviders(ssoResult.value);
      if (sessionResult.status === "fulfilled") setSessions(sessionResult.value.data);
      if (keyResult.status === "fulfilled") setApiKeys(keyResult.value.data);
      if (complianceResult.status === "fulfilled") setComplianceJobs(complianceResult.value.data);
      if (eventResult.status === "fulfilled") setEvents(eventResult.value.data);
      if (auditResult.status === "fulfilled") setAuditLogs(auditResult.value.data);
      if (preferenceResult.status === "fulfilled") setPreferences(preferenceResult.value);

      const failed = [roleResult, permissionResult, userResult, policyResult, ssoResult, sessionResult, keyResult, complianceResult, eventResult, auditResult]
        .filter((result) => result.status === "rejected").length;
      if (failed) {
        setMessage({
          text: `${failed} admin section${failed === 1 ? "" : "s"} could not load because of current permissions or backend policy.`,
          ok: false,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [access.canViewAdmin, auth.accessToken]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadAdmin(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadAdmin]);

  const selectedTab = visibleTabs.some((tab) => tab.id === activeTab) ? activeTab : "overview";

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    permissions.forEach((permission) => {
      groups.set(permission.subject, [...(groups.get(permission.subject) ?? []), permission]);
    });
    return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [permissions]);

  async function saveTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("tenant");
    setMessage(null);
    const fd = new FormData(event.currentTarget);
    try {
      const updated = await updateCurrentTenant(auth.accessToken, {
        logoUrl: cleanOptionalUrl(fd.get("logoUrl")),
        name: String(fd.get("name") || "").trim() || undefined,
        website: cleanOptionalUrl(fd.get("website")),
      });
      setTenant(updated);
      setMessage({ text: "Tenant settings saved.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to save tenant settings."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("profile");
    setMessage(null);
    const fd = new FormData(event.currentTarget);
    try {
      await updateMyProfile(auth.accessToken, {
        avatarUrl: cleanOptionalUrl(fd.get("avatarUrl")),
        firstName: String(fd.get("firstName") || "").trim() || undefined,
        lastName: String(fd.get("lastName") || "").trim() || undefined,
        locale: String(fd.get("locale") || "").trim() || undefined,
        timezone: String(fd.get("timezone") || "").trim() || undefined,
      });
      setMessage({ text: "Profile saved. Sign in state will refresh on the next session refresh.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to save profile."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function createRoleFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("role");
    setMessage(null);
    const form = event.currentTarget;
    const fd = new FormData(form);
    try {
      const role = await createRole(auth.accessToken, {
        description: String(fd.get("description") || ""),
        name: String(fd.get("name") || "").trim(),
        permissionIds: fd.getAll("permissionIds").map(String),
      });
      setRoles((current) => [role, ...current]);
      form.reset();
      setMessage({ text: "Role created.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to create role."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function syncRolePermissions(role: Role, permissionIds: string[]) {
    setSaving(role.id);
    setMessage(null);
    try {
      const updated = await updateRole(auth.accessToken, role.id, { permissionIds });
      setRoles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage({ text: `${role.name} permissions updated.`, ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to update role."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function deleteRoleById(role: Role) {
    const ok = await confirm({
      title: "Delete role?",
      description: `Delete ${role.name}? Backend rules prevent deleting assigned or system roles.`,
      confirmLabel: "Delete role",
      tone: "danger",
    });
    if (!ok) return;
    setSaving(role.id);
    try {
      await deleteRole(auth.accessToken, role.id);
      setRoles((current) => current.filter((item) => item.id !== role.id));
      setMessage({ text: "Role deleted.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to delete role."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function assignUserRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const roleId = String(fd.get("roleId") || "");
    const userId = String(fd.get("userId") || "");
    if (!roleId || !userId) return;
    setSaving("assign-role");
    try {
      await assignRole(auth.accessToken, { roleId, userId });
      setMessage({ text: "Role assigned.", ok: true });
      void loadAdmin();
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to assign role."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function removeUserRole(roleId: string, targetUserId: string) {
    setSaving(`${roleId}:${targetUserId}`);
    try {
      await removeRoleFromUser(auth.accessToken, roleId, targetUserId);
      setMessage({ text: "Role removed from user.", ok: true });
      void loadAdmin();
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to remove role."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function saveSecurityPolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("policy");
    setMessage(null);
    const fd = new FormData(event.currentTarget);
    try {
      const updated = await updateSecurityPolicy(auth.accessToken, {
        allowedUploadMimeTypes: splitList(fd.get("allowedUploadMimeTypes")),
        auditRetentionDays: numberOrUndefined(fd.get("auditRetentionDays")),
        dataRetentionDays: numberOrUndefined(fd.get("dataRetentionDays")),
        enforceIpAllowlist: fd.get("enforceIpAllowlist") === "on",
        ipAllowlist: splitList(fd.get("ipAllowlist")),
        maxSessionsPerUser: numberOrUndefined(fd.get("maxSessionsPerUser")),
        maxUploadBytes: numberOrUndefined(fd.get("maxUploadBytes")),
        passwordHistoryCount: numberOrUndefined(fd.get("passwordHistoryCount")),
        passwordMinLength: numberOrUndefined(fd.get("passwordMinLength")),
        passwordRequireLower: fd.get("passwordRequireLower") === "on",
        passwordRequireNumber: fd.get("passwordRequireNumber") === "on",
        passwordRequireSymbol: fd.get("passwordRequireSymbol") === "on",
        passwordRequireUpper: fd.get("passwordRequireUpper") === "on",
        sessionTtlMinutes: numberOrUndefined(fd.get("sessionTtlMinutes")),
      });
      setPolicy(updated);
      setMessage({ text: "Security policy saved.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to save security policy."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function saveLoginPolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("login-policy");
    setMessage(null);
    const fd = new FormData(event.currentTarget);
    try {
      const updated = await updateTenantLoginPolicy(auth.accessToken, {
        allowedLoginMethods: fd.getAll("allowedLoginMethods").map(String),
        domainDiscoveryEnabled: fd.get("domainDiscoveryEnabled") === "on",
        mfaRequired: fd.get("mfaRequired") === "on",
        ssoRequired: fd.get("ssoRequired") === "on",
        trustedDeviceTtlDays: numberOrUndefined(fd.get("trustedDeviceTtlDays")),
      });
      setPolicy((current) => current ? { ...current, ...updated } : current);
      setMessage({ text: "Identity login policy saved.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to save identity login policy."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function saveSsoProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("sso-provider");
    setMessage(null);
    const form = event.currentTarget;
    const fd = new FormData(form);
    try {
      const providers = await upsertSsoProvider(auth.accessToken, {
        allowedDomains: splitList(fd.get("allowedDomains")),
        authorizationUrl: cleanOptionalUrl(fd.get("authorizationUrl")),
        buttonLabel: String(fd.get("buttonLabel") || "").trim() || undefined,
        clientId: String(fd.get("clientId") || "").trim() || undefined,
        clientSecret: String(fd.get("clientSecret") || "").trim() || undefined,
        issuerUrl: cleanOptionalUrl(fd.get("issuerUrl")),
        jitProvisioningEnabled: fd.get("jitProvisioningEnabled") === "on",
        name: String(fd.get("name") || "").trim(),
        redirectUri: cleanOptionalUrl(fd.get("redirectUri")),
        scopes: splitList(fd.get("scopes")),
        status: fd.get("status") as SsoProvider["status"],
        tokenUrl: cleanOptionalUrl(fd.get("tokenUrl")),
        type: fd.get("type") as SsoProvider["type"],
        userInfoUrl: cleanOptionalUrl(fd.get("userInfoUrl")),
      });
      setSsoProviders(providers);
      form.reset();
      setMessage({ text: "SSO provider saved.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to save SSO provider."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function revokeSessionById(session: AuthSession) {
    const ok = await confirm({
      title: "Revoke session?",
      description: `Revoke the active session for ${session.user?.email ?? session.userId}?`,
      confirmLabel: "Revoke session",
      tone: "danger",
    });
    if (!ok) return;
    setSaving(session.id);
    try {
      const updated = await revokeSession(auth.accessToken, session.id);
      setSessions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage({ text: "Session revoked.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to revoke session."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function revokeAllSessions(targetUser: TenantUser) {
    const ok = await confirm({
      title: "Revoke all user sessions?",
      description: `Revoke all active sessions for ${targetUser.email}?`,
      confirmLabel: "Revoke sessions",
      tone: "danger",
    });
    if (!ok) return;
    setSaving(`user-sessions:${targetUser.id}`);
    try {
      const result = await revokeUserSessions(auth.accessToken, targetUser.id);
      setMessage({ text: `${result.revokedSessions} session${result.revokedSessions === 1 ? "" : "s"} revoked.`, ok: true });
      void loadAdmin();
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to revoke user sessions."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function createApiKeyFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("api-key");
    setMessage(null);
    const form = event.currentTarget;
    const fd = new FormData(form);
    try {
      const key = await createApiKey(auth.accessToken, {
        expiresAt: dateOrUndefined(fd.get("expiresAt")),
        name: String(fd.get("name") || "").trim(),
        scopes: splitList(fd.get("scopes")),
      });
      setCreatedKey(key);
      setApiKeys((current) => [key, ...current]);
      form.reset();
      setMessage({ text: "API key created. Copy the token now; it is shown once.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to create API key."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function revokeApiKeyById(apiKey: ApiKey) {
    const ok = await confirm({
      title: "Revoke API key?",
      description: `Revoke ${apiKey.name}? Integrations using this key will stop working.`,
      confirmLabel: "Revoke key",
      tone: "danger",
    });
    if (!ok) return;
    setSaving(apiKey.id);
    try {
      const updated = await revokeApiKey(auth.accessToken, apiKey.id);
      setApiKeys((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage({ text: "API key revoked.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to revoke API key."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function resolveSecurityEvent(event: SecurityEvent, status: SecurityEventStatus) {
    setSaving(event.id);
    try {
      const updated = await updateSecurityEvent(auth.accessToken, event.id, { status });
      setEvents((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage({ text: "Security event updated.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to update security event."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function createComplianceJobFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const type = fd.get("type") as ComplianceJobType;
    setSaving("compliance-create");
    setMessage(null);
    try {
      const job = await createComplianceJob(auth.accessToken, {
        expiresAt: dateOrUndefined(fd.get("expiresAt")),
        parameters: parseJson(fd.get("parameters")),
        reason: String(fd.get("reason") || "").trim() || undefined,
        subjectId: String(fd.get("subjectId") || "").trim() || undefined,
        subjectType: String(fd.get("subjectType") || "").trim() || undefined,
        type,
      });
      setComplianceJobs((current) => [job, ...current]);
      form.reset();
      setMessage({ text: "Compliance job requested.", ok: true });
      void loadAdmin();
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to create compliance job."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function actOnComplianceJob(job: ComplianceJob, action: "approve" | "reject" | "run" | "cancel") {
    const destructive = action === "reject" || action === "cancel";
    if (destructive) {
      const ok = await confirm({
        title: `${humanize(action)} compliance job?`,
        description: `${humanize(action)} ${job.type} job ${job.id}?`,
        confirmLabel: humanize(action),
        tone: "danger",
      });
      if (!ok) return;
    }

    setSaving(`compliance:${action}:${job.id}`);
    try {
      const updated =
        action === "approve"
          ? await approveComplianceJob(auth.accessToken, job.id, { reason: job.reason ?? "Approved from TaskBricks admin console." })
          : action === "reject"
            ? await rejectComplianceJob(auth.accessToken, job.id, { reason: job.reason ?? "Rejected from TaskBricks admin console." })
            : action === "run"
              ? await runComplianceJob(auth.accessToken, job.id)
              : await cancelComplianceJob(auth.accessToken, job.id);

      setComplianceJobs((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage({ text: `Compliance job ${updated.status.toLowerCase()}.`, ok: updated.status !== "FAILED" });
      void loadAdmin();
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to update compliance job."), ok: false });
    } finally {
      setSaving("");
    }
  }

  async function savePreferences() {
    setSaving("preferences");
    try {
      const updated = await updateNotificationPreferences(
        auth.accessToken,
        preferences.map((preference) => ({ channel: preference.channel, enabled: preference.enabled })),
      );
      setPreferences(updated);
      setMessage({ text: "Notification preferences saved.", ok: true });
    } catch (caught) {
      setMessage({ text: errorMessage(caught, "Unable to save notification preferences."), ok: false });
    } finally {
      setSaving("");
    }
  }

  function copyValue(value: string, key: string) {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1800);
    });
  }

  if (!access.canViewAdmin) {
    return (
      <div className="mx-auto grid max-w-4xl gap-5">
        <Panel title="Admin access required" eyebrow="Tenant control center" icon={Shield}>
          <div className="rounded-2xl border border-line bg-background p-5">
            <p className="text-sm font-semibold text-foreground">
              Tenant administration is restricted to Owner, Admin, security, role, compliance, and user-management roles.
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Your effective role is <span className="font-black text-foreground">{roleLabel(user)}</span>. You can still use assigned workspace, project, task, message, notification, and profile features based on your project permissions.
            </p>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1500px] gap-5">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111] text-white">
        <div className="grid gap-5 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                <ShieldCheck className="size-3.5" />
                Enterprise admin
              </span>
              <Capability label="Tenant" enabled={canManageTenant} />
              <Capability label="Roles" enabled={canManageRoles} />
              <Capability label="Security" enabled={canManageSecurity} />
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Tenant control center
            </h1>
            <p className="mt-2 text-sm font-semibold text-white/45">
              RBAC, sessions, API keys, security policy, audit trail, and notification preferences.
            </p>
            <p className="mt-2 text-xs font-black text-primary">Effective role: {roleLabel(user)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:flex-col lg:items-end lg:gap-y-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <AdminStat icon={Fingerprint} label="Sessions" value={overview.sessions.active} />
              <AdminStat icon={ShieldAlert} label="Events" value={overview.securityEvents.open} danger={overview.securityEvents.open > 0} />
              <AdminStat icon={Activity} label="Audit logs" value={overview.auditLogs} />
              <AdminStat icon={KeyRound} label="API keys" value={countRecord(overview.apiKeys)} />
            </div>
            <button
              type="button"
              onClick={() => void loadAdmin()}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-white/[0.08] px-4 text-[12px] font-black text-white transition hover:bg-white/[0.14]"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {message ? <Notice message={message} /> : null}
      {createdKey ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">One-time API token</p>
              <p className="mt-1 break-all rounded-xl bg-white p-3 font-mono text-xs text-amber-950">{createdKey.token}</p>
            </div>
            <button
              type="button"
              onClick={() => copyValue(createdKey.token, "created-api-key")}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#111111] px-3 text-sm font-black text-white"
            >
              <Copy className="size-4" />
              {copied === "created-api-key" ? "Copied" : "Copy"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-panel p-1 tb-scrollbar">
        {visibleTabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex h-10 min-w-fit flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition",
              selectedTab === id ? "bg-[#111111] text-white" : "text-ink-soft hover:bg-panel-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </section>

      {selectedTab === "overview" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <Panel title="Security posture" eyebrow="Runtime checks" icon={Shield}>
            <div className="grid gap-3 md:grid-cols-2">
              <CheckItem label="Helmet enabled" ok={overview.securityChecks.helmetEnabled} />
              <CheckItem label="CORS configured" ok={overview.securityChecks.corsConfigured} />
              <CheckItem label="Swagger production safe" ok={overview.securityChecks.swaggerProductionSafe} />
              <CheckItem label="Validation whitelist" ok={overview.securityChecks.validationPipe.whitelist} />
              <CheckItem label="JWT access secret" ok={overview.securityChecks.secretsConfigured.jwtAccess} />
              <CheckItem label="JWT refresh secret" ok={overview.securityChecks.secretsConfigured.jwtRefresh} />
              <CheckItem label="Encryption key" ok={overview.securityChecks.secretsConfigured.encryption} />
              <CheckItem label="Webhook signing" ok={overview.securityChecks.secretsConfigured.webhookSigning} />
            </div>
          </Panel>

          <Panel title="Tenant snapshot" eyebrow="Operational counts" icon={Database}>
            <div className="grid gap-3">
              <InfoRow label="Tenant" value={tenant?.name ?? overview.tenant.name} />
              <InfoRow label="Slug" value={tenant?.slug ?? overview.tenant.slug} />
              <InfoRow label="Status" value={tenant?.status ?? overview.tenant.status} />
              <InfoRow label="Users" value={String(countRecord(overview.users))} />
              <InfoRow label="Compliance jobs" value={String(countRecord(overview.complianceJobs))} />
              <InfoRow label="Rate limit" value={`${overview.securityChecks.rateLimit.defaultMax}/${overview.securityChecks.rateLimit.ttlSeconds}s`} />
            </div>
          </Panel>

          <Panel title="Recent security events" eyebrow="Open risk trail" icon={ShieldAlert}>
            <EventList events={events} saving={saving} onUpdate={resolveSecurityEvent} />
          </Panel>

          <Panel title="Recent audit trail" eyebrow="Immutable events" icon={Activity}>
            <div className="grid gap-2">
              {auditLogs.slice(0, 8).map((log) => (
                <article key={log.id} className="rounded-xl border border-line bg-background p-3">
                  <p className="text-sm font-black text-foreground">{humanize(log.action)}</p>
                  <p className="mt-1 text-[11px] font-semibold text-ink-soft">
                    {log.entityType} {log.entityId ? `- ${log.entityId}` : ""} - {formatShortDate(log.createdAt)}
                  </p>
                </article>
              ))}
              {!auditLogs.length ? <Empty icon={Activity} text="No audit events available." /> : null}
            </div>
          </Panel>
        </div>
      )}

      {selectedTab === "tenant" && (
        <Panel title="Tenant settings" eyebrow="Brand and identity" icon={ServerCog}>
          <form onSubmit={saveTenant} className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-3">
              <Field label="Tenant name">
                <input name="name" defaultValue={tenant?.name ?? ""} className={fieldClass} disabled={!canManageTenant} />
              </Field>
              <Field label="Logo URL">
                <input name="logoUrl" defaultValue={tenant?.logoUrl ?? ""} className={fieldClass} disabled={!canManageTenant} />
              </Field>
              <Field label="Website">
                <input name="website" defaultValue={tenant?.website ?? ""} className={fieldClass} disabled={!canManageTenant} />
              </Field>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Kpi label="Users" value={tenant?._count?.users ?? countRecord(overview.users)} />
              <Kpi label="Workspaces" value={tenant?._count?.workspaces ?? 0} />
              <Kpi label="Teams" value={tenant?._count?.teams ?? 0} />
              <Kpi label="Projects" value={tenant?._count?.projects ?? 0} />
            </div>
            <button type="submit" disabled={!canManageTenant || saving === "tenant"} className="tb-yellow-button inline-flex h-10 w-fit items-center gap-2 rounded-lg px-4 text-sm font-black disabled:opacity-55">
              {saving === "tenant" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save tenant
            </button>
          </form>
        </Panel>
      )}

      {selectedTab === "roles" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
          <Panel title="Roles and permissions" eyebrow="RBAC matrix" icon={UserCog}>
            <div className="grid gap-3">
              {roles.map((role) => {
                const currentPermissionIds = new Set((role.permissions ?? []).map((item) => item.permission.id));
                return (
                  <article key={role.id} className="rounded-2xl border border-line bg-background p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-foreground">{role.name}</h3>
                        <p className="mt-1 text-xs font-semibold text-ink-soft">
                          {role.description || "No description"} - {role._count?.users ?? 0} users
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className={cn("rounded-lg border px-2 py-1 text-[10px] font-black", role.isSystem ? "border-blue-200 bg-blue-50 text-blue-700" : "border-line bg-panel text-ink-soft")}>
                          {role.isSystem ? "System" : "Custom"}
                        </span>
                        {!role.isSystem ? (
                          <button type="button" onClick={() => void deleteRoleById(role)} className="inline-flex size-8 items-center justify-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-red-700">
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <details className="mt-3 rounded-xl border border-line bg-panel p-3">
                      <summary className="cursor-pointer text-sm font-black text-foreground">Permission matrix</summary>
                      <form
                        className="mt-3 grid gap-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void syncRolePermissions(role, new FormData(event.currentTarget).getAll("permissionIds").map(String));
                        }}
                      >
                        <div className="grid max-h-72 gap-3 overflow-y-auto pr-1 tb-scrollbar">
                          {permissionGroups.map(([subject, group]) => (
                            <div key={subject}>
                              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">{subject}</p>
                              <div className="grid gap-1 sm:grid-cols-2">
                                {group.map((permission) => (
                                  <label key={permission.id} className="flex items-center gap-2 rounded-lg bg-background px-2 py-1.5 text-xs font-semibold text-foreground">
                                    <input type="checkbox" name="permissionIds" value={permission.id} defaultChecked={currentPermissionIds.has(permission.id)} disabled={!canManageRoles || role.isSystem} />
                                    {permission.action}:{permission.subject}
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button type="submit" disabled={!canManageRoles || role.isSystem || saving === role.id} className="h-9 w-fit rounded-lg bg-primary px-3 text-sm font-black text-[#111111] disabled:opacity-55">
                          {saving === role.id ? "Saving..." : "Save permissions"}
                        </button>
                      </form>
                    </details>
                  </article>
                );
              })}
            </div>
          </Panel>

          <Panel title="Create and assign" eyebrow="Access operations" icon={Plus}>
            <form onSubmit={createRoleFromForm} className="grid gap-3 rounded-xl border border-line bg-background p-3">
              <Field label="Role name"><input name="name" required className={fieldClass} disabled={!canManageRoles} /></Field>
              <Field label="Description"><input name="description" className={fieldClass} disabled={!canManageRoles} /></Field>
              <div className="max-h-52 overflow-y-auto rounded-xl border border-line bg-panel p-2 tb-scrollbar">
                {permissions.map((permission) => (
                  <label key={permission.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground">
                    <input type="checkbox" name="permissionIds" value={permission.id} disabled={!canManageRoles} />
                    {permission.action}:{permission.subject}
                  </label>
                ))}
              </div>
              <button type="submit" disabled={!canManageRoles || saving === "role"} className="tb-yellow-button h-10 rounded-lg text-sm font-black disabled:opacity-55">Create role</button>
            </form>

            <form onSubmit={assignUserRole} className="mt-4 grid gap-3 rounded-xl border border-line bg-background p-3">
              <Field label="User">
                <select name="userId" required className={fieldClass} disabled={!canManageRoles}>
                  <option value="">Select user</option>
                  {users.map((tenantUser) => <option key={tenantUser.id} value={tenantUser.id}>{tenantUser.email}</option>)}
                </select>
              </Field>
              <Field label="Role">
                <select name="roleId" required className={fieldClass} disabled={!canManageRoles}>
                  <option value="">Select role</option>
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </Field>
              <button type="submit" disabled={!canManageRoles || saving === "assign-role"} className="h-10 rounded-lg bg-[#111111] text-sm font-black text-white disabled:opacity-55">Assign role</button>
            </form>

            <div className="mt-4 grid gap-2">
              {users.slice(0, 10).map((tenantUser) => (
                <div key={tenantUser.id} className="rounded-xl border border-line bg-background p-3">
                  <p className="truncate text-sm font-black text-foreground">{tenantUser.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(tenantUser.roles ?? []).map(({ role }) => (
                      <button key={role.id} type="button" onClick={() => void removeUserRole(role.id, tenantUser.id)} className="rounded-lg border border-line bg-panel px-2 py-1 text-[10px] font-black text-ink-soft hover:text-red-700" title="Remove role">
                        {role.name} <X className="inline size-3" />
                      </button>
                    ))}
                    {!tenantUser.roles?.length ? <span className="text-xs font-semibold text-ink-soft">No roles</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {selectedTab === "security" && (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Panel title="Security policy" eyebrow="Tenant guardrails" icon={Lock}>
              {policy ? (
                <form onSubmit={saveSecurityPolicy} className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Session TTL minutes"><input name="sessionTtlMinutes" type="number" min={15} defaultValue={policy.sessionTtlMinutes} className={fieldClass} disabled={!canManageSecurity} /></Field>
                    <Field label="Max sessions per user"><input name="maxSessionsPerUser" type="number" min={1} defaultValue={policy.maxSessionsPerUser ?? ""} className={fieldClass} disabled={!canManageSecurity} /></Field>
                    <Field label="Password minimum length"><input name="passwordMinLength" type="number" min={8} defaultValue={policy.passwordMinLength} className={fieldClass} disabled={!canManageSecurity} /></Field>
                    <Field label="Password history count"><input name="passwordHistoryCount" type="number" min={0} defaultValue={policy.passwordHistoryCount} className={fieldClass} disabled={!canManageSecurity} /></Field>
                    <Field label="Audit retention days"><input name="auditRetentionDays" type="number" min={30} defaultValue={policy.auditRetentionDays} className={fieldClass} disabled={!canManageSecurity} /></Field>
                    <Field label="Data retention days"><input name="dataRetentionDays" type="number" min={1} defaultValue={policy.dataRetentionDays ?? ""} className={fieldClass} disabled={!canManageSecurity} /></Field>
                    <Field label="Max upload bytes"><input name="maxUploadBytes" type="number" min={1024} defaultValue={policy.maxUploadBytes ?? ""} className={fieldClass} disabled={!canManageSecurity} /></Field>
                  </div>
                  <Field label="IP allowlist">
                    <textarea name="ipAllowlist" defaultValue={policy.ipAllowlist.join("\n")} className={textareaClass} disabled={!canManageSecurity} />
                  </Field>
                  <Field label="Allowed upload MIME types">
                    <textarea name="allowedUploadMimeTypes" defaultValue={policy.allowedUploadMimeTypes.join("\n")} className={textareaClass} disabled={!canManageSecurity} />
                  </Field>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Toggle name="enforceIpAllowlist" label="Enforce IP allowlist" defaultChecked={policy.enforceIpAllowlist} disabled={!canManageSecurity} />
                    <Toggle name="passwordRequireUpper" label="Require uppercase" defaultChecked={policy.passwordRequireUpper} disabled={!canManageSecurity} />
                    <Toggle name="passwordRequireLower" label="Require lowercase" defaultChecked={policy.passwordRequireLower} disabled={!canManageSecurity} />
                    <Toggle name="passwordRequireNumber" label="Require number" defaultChecked={policy.passwordRequireNumber} disabled={!canManageSecurity} />
                    <Toggle name="passwordRequireSymbol" label="Require symbol" defaultChecked={policy.passwordRequireSymbol} disabled={!canManageSecurity} />
                  </div>
                  <button type="submit" disabled={!canManageSecurity || saving === "policy"} className="tb-yellow-button h-10 w-fit rounded-lg px-4 text-sm font-black disabled:opacity-55">
                    Save policy
                  </button>
                </form>
              ) : (
                <Empty icon={Lock} text="Security policy unavailable with the current permissions." />
              )}
            </Panel>

            <Panel title="Security events" eyebrow="Detection and response" icon={ShieldAlert}>
              <EventList events={events} saving={saving} onUpdate={resolveSecurityEvent} />
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <Panel title="Identity login policy" eyebrow="MFA, devices, SSO" icon={Fingerprint}>
              {policy ? (
                <form onSubmit={saveLoginPolicy} className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Toggle name="mfaRequired" label="Require MFA for tenant users" defaultChecked={policy.mfaRequired} disabled={!canManageSecurity} />
                    <Toggle name="ssoRequired" label="Require SSO login" defaultChecked={policy.ssoRequired} disabled={!canManageSecurity} />
                    <Toggle name="domainDiscoveryEnabled" label="Enable domain discovery" defaultChecked={policy.domainDiscoveryEnabled} disabled={!canManageSecurity} />
                    <Field label="Trusted device days">
                      <input name="trustedDeviceTtlDays" type="number" min={1} max={365} defaultValue={policy.trustedDeviceTtlDays ?? 30} className={fieldClass} disabled={!canManageSecurity} />
                    </Field>
                  </div>
                  <div className="rounded-xl border border-line bg-background p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">Allowed login methods</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {loginMethods.map((method) => (
                        <label key={method} className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-xs font-black text-foreground">
                          <input
                            type="checkbox"
                            name="allowedLoginMethods"
                            value={method}
                            defaultChecked={(policy.allowedLoginMethods ?? ["PASSWORD"]).includes(method)}
                            disabled={!canManageSecurity}
                            className="size-4 accent-primary"
                          />
                          {humanize(method)}
                        </label>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] font-semibold leading-5 text-ink-soft">
                      SSO-required tenants should keep password disabled after provider rollout. Keep at least one working method enabled to avoid locking the tenant out.
                    </p>
                  </div>
                  <button type="submit" disabled={!canManageSecurity || saving === "login-policy"} className="tb-yellow-button h-10 w-fit rounded-lg px-4 text-sm font-black disabled:opacity-55">
                    Save identity policy
                  </button>
                </form>
              ) : (
                <Empty icon={Fingerprint} text="Identity policy unavailable with the current permissions." />
              )}
            </Panel>

            <Panel title="Enterprise SSO providers" eyebrow="Google, Microsoft, OIDC, SAML" icon={KeyRound}>
              <div className="mb-4 grid gap-2">
                {ssoProviders.map((provider) => (
                  <article key={provider.id} className="rounded-xl border border-line bg-background p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-foreground">{provider.name}</p>
                          <StatusPill ok={provider.status === "ACTIVE"}>{provider.status}</StatusPill>
                        </div>
                        <p className="mt-1 truncate text-[11px] font-semibold text-ink-soft">
                          {provider.type} / {provider.allowedDomains.length ? provider.allowedDomains.join(", ") : "no domain restriction"}
                        </p>
                        <p className="mt-1 truncate text-[11px] font-semibold text-ink-soft">
                          Redirect: {provider.redirectUri ?? "backend default"} / Secret: {provider.clientSecretConfigured ? "configured" : "missing"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {provider.scopes.slice(0, 4).map((scope) => (
                          <span key={scope} className="rounded-lg border border-line bg-panel px-2 py-1 text-[10px] font-black text-ink-soft">{scope}</span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
                {!ssoProviders.length ? <Empty icon={KeyRound} text="No SSO providers configured for this tenant." /> : null}
              </div>

              <form onSubmit={saveSsoProvider} className="grid gap-3 rounded-xl border border-line bg-background p-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Provider type">
                    <select name="type" required className={fieldClass} disabled={!canManageSecurity}>
                      <option value="GOOGLE">Google</option>
                      <option value="MICROSOFT">Microsoft</option>
                      <option value="OIDC">OIDC</option>
                      <option value="SAML">SAML metadata</option>
                    </select>
                  </Field>
                  <Field label="Name"><input name="name" required placeholder="Corporate Google" className={fieldClass} disabled={!canManageSecurity} /></Field>
                  <Field label="Status">
                    <select name="status" className={fieldClass} disabled={!canManageSecurity}>
                      <option value="DISABLED">Disabled</option>
                      <option value="ACTIVE">Active</option>
                    </select>
                  </Field>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Client ID"><input name="clientId" className={fieldClass} disabled={!canManageSecurity} /></Field>
                  <Field label="Client secret"><input name="clientSecret" type="password" className={fieldClass} disabled={!canManageSecurity} /></Field>
                  <Field label="Button label"><input name="buttonLabel" placeholder="Continue with Google" className={fieldClass} disabled={!canManageSecurity} /></Field>
                  <Field label="Redirect URI"><input name="redirectUri" placeholder="http://localhost:3000/sso/callback" className={fieldClass} disabled={!canManageSecurity} /></Field>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Allowed domains">
                    <textarea name="allowedDomains" placeholder="example.com&#10;subsidiary.com" className={textareaClass} disabled={!canManageSecurity} />
                  </Field>
                  <Field label="Scopes">
                    <textarea name="scopes" placeholder="openid&#10;email&#10;profile" className={textareaClass} disabled={!canManageSecurity} />
                  </Field>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Issuer URL"><input name="issuerUrl" placeholder="https://accounts.google.com" className={fieldClass} disabled={!canManageSecurity} /></Field>
                  <Field label="Authorization URL"><input name="authorizationUrl" placeholder="Provider default unless custom OIDC" className={fieldClass} disabled={!canManageSecurity} /></Field>
                  <Field label="Token URL"><input name="tokenUrl" placeholder="Provider default unless custom OIDC" className={fieldClass} disabled={!canManageSecurity} /></Field>
                  <Field label="User info URL"><input name="userInfoUrl" placeholder="Provider default unless custom OIDC" className={fieldClass} disabled={!canManageSecurity} /></Field>
                </div>
                <Toggle name="jitProvisioningEnabled" label="Just-in-time provision new SSO users" defaultChecked disabled={!canManageSecurity} />
                <button type="submit" disabled={!canManageSecurity || saving === "sso-provider"} className="tb-yellow-button h-10 w-fit rounded-lg px-4 text-sm font-black disabled:opacity-55">
                  Save SSO provider
                </button>
              </form>
            </Panel>
          </div>
        </div>
      )}

      {selectedTab === "compliance" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <Panel title="Compliance job queue" eyebrow="Export, deletion, retention" icon={ClipboardCheck}>
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              {complianceStatuses.slice(0, 4).map((status) => (
                <Kpi
                  key={status}
                  label={humanize(status)}
                  value={complianceJobs.filter((job) => job.status === status).length}
                />
              ))}
            </div>
            <div className="grid gap-3">
              {complianceJobs.map((job) => (
                <ComplianceJobRow
                  key={job.id}
                  canManage={canManageCompliance}
                  job={job}
                  saving={saving}
                  onAction={actOnComplianceJob}
                />
              ))}
              {!complianceJobs.length ? <Empty icon={ClipboardCheck} text="No compliance jobs returned." /> : null}
            </div>
          </Panel>

          <Panel title="Request compliance job" eyebrow="Governed operations" icon={Plus}>
            <form onSubmit={createComplianceJobFromForm} className="grid gap-3">
              <Field label="Job type">
                <select name="type" required className={fieldClass} disabled={!canManageCompliance}>
                  {complianceTypes.map((type) => (
                    <option key={type} value={type}>{humanize(type)}</option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <Field label="Subject type">
                  <input name="subjectType" placeholder="USER, PROJECT, TASK" className={fieldClass} disabled={!canManageCompliance} />
                </Field>
                <Field label="Subject ID">
                  <input name="subjectId" placeholder="Required for deletion" className={fieldClass} disabled={!canManageCompliance} />
                </Field>
              </div>
              <Field label="Reason">
                <textarea name="reason" placeholder="Business reason, ticket, legal basis, or retention policy reference." className={textareaClass} disabled={!canManageCompliance} />
              </Field>
              <Field label="Parameters JSON">
                <textarea name="parameters" placeholder='{"format":"json","includeAudit":true}' className={textareaClass} disabled={!canManageCompliance} />
              </Field>
              <Field label="Expires at">
                <input name="expiresAt" type="date" className={fieldClass} disabled={!canManageCompliance} />
              </Field>
              <button type="submit" disabled={!canManageCompliance || saving === "compliance-create"} className="tb-yellow-button h-10 rounded-lg text-sm font-black disabled:opacity-55">
                {saving === "compliance-create" ? "Requesting..." : "Request job"}
              </button>
              <div className="rounded-xl border border-line bg-background p-3">
                <p className="text-sm font-black text-foreground">Approval policy</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-ink-soft">
                  Data deletion and retention purge jobs require approval before execution. Data export jobs can run immediately but still produce audit logs and downloadable evidence.
                </p>
              </div>
            </form>
          </Panel>
        </div>
      )}

      {selectedTab === "access" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Sessions" eyebrow="Auth lifecycle" icon={Fingerprint}>
            <div className="mb-3 rounded-xl border border-line bg-background p-3">
              <p className="text-sm font-black text-foreground">Tenant-wide security view</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-ink-soft">
                Sessions shown here belong only to users in this tenant. You can see this because your effective role is {roleLabel(user)}.
                {canManageSecurity
                  ? " This role can revoke active sessions for security response."
                  : " This role can inspect sessions but cannot revoke them."}
              </p>
            </div>
            <div className="grid gap-2">
              {sessions.map((session) => (
                <article key={session.id} className="rounded-xl border border-line bg-background p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-foreground">{session.user?.email ?? session.userId}</p>
                      <p className="mt-1 text-[11px] font-semibold text-ink-soft">{session.ipAddress ?? "No IP"} - expires {formatShortDate(session.expiresAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill ok={!session.revokedAt}>{session.revokedAt ? "Revoked" : "Active"}</StatusPill>
                      {!session.revokedAt && canManageSecurity ? (
                        <button type="button" onClick={() => void revokeSessionById(session)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-black text-red-700">Revoke</button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
              {!sessions.length ? <Empty icon={Fingerprint} text="No sessions returned." /> : null}
            </div>
            {canManageSecurity ? (
              <div className="mt-4 grid gap-2">
                {users.slice(0, 6).map((tenantUser) => (
                  <button key={tenantUser.id} type="button" onClick={() => void revokeAllSessions(tenantUser)} className="flex items-center justify-between rounded-xl border border-line bg-background p-3 text-left transition hover:border-red-200 hover:bg-red-50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-foreground">{tenantUser.email}</span>
                      <span className="text-[11px] font-semibold text-ink-soft">Revoke all active sessions</span>
                    </span>
                    <X className="size-4 text-ink-soft" />
                  </button>
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel title="API keys" eyebrow="Integration access" icon={KeyRound}>
            {!canManageSecurity ? (
              <div className="mb-3 rounded-xl border border-line bg-background p-3">
                <p className="text-sm font-black text-foreground">Read-only integration access</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-ink-soft">
                  API keys are tenant-scoped. Creating or revoking keys requires manage:security.
                </p>
              </div>
            ) : null}
            <form onSubmit={createApiKeyFromForm} className="mb-4 grid gap-3 rounded-xl border border-line bg-background p-3">
              <Field label="Key name"><input name="name" required className={fieldClass} disabled={!canManageSecurity} /></Field>
              <Field label="Scopes"><input name="scopes" placeholder="read:tasks, manage:projects" className={fieldClass} disabled={!canManageSecurity} /></Field>
              <Field label="Expires at"><input name="expiresAt" type="date" className={fieldClass} disabled={!canManageSecurity} /></Field>
              <button type="submit" disabled={!canManageSecurity || saving === "api-key"} className="tb-yellow-button h-10 rounded-lg text-sm font-black disabled:opacity-55">Create API key</button>
            </form>
            <div className="grid gap-2">
              {apiKeys.map((apiKey) => (
                <article key={apiKey.id} className="rounded-xl border border-line bg-background p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-foreground">{apiKey.name}</p>
                      <p className="mt-1 text-[11px] font-semibold text-ink-soft">Prefix {apiKey.prefix} - {apiKey.scopes.join(", ") || "no scopes"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill ok={apiKey.status === "ACTIVE"}>{apiKey.status}</StatusPill>
                      {apiKey.status === "ACTIVE" && canManageSecurity ? (
                        <button type="button" onClick={() => void revokeApiKeyById(apiKey)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-black text-red-700">Revoke</button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
              {!apiKeys.length ? <Empty icon={KeyRound} text="No API keys returned." /> : null}
            </div>
          </Panel>
        </div>
      )}

      {selectedTab === "profile" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <Panel title="User profile" eyebrow="Personal settings" icon={Users}>
            <form onSubmit={saveProfile} className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="First name"><input name="firstName" defaultValue={user.firstName} className={fieldClass} /></Field>
                <Field label="Last name"><input name="lastName" defaultValue={user.lastName} className={fieldClass} /></Field>
                <Field label="Timezone"><input name="timezone" defaultValue="America/Chicago" className={fieldClass} /></Field>
                <Field label="Locale"><input name="locale" defaultValue="en-US" className={fieldClass} /></Field>
              </div>
              <Field label="Avatar URL"><input name="avatarUrl" className={fieldClass} /></Field>
              <button type="submit" disabled={saving === "profile"} className="tb-yellow-button h-10 w-fit rounded-lg px-4 text-sm font-black disabled:opacity-55">Save profile</button>
            </form>
            <div className="mt-4 rounded-xl border border-line bg-background p-3">
              <p className="text-sm font-black text-foreground">Password and authentication</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-ink-soft">
                Password policy is enforced by the tenant security policy. A dedicated password change endpoint is not exposed by the backend yet, so this page surfaces session revocation and policy controls now.
              </p>
            </div>
          </Panel>

          <Panel title="Notification preferences" eyebrow="Delivery channels" icon={Bell}>
            <div className="grid gap-2">
              {channels.map((channel) => {
                const preference = preferences.find((item) => item.channel === channel);
                const enabled = preference?.enabled ?? true;
                return (
                  <label key={channel} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-background p-3">
                    <span>
                      <span className="block text-sm font-black text-foreground">{channel.replaceAll("_", " ")}</span>
                      <span className="text-[11px] font-semibold text-ink-soft">{preference?.locked ? "Required channel" : "User configurable"}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={preference?.locked}
                      onChange={(event) => {
                        const next = event.target.checked;
                        setPreferences((current) => {
                          const exists = current.some((item) => item.channel === channel);
                          if (exists) return current.map((item) => (item.channel === channel ? { ...item, enabled: next } : item));
                          return [...current, { channel, enabled: next, id: null, userId: user.id }];
                        });
                      }}
                      className="size-5 accent-primary"
                    />
                  </label>
                );
              })}
            </div>
            <button type="button" onClick={() => void savePreferences()} disabled={saving === "preferences"} className="tb-yellow-button mt-4 h-10 rounded-lg px-4 text-sm font-black disabled:opacity-55">Save preferences</button>
          </Panel>
        </div>
      )}
    </div>
  );
}

function ComplianceJobRow({
  canManage,
  job,
  onAction,
  saving,
}: {
  canManage: boolean;
  job: ComplianceJob;
  onAction: (job: ComplianceJob, action: "approve" | "reject" | "run" | "cancel") => void;
  saving: string;
}) {
  const busy = saving.includes(job.id);
  const canApprove = canManage && (job.status === "REQUESTED" || job.status === "QUEUED");
  const canRun = canManage && ["APPROVED", "REQUESTED", "QUEUED"].includes(job.status);
  const canCancel = canManage && !["COMPLETED", "FAILED", "CANCELLED", "EXPIRED", "REJECTED"].includes(job.status);

  return (
    <article className="rounded-2xl border border-line bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-foreground">{humanize(job.type)}</h3>
            <ComplianceStatusPill status={job.status} />
          </div>
          <p className="mt-1 text-[11px] font-semibold text-ink-soft">
            Requested {formatShortDate(job.requestedAt)} by {job.requestedBy?.email ?? "system"}
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-soft">
            {[job.subjectType, job.subjectId].filter(Boolean).join(" / ") || "Tenant-wide operation"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canApprove ? (
            <>
              <button type="button" onClick={() => onAction(job, "approve")} disabled={busy} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-black text-emerald-700">
                <CheckCircle2 className="mr-1 inline size-3.5" />
                Approve
              </button>
              <button type="button" onClick={() => onAction(job, "reject")} disabled={busy} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-black text-red-700">
                <Ban className="mr-1 inline size-3.5" />
                Reject
              </button>
            </>
          ) : null}
          {canRun ? (
            <button type="button" onClick={() => onAction(job, "run")} disabled={busy} className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[11px] font-black text-foreground">
              <Play className="mr-1 inline size-3.5" />
              Run
            </button>
          ) : null}
          {canCancel ? (
            <button type="button" onClick={() => onAction(job, "cancel")} disabled={busy} className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[11px] font-black text-ink-soft hover:text-red-700">
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      {job.reason ? <p className="mt-3 rounded-xl bg-panel px-3 py-2 text-xs font-semibold text-ink-soft">{job.reason}</p> : null}
      {job.error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{job.error}</p> : null}

      <div className="mt-3 grid gap-2 text-[11px] font-semibold text-ink-soft sm:grid-cols-3">
        <span>Approved: {job.approvedAt ? formatShortDate(job.approvedAt) : "No"}</span>
        <span>Started: {job.startedAt ? formatShortDate(job.startedAt) : "Not started"}</span>
        <span>Completed: {job.completedAt ? formatShortDate(job.completedAt) : "Not complete"}</span>
      </div>

      {job.fileUrl ? (
        <a href={job.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-[#111111] px-3 text-xs font-black text-white">
          <Database className="size-3.5" />
          {job.fileName ?? "Open compliance artifact"}
        </a>
      ) : null}
    </article>
  );
}

function ComplianceStatusPill({ status }: { status: ComplianceJobStatus }) {
  const ok = status === "COMPLETED";
  const danger = status === "FAILED" || status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED";
  const warning = status === "REQUESTED" || status === "QUEUED" || status === "APPROVED" || status === "RUNNING";
  return (
    <span
      className={cn(
        "rounded-lg border px-2 py-1 text-[10px] font-black",
        ok && "border-emerald-200 bg-emerald-50 text-emerald-700",
        danger && "border-red-200 bg-red-50 text-red-700",
        warning && "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {humanize(status)}
    </span>
  );
}

function EventList({ events, onUpdate, saving }: { events: SecurityEvent[]; onUpdate: (event: SecurityEvent, status: SecurityEventStatus) => void; saving: string }) {
  return (
    <div className="grid gap-2">
      {events.map((event) => (
        <article key={event.id} className="rounded-xl border border-line bg-background p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-foreground">{humanize(event.type)}</p>
              <p className="mt-1 text-[11px] font-semibold text-ink-soft">
                {event.severity} - {event.status} - {formatShortDate(event.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <SeverityPill severity={event.severity} />
              {event.status === "OPEN" || event.status === "ACKNOWLEDGED" ? (
                <>
                  <button type="button" onClick={() => onUpdate(event, "ACKNOWLEDGED")} disabled={saving === event.id} className="rounded-lg border border-line bg-panel px-2 py-1 text-[10px] font-black text-foreground">Ack</button>
                  <button type="button" onClick={() => onUpdate(event, "RESOLVED")} disabled={saving === event.id} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">Resolve</button>
                </>
              ) : null}
            </div>
          </div>
        </article>
      ))}
      {!events.length ? <Empty icon={ShieldAlert} text="No security events returned." /> : null}
    </div>
  );
}

function Panel({ children, eyebrow, icon: Icon, title }: { children: ReactNode; eyebrow: string; icon: LucideIcon; title: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">{eyebrow}</p>
          <h2 className="truncate text-base font-black text-foreground">{title}</h2>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function AdminStat({ danger, icon: Icon, label, value }: { danger?: boolean; icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("size-3.5 shrink-0", danger ? "text-red-400" : "text-white/35")} />
      <span className={cn("text-[13px] font-black tabular-nums", danger ? "text-red-300" : "text-white/80")}>
        {value}
      </span>
      <span className="text-[10px] text-white/30">{label}</span>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-soft">{label}{children}</label>;
}

function Toggle({ defaultChecked, disabled, label, name }: { defaultChecked?: boolean; disabled?: boolean; label: string; name: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-line bg-background p-3 text-sm font-black text-foreground">
      {label}
      <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className="size-5 accent-primary" />
    </label>
  );
}

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-background p-3">
      <span className={cn("flex size-9 items-center justify-center rounded-xl", ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
        {ok ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
      </span>
      <p className="text-sm font-black text-foreground">{label}</p>
    </div>
  );
}

function Capability({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black",
        enabled
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.06] text-white/32",
      )}
    >
      <span className={cn("size-1.5 rounded-full", enabled ? "bg-emerald-400" : "bg-white/20")} />
      {label}
    </span>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-background p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">{label}</p>
      <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm last:border-b-0">
      <span className="font-semibold text-ink-soft">{label}</span>
      <span className="truncate font-black text-foreground">{value}</span>
    </div>
  );
}

function StatusPill({ children, ok }: { children: ReactNode; ok: boolean }) {
  return <span className={cn("rounded-lg border px-2 py-1 text-[10px] font-black", ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700")}>{children}</span>;
}

function SeverityPill({ severity }: { severity: string }) {
  const danger = severity === "HIGH" || severity === "CRITICAL";
  return <span className={cn("rounded-lg border px-2 py-1 text-[10px] font-black", danger ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{severity}</span>;
}

function Notice({ message }: { message: { text: string; ok: boolean } }) {
  return <div className={cn("rounded-2xl border px-4 py-3 text-sm font-black", message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700")}>{message.text}</div>;
}

function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line bg-background px-4 py-8 text-center">
      <Icon className="size-5 text-ink-soft" />
      <p className="mt-2 text-sm font-semibold text-ink-soft">{text}</p>
    </div>
  );
}

function countRecord(record: Record<string, number>) {
  return Object.values(record).reduce((sum, value) => sum + value, 0);
}

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrUndefined(value: FormDataEntryValue | null) {
  const number = Number(value);
  return Number.isFinite(number) && String(value ?? "").trim() ? number : undefined;
}

function dateOrUndefined(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? new Date(`${text}T12:00:00`).toISOString() : undefined;
}

function cleanOptionalUrl(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function parseJson(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  return JSON.parse(text);
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll(".", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}

const fieldClass =
  "h-10 w-full rounded-lg border border-line bg-background px-3 text-sm font-semibold text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-55";

const textareaClass =
  "min-h-24 w-full resize-none rounded-lg border border-line bg-background px-3 py-2 text-sm font-semibold text-foreground placeholder:text-ink-soft transition focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-55";
