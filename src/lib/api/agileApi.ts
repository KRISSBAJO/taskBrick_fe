import type {
  BoardColumn,
  PaginatedResponse,
  ProjectBoard,
  Sprint,
  Task,
} from "../api";
import {
  boundedLimit,
  openApiRequest,
  type OpenApiJsonBody,
  type OpenApiQuery,
} from "./request";

type ListSprintsQuery = OpenApiQuery<"/api/v1/agile/sprints", "get">;
type CreateSprintPayload = OpenApiJsonBody<"/api/v1/agile/sprints", "post">;
type UpdateSprintPayload = OpenApiJsonBody<"/api/v1/agile/sprints/{sprintId}", "patch">;
type CompleteSprintPayload = OpenApiJsonBody<"/api/v1/agile/sprints/{sprintId}/complete", "post">;
type SprintTaskBulkPayload = OpenApiJsonBody<"/api/v1/agile/sprints/{sprintId}/tasks", "post">;
type CreateBoardColumnPayload = OpenApiJsonBody<"/api/v1/agile/boards/{boardId}/columns", "post">;
type UpdateBoardColumnPayload = OpenApiJsonBody<"/api/v1/agile/boards/{boardId}/columns/{columnId}", "patch">;
type ReorderBoardColumnsPayload = OpenApiJsonBody<"/api/v1/agile/boards/{boardId}/columns/reorder", "patch">;
type UpdateTaskOrderPayload = OpenApiJsonBody<"/api/v1/agile/tasks/{taskId}/order", "patch">;
type UpdateTaskStatusPayload = OpenApiJsonBody<"/api/v1/agile/tasks/{taskId}/status", "patch">;
export function getProjectBoard(token: string, projectId: string) {
  return openApiRequest<ProjectBoard, "/api/v1/agile/projects/{projectId}/board", "get">(
    "/api/v1/agile/projects/{projectId}/board",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function createBoardColumn(token: string, boardId: string, payload: CreateBoardColumnPayload) {
  return openApiRequest<BoardColumn, "/api/v1/agile/boards/{boardId}/columns", "post">(
    "/api/v1/agile/boards/{boardId}/columns",
    "post",
    {
      pathParams: { boardId },
      token,
      body: payload,
    },
  );
}

export function updateBoardColumn(
  token: string,
  boardId: string,
  columnId: string,
  payload: UpdateBoardColumnPayload,
) {
  return openApiRequest<BoardColumn, "/api/v1/agile/boards/{boardId}/columns/{columnId}", "patch">(
    "/api/v1/agile/boards/{boardId}/columns/{columnId}",
    "patch",
    {
      pathParams: { boardId, columnId },
      token,
      body: payload,
    },
  );
}

export function deleteBoardColumn(token: string, boardId: string, columnId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/agile/boards/{boardId}/columns/{columnId}", "delete">(
    "/api/v1/agile/boards/{boardId}/columns/{columnId}",
    "delete",
    {
      pathParams: { boardId, columnId },
      token,
    },
  );
}

export function reorderBoardColumns(
  token: string,
  boardId: string,
  columns: ReorderBoardColumnsPayload["columns"],
) {
  return openApiRequest<ProjectBoard, "/api/v1/agile/boards/{boardId}/columns/reorder", "patch">(
    "/api/v1/agile/boards/{boardId}/columns/reorder",
    "patch",
    {
      pathParams: { boardId },
      token,
      body: { columns },
    },
  );
}

export function updateTaskBoardOrder(token: string, taskId: string, payload: UpdateTaskOrderPayload) {
  return openApiRequest<Task, "/api/v1/agile/tasks/{taskId}/order", "patch">(
    "/api/v1/agile/tasks/{taskId}/order",
    "patch",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function updateTaskStatus(token: string, taskId: string, payload: UpdateTaskStatusPayload) {
  return openApiRequest<Task, "/api/v1/agile/tasks/{taskId}/status", "patch">(
    "/api/v1/agile/tasks/{taskId}/status",
    "patch",
    {
      pathParams: { taskId },
      token,
      body: payload,
    },
  );
}

export function listSprints(
  token: string,
  query: ListSprintsQuery = {},
) {
  return openApiRequest<PaginatedResponse<Sprint>, "/api/v1/agile/sprints", "get">(
    "/api/v1/agile/sprints",
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

export function createSprint(
  token: string,
  payload: CreateSprintPayload,
) {
  return openApiRequest<Sprint, "/api/v1/agile/sprints", "post">("/api/v1/agile/sprints", "post", {
    pathParams: {},
    token,
    body: payload,
  });
}

export function updateSprint(
  token: string,
  sprintId: string,
  payload: UpdateSprintPayload,
) {
  return openApiRequest<Sprint, "/api/v1/agile/sprints/{sprintId}", "patch">(
    "/api/v1/agile/sprints/{sprintId}",
    "patch",
    {
      pathParams: { sprintId },
      token,
      body: payload,
    },
  );
}

export function startSprint(token: string, sprintId: string) {
  return openApiRequest<Sprint, "/api/v1/agile/sprints/{sprintId}/start", "post">(
    "/api/v1/agile/sprints/{sprintId}/start",
    "post",
    {
      pathParams: { sprintId },
      token,
    },
  );
}

export function completeSprint(
  token: string,
  sprintId: string,
  payload: CompleteSprintPayload = {
    moveIncompleteToBacklog: true,
  },
) {
  return openApiRequest<Sprint, "/api/v1/agile/sprints/{sprintId}/complete", "post">(
    "/api/v1/agile/sprints/{sprintId}/complete",
    "post",
    {
      pathParams: { sprintId },
      token,
      body: payload,
    },
  );
}

export function deleteSprint(token: string, sprintId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/agile/sprints/{sprintId}", "delete">(
    "/api/v1/agile/sprints/{sprintId}",
    "delete",
    {
      pathParams: { sprintId },
      token,
    },
  );
}

export function addSprintTasks(token: string, sprintId: string, taskIds: string[]) {
  const payload: SprintTaskBulkPayload = { taskIds };
  return openApiRequest<{ success: boolean; count: number }, "/api/v1/agile/sprints/{sprintId}/tasks", "post">(
    "/api/v1/agile/sprints/{sprintId}/tasks",
    "post",
    {
      pathParams: { sprintId },
      token,
      body: payload,
    },
  );
}

export function removeSprintTask(token: string, sprintId: string, taskId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/agile/sprints/{sprintId}/tasks/{taskId}", "delete">(
    "/api/v1/agile/sprints/{sprintId}/tasks/{taskId}",
    "delete",
    {
      pathParams: { sprintId, taskId },
      token,
    },
  );
}
