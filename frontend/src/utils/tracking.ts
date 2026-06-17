import { trackEvent } from "@/api/tracking";

export function initSession() {
  if (!sessionStorage.getItem("e2m_session_id")) {
    sessionStorage.setItem("e2m_session_id", crypto.randomUUID().replace(/-/g, ""));
  }
}

export function trackPageView(path: string) {
  trackEvent("page_view", { path }, window.location.origin + path);
}

export { trackEvent };
