import {
boundedLimit,
openApiRequest,
type OpenApiQuery,
} from "./request";

type GlobalSearchQuery = OpenApiQuery<"/api/v1/search", "get">;

export function globalSearch(token: string, query: GlobalSearchQuery = {}) {
  return openApiRequest("/api/v1/search", "get", {
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
