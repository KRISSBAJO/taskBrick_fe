import type { ModuleStatus, ReadinessResponse } from "../api";
import { apiRequest, openApiRequest } from "./request";

export function healthReady() {
  return openApiRequest<ReadinessResponse, "/api/v1/health/ready", "get">("/api/v1/health/ready", "get", {
    cache: "no-store",
    pathParams: {},
  });
}

export function moduleStatus(path: string) {
  return apiRequest<ModuleStatus>(path, { cache: "no-store" });
}
