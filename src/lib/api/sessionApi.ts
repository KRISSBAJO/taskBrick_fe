import {
boundedLimit,
openApiRequest,
type OpenApiQuery,
} from "./request";

type ListSessionsQuery = OpenApiQuery<"/api/v1/admin/sessions", "get">;

export function listSessions(token: string, query: ListSessionsQuery = {}) {
  return openApiRequest("/api/v1/admin/sessions", "get", {
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
  return openApiRequest("/api/v1/admin/sessions/{sessionId}/revoke", "post", {
    token,
    pathParams: { sessionId },
  });
}

export function revokeUserSessions(token: string, userId: string) {
  return openApiRequest("/api/v1/admin/users/{userId}/sessions/revoke", "post", {
    token,
    pathParams: { userId },
  });
}
