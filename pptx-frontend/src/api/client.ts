import axios from "axios";

const client = axios.create({
  baseURL: "/api/v1/pptx",
  timeout: 120_000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = "http://localhost:3000/login";
    }
    const message =
      err.response?.data?.detail || err.response?.data?.message || err.message || "请求失败";
    return Promise.reject(new Error(message));
  },
);

export default client;
