"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastVariant = "success" | "error" | "info" | "warning";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = createToastId();
      const item: ToastItem = {
        ...input,
        id,
        variant: input.variant ?? "info",
      };

      setItems((current) => [item, ...current].slice(0, 5));

      window.setTimeout(() => {
        dismissToast(id);
      }, input.durationMs ?? 5200);

      return id;
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ dismissToast, toast }), [dismissToast, toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[70] grid w-[min(380px,calc(100vw-2rem))] gap-2">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismissToast(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const Icon = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  }[item.variant];

  return (
    <section
      className={cn(
        "pointer-events-auto overflow-hidden rounded-2xl border bg-panel shadow-[0_24px_70px_rgba(17,17,17,0.16)]",
        "animate-[tb-toast-in_180ms_ease-out]",
        item.variant === "success" && "border-emerald-200",
        item.variant === "error" && "border-red-200",
        item.variant === "warning" && "border-amber-200",
        item.variant === "info" && "border-line",
      )}
      role="status"
    >
      <div
        className={cn(
          "h-1",
          item.variant === "success" && "bg-emerald-500",
          item.variant === "error" && "bg-red-500",
          item.variant === "warning" && "bg-amber-400",
          item.variant === "info" && "bg-primary",
        )}
      />
      <div className="flex gap-3 p-3.5">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            item.variant === "success" && "bg-emerald-50 text-emerald-700",
            item.variant === "error" && "bg-red-50 text-red-700",
            item.variant === "warning" && "bg-amber-50 text-amber-700",
            item.variant === "info" && "bg-primary/20 text-[#111111]",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-foreground">{item.title}</p>
          {item.description ? (
            <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-ink-soft">
              {item.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-panel-muted hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
