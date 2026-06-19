export interface PptxJob {
  id: string;
  status: "pending" | "planning" | "generating" | "exporting" | "completed" | "failed";
  progress: number;
  source_type: string;
  source_name: string;
  canvas_format: string;
  style: string;
  page_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
