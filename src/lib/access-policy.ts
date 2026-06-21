import type { AuthUser } from "@/lib/api";

export type Permission =
  | "manage:all"
  | "manage:tenant"
  | "manage:users"
  | "manage:roles"
  | "manage:workspaces"
  | "manage:teams"
  | "manage:projects"
  | "manage:tasks"
  | "manage:reports"
  | "manage:ai"
  | "manage:billing"
  | "manage:integrations"
  | "manage:security"
  | "manage:compliance"
  | "read:projects"
  | "read:tasks"
  | "read:reports"
  | "read:ai"
  | "read:audit_logs"
  | "read:security"
  | "read:compliance"
  | "comment:tasks";

export type AccessProfile = {
  isPlatformAdmin: boolean;
  isOwner: boolean;
  isTenantAdmin: boolean;
  isSecurityAdmin: boolean;
  isRoleAdmin: boolean;
  isPeopleAdmin: boolean;
  isProjectAdmin: boolean;
  isReportViewer: boolean;
  isIntegrationAdmin: boolean;
  canViewSiteAdmin: boolean;
  canViewAdmin: boolean;
  canManageTenant: boolean;
  canManageRoles: boolean;
  canManageUsers: boolean;
  canManageSecurity: boolean;
  canViewSecurity: boolean;
  canManageCompliance: boolean;
  canViewCompliance: boolean;
  canManageBilling: boolean;
  canViewBilling: boolean;
  canManageIntegrations: boolean;
  canViewReports: boolean;
  canViewPeopleDirectory: boolean;
  canViewDeveloperConnections: boolean;
};

export function hasPermission(user: AuthUser, permission: string) {
  return user.permissions.includes("manage:all") || user.permissions.includes(permission);
}

export function hasAnyPermission(user: AuthUser, permissions: string[]) {
  return user.permissions.includes("manage:all") || permissions.some((permission) => user.permissions.includes(permission));
}

export function getAccessProfile(user: AuthUser): AccessProfile {
  const isPlatformAdmin = Boolean(user.isPlatformAdmin);
  const isOwner = hasRole(user, "Owner") || user.permissions.includes("manage:all");
  const canManageTenant = hasPermission(user, "manage:tenant");
  const canManageRoles = hasPermission(user, "manage:roles");
  const canManageUsers = hasPermission(user, "manage:users");
  const canManageSecurity = hasPermission(user, "manage:security");
  const canViewSecurity = canManageSecurity || hasPermission(user, "read:security");
  const canManageCompliance = hasPermission(user, "manage:compliance");
  const canViewCompliance = canManageCompliance || hasPermission(user, "read:compliance");
  const canManageBilling = hasPermission(user, "manage:billing") || canManageTenant;
  const canViewBilling = isOwner || canManageBilling;
  const canManageIntegrations = hasPermission(user, "manage:integrations");
  const canViewReports = hasAnyPermission(user, ["read:reports", "manage:reports"]);
  const canViewPeopleDirectory = hasAnyPermission(user, ["manage:users", "manage:teams", "manage:projects"]);
  const canViewDeveloperConnections = canManageIntegrations || canManageSecurity || canManageTenant;

  return {
    isPlatformAdmin,
    isOwner,
    isTenantAdmin: isOwner || canManageTenant,
    isSecurityAdmin: canManageSecurity,
    isRoleAdmin: canManageRoles,
    isPeopleAdmin: canManageUsers,
    isProjectAdmin: hasPermission(user, "manage:projects"),
    isReportViewer: canViewReports,
    isIntegrationAdmin: canManageIntegrations,
    canViewSiteAdmin: isPlatformAdmin,
    canViewAdmin:
      isOwner ||
      canManageTenant ||
      canManageRoles ||
      canManageUsers ||
      canManageSecurity ||
      canViewSecurity ||
      canManageCompliance ||
      canViewCompliance,
    canManageTenant,
    canManageRoles,
    canManageUsers,
    canManageSecurity,
    canViewSecurity,
    canManageCompliance,
    canViewCompliance,
    canManageBilling,
    canViewBilling,
    canManageIntegrations,
    canViewReports,
    canViewPeopleDirectory,
    canViewDeveloperConnections,
  };
}

export function roleLabel(user: AuthUser) {
  if (user.isPlatformAdmin) {
    if (user.platformAdminLevel === "OWNER") return "Site Owner";
    if (user.platformAdminLevel === "ADMIN") return "Site Admin";
    if (user.platformAdminLevel === "SUPPORT") return "Site Support";
    if (user.platformAdminLevel === "AUDITOR") return "Site Auditor";
    return "Site Admin";
  }
  if (user.permissions.includes("manage:all")) return "Owner";
  if (hasRole(user, "Admin") || user.permissions.includes("manage:tenant")) return "Tenant Admin";
  if (user.permissions.includes("manage:security")) return "Security Admin";
  if (user.permissions.includes("manage:projects")) return "Project Admin";
  if (user.permissions.includes("manage:tasks")) return "Delivery Lead";
  if (user.roles[0]) return user.roles[0];
  return "Workspace member";
}

function hasRole(user: AuthUser, role: string) {
  return user.roles.some((item) => item.toLowerCase() === role.toLowerCase());
}
