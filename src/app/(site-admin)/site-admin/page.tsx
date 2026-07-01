"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Ban,
  Building2,
  CheckCircle2,
  Clock3,
  Crown,
  Eye,
  Fingerprint,
  Gauge,
  Mail,
  MoreHorizontal,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  getSiteAdminOverview,
  getSiteAdminProfile,
  grantPlatformAdmin,
  listPlatformAdmins,
  listPlatformAuditLogs,
  listSiteSecurityEvents,
  listSiteTenants,
  listSiteUsers,
  revokePlatformAdmin,
  updateSiteTenantStatus,
  updateSiteSecurityEvent,
  type PlatformAdminGrant,
  type PlatformAdminLevel,
  type PlatformAdminStatus,
  type PlatformAuditLog,
  type SecurityEvent,
  type SecurityEventSeverity,
  type SecurityEventStatus,
  type SiteAdminOverview,
  type SiteAdminProfile,
  type Tenant,
  type TenantUser,
} from "@/lib/api";
import { getAccessProfile, roleLabel } from "@/lib/access-policy";

export type SiteTab = "overview" | "tenants" | "admins" | "security" | "audit";

const emptyOverview: SiteAdminOverview = {
  tenants: {},
  users: {},
  sessions: { active: 0 },
  securityEvents: { total: 0, open: 0 },
  platformAdmins: 0,
  platformAuditLogs: 0,
  recentTenants: [],
  recentEvents: [],
};

export default function SiteAdminPage() {
  return <SiteAdminConsole />;
}

export function SiteAdminConsole() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const pathname = usePathname();
  const access = getAccessProfile(user);
  const activeTab = pathToSiteTab(pathname);
  const [profile,  setProfile]  = useState<SiteAdminProfile | null>(null);
  const [overview, setOverview] = useState<SiteAdminOverview>(emptyOverview);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [admins, setAdmins] = useState<PlatformAdminGrant[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminLevelFilter, setAdminLevelFilter] = useState<PlatformAdminLevel | "">("");
  const [adminStatusFilter, setAdminStatusFilter] = useState<PlatformAdminStatus | "">("");
  const [adminCandidateQuery, setAdminCandidateQuery] = useState("");
  const [adminCandidates, setAdminCandidates] = useState<TenantUser[]>([]);
  const [selectedAdminCandidate, setSelectedAdminCandidate] = useState<TenantUser | null>(null);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [securitySearch, setSecuritySearch] = useState("");
  const [securitySeverityFilter, setSecuritySeverityFilter] = useState<SecurityEventSeverity | "">("");
  const [securityStatusFilter, setSecurityStatusFilter] = useState<SecurityEventStatus | "">("");
  const [securityTenantFilter, setSecurityTenantFilter] = useState("");
  const [securityTypeFilter, setSecurityTypeFilter] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditTenantFilter, setAuditTenantFilter] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [selectedAuditLog, setSelectedAuditLog] = useState<PlatformAuditLog | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const canMutatePlatform = user.platformAdminLevel === "OWNER" || user.platformAdminLevel === "ADMIN";
  const handleAdminCandidateQueryChange = useCallback((value: string) => {
    setAdminCandidateQuery(value);
    if (value.trim().length < 2) {
      setAdminCandidates([]);
      setCandidateLoading(false);
    }
  }, []);

  const loadSiteAdmin = useCallback(async () => {
    if (!access.canViewSiteAdmin) {
      return;
    }

    setError("");
    try {
      const [profileResult, overviewResult, tenantsResult, adminsResult, eventsResult, auditResult] =
        await Promise.allSettled([
          getSiteAdminProfile(auth.accessToken),
          getSiteAdminOverview(auth.accessToken),
          listSiteTenants(auth.accessToken, { limit: 50, search: query || undefined }),
          listPlatformAdmins(auth.accessToken, {
            limit: 100,
            search: adminSearch || undefined,
            level: adminLevelFilter || undefined,
            status: adminStatusFilter || undefined,
          }),
          listSiteSecurityEvents(auth.accessToken, {
            limit: 100,
            search: securitySearch || undefined,
            severity: securitySeverityFilter || undefined,
            status: securityStatusFilter || undefined,
            tenantId: securityTenantFilter || undefined,
            type: securityTypeFilter || undefined,
          }),
          listPlatformAuditLogs(auth.accessToken, {
            limit: 100,
            search: auditSearch || undefined,
            tenantId: auditTenantFilter || undefined,
            action: auditActionFilter || undefined,
          }),
        ]);

      if (profileResult.status === "fulfilled") setProfile(profileResult.value);
      if (overviewResult.status === "fulfilled") setOverview(overviewResult.value);
      if (tenantsResult.status === "fulfilled") setTenants(tenantsResult.value.data);
      if (adminsResult.status === "fulfilled") setAdmins(adminsResult.value.data);
      if (eventsResult.status === "fulfilled") setSecurityEvents(eventsResult.value.data);
      if (auditResult.status === "fulfilled") setAuditLogs(auditResult.value.data);

      const rejected = [profileResult, overviewResult, tenantsResult, adminsResult, eventsResult, auditResult].find(
        (result) => result.status === "rejected",
      );
      if (rejected?.status === "rejected") {
        setError(rejected.reason instanceof Error ? rejected.reason.message : "Some site admin data could not be loaded.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load site admin console.");
    }
  }, [
    access.canViewSiteAdmin,
    adminLevelFilter,
    adminSearch,
    adminStatusFilter,
    auditActionFilter,
    auditSearch,
    auditTenantFilter,
    auth.accessToken,
    query,
    securitySearch,
    securitySeverityFilter,
    securityStatusFilter,
    securityTenantFilter,
    securityTypeFilter,
  ]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadSiteAdmin(), 0);
    return () => window.clearTimeout(t);
  }, [loadSiteAdmin]);

  useEffect(() => {
    if (activeTab !== "admins" || !canMutatePlatform) {
      return;
    }

    const search = adminCandidateQuery.trim();
    if (search.length < 2) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) setCandidateLoading(true);
      void listSiteUsers(auth.accessToken, { limit: 10, search })
        .then((result) => {
          if (!cancelled) setAdminCandidates(result.data);
        })
        .catch(() => {
          if (!cancelled) setAdminCandidates([]);
        })
        .finally(() => {
          if (!cancelled) setCandidateLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeTab, adminCandidateQuery, auth.accessToken, canMutatePlatform]);

  async function changeTenantStatus(tenant: Tenant, status: string) {
    const confirmed = await confirm({
      title: `${status === "ACTIVE" ? "Reactivate" : "Change"} ${tenant.name}?`,
      description:
        status === "SUSPENDED"
          ? "Suspending a tenant revokes active sessions and blocks login until reactivated."
          : `This will set tenant status to ${status}. Platform audit and security events will be recorded.`,
      confirmLabel: status === "ACTIVE" ? "Reactivate tenant" : "Apply status",
      tone: status === "SUSPENDED" || status === "CANCELLED" ? "danger" : "warning",
    });
    if (!confirmed) return;

    setBusy(`status:${tenant.id}`);
    try {
      await updateSiteTenantStatus(auth.accessToken, tenant.id, {
        status,
        reason: `Changed from site admin console by ${user.email}`,
      });
      toast({ title: "Tenant status updated", description: `${tenant.name} is now ${status}.`, variant: "success" });
      await loadSiteAdmin();
    } catch (caught) {
      toast({
        title: "Status update failed",
        description: caught instanceof Error ? caught.message : "Unable to update tenant status.",
        variant: "error",
      });
    } finally {
      setBusy("");
    }
  }

  async function onGrantPlatformAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const userId = String(formData.get("userId") ?? "").trim();
    const level = String(formData.get("level") ?? "SUPPORT") as PlatformAdminLevel;
    const scopes = String(formData.get("scopes") ?? "")
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean);
    const notes = String(formData.get("notes") ?? "").trim();

    if (!userId) {
      toast({ title: "User ID required", description: "Select or paste an existing user ID.", variant: "warning" });
      return;
    }

    setBusy("grant");
    try {
      await grantPlatformAdmin(auth.accessToken, {
        userId,
        level,
        scopes,
        notes: notes || undefined,
      });
      toast({ title: "Platform admin granted", description: "The user now has platform admin access.", variant: "success" });
      form.reset();
      setSelectedAdminCandidate(null);
      setAdminCandidateQuery("");
      setAdminCandidates([]);
      await loadSiteAdmin();
    } catch (caught) {
      toast({
        title: "Grant failed",
        description: caught instanceof Error ? caught.message : "Unable to grant platform admin access.",
        variant: "error",
      });
    } finally {
      setBusy("");
    }
  }

  async function onReactivatePlatformAdmin(grant: PlatformAdminGrant) {
    const confirmed = await confirm({
      title: `Reactivate ${grant.user.email}?`,
      description: `This restores the previous ${grant.level} platform-admin grant and records a platform audit event.`,
      confirmLabel: "Reactivate access",
      tone: "warning",
    });
    if (!confirmed) return;

    setBusy(`restore:${grant.id}`);
    try {
      await grantPlatformAdmin(auth.accessToken, {
        userId: grant.userId,
        level: grant.level,
        scopes: grant.scopes,
        notes: `Reactivated by ${user.email}`,
      });
      toast({ title: "Platform admin reactivated", description: `${grant.user.email} has platform access again.`, variant: "success" });
      await loadSiteAdmin();
    } catch (caught) {
      toast({
        title: "Reactivation failed",
        description: caught instanceof Error ? caught.message : "Unable to reactivate platform admin access.",
        variant: "error",
      });
    } finally {
      setBusy("");
    }
  }

  async function onRevokePlatformAdmin(grant: PlatformAdminGrant) {
    const confirmed = await confirm({
      title: `Revoke ${grant.user.email}?`,
      description: "This removes platform-admin access and records a platform audit event.",
      confirmLabel: "Revoke access",
      tone: "danger",
    });
    if (!confirmed) return;

    setBusy(`revoke:${grant.id}`);
    try {
      await revokePlatformAdmin(auth.accessToken, grant.id, { reason: `Revoked by ${user.email}` });
      toast({ title: "Platform admin revoked", description: `${grant.user.email} no longer has platform access.`, variant: "success" });
      await loadSiteAdmin();
    } catch (caught) {
      toast({
        title: "Revoke failed",
        description: caught instanceof Error ? caught.message : "Unable to revoke platform admin access.",
        variant: "error",
      });
    } finally {
      setBusy("");
    }
  }

  async function onUpdateSecurityEvent(event: SecurityEvent, status: SecurityEventStatus) {
    const confirmed = await confirm({
      title: `${status.replaceAll("_", " ")} security event?`,
      description: `This updates ${event.type} for ${event.tenant?.name ?? "platform"} and records a platform audit event.`,
      confirmLabel: `Mark ${status.toLowerCase()}`,
      tone: status === "DISMISSED" ? "danger" : "warning",
    });
    if (!confirmed) return;

    setBusy(`security:${event.id}:${status}`);
    try {
      await updateSiteSecurityEvent(auth.accessToken, event.id, { status });
      toast({
        title: "Security event updated",
        description: `${event.type} is now ${status}.`,
        variant: "success",
      });
      await loadSiteAdmin();
    } catch (caught) {
      toast({
        title: "Security update failed",
        description: caught instanceof Error ? caught.message : "Unable to update security event.",
        variant: "error",
      });
    } finally {
      setBusy("");
    }
  }

  const filteredTenants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter((tenant) => `${tenant.name} ${tenant.slug} ${tenant.status}`.toLowerCase().includes(q));
  }, [query, tenants]);

  if (!access.canViewSiteAdmin) {
    return (
      <div className="mx-auto max-w-2xl">
        <DarkPanel title="Site admin access required" eyebrow="Platform boundary" accent="#f87171">
          <p className="text-[13px] leading-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Tenant owners manage only their own tenant. Platform-wide tenant, user, status, security, and audit controls require a Site Admin grant.
          </p>
          <div className="mt-5 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.3)" }}>Your current role</p>
            <p className="mt-1.5 text-lg font-black text-white">{roleLabel(user)}</p>
          </div>
        </DarkPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {error ? (
        <div className="rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>{error}</div>
      ) : null}

      {/* OVERVIEW */}
      {activeTab === "overview" ? (
        <OverviewDashboard
          busy={busy}
          canMutatePlatform={canMutatePlatform}
          currentRole={roleLabel(user)}
          onChangeTenantStatus={changeTenantStatus}
          overview={overview}
          platformLevel={profile?.level ?? user.platformAdminLevel ?? "ADMIN"}
        />
      ) : null}

      {/* TENANTS */}
      {activeTab === "tenants" ? (
        <TenantDirectoryDashboard
          allTenants={tenants}
          busy={busy}
          canMutatePlatform={canMutatePlatform}
          onChangeTenantStatus={changeTenantStatus}
          onQueryChange={setQuery}
          query={query}
          tenants={filteredTenants}
        />
      ) : null}

      {/* ADMINS */}
      {activeTab === "admins" ? (
        <PlatformAdminsDashboard
          adminLevelFilter={adminLevelFilter}
          adminSearch={adminSearch}
          adminStatusFilter={adminStatusFilter}
          admins={admins}
          busy={busy}
          canMutatePlatform={canMutatePlatform}
          candidateLoading={candidateLoading}
          candidateQuery={adminCandidateQuery}
          candidates={adminCandidates}
          currentUserId={user.id}
          onCandidateQueryChange={handleAdminCandidateQueryChange}
          onGrantPlatformAdmin={onGrantPlatformAdmin}
          onLevelFilterChange={setAdminLevelFilter}
          onReactivatePlatformAdmin={onReactivatePlatformAdmin}
          onRevokePlatformAdmin={onRevokePlatformAdmin}
          onSearchChange={setAdminSearch}
          onSelectCandidate={setSelectedAdminCandidate}
          onStatusFilterChange={setAdminStatusFilter}
          selectedCandidate={selectedAdminCandidate}
        />
      ) : null}

      {/* SECURITY */}
      {activeTab === "security" ? (
        <SecurityOperationsDashboard
          busy={busy}
          canManageSecurity={canMutatePlatform || user.platformAdminLevel === "SUPPORT"}
          events={securityEvents}
          onSearchChange={setSecuritySearch}
          onSeverityFilterChange={setSecuritySeverityFilter}
          onStatusFilterChange={setSecurityStatusFilter}
          onTenantFilterChange={setSecurityTenantFilter}
          onTypeFilterChange={setSecurityTypeFilter}
          onUpdateEvent={onUpdateSecurityEvent}
          search={securitySearch}
          severityFilter={securitySeverityFilter}
          statusFilter={securityStatusFilter}
          tenantFilter={securityTenantFilter}
          tenants={tenants}
          typeFilter={securityTypeFilter}
        />
      ) : null}

      {/* AUDIT */}
      {activeTab === "audit" ? (
        <AuditTrailDashboard
          actionFilter={auditActionFilter}
          logs={auditLogs}
          onActionFilterChange={setAuditActionFilter}
          onSearchChange={setAuditSearch}
          onSelectLog={setSelectedAuditLog}
          onTenantFilterChange={setAuditTenantFilter}
          search={auditSearch}
          selectedLog={selectedAuditLog}
          tenantFilter={auditTenantFilter}
          tenants={tenants}
        />
      ) : null}
    </div>
  );
}

