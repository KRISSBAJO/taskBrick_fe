"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Mail,
  MonitorSmartphone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  getSiteIdentitySecurityOverview,
  listSiteLoginHistory,
  listSiteSecurityPolicies,
  listSiteSsoProviders,
  listSiteTrustedDevices,
  revokeSiteTrustedDevice,
  sendSiteAdminPasswordReset,
  type SiteIdentitySecurityOverview,
  type SiteLoginHistory,
  type SiteSecurityPolicy,
  type SiteSsoProvider,
  type SiteTrustedDevice,
} from "@/lib/api";

const emptyOverview: SiteIdentitySecurityOverview = {
  users: {},
  mfa: { activeFactors: 0, pendingFactors: 0, requiredPolicies: 0 },
  trustedDevices: {},
  loginHistory: { byStatus: {}, byMethod: {}, suspiciousLast7Days: 0 },
  sso: { activeProviders: 0, requiredPolicies: 0, domainDiscoveryPolicies: 0 },
  recentSuspiciousLogins: [],
  riskyTenants: [],
};

export default function SiteAdminIdentitySecurityPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [overview, setOverview] = useState<SiteIdentitySecurityOverview>(emptyOverview);
  const [logins, setLogins] = useState<SiteLoginHistory[]>([]);
  const [devices, setDevices] = useState<SiteTrustedDevice[]>([]);
  const [providers, setProviders] = useState<SiteSsoProvider[]>([]);
  const [policies, setPolicies] = useState<SiteSecurityPolicy[]>([]);
  const [query, setQuery] = useState("");
  const [suspiciousOnly, setSuspiciousOnly] = useState(true);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAct = user.platformAdminLevel === "OWNER" || user.platformAdminLevel === "ADMIN" || user.platformAdminLevel === "SUPPORT";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResult, loginResult, deviceResult, providerResult, policyResult] = await Promise.all([
        getSiteIdentitySecurityOverview(auth.accessToken),
        listSiteLoginHistory(auth.accessToken, { limit: 30, search: query || undefined, suspicious: suspiciousOnly ? true : undefined }),
        listSiteTrustedDevices(auth.accessToken, { limit: 20, search: query || undefined }),
        listSiteSsoProviders(auth.accessToken, { limit: 20, search: query || undefined }),
        listSiteSecurityPolicies(auth.accessToken, { limit: 20, search: query || undefined }),
      ]);
      setOverview(overviewResult);
      setLogins(loginResult.data);
      setDevices(deviceResult.data);
      setProviders(providerResult.data);
      setPolicies(policyResult.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load identity security data.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, query, suspiciousOnly]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const activeUsers = overview.users.ACTIVE ?? 0;
  const mfaCoverage = useMemo(() => {
    if (!activeUsers) return 0;
    return Math.min(100, Math.round((overview.mfa.activeFactors / activeUsers) * 100));
  }, [activeUsers, overview.mfa.activeFactors]);

  async function revokeDevice(device: SiteTrustedDevice) {
    const confirmed = await confirm({
      title: `Revoke ${device.name || "trusted device"}?`,
      description: "This revokes the trusted device and active sessions attached to it. The action is audited.",
      confirmLabel: "Revoke device",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusy(`device:${device.id}`);
    try {
      await revokeSiteTrustedDevice(auth.accessToken, device.id, { reason: `Revoked from identity security by ${user.email}` });
      toast({ title: "Trusted device revoked", description: "Device sessions were revoked and audited.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Device revoke failed", description: caught instanceof Error ? caught.message : "Unable to revoke device.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function sendRecovery(login: SiteLoginHistory) {
    if (!login.userId) return;
    const confirmed = await confirm({
      title: `Send password recovery to ${login.email}?`,
      description: "This sends an admin-initiated reset link and records tenant plus platform audit events.",
      confirmLabel: "Send recovery",
      tone: "warning",
    });
    if (!confirmed) return;
    setBusy(`reset:${login.userId}`);
    try {
      const result = await sendSiteAdminPasswordReset(auth.accessToken, login.userId);
      toast({ title: result.sent ? "Recovery sent" : "Recovery not sent", description: result.message, variant: result.sent || result.skipped ? "success" : "warning" });
    } catch (caught) {
      toast({ title: "Recovery failed", description: caught instanceof Error ? caught.message : "Unable to send recovery.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "#dc262618" }}>
            <KeyRound className="size-4" style={{ color: "#dc2626" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Identity security</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">{activeUsers} users · {mfaCoverage}% MFA coverage · {overview.loginHistory.suspiciousLast7Days} suspicious 7d</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={UserRound} label="Active users" value={activeUsers} tone="#2563eb" />
        <Metric icon={ShieldCheck} label="MFA factors" value={overview.mfa.activeFactors} tone="#059669" />
        <Metric icon={Fingerprint} label="MFA coverage" value={`${mfaCoverage}%`} tone="#6d5dd3" />
        <Metric icon={MonitorSmartphone} label="Trusted devices" value={overview.trustedDevices.ACTIVE ?? 0} tone="#111111" />
        <Metric icon={ShieldAlert} label="Suspicious 7d" value={overview.loginHistory.suspiciousLast7Days} tone={overview.loginHistory.suspiciousLast7Days ? "#dc2626" : "#059669"} />
        <Metric icon={LockKeyhole} label="SSO providers" value={overview.sso.activeProviders} tone="#d89b00" />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#fbfaf6] px-3" style={{ border: "1px solid #ded8c8" }}>
            <Search className="size-4 text-[#8a8375]" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users, tenants, IPs, devices, providers..." className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#8a8375]" />
          </div>
          <button type="button" onClick={() => setSuspiciousOnly((value) => !value)} className="h-12 rounded-2xl px-4 text-[12px] font-black transition" style={{ background: suspiciousOnly ? "#111111" : "#fbfaf6", border: "1px solid #ded8c8", color: suspiciousOnly ? "#ffffff" : "#5f574c" }}>
            Suspicious only
          </button>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <Panel title="Suspicious login review" eyebrow="Login risk" accent="#dc2626">
            <div className="space-y-2">
              {loading ? <Empty text="Loading login history..." /> : logins.map((login) => (
                <div key={login.id} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-black text-[#111111]">{login.email}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{login.tenant?.name ?? login.tenantSlug ?? "Unknown tenant"} - {login.ipAddress ?? "No IP"} - {formatDate(login.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={login.status} />
                      <StatusBadge value={login.method} />
                      {login.suspicious ? <StatusBadge value="SUSPICIOUS" /> : null}
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-[12px] font-semibold text-[#665f54]">{login.reason || login.userAgent || "No login reason returned."}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {login.userId ? <Link href={`/site-admin/users/${login.userId}`} className="h-9 rounded-2xl bg-white px-3 pt-2 text-[11px] font-black text-[#111111]" style={{ border: "1px solid #ded8c8" }}>View user</Link> : null}
                    {canAct && login.userId ? <button type="button" onClick={() => sendRecovery(login)} disabled={busy === `reset:${login.userId}`} className="inline-flex h-9 items-center gap-2 rounded-2xl bg-[#111111] px-3 text-[11px] font-black text-white disabled:opacity-50"><Mail className="size-3.5" />Send recovery</button> : null}
                  </div>
                </div>
              ))}
              {!loading && logins.length === 0 ? <Empty text="No login records matched this filter." /> : null}
            </div>
          </Panel>

          <Panel title="Trusted devices" eyebrow="Device trust" accent="#111111">
            <div className="space-y-2">
              {devices.map((device) => (
                <div key={device.id} className="flex flex-col gap-3 rounded-2xl bg-[#fbfaf6] p-4 sm:flex-row sm:items-center sm:justify-between" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-black text-[#111111]">{device.name || device.ipAddress || "Trusted device"}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{device.user?.email ?? "Unknown user"} - {device.tenant?.name ?? "Unknown tenant"} - expires {formatDate(device.expiresAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge value={device.status} />
                    {canAct && device.status !== "REVOKED" ? <button type="button" onClick={() => revokeDevice(device)} disabled={busy === `device:${device.id}`} className="h-9 rounded-2xl px-3 text-[11px] font-black disabled:opacity-50" style={{ background: "#fff1f1", border: "1px solid #fecaca", color: "#dc2626" }}>Revoke</button> : null}
                  </div>
                </div>
              ))}
              {devices.length === 0 ? <Empty text="No trusted devices returned." /> : null}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Tenant login policies" eyebrow="Domain discovery" accent="#6d5dd3">
            <div className="space-y-2">
              {policies.map((policy) => (
                <div key={policy.id} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-black text-[#111111]">{policy.tenant?.name ?? policy.tenantId}</p>
                    <StatusBadge value={policy.domainDiscoveryEnabled ? "DOMAIN ON" : "DOMAIN OFF"} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-[#665f54]">
                    <Check label="MFA" ok={policy.mfaRequired} />
                    <Check label="SSO" ok={policy.ssoRequired} />
                    <Check label="IP allowlist" ok={policy.enforceIpAllowlist} />
                    <Check label="Password policy" ok={policy.passwordMinLength >= 12} />
                  </div>
                </div>
              ))}
              {policies.length === 0 ? <Empty text="No tenant policies returned." /> : null}
            </div>
          </Panel>

          <Panel title="SSO provider visibility" eyebrow="Enterprise login" accent="#d89b00">
            <div className="space-y-2">
              {providers.map((provider) => (
                <div key={provider.id} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-black text-[#111111]">{provider.name}</p>
                    <StatusBadge value={provider.status} />
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{provider.tenant?.name ?? "Unknown tenant"} - {provider.type} - {provider._count?.accounts ?? 0} accounts</p>
                  <p className="mt-2 line-clamp-2 text-[11px] font-semibold text-[#665f54]">{provider.allowedDomains.length ? provider.allowedDomains.join(", ") : provider.issuerUrl || "No domain metadata"}</p>
                </div>
              ))}
              {providers.length === 0 ? <Empty text="No SSO providers returned." /> : null}
            </div>
          </Panel>

          <Panel title="Highest tenant risk" eyebrow="Control gaps" accent="#dc2626">
            <div className="space-y-2">
              {overview.riskyTenants.slice(0, 8).map((tenant) => (
                <Link key={tenant.id} href={`/site-admin/tenants/${tenant.id}/security`} className="block rounded-2xl bg-[#fbfaf6] p-4 transition hover:bg-[#fff8db]" style={{ border: "1px solid #e7dfcf" }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-black text-[#111111]">{tenant.name}</p>
                    <span className="text-xl font-black text-[#dc2626]">{tenant.riskScore}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-[#766f63]">@{tenant.slug} - {tenant.status}</p>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </div>
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

function StatusBadge({ value }: { value: string }) {
  const upper = value.toUpperCase();
  const tone = upper.includes("SUSPICIOUS") || upper.includes("FAILED") || upper.includes("OFF") || upper === "REVOKED" ? "#dc2626" : upper.includes("ACTIVE") || upper.includes("SUCCESS") || upper.includes("ON") ? "#047857" : "#6d5dd3";
  return <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[9px] font-black uppercase tracking-[0.08em]" style={{ border: "1px solid #ded8c8", color: tone }}>{upper}</span>;
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  return <span className="inline-flex items-center gap-1.5">{ok ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : <AlertTriangle className="size-3.5 text-amber-600" />}{label}</span>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[#ded8c8] bg-[#fbfaf6] px-4 py-8 text-center text-sm font-bold text-[#8a8375]">{text}</div>;
}

function formatDate(value?: string | null) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
