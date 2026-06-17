export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface TaskInfo {
  id: string;
  type: "video" | "url" | "document";
  source: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error_message: string | null;
  result_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskStatus {
  task_id: string;
  status: string;
  progress: number;
  error_message: string | null;
  result_id: string | null;
}

export interface ConversionResult {
  id: string;
  title: string;
  markdown_content: string;
  summary: string;
  raw_content: string;
  source_type: string;
  source_url: string;
  created_at: string;
}

export type NoteStyle = "brief" | "detailed" | "outline";

export interface UserInfo {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  avatar_url: string | null;
  auth_provider: string;
  role: string;
  subscription_plan: string;
  subscription_expires_at: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserInfo;
}
