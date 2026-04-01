"""
Diagnostics API — system health checks.
"""
import os
import time
from pathlib import Path
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
import aiohttp

from app.database import SessionLocal

router = APIRouter(prefix="/api/diagnostics", tags=["diagnostics"])

_ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
OLLAMA_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")


class DiagCheck(BaseModel):
    name: str
    status: str  # ok | warning | error
    message: str
    latency_ms: Optional[int] = None


@router.get("", response_model=List[DiagCheck])
async def run_diagnostics(server_id: str = Query(default="")):
    checks = []

    # 1. Database connectivity
    t0 = time.time()
    try:
        db = SessionLocal()
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db.close()
        ms = int((time.time() - t0) * 1000)
        checks.append(DiagCheck(name="Base de données", status="ok", message="SQLite connecté et opérationnel", latency_ms=ms))
    except Exception as e:
        ms = int((time.time() - t0) * 1000)
        checks.append(DiagCheck(name="Base de données", status="error", message=str(e)[:100], latency_ms=ms))

    # 2. Ollama connectivity
    t0 = time.time()
    try:
        timeout = aiohttp.ClientTimeout(total=5)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(f"{OLLAMA_URL}/api/tags") as resp:
                ms = int((time.time() - t0) * 1000)
                if resp.status == 200:
                    data = await resp.json()
                    model_count = len(data.get("models", []))
                    checks.append(DiagCheck(
                        name="Ollama",
                        status="ok",
                        message=f"Connecté — {model_count} modèle(s) disponible(s)",
                        latency_ms=ms
                    ))
                else:
                    checks.append(DiagCheck(name="Ollama", status="warning", message=f"Réponse HTTP {resp.status}", latency_ms=ms))
    except Exception:
        ms = int((time.time() - t0) * 1000)
        checks.append(DiagCheck(name="Ollama", status="error", message=f"Injoignable sur {OLLAMA_URL}", latency_ms=ms))

    # 3. .env file
    if _ENV_PATH.exists():
        env_text = _ENV_PATH.read_text(encoding="utf-8")
        has_token = "DISCORD_TOKEN=" in env_text and "your_discord" not in env_text
        checks.append(DiagCheck(
            name="Configuration (.env)",
            status="ok" if has_token else "warning",
            message="Fichier présent" + (" — token configuré" if has_token else " — DISCORD_TOKEN manquant"),
        ))
    else:
        checks.append(DiagCheck(name="Configuration (.env)", status="error", message="Fichier .env introuvable"))

    # 4. Discord token presence
    token = os.getenv("DISCORD_TOKEN", "")
    if token and "your_discord" not in token:
        checks.append(DiagCheck(name="Token Discord", status="ok", message="Token chargé en mémoire"))
    else:
        checks.append(DiagCheck(name="Token Discord", status="warning", message="Token non chargé — le bot ne se connectera pas"))

    # 5. Bot log file
    bot_log = Path(__file__).resolve().parent.parent.parent.parent / "bot" / "bot.log"
    if bot_log.exists():
        size_kb = bot_log.stat().st_size / 1024
        status = "warning" if size_kb > 5000 else "ok"
        checks.append(DiagCheck(name="Fichier bot.log", status=status, message=f"{size_kb:.0f} KB"))
    else:
        checks.append(DiagCheck(name="Fichier bot.log", status="ok", message="Pas de fichier log (normal si bot non démarré)"))

    return checks
