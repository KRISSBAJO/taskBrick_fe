import type {
  Conversation,
  ConversationMember,
  Message,
  MessageAttachment,
  MessageReaction,
  MessageReadReceipt,
  PaginatedResponse,
} from "../api";
import { boundedLimit, openApiRequest, type OpenApiJsonBody, type OpenApiQuery } from "./request";

type ListConversationsQuery = OpenApiQuery<"/api/v1/conversations", "get">;
type CreateConversationPayload = OpenApiJsonBody<"/api/v1/conversations", "post">;
type UpdateConversationPayload = OpenApiJsonBody<"/api/v1/conversations/{conversationId}", "patch">;
type ListMessagesQuery = OpenApiQuery<"/api/v1/conversations/{conversationId}/messages", "get">;
type SendMessagePayload = {
  body?: string;
  attachments?: MessageAttachment[] | unknown[];
  parentMessageId?: string;
  forwardedFromMessageId?: string;
  metadata?: unknown;
};
type ForwardMessagePayload = {
  conversationIds: string[];
  body?: string;
  includeAttachments?: boolean;
  metadata?: unknown;
};

export function listConversations(
  token: string,
  query: { page?: number; limit?: number; search?: string; isGroup?: boolean } = {},
) {
  return openApiRequest<PaginatedResponse<Conversation>, "/api/v1/conversations", "get">("/api/v1/conversations", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: query.limit ?? 50,
    } as ListConversationsQuery,
  });
}

export function createConversation(token: string, payload: CreateConversationPayload) {
  return openApiRequest<Conversation, "/api/v1/conversations", "post">("/api/v1/conversations", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function getConversation(token: string, conversationId: string) {
  return openApiRequest<Conversation, "/api/v1/conversations/{conversationId}", "get">("/api/v1/conversations/{conversationId}", "get", {
    token,
    cache: "no-store",
    pathParams: { conversationId },
  });
}

export function updateConversation(token: string, conversationId: string, payload: UpdateConversationPayload) {
  return openApiRequest<Conversation, "/api/v1/conversations/{conversationId}", "patch">("/api/v1/conversations/{conversationId}", "patch", {
    token,
    pathParams: { conversationId },
    body: payload,
  });
}

export function deleteConversation(token: string, conversationId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/conversations/{conversationId}", "delete">("/api/v1/conversations/{conversationId}", "delete", {
    token,
    pathParams: { conversationId },
  });
}

export function listConversationMembers(token: string, conversationId: string) {
  return openApiRequest<ConversationMember[], "/api/v1/conversations/{conversationId}/members", "get">("/api/v1/conversations/{conversationId}/members", "get", {
    token,
    cache: "no-store",
    pathParams: { conversationId },
  });
}

export function addConversationMember(token: string, conversationId: string, userId: string) {
  return openApiRequest<ConversationMember[], "/api/v1/conversations/{conversationId}/members", "post">("/api/v1/conversations/{conversationId}/members", "post", {
    token,
    pathParams: { conversationId },
    body: { userId } as unknown as OpenApiJsonBody<"/api/v1/conversations/{conversationId}/members", "post">,
  });
}

export function removeConversationMember(token: string, conversationId: string, userId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/conversations/{conversationId}/members/{userId}", "delete">("/api/v1/conversations/{conversationId}/members/{userId}", "delete", {
    token,
    pathParams: { conversationId, userId },
  });
}

export function listMessages(
  token: string,
  conversationId: string,
  query: { page?: number; limit?: number; search?: string } = {},
) {
  return openApiRequest<PaginatedResponse<Message>, "/api/v1/conversations/{conversationId}/messages", "get">("/api/v1/conversations/{conversationId}/messages", "get", {
    token,
    cache: "no-store",
    pathParams: { conversationId },
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 100),
    } as ListMessagesQuery,
  });
}

export function sendMessage(token: string, conversationId: string, payload: SendMessagePayload) {
  return openApiRequest<Message, "/api/v1/conversations/{conversationId}/messages", "post">("/api/v1/conversations/{conversationId}/messages", "post", {
    token,
    pathParams: { conversationId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/conversations/{conversationId}/messages", "post">,
  });
}

export function updateMessage(token: string, messageId: string, payload: { body: string }) {
  return openApiRequest<Message, "/api/v1/messages/{messageId}", "patch">("/api/v1/messages/{messageId}", "patch", {
    token,
    pathParams: { messageId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/messages/{messageId}", "patch">,
  });
}

export function deleteMessage(token: string, messageId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/messages/{messageId}", "delete">("/api/v1/messages/{messageId}", "delete", {
    token,
    pathParams: { messageId },
  });
}

export function listPinnedMessages(token: string, conversationId: string) {
  return openApiRequest<Message[], "/api/v1/conversations/{conversationId}/messages/pinned", "get">("/api/v1/conversations/{conversationId}/messages/pinned", "get", {
    token,
    cache: "no-store",
    pathParams: { conversationId },
  });
}

export function pinMessage(token: string, messageId: string) {
  return openApiRequest<Message, "/api/v1/messages/{messageId}/pin", "post">("/api/v1/messages/{messageId}/pin", "post", {
    token,
    pathParams: { messageId },
  });
}

export function unpinMessage(token: string, messageId: string) {
  return openApiRequest<Message, "/api/v1/messages/{messageId}/unpin", "post">("/api/v1/messages/{messageId}/unpin", "post", {
    token,
    pathParams: { messageId },
  });
}

export function forwardMessage(token: string, messageId: string, payload: ForwardMessagePayload) {
  return openApiRequest<{ data: Message[]; forwarded: number }, "/api/v1/messages/{messageId}/forward", "post">("/api/v1/messages/{messageId}/forward", "post", {
    token,
    pathParams: { messageId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/messages/{messageId}/forward", "post">,
  });
}

export function addMessageReaction(token: string, messageId: string, emoji: string) {
  return openApiRequest<MessageReaction, "/api/v1/messages/{messageId}/reactions", "post">("/api/v1/messages/{messageId}/reactions", "post", {
    token,
    pathParams: { messageId },
    body: { emoji } as unknown as OpenApiJsonBody<"/api/v1/messages/{messageId}/reactions", "post">,
  });
}

export function removeMessageReaction(token: string, messageId: string, emoji: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/messages/{messageId}/reactions/{emoji}", "delete">("/api/v1/messages/{messageId}/reactions/{emoji}", "delete", {
    token,
    pathParams: { messageId, emoji },
  });
}

export function listMessageReadReceipts(token: string, messageId: string) {
  return openApiRequest<MessageReadReceipt[], "/api/v1/messages/{messageId}/read-receipts", "get">("/api/v1/messages/{messageId}/read-receipts", "get", {
    token,
    cache: "no-store",
    pathParams: { messageId },
  });
}

export function markMessageRead(token: string, messageId: string) {
  return openApiRequest<MessageReadReceipt, "/api/v1/messages/{messageId}/read-receipts", "post">("/api/v1/messages/{messageId}/read-receipts", "post", {
    token,
    pathParams: { messageId },
  });
}
