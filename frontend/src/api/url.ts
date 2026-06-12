import client from "./client";
import type { ApiResponse, TaskStatus } from "@/types";

export async function processUrl(
  url: string,
  noteStyle: string = "detailed",
): Promise<{ task_id: string }> {
  const { data } = await client.post<ApiResponse<{ task_id: string }>>(
    "/url/process",
    { url, note_style: noteStyle },
  );
  return data.data;
}

export async function getUrlStatus(
  taskId: string,
): Promise<TaskStatus> {
  const { data } = await client.get<ApiResponse<TaskStatus>>(
    `/url/status/${taskId}`,
  );
  return data.data;
}
