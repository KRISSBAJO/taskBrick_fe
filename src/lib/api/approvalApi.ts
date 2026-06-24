import type { PaginatedResponse } from "../types";
import { apiRequest } from "./request";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type ApprovalDefinitionStep = {
  id?: string;
  definitionId?: string;
  stepOrder: number;
  title: string;
  approverId?: string | null;
  approverRole?: string | null;
  required: boolean;
  escalationHours?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApprovalDefinition = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  entityType: string;
  isActive: boolean;
  createdById?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  steps: ApprovalDefinitionStep[];
};

export type ApprovalStep = {
  id: string;
  approvalId: string;
  stepOrder: number;
  title?: string | null;
  approverId: string;
  required: boolean;
  status: ApprovalStatus;
  comments?: string | null;
  decidedById?: string | null;
  decidedAt?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Approval = {
  id: string;
  tenantId: string;
  definitionId?: string | null;
  workflowRunId?: string | null;
  entityType: string;
  entityId: string;
  title: string;
  description?: string | null;
  status: ApprovalStatus;
  requestedById?: string | null;
  currentStep: number;
  dueDate?: string | null;
  decidedAt?: string | null;
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
  steps: ApprovalStep[];
};

export type ApprovalStepInput = {
  stepOrder: number;
  title: string;
  approverId?: string;
  approverRole?: string;
  required?: boolean;
  escalationHours?: number;
};

export type ApprovalDefinitionPayload = {
  name: string;
  description?: string;
  entityType: string;
  isActive?: boolean;
  steps: ApprovalStepInput[];
};

export type ApprovalPayload = {
  definitionId?: string;
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  dueDate?: string;
  metadata?: unknown;
  steps?: ApprovalStepInput[];
};

export type ApprovalQuery = {
  page?: number;
  limit?: number;
  search?: string;
  entityType?: string;
  entityId?: string;
  requestedById?: string;
  approverId?: string;
  status?: ApprovalStatus;
  from?: string;
  to?: string;
};

export type ApprovalDefinitionQuery = {
  page?: number;
  limit?: number;
  search?: string;
  entityType?: string;
  isActive?: boolean;
  includeArchived?: boolean;
};

function queryString(query: Record<string, unknown> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function listApprovalDefinitions(token: string, query: ApprovalDefinitionQuery = {}) {
  return apiRequest<PaginatedResponse<ApprovalDefinition>>(`/approval-definitions${queryString({
    ...query,
    page: query.page ?? 1,
    limit: Math.min(Math.max(query.limit ?? 50, 1), 100),
  })}`, {
    token,
    cache: "no-store",
  });
}

export function createApprovalDefinition(token: string, payload: ApprovalDefinitionPayload) {
  return apiRequest<ApprovalDefinition>("/approval-definitions", {
    token,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateApprovalDefinition(token: string, definitionId: string, payload: Partial<ApprovalDefinitionPayload>) {
  return apiRequest<ApprovalDefinition>(`/approval-definitions/${encodeURIComponent(definitionId)}`, {
    token,
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveApprovalDefinition(token: string, definitionId: string) {
  return apiRequest<ApprovalDefinition>(`/approval-definitions/${encodeURIComponent(definitionId)}/archive`, {
    token,
    method: "POST",
  });
}

export function restoreApprovalDefinition(token: string, definitionId: string) {
  return apiRequest<ApprovalDefinition>(`/approval-definitions/${encodeURIComponent(definitionId)}/restore`, {
    token,
    method: "POST",
  });
}

export function listApprovals(token: string, query: ApprovalQuery = {}) {
  return apiRequest<PaginatedResponse<Approval>>(`/approvals${queryString({
    ...query,
    page: query.page ?? 1,
    limit: Math.min(Math.max(query.limit ?? 50, 1), 100),
  })}`, {
    token,
    cache: "no-store",
  });
}

export function listMyPendingApprovals(token: string, query: Pick<ApprovalQuery, "page" | "limit"> = {}) {
  return apiRequest<PaginatedResponse<Approval>>(`/approvals/my-pending${queryString({
    page: query.page ?? 1,
    limit: Math.min(Math.max(query.limit ?? 50, 1), 100),
  })}`, {
    token,
    cache: "no-store",
  });
}

export function getApproval(token: string, approvalId: string) {
  return apiRequest<Approval>(`/approvals/${encodeURIComponent(approvalId)}`, {
    token,
    cache: "no-store",
  });
}

export function createApproval(token: string, payload: ApprovalPayload) {
  return apiRequest<Approval>("/approvals", {
    token,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approveApprovalStep(token: string, approvalId: string, stepId: string, comments?: string) {
  return apiRequest<Approval>(`/approvals/${encodeURIComponent(approvalId)}/steps/${encodeURIComponent(stepId)}/approve`, {
    token,
    method: "POST",
    body: JSON.stringify({ comments: comments?.trim() || undefined }),
  });
}

export function rejectApprovalStep(token: string, approvalId: string, stepId: string, comments?: string) {
  return apiRequest<Approval>(`/approvals/${encodeURIComponent(approvalId)}/steps/${encodeURIComponent(stepId)}/reject`, {
    token,
    method: "POST",
    body: JSON.stringify({ comments: comments?.trim() || undefined }),
  });
}

export function cancelApproval(token: string, approvalId: string) {
  return apiRequest<Approval>(`/approvals/${encodeURIComponent(approvalId)}/cancel`, {
    token,
    method: "POST",
  });
}

export function reopenApproval(token: string, approvalId: string) {
  return apiRequest<Approval>(`/approvals/${encodeURIComponent(approvalId)}/reopen`, {
    token,
    method: "POST",
  });
}
