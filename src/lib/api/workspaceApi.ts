import type { PaginatedResponse, Workspace } from "../api";
import {
  boundedLimit,
  openApiRequest,
  type OpenApiQuery,
} from "./request";

type ListWorkspacesQuery = OpenApiQuery<"/api/v1/workspaces", "get">;

export function listWorkspaces(token: string, query: ListWorkspacesQuery = {}) {
  return openApiRequest<PaginatedResponse<Workspace>, "/api/v1/workspaces", "get">("/api/v1/workspaces", "get", {
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
