import type {
  FileAsset,
  PaginatedResponse,
  UploadIntent,
  Visibility,
} from "../api";
import {
  boundedLimit,
  openApiRequest,
  type OpenApiJsonBody,
  type OpenApiQuery,
} from "./request";

type CreateUploadIntentPayload = OpenApiJsonBody<"/api/v1/files/upload-intents", "post">;
type ListFileAssetsQuery = OpenApiQuery<"/api/v1/files", "get">;
type CreateFileAssetPayload = OpenApiJsonBody<"/api/v1/files", "post">;
type FileAssetPayload = {
  fileName: string;
  fileUrl: string;
  storageKey?: string;
  provider?: string;
  mimeType?: string;
  sizeBytes?: number;
  scope?: string;
  entityType: string;
  entityId?: string;
  visibility?: Visibility;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
};

export function createUploadIntent(token: string, payload: CreateUploadIntentPayload) {
  return openApiRequest<UploadIntent, "/api/v1/files/upload-intents", "post">("/api/v1/files/upload-intents", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function listFileAssets(token: string, query: ListFileAssetsQuery = {}) {
  return openApiRequest<PaginatedResponse<FileAsset>, "/api/v1/files", "get">("/api/v1/files", "get", {
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

export function createFileAsset(token: string, payload: FileAssetPayload) {
  return openApiRequest<FileAsset, "/api/v1/files", "post">("/api/v1/files", "post", {
    token,
    pathParams: {},
    body: payload as CreateFileAssetPayload,
  });
}

export function archiveFileAsset(token: string, fileId: string) {
  return openApiRequest<FileAsset, "/api/v1/files/{fileId}/archive", "post">("/api/v1/files/{fileId}/archive", "post", {
    token,
    pathParams: { fileId },
  });
}

export function restoreFileAsset(token: string, fileId: string) {
  return openApiRequest<FileAsset, "/api/v1/files/{fileId}/restore", "post">("/api/v1/files/{fileId}/restore", "post", {
    token,
    pathParams: { fileId },
  });
}

export function deleteFileAsset(token: string, fileId: string) {
  return openApiRequest<FileAsset, "/api/v1/files/{fileId}", "delete">("/api/v1/files/{fileId}", "delete", {
    token,
    pathParams: { fileId },
  });
}
