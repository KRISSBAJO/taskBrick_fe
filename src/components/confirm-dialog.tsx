"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: "danger" | "warning";
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  busy,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  onClose,
  onConfirm,
  open,
  title,
  tone = "danger",
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[#111111]/45 backdrop-blur-sm"
        aria-label="Close confirmation dialog"
        onClick={busy ? undefined : onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_34px_100px_rgba(17,17,17,0.28)]"
      >
        <div
          className={cn(
            "h-1",
            tone === "danger" ? "bg-red-500" : "bg-amber-400",
          )}
        />
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                tone === "danger" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
              )}
            >
              <AlertTriangle className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="confirm-dialog-title" className="text-base font-black text-foreground">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close dialog"
              className="flex size-8 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:bg-panel-muted hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-9 rounded-xl border border-line bg-background px-4 text-[13px] font-bold text-foreground transition hover:bg-panel-muted disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={cn(
                "h-9 rounded-xl px-4 text-[13px] font-black text-white transition disabled:opacity-60",
                tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700",
              )}
            >
              {busy ? "Working..." : confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
