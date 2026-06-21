"use client";

import { useMemo, type ReactNode } from "react";
import { Lock, type LucideIcon } from "lucide-react";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { cn } from "@/lib/cn";

export type TabItem<T extends string> = {
  id: T;
  label: string;
  count?: number;
  icon?: LucideIcon;
};

export function PageHeader({
  actions,
  eyebrow,
  icon: Icon,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="tb-dashboard-hero px-5 py-5">
        <div className="flex flex-wrap items-start gap-4">
          {Icon ? (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-[#111111] shadow-[0_18px_44px_rgba(255,212,0,0.26)]">
              <Icon className="size-5" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-1 text-2xl font-black text-white">{title}</h1>
            {subtitle ? <p className="mt-1 max-w-3xl text-sm text-white/60">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function ActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-panel p-3 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function SurfaceCard({
  action,
  children,
  className,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-line bg-panel shadow-sm", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-black text-foreground">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function FormField({
  children,
  className,
  hint,
  label,
}: {
  children: ReactNode;
  className?: string;
  hint?: string;
  label: string;
}) {
  return (
    <label className={cn("grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft", className)}>
      {label}
      {children}
      {hint ? <span className="text-[11px] normal-case tracking-normal text-ink-soft/70">{hint}</span> : null}
    </label>
  );
}

export function Tabs<T extends string>({
  active,
  items,
  onChange,
}: {
  active: T;
  items: Array<TabItem<T>>;
  onChange: (id: T) => void;
}) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-line bg-panel p-1 shadow-sm tb-scrollbar" aria-label="Page sections">
      {items.map((tab) => {
        const Icon = tab.icon;
        const selected = active === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-[13px] font-black transition",
              selected ? "bg-foreground text-white shadow-sm" : "text-ink-soft hover:bg-panel-muted hover:text-foreground",
            )}
          >
            {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
            {tab.label}
            {typeof tab.count === "number" ? (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px]", selected ? "bg-white/15 text-white" : "bg-panel-muted text-ink-soft")}>
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export function EmptyState({
  action,
  icon: Icon,
  message,
  title,
}: {
  action?: ReactNode;
  icon?: LucideIcon;
  message?: string;
  title: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-panel px-6 py-10 text-center">
      {Icon ? (
        <span className="flex size-12 items-center justify-center rounded-2xl bg-panel-muted text-ink-soft">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      ) : null}
      <h2 className="mt-3 text-sm font-black text-foreground">{title}</h2>
      {message ? <p className="mt-1 max-w-md text-sm text-ink-soft">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-panel-muted", className)} />;
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "brand";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-black",
        tone === "neutral" && "border-line bg-panel-muted text-ink-soft",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "danger" && "border-red-200 bg-red-50 text-red-700",
        tone === "info" && "border-blue-200 bg-blue-50 text-blue-700",
        tone === "brand" && "border-primary/40 bg-primary/15 text-[#111111]",
      )}
    >
      {children}
    </span>
  );
}

export function Tooltip({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-40 -translate-x-1/2 translate-y-1 rounded-lg bg-[#111111] px-2.5 py-1.5 text-[11px] font-bold text-white opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

export function DataTable({
  children,
  columns,
}: {
  children: ReactNode;
  columns: string[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
      <div className="overflow-x-auto tb-scrollbar">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-panel-muted">
              {columns.map((column) => (
                <th key={column} className="border-b border-line px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ink-soft">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function BrandedModal({
  children,
  description,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[64] flex items-center justify-center px-4 py-6">
      <button type="button" aria-label="Close modal" className="absolute inset-0 cursor-default bg-[#111111]/45 backdrop-blur-sm" onClick={onClose} />
      <section className="relative max-h-[88dvh] w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_34px_100px_rgba(17,17,17,0.28)]">
        <div className="h-1 bg-primary" />
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-lg font-black text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
        </div>
        <div className="max-h-[calc(88dvh-92px)] overflow-y-auto p-5 tb-scrollbar">{children}</div>
      </section>
    </div>
  );
}

export function SideDrawer({
  children,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[62] bg-[#111111]/45 backdrop-blur-sm">
      <button type="button" aria-label="Close drawer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-line bg-background shadow-2xl">
        <div className="border-b border-line bg-panel px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark">Workspace drawer</p>
          <h2 className="mt-1 text-lg font-black text-foreground">{title}</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 tb-scrollbar">{children}</div>
      </aside>
    </div>
  );
}

export function useCan(required?: string | string[]) {
  const { user } = useWorkspaceAuth();

  return useMemo(() => {
    if (!required) return true;
    if (user.permissions.includes("manage:all")) return true;
    const requiredList = Array.isArray(required) ? required : [required];
    return requiredList.every((permission) => user.permissions.includes(permission));
  }, [required, user.permissions]);
}

export function PermissionGate({
  children,
  fallback,
  permission,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  permission?: string | string[];
}) {
  const allowed = useCan(permission);

  if (allowed) return <>{children}</>;
  return fallback ? (
    <>{fallback}</>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel-muted px-2 py-1 text-[11px] font-bold text-ink-soft">
      <Lock className="size-3" aria-hidden="true" />
      Restricted
    </span>
  );
}
