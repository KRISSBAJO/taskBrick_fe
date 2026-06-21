import { Blocks } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-md bg-primary text-white shadow-sm">
        <Blocks className="size-5" aria-hidden="true" />
      </div>
      <div className="leading-tight">
        <p className="text-base font-semibold tracking-tight text-foreground">Taskbricks</p>
        <p className="text-xs font-medium text-ink-soft">Enterprise</p>
      </div>
    </div>
  );
}
