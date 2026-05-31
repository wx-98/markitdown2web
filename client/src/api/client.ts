import type { ConvertResponse } from "../types/convert";

const BASE = "/api/v1/convert";

export async function convertFile(file: File): Promise<ConvertResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE}/file`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Conversion failed");
  }
  return res.json();
}

export async function convertUrl(url: string): Promise<ConvertResponse> {
  const res = await fetch(`${BASE}/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Conversion failed");
  }
  return res.json();
}