const platformLevelCopy: Record<PlatformAdminLevel, { color: string; description: string; scope: string }> = {
  OWNER: {
    color: "#dc2626",
    description: "Full platform control, owner grants, destructive tenant actions, and security recovery.",
    scope: "platform:owner",
  },
  ADMIN: {
    color: "#6d5dd3",
    description: "Platform operations, tenant lifecycle, user support, security review, and audit workflows.",
    scope: "platform:admin",
  },
  SUPPORT: {
    color: "#2563eb",
    description: "Support diagnostics, tenant inspection, user issue review, and limited operational actions.",
    scope: "support:read",
  },
  AUDITOR: {
    color: "#059669",
    description: "Read-only compliance view for tenants, audit trails, security events, and admin history.",
    scope: "audit:read",
  },
};

function SlimPageHeader({
  action,
  accent,
  icon: Icon,
  subtitle,
  title,
}: {
  action?: ReactNode;
  accent: string;
  icon: typeof Building2;
  subtitle: string;
  title: string;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: `${accent}18` }}>
          <Icon className="size-4" style={{ color: accent }} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black leading-tight text-[#111111]">{title}</h1>
          <p className="truncate text-[12px] font-semibold text-[#8a8375]">{subtitle}</p>
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </header>
  );
}

function PlatformAdminsDashboard({
  adminLevelFilter,
  adminSearch,
  adminStatusFilter,
  admins,
  busy,
  canMutatePlatform,
  candidateLoading,
  candidateQuery,
  candidates,
  currentUserId,
  onCandidateQueryChange,
  onGrantPlatformAdmin,
  onLevelFilterChange,
  onReactivatePlatformAdmin,
  onRevokePlatformAdmin,
  onSearchChange,
  onSelectCandidate,
  onStatusFilterChange,
  selectedCandidate,
}: {
  adminLevelFilter: PlatformAdminLevel | "";
  adminSearch: string;
  adminStatusFilter: PlatformAdminStatus | "";
  admins: PlatformAdminGrant[];
  busy: string;
  canMutatePlatform: boolean;
  candidateLoading: boolean;
  candidateQuery: string;
  candidates: TenantUser[];
  currentUserId: string;
  onCandidateQueryChange: (value: string) => void;
  onGrantPlatformAdmin: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onLevelFilterChange: (value: PlatformAdminLevel | "") => void;
  onReactivatePlatformAdmin: (grant: PlatformAdminGrant) => void | Promise<void>;
  onRevokePlatformAdmin: (grant: PlatformAdminGrant) => void | Promise<void>;
  onSearchChange: (value: string) => void;
  onSelectCandidate: (user: TenantUser | null) => void;
  onStatusFilterChange: (value: PlatformAdminStatus | "") => void;
  selectedCandidate: TenantUser | null;
}) {
  const activeAdmins = admins.filter((grant) => grant.status === "ACTIVE");
  const revokedAdmins = admins.filter((grant) => grant.status === "REVOKED");
  const owners = activeAdmins.filter((grant) => grant.level === "OWNER");
  const adminsByLevel = (level: PlatformAdminLevel) => activeAdmins.filter((grant) => grant.level === level).length;
  const selectedExistingGrant = selectedCandidate
    ? admins.find((grant) => grant.userId === selectedCandidate.id && grant.status === "ACTIVE")
    : undefined;

  return (
    <div className="space-y-5">
      <SlimPageHeader
        accent="#d89b00"
        icon={Crown}
        title="Site Admin Access"
        subtitle={`${activeAdmins.length} active grants - ${owners.length} owners - ${revokedAdmins.length} revoked`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard color="#dc2626" icon={Crown} label="Owners" meta="highest trust" value={owners.length} />
        <AdminMetricCard color="#059669" icon={UserCheck} label="Active grants" meta="can enter site admin" value={activeAdmins.length} />
        <AdminMetricCard color="#2563eb" icon={Clock3} label="Support" meta="operational support" value={adminsByLevel("SUPPORT")} />
        <AdminMetricCard color="#8a8375" icon={Ban} label="Revoked" meta="kept for audit" value={revokedAdmins.length} />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center">
          <LightSearch value={adminSearch} onChange={onSearchChange} placeholder="Search admins by email, tenant, level, or scope..." />
          <label className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3" style={{ border: "1px solid #ded8c8" }}>
            <SlidersHorizontal className="size-4 text-[#8a8375]" aria-hidden="true" />
            <select
              value={adminLevelFilter}
              onChange={(event) => onLevelFilterChange(event.target.value as PlatformAdminLevel | "")}
              className="bg-transparent text-[12px] font-black text-[#111111] outline-none"
            >
              <option value="">All levels</option>
              <option value="OWNER">Owners</option>
              <option value="ADMIN">Admins</option>
              <option value="SUPPORT">Support</option>
              <option value="AUDITOR">Auditors</option>
            </select>
          </label>
          <label className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3" style={{ border: "1px solid #ded8c8" }}>
            <ShieldCheck className="size-4 text-[#8a8375]" aria-hidden="true" />
            <select
              value={adminStatusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value as PlatformAdminStatus | "")}
              className="bg-transparent text-[12px] font-black text-[#111111] outline-none"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onLevelFilterChange("");
              onStatusFilterChange("");
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[12px] font-black text-[#111111] transition hover:bg-[#ffd400]"
            style={{ border: "1px solid #ded8c8" }}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
          <div className="grid gap-3 border-b border-[#eee8dc] px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">Platform grants</p>
              <h2 className="mt-1 text-[15px] font-black text-[#111111]">{admins.length} grants returned</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <TenantSmallStat label="Active" value={activeAdmins.length} color="#059669" />
              <TenantSmallStat label="Owner" value={owners.length} color="#dc2626" />
              <TenantSmallStat label="Revoked" value={revokedAdmins.length} color="#8a8375" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1040px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#eee8dc] bg-[#fbfaf6] text-[10px] font-black uppercase tracking-[0.14em] text-[#8a8375]">
                  <th className="px-5 py-3">Administrator</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tenant home</th>
                  <th className="px-4 py-3">Scopes</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee8dc]">
                {admins.map((grant) => (
                  <PlatformGrantRow
                    key={grant.id}
                    busy={busy === `revoke:${grant.id}` || busy === `restore:${grant.id}`}
                    canMutate={canMutatePlatform}
                    currentUserId={currentUserId}
                    grant={grant}
                    onReactivate={onReactivatePlatformAdmin}
                    onRevoke={onRevokePlatformAdmin}
                  />
                ))}
              </tbody>
            </table>
            {admins.length === 0 ? <OverviewEmpty text="No platform admin grants match this view." /> : null}
          </div>
        </div>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
            <div className="border-b border-[#eee8dc] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-[3px] w-6 rounded-full bg-[#ffd400]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">Grant access</p>
              </div>
              <h2 className="mt-1 text-[15px] font-black text-[#111111]">Add or restore site admin</h2>
            </div>

            <div className="p-5">
              {canMutatePlatform ? (
                <form className="space-y-4" onSubmit={onGrantPlatformAdmin}>
                  <input type="hidden" name="userId" value={selectedCandidate?.id ?? ""} />
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">User search</label>
                    <div className="flex h-12 items-center gap-2.5 rounded-2xl bg-[#fbfaf6] px-3.5" style={{ border: "1px solid #ded8c8" }}>
                      <Search className="size-4 shrink-0 text-[#8a8375]" aria-hidden="true" />
                      <input
                        value={candidateQuery}
                        onChange={(event) => {
                          onCandidateQueryChange(event.target.value);
                          onSelectCandidate(null);
                        }}
                        placeholder="Search email, name, or tenant..."
                        className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[#111111] outline-none placeholder:text-[#9a9388]"
                      />
                    </div>
                    <div className="mt-2 space-y-2">
                      {selectedCandidate ? (
                        <CandidateUserCard selected user={selectedCandidate} onSelect={() => onSelectCandidate(null)} />
                      ) : null}
                      {!selectedCandidate && candidateQuery.trim().length >= 2 ? (
                        <div className="max-h-[250px] overflow-y-auto rounded-2xl bg-[#fbfaf6] p-2" style={{ border: "1px solid #e7dfcf" }}>
                          {candidateLoading ? <OverviewEmpty text="Searching platform users..." /> : null}
                          {!candidateLoading && candidates.map((candidate) => (
                            <CandidateUserCard key={candidate.id} user={candidate} onSelect={() => onSelectCandidate(candidate)} />
                          ))}
                          {!candidateLoading && candidates.length === 0 ? <OverviewEmpty text="No platform user matched this search." /> : null}
                        </div>
                      ) : null}
                    </div>
                    {selectedExistingGrant ? (
                      <p className="mt-2 rounded-2xl bg-[#fff7d8] px-3 py-2 text-[11px] font-bold text-[#8a5a00]" style={{ border: "1px solid #f4d26a" }}>
                        This user already has an active {selectedExistingGrant.level} platform grant. Submitting updates the level, scopes, and notes.
                      </p>
                    ) : null}
                  </div>

                  <AdminFormField label="Platform level">
                    <select name="level" className={adminFormControlClass} defaultValue="SUPPORT">
                      <option value="AUDITOR">Auditor</option>
                      <option value="SUPPORT">Support</option>
                      <option value="ADMIN">Admin</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  </AdminFormField>
                  <AdminFormField label="Scopes">
                    <input name="scopes" className={adminFormControlClass} placeholder="platform:read, tenants:manage, audit:read" />
                  </AdminFormField>
                  <AdminFormField label="Reason">
                    <textarea name="notes" className={`${adminFormControlClass} min-h-[92px] resize-none py-3`} placeholder="Why this user needs platform access" />
                  </AdminFormField>
                  <button
                    type="submit"
                    disabled={busy === "grant" || !selectedCandidate}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#ffd400] text-[13px] font-black text-[#111111] shadow-[0_14px_32px_rgba(255,212,0,0.22)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserPlus className="size-4" aria-hidden="true" />
                    Grant platform access
                  </button>
                </form>
              ) : (
                <OverviewEmpty text="Your platform level can inspect grants but cannot create, update, reactivate, or revoke them." />
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
            <div className="border-b border-[#eee8dc] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-[3px] w-6 rounded-full bg-[#6d5dd3]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">Role model</p>
              </div>
              <h2 className="mt-1 text-[15px] font-black text-[#111111]">Grant levels</h2>
            </div>
            <div className="space-y-2 p-5">
              {(["OWNER", "ADMIN", "SUPPORT", "AUDITOR"] as PlatformAdminLevel[]).map((level) => (
                <LevelPolicyCard key={level} level={level} count={adminsByLevel(level)} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

const adminFormControlClass =
  "h-11 w-full rounded-2xl border border-[#ded8c8] bg-[#fbfaf6] px-3.5 text-[13px] font-semibold text-[#111111] outline-none transition placeholder:text-[#9a9388] focus:border-[#ffd400] focus:ring-2 focus:ring-[#ffd400]/20";

function AdminMetricCard({ color, icon: Icon, label, meta, value }: { color: string; icon: typeof Building2; label: string; meta: string; value: number }) {
  return (
    <div className="rounded-[20px] bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a8375]">{label}</p>
          <p className="mt-2 text-[30px] font-black leading-none tabular-nums" style={{ color }}>{value}</p>
          <p className="mt-2 text-[11px] font-bold text-[#766f63]">{meta}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${color}16`, border: `1px solid ${color}26` }}>
          <Icon className="size-4" style={{ color }} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function PlatformGrantRow({
  busy,
  canMutate,
  currentUserId,
  grant,
  onReactivate,
  onRevoke,
}: {
  busy: boolean;
  canMutate: boolean;
  currentUserId: string;
  grant: PlatformAdminGrant;
  onReactivate: (grant: PlatformAdminGrant) => void | Promise<void>;
  onRevoke: (grant: PlatformAdminGrant) => void | Promise<void>;
}) {
  const isCurrentUser = grant.userId === currentUserId;

  return (
    <tr className="transition hover:bg-[#fbfaf6]">
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4f1e7] text-[12px] font-bold text-[#5f574c]" style={{ border: "1px solid #ded8c8" }}>
            {initials(grant.user.email)}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="block truncate text-[13px] font-semibold text-[#25221e]">{grant.user.email}</span>
              {isCurrentUser ? <span className="rounded-full bg-[#fff7d8] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#8a5a00]">You</span> : null}
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-medium text-[#8a8375]">
              {[grant.user.firstName, grant.user.lastName].filter(Boolean).join(" ") || "No profile name"}
            </span>
          </span>
        </div>
      </td>
      <td className="px-4 py-4"><PlatformLevelBadge level={grant.level} /></td>
      <td className="px-4 py-4"><SoftStatusBadge status={grant.status} /></td>
      <td className="px-4 py-4">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-[#25221e]">{grant.user.tenant.name}</p>
          <p className="mt-0.5 truncate text-[10px] font-semibold text-[#8a8375]">@{grant.user.tenant.slug}</p>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex max-w-[260px] flex-wrap gap-1.5">
          {grant.scopes.length ? grant.scopes.slice(0, 3).map((scope) => <ScopeChip key={scope} scope={scope} />) : <span className="text-[11px] font-semibold text-[#8a8375]">Default level scope</span>}
          {grant.scopes.length > 3 ? <ScopeChip scope={`+${grant.scopes.length - 3}`} /> : null}
        </div>
      </td>
      <td className="px-4 py-4 text-[11px] font-semibold tabular-nums text-[#766f63]">{formatDate(grant.updatedAt)}</td>
      <td className="px-5 py-4">
        <details className="group relative flex justify-end">
          <summary
            aria-label={`Open actions for ${grant.user.email}`}
            className="ml-auto flex size-9 cursor-pointer list-none items-center justify-center rounded-xl bg-white text-[#5f574c] transition hover:bg-[#f4f1e7]"
            style={{ border: "1px solid #ded8c8" }}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-2xl bg-white py-1.5 shadow-[0_22px_60px_rgba(17,17,17,0.18)]" style={{ border: "1px solid #ded8c8" }}>
            <Link href={`/site-admin/tenants/${grant.user.tenant.id}`} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-black text-[#111111] transition hover:bg-[#fbfaf6]">
              <Building2 className="size-3.5" aria-hidden="true" />
              View tenant
            </Link>
            {canMutate && grant.status === "ACTIVE" && !isCurrentUser ? (
              <button type="button" onClick={() => onRevoke(grant)} disabled={busy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-black text-[#dc2626] transition hover:bg-red-50 disabled:opacity-50">
                <Ban className="size-3.5" aria-hidden="true" />
                Revoke access
              </button>
            ) : null}
            {canMutate && grant.status === "REVOKED" ? (
              <button type="button" onClick={() => onReactivate(grant)} disabled={busy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-black text-[#047857] transition hover:bg-emerald-50 disabled:opacity-50">
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Reactivate grant
              </button>
            ) : null}
            {isCurrentUser ? (
              <span className="block px-3 py-2 text-[11px] font-bold text-[#8a8375]">Self-revocation is hidden here.</span>
            ) : null}
          </div>
        </details>
      </td>
    </tr>
  );
}

function CandidateUserCard({ onSelect, selected, user }: { onSelect: () => void; selected?: boolean; user: TenantUser }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left transition hover:bg-[#fff7d8]"
      style={{ border: selected ? "1px solid #ffd400" : "1px solid #e7dfcf" }}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4f1e7] text-[12px] font-bold text-[#5f574c]" style={{ border: "1px solid #ded8c8" }}>
        {initials(user.email)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-black text-[#111111]">{user.email}</span>
        <span className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold text-[#766f63]">
          <Mail className="size-3" aria-hidden="true" />
          {user.tenant?.name ?? "Tenant"} - @{user.tenant?.slug ?? user.tenantId}
        </span>
      </span>
      <SoftStatusBadge status={selected ? "SELECTED" : user.status ?? "UNKNOWN"} />
    </button>
  );
}

function AdminFormField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{label}</span>
      {children}
    </label>
  );
}

function LevelPolicyCard({ count, level }: { count: number; level: PlatformAdminLevel }) {
  const meta = platformLevelCopy[level];
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-3.5" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-center justify-between gap-3">
        <PlatformLevelBadge level={level} />
        <span className="text-lg font-black tabular-nums" style={{ color: meta.color }}>{count}</span>
      </div>
      <p className="mt-2 text-[11px] font-semibold leading-5 text-[#665f54]">{meta.description}</p>
      <ScopeChip scope={meta.scope} />
    </div>
  );
}

function PlatformLevelBadge({ level }: { level: PlatformAdminLevel }) {
  const meta = platformLevelCopy[level];
  const Icon = level === "OWNER" ? Crown : level === "ADMIN" ? ShieldCheck : level === "SUPPORT" ? UserCheck : Fingerprint;

  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-full px-3 text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: `${meta.color}14`, color: meta.color, border: `1px solid ${meta.color}30` }}>
      <Icon className="size-3.5" aria-hidden="true" />
      {level}
    </span>
  );
}

function ScopeChip({ scope }: { scope: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-[#fbfaf6] px-2.5 text-[9px] font-black text-[#5f574c]" style={{ border: "1px solid #e7dfcf" }}>
      {scope}
    </span>
  );
}

function initials(value: string) {
  const clean = value.trim();
  if (!clean) return "??";
  const [name, domain] = clean.split("@");
  const source = name || domain || clean;
  return source.slice(0, 2).toUpperCase();
}

function SecurityOperationsDashboard({
  busy,
  canManageSecurity,
  events,
  onSearchChange,
  onSeverityFilterChange,
  onStatusFilterChange,
  onTenantFilterChange,
  onTypeFilterChange,
  onUpdateEvent,
  search,
  severityFilter,
  statusFilter,
  tenantFilter,
  tenants,
  typeFilter,
}: {
  busy: string;
  canManageSecurity: boolean;
  events: SecurityEvent[];
  onSearchChange: (value: string) => void;
  onSeverityFilterChange: (value: SecurityEventSeverity | "") => void;
  onStatusFilterChange: (value: SecurityEventStatus | "") => void;
  onTenantFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onUpdateEvent: (event: SecurityEvent, status: SecurityEventStatus) => void | Promise<void>;
  search: string;
  severityFilter: SecurityEventSeverity | "";
  statusFilter: SecurityEventStatus | "";
  tenantFilter: string;
  tenants: Tenant[];
  typeFilter: string;
}) {
  const openEvents = events.filter((event) => event.status === "OPEN");
  const criticalEvents = events.filter((event) => event.severity === "CRITICAL" || event.severity === "HIGH");
  const unresolvedEvents = events.filter((event) => event.status === "OPEN" || event.status === "ACKNOWLEDGED");
  const resolvedEvents = events.filter((event) => event.status === "RESOLVED" || event.status === "DISMISSED");
  const eventTypes = Array.from(new Set(events.map((event) => event.type).filter(Boolean))).slice(0, 12);
  const tenantPressure = Array.from(
    events.reduce((map, event) => {
      const key = event.tenant?.id ?? "platform";
      const current = map.get(key) ?? {
        id: key,
        name: event.tenant?.name ?? "Platform",
        slug: event.tenant?.slug ?? "platform",
        critical: 0,
        open: 0,
        total: 0,
      };
      current.total += 1;
      if (event.status === "OPEN") current.open += 1;
      if (event.severity === "CRITICAL" || event.severity === "HIGH") current.critical += 1;
      map.set(key, current);
      return map;
    }, new Map<string, { id: string; name: string; slug: string; critical: number; open: number; total: number }>()),
  ).map(([, value]) => value).sort((a, b) => b.open + b.critical - (a.open + a.critical)).slice(0, 5);
  const pressureScore = events.length > 0
    ? Math.min(100, Math.round((openEvents.length / events.length) * 55 + (criticalEvents.length / events.length) * 45))
    : 0;
  const pressureColor = pressureScore >= 70 ? "#dc2626" : pressureScore >= 35 ? "#d89b00" : "#059669";

  return (
    <div className="space-y-5">
      <SlimPageHeader
        accent="#dc2626"
        icon={AlertTriangle}
        title="Security Event Center"
        subtitle={`${openEvents.length} open - ${criticalEvents.length} critical/high - ${resolvedEvents.length} closed`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard color="#dc2626" icon={AlertTriangle} label="Open events" meta="need action" value={openEvents.length} />
        <AdminMetricCard color="#d89b00" icon={Gauge} label="High pressure" meta="critical + high" value={criticalEvents.length} />
        <AdminMetricCard color="#2563eb" icon={Clock3} label="Acknowledged" meta="under review" value={events.filter((event) => event.status === "ACKNOWLEDGED").length} />
        <AdminMetricCard color="#059669" icon={CheckCircle2} label="Closed" meta="resolved/dismissed" value={resolvedEvents.length} />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center xl:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto_auto]">
          <LightSearch value={search} onChange={onSearchChange} placeholder="Search event type, source, subject, or tenant..." />
          <SecuritySelect icon={AlertTriangle} value={severityFilter} onChange={(value) => onSeverityFilterChange(value as SecurityEventSeverity | "")}>
            <option value="">All severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Info</option>
          </SecuritySelect>
          <SecuritySelect icon={ShieldCheck} value={statusFilter} onChange={(value) => onStatusFilterChange(value as SecurityEventStatus | "")}>
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </SecuritySelect>
          <SecuritySelect icon={Building2} value={tenantFilter} onChange={onTenantFilterChange}>
            <option value="">All tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </SecuritySelect>
          <SecuritySelect icon={Fingerprint} value={typeFilter} onChange={onTypeFilterChange}>
            <option value="">All types</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </SecuritySelect>
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onSeverityFilterChange("");
              onStatusFilterChange("");
              onTenantFilterChange("");
              onTypeFilterChange("");
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[12px] font-black text-[#111111] transition hover:bg-[#ffd400]"
            style={{ border: "1px solid #ded8c8" }}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
          <div className="grid gap-3 border-b border-[#eee8dc] px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">Event stream</p>
              <h2 className="mt-1 text-[15px] font-black text-[#111111]">{events.length} security events returned</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <TenantSmallStat label="Unresolved" value={unresolvedEvents.length} color="#d89b00" />
              <TenantSmallStat label="Critical/high" value={criticalEvents.length} color="#dc2626" />
              <TenantSmallStat label="Tenants" value={tenantPressure.length} color="#2563eb" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#eee8dc] bg-[#fbfaf6] text-[10px] font-black uppercase tracking-[0.14em] text-[#8a8375]">
                  <th className="px-5 py-3">Signal</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee8dc]">
                {events.map((event) => (
                  <SecurityEventRow
                    key={event.id}
                    busy={busy.startsWith(`security:${event.id}:`)}
                    canManageSecurity={canManageSecurity}
                    event={event}
                    onUpdateEvent={onUpdateEvent}
                  />
                ))}
              </tbody>
            </table>
            {events.length === 0 ? <OverviewEmpty text="No security events match this view." /> : null}
          </div>
        </div>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
            <div className="border-b border-[#eee8dc] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-[3px] w-6 rounded-full" style={{ background: pressureColor }} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">Pressure</p>
              </div>
              <h2 className="mt-1 text-[15px] font-black text-[#111111]">Security pressure score</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-[96px_1fr] items-center gap-4">
                <div
                  className="grid size-24 place-items-center rounded-full text-2xl font-black"
                  style={{
                    background: `conic-gradient(${pressureColor} ${pressureScore * 3.6}deg, #ece7da 0deg)`,
                    color: pressureColor,
                  }}
                >
                  <div className="grid size-16 place-items-center rounded-full bg-white">{pressureScore}</div>
                </div>
                <div>
                  <p className="text-[12px] font-black text-[#111111]">{pressureScore >= 70 ? "Immediate review" : pressureScore >= 35 ? "Watch closely" : "Stable"}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-5 text-[#665f54]">
                    Based on open event ratio and critical/high severity density in the current filtered result.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
            <div className="border-b border-[#eee8dc] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-[3px] w-6 rounded-full bg-[#dc2626]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">Tenants</p>
              </div>
              <h2 className="mt-1 text-[15px] font-black text-[#111111]">Tenant pressure</h2>
            </div>
            <div className="space-y-2 p-5">
              {tenantPressure.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => onTenantFilterChange(tenant.id === "platform" ? "" : tenant.id)}
                  className="w-full rounded-2xl bg-[#fbfaf6] p-3 text-left transition hover:bg-[#fff7d8]"
                  style={{ border: "1px solid #e7dfcf" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-black text-[#111111]">{tenant.name}</p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-[#766f63]">@{tenant.slug}</p>
                    </div>
                    <span className="text-lg font-black tabular-nums" style={{ color: tenant.open > 0 ? "#dc2626" : "#059669" }}>{tenant.open}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <ScopeChip scope={`${tenant.total} total`} />
                    <ScopeChip scope={`${tenant.critical} critical/high`} />
                  </div>
                </button>
              ))}
              {tenantPressure.length === 0 ? <OverviewEmpty text="No tenant pressure in this view." /> : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function SecuritySelect({
  children,
  icon: Icon,
  onChange,
  value,
}: {
  children: ReactNode;
  icon: typeof Building2;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-2xl bg-white px-3" style={{ border: "1px solid #ded8c8" }}>
      <Icon className="size-4 shrink-0 text-[#8a8375]" aria-hidden="true" />
      <select value={value} onChange={(event) => onChange(event.target.value)} className="max-w-[180px] bg-transparent text-[12px] font-black text-[#111111] outline-none">
        {children}
      </select>
    </label>
  );
}

function SecurityEventRow({
  busy,
  canManageSecurity,
  event,
  onUpdateEvent,
}: {
  busy: boolean;
  canManageSecurity: boolean;
  event: SecurityEvent;
  onUpdateEvent: (event: SecurityEvent, status: SecurityEventStatus) => void | Promise<void>;
}) {
  return (
    <tr className="transition hover:bg-[#fbfaf6]">
      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#25221e]">{event.type}</p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-[#8a8375]">{event.source ?? "system"} - {event.requestId ?? "no request id"}</p>
        </div>
      </td>
      <td className="px-4 py-4"><SecuritySeverityBadge severity={event.severity} /></td>
      <td className="px-4 py-4"><SoftStatusBadge status={event.status} /></td>
      <td className="px-4 py-4">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-[#25221e]">{event.tenant?.name ?? "Platform"}</p>
          <p className="mt-0.5 truncate text-[10px] font-semibold text-[#8a8375]">@{event.tenant?.slug ?? "global"}</p>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="max-w-[210px] truncate text-[11px] font-semibold text-[#5f574c]">{event.subjectType ?? "n/a"}{event.subjectId ? ` - ${event.subjectId}` : ""}</p>
      </td>
      <td className="px-4 py-4">
        <p className="max-w-[190px] truncate text-[11px] font-semibold text-[#5f574c]">{event.actor?.email ?? "system"}</p>
      </td>
      <td className="px-4 py-4 text-[11px] font-semibold tabular-nums text-[#766f63]">{formatDate(event.createdAt)}</td>
      <td className="px-5 py-4">
        <details className="group relative flex justify-end">
          <summary
            aria-label={`Open actions for ${event.type}`}
            className="ml-auto flex size-9 cursor-pointer list-none items-center justify-center rounded-xl bg-white text-[#5f574c] transition hover:bg-[#f4f1e7]"
            style={{ border: "1px solid #ded8c8" }}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-2xl bg-white py-1.5 shadow-[0_22px_60px_rgba(17,17,17,0.18)]" style={{ border: "1px solid #ded8c8" }}>
            {event.tenant?.id ? (
              <Link href={`/site-admin/tenants/${event.tenant.id}`} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-black text-[#111111] transition hover:bg-[#fbfaf6]">
                <Building2 className="size-3.5" aria-hidden="true" />
                Open tenant
              </Link>
            ) : null}
            {canManageSecurity && event.status === "OPEN" ? (
              <button type="button" onClick={() => onUpdateEvent(event, "ACKNOWLEDGED")} disabled={busy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-black text-[#2563eb] transition hover:bg-blue-50 disabled:opacity-50">
                <Clock3 className="size-3.5" aria-hidden="true" />
                Acknowledge
              </button>
            ) : null}
            {canManageSecurity && event.status !== "RESOLVED" ? (
              <button type="button" onClick={() => onUpdateEvent(event, "RESOLVED")} disabled={busy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-black text-[#047857] transition hover:bg-emerald-50 disabled:opacity-50">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Resolve
              </button>
            ) : null}
            {canManageSecurity && event.status !== "DISMISSED" ? (
              <button type="button" onClick={() => onUpdateEvent(event, "DISMISSED")} disabled={busy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-black text-[#dc2626] transition hover:bg-red-50 disabled:opacity-50">
                <XCircle className="size-3.5" aria-hidden="true" />
                Dismiss
              </button>
            ) : null}
            {canManageSecurity && event.status !== "OPEN" ? (
              <button type="button" onClick={() => onUpdateEvent(event, "OPEN")} disabled={busy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-black text-[#8a5a00] transition hover:bg-yellow-50 disabled:opacity-50">
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Reopen
              </button>
            ) : null}
            {!canManageSecurity ? <span className="block px-3 py-2 text-[11px] font-bold text-[#8a8375]">Read-only platform grant.</span> : null}
          </div>
        </details>
      </td>
    </tr>
  );
}

function SecuritySeverityBadge({ severity }: { severity: SecurityEventSeverity }) {
  const color =
    severity === "CRITICAL" ? "#dc2626" :
    severity === "HIGH" ? "#f87171" :
    severity === "MEDIUM" ? "#d89b00" :
    severity === "LOW" ? "#2563eb" :
    "#059669";

  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-full px-3 text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}>
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      {severity}
    </span>
  );
}

function AuditTrailDashboard({
  actionFilter,
  logs,
  onActionFilterChange,
  onSearchChange,
  onSelectLog,
  onTenantFilterChange,
  search,
  selectedLog,
  tenantFilter,
  tenants,
}: {
  actionFilter: string;
  logs: PlatformAuditLog[];
  onActionFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelectLog: (log: PlatformAuditLog | null) => void;
  onTenantFilterChange: (value: string) => void;
  search: string;
  selectedLog: PlatformAuditLog | null;
  tenantFilter: string;
  tenants: Tenant[];
}) {
  const actions = Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).slice(0, 20);
  const tenantLogs = logs.filter((log) => log.targetTenantId);
  const systemLogs = logs.filter((log) => !log.actorId);
  const actorCount = new Set(logs.map((log) => log.actorId ?? "system")).size;
  const entityCount = new Set(logs.map((log) => `${log.entityType}:${log.entityId ?? "unknown"}`)).size;
  const selected = selectedLog ?? logs[0] ?? null;
  const actionPressure = Array.from(
    logs.reduce((map, log) => {
      map.set(log.action, (map.get(log.action) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_60px_rgba(17,17,17,0.08)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,540px)] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <OverviewPill icon={<Fingerprint className="size-3.5" />} label="Immutable audit" color="#d89b00" />
              <OverviewPill icon={<ShieldCheck className="size-3.5" />} label="Platform actions" color="#6d5dd3" />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-[#111111] md:text-[34px]">Platform Audit Trail</h1>
            <p className="mt-2 max-w-2xl text-[13px] font-semibold leading-6 text-[#665f54]">
              Read-only history of site-admin changes, tenant lifecycle decisions, security actions, and platform grants. Audit records are preserved for accountability, not edited.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <AdminMetricCard color="#d89b00" icon={Fingerprint} label="Audit records" meta="current result" value={logs.length} />
            <AdminMetricCard color="#6d5dd3" icon={Building2} label="Tenant scoped" meta="targeted actions" value={tenantLogs.length} />
            <AdminMetricCard color="#2563eb" icon={Users} label="Actors" meta="unique identities" value={actorCount} />
            <AdminMetricCard color="#8a8375" icon={Activity} label="System" meta="automated entries" value={systemLogs.length} />
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#eee8dc] bg-[#fbfaf6] px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center md:px-6">
          <LightSearch value={search} onChange={onSearchChange} placeholder="Search action, entity, tenant, actor, or id..." />
          <SecuritySelect icon={Building2} value={tenantFilter} onChange={onTenantFilterChange}>
            <option value="">All tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </SecuritySelect>
          <SecuritySelect icon={Fingerprint} value={actionFilter} onChange={onActionFilterChange}>
            <option value="">All actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </SecuritySelect>
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onTenantFilterChange("");
              onActionFilterChange("");
              onSelectLog(null);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[12px] font-black text-[#111111] transition hover:bg-[#ffd400]"
            style={{ border: "1px solid #ded8c8" }}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
          <div className="grid gap-3 border-b border-[#eee8dc] px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">Audit stream</p>
              <h2 className="mt-1 text-[15px] font-black text-[#111111]">{logs.length} immutable records returned</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <TenantSmallStat label="Entities" value={entityCount} color="#6d5dd3" />
              <TenantSmallStat label="Actors" value={actorCount} color="#2563eb" />
              <TenantSmallStat label="System" value={systemLogs.length} color="#8a8375" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#eee8dc] bg-[#fbfaf6] text-[10px] font-black uppercase tracking-[0.14em] text-[#8a8375]">
                  <th className="px-5 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Target tenant</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee8dc]">
                {logs.map((log) => (
                  <AuditLogRow
                    key={log.id}
                    active={selected?.id === log.id}
                    log={log}
                    onSelect={() => onSelectLog(log)}
                  />
                ))}
              </tbody>
            </table>
            {logs.length === 0 ? <OverviewEmpty text="No audit records match this view." /> : null}
          </div>
        </div>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
            <div className="border-b border-[#eee8dc] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-[3px] w-6 rounded-full bg-[#d89b00]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">Selected record</p>
              </div>
              <h2 className="mt-1 text-[15px] font-black text-[#111111]">Audit evidence</h2>
            </div>
            <div className="p-5">
              {selected ? <AuditDetailPanel log={selected} /> : <OverviewEmpty text="Select a record to inspect audit evidence." />}
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
            <div className="border-b border-[#eee8dc] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-[3px] w-6 rounded-full bg-[#6d5dd3]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">Action mix</p>
              </div>
              <h2 className="mt-1 text-[15px] font-black text-[#111111]">Top actions</h2>
            </div>
            <div className="space-y-2 p-5">
              {actionPressure.map((item) => (
                <button
                  key={item.action}
                  type="button"
                  onClick={() => onActionFilterChange(item.action)}
                  className="w-full rounded-2xl bg-[#fbfaf6] p-3 text-left transition hover:bg-[#fff7d8]"
                  style={{ border: "1px solid #e7dfcf" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-[12px] font-black text-[#111111]">{item.action}</span>
                    <span className="text-lg font-black tabular-nums text-[#6d5dd3]">{item.count}</span>
                  </div>
                </button>
              ))}
              {actionPressure.length === 0 ? <OverviewEmpty text="No action data in this view." /> : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function AuditLogRow({
  active,
  log,
  onSelect,
}: {
  active: boolean;
  log: PlatformAuditLog;
  onSelect: () => void;
}) {
  return (
    <tr className="transition hover:bg-[#fbfaf6]" style={{ background: active ? "#fff7d8" : undefined }}>
      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#25221e]">{log.action}</p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-[#8a8375]">{log.id}</p>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="truncate text-[12px] font-semibold text-[#25221e]">{log.entityType}</p>
        <p className="mt-0.5 max-w-[220px] truncate text-[10px] font-semibold text-[#8a8375]">{log.entityId ?? "no entity id"}</p>
      </td>
      <td className="px-4 py-4">
        {log.targetTenant ? (
          <Link href={`/site-admin/tenants/${log.targetTenant.id}`} className="block min-w-0 hover:text-[#6d5dd3]">
            <p className="truncate text-[12px] font-semibold text-[#25221e]">{log.targetTenant.name}</p>
            <p className="mt-0.5 truncate text-[10px] font-semibold text-[#8a8375]">@{log.targetTenant.slug}</p>
          </Link>
        ) : (
          <span className="text-[11px] font-semibold text-[#8a8375]">Platform</span>
        )}
      </td>
      <td className="px-4 py-4">
        <p className="max-w-[190px] truncate text-[11px] font-semibold text-[#5f574c]">{log.actor?.email ?? "system"}</p>
      </td>
      <td className="px-4 py-4 text-[11px] font-semibold text-[#766f63]">{log.ipAddress ?? "unknown"}</td>
      <td className="px-4 py-4 text-[11px] font-semibold tabular-nums text-[#766f63]">{formatDate(log.createdAt)}</td>
      <td className="px-5 py-4 text-right">
        <button type="button" onClick={onSelect} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-white px-3 text-[11px] font-black text-[#111111] transition hover:bg-[#ffd400]" style={{ border: "1px solid #ded8c8" }}>
          <Eye className="size-3.5" aria-hidden="true" />
          Inspect
        </button>
      </td>
    </tr>
  );
}

function AuditDetailPanel({ log }: { log: PlatformAuditLog }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">Action</p>
        <p className="mt-1 break-words text-[14px] font-black text-[#111111]">{log.action}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <ScopeChip scope={log.entityType} />
          <ScopeChip scope={log.targetTenant?.slug ?? "platform"} />
          <ScopeChip scope={log.actor?.email ?? "system"} />
        </div>
      </div>

      <div className="grid gap-2">
        <AuditEvidenceLine label="Record ID" value={log.id} />
        <AuditEvidenceLine label="Entity ID" value={log.entityId ?? "n/a"} />
        <AuditEvidenceLine label="Target tenant" value={log.targetTenant?.name ?? "Platform"} />
        <AuditEvidenceLine label="Actor" value={log.actor?.email ?? "system"} />
        <AuditEvidenceLine label="IP address" value={log.ipAddress ?? "unknown"} />
        <AuditEvidenceLine label="Created" value={formatDate(log.createdAt)} />
      </div>

      <div className="space-y-3">
        <AuditJsonBlock label="Old value" value={log.oldValue} />
        <AuditJsonBlock label="New value" value={log.newValue} />
      </div>
    </div>
  );
}

function AuditEvidenceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] px-3 py-2.5" style={{ border: "1px solid #e7dfcf" }}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8a8375]">{label}</p>
      <p className="mt-1 break-words text-[12px] font-semibold text-[#25221e]">{value}</p>
    </div>
  );
}

function AuditJsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#111111]" style={{ border: "1px solid #2a2a2a" }}>
      <div className="border-b border-white/10 px-3 py-2">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/50">{label}</p>
      </div>
      <pre className="max-h-56 overflow-auto p-3 text-[11px] font-semibold leading-5 text-white/80">
        {formatJson(value)}
      </pre>
    </div>
  );
}

function formatJson(value: unknown) {
  if (value === undefined || value === null) return "null";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function OverviewDashboard({
  busy,
  canMutatePlatform,
  currentRole,
  onChangeTenantStatus,
  overview,
  platformLevel,
}: {
  busy: string;
  canMutatePlatform: boolean;
  currentRole: string;
  onChangeTenantStatus: (tenant: Tenant, status: string) => void | Promise<void>;
  overview: SiteAdminOverview;
  platformLevel: string;
}) {
  const totalTenants = sumRecord(overview.tenants);
  const totalUsers = sumRecord(overview.users);
  const activeTenants = overview.tenants.ACTIVE ?? 0;
  const trialTenants = overview.tenants.TRIAL ?? 0;
  const suspendedTenants = overview.tenants.SUSPENDED ?? 0;
  const openEvents = overview.securityEvents.open;
  const totalEvents = overview.securityEvents.total;
  const eventPressure = totalEvents > 0 ? Math.round((openEvents / totalEvents) * 100) : 0;
  const tenantCoverage = totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0;
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(92 + tenantCoverage * 0.05 - eventPressure * 0.32 - suspendedTenants * 6),
    ),
  );
  const healthColor = healthScore >= 80 ? "#34d399" : healthScore >= 60 ? "#fbbf24" : "#f87171";
  const healthLabel = healthScore >= 80 ? "Healthy" : healthScore >= 60 ? "Watchlist" : "Action needed";
  const otherTenants = Math.max(totalTenants - activeTenants - trialTenants - suspendedTenants, 0);
  const tenantSegments = [
    { label: "Active", value: activeTenants, color: "#34d399" },
    { label: "Trial", value: trialTenants, color: "#fbbf24" },
    { label: "Suspended", value: suspendedTenants, color: "#f87171" },
    { label: "Other", value: otherTenants, color: "#d1d5db" },
  ].filter((segment) => segment.value > 0 || totalTenants === 0);
  const recentTenants = overview.recentTenants.slice(0, 5);
  const recentEvents = overview.recentEvents.slice(0, 4);
  const queueItems = [
    {
      color: openEvents > 0 ? "#f87171" : "#34d399",
      href: "/site-admin/security",
      icon: AlertTriangle,
      label: "Open security events",
      meta: openEvents > 0 ? "Review unresolved platform signals" : "No unresolved security signal",
      value: openEvents,
    },
    {
      color: suspendedTenants > 0 ? "#f87171" : "#34d399",
      href: "/site-admin/tenants",
      icon: Building2,
      label: "Suspended tenants",
      meta: suspendedTenants > 0 ? "Requires platform follow-up" : "No suspended tenant",
      value: suspendedTenants,
    },
    {
      color: "#fbbf24",
      href: "/site-admin/audit",
      icon: Fingerprint,
      label: "Audit entries",
      meta: "Immutable platform actions",
      value: overview.platformAuditLogs,
    },
  ];
  const activityBars = [
    { label: "Tenants", value: totalTenants, color: "#6d5dd3" },
    { label: "Users", value: totalUsers, color: "#6d5dd3" },
    { label: "Sessions", value: overview.sessions.active, color: "#6d5dd3" },
    { label: "Security", value: openEvents, color: "#fbbf24" },
    { label: "Audit", value: overview.platformAuditLogs, color: "#111111" },
    { label: "Admins", value: overview.platformAdmins, color: "#34d399" },
  ];
  const maxActivity = Math.max(1, ...activityBars.map((item) => item.value));
  const activeDeg = totalTenants > 0 ? (activeTenants / totalTenants) * 360 : 0;
  const trialDeg = totalTenants > 0 ? (trialTenants / totalTenants) * 360 : 0;
  const suspendedDeg = totalTenants > 0 ? (suspendedTenants / totalTenants) * 360 : 0;
  const tenantAllocationGradient =
    totalTenants > 0
      ? `conic-gradient(#34d399 0deg ${activeDeg}deg, #ffd400 ${activeDeg}deg ${activeDeg + trialDeg}deg, #f87171 ${activeDeg + trialDeg}deg ${activeDeg + trialDeg + suspendedDeg}deg, #d1d5db ${activeDeg + trialDeg + suspendedDeg}deg 360deg)`
      : "conic-gradient(#e5e7eb 0deg 360deg)";
  const todayLabel = new Intl.DateTimeFormat("en", { month: "2-digit", day: "2-digit", year: "numeric" }).format(new Date());

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#111111]">Site Admin Dashboard</h1>
          <p className="mt-1 text-[14px] font-medium text-[#5f574c]">
            Welcome back to the TaskBricks platform workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-10 items-center overflow-hidden rounded-full bg-white text-[12px] font-bold text-[#111111] shadow-[0_8px_24px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #d8cfbc" }}>
            <span className="px-4">{todayLabel} - {todayLabel}</span>
            <span className="flex h-full items-center gap-2 border-l border-[#e7dfcf] px-3 text-[#6d5dd3]">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </span>
          </div>
          <Link href="/site-admin/audit" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#111111] px-4 text-[12px] font-black text-white shadow-[0_8px_24px_rgba(17,17,17,0.12)] transition hover:bg-[#2a2a2a]">
            Audit trail
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[540px_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-[28px] bg-white p-4 shadow-[0_16px_50px_rgba(17,17,17,0.07)]" style={{ border: "1px solid #ded8c8" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-[#111111]">Admin card</h2>
              <Gauge className="size-4 text-[#6d5dd3]" aria-hidden="true" />
            </div>
            <div className="mt-4 overflow-hidden rounded-[22px] bg-[#fff4bd]" style={{ border: "1px solid #f1d766" }}>
              <div className="grid min-h-[190px] grid-cols-[86px_1fr]">
                <div className="flex flex-col justify-between bg-[#efe5ff] px-5 py-6">
                  <ShieldCheck className="size-8 text-[#6d5dd3]" aria-hidden="true" />
                  <p className="text-[12px] font-black text-[#111111]">{platformLevel}</p>
                </div>
                <div className="flex flex-col justify-between">
                  <div className="px-6 py-6">
                    <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#7a5a00]">TaskBricks Platform</p>
                    <p className="mt-2 text-2xl font-black text-[#111111]">{currentRole}</p>
                  </div>
                  <div className="bg-[#111111] px-6 py-5 text-white">
                    <p className="text-[12px] font-semibold text-white/70">Active sessions</p>
                    <p className="mt-1 text-[28px] font-black">{overview.sessions.active}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_16px_50px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
            <p className="text-[14px] font-semibold text-[#111111]">Platform health</p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[34px] font-black leading-none text-[#111111]">{healthScore}%</p>
                <p className="mt-2 text-[12px] font-black" style={{ color: healthColor }}>{healthLabel}</p>
              </div>
              <div className="flex gap-8 text-[12px] font-bold">
                <span className="text-emerald-500">Up {tenantCoverage}% active</span>
                <span className="text-red-500">Risk {eventPressure}% pressure</span>
              </div>
            </div>
            <div className="mt-5 grid overflow-hidden rounded-[18px] bg-[#eeeafc] text-[13px] font-semibold text-[#2a2538] sm:grid-cols-3">
              <div className="px-4 py-4">
                <p className="text-[#665f54]">Tenants</p>
                <p className="mt-1 font-black">{totalTenants}</p>
              </div>
              <div className="border-y border-white/70 px-4 py-4 sm:border-x sm:border-y-0">
                <p className="text-[#665f54]">Status</p>
                <p className="mt-1 font-black" style={{ color: healthColor }}>{healthLabel}</p>
              </div>
              <div className="px-4 py-4">
                <p className="text-[#665f54]">Open events</p>
                <p className="mt-1 font-black">{openEvents}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_16px_50px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-[#111111]">Priority queue</p>
              <Link href="/site-admin/security" className="flex size-6 items-center justify-center rounded-full bg-[#6d5dd3] text-white">
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-4 space-y-2.5">
              {queueItems.map((item) => (
                <OverviewQueueItem key={item.label} {...item} />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(320px,1.1fr)]">
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
              <OverviewMetricCard icon={Building2} label="Tenants" value={totalTenants} meta={`${activeTenants} active / ${trialTenants} trial`} color="#6d5dd3" />
              <OverviewMetricCard icon={Users} label="Users" value={totalUsers} meta={`${overview.users.INVITED ?? 0} invited`} color="#111111" />
              <OverviewMetricCard icon={Activity} label="Sessions" value={overview.sessions.active} meta="active now" color="#34d399" />
              <OverviewMetricCard icon={AlertTriangle} label="Security" value={openEvents} meta={`${eventPressure}% pressure`} color={openEvents > 0 ? "#f87171" : "#ffd400"} />
            </div>

            <section className="rounded-[28px] bg-white p-5 shadow-[0_16px_50px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
              <h2 className="text-[16px] font-semibold text-[#111111]">Tenant allocation</h2>
              <div className="mt-6 flex justify-center">
                <div className="grid size-48 place-items-center rounded-full" style={{ background: tenantAllocationGradient }}>
                  <div className="grid size-28 place-items-center rounded-full bg-white">
                    <div className="text-center">
                      <p className="text-3xl font-black text-[#111111]">{totalTenants}</p>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a8375]">tenants</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {tenantSegments.map((segment) => (
                  <OverviewLegendItem
                    key={segment.label}
                    color={segment.color}
                    label={`${segment.label} ${segment.value}`}
                  />
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_16px_50px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold text-[#111111]">Platform activity analytics</h2>
                <p className="mt-1 text-[12px] font-medium text-[#665f54]">Current operational mix across tenants, users, sessions, security, and audit.</p>
              </div>
              <p className="text-[12px] font-semibold text-[#665f54]">Live snapshot</p>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[246px_minmax(0,1fr)]">
              <div className="rounded-[22px] bg-[#eeeafc] p-5">
                <p className="text-[12px] font-medium text-[#665f54]">Total tenants</p>
                <p className="mt-1 text-3xl font-black text-[#111111]">{totalTenants}</p>
                <p className="mt-5 text-[12px] font-medium text-[#665f54]">Active users</p>
                <p className="mt-1 text-3xl font-black text-[#111111]">{totalUsers}</p>
                <p className="mt-5 text-[12px] font-medium text-[#665f54]">Platform events</p>
                <p className="mt-1 text-3xl font-black text-[#111111]">{totalEvents}</p>
              </div>
              <div className="min-h-[280px] rounded-[22px] bg-[#fbfaf6] px-5 pb-5 pt-8" style={{ border: "1px solid #eee8dc" }}>
                <div className="flex h-56 items-end justify-between gap-4 border-b border-[#ddd6c8]">
                  {activityBars.map((item) => {
                    const height = Math.max(14, Math.round((item.value / maxActivity) * 100));
                    return (
                      <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                        <div className="mx-auto w-full max-w-14 rounded-t-2xl" style={{ height: `${height}%`, background: item.color }} />
                        <p className="truncate pb-2 text-center text-[10px] font-bold text-[#665f54]">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-5 text-[11px] font-semibold text-[#665f54]">
                  <OverviewLegendItem color="#6d5dd3" label="Scale" />
                  <OverviewLegendItem color="#34d399" label="Live" />
                  <OverviewLegendItem color="#ffd400" label="Watch" />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <OverviewPanel title="Newest tenants" eyebrow="Tenant activity" accent="#6d5dd3">
              <div className="divide-y" style={{ borderColor: "#eee8dc" }}>
                {recentTenants.map((tenant) => (
                  <OverviewTenantLine
                    key={tenant.id}
                    tenant={tenant}
                    busy={busy === `tenant:${tenant.id}`}
                    canMutate={canMutatePlatform}
                    onStatus={onChangeTenantStatus}
                  />
                ))}
                {recentTenants.length === 0 ? <OverviewEmpty text="No tenants yet." /> : null}
              </div>
            </OverviewPanel>

            <OverviewPanel title="Security stream" eyebrow="Recent signals" accent="#f87171">
              <OverviewEventList events={recentEvents} />
              <Link href="/site-admin/security" className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-[#ded8c8] bg-[#fbfaf6] text-[12px] font-black text-[#111111] transition hover:bg-[#ffd400]">
                Open security page
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </OverviewPanel>
          </section>
        </div>
      </section>
    </div>
  );
}

function OverviewPanel({ accent, children, eyebrow, title }: { accent: string; children: ReactNode; eyebrow: string; title: string }) {
  return (
    <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
      <div className="flex items-center justify-between gap-3 border-b border-[#eee8dc] px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-[3px] w-6 rounded-full" style={{ background: accent }} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">{eyebrow}</p>
          </div>
          <h2 className="mt-1 truncate text-[15px] font-black text-[#111111]">{title}</h2>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function OverviewPill({ color, icon, label }: { color: string; icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-full px-3 text-[9px] font-black uppercase tracking-[0.16em]" style={{ background: `${color}16`, border: `1px solid ${color}30`, color }}>
      {icon}
      {label}
    </span>
  );
}

function OverviewMetricCard({
  color,
  icon: Icon,
  label,
  meta,
  value,
}: {
  color: string;
  icon: typeof Building2;
  label: string;
  meta: string;
  value: number;
}) {
  return (
    <div className="rounded-[20px] bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a8375]">{label}</p>
          <p className="mt-2 text-[30px] font-black leading-none" style={{ color }}>{value}</p>
          <p className="mt-2 text-[11px] font-bold text-[#766f63]">{meta}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${color}16`, border: `1px solid ${color}26` }}>
          <Icon className="size-4" style={{ color }} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function OverviewLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#665f54]">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function OverviewQueueItem({
  color,
  href,
  icon: Icon,
  label,
  meta,
  value,
}: {
  color: string;
  href: string;
  icon: typeof Building2;
  label: string;
  meta: string;
  value: number;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl bg-[#fbfaf6] p-3 transition hover:bg-[#f4f1e7]" style={{ border: "1px solid #e7dfcf" }}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${color}16`, border: `1px solid ${color}28` }}>
        <Icon className="size-4" style={{ color }} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-black text-[#111111]">{label}</span>
        <span className="mt-0.5 block truncate text-[10px] font-semibold text-[#766f63]">{meta}</span>
      </span>
      <span className="text-xl font-black tabular-nums" style={{ color }}>{value}</span>
    </Link>
  );
}

function OverviewTenantLine({
  busy,
  canMutate,
  onStatus,
  tenant,
}: {
  busy: boolean;
  canMutate: boolean;
  onStatus: (tenant: Tenant, status: string) => void | Promise<void>;
  tenant: Tenant;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <Link href={`/site-admin/tenants/${tenant.id}`} className="min-w-0 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13px] font-black text-[#111111]">{tenant.name}</p>
          <DarkStatusBadge status={tenant.status} />
        </div>
        <p className="mt-1 truncate text-[11px] text-[#766f63]">
          @{tenant.slug} - {tenant._count?.users ?? 0} users - {tenant._count?.projects ?? 0} projects
        </p>
      </Link>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href={`/site-admin/tenants/${tenant.id}`}
          className="h-8 rounded-xl px-3 text-[11px] font-black transition disabled:opacity-50"
          style={{ background: "#fbfaf6", border: "1px solid #ded8c8", color: "#111111" }}
        >
          View
        </Link>
        {canMutate && tenant.status === "SUSPENDED" ? (
          <button
            type="button"
            onClick={() => onStatus(tenant, "ACTIVE")}
            disabled={busy}
            className="h-8 rounded-xl px-3 text-[11px] font-black transition disabled:opacity-50"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.24)", color: "#34d399" }}
          >
            Activate
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OverviewEventList({ events }: { events: SecurityEvent[] }) {
  if (events.length === 0) return <OverviewEmpty text="No security events." />;

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const sevColor =
          event.severity === "CRITICAL" || event.severity === "HIGH" ? "#f87171"
          : event.severity === "MEDIUM" ? "#d89b00"
          : event.severity === "LOW" ? "#2563eb"
          : "#059669";
        const SevIcon = event.severity === "CRITICAL" || event.severity === "HIGH" ? AlertTriangle
          : event.severity === "INFO" ? CheckCircle2 : XCircle;

        return (
          <div key={event.id} className="flex gap-3 rounded-2xl bg-[#fbfaf6] p-3" style={{ border: `1px solid ${sevColor}26`, borderLeft: `3px solid ${sevColor}` }}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${sevColor}14` }}>
              <SevIcon className="size-4" style={{ color: sevColor }} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="truncate text-[12px] font-black text-[#111111]">{event.type}</p>
                <p className="text-[10px] font-bold tabular-nums text-[#8a8375]">{formatDate(event.createdAt)}</p>
              </div>
              <p className="mt-1 truncate text-[11px] font-semibold text-[#766f63]">
                {event.source ?? "system"}{event.tenantId ? ` - tenant ${event.tenantId}` : " - platform"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OverviewEmpty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] px-6 py-10 text-center text-[13px] font-bold text-[#766f63]" style={{ border: "1px dashed #d8cfbc" }}>
      {text}
    </div>
  );
}

function TenantDirectoryDashboard({
  allTenants,
  busy,
  canMutatePlatform,
  onChangeTenantStatus,
  onQueryChange,
  query,
  tenants,
}: {
  allTenants: Tenant[];
  busy: string;
  canMutatePlatform: boolean;
  onChangeTenantStatus: (tenant: Tenant, status: string) => void | Promise<void>;
  onQueryChange: (value: string) => void;
  query: string;
  tenants: Tenant[];
}) {
  const totalTenants = allTenants.length;
  const activeTenants = allTenants.filter((tenant) => tenant.status === "ACTIVE").length;
  const trialTenants = allTenants.filter((tenant) => tenant.status === "TRIAL").length;
  const suspendedTenants = allTenants.filter((tenant) => tenant.status === "SUSPENDED").length;
  const totalUsers = allTenants.reduce((sum, tenant) => sum + (tenant._count?.users ?? 0), 0);
  const totalProjects = allTenants.reduce((sum, tenant) => sum + (tenant._count?.projects ?? 0), 0);

  return (
    <div className="space-y-5">
      <SlimPageHeader
        accent="#6d5dd3"
        icon={Building2}
        title="Tenant Directory"
        subtitle={`${totalTenants} tenants - ${activeTenants} active - ${suspendedTenants} suspended`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TenantMetricTile color="#6d5dd3" icon={Building2} label="Tenants" value={totalTenants} />
        <TenantMetricTile color="#059669" icon={CheckCircle2} label="Active" value={activeTenants} />
        <TenantMetricTile color="#d89b00" icon={Activity} label="Trial" value={trialTenants} />
        <TenantMetricTile color="#f87171" icon={AlertTriangle} label="Suspended" value={suspendedTenants} />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <LightSearch value={query} onChange={onQueryChange} placeholder="Search tenants by name, slug, or status..." />
          <div className="flex flex-wrap gap-2">
            {[
              { label: "All", value: "" },
              { label: "Active", value: "ACTIVE" },
              { label: "Trial", value: "TRIAL" },
              { label: "Suspended", value: "SUSPENDED" },
            ].map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => onQueryChange(filter.value)}
                className="h-10 rounded-2xl px-3 text-[11px] font-black uppercase tracking-[0.08em] transition"
                style={{
                  background: query === filter.value ? "#111111" : "#fbfaf6",
                  border: "1px solid #ded8c8",
                  color: query === filter.value ? "#ffffff" : "#5f574c",
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_44px_rgba(17,17,17,0.055)]" style={{ border: "1px solid #ded8c8" }}>
          <div className="grid gap-3 border-b border-[#eee8dc] px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a8375]">Directory</p>
              <h2 className="mt-1 text-[15px] font-black text-[#111111]">{tenants.length} tenants matched</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <TenantSmallStat label="Users" value={totalUsers} color="#2563eb" />
              <TenantSmallStat label="Projects" value={totalProjects} color="#059669" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[880px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#eee8dc] bg-[#fbfaf6] text-[10px] font-black uppercase tracking-[0.14em] text-[#8a8375]">
                  <th className="px-5 py-3">Tenant</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">Projects</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee8dc]">
                {tenants.map((tenant) => (
                  <TenantDirectoryRow
                    key={tenant.id}
                    busy={busy === `tenant:${tenant.id}` || busy === `status:${tenant.id}`}
                    canMutate={canMutatePlatform}
                    onStatus={onChangeTenantStatus}
                    tenant={tenant}
                  />
                ))}
              </tbody>
            </table>
            {tenants.length === 0 ? <OverviewEmpty text="No tenants match this search." /> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function LightSearch({ onChange, placeholder, value }: { onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="flex h-12 min-w-0 items-center gap-2.5 rounded-2xl bg-[#fbfaf6] px-3.5" style={{ border: "1px solid #ded8c8" }}>
      <Search className="size-4 shrink-0 text-[#8a8375]" aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[#111111] outline-none placeholder:text-[#9a9388]"
      />
    </label>
  );
}

function TenantMetricTile({ color, icon: Icon, label, value }: { color: string; icon: typeof Building2; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-3.5" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{label}</p>
          <p className="mt-2 text-2xl font-black leading-none" style={{ color }}>{value}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}14`, border: `1px solid ${color}22` }}>
          <Icon className="size-4" style={{ color }} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function TenantSmallStat({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-full bg-[#fbfaf6] px-3 text-[11px] font-black" style={{ border: "1px solid #e7dfcf", color }}>
      {value}
      <span className="font-bold text-[#8a8375]">{label}</span>
    </span>
  );
}

function TenantDirectoryRow({
  busy,
  canMutate,
  onStatus,
  tenant,
}: {
  busy: boolean;
  canMutate: boolean;
  onStatus: (tenant: Tenant, status: string) => void | Promise<void>;
  tenant: Tenant;
}) {
  return (
    <tr className="transition hover:bg-[#fbfaf6]">
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4f1e7] text-[12px] font-bold text-[#5f574c]" style={{ border: "1px solid #ded8c8" }}>
            {tenant.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0">
            <Link href={`/site-admin/tenants/${tenant.id}`} className="block truncate text-[13px] font-semibold text-[#25221e] transition hover:text-[#6d5dd3]">
              {tenant.name}
            </Link>
            <span className="mt-0.5 block truncate text-[11px] font-medium text-[#8a8375]">@{tenant.slug}</span>
          </span>
        </div>
      </td>
      <td className="px-4 py-4"><SoftStatusBadge status={tenant.status} /></td>
      <td className="px-4 py-4 text-[12px] font-semibold tabular-nums text-[#3d382f]">{tenant._count?.users ?? 0}</td>
      <td className="px-4 py-4 text-[12px] font-semibold tabular-nums text-[#3d382f]">{tenant._count?.projects ?? 0}</td>
      <td className="px-4 py-4 text-[11px] font-semibold text-[#766f63]">{formatDate(tenant.updatedAt)}</td>
      <td className="px-5 py-4">
        <TenantActionDropdown busy={busy} canMutate={canMutate} onStatus={onStatus} tenant={tenant} />
      </td>
    </tr>
  );
}

function TenantActionDropdown({
  busy,
  canMutate,
  onStatus,
  tenant,
}: {
  busy: boolean;
  canMutate: boolean;
  onStatus: (tenant: Tenant, status: string) => void | Promise<void>;
  tenant: Tenant;
}) {
  return (
    <details className="group relative flex justify-end">
      <summary
        aria-label={`Open actions for ${tenant.name}`}
        className="ml-auto flex size-9 cursor-pointer list-none items-center justify-center rounded-xl bg-white text-[#5f574c] transition hover:bg-[#f4f1e7]"
        style={{ border: "1px solid #ded8c8" }}
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-2xl bg-white py-1.5 shadow-[0_22px_60px_rgba(17,17,17,0.18)]" style={{ border: "1px solid #ded8c8" }}>
        <Link href={`/site-admin/tenants/${tenant.id}`} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-black text-[#111111] transition hover:bg-[#fbfaf6]">
          <Eye className="size-3.5" aria-hidden="true" />
          View details
        </Link>
        {canMutate && tenant.status !== "SUSPENDED" ? (
          <button type="button" onClick={() => onStatus(tenant, "SUSPENDED")} disabled={busy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-black text-[#dc2626] transition hover:bg-red-50 disabled:opacity-50">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            Suspend tenant
          </button>
        ) : null}
        {canMutate && tenant.status !== "ACTIVE" ? (
          <button type="button" onClick={() => onStatus(tenant, "ACTIVE")} disabled={busy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-black text-[#047857] transition hover:bg-emerald-50 disabled:opacity-50">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Activate tenant
          </button>
        ) : null}
      </div>
    </details>
  );
}

function SoftStatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const [bg, color, border] =
    ["ACTIVE", "RESOLVED", "COMPLETED"].includes(normalized) ? ["#ecfdf5", "#047857", "#bbf7d0"] :
    ["TRIAL", "OPEN", "INVITED", "PLANNING"].includes(normalized) ? ["#fff7d8", "#8a5a00", "#f4d26a"] :
    ["SUSPENDED", "CANCELLED", "REVOKED", "DEACTIVATED", "ARCHIVED", "ON_HOLD"].includes(normalized) ? ["#fff1f1", "#dc2626", "#fecaca"] :
    ["#f4f1e7", "#5f574c", "#ded8c8"];

  return (
    <span className="inline-flex h-6 items-center rounded-full px-2.5 text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: bg, color, border: `1px solid ${border}` }}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function DarkPanel({ accent, children, eyebrow, title }: { accent: string; children: ReactNode; eyebrow: string; title: string }) {
  return (
    <section className="overflow-hidden rounded-2xl" style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="h-[3px] w-6 rounded-full" style={{ background: accent }} />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.3)" }}>{eyebrow}</p>
          <h2 className="mt-0.5 truncate text-[15px] font-black text-white">{title}</h2>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function DarkStatusBadge({ status }: { status: string }) {
  const n = status.toUpperCase();
  const [bg, color, border] =
    ["ACTIVE",    "RESOLVED"].includes(n) ? ["rgba(52,211,153,0.12)", "#34d399", "rgba(52,211,153,0.25)"]  :
    ["TRIAL",     "OPEN", "INVITED"].includes(n) ? ["rgba(251,191,36,0.12)", "#fbbf24", "rgba(251,191,36,0.25)"] :
    ["SUSPENDED", "CANCELLED", "REVOKED", "DEACTIVATED"].includes(n) ? ["rgba(248,113,113,0.12)", "#f87171", "rgba(248,113,113,0.25)"] :
    ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.12)"];
  return (
    <span className="inline-flex h-6 items-center rounded-full px-2.5 text-[9px] font-black uppercase tracking-[0.1em]"
      style={{ background: bg, color, border: `1px solid ${border}` }}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function sumRecord(record: Record<string, number>) {
  return Object.values(record).reduce((sum, value) => sum + value, 0);
}

function formatDate(value?: string | null) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function pathToSiteTab(pathname: string): SiteTab {
  if (pathname.startsWith("/site-admin/tenants")) return "tenants";
  if (pathname.startsWith("/site-admin/admins")) return "admins";
  if (pathname.startsWith("/site-admin/security")) return "security";
  if (pathname.startsWith("/site-admin/audit")) return "audit";
  return "overview";
}
