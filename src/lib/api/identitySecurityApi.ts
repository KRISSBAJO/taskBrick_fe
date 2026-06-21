import {
openApiRequest,
type OpenApiJsonBody,
} from "./request";

type SetupTotpPayload = OpenApiJsonBody<"/api/v1/identity-security/mfa/totp/setup", "post">;
type EnableTotpPayload = OpenApiJsonBody<"/api/v1/identity-security/mfa/totp/enable", "post">;
type DisableMfaPayload = OpenApiJsonBody<"/api/v1/identity-security/mfa/disable", "post">;
type RegenerateBackupCodesPayload = OpenApiJsonBody<"/api/v1/identity-security/mfa/backup-codes/regenerate", "post">;
type UpsertSsoProviderPayload = OpenApiJsonBody<"/api/v1/identity-security/sso-providers", "post">;
type UpdateTenantLoginPolicyPayload = OpenApiJsonBody<"/api/v1/identity-security/login-policy", "patch">;

export function getIdentitySecurityOverview(token: string) {
  return openApiRequest("/api/v1/identity-security/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function setupTotp(token: string, payload: SetupTotpPayload = {}) {
  return openApiRequest("/api/v1/identity-security/mfa/totp/setup", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function enableTotp(token: string, payload: EnableTotpPayload) {
  return openApiRequest("/api/v1/identity-security/mfa/totp/enable", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function disableMfa(token: string, payload: DisableMfaPayload) {
  return openApiRequest("/api/v1/identity-security/mfa/disable", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function regenerateBackupCodes(token: string, payload: RegenerateBackupCodesPayload) {
  return openApiRequest("/api/v1/identity-security/mfa/backup-codes/regenerate", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function revokeTrustedDevice(token: string, deviceId: string) {
  return openApiRequest("/api/v1/identity-security/trusted-devices/{deviceId}", "delete", {
    token,
    pathParams: { deviceId },
  });
}

export function listSsoProviders(token: string) {
  return openApiRequest("/api/v1/identity-security/sso-providers", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function upsertSsoProvider(token: string, payload: UpsertSsoProviderPayload) {
  return openApiRequest("/api/v1/identity-security/sso-providers", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function updateTenantLoginPolicy(token: string, payload: UpdateTenantLoginPolicyPayload) {
  return openApiRequest("/api/v1/identity-security/login-policy", "patch", {
    token,
    pathParams: {},
    body: payload,
  });
}
