"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  Ban,
  Clock3,
  KeyRound,
  MonitorSmartphone,
  RefreshCw,
  Search,
  ShieldAlert,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  listSiteSessions,
  revokeSiteSession,
  revokeSiteUserSessions,
  type SiteSession,
  type SiteSessionsResponse,
} from "@/lib/api";

const METHODS = ["ALL", "PASSWORD", "GOOGLE", "MICROSOFT", "OIDC", "SAML"] as const;

export default function SiteAdminSessionsPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SiteSession[]>([]);
  const [summary, setSummary] = useState<SiteSessionsResponse["summary"]>({ active: 0, revoked: 0, byMethod: {} });
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("ALL");
  const [activeOnly, setActiveOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now] = useState(() => Date.now());
  const canAct = user.platformAdminLevel === "OWNER" || user.platformAdminLevel === "ADMIN" || user.platformAdminLevel === "SUPPORT";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listSiteSessions(auth.accessToken, {
        page,
        limit: 30,
        search: query || undefined,
        authMethod: method === "ALL" ? undefined : method,
        active: activeOnly ? true : undefined,
      });
      setSessions(result.data);
      setSummary(result.summary);
      setTotal(result.meta.total);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load sessions.");
    } finally {
      setLoading(false);
    }
  }, [activeOnly, auth.accessToken, method, page, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const riskySessions = useMemo(() => sessions.filter((session) => !session.mfaVerifiedAt && session.authMethod !== "PASSWORD").length, [sessions]);

  async function revokeOne(session: SiteSession) {
    const confirmed = await confirm({
      title: `Revoke session for ${session.user?.email ?? session.userId}?`,
      description: "This session will be invalidated immediately and the action will be audited.",
      confirmLabel: "Revoke session",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusy(`session:${session.id}`);
    try {
      await revokeSiteSession(auth.accessToken, session.id, { reason: `Revoked from site-admin sessions by ${user.email}` });
      toast({ title: "Session revoked", description: "The session is no longer active.", variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Revoke failed", description: caught instanceof Error ? caught.message : "Unable to revoke session.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  async function revokeAllForUser(session: SiteSession) {
    const confirmed = await confirm({
      title: `Force logout ${session.user?.email ?? session.userId}?`,
      description: "All active sessions for this user will be revoked across devices.",
      confirmLabel: "Force logout user",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusy(`user:${session.userId}`);
    try {
      const result = await revokeSiteUserSessions(auth.accessToken, session.userId, {
        reason: `Forced from site-admin sessions by ${user.email}`,
      });
      toast({ title: "User sessions revoked", description: `${result.sessionsRevoked} sessions revoked.`, variant: "success" });
      await load();
    } catch (caught) {
      toast({ title: "Force logout failed", description: caught instanceof Error ? caught.message : "Unable to force logout user.", variant: "error" });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px]" style={{ background: "#6d5dd318" }}>
            <MonitorSmartphone className="size-4" style={{ color: "#6d5dd3" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-[#111111]">Sessions</h1>
            <p className="text-[12px] font-semibold text-[#8a8375]">{summary.active} active · {summary.revoked} revoked · {riskySessions} risk signal{riskySessions !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric icon={Wifi} label="Active" value={summary.active} tone="#059669" />
        <Metric icon={Ban} label="Revoked" value={summary.revoked} tone="#dc2626" />
        <Metric icon={KeyRound} label="Password" value={summary.byMethod.PASSWORD ?? 0} tone="#111111" />
        <Metric icon={Activity} label="SSO sessions" value={(summary.byMethod.GOOGLE ?? 0) + (summary.byMethod.MICROSOFT ?? 0) + (summary.byMethod.OIDC ?? 0) + (summary.byMethod.SAML ?? 0)} tone="#6d5dd3" />
        <Metric icon={ShieldAlert} label="Risk signals" value={riskySessions} tone={riskySessions ? "#dc2626" : "#059669"} />
      </div>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_rgba(17,17,17,0.06)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#fbfaf6] px-3" style={{ border: "1px solid #ded8c8" }}>
            <Search className="size-4 text-[#8a8375]" aria-hidden="true" />
            <input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Search tenant, user, IP, device, user agent..." className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#8a8375]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((item) => (
              <button key={item} type="button" onClick={() => { setPage(1); setMethod(item); }} className="h-10 rounded-2xl px-3 text-[11px] font-black transition" style={{ background: method === item ? "#111111" : "#fbfaf6", border: "1px solid #ded8c8", color: method === item ? "#ffffff" : "#5f574c" }}>{item}</button>
            ))}
            <button type="button" onClick={() => { setPage(1); setActiveOnly((value) => !value); }} className="h-10 rounded-2xl px-3 text-[11px] font-black transition" style={{ background: activeOnly ? "#ecfdf5" : "#fbfaf6", border: "1px solid #bbf7d0", color: "#047857" }}>Active only</button>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <section className="overflow-hidden rounded-[26px] bg-white shadow-[0_16px_50px_rgba(17,17,17,0.07)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="border-b border-[#eee8dc] px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a8375]"><span className="mr-2 inline-block h-0.5 w-6 align-middle bg-[#34d399]" />Live access</p>
          <h2 className="mt-1 text-base font-black text-[#111111]">Session ledger</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#fbfaf6] text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Tenant</th>
                <th className="px-5 py-3">Device and IP</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee8dc]">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm font-bold text-[#8a8375]">Loading sessions...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm font-bold text-[#8a8375]">No sessions matched this filter.</td></tr>
              ) : sessions.map((session) => (
                <tr key={session.id} className="bg-white transition hover:bg-[#fffdf2]">
                  <td className="min-w-[240px] px-5 py-4">
                    <Link href={`/site-admin/users/${session.userId}`} className="block text-[13px] font-black text-[#111111] hover:text-[#6d5dd3]">{session.user?.email ?? session.userId}</Link>
                    <p className="mt-1 text-[11px] font-semibold text-[#766f63]">Created {formatDate(session.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    {session.tenant ? <Link href={`/site-admin/tenants/${session.tenant.id}`} className="text-[12px] font-bold text-[#25221e] hover:text-[#6d5dd3]">{session.tenant.name}</Link> : <span className="text-[12px] font-bold text-[#8a8375]">Unknown</span>}
                    <p className="mt-1 text-[10px] font-bold text-[#8a8375]">@{session.tenant?.slug ?? "n/a"}</p>
                  </td>
                  <td className="min-w-[260px] px-5 py-4">
                    <p className="text-[12px] font-black text-[#111111]">{session.deviceName || session.trustedDevice?.name || "Unknown device"}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] font-semibold text-[#766f63]">{session.ipAddress || "No IP"} - {session.userAgent || "No user agent"}</p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge value={session.authMethod} /></td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <StatusBadge value={session.revokedAt ? "REVOKED" : new Date(session.expiresAt).getTime() > now ? "ACTIVE" : "EXPIRED"} />
                      <p className="text-[11px] font-semibold text-[#766f63]">{session.mfaVerifiedAt ? "MFA verified" : "No MFA marker"}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {canAct && !session.revokedAt ? <button type="button" onClick={() => revokeOne(session)} disabled={busy === `session:${session.id}`} className="h-9 rounded-2xl px-3 text-[11px] font-black disabled:opacity-50" style={{ background: "#fff1f1", border: "1px solid #fecaca", color: "#dc2626" }}>Revoke</button> : null}
                      {canAct ? <button type="button" onClick={() => revokeAllForUser(session)} disabled={busy === `user:${session.userId}`} className="h-9 rounded-2xl bg-[#111111] px-3 text-[11px] font-black text-white disabled:opacity-50">Force logout</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#eee8dc] px-5 py-4">
          <p className="text-[12px] font-bold text-[#766f63]">Page {page} - {total} matched</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="h-10 rounded-2xl bg-[#fbfaf6] px-4 text-[12px] font-black disabled:opacity-40" style={{ border: "1px solid #ded8c8" }}>Previous</button>
            <button type="button" disabled={page * 30 >= total} onClick={() => setPage((value) => value + 1)} className="h-10 rounded-2xl bg-[#111111] px-4 text-[12px] font-black text-white disabled:opacity-40">Next</button>
          </div>
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

function StatusBadge({ value }: { value: string }) {
  const upper = value.toUpperCase();
  const tone = upper === "ACTIVE" || upper === "PASSWORD" ? "#047857" : upper === "REVOKED" || upper === "EXPIRED" ? "#dc2626" : "#6d5dd3";
  return <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[9px] font-black uppercase tracking-[0.08em]" style={{ border: "1px solid #ded8c8", color: tone }}>{upper}</span>;
}

function formatDate(value?: string | null) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
