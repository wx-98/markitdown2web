import client, { unwrap } from "./client";
import type { ApiResponse, TaskStatus } from "@/types";

export async function processVideoUrl(
  url: string,
  noteStyle: string = "detailed",
): Promise<{ task_id: string }> {
  const form = new FormData();
  form.append("url", url);
  form.append("note_style", noteStyle);
  const { data } = await client.post<ApiResponse<{ task_id: string }>>(
    "/video/process",
    form,
  );
  return unwrap(data);
}

export async function processVideoFile(
  file: File,
  noteStyle: string = "detailed",
): Promise<{ task_id: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("note_style", noteStyle);
  const { data } = await client.post<ApiResponse<{ task_id: string }>>(
    "/video/process",
    form,
  );
  return unwrap(data);
}

export async function getVideoStatus(
  taskId: string,
): Promise<TaskStatus> {
  const { data } = await client.get<ApiResponse<TaskStatus>>(
    `/video/status/${taskId}`,
  );
  return unwrap(data);
}
