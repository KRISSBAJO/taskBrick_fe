import type { AuthSession, PaginatedResponse } from "../api";
import {
  boundedLimit,
  openApiRequest,
  type OpenApiQuery,
} from "./request";

type ListSessionsQuery = OpenApiQuery<"/api/v1/admin/sessions", "get">;

export function listSessions(token: string, query: ListSessionsQuery = {}) {
  return openApiRequest<PaginatedResponse<AuthSession>, "/api/v1/admin/sessions", "get">("/api/v1/admin/sessions", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 50),
    },
  });
}

export function revokeSession(token: string, sessionId: string) {
  return openApiRequest<AuthSession, "/api/v1/admin/sessions/{sessionId}/revoke", "post">("/api/v1/admin/sessions/{sessionId}/revoke", "post", {
    token,
    pathParams: { sessionId },
  });
}

export function revokeUserSessions(token: string, userId: string) {
  return openApiRequest<{ success: boolean; revokedSessions: number }, "/api/v1/admin/users/{userId}/sessions/revoke", "post">("/api/v1/admin/users/{userId}/sessions/revoke", "post", {
    token,
    pathParams: { userId },
  });
}
