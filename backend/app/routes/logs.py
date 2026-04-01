"""
Logs API — Serve recent application logs.
"""
import os
import logging
from pathlib import Path
from datetime import datetime
from collections import deque
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/logs", tags=["logs"])

# In-memory ring buffer for recent logs (max 500)
_LOG_BUFFER: deque = deque(maxlen=500)


class LogEntry(BaseModel):
    timestamp: str
    level: str
    message: str


class _BufferHandler(logging.Handler):
    """Logging handler that pushes records into the ring buffer."""
    def emit(self, record):
        _LOG_BUFFER.append({
            "timestamp": datetime.fromtimestamp(record.created).strftime("%H:%M:%S"),
            "level": record.levelname,
            "message": self.format(record),
        })


# Install the handler on the root logger so we capture everything
_handler = _BufferHandler()
_handler.setFormatter(logging.Formatter("%(name)s — %(message)s"))
logging.getLogger().addHandler(_handler)

# Also read the bot log file if it exists
_BOT_LOG = Path(__file__).resolve().parent.parent.parent.parent / "bot" / "bot.log"


def _read_file_logs(max_lines: int = 100) -> list:
    """Read the last N lines from bot.log on disk."""
    entries = []
    if _BOT_LOG.exists():
        try:
            lines = _BOT_LOG.read_text(encoding="utf-8", errors="replace").splitlines()
            for line in lines[-max_lines:]:
                # Expected format: 2024-01-01 12:00:00,000 - name - LEVEL - message
                parts = line.split(" - ", 3)
                if len(parts) >= 4:
                    ts = parts[0].strip()
                    level = parts[2].strip()
                    msg = parts[3].strip()
                    # Shorten timestamp to time only
                    try:
                        ts = ts.split(" ", 1)[1].split(",")[0]
                    except IndexError:
                        pass
                    entries.append({"timestamp": ts, "level": level, "message": msg})
                elif line.strip():
                    entries.append({"timestamp": "", "level": "INFO", "message": line.strip()})
        except Exception:
            pass
    return entries


@router.get("/recent", response_model=List[LogEntry])
def get_recent_logs():
    """Return recent logs: in-memory buffer + tail of bot.log."""
    file_logs = _read_file_logs(100)
    buffer_logs = list(_LOG_BUFFER)

    # Merge: file logs first, then buffer, deduplicated by message
    seen = set()
    merged = []
    for entry in file_logs + buffer_logs:
        key = f"{entry['timestamp']}|{entry['message']}"
        if key not in seen:
            seen.add(key)
            merged.append(entry)

    # Return last 200
    return merged[-200:]
