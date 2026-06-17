import client from "./client";

export const login = (email: string, password: string) =>
  client.post("/auth/login", { email, password }).then((r) => r.data);

export const getDashboard = () =>
  client.get("/admin/dashboard").then((r) => r.data);

export const getUsers = (page = 1, size = 20, search = "") =>
  client.get("/admin/users", { params: { page, size, search } }).then((r) => r.data);

export const toggleBlock = (userId: string, block: boolean) =>
  client.patch(`/admin/users/${userId}/block`, null, { params: { block } }).then((r) => r.data);

export const getRevenue = (days = 30) =>
  client.get("/admin/revenue", { params: { days } }).then((r) => r.data);

export const getOrders = (page = 1, size = 20) =>
  client.get("/admin/orders", { params: { page, size } }).then((r) => r.data);

export const getTracking = (page = 1, size = 50, eventType = "") =>
  client.get("/admin/tracking", { params: { page, size, event_type: eventType } }).then((r) => r.data);

export const getConfig = () =>
  client.get("/admin/config").then((r) => r.data);

export const updateConfig = (data: Record<string, string>) =>
  client.patch("/admin/config", data).then((r) => r.data);
