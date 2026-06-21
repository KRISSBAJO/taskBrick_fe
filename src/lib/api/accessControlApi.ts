import type { Permission, Role } from "../api";
import {
  openApiRequest,
  type OpenApiJsonBody,
} from "./request";

type CreateRolePayload = OpenApiJsonBody<"/api/v1/roles", "post">;
type UpdateRolePayload = OpenApiJsonBody<"/api/v1/roles/{roleId}", "patch">;
type AssignRolePayload = OpenApiJsonBody<"/api/v1/roles/assignments", "post">;

export function listRoles(token: string) {
  return openApiRequest<Role[], "/api/v1/roles", "get">("/api/v1/roles", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listPermissions(token: string) {
  return openApiRequest<Permission[], "/api/v1/permissions", "get">("/api/v1/permissions", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function createRole(token: string, payload: CreateRolePayload) {
  return openApiRequest<Role, "/api/v1/roles", "post">("/api/v1/roles", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function updateRole(token: string, roleId: string, payload: UpdateRolePayload) {
  return openApiRequest<Role, "/api/v1/roles/{roleId}", "patch">("/api/v1/roles/{roleId}", "patch", {
    token,
    pathParams: { roleId },
    body: payload,
  });
}

export function deleteRole(token: string, roleId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/roles/{roleId}", "delete">("/api/v1/roles/{roleId}", "delete", {
    token,
    pathParams: { roleId },
  });
}

export function assignRole(token: string, payload: AssignRolePayload) {
  return openApiRequest<{ success: boolean }, "/api/v1/roles/assignments", "post">("/api/v1/roles/assignments", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function removeRoleFromUser(token: string, roleId: string, userId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/roles/{roleId}/users/{userId}", "delete">("/api/v1/roles/{roleId}/users/{userId}", "delete", {
    token,
    pathParams: { roleId, userId },
  });
}
