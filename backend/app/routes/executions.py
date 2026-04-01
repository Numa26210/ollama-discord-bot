"""
Executions API — list workflow/command execution history from DB.
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import func, desc
from datetime import datetime

from app.database import SessionLocal
from app.models.message_log import MessageLog
from app.models.user import User
from app.models.channel import Channel

router = APIRouter(prefix="/api/executions", tags=["executions"])


class ExecutionOut(BaseModel):
    id: str
    name: str
    username: str
    status: str
    duration_ms: Optional[int] = None
    created_at: str


@router.get("", response_model=List[ExecutionOut])
def list_executions(server_id: str = Query(default=""), limit: int = Query(default=50, le=200)):
    """Build execution history from AI-triggered messages in the DB."""
    db = SessionLocal()
    try:
        q = (
            db.query(MessageLog, User.username, Channel.name)
            .outerjoin(User, MessageLog.user_id == User.id)
            .outerjoin(Channel, MessageLog.channel_id == Channel.id)
            .filter(MessageLog.is_ai_triggered == True)
        )
        if server_id:
            q = q.filter(MessageLog.server_id == server_id)
        q = q.order_by(desc(MessageLog.timestamp)).limit(limit)

        results = []
        for msg, username, channel_name in q.all():
            results.append(ExecutionOut(
                id=str(msg.id),
                name=f"AI Response — #{channel_name or 'unknown'}",
                username=username or "Inconnu",
                status="success",
                duration_ms=None,
                created_at=msg.timestamp.strftime("%Y-%m-%d %H:%M:%S") if msg.timestamp else "",
            ))
        return results
    finally:
        db.close()
