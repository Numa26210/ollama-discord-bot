"""
Discord Bot Backend - Main application initialization
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routes import stats, bot, settings, tools, logs, quotas, workflows, executions, commands, automations, diagnostics

# Allowed frontend origins (comma-separated via env, with sensible defaults)
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:3001,http://localhost:3002"
).split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    init_db()
    print("✓ Database initialized successfully")
    yield


# Initialize FastAPI application
app = FastAPI(
    title="Discord Bot API",
    description="API for Discord AI Bot statistics and management",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Enable CORS with explicit origins (wildcard + credentials is rejected by browsers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-API-Key"],
)

# Include routers
app.include_router(stats.router)
app.include_router(bot.router)
app.include_router(settings.router)
app.include_router(tools.router)
app.include_router(logs.router)
app.include_router(quotas.router)
app.include_router(workflows.router)
app.include_router(executions.router)
app.include_router(commands.router)
app.include_router(automations.router)
app.include_router(diagnostics.router)


@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Discord Bot API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
