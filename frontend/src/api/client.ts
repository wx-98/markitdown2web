import axios from "axios";
import type { ApiResponse } from "@/types";

const client = axios.create({
  baseURL: "/api/v1",
  timeout: 120_000,
});

client.interceptors.response.use(
  (resp) => resp,
  (err) => {
    const message = err.response?.data?.message || err.message || "请求失败";
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
