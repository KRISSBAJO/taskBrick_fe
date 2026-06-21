import type { AuthUser, Project, ProjectPermissionAction } from "@/lib/api";

const PROJECT_CREATE_PERMISSIONS = new Set(["manage:all", "manage:tenant", "manage:projects"]);

export function hasWorkspacePermission(user: AuthUser | null | undefined, permission: string) {
  return Boolean(user?.permissions?.includes(permission));
}

export function canCreateProjects(user: AuthUser | null | undefined) {
  return Boolean(user?.permissions?.some((permission) => PROJECT_CREATE_PERMISSIONS.has(permission)));
}

export function hasProjectAction(
  project: Project | null | undefined,
  action: ProjectPermissionAction,
  fallback = false,
) {
  return project?.permissions?.actions?.[action] ?? fallback;
}

export function canViewProjectFinance(project: Project | null | undefined, fallback = false) {
  if (!project || project.financeRedacted) return false;
  return hasProjectAction(project, "viewBudget", fallback) || hasProjectAction(project, "manageBudget", fallback);
}

export function canEditProjectFinance(project: Project | null | undefined, fallback = false) {
  if (!project || project.financeRedacted) return false;
  return hasProjectAction(project, "manageBudget", fallback);
}
