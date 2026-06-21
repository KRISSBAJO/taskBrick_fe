import type {
  DocumentFolder,
  DocumentVersion,
  PaginatedResponse,
  WorkspaceDocument,
} from "../api";
import {
  boundedLimit,
  openApiRequest,
  type OpenApiJsonBody,
  type OpenApiQuery,
} from "./request";

type ListDocumentFoldersQuery = OpenApiQuery<"/api/v1/document-folders", "get">;
type DocumentFolderTreeQuery = OpenApiQuery<"/api/v1/document-folders/tree", "get">;
type CreateDocumentFolderPayload = OpenApiJsonBody<"/api/v1/document-folders", "post">;
type UpdateDocumentFolderPayload = OpenApiJsonBody<"/api/v1/document-folders/{folderId}", "patch">;
type ListDocumentsQuery = OpenApiQuery<"/api/v1/documents", "get">;
type CreateDocumentPayload = OpenApiJsonBody<"/api/v1/documents", "post">;
type UpdateDocumentPayload = OpenApiJsonBody<"/api/v1/documents/{documentId}", "patch">;
type RestoreDocumentVersionPayload = OpenApiJsonBody<"/api/v1/documents/{documentId}/versions/{version}/restore", "post">;

export function listDocumentFolders(token: string, query: ListDocumentFoldersQuery = {}) {
  return openApiRequest<PaginatedResponse<DocumentFolder>, "/api/v1/document-folders", "get">("/api/v1/document-folders", "get", {
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

export function getDocumentFolderTree(token: string, query: { includeArchived?: boolean } = {}) {
  const openApiQuery = query.includeArchived === undefined
    ? undefined
    : ({ includeArchived: String(query.includeArchived) } as DocumentFolderTreeQuery);

  return openApiRequest<DocumentFolder[], "/api/v1/document-folders/tree", "get">("/api/v1/document-folders/tree", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: openApiQuery,
  });
}

export function createDocumentFolder(token: string, payload: CreateDocumentFolderPayload) {
  return openApiRequest<DocumentFolder, "/api/v1/document-folders", "post">("/api/v1/document-folders", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function updateDocumentFolder(token: string, folderId: string, payload: UpdateDocumentFolderPayload) {
  return openApiRequest<DocumentFolder, "/api/v1/document-folders/{folderId}", "patch">("/api/v1/document-folders/{folderId}", "patch", {
    token,
    pathParams: { folderId },
    body: payload,
  });
}

export function archiveDocumentFolder(token: string, folderId: string) {
  return openApiRequest<DocumentFolder, "/api/v1/document-folders/{folderId}/archive", "post">("/api/v1/document-folders/{folderId}/archive", "post", {
    token,
    pathParams: { folderId },
  });
}

export function restoreDocumentFolder(token: string, folderId: string) {
  return openApiRequest<DocumentFolder, "/api/v1/document-folders/{folderId}/restore", "post">("/api/v1/document-folders/{folderId}/restore", "post", {
    token,
    pathParams: { folderId },
  });
}

export function deleteDocumentFolder(token: string, folderId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/document-folders/{folderId}", "delete">("/api/v1/document-folders/{folderId}", "delete", {
    token,
    pathParams: { folderId },
  });
}

export function listDocuments(token: string, query: ListDocumentsQuery = {}) {
  return openApiRequest<PaginatedResponse<WorkspaceDocument>, "/api/v1/documents", "get">("/api/v1/documents", "get", {
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

export function createDocument(token: string, payload: CreateDocumentPayload) {
  return openApiRequest<WorkspaceDocument, "/api/v1/documents", "post">("/api/v1/documents", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function getDocument(token: string, documentId: string) {
  return openApiRequest<WorkspaceDocument, "/api/v1/documents/{documentId}", "get">("/api/v1/documents/{documentId}", "get", {
    token,
    cache: "no-store",
    pathParams: { documentId },
  });
}

export function updateDocument(token: string, documentId: string, payload: UpdateDocumentPayload) {
  return openApiRequest<WorkspaceDocument, "/api/v1/documents/{documentId}", "patch">("/api/v1/documents/{documentId}", "patch", {
    token,
    pathParams: { documentId },
    body: payload,
  });
}

export function publishDocument(token: string, documentId: string) {
  return openApiRequest<WorkspaceDocument, "/api/v1/documents/{documentId}/publish", "post">("/api/v1/documents/{documentId}/publish", "post", {
    token,
    pathParams: { documentId },
  });
}

export function archiveDocument(token: string, documentId: string) {
  return openApiRequest<WorkspaceDocument, "/api/v1/documents/{documentId}/archive", "post">("/api/v1/documents/{documentId}/archive", "post", {
    token,
    pathParams: { documentId },
  });
}

export function restoreDocument(token: string, documentId: string) {
  return openApiRequest<WorkspaceDocument, "/api/v1/documents/{documentId}/restore", "post">("/api/v1/documents/{documentId}/restore", "post", {
    token,
    pathParams: { documentId },
  });
}

export function hardDeleteDocument(token: string, documentId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/documents/{documentId}/hard-delete", "delete">("/api/v1/documents/{documentId}/hard-delete", "delete", {
    token,
    pathParams: { documentId },
  });
}

export function listDocumentVersions(token: string, documentId: string) {
  return openApiRequest<DocumentVersion[], "/api/v1/documents/{documentId}/versions", "get">("/api/v1/documents/{documentId}/versions", "get", {
    token,
    cache: "no-store",
    pathParams: { documentId },
  });
}

export function restoreDocumentVersion(
  token: string,
  documentId: string,
  version: number,
  payload: RestoreDocumentVersionPayload = {},
) {
  return openApiRequest<WorkspaceDocument, "/api/v1/documents/{documentId}/versions/{version}/restore", "post">("/api/v1/documents/{documentId}/versions/{version}/restore", "post", {
    token,
    pathParams: { documentId, version: String(version) },
    body: payload,
  });
}
