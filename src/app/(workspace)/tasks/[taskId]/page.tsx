"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { TaskLifecycleView } from "@/components/task-lifecycle-view";
import { useWorkspaceAuth } from "@/components/workspace-shell";
import { getTask, type Task } from "@/lib/api";
import { cn } from "@/lib/cn";

export default function TaskRoutePage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { auth } = useWorkspaceAuth();
  const [taskId, setTaskId] = useState("");
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    params.then((value) => {
      if (mounted) setTaskId(value.taskId);
    });
    return () => {
      mounted = false;
    };
  }, [params]);

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError("");
    try {
      setTask(await getTask(auth.accessToken, taskId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load task.");
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken, taskId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTask(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadTask]);

  if (loading || !taskId) {
    return (
      <div className="mx-auto grid max-w-6xl gap-5">
        <div className="h-48 animate-pulse rounded-2xl bg-panel-muted" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="h-96 animate-pulse rounded-2xl bg-panel-muted" />
          <div className="h-96 animate-pulse rounded-2xl bg-panel-muted" />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <AlertTriangle className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black text-red-900">Task unavailable</h1>
            <p className="mt-1 text-sm font-semibold leading-6 text-red-700">
              {error || "This task could not be found."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadTask()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-black text-white"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                Retry
              </button>
              <Link
                href="/projects"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-black text-red-700"
              >
                <ArrowLeft className="size-4" />
                Back to projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TaskLifecycleView
      mode="page"
      projectId={task.projectId}
      taskId={task.id}
      token={auth.accessToken}
      onDeleted={() => {
        window.location.href = `/projects/${task.projectId}`;
      }}
      onUpdated={setTask}
    />
  );
}
