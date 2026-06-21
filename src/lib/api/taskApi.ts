import type {
  CustomField,
  PaginatedResponse,
  Task,
  TaskActivity,
  TaskAssignee,
  TaskAttachment,
  TaskChecklist,
  TaskChecklistItem,
  TaskComment,
  TaskDependency,
  TaskLabel,
  TaskLabelAssignment,
  TaskPriority,
  TaskSavedView,
  TaskStatus,
  TaskTaxonomy,
  TaskType,
  TaskWatcher,
} from "../api";
import {
  boundedLimit,
  openApiRequest,
  type OpenApiJsonBody,
  type OpenApiQuery,
} from "./request";

type ListTasksOpenApiQuery = OpenApiQuery<"/api/v1/tasks", "get">;
type ListTasksQuery = Omit<ListTasksOpenApiQuery, "statuses" | "priorities" | "types"> & {
  statuses?: TaskStatus[];
  priorities?: TaskPriority[];
  types?: TaskType[];
};
type CreateTaskPayload = OpenApiJsonBody<"/api/v1/tasks", "post">;
type UpdateTaskPayload = OpenApiJsonBody<"/api/v1/tasks/{taskId}", "patch">;
type TaskUserPayload = OpenApiJsonBody<"/api/v1/tasks/{taskId}/assignees", "post">;
type CreateTaskCommentPayload = OpenApiJsonBody<"/api/v1/tasks/{taskId}/comments", "post">;
type CreateTaskAttachmentPayload = OpenApiJsonBody<"/api/v1/tasks/{taskId}/attachments", "post">;
type CreateTaskChecklistPayload = OpenApiJsonBody<"/api/v1/tasks/{taskId}/checklists", "post">;
type CreateTaskChecklistItemPayload = OpenApiJsonBody<"/api/v1/tasks/{taskId}/checklists/{checklistId}/items", "post">;
type UpdateTaskChecklistItemPayload = OpenApiJsonBody<"/api/v1/tasks/{taskId}/checklists/{checklistId}/items/{itemId}", "patch">;
type AssignTaskLabelPayload = OpenApiJsonBody<"/api/v1/tasks/{taskId}/labels", "post">;
type CreateTaskDependencyPayload = OpenApiJsonBody<"/api/v1/tasks/{taskId}/dependencies", "post">;
type ListCustomFieldsQuery = OpenApiQuery<"/api/v1/tasks/custom-fields", "get">;
type CreateCustomFieldPayload = OpenApiJsonBody<"/api/v1/tasks/custom-fields", "post">;
type UpdateCustomFieldPayload = OpenApiJsonBody<"/api/v1/tasks/custom-fields/{customFieldId}", "patch">;
type ListTaskSavedViewsQuery = OpenApiQuery<"/api/v1/tasks/saved-views", "get">;
type CreateTaskSavedViewPayload = OpenApiJsonBody<"/api/v1/tasks/saved-views", "post">;
type UpdateTaskSavedViewPayload = OpenApiJsonBody<"/api/v1/tasks/saved-views/{viewId}", "patch">;
type BulkTaskOperationPayload = OpenApiJsonBody<"/api/v1/tasks/bulk", "post">;
type CreateLabelPayload = OpenApiJsonBody<"/api/v1/tasks/labels", "post">;
type UpdateLabelPayload = OpenApiJsonBody<"/api/v1/tasks/labels/{labelId}", "patch">;
export function createTask(
  token: string,
  payload: CreateTaskPayload,
) {
  return openApiRequest<Task, "/api/v1/tasks", "post">("/api/v1/tasks", "post", {
    pathParams: {},
    token,
    body: payload,
  });
}

export function getTask(token: string, taskId: string) {
  return openApiRequest<Task, "/api/v1/tasks/{taskId}", "get">(
    "/api/v1/tasks/{taskId}",
    "get",
    {
      pathParams: { taskId },
      token,
      cache: "no-store",
    },
  );
}

