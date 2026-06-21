import type { AiAgent, AiSettings, PaginatedResponse } from "../api";
import { boundedLimit, openApiRequest, type OpenApiJsonBody, type OpenApiQuery } from "./request";

type AiSettingsPayload = Partial<Pick<
  AiSettings,
  | "enabled"
  | "defaultProvider"
  | "defaultModel"
  | "allowedProviders"
  | "monthlyTokenLimit"
  | "monthlyCostLimit"
  | "redactSensitiveData"
  | "dataRetentionDays"
>> & { policy?: unknown };
type CreateAiAgentPayload = {
  name: string;
  description?: string;
  type?: string;
  provider?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  tools?: string[];
  guardrails?: unknown;
  knowledgeScope?: unknown;
  enabled?: boolean;
};
type UpdateAiAgentPayload = Partial<Pick<
  AiAgent,
  | "name"
  | "description"
  | "type"
  | "provider"
  | "model"
  | "systemPrompt"
  | "temperature"
  | "maxOutputTokens"
  | "tools"
  | "guardrails"
  | "knowledgeScope"
  | "enabled"
>>;

export function getAiSettings(token: string) {
  return openApiRequest<AiSettings, "/api/v1/ai/settings", "get">("/api/v1/ai/settings", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function updateAiSettings(token: string, payload: AiSettingsPayload) {
  return openApiRequest<AiSettings, "/api/v1/ai/settings", "patch">("/api/v1/ai/settings", "patch", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/ai/settings", "patch">,
  });
}

export function listAiAgents(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    provider?: string;
    type?: string;
    enabled?: boolean;
    includeArchived?: boolean;
  } = {},
) {
  return openApiRequest<PaginatedResponse<AiAgent>, "/api/v1/ai/agents", "get">("/api/v1/ai/agents", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 100),
    } as OpenApiQuery<"/api/v1/ai/agents", "get">,
  });
}

export function createAiAgent(token: string, payload: CreateAiAgentPayload) {
  return openApiRequest<AiAgent, "/api/v1/ai/agents", "post">("/api/v1/ai/agents", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/ai/agents", "post">,
  });
}

export function updateAiAgent(token: string, agentId: string, payload: UpdateAiAgentPayload) {
  return openApiRequest<AiAgent, "/api/v1/ai/agents/{agentId}", "patch">("/api/v1/ai/agents/{agentId}", "patch", {
    token,
    pathParams: { agentId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/ai/agents/{agentId}", "patch">,
  });
}

export function archiveAiAgent(token: string, agentId: string) {
  return openApiRequest<AiAgent, "/api/v1/ai/agents/{agentId}/archive", "post">("/api/v1/ai/agents/{agentId}/archive", "post", {
    token,
    pathParams: { agentId },
  });
}

export function restoreAiAgent(token: string, agentId: string) {
  return openApiRequest<AiAgent, "/api/v1/ai/agents/{agentId}/restore", "post">("/api/v1/ai/agents/{agentId}/restore", "post", {
    token,
    pathParams: { agentId },
  });
}

export function deleteAiAgent(token: string, agentId: string) {
  return openApiRequest<{ success: boolean } | AiAgent, "/api/v1/ai/agents/{agentId}", "delete">("/api/v1/ai/agents/{agentId}", "delete", {
    token,
    pathParams: { agentId },
  });
}
