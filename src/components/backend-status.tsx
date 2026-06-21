"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Clock } from "lucide-react";
import { API_BASE_URL, healthReady, moduleStatus } from "@/lib/api";
import { cn } from "@/lib/cn";

type Status = "checking" | "ready" | "offline";

const checks = [
  { label: "Readiness", path: "/health/ready", run: healthReady },
  { label: "Auth", path: "/auth/status", run: () => moduleStatus("/auth/status") },
  { label: "Projects", path: "/projects/status", run: () => moduleStatus("/projects/status") },
  { label: "Tasks", path: "/tasks/status", run: () => moduleStatus("/tasks/status") },
  { label: "Reporting", path: "/reporting/status", run: () => moduleStatus("/reporting/status") },
  { label: "AI", path: "/ai/status", run: () => moduleStatus("/ai/status") },
];

export function BackendStatus() {
  const [status, setStatus] = useState<Record<string, Status>>(
    Object.fromEntries(checks.map((check) => [check.path, "checking"])),
  );

  useEffect(() => {
    let mounted = true;

    checks.forEach(async (check) => {
      try {
        const result = await check.run();
        const isReady =
          typeof result.status === "string"
            ? ["ok", "ready", "configured", "degraded"].includes(result.status.toLowerCase())
            : true;

        if (mounted) {
          setStatus((current) => ({
            ...current,
            [check.path]: isReady ? "ready" : "offline",
          }));
        }
      } catch {
        if (mounted) {
          setStatus((current) => ({ ...current, [check.path]: "offline" }));
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-md border border-line bg-panel p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">API status</p>
          <p className="mt-1 text-xs text-ink-soft">{API_BASE_URL}</p>
        </div>
        <Activity className="size-5 text-primary" aria-hidden="true" />
      </div>
      <div className="mt-4 grid gap-2">
        {checks.map((check) => {
          const state = status[check.path];
          const Icon = state === "ready" ? CheckCircle2 : Clock;

          return (
            <div key={check.path} className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">{check.label}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                  state === "ready" && "bg-[#e1f3ef] text-primary",
                  state === "checking" && "bg-[#eef2f6] text-ink-soft",
                  state === "offline" && "bg-[#fee2e2] text-danger",
                )}
              >
                <Icon className="size-3" aria-hidden="true" />
                {state}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
