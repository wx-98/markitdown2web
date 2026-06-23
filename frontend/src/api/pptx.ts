import client from "./client";
import type { PptxJob } from "@/types";

export async function createPptxJob(data: {
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
  const resp = await client.post("/pptx/jobs", form);
  return resp.data;
}

export async function getPptxJob(jobId: string): Promise<PptxJob> {
  const resp = await client.get(`/pptx/jobs/${jobId}`);
  return resp.data;
}

export async function listPptxJobs(skip = 0, limit = 20): Promise<PptxJob[]> {
  const resp = await client.get("/pptx/jobs", { params: { skip, limit } });
  return resp.data;
}

export function getPptxDownloadUrl(jobId: string): string {
  return `/api/v1/pptx/jobs/${jobId}/download`;
}

export function getPptxStreamUrl(jobId: string): string {
  return `/api/v1/pptx/jobs/${jobId}/stream`;
}

export function getSlidePreviewUrl(jobId: string, slideIndex: number): string {
  return `/api/v1/pptx/jobs/${jobId}/slides/${slideIndex}`;
}

export async function listSlides(jobId: string): Promise<{ index: number; name: string; url: string }[]> {
  const resp = await client.get(`/pptx/jobs/${jobId}/slides`);
  return resp.data;
}

export async function getActivePptxJobs(): Promise<PptxJob[]> {
  const resp = await client.get("/pptx/jobs/active");
  return resp.data;
}
