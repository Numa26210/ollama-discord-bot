"""
Re-export the FastAPI application so that
`uvicorn app.main:app` works alongside `uvicorn app:app`.
"""
from app import app  # noqa: F401
