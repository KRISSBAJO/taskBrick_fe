"use client";

import { useRouter } from "next/navigation";
import { TaskLifecycleView } from "@/components/task-lifecycle-view";

export function TaskDetailPage({
  projectId,
  taskId,
  token,
}: {
  projectId: string;
  taskId: string;
  token: string;
}) {
  const router = useRouter();

  return (
    <TaskLifecycleView
      mode="page"
      projectId={projectId}
      taskId={taskId}
      token={token}
      onDeleted={() => router.push(`/projects/${projectId}`)}
      onUpdated={() => router.refresh()}
    />
  );
}
