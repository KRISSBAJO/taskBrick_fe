import {
apiRequest,
boundedLimit,
openApiRequest,
type OpenApiJsonBody,
type OpenApiQuery,
} from "./request";

type ListTeamsQuery = OpenApiQuery<"/api/v1/teams", "get">;
type CreateTeamPayload = OpenApiJsonBody<"/api/v1/teams", "post">;
type UpdateTeamPayload = OpenApiJsonBody<"/api/v1/teams/{teamId}", "patch">;
type AddTeamMemberPayload = OpenApiJsonBody<"/api/v1/teams/{teamId}/members", "post">;
type InviteTeamMemberPayload = OpenApiJsonBody<"/api/v1/teams/{teamId}/invite", "post">;

export type TeamInviteDeliveryStatus = {
  channel: "email" | "in_app" | "none";
  error?: string;
  message: string;
  provider?: string;
  skipped?: boolean;
  status: "sent" | "skipped" | "failed";
};

export type TeamInviteResult<TMember = unknown> = {
  delivery?: "email" | "in_app" | "none";
  deliveryStatus?: TeamInviteDeliveryStatus;
  member?: TMember;
  success?: boolean;
};

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

export function updateTeam(token: string, teamId: string, payload: UpdateTeamPayload) {
  return openApiRequest("/api/v1/teams/{teamId}", "patch", {
    token,
    pathParams: { teamId },
    body: payload,
  });
}

export function deleteTeam(token: string, teamId: string) {
  return openApiRequest("/api/v1/teams/{teamId}", "delete", {
    token,
    pathParams: { teamId },
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

export function resendTeamMemberInvite(token: string, teamId: string, userId: string) {
  return apiRequest<TeamInviteResult & { success: boolean }>(
    `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}/resend-invite`,
    {
      token,
      method: "POST",
    },
  );
}

export function cancelTeamMemberInvite(token: string, teamId: string, userId: string) {
  return apiRequest<{ success: boolean }>(
    `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}/invite`,
    {
      token,
      method: "DELETE",
    },
  );
}
