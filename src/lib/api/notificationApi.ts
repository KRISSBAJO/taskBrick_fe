import type {
  Notification,
  NotificationChannel,
  NotificationPreference,
  PaginatedResponse,
} from "../api";
import {
  boundedLimit,
  openApiRequest,
  type OpenApiJsonBody,
  type OpenApiQuery,
} from "./request";

type ListNotificationsQuery = OpenApiQuery<"/api/v1/notifications", "get">;
type UpdateNotificationPreferencesPayload = OpenApiJsonBody<"/api/v1/notification-preferences", "patch">;

export function listNotifications(token: string, query: ListNotificationsQuery = {}) {
  return openApiRequest<PaginatedResponse<Notification>, "/api/v1/notifications", "get">("/api/v1/notifications", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 50),
    },
  });
}

export function getUnreadNotificationCount(token: string) {
  return openApiRequest<{ total: number }, "/api/v1/notifications/unread-count", "get">("/api/v1/notifications/unread-count", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function markNotificationRead(token: string, notificationId: string) {
  return openApiRequest<Notification, "/api/v1/notifications/{notificationId}/read", "patch">("/api/v1/notifications/{notificationId}/read", "patch", {
    token,
    pathParams: { notificationId },
  });
}

export function markNotificationUnread(token: string, notificationId: string) {
  return openApiRequest<Notification, "/api/v1/notifications/{notificationId}/unread", "patch">("/api/v1/notifications/{notificationId}/unread", "patch", {
    token,
    pathParams: { notificationId },
  });
}

export function markAllNotificationsRead(token: string) {
  return openApiRequest<{ success: boolean; updated: number }, "/api/v1/notifications/read-all", "patch">("/api/v1/notifications/read-all", "patch", {
    token,
    pathParams: {},
  });
}

export function deleteNotification(token: string, notificationId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/notifications/{notificationId}", "delete">("/api/v1/notifications/{notificationId}", "delete", {
    token,
    pathParams: { notificationId },
  });
}

export function deleteReadNotifications(token: string) {
  return openApiRequest<{ success: boolean; deleted: number }, "/api/v1/notifications/read", "delete">("/api/v1/notifications/read", "delete", {
    token,
    pathParams: {},
  });
}

export function listNotificationPreferences(token: string) {
  return openApiRequest<NotificationPreference[], "/api/v1/notification-preferences", "get">("/api/v1/notification-preferences", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function updateNotificationPreferences(
  token: string,
  preferences: Array<{ channel: NotificationChannel; enabled: boolean }>,
) {
  const body: UpdateNotificationPreferencesPayload = { preferences };
  return openApiRequest<NotificationPreference[], "/api/v1/notification-preferences", "patch">("/api/v1/notification-preferences", "patch", {
    token,
    pathParams: {},
    body,
  });
}
