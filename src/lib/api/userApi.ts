import {
  apiRequest,
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
  return openApiRequest("/api/v1/users/me/profile", "patch", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function inviteTenantUser(token: string, payload: InviteTenantUserPayload) {
  return openApiRequest("/api/v1/users/invite", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function bulkInviteTenantUsers(token: string, payload: BulkInviteTenantUsersPayload) {
  return openApiRequest("/api/v1/users/bulk-invite", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function resendTenantUserInvite(token: string, userId: string) {
  return apiRequest(`/users/${encodeURIComponent(userId)}/resend-invite`, {
    method: "POST",
    token,
  });
}

export function reinviteTenantUser(token: string, userId: string) {
  return apiRequest(`/users/${encodeURIComponent(userId)}/reinvite`, {
    method: "POST",
    token,
  });
}

export function cancelTenantUserInvite(token: string, userId: string) {
  return apiRequest(`/users/${encodeURIComponent(userId)}/invite`, {
    method: "DELETE",
    token,
  });
}

export function listUsers(token: string, query: ListUsersQuery = {}) {
  return openApiRequest("/api/v1/users", "get", {
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
