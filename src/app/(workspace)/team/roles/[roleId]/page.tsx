"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { listPermissions, listRoles, type Permission, type Role } from "@/lib/api";
import { cn } from "@/lib/cn";

type LoadState = "idle" | "loading" | "ready" | "error";

function permissionLabel(permission: Permission) {
  return `${permission.action}:${permission.subject}`;
}

function subjectLabel(value: string) {
  return value
    .split(/[-_:]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function RolePermissionDetailPage() {
  const params = useParams<{ roleId: string }>();
  const { auth } = useWorkspaceAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setState("loading");
      setError("");
      try {
        const [roleList, permissionList] = await Promise.all([
          listRoles(auth.accessToken),
          listPermissions(auth.accessToken),
        ]);
        if (!active) return;
        setRoles(roleList);
        setPermissions(permissionList);
        setState("ready");
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Unable to load role permissions.");
        setState("error");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [auth.accessToken]);

  const role = useMemo(() => roles.find((item) => item.id === params.roleId) ?? null, [params.roleId, roles]);
  const assignedIds = useMemo(
    () => new Set(role?.permissions?.map((item) => item.permission.id) ?? []),
    [role],
  );

  const filteredPermissions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...permissions]
      .sort((left, right) => {
        const leftKey = `${left.subject}:${left.action}`;
        const rightKey = `${right.subject}:${right.action}`;
        const assignedSort = Number(assignedIds.has(right.id)) - Number(assignedIds.has(left.id));
        return assignedSort || leftKey.localeCompare(rightKey);
      })
      .filter((permission) => {
        if (!needle) return true;
        return [
          permission.action,
          permission.subject,
          permission.description ?? "",
          permissionLabel(permission),
          assignedIds.has(permission.id) ? "assigned" : "not assigned",
        ].some((value) => value.toLowerCase().includes(needle));
      });
  }, [assignedIds, permissions, query]);

  const assignedCount = assignedIds.size;
  const totalCount = permissions.length;
  const coverage = totalCount ? Math.round((assignedCount / totalCount) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/team?tab=roles"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-panel px-3 text-sm font-black text-foreground shadow-sm transition hover:bg-panel-muted"
        >
          <ArrowLeft className="size-4" />
          Back to Team management
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-ink-soft">
          <ShieldCheck className="size-4 text-blue-600" />
          RBAC inspection
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
        <div className="relative overflow-hidden bg-[#111111] px-5 py-5 text-white md:px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Role permission table</p>
              <h1 className="mt-2 truncate text-3xl font-black tracking-tight md:text-4xl">
                {state === "loading" ? "Loading role..." : role?.name ?? "Role not found"}
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/65">
                {role?.description || "Review every permission available in this tenant and confirm exactly what this role grants."}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/8 p-2 text-center backdrop-blur">
              <Metric label="Assigned" value={assignedCount} />
              <Metric label="Available" value={totalCount} />
              <Metric label="Coverage" value={`${coverage}%`} highlight />
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-line bg-background/60 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search action, subject, description, assigned..."
              className="h-12 w-full rounded-2xl border border-line bg-panel pl-11 pr-4 text-sm font-bold text-foreground outline-none transition placeholder:text-ink-soft/65 focus:border-primary/70 focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.12em]">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-emerald-100">
              <CheckCircle2 className="size-3.5" />
              Assigned
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-panel px-3 py-2 text-ink-soft ring-1 ring-line">
              <XCircle className="size-3.5" />
              Not assigned
            </span>
          </div>
        </div>

        {state === "error" ? (
          <div className="p-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          </div>
        ) : null}

        {state === "loading" ? (
          <div className="grid gap-2 p-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl bg-panel-muted" />
            ))}
          </div>
        ) : null}

        {state === "ready" && !role ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
            <LockKeyhole className="size-10 text-ink-soft/55" />
            <div>
              <p className="text-lg font-black text-foreground">Role not found</p>
              <p className="mt-1 text-sm font-semibold text-ink-soft">This role may have been removed or your session cannot access it.</p>
            </div>
            <Link href="/team?tab=roles" className="tb-yellow-button inline-flex h-10 items-center rounded-xl px-4 text-sm font-black">
              Return to roles
            </Link>
          </div>
        ) : null}

        {state === "ready" && role ? (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full border-collapse text-left">
              <thead className="bg-panel-muted/70 text-[10px] font-black uppercase tracking-[0.16em] text-ink-soft">
                <tr>
                  <th className="w-[160px] px-5 py-3">Status</th>
                  <th className="px-5 py-3">Permission</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredPermissions.map((permission) => {
                  const assigned = assignedIds.has(permission.id);
                  return (
                    <tr key={permission.id} className={cn("transition hover:bg-panel-muted/45", assigned && "bg-emerald-50/35")}>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]",
                            assigned
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-panel-muted text-ink-soft",
                          )}
                        >
                          {assigned ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                          {assigned ? "Assigned" : "Not assigned"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <code className="rounded-lg bg-[#111111] px-2 py-1 text-xs font-black text-white">{permissionLabel(permission)}</code>
                      </td>
                      <td className="px-5 py-3 text-sm font-black text-foreground">{subjectLabel(permission.subject)}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-lg border border-line bg-panel px-2 py-1 text-xs font-black text-ink-soft">{permission.action}</span>
                      </td>
                      <td className="max-w-[420px] px-5 py-3 text-sm font-semibold leading-6 text-ink-soft">
                        {permission.description || "No description provided."}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!filteredPermissions.length ? (
              <div className="flex min-h-40 items-center justify-center p-8 text-sm font-bold text-ink-soft">
                No permissions match your search.
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Metric({ label, value, highlight = false }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className="min-w-24 rounded-xl bg-white/8 px-4 py-3">
      <p className={cn("text-2xl font-black", highlight ? "text-primary" : "text-white")}>{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/48">{label}</p>
    </div>
  );
}
