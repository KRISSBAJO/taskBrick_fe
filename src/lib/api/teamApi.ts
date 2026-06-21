import {
boundedLimit,
openApiRequest,
type OpenApiJsonBody,
type OpenApiQuery,
} from "./request";

type ListTeamsQuery = OpenApiQuery<"/api/v1/teams", "get">;
type CreateTeamPayload = OpenApiJsonBody<"/api/v1/teams", "post">;
type AddTeamMemberPayload = OpenApiJsonBody<"/api/v1/teams/{teamId}/members", "post">;
type InviteTeamMemberPayload = OpenApiJsonBody<"/api/v1/teams/{teamId}/invite", "post">;

export function listTeams(token: string, query: ListTeamsQuery = {}) {
  return openApiRequest("/api/v1/teams", "get", {
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

export function createTeam(token: string, payload: CreateTeamPayload) {
  return openApiRequest("/api/v1/teams", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function listTeamMembers(token: string, teamId: string) {
  return openApiRequest("/api/v1/teams/{teamId}/members", "get", {
    token,
    cache: "no-store",
    pathParams: { teamId },
  });
}

export function addTeamMember(token: string, teamId: string, payload: AddTeamMemberPayload) {
  return openApiRequest("/api/v1/teams/{teamId}/members", "post", {
    token,
    pathParams: { teamId },
    body: payload,
  });
}

export function updateTeamMemberRole(token: string, teamId: string, userId: string, role?: string) {
  return openApiRequest("/api/v1/teams/{teamId}/members", "post", {
    token,
    pathParams: { teamId },
    body: { userId, role },
  });
}

export function removeTeamMember(token: string, teamId: string, userId: string) {
  return openApiRequest("/api/v1/teams/{teamId}/members/{userId}", "delete", {
    token,
    pathParams: { teamId, userId },
  });
}

export function inviteTeamMember(token: string, teamId: string, payload: InviteTeamMemberPayload) {
  return openApiRequest("/api/v1/teams/{teamId}/invite", "post", {
    token,
    pathParams: { teamId },
    body: payload,
  });
}
