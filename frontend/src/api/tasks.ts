import client, { unwrap } from "./client";
import type { ApiResponse, ConversionResult, TaskInfo } from "@/types";

export async function getTasks(
  limit = 50,
  offset = 0,
): Promise<TaskInfo[]> {
  const { data } = await client.get<ApiResponse<TaskInfo[]>>("/tasks", {
    params: { limit, offset },
  });
  return unwrap(data);
}

export async function getTask(taskId: string): Promise<TaskInfo> {
  const { data } = await client.get<ApiResponse<TaskInfo>>(`/tasks/${taskId}`);
  return unwrap(data);
}

export function getTaskStreamUrl(taskId: string): string {
  return `/api/v1/tasks/${taskId}/stream`;
}

export async function getActiveTasks(): Promise<TaskInfo[]> {
  const { data } = await client.get<ApiResponse<TaskInfo[]>>("/tasks/active");
  return unwrap(data);
}

export async function getResult(
  resultId: string,
): Promise<ConversionResult> {
  const { data } = await client.get<ApiResponse<ConversionResult>>(
    `/export/result/${resultId}`,
  );
  return unwrap(data);
}

export async function exportResult(
  resultId: string,
  format: "markdown" | "word" | "pdf",
): Promise<Blob> {
  const resp = await client.post(
    `/export/${resultId}`,
    { format },
    { responseType: "blob" },
  );
  return resp.data;
}
