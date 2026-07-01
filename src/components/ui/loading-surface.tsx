import Image from "next/image";
import { Loader2, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function AppLoadingSurface({
  className,
  icon: Icon = ShieldCheck,
  steps = ["Session", "Access", "Realtime"],
  subtitle = "Checking local session state.",
  title = "Preparing your workspace...",
}: {
  className?: string;
  icon?: LucideIcon;
  steps?: string[];
  subtitle?: string;
  title?: string;
}) {
  return (
    <div className={cn("relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 text-center", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,212,0,0.14),transparent_34%),linear-gradient(180deg,#fffdf6_0%,#ffffff_68%)]" />
      <div className="relative w-full max-w-[430px] rounded-[28px] border border-line bg-white/92 p-6 shadow-[0_28px_80px_rgba(17,17,17,0.10)] backdrop-blur">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-line bg-white shadow-sm">
          <Image
            src="/product/taskbrick_logo.png"
            alt="TaskBricks"
            width={34}
            height={34}
            className="size-8 object-contain"
            priority
          />
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary-dark">
          <Icon className="size-3.5" aria-hidden="true" />
          Secure workspace
        </div>
        <p className="mt-3 text-lg font-black text-foreground">{title}</p>
        <p className="mt-2 text-sm font-semibold text-ink-soft">{subtitle}</p>

        <div className="mt-6 overflow-hidden rounded-full bg-panel-muted">
          <span className="block h-1.5 w-1/2 origin-left rounded-full bg-primary shadow-[0_0_24px_rgba(255,212,0,0.55)] animate-[tb-loading-bar_1.45s_ease-in-out_infinite]" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-left">
          {steps.slice(0, 3).map((label, index) => (
            <div key={label} className="rounded-2xl border border-line bg-[#fbfaf6] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-ink-soft">{label}</span>
                <Loader2
                  className="size-3 animate-spin text-primary-dark"
                  aria-hidden="true"
                  style={{ animationDelay: `${index * 120}ms` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageLoadingBlocks({ title = "Loading workspace data" }: { title?: string }) {
  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary-dark">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black text-foreground">{title}</p>
            <p className="mt-1 text-xs font-semibold text-ink-soft">Fetching the latest workspace records.</p>
          </div>
        </div>
        <div className="h-1 overflow-hidden bg-panel-muted">
          <span className="block h-full w-1/2 origin-left rounded-full bg-primary animate-[tb-loading-bar_1.45s_ease-in-out_infinite]" />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl border border-line bg-panel-muted" />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-2xl border border-line bg-panel-muted" />
    </div>
  );
}
