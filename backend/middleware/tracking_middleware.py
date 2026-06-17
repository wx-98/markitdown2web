import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from backend.db.session import async_session_factory
from backend.models.tracking import TrackingEvent
from backend.models.base import utcnow

logger = logging.getLogger(__name__)

_SKIP_PREFIXES = ("/health", "/docs", "/openapi.json", "/favicon")


class TrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        if any(path.startswith(p) for p in _SKIP_PREFIXES):
            return await call_next(request)

        start = time.monotonic()
        response = await call_next(request)
        elapsed_ms = int((time.monotonic() - start) * 1000)

        try:
            user_id = None
            auth = request.headers.get("authorization", "")
            if auth.startswith("Bearer "):
                from backend.core.security import decode_access_token
                payload = decode_access_token(auth[7:])
                if payload:
                    user_id = payload.get("sub")

            async with async_session_factory() as session:
                event = TrackingEvent(
                    user_id=user_id,
                    event_type="api_request",
                    event_data={
                        "method": request.method,
                        "path": path,
                        "status_code": response.status_code,
                        "elapsed_ms": elapsed_ms,
                    },
                    ip_address=request.client.host if request.client else "",
                    user_agent=request.headers.get("user-agent", "")[:512],
                    page_url=str(request.url),
                    session_id=request.headers.get("x-session-id", ""),
                )
                session.add(event)
                await session.commit()
        except Exception:
            logger.debug("Tracking middleware error", exc_info=True)

        return response