export function updateTask(
  token: string,
  taskId: string,
  payload: UpdateTaskPayload,
) {
  return openApiRequest<Task, "/api/v1/tasks/{taskId}", "patch">(
    "/api/v1/tasks/{taskId}",
    "patch",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function deleteTask(token: string, taskId: string) {
  return openApiRequest<Task, "/api/v1/tasks/{taskId}", "delete">("/api/v1/tasks/{taskId}", "delete", {
    pathParams: { taskId },
    token,
  });
}

export function archiveTask(token: string, taskId: string) {
  return openApiRequest<Task, "/api/v1/tasks/{taskId}/archive", "post">(
    "/api/v1/tasks/{taskId}/archive",
    "post",
    {
      pathParams: { taskId },
      token,
    },
  );
}

export function restoreTask(token: string, taskId: string) {
  return openApiRequest<Task, "/api/v1/tasks/{taskId}/restore", "post">(
    "/api/v1/tasks/{taskId}/restore",
    "post",
    {
      pathParams: { taskId },
      token,
    },
  );
}

export function listTaskComments(token: string, taskId: string) {
  return openApiRequest<TaskComment[], "/api/v1/tasks/{taskId}/comments", "get">(
    "/api/v1/tasks/{taskId}/comments",
    "get",
    {
      pathParams: { taskId },
      token,
      cache: "no-store",
    },
  );
}

export function createTaskComment(token: string, taskId: string, payload: CreateTaskCommentPayload) {
  return openApiRequest<TaskComment, "/api/v1/tasks/{taskId}/comments", "post">(
    "/api/v1/tasks/{taskId}/comments",
    "post",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function deleteTaskComment(token: string, taskId: string, commentId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/tasks/{taskId}/comments/{commentId}", "delete">(
    "/api/v1/tasks/{taskId}/comments/{commentId}",
    "delete",
    {
      pathParams: { taskId, commentId },
      token,
    },
  );
}

export function listTaskChecklists(token: string, taskId: string) {
  return openApiRequest<TaskChecklist[], "/api/v1/tasks/{taskId}/checklists", "get">(
    "/api/v1/tasks/{taskId}/checklists",
    "get",
    {
      pathParams: { taskId },
      token,
      cache: "no-store",
    },
  );
}

export function createTaskChecklist(token: string, taskId: string, payload: CreateTaskChecklistPayload) {
  return openApiRequest<TaskChecklist, "/api/v1/tasks/{taskId}/checklists", "post">(
    "/api/v1/tasks/{taskId}/checklists",
    "post",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function deleteTaskChecklist(token: string, taskId: string, checklistId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/tasks/{taskId}/checklists/{checklistId}", "delete">(
    "/api/v1/tasks/{taskId}/checklists/{checklistId}",
    "delete",
    {
      pathParams: { taskId, checklistId },
      token,
    },
  );
}

export function createTaskChecklistItem(
  token: string,
  taskId: string,
  checklistId: string,
  payload: CreateTaskChecklistItemPayload,
) {
  return openApiRequest<TaskChecklistItem, "/api/v1/tasks/{taskId}/checklists/{checklistId}/items", "post">(
    "/api/v1/tasks/{taskId}/checklists/{checklistId}/items",
    "post",
    {
      pathParams: { taskId, checklistId },
      token,
      body: payload,
    },
  );
}

export function updateTaskChecklistItem(
  token: string,
  taskId: string,
  checklistId: string,
  itemId: string,
  payload: UpdateTaskChecklistItemPayload,
) {
  return openApiRequest<
    TaskChecklistItem,
    "/api/v1/tasks/{taskId}/checklists/{checklistId}/items/{itemId}",
    "patch"
  >("/api/v1/tasks/{taskId}/checklists/{checklistId}/items/{itemId}", "patch", {
    pathParams: { taskId, checklistId, itemId },
    token,
    body: payload,
  });
}

export function deleteTaskChecklistItem(
  token: string,
  taskId: string,
  checklistId: string,
  itemId: string,
) {
  return openApiRequest<
    { success: boolean },
    "/api/v1/tasks/{taskId}/checklists/{checklistId}/items/{itemId}",
    "delete"
  >("/api/v1/tasks/{taskId}/checklists/{checklistId}/items/{itemId}", "delete", {
    pathParams: { taskId, checklistId, itemId },
    token,
  });
}

export function listTaskActivities(token: string, taskId: string) {
  return openApiRequest<TaskActivity[], "/api/v1/tasks/{taskId}/activities", "get">(
    "/api/v1/tasks/{taskId}/activities",
    "get",
    {
      pathParams: { taskId },
      token,
      cache: "no-store",
    },
  );
}

export function listTaskAttachments(token: string, taskId: string) {
  return openApiRequest<TaskAttachment[], "/api/v1/tasks/{taskId}/attachments", "get">(
    "/api/v1/tasks/{taskId}/attachments",
    "get",
    {
      pathParams: { taskId },
      token,
      cache: "no-store",
    },
  );
}

export function createTaskAttachment(
  token: string,
  taskId: string,
  payload: CreateTaskAttachmentPayload,
) {
  return openApiRequest<TaskAttachment, "/api/v1/tasks/{taskId}/attachments", "post">(
    "/api/v1/tasks/{taskId}/attachments",
    "post",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function deleteTaskAttachment(token: string, taskId: string, attachmentId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/tasks/{taskId}/attachments/{attachmentId}", "delete">(
    "/api/v1/tasks/{taskId}/attachments/{attachmentId}",
    "delete",
    {
      pathParams: { taskId, attachmentId },
      token,
    },
  );
}

export function listTaskDependencies(token: string, taskId: string) {
  return openApiRequest<{ blocking: TaskDependency[]; blockedBy: TaskDependency[] }, "/api/v1/tasks/{taskId}/dependencies", "get">(
    "/api/v1/tasks/{taskId}/dependencies",
    "get",
    {
      pathParams: { taskId },
      token,
      cache: "no-store",
    },
  );
}

export function createTaskDependency(
  token: string,
  taskId: string,
  payload: CreateTaskDependencyPayload,
) {
  return openApiRequest<TaskDependency, "/api/v1/tasks/{taskId}/dependencies", "post">(
    "/api/v1/tasks/{taskId}/dependencies",
    "post",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function deleteTaskDependency(token: string, taskId: string, dependencyId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/tasks/{taskId}/dependencies/{dependencyId}", "delete">(
    "/api/v1/tasks/{taskId}/dependencies/{dependencyId}",
    "delete",
    {
      pathParams: { taskId, dependencyId },
      token,
    },
  );
}

export function getTaskTaxonomy(token: string) {
  return openApiRequest<TaskTaxonomy, "/api/v1/tasks/taxonomy", "get">("/api/v1/tasks/taxonomy", "get", {
    pathParams: {},
    token,
    cache: "no-store",
  });
}

export function listCustomFields(
  token: string,
  query: ListCustomFieldsQuery = {},
) {
  return openApiRequest<PaginatedResponse<CustomField>, "/api/v1/tasks/custom-fields", "get">(
    "/api/v1/tasks/custom-fields",
    "get",
    {
      pathParams: {},
      query: {
        ...query,
        page: query.page ?? 1,
        limit: boundedLimit(query.limit, 100),
      },
      token,
      cache: "no-store",
    },
  );
}

export function createCustomField(token: string, payload: CreateCustomFieldPayload) {
  return openApiRequest<CustomField, "/api/v1/tasks/custom-fields", "post">(
    "/api/v1/tasks/custom-fields",
    "post",
    {
      pathParams: {},
      token,
      body: payload,
    },
  );
}

export function updateCustomField(token: string, customFieldId: string, payload: UpdateCustomFieldPayload) {
  return openApiRequest<CustomField, "/api/v1/tasks/custom-fields/{customFieldId}", "patch">(
    "/api/v1/tasks/custom-fields/{customFieldId}",
    "patch",
    {
      pathParams: { customFieldId },
      token,
      body: payload,
    },
  );
}

export function archiveCustomField(token: string, customFieldId: string) {
  return openApiRequest<CustomField, "/api/v1/tasks/custom-fields/{customFieldId}/archive", "post">(
    "/api/v1/tasks/custom-fields/{customFieldId}/archive",
    "post",
    {
      pathParams: { customFieldId },
      token,
    },
  );
}

export function restoreCustomField(token: string, customFieldId: string) {
  return openApiRequest<CustomField, "/api/v1/tasks/custom-fields/{customFieldId}/restore", "post">(
    "/api/v1/tasks/custom-fields/{customFieldId}/restore",
    "post",
    {
      pathParams: { customFieldId },
      token,
    },
  );
}

export function deleteCustomField(token: string, customFieldId: string) {
  return openApiRequest<{ success: boolean } | CustomField, "/api/v1/tasks/custom-fields/{customFieldId}", "delete">(
    "/api/v1/tasks/custom-fields/{customFieldId}",
    "delete",
    {
      pathParams: { customFieldId },
      token,
    },
  );
}

export function listTaskSavedViews(
  token: string,
  query: ListTaskSavedViewsQuery = {},
) {
  return openApiRequest<PaginatedResponse<TaskSavedView>, "/api/v1/tasks/saved-views", "get">(
    "/api/v1/tasks/saved-views",
    "get",
    {
      pathParams: {},
      query: {
        ...query,
        page: query.page ?? 1,
        limit: boundedLimit(query.limit, 100),
      },
      token,
      cache: "no-store",
    },
  );
}

export function createTaskSavedView(token: string, payload: CreateTaskSavedViewPayload) {
  return openApiRequest<TaskSavedView, "/api/v1/tasks/saved-views", "post">(
    "/api/v1/tasks/saved-views",
    "post",
    {
      pathParams: {},
      token,
      body: payload,
    },
  );
}

export function updateTaskSavedView(token: string, viewId: string, payload: UpdateTaskSavedViewPayload) {
  return openApiRequest<TaskSavedView, "/api/v1/tasks/saved-views/{viewId}", "patch">(
    "/api/v1/tasks/saved-views/{viewId}",
    "patch",
    {
      pathParams: { viewId },
      token,
      body: payload,
    },
  );
}

export function deleteTaskSavedView(token: string, viewId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/tasks/saved-views/{viewId}", "delete">(
    "/api/v1/tasks/saved-views/{viewId}",
    "delete",
    {
      pathParams: { viewId },
      token,
    },
  );
}

export function bulkTaskOperation(
  token: string,
  payload: BulkTaskOperationPayload,
) {
  return openApiRequest<{ success: boolean; operation: string; count: number }, "/api/v1/tasks/bulk", "post">(
    "/api/v1/tasks/bulk",
    "post",
    {
      pathParams: {},
      token,
      body: payload,
    },
  );
}

export function listLabels(token: string) {
  return openApiRequest<TaskLabel[], "/api/v1/tasks/labels", "get">("/api/v1/tasks/labels", "get", {
    pathParams: {},
    token,
    cache: "no-store",
  });
}

export function createLabel(token: string, payload: CreateLabelPayload) {
  return openApiRequest<TaskLabel, "/api/v1/tasks/labels", "post">("/api/v1/tasks/labels", "post", {
    pathParams: {},
    token,
    body: payload,
  });
}

export function updateLabel(token: string, labelId: string, payload: UpdateLabelPayload) {
  return openApiRequest<TaskLabel, "/api/v1/tasks/labels/{labelId}", "patch">(
    "/api/v1/tasks/labels/{labelId}",
    "patch",
    {
      pathParams: { labelId },
      token,
      body: payload,
    },
  );
}

export function deleteLabel(token: string, labelId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/tasks/labels/{labelId}", "delete">(
    "/api/v1/tasks/labels/{labelId}",
    "delete",
    {
      pathParams: { labelId },
      token,
    },
  );
}

export function listTaskLabels(token: string, taskId: string) {
  return openApiRequest<TaskLabelAssignment[], "/api/v1/tasks/{taskId}/labels", "get">(
    "/api/v1/tasks/{taskId}/labels",
    "get",
    {
      pathParams: { taskId },
      token,
      cache: "no-store",
    },
  );
}

export function assignTaskLabel(token: string, taskId: string, labelId: string) {
  const payload: AssignTaskLabelPayload = { labelId };
  return openApiRequest<TaskLabelAssignment, "/api/v1/tasks/{taskId}/labels", "post">(
    "/api/v1/tasks/{taskId}/labels",
    "post",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function removeTaskLabel(token: string, taskId: string, labelId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/tasks/{taskId}/labels/{labelId}", "delete">(
    "/api/v1/tasks/{taskId}/labels/{labelId}",
    "delete",
    {
      pathParams: { taskId, labelId },
      token,
    },
  );
}

export function listTaskAssignees(token: string, taskId: string) {
  return openApiRequest<TaskAssignee[], "/api/v1/tasks/{taskId}/assignees", "get">(
    "/api/v1/tasks/{taskId}/assignees",
    "get",
    {
      pathParams: { taskId },
      token,
      cache: "no-store",
    },
  );
}

export function addTaskAssignee(token: string, taskId: string, userId: string) {
  const payload: TaskUserPayload = { userId };
  return openApiRequest<TaskAssignee, "/api/v1/tasks/{taskId}/assignees", "post">(
    "/api/v1/tasks/{taskId}/assignees",
    "post",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function removeTaskAssignee(token: string, taskId: string, userId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/tasks/{taskId}/assignees/{userId}", "delete">(
    "/api/v1/tasks/{taskId}/assignees/{userId}",
    "delete",
    {
      pathParams: { taskId, userId },
      token,
    },
  );
}

export function listTaskWatchers(token: string, taskId: string) {
  return openApiRequest<TaskWatcher[], "/api/v1/tasks/{taskId}/watchers", "get">(
    "/api/v1/tasks/{taskId}/watchers",
    "get",
    {
      pathParams: { taskId },
      token,
      cache: "no-store",
    },
  );
}

export function addTaskWatcher(token: string, taskId: string, userId: string) {
  const payload: TaskUserPayload = { userId };
  return openApiRequest<TaskWatcher, "/api/v1/tasks/{taskId}/watchers", "post">(
    "/api/v1/tasks/{taskId}/watchers",
    "post",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function removeTaskWatcher(token: string, taskId: string, userId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/tasks/{taskId}/watchers/{userId}", "delete">(
    "/api/v1/tasks/{taskId}/watchers/{userId}",
    "delete",
    {
      pathParams: { taskId, userId },
      token,
    },
  );
}

export function listTasks(
  token: string,
  query: ListTasksQuery = {},
) {
  const { statuses, priorities, types, ...rest } = query;
  const apiQuery: ListTasksOpenApiQuery = {
    ...rest,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, 100),
    statuses: statuses?.join(","),
    priorities: priorities?.join(","),
    types: types?.join(","),
  };

  return openApiRequest<PaginatedResponse<Task>, "/api/v1/tasks", "get">("/api/v1/tasks", "get", {
    pathParams: {},
    query: apiQuery,
    token,
    cache: "no-store",
  });
}
