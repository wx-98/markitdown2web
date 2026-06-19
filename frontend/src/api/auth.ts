import client from "./client";
import type { AuthResponse } from "@/types";

export async function registerByEmail(email: string, password: string, nickname = "") {
  const { data } = await client.post<AuthResponse>("/auth/register", {
    email,
    password,
    nickname,
  });
  return data;
}

export async function registerWithCode(
  email: string,
  code: string,
  password: string,
  nickname = ""
) {
  const { data } = await client.post<AuthResponse>("/auth/register/with-code", {
    email,
    code,
    password,
    nickname,
  });
  return data;
}

export async function loginByEmail(email: string, password: string) {
  const { data } = await client.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function sendEmailCode(email: string, purpose = "login") {
  await client.post("/auth/email/send-code", { email, purpose });
}

export async function verifyEmailCode(
  email: string,
  code: string,
  purpose = "login"
) {
  const { data } = await client.post<AuthResponse>("/auth/email/verify", {
    email,
    code,
    purpose,
  });
  return data;
}

export async function sendSmsCode(phone: string, purpose = "login") {
  await client.post("/auth/sms/send", { phone, purpose });
}

export async function verifySmsCode(phone: string, code: string, purpose = "login") {
  const { data } = await client.post<AuthResponse>("/auth/sms/verify", {
    phone,
    code,
    purpose,
  });
  return data;
}

export async function getMe() {
  const { data } = await client.get("/auth/me");
  return data;
}

export async function updateProfile(params: { nickname?: string; avatar_url?: string }) {
  const { data } = await client.patch<import("@/types").UserInfo>("/auth/profile", params);
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await client.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function changeEmail(newEmail: string, code: string) {
  const { data } = await client.post<import("@/types").UserInfo>("/auth/change-email", {
    new_email: newEmail,
    code,
  });
  return data;
}

export function getGoogleAuthUrl() {
  return "/api/v1/auth/google";
}
