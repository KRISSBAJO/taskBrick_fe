"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  Eye,
  KeyRound,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  listSiteUsers,
  resendSiteUserVerification,
  revokeSiteUserSessions,
  updateSiteUserStatus,
  type TenantUser,
} from "@/lib/api";

const STATUS_FILTERS = ["ALL", "ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function SiteAdminUsersPage() {
  const { auth, user } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const canMutate = user.platformAdminLevel === "OWNER" || user.platformAdminLevel === "ADMIN";

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pageResult, active, invited, suspended, deactivated] = await Promise.all([
        listSiteUsers(auth.accessToken, {
          page,
          limit: 25,
          search: query || undefined,
          status: status === "ALL" ? undefined : status,
        }),
        listSiteUsers(auth.accessToken, { limit: 1, status: "ACTIVE" }),
        listSiteUsers(auth.accessToken, { limit: 1, status: "INVITED" }),
        listSiteUsers(auth.accessToken, { limit: 1, status: "SUSPENDED" }),
        listSiteUsers(auth.accessToken, { limit: 1, status: "DEACTIVATED" }),
      ]);
      setUsers(pageResult.data);
      setTotal(pageResult.meta.total);
      setCounts({
        ACTIVE: active.meta.total,
        INVITED: invited.meta.total,
        SUSPENDED: suspended.meta.total,
        DEACTIVATED: deactivated.meta.total,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load platform users.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, page, query, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const verifiedCount = useMemo(() => users.filter((item) => item.emailVerifiedAt).length, [users]);

  async function changeStatus(target: TenantUser, nextStatus: string) {
    const confirmed = await confirm({
      title: `${nextStatus === "ACTIVE" ? "Reactivate" : "Update"} ${target.email}?`,
      description:
        nextStatus === "SUSPENDED" || nextStatus === "DEACTIVATED"
          ? "This revokes active sessions and records tenant plus platform audit events."
          : "This updates the user account state and records the platform action.",
      confirmLabel: nextStatus === "ACTIVE" ? "Reactivate user" : "Update user",
      tone: nextStatus === "SUSPENDED" || nextStatus === "DEACTIVATED" ? "danger" : "warning",
    });
    if (!confirmed) return;

    setBusy(`status:${target.id}`);
    try {
      await updateSiteUserStatus(auth.accessToken, target.id, {
        status: nextStatus,
        reason: `Changed from site admin users console by ${user.email}`,
      });
      toast({ title: "User updated", description: `${target.email} is now ${nextStatus}.`, variant: "success" });
      await loadUsers();
    } catch (caught) {
      toast({
        title: "User update failed",
        description: caught instanceof Error ? caught.message : "Unable to update user.",
        variant: "error",
      });
    } finally {
      setBusy("");
    }
  }

  async function forceLogout(target: TenantUser) {
    const confirmed = await confirm({
      title: `Force logout ${target.email}?`,
      description: "All active sessions for this user will be revoked immediately and audited.",
      confirmLabel: "Revoke sessions",
      tone: "danger",
    });
    if (!confirmed) return;

    setBusy(`sessions:${target.id}`);
    try {
      const result = await revokeSiteUserSessions(auth.accessToken, target.id, {
        reason: `Forced from site admin users console by ${user.email}`,
      });
      toast({
        title: "Sessions revoked",
        description: `${result.sessionsRevoked} active session${result.sessionsRevoked === 1 ? "" : "s"} revoked.`,
        variant: "success",
      });
    } catch (caught) {
      toast({
        title: "Session revoke failed",
        description: caught instanceof Error ? caught.message : "Unable to revoke sessions.",
        variant: "error",
      });
    } finally {
      setBusy("");
    }
  }

  async function resendVerification(target: TenantUser) {
    setBusy(`mail:${target.id}`);
    try {
      const result = await resendSiteUserVerification(auth.accessToken, target.id);
      toast({
        title: result.sent ? "Email sent" : "Email not sent",
        description: result.devLink ? `${result.message} Dev link returned by backend.` : result.message,
        variant: result.sent || result.skipped ? "success" : "warning",
      });
    } catch (caught) {
      toast({
        title: "Resend failed",
        description: caught instanceof Error ? caught.message : "Unable to resend invite or verification.",
        variant: "error",
      });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-[#60a5fa18]">
            <Users className="size-4 text-[#2563eb]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black leading-tight text-[#111111]">User control plane</h1>
            <p className="truncate text-[12px] font-semibold text-[#8a8375]">
              {total} matched - {counts.ACTIVE ?? 0} active - {counts.INVITED ?? 0} invited
            </p>
          </div>
        </div>
          <button
            type="button"
            onClick={() => loadUsers()}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[12px] bg-[#ffd400] px-3 text-[12px] font-black text-[#111111] shadow-[0_2px_8px_rgba(255,212,0,0.22)] transition hover:bg-amber-300"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Refresh
          </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Matched" value={total} tone="#111111" icon={Search} />
        <Metric label="Active" value={counts.ACTIVE ?? 0} tone="#059669" icon={UserCheck} />
        <Metric label="Invited" value={counts.INVITED ?? 0} tone="#2563eb" icon={Mail} />
        <Metric label="Suspended" value={counts.SUSPENDED ?? 0} tone="#dc2626" icon={Ban} />
        <Metric label="Verified on page" value={verifiedCount} tone="#6d5dd3" icon={CheckCircle2} />
      </div>

      <section className="rounded-[26px] bg-white shadow-[0_16px_50px_rgba(17,17,17,0.07)]" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-3 border-b border-[#eee8dc] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#fbfaf6] px-3" style={{ border: "1px solid #ded8c8" }}>
            <Search className="size-4 text-[#8a8375]" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
              placeholder="Search users, tenant names, tenant slugs..."
              className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#8a8375]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setPage(1);
                  setStatus(item);
                }}
                className="h-10 rounded-2xl px-3 text-[11px] font-black uppercase tracking-[0.08em] transition"
                style={{
                  background: status === item ? "#111111" : "#fbfaf6",
                  border: "1px solid #ded8c8",
                  color: status === item ? "#ffffff" : "#5f574c",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error ? <div className="m-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#fbfaf6] text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Tenant</th>
                <th className="px-5 py-3">Roles</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Identity</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee8dc]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm font-bold text-[#8a8375]">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm font-bold text-[#8a8375]">No users matched this search.</td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id} className="bg-white transition hover:bg-[#fffdf2]">
                    <td className="px-5 py-4">
                      <Link href={`/site-admin/users/${item.id}`} className="group flex min-w-[260px] items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4f1e7] text-[12px] font-black text-[#111111]" style={{ border: "1px solid #ded8c8" }}>
                          {initials(item.firstName, item.lastName, item.email)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-black text-[#111111] group-hover:text-[#6d5dd3]">{item.email}</span>
                          <span className="block truncate text-[11px] font-semibold text-[#766f63]">{fullName(item)}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {item.tenant ? (
                        <Link href={`/site-admin/tenants/${item.tenant.id}`} className="block min-w-[180px]">
                          <span className="block text-[12px] font-bold text-[#25221e]">{item.tenant.name}</span>
                          <span className="block text-[10px] font-bold text-[#8a8375]">@{item.tenant.slug}</span>
                        </Link>
                      ) : (
                        <span className="text-[12px] font-bold text-[#8a8375]">No tenant</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-[240px] flex-wrap gap-1.5">
                        {(item.roles ?? []).slice(0, 3).map(({ role }) => (
                          <span key={role.id} className="rounded-full bg-[#fbfaf6] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-[#5f574c]" style={{ border: "1px solid #ded8c8" }}>
                            {role.name}
                          </span>
                        ))}
                        {(item.roles ?? []).length === 0 ? <span className="text-[11px] font-bold text-[#8a8375]">Member</span> : null}
                      </div>
                    </td>
                    <td className="px-5 py-4"><StatusBadge value={item.status ?? "UNKNOWN"} /></td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-[11px] font-bold text-[#665f54]">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${item.emailVerifiedAt ? "bg-emerald-500" : "bg-amber-400"}`} />
                          {item.emailVerifiedAt ? "Email verified" : "Email pending"}
                        </div>
                        <div>Last login: {item.lastLoginAt ? formatDate(item.lastLoginAt) : "Never"}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <details className="relative inline-block">
                        <summary className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-2xl bg-[#fbfaf6] text-[#111111] transition hover:bg-[#ffd400]" style={{ border: "1px solid #ded8c8" }}>
                          <MoreHorizontal className="size-4" aria-hidden="true" />
                        </summary>
                        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl bg-white text-left shadow-[0_18px_45px_rgba(17,17,17,0.16)]" style={{ border: "1px solid #ded8c8" }}>
                          <Link href={`/site-admin/users/${item.id}`} className="flex w-full items-center gap-2 px-3 py-2.5 text-[12px] font-black text-[#111111] transition hover:bg-[#fbfaf6]">
                            <Eye className="size-4" aria-hidden="true" />
                            View profile
                          </Link>
                          <button type="button" onClick={() => resendVerification(item)} disabled={busy === `mail:${item.id}`} className="flex w-full items-center gap-2 px-3 py-2.5 text-[12px] font-black text-[#111111] transition hover:bg-[#fbfaf6] disabled:opacity-50">
                            <Mail className="size-4" aria-hidden="true" />
                            Resend invite/verify
                          </button>
                          <button type="button" onClick={() => forceLogout(item)} disabled={busy === `sessions:${item.id}`} className="flex w-full items-center gap-2 px-3 py-2.5 text-[12px] font-black text-[#111111] transition hover:bg-[#fbfaf6] disabled:opacity-50">
                            <KeyRound className="size-4" aria-hidden="true" />
                            Force logout
                          </button>
                          {canMutate && item.status !== "SUSPENDED" ? (
                            <button type="button" onClick={() => changeStatus(item, "SUSPENDED")} disabled={busy === `status:${item.id}`} className="flex w-full items-center gap-2 px-3 py-2.5 text-[12px] font-black text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                              <Ban className="size-4" aria-hidden="true" />
                              Suspend
                            </button>
                          ) : null}
                          {canMutate && item.status !== "ACTIVE" ? (
                            <button type="button" onClick={() => changeStatus(item, "ACTIVE")} disabled={busy === `status:${item.id}`} className="flex w-full items-center gap-2 px-3 py-2.5 text-[12px] font-black text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50">
                              <ShieldCheck className="size-4" aria-hidden="true" />
                              Reactivate
                            </button>
                          ) : null}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#eee8dc] px-5 py-4">
          <p className="text-[12px] font-bold text-[#766f63]">Page {page} - {total} matched</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="h-10 rounded-2xl bg-[#fbfaf6] px-4 text-[12px] font-black disabled:opacity-40" style={{ border: "1px solid #ded8c8" }}>Previous</button>
            <button type="button" disabled={page * 25 >= total} onClick={() => setPage((value) => value + 1)} className="h-10 rounded-2xl bg-[#111111] px-4 text-[12px] font-black text-white disabled:opacity-40">Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, tone, value }: { icon: typeof Users; label: string; tone: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-2xl bg-white" style={{ border: "1px solid #ded8c8", color: tone }}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-black" style={{ color: tone }}>{value}</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const tone = value === "ACTIVE" ? "#047857" : value === "SUSPENDED" || value === "DEACTIVATED" ? "#dc2626" : "#b77900";
  const bg = value === "ACTIVE" ? "#ecfdf5" : value === "SUSPENDED" || value === "DEACTIVATED" ? "#fff1f1" : "#fff8db";
  const border = value === "ACTIVE" ? "#bbf7d0" : value === "SUSPENDED" || value === "DEACTIVATED" ? "#fecaca" : "#f6d765";
  return <span className="inline-flex h-7 items-center rounded-full px-3 text-[10px] font-black uppercase tracking-[0.08em]" style={{ background: bg, border: `1px solid ${border}`, color: tone }}>{value}</span>;
}

function initials(firstName?: string, lastName?: string, email?: string) {
  const fallback = email?.slice(0, 2) ?? "U";
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim().toUpperCase() || fallback.toUpperCase();
}

function fullName(user: TenantUser) {
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "No profile name";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
