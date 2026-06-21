import type { ModuleStatus } from "../api";
import { apiRequest,openApiRequest } from "./request";

export function healthReady() {
  return openApiRequest("/api/v1/health/ready", "get", {
    cache: "no-store",
    pathParams: {},
  });
}

export function moduleStatus(path: string) {
  return apiRequest<ModuleStatus>(path, { cache: "no-store" });
}
