import type { GlobalSearchResponse } from "../api";
import {
  boundedLimit,
  openApiRequest,
  type OpenApiQuery,
} from "./request";

type GlobalSearchQuery = OpenApiQuery<"/api/v1/search", "get">;

export function globalSearch(token: string, query: GlobalSearchQuery = {}) {
  return openApiRequest<GlobalSearchResponse, "/api/v1/search", "get">("/api/v1/search", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 24),
    },
  });
}
