"""
FastAPI routes for bot settings and Ollama proxy endpoints.
"""
import os
import asyncio
from pathlib import Path
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
import aiohttp

from app.database import get_db

router = APIRouter(prefix="/api/settings", tags=["settings"])

# API key for write operations
_API_KEY = os.getenv("API_KEY", "")

# Path to .env at project root
_ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"

OLLAMA_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")


def verify_api_key(x_api_key: str = Header(default="")):
    if _API_KEY and x_api_key != _API_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API key")


# ---------- Schemas ----------

class BotSettings(BaseModel):
    ollama_model: str
    ollama_api_url: str
    response_max_tokens: int
    response_temperature: float
    system_prompt: str
    command_prefix: str
    log_level: str


class OllamaModelInfo(BaseModel):
    name: str
    size: Optional[str] = None
    modified_at: Optional[str] = None


class OllamaStatus(BaseModel):
    online: bool
    url: str
    models: List[OllamaModelInfo]
    current_model: str


# ---------- .env helpers ----------

def _read_env() -> dict:
    """Parse .env into a dict, preserving comments and blank lines."""
    values = {}
    if _ENV_PATH.exists():
        for line in _ENV_PATH.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#") and "=" in stripped:
                key, _, val = stripped.partition("=")
                values[key.strip()] = val.strip()
    return values


def _write_env(updates: dict):
    """Update specific keys in .env while preserving structure."""
    if not _ENV_PATH.exists():
        return

    lines = _ENV_PATH.read_text(encoding="utf-8").splitlines()
    updated_keys = set()
    new_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key, _, _ = stripped.partition("=")
            key = key.strip()
            if key in updates:
                new_lines.append(f"{key}={updates[key]}")
                updated_keys.add(key)
                continue
        new_lines.append(line)

    # Append keys that weren't already in the file
    for key, val in updates.items():
        if key not in updated_keys:
            new_lines.append(f"{key}={val}")

    _ENV_PATH.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


# ---------- Endpoints ----------

@router.get("", response_model=BotSettings)
def get_settings():
    """Read current bot settings from .env."""
    env = _read_env()
    return BotSettings(
        ollama_model=env.get("OLLAMA_MODEL", "mistral"),
        ollama_api_url=env.get("OLLAMA_API_URL", "http://localhost:11434"),
        response_max_tokens=int(env.get("RESPONSE_MAX_TOKENS", "256")),
        response_temperature=float(env.get("RESPONSE_TEMPERATURE", "0.7")),
        system_prompt=env.get("SYSTEM_PROMPT", "Tu es un assistant Discord utile et amical."),
        command_prefix=env.get("COMMAND_PREFIX", "!"),
        log_level=env.get("LOG_LEVEL", "INFO"),
    )


@router.put("", response_model=BotSettings, dependencies=[Depends(verify_api_key)])
def update_settings(settings: BotSettings):
    """Save bot settings to .env. Bot restart required for changes to take effect."""
    _write_env({
        "OLLAMA_MODEL": settings.ollama_model,
        "OLLAMA_API_URL": settings.ollama_api_url,
        "RESPONSE_MAX_TOKENS": str(settings.response_max_tokens),
        "RESPONSE_TEMPERATURE": str(settings.response_temperature),
        "SYSTEM_PROMPT": settings.system_prompt,
        "COMMAND_PREFIX": settings.command_prefix,
        "LOG_LEVEL": settings.log_level,
    })
    return settings


@router.get("/ollama/status", response_model=OllamaStatus)
async def get_ollama_status():
    """Check Ollama connectivity and list available models."""
    env = _read_env()
    url = env.get("OLLAMA_API_URL", OLLAMA_URL)
    current_model = env.get("OLLAMA_MODEL", "mistral")
    models = []
    online = False

    try:
        timeout = aiohttp.ClientTimeout(total=5)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(f"{url}/api/tags") as resp:
                if resp.status == 200:
                    online = True
                    data = await resp.json()
                    for m in data.get("models", []):
                        size_bytes = m.get("size", 0)
                        if size_bytes and isinstance(size_bytes, (int, float)):
                            size_str = f"{size_bytes / 1e9:.1f} GB"
                        else:
                            size_str = None
                        models.append(OllamaModelInfo(
                            name=m.get("name", ""),
                            size=size_str,
                            modified_at=m.get("modified_at"),
                        ))
    except Exception:
        online = False

    return OllamaStatus(
        online=online,
        url=url,
        models=models,
        current_model=current_model,
    )
