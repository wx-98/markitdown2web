import axios from "axios";

const client = axios.create({
  baseURL: "/api/v1",
  timeout: 30_000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("admin_token");
      window.location.href = "/login";
    }
    const msg = err.response?.data?.detail || err.message || "Request failed";
    return Promise.reject(new Error(msg));
  },
);

export default client;
