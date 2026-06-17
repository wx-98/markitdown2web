import axios from "axios";
import type { ApiResponse } from "@/types";

const client = axios.create({
  baseURL: "/api/v1",
  timeout: 120_000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const sid = sessionStorage.getItem("e2m_session_id");
  if (sid) {
    config.headers["X-Session-Id"] = sid;
  }
  return config;
});

client.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    const message =
      err.response?.data?.detail || err.response?.data?.message || err.message || "请求失败";
    return Promise.reject(new Error(message));
  },
);

export function unwrap<T>(resp: ApiResponse<T>): T {
  if (resp.code !== 200 || resp.data == null) {
    throw new Error(resp.message || "请求失败");
  }
  return resp.data;
}

export default client;
