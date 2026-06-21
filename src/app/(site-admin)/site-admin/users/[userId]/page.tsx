"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  Clock3,
  Fingerprint,
  KeyRound,
  Mail,
  MonitorSmartphone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import {
  getSiteUser,
  resendSiteUserVerification,
  revokeSiteUserSessions,
  updateSiteUserStatus,
  type SiteUserDetail,
  type TenantUser,
} from "@/lib/api";

export default function SiteAdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = String(params.userId ?? "");
  const { auth, user: currentUser } = useWorkspaceAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [detail, setDetail] = useState<SiteUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const canMutate = currentUser.platformAdminLevel === "OWNER" || currentUser.platformAdminLevel === "ADMIN";

  const loadUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      setDetail(await getSiteUser(auth.accessToken, userId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load user profile.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, userId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const target = detail?.user;
  const activeSessions = useMemo(() => {
    const now = Date.now();
    return (target?.authSessions ?? []).filter((session) => !session.revokedAt && new Date(session.expiresAt).getTime() > now).length;
  }, [target?.authSessions]);
  const activeMfa = useMemo(() => (target?.mfaFactors ?? []).filter((factor) => factor.status === "ACTIVE").length, [target?.mfaFactors]);

  async function changeStatus(nextStatus: string) {
    if (!target) return;
    const confirmed = await confirm({
      title: `${nextStatus === "ACTIVE" ? "Reactivate" : "Update"} ${target.email}?`,
      description:
        nextStatus === "SUSPENDED" || nextStatus === "DEACTIVATED"
          ? "This revokes active sessions and trusted devices, then records audit and security events."
          : "This updates the user account state and records the platform action.",
      confirmLabel: nextStatus === "ACTIVE" ? "Reactivate user" : "Update status",
      tone: nextStatus === "SUSPENDED" || nextStatus === "DEACTIVATED" ? "danger" : "warning",
    });
    if (!confirmed) return;

    setBusy("status");
    try {
      await updateSiteUserStatus(auth.accessToken, target.id, {
        status: nextStatus,
        reason: `Changed from site admin user detail by ${currentUser.email}`,
      });
      toast({ title: "User updated", description: `${target.email} is now ${nextStatus}.`, variant: "success" });
      await loadUser();
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

  async function forceLogout() {
    if (!target) return;
    const confirmed = await confirm({
      title: `Force logout ${target.email}?`,
      description: "All active sessions for this user will be revoked immediately and audited.",
      confirmLabel: "Revoke sessions",
      tone: "danger",
    });
    if (!confirmed) return;

    setBusy("sessions");
    try {
      const result = await revokeSiteUserSessions(auth.accessToken, target.id, {
        reason: `Forced from site admin user detail by ${currentUser.email}`,
      });
      toast({
        title: "Sessions revoked",
        description: `${result.sessionsRevoked} active session${result.sessionsRevoked === 1 ? "" : "s"} revoked.`,
        variant: "success",
      });
      await loadUser();
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

  async function resendVerification() {
    if (!target) return;
    setBusy("mail");
    try {
      const result = await resendSiteUserVerification(auth.accessToken, target.id);
      toast({
        title: result.sent ? "Email sent" : "Email not sent",
        description: result.devLink ? `${result.message} Dev link returned by backend.` : result.message,
        variant: result.sent || result.skipped ? "success" : "warning",
      });
      await loadUser();
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

  if (loading) {
    return <EmptyState text="Loading user profile..." />;
  }

  if (error || !detail || !target) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <BackLink />
        <EmptyState text={error || "User profile was not returned."} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(17,17,17,0.08)] md:p-6" style={{ border: "1px solid #ded8c8" }}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <BackLink />
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <StatusBadge value={target.status ?? "UNKNOWN"} />
              {target.emailVerifiedAt ? <SoftBadge label="Email verified" color="#047857" /> : <SoftBadge label="Email pending" color="#b77900" />}
              {target.platformAdminProfile?.status === "ACTIVE" ? <SoftBadge label={`Platform ${target.platformAdminProfile.level}`} color="#dc2626" /> : null}
            </div>
            <div className="mt-4 flex min-w-0 items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-[22px] bg-[#f4f1e7] text-lg font-black text-[#111111]" style={{ border: "1px solid #ded8c8" }}>
                {initials(target)}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-black tracking-tight text-[#111111] md:text-[42px]">{target.email}</h1>
                <p className="mt-1 text-sm font-semibold text-[#665f54]">{fullName(target)} - {target.tenant?.name ?? "No tenant"}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resendVerification} disabled={busy === "mail"} className="h-10 rounded-2xl bg-[#fbfaf6] px-4 text-[12px] font-black text-[#111111] transition hover:bg-[#ffd400] disabled:opacity-50" style={{ border: "1px solid #ded8c8" }}>Resend invite/verify</button>
            <button type="button" onClick={forceLogout} disabled={busy === "sessions"} className="h-10 rounded-2xl bg-[#111111] px-4 text-[12px] font-black text-white transition hover:bg-[#33302b] disabled:opacity-50">Force logout</button>
            {canMutate && target.status !== "SUSPENDED" ? (
              <button type="button" onClick={() => changeStatus("SUSPENDED")} disabled={busy === "status"} className="h-10 rounded-2xl px-4 text-[12px] font-black transition disabled:opacity-50" style={{ background: "#fff1f1", border: "1px solid #fecaca", color: "#dc2626" }}>Suspend</button>
            ) : null}
            {canMutate && target.status !== "ACTIVE" ? (
              <button type="button" onClick={() => changeStatus("ACTIVE")} disabled={busy === "status"} className="h-10 rounded-2xl px-4 text-[12px] font-black transition disabled:opacity-50" style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#047857" }}>Reactivate</button>
            ) : null}
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric icon={Building2} label="Tenant" value={target.tenant?.slug ?? "-"} tone="#6d5dd3" />
          <Metric icon={KeyRound} label="Active sessions" value={activeSessions} tone="#059669" />
          <Metric icon={ShieldCheck} label="MFA factors" value={activeMfa} tone="#2563eb" />
          <Metric icon={Users} label="Project roles" value={target.projectMembers?.length ?? 0} tone="#d89b00" />
          <Metric icon={ShieldAlert} label="Security events" value={detail.securityEvents.length} tone={detail.securityEvents.length ? "#dc2626" : "#059669"} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <Panel title="Identity and membership" eyebrow="Tenant boundary" accent="#6d5dd3">
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Tenant" value={target.tenant ? `${target.tenant.name} (@${target.tenant.slug})` : "No tenant"} href={target.tenant ? `/site-admin/tenants/${target.tenant.id}` : undefined} />
              <Info label="Account status" value={target.status ?? "UNKNOWN"} />
              <Info label="Email verified" value={target.emailVerifiedAt ? formatDate(target.emailVerifiedAt) : "Pending"} />
              <Info label="Last login" value={target.lastLoginAt ? formatDate(target.lastLoginAt) : "Never"} />
              <Info label="Locked until" value={target.lockedUntil ? formatDate(target.lockedUntil) : "Not locked"} />
              <Info label="Failed logins" value={String(target.failedLoginAttempts ?? 0)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(target.roles ?? []).map(({ role }) => <SoftBadge key={role.id} label={role.name} color={role.isSystem ? "#111111" : "#6d5dd3"} />)}
              {(target.roles ?? []).length === 0 ? <SoftBadge label="No assigned role" color="#8a8375" /> : null}
            </div>
          </Panel>

          <Panel title="Sessions and login history" eyebrow="Auth lifecycle" accent="#059669">
            <div className="space-y-2">
              {(target.authSessions ?? []).slice(0, 10).map((session) => (
                <Row key={session.id} icon={MonitorSmartphone} title={session.deviceName || session.ipAddress || "Unknown device"} meta={`${session.userAgent || "No user agent"} - expires ${formatDate(session.expiresAt)}`} status={session.revokedAt ? "REVOKED" : "ACTIVE"} />
              ))}
              {(target.authSessions ?? []).length === 0 ? <EmptyState text="No sessions returned for this user." compact /> : null}
            </div>
            <div className="mt-4 border-t border-[#eee8dc] pt-4">
              <div className="space-y-2">
                {(target.loginHistory ?? []).slice(0, 8).map((event) => (
                  <Row key={event.id} icon={Clock3} title={`${event.status} via ${event.method}`} meta={`${event.ipAddress || "No IP"} - ${event.reason || "No reason"} - ${formatDate(event.createdAt)}`} status={event.suspicious ? "SUSPICIOUS" : event.status} />
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Projects and assigned work" eyebrow="Workspace scope" accent="#d89b00">
            <div className="grid gap-3 lg:grid-cols-2">
              {(target.projectMembers ?? []).map((membership) => (
                <div key={membership.id} className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
                  <p className="text-[13px] font-black text-[#111111]">{membership.project.name}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#766f63]">{membership.project.key} - {membership.role || "Member"} - {membership.project.status}</p>
                </div>
              ))}
              {(target.projectMembers ?? []).length === 0 ? <EmptyState text="No project memberships returned." compact /> : null}
            </div>
            <div className="mt-4 space-y-2">
              {(target.assignedTasks ?? []).slice(0, 8).map((assignment) => (
                <Row key={assignment.id} icon={Activity} title={assignment.task.title} meta={`${assignment.task.key} - ${assignment.task.project.name} - ${assignment.task.priority}`} status={assignment.task.status} />
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="MFA and trusted devices" eyebrow="Identity assurance" accent="#2563eb">
            <div className="space-y-2">
              {(target.mfaFactors ?? []).map((factor) => (
                <Row key={factor.id} icon={ShieldCheck} title={factor.label || factor.type} meta={`Created ${formatDate(factor.createdAt)}${factor.lastUsedAt ? ` - last used ${formatDate(factor.lastUsedAt)}` : ""}`} status={factor.status} />
              ))}
              {(target.mfaFactors ?? []).length === 0 ? <EmptyState text="MFA is not configured for this user." compact /> : null}
            </div>
            <div className="mt-4 space-y-2 border-t border-[#eee8dc] pt-4">
              {(target.trustedDevices ?? []).slice(0, 6).map((device) => (
                <Row key={device.id} icon={MonitorSmartphone} title={device.name || device.ipAddress || "Trusted device"} meta={`Expires ${formatDate(device.expiresAt)}`} status={device.status} />
              ))}
            </div>
          </Panel>

          <Panel title="Audit and security" eyebrow="Action trail" accent="#dc2626">
            <div className="space-y-2">
              {detail.securityEvents.slice(0, 8).map((event) => (
                <Row key={event.id} icon={ShieldAlert} title={event.type} meta={`${event.source || "site"} - ${formatDate(event.createdAt)}`} status={event.status} />
              ))}
              {detail.platformAuditLogs.slice(0, 8).map((event) => (
                <Row key={event.id} icon={Fingerprint} title={event.action} meta={`Platform audit - ${formatDate(event.createdAt)}`} status={event.entityType} />
              ))}
              {detail.securityEvents.length === 0 && detail.platformAuditLogs.length === 0 ? <EmptyState text="No audit or security events returned." compact /> : null}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/site-admin/users" className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-3 text-[12px] font-black text-[#111111] transition hover:bg-[#ffd400]" style={{ border: "1px solid #ded8c8" }}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      Users
    </Link>
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

function Metric({ icon: Icon, label, tone, value }: { icon: typeof UserRound; label: string; tone: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-2xl bg-white" style={{ border: "1px solid #ded8c8", color: tone }}><Icon className="size-4" aria-hidden="true" /></span>
      </div>
      <p className="mt-2 truncate text-2xl font-black" style={{ color: tone }}>{value}</p>
    </div>
  );
}

function Info({ href, label, value }: { href?: string; label: string; value: string }) {
  const content = (
    <>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8a8375]">{label}</p>
      <p className="mt-1 truncate text-[13px] font-black text-[#111111]">{value}</p>
    </>
  );
  if (href) {
    return <Link href={href} className="rounded-2xl bg-[#fbfaf6] p-4 transition hover:bg-[#fff8db]" style={{ border: "1px solid #e7dfcf" }}>{content}</Link>;
  }
  return <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>{content}</div>;
}

function Row({ icon: Icon, meta, status, title }: { icon: typeof Activity; meta: string; status: string; title: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#fbfaf6] px-3 py-3" style={{ border: "1px solid #e7dfcf" }}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[#111111]" style={{ border: "1px solid #ded8c8" }}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[12px] font-black text-[#111111]">{title}</p>
          <StatusBadge value={status} small />
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] font-semibold text-[#766f63]">{meta}</p>
      </div>
    </div>
  );
}

function SoftBadge({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex h-7 items-center rounded-full bg-[#fbfaf6] px-3 text-[10px] font-black uppercase tracking-[0.08em]" style={{ border: "1px solid #ded8c8", color }}>{label}</span>;
}

function StatusBadge({ small, value }: { small?: boolean; value: string }) {
  const tone = value === "ACTIVE" || value === "SUCCESS" ? "#047857" : value.includes("SUSP") || value.includes("FAILED") || value === "REVOKED" ? "#dc2626" : "#6d5dd3";
  return <span className={`inline-flex items-center rounded-full bg-white px-2.5 ${small ? "h-6 text-[9px]" : "h-7 text-[10px]"} font-black uppercase tracking-[0.08em]`} style={{ border: "1px solid #ded8c8", color: tone }}>{value}</span>;
}

function EmptyState({ compact, text }: { compact?: boolean; text: string }) {
  return <div className={`rounded-[22px] border border-dashed border-[#ded8c8] bg-white text-center text-sm font-bold text-[#8a8375] ${compact ? "px-4 py-6" : "mx-auto max-w-3xl px-5 py-16"}`}>{text}</div>;
}

function initials(user: TenantUser) {
  const fallback = user.email?.slice(0, 2) ?? "U";
  return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.trim().toUpperCase() || fallback.toUpperCase();
}

function fullName(user: TenantUser) {
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "No profile name";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
