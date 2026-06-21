import type { Project, ProjectStatus, Task, TaskPriority, TaskStatus, UserSummary } from "@/lib/api";

export type ProjectHealth = "On track" | "At risk" | "Needs review" | "Complete";

export const projectStatusLabels: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "Ready",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  TESTING: "Testing",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
  CRITICAL: "Critical",
};

export const taskStatusOrder: TaskStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "TESTING", "DONE"];

export function formatShortDate(value?: string | null) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatLongDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function formatEstimate(task: Task) {
  if (typeof task.storyPoints === "number") {
    return `${task.storyPoints} pts`;
  }

  if (typeof task.estimateMins === "number") {
    const hours = Math.max(1, Math.round(task.estimateMins / 60));
    return `${hours}h`;
  }

  return "Unestimated";
}

export function userInitials(user?: UserSummary | null) {
  if (!user) {
    return "UN";
  }

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.trim();

  return initials || user.email.slice(0, 2).toUpperCase();
}

export function getProjectHealth(project: Project): ProjectHealth {
  if (project.status === "COMPLETED" || project.progress >= 100) {
    return "Complete";
  }

  if (project.status === "ON_HOLD") {
    return "At risk";
  }

  if (project.dueDate) {
    const due = new Date(project.dueDate).getTime();
    const now = Date.now();
    const daysUntilDue = (due - now) / 86_400_000;

    if (daysUntilDue < 0) {
      return "At risk";
    }

    if (daysUntilDue <= 14 && project.progress < 65) {
      return "Needs review";
    }
  }

  if (project.progress < 35 && project.status === "ACTIVE") {
    return "Needs review";
  }

  return "On track";
}

export function isOpenTask(task: Task) {
  return task.status !== "DONE" && task.status !== "CANCELLED";
}

export function isRiskTask(task: Task) {
  return isOpenTask(task) && (task.priority === "URGENT" || task.priority === "CRITICAL");
}

export function sortTasksForAttention(tasks: Task[]) {
  const priorityWeight: Record<TaskPriority, number> = {
    CRITICAL: 5,
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  return [...tasks].sort((left, right) => {
    const priorityDelta = priorityWeight[right.priority] - priorityWeight[left.priority];

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;

    return leftDue - rightDue;
  });
}
