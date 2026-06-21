import type { Tenant } from "../api";
import {
  openApiRequest,
  type OpenApiJsonBody,
} from "./request";

type UpdateCurrentTenantPayload = OpenApiJsonBody<"/api/v1/tenants/current", "patch">;

export function getCurrentTenant(token: string) {
  return openApiRequest<Tenant, "/api/v1/tenants/current", "get">("/api/v1/tenants/current", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function updateCurrentTenant(token: string, payload: UpdateCurrentTenantPayload) {
  return openApiRequest<Tenant, "/api/v1/tenants/current", "patch">("/api/v1/tenants/current", "patch", {
    token,
    pathParams: {},
    body: payload,
  });
}
