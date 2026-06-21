import type { BulkInviteUsersResponse, PaginatedResponse, TenantUser } from "../api";
import {
  boundedLimit,
  openApiRequest,
  type OpenApiJsonBody,
  type OpenApiQuery,
} from "./request";

type UpdateMyProfilePayload = OpenApiJsonBody<"/api/v1/users/me/profile", "patch">;
type InviteTenantUserPayload = OpenApiJsonBody<"/api/v1/users/invite", "post">;
type BulkInviteTenantUsersPayload = OpenApiJsonBody<"/api/v1/users/bulk-invite", "post">;
type ListUsersQuery = OpenApiQuery<"/api/v1/users", "get">;

export function updateMyProfile(token: string, payload: UpdateMyProfilePayload) {
  return openApiRequest<TenantUser, "/api/v1/users/me/profile", "patch">("/api/v1/users/me/profile", "patch", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function inviteTenantUser(token: string, payload: InviteTenantUserPayload) {
  return openApiRequest<TenantUser, "/api/v1/users/invite", "post">("/api/v1/users/invite", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function bulkInviteTenantUsers(token: string, payload: BulkInviteTenantUsersPayload) {
  return openApiRequest<BulkInviteUsersResponse, "/api/v1/users/bulk-invite", "post">("/api/v1/users/bulk-invite", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function listUsers(token: string, query: ListUsersQuery = {}) {
  return openApiRequest<PaginatedResponse<TenantUser>, "/api/v1/users", "get">("/api/v1/users", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 100),
    },
  });
}
