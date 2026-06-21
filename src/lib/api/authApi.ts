import {
openApiRequest,
type OpenApiJsonBody,
type OpenApiQuery
} from "./request";

type LoginPayload = OpenApiJsonBody<"/api/v1/auth/login", "post">;
type VerifyMfaLoginPayload = OpenApiJsonBody<"/api/v1/auth/mfa/verify-login", "post">;
type RegisterPayload = OpenApiJsonBody<"/api/v1/auth/register", "post">;
type VerifyEmailPayload = OpenApiJsonBody<"/api/v1/auth/verify-email", "post">;
type ResendVerificationPayload = OpenApiJsonBody<"/api/v1/auth/resend-verification", "post">;
type AcceptInvitePayload = OpenApiJsonBody<"/api/v1/auth/accept-invite", "post">;
type ForgotPasswordPayload = OpenApiJsonBody<"/api/v1/auth/forgot-password", "post">;
type ResetPasswordPayload = OpenApiJsonBody<"/api/v1/auth/reset-password", "post">;
type ChangePasswordPayload = OpenApiJsonBody<"/api/v1/auth/change-password", "post">;
type SsoDiscoveryQuery = OpenApiQuery<"/api/v1/auth/sso/discovery", "get">;
type SsoStartQuery = OpenApiQuery<"/api/v1/auth/sso/start", "get">;
type SsoCallbackPayload = OpenApiJsonBody<"/api/v1/auth/sso/callback", "post">;

export function login(payload: LoginPayload) {
  return openApiRequest("/api/v1/auth/login", "post", {
    pathParams: {},
    body: payload,
  });
}

export function verifyMfaLogin(payload: VerifyMfaLoginPayload) {
  return openApiRequest("/api/v1/auth/mfa/verify-login", "post", {
    pathParams: {},
    body: payload,
  });
}

export function register(payload: RegisterPayload) {
  return openApiRequest("/api/v1/auth/register", "post", {
    pathParams: {},
    body: payload,
  });
}

export function verifyEmail(payload: VerifyEmailPayload) {
  return openApiRequest("/api/v1/auth/verify-email", "post", {
    pathParams: {},
    body: payload,
  });
}

export function resendVerification(payload: ResendVerificationPayload) {
  return openApiRequest("/api/v1/auth/resend-verification", "post", {
    pathParams: {},
    body: payload,
  });
}

export function acceptInvite(payload: AcceptInvitePayload) {
  return openApiRequest("/api/v1/auth/accept-invite", "post", {
    pathParams: {},
    body: payload,
  });
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return openApiRequest("/api/v1/auth/forgot-password", "post", {
    pathParams: {},
    body: payload,
  });
}

export function resetPassword(payload: ResetPasswordPayload) {
  return openApiRequest("/api/v1/auth/reset-password", "post", {
    pathParams: {},
    body: payload,
  });
}

export function changePassword(token: string, payload: ChangePasswordPayload) {
  return openApiRequest("/api/v1/auth/change-password", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function refreshSession() {
  return openApiRequest("/api/v1/auth/refresh", "post", {
    pathParams: {},
    skipAuthRefresh: true,
  });
}

export function logoutSession(token?: string) {
  return openApiRequest("/api/v1/auth/logout", "post", {
    token,
    pathParams: {},
    skipAuthRefresh: true,
  });
}

export function getMe(token: string) {
  return openApiRequest("/api/v1/auth/me", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function discoverSso(query: SsoDiscoveryQuery = {}) {
  return openApiRequest("/api/v1/auth/sso/discovery", "get", {
    cache: "no-store",
    pathParams: {},
    query,
  });
}

export function startSso(query: SsoStartQuery) {
  return openApiRequest("/api/v1/auth/sso/start", "get", {
    cache: "no-store",
    pathParams: {},
    query,
  });
}

export function completeSso(payload: SsoCallbackPayload) {
  return openApiRequest("/api/v1/auth/sso/callback", "post", {
    pathParams: {},
    body: payload,
  });
}
