import client from "./client";
import type { PptxJob } from "@/types";

export async function createJob(data: {
  content: string;
  source_type?: string;
  source_name?: string;
  canvas_format?: string;
  style?: string;
  page_count?: number;
  file?: File;
}): Promise<PptxJob> {
  const form = new FormData();
  form.append("content", data.content);
  form.append("source_type", data.source_type || "text");
  form.append("source_name", data.source_name || "");
  form.append("canvas_format", data.canvas_format || "ppt169");
  form.append("style", data.style || "professional");
  form.append("page_count", String(data.page_count || 10));
  if (data.file) {
    form.append("file", data.file);
  }
  const resp = await client.post("/jobs", form);
  return resp.data;
}

export async function getJob(jobId: string): Promise<PptxJob> {
  const resp = await client.get(`/jobs/${jobId}`);
  return resp.data;
}

export async function listJobs(skip = 0, limit = 20): Promise<PptxJob[]> {
  const resp = await client.get("/jobs", { params: { skip, limit } });
  return resp.data;
}

export function getDownloadUrl(jobId: string): string {
  return `/api/v1/pptx/jobs/${jobId}/download`;
}
