import axios from "axios";

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

export default client;
