import type {
InternalMailFolder,
InternalMailPriority
} from "../api";
import {
boundedLimit,
openApiRequest,
type OpenApiJsonBody,
type OpenApiQuery,
} from "./request";

type SearchInternalMailboxesQuery = OpenApiQuery<"/api/v1/internal-mail/mailboxes", "get">;
type CreateInternalMailboxPayload = OpenApiJsonBody<"/api/v1/internal-mail/mailboxes", "post">;
type UpdateInternalMailboxPayload = OpenApiJsonBody<"/api/v1/internal-mail/mailboxes/{mailboxId}", "patch">;
type CreateInternalMailboxAliasPayload = OpenApiJsonBody<"/api/v1/internal-mail/mailboxes/{mailboxId}/aliases", "post">;
type UpsertInternalMailboxMemberPayload = OpenApiJsonBody<"/api/v1/internal-mail/mailboxes/{mailboxId}/members", "post">;
type ListInternalMailThreadsQuery = OpenApiQuery<"/api/v1/internal-mail/threads", "get">;
type GetInternalMailThreadQuery = OpenApiQuery<"/api/v1/internal-mail/threads/{threadId}", "get">;
type CreateInternalMailThreadPayload = OpenApiJsonBody<"/api/v1/internal-mail/threads", "post">;
type ReplyInternalMailThreadPayload = OpenApiJsonBody<"/api/v1/internal-mail/threads/{threadId}/reply", "post">;
type InternalMailThreadPayload = {
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  toIds?: string[];
  toAddresses?: string[];
  ccIds?: string[];
  ccAddresses?: string[];
  bccIds?: string[];
  bccAddresses?: string[];
  priority?: InternalMailPriority;
  attachments?: Record<string, unknown>;
  saveAsDraft?: boolean;
};
type InternalMailReplyPayload = Omit<InternalMailThreadPayload, "saveAsDraft" | "subject">;

export function getInternalMailFolders(token: string) {
  return openApiRequest("/api/v1/internal-mail/folders", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function searchInternalMailboxes(token: string, query: SearchInternalMailboxesQuery = {}) {
  return openApiRequest("/api/v1/internal-mail/mailboxes", "get", {
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

export function createInternalMailbox(token: string, payload: CreateInternalMailboxPayload) {
  return openApiRequest("/api/v1/internal-mail/mailboxes", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function updateInternalMailbox(token: string, mailboxId: string, payload: UpdateInternalMailboxPayload) {
  return openApiRequest("/api/v1/internal-mail/mailboxes/{mailboxId}", "patch", {
    token,
    pathParams: { mailboxId },
    body: payload,
  });
}

export function createInternalMailboxAlias(token: string, mailboxId: string, payload: CreateInternalMailboxAliasPayload) {
  return openApiRequest("/api/v1/internal-mail/mailboxes/{mailboxId}/aliases", "post", {
    token,
    pathParams: { mailboxId },
    body: payload,
  });
}

export function upsertInternalMailboxMember(token: string, mailboxId: string, payload: UpsertInternalMailboxMemberPayload) {
  return openApiRequest("/api/v1/internal-mail/mailboxes/{mailboxId}/members", "post", {
    token,
    pathParams: { mailboxId },
    body: payload,
  });
}

export function removeInternalMailboxMember(token: string, mailboxId: string, userId: string) {
  return openApiRequest("/api/v1/internal-mail/mailboxes/{mailboxId}/members/{userId}", "delete", {
    token,
    pathParams: { mailboxId, userId },
  });
}

export function listInternalMailThreads(token: string, query: ListInternalMailThreadsQuery = {}) {
  return openApiRequest("/api/v1/internal-mail/threads", "get", {
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

export function getInternalMailThread(token: string, threadId: string, query: { markRead?: boolean } = {}) {
  const openApiQuery = query.markRead === undefined
    ? undefined
    : ({ markRead: String(query.markRead) } as GetInternalMailThreadQuery);

  return openApiRequest("/api/v1/internal-mail/threads/{threadId}", "get", {
    token,
    cache: "no-store",
    pathParams: { threadId },
    query: openApiQuery,
  });
}

export function createInternalMailThread(token: string, payload: InternalMailThreadPayload) {
  return openApiRequest("/api/v1/internal-mail/threads", "post", {
    token,
    pathParams: {},
    body: payload as CreateInternalMailThreadPayload,
  });
}

export function replyInternalMailThread(token: string, threadId: string, payload: InternalMailReplyPayload) {
  return openApiRequest("/api/v1/internal-mail/threads/{threadId}/reply", "post", {
    token,
    pathParams: { threadId },
    body: payload as ReplyInternalMailThreadPayload,
  });
}

export function markInternalMailRead(token: string, threadId: string) {
  return openApiRequest("/api/v1/internal-mail/threads/{threadId}/read", "patch", {
    token,
    pathParams: { threadId },
  });
}

export function markInternalMailUnread(token: string, threadId: string) {
  return openApiRequest("/api/v1/internal-mail/threads/{threadId}/unread", "patch", {
    token,
    pathParams: { threadId },
  });
}

export function setInternalMailStar(token: string, threadId: string, value: boolean) {
  return openApiRequest("/api/v1/internal-mail/threads/{threadId}/star", "patch", {
    token,
    pathParams: { threadId },
    body: { value },
  });
}

export function setInternalMailFlag(token: string, threadId: string, value: boolean) {
  return openApiRequest("/api/v1/internal-mail/threads/{threadId}/flag", "patch", {
    token,
    pathParams: { threadId },
    body: { value },
  });
}

export function setInternalMailPin(token: string, threadId: string, value: boolean) {
  return openApiRequest("/api/v1/internal-mail/threads/{threadId}/pin", "patch", {
    token,
    pathParams: { threadId },
    body: { value },
  });
}

export function snoozeInternalMailThread(token: string, threadId: string, snoozedUntil?: string) {
  return openApiRequest("/api/v1/internal-mail/threads/{threadId}/snooze", "patch", {
    token,
    pathParams: { threadId },
    body: { snoozedUntil },
  });
}

export function moveInternalMailThread(token: string, threadId: string, folder: InternalMailFolder) {
  return openApiRequest("/api/v1/internal-mail/threads/{threadId}/move", "patch", {
    token,
    pathParams: { threadId },
    body: { folder },
  });
}

export function archiveInternalMailThread(token: string, threadId: string) {
  return openApiRequest("/api/v1/internal-mail/threads/{threadId}/archive", "patch", {
    token,
    pathParams: { threadId },
  });
}

export function restoreInternalMailThread(token: string, threadId: string) {
  return openApiRequest("/api/v1/internal-mail/threads/{threadId}/restore", "patch", {
    token,
    pathParams: { threadId },
  });
}

export function deleteInternalMailThread(token: string, threadId: string) {
  return openApiRequest("/api/v1/internal-mail/threads/{threadId}", "delete", {
    token,
    pathParams: { threadId },
  });
}
