import client, { unwrap } from "./client";
import type { ApiResponse, TaskStatus } from "@/types";

export async function convertDocument(
  file: File,
  noteStyle: string = "detailed",
  useVlm: boolean = false,
): Promise<{ task_id: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("note_style", noteStyle);
  form.append("use_vlm", String(useVlm));
  const { data } = await client.post<ApiResponse<{ task_id: string }>>(
    "/document/convert",
    form,
  );
  return unwrap(data);
}

export async function getDocumentStatus(
  taskId: string,
): Promise<TaskStatus> {
  const { data } = await client.get<ApiResponse<TaskStatus>>(
    `/document/status/${taskId}`,
  );
  return unwrap(data);
}
