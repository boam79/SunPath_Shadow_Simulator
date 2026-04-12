"""
SunPath & Shadow Simulator - FastAPI Backend
Main application entry point
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

# API routers
from app.api import solar, shadow, irradiance, integrated, cache
from app.middleware.http_extra import ApiRateLimitMiddleware, RequestLogMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("🚀 Starting SunPath & Shadow Simulator API")
    yield
    print("👋 Shutting down SunPath & Shadow Simulator API")


_env = os.getenv("ENVIRONMENT", "development").lower()
_is_production = _env == "production"
_docs_url = None if _is_production else "/docs"
_redoc_url = None if _is_production else "/redoc"
# 프로덕션에서도 문서를 켜려면 SUNPATH_ENABLE_DOCS=true
if os.getenv("SUNPATH_ENABLE_DOCS", "").lower() == "true":
    _docs_url = "/docs"
    _redoc_url = "/redoc"

# Initialize FastAPI application
app = FastAPI(
    title="SunPath & Shadow Simulator API",
    description="태양 경로, 일조량, 그림자 계산 API. 버전 경로: /api/v1/... (레거시 /api/... 동일 제공)",
    version="0.1.0",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    lifespan=lifespan,
)

# 미들웨어: 마지막에 추가한 것이 요청 시 가장 먼저 실행됨 → 로깅·레이트리밋이 바깥쪽
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o.strip()
        for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization", "X-Request-ID"],
)
app.add_middleware(GZipMiddleware, minimum_size=512)
app.add_middleware(ApiRateLimitMiddleware)
app.add_middleware(RequestLogMiddleware)


def _mount_versioned_api(prefix: str) -> None:
    """동일 라우터를 /api/v1 및 /api(레거시)에 마운트."""
    app.include_router(
        solar.router,
        prefix=f"{prefix}/solar",
        tags=["Solar Position"],
        responses={404: {"description": "Not found"}, 500: {"description": "Internal server error"}},
    )
    app.include_router(
        shadow.router,
        prefix=f"{prefix}/shadow",
        tags=["Shadow Calculation"],
        responses={404: {"description": "Not found"}, 500: {"description": "Internal server error"}},
    )
    app.include_router(
        irradiance.router,
        prefix=f"{prefix}/irradiance",
        tags=["Irradiance Calculation"],
        responses={404: {"description": "Not found"}, 500: {"description": "Internal server error"}},
    )
    app.include_router(
        integrated.router,
        prefix=f"{prefix}/integrated",
        tags=["Integrated Calculation"],
        responses={404: {"description": "Not found"}, 500: {"description": "Internal server error"}},
    )
    app.include_router(
        cache.router,
        prefix=f"{prefix}/cache",
        tags=["Cache Management"],
        responses={404: {"description": "Not found"}, 500: {"description": "Internal server error"}},
    )


_mount_versioned_api("/api/v1")
_mount_versioned_api("/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SunPath & Shadow Simulator API",
        "version": "0.1.0",
        "docs": "/docs" if _docs_url else None,
        "api_versions": ["/api/v1", "/api"],
        "status": "operational",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "sunpath-api"}
