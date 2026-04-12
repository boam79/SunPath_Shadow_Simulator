"""요청 로깅, 슬라이딩 윈도우 속도 제한(메모리), GZip은 main에서 등록."""
from __future__ import annotations

import logging
import time
import uuid
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger("sunpath.http")

# ── 슬라이딩 윈도우 (IP당 /api/* 요청) ─────────────────────────────
class _SlidingWindow:
    def __init__(self, max_requests: int, window_sec: float) -> None:
        self.max_requests = max_requests
        self.window_sec = window_sec
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        q = self._hits[key]
        while q and now - q[0] > self.window_sec:
            q.popleft()
        if len(q) >= self.max_requests:
            return False
        q.append(now)
        return True


_rate_limiter = _SlidingWindow(max_requests=180, window_sec=60.0)


def client_key(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()[:64]
    if request.client:
        return request.client.host
    return "unknown"


class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        rid = uuid.uuid4().hex[:12]
        request.state.request_id = rid
        t0 = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("request_id=%s unhandled error path=%s", rid, request.url.path)
            raise
        ms = (time.perf_counter() - t0) * 1000
        logger.info(
            "request_id=%s method=%s path=%s status=%s %.1fms",
            rid,
            request.method,
            request.url.path,
            getattr(response, "status_code", "?"),
            ms,
        )
        response.headers["X-Request-ID"] = rid
        return response


class ApiRateLimitMiddleware(BaseHTTPMiddleware):
    """ /api/* 경로에만 적용. /health 등은 제외. """

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        if path.startswith("/api/") and not path.startswith("/api/docs"):
            key = client_key(request)
            if not _rate_limiter.allow(key):
                return JSONResponse(
                    {"detail": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."},
                    status_code=429,
                    headers={"Retry-After": "60"},
                )
        return await call_next(request)
