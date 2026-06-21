"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[520px] items-center justify-center">
      <section className="w-full max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-black text-red-800">Workspace view failed</h1>
        <p className="mt-2 text-sm leading-relaxed text-red-700">
          {error.message || "TaskBricks could not render this workspace page."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-black text-white transition hover:bg-red-800"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </section>
    </div>
  );
}
