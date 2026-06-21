import type { ReactNode } from "react";
import { Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function OperationsHero({
  accent = "#ffd400",
  children,
  description,
  icon: Icon,
  label,
  title,
}: {
  accent?: string;
  children?: ReactNode;
  description: string;
  icon: LucideIcon;
  label: string;
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
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold text-[#8a8375]">
            <span>{label}</span>
            <span className="size-1 rounded-full" style={{ background: accent }} aria-hidden="true" />
            <span className="min-w-0">{description}</span>
          </div>
        </div>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </header>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  tone,
  value,
  subtext,
}: {
  icon: LucideIcon;
  label: string;
  tone: string;
  value: number | string;
  subtext?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] p-4" style={{ border: "1px solid #e7dfcf" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a8375]">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-2xl bg-white" style={{ border: "1px solid #ded8c8", color: tone }}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 truncate text-2xl font-black" style={{ color: tone }}>{value}</p>
      {subtext ? <p className="mt-1 truncate text-[11px] font-semibold text-[#766f63]">{subtext}</p> : null}
    </div>
  );
}

export function OpsPanel({
  accent,
  actions,
  children,
  eyebrow,
  title,
}: {
  accent: string;
  actions?: ReactNode;
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-[26px] bg-white shadow-[0_16px_50px_rgba(17,17,17,0.07)]" style={{ border: "1px solid #ded8c8" }}>
      <div className="flex flex-col gap-3 border-b border-[#eee8dc] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a8375]">
            <span className="mr-2 inline-block h-0.5 w-6 align-middle" style={{ background: accent }} />
            {eyebrow}
          </p>
          <h2 className="mt-1 text-base font-black text-[#111111]">{title}</h2>
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SearchInput({
  onChange,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#fbfaf6] px-3" style={{ border: "1px solid #ded8c8" }}>
      <Search className="size-4 text-[#8a8375]" aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#8a8375]"
      />
    </div>
  );
}

export function FilterButton({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean;
  children?: ReactNode;
  label?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 rounded-2xl px-3 text-[11px] font-black transition"
      style={{
        background: active ? "#111111" : "#fbfaf6",
        border: "1px solid #ded8c8",
        color: active ? "#ffffff" : "#5f574c",
      }}
    >
      {children ?? label}
    </button>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const upper = value.replace(/_/g, " ").toUpperCase();
  const tone = upper.includes("OK") || upper.includes("ACTIVE") || upper.includes("PASS") || upper.includes("COMPLETED") || upper.includes("DELIVERED") || upper.includes("READY") || upper.includes("RUNNING")
    ? "#047857"
    : upper.includes("FAIL") || upper.includes("ERROR") || upper.includes("OPEN") || upper.includes("REJECTED") || upper.includes("CANCELLED") || upper.includes("CRITICAL")
      ? "#dc2626"
      : upper.includes("REVIEW") || upper.includes("PENDING") || upper.includes("REQUESTED") || upper.includes("QUEUED")
        ? "#d89b00"
        : "#6d5dd3";
  return (
    <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[9px] font-black uppercase tracking-[0.08em]" style={{ border: "1px solid #ded8c8", color: tone }}>
      {upper}
    </span>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[#ded8c8] bg-[#fbfaf6] px-4 py-8 text-center text-sm font-bold text-[#8a8375]">{text}</div>;
}

export function RowCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-3 rounded-2xl bg-[#fbfaf6] p-4 lg:grid-cols-[1fr_auto]", className)} style={{ border: "1px solid #e7dfcf" }}>
      {children}
    </div>
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function formatNumber(value: number | string | undefined | null) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? new Intl.NumberFormat("en").format(numeric) : "0";
}

export function countFrom(record: Record<string, number> | undefined, keys: string[]) {
  if (!record) return 0;
  return keys.reduce((sum, key) => sum + (record[key] ?? record[key.toUpperCase()] ?? record[key.toLowerCase()] ?? 0), 0);
}

export function textField(record: Record<string, unknown>, keys: string[], fallback = "n/a") {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return fallback;
}
