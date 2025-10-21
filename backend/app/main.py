"""
SunPath & Shadow Simulator - FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# API routers
from app.api import solar, shadow, irradiance, integrated, cache

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting SunPath & Shadow Simulator API")
    yield
    # Shutdown
    print("👋 Shutting down SunPath & Shadow Simulator API")

# Initialize FastAPI application
app = FastAPI(
    title="SunPath & Shadow Simulator API",
    description="태양 경로, 일조량, 그림자 계산 API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration for Next.js frontend
import os

# Get allowed origins from environment variable
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SunPath & Shadow Simulator API",
        "version": "0.1.0",
        "docs": "/docs",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "sunpath-api"
    }

# Include API routers
app.include_router(
    solar.router,
    prefix="/api/solar",
    tags=["Solar Position"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

app.include_router(
    shadow.router,
    prefix="/api/shadow",
    tags=["Shadow Calculation"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

app.include_router(
    irradiance.router,
    prefix="/api/irradiance",
    tags=["Irradiance Calculation"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

app.include_router(
    integrated.router,
    prefix="/api/integrated",
    tags=["Integrated Calculation"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

app.include_router(
    cache.router,
    prefix="/api/cache",
    tags=["Cache Management"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)
