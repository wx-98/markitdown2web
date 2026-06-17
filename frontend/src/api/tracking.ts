import client from "./client";

export function trackEvent(
  eventType: string,
  eventData?: Record<string, unknown>,
  pageUrl?: string,
) {
  const sessionId = sessionStorage.getItem("e2m_session_id") || "";
  client
    .post("/tracking/event", {
      event_type: eventType,
      event_data: eventData,
      page_url: pageUrl || window.location.href,
      session_id: sessionId,
    })
    .catch(() => {});
}
