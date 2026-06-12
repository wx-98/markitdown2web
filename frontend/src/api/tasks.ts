import client from "./client";
import type { ApiResponse, ConversionResult, TaskInfo } from "@/types";

export async function getTasks(
  limit = 50,
  offset = 0,
): Promise<TaskInfo[]> {
  const { data } = await client.get<ApiResponse<TaskInfo[]>>("/tasks", {
    params: { limit, offset },
  });
  return data.data;
}

export async function getResult(
  resultId: string,
): Promise<ConversionResult> {
  const { data } = await client.get<ApiResponse<ConversionResult>>(
    `/export/result/${resultId}`,
  );
  return data.data;
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
