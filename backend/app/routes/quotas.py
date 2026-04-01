"""
Quotas API — Report token/request usage from the database.
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.message_log import MessageLog
from app.models.user import User

router = APIRouter(prefix="/api/quotas", tags=["quotas"])


class TopUser(BaseModel):
    user_id: str
    username: str
    requests: int
    tokens: int


class QuotaUsage(BaseModel):
    total_requests: int
    total_tokens: int
    active_users: int
    daily_requests: int
    daily_tokens: int
    daily_request_limit: int
    daily_token_limit: int
    monthly_requests: int
    monthly_request_limit: int
    top_users: List[TopUser]


@router.get("/usage", response_model=QuotaUsage)
def get_quota_usage(server_id: str = Query(default="")):
    """Compute real usage from message_logs table."""
    db: Session = SessionLocal()
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import Integer

        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        base = db.query(MessageLog)
        if server_id:
            base = base.filter(MessageLog.server_id == server_id)

        # Total AI requests (is_ai_triggered = true)
        total_ai = base.filter(MessageLog.is_ai_triggered == True).count()

        # Daily AI requests
        daily_ai = base.filter(
            MessageLog.is_ai_triggered == True,
            MessageLog.timestamp >= today_start
        ).count()

        # Monthly AI requests
        monthly_ai = base.filter(
            MessageLog.is_ai_triggered == True,
            MessageLog.timestamp >= month_start
        ).count()

        # Active users (distinct users with AI triggers)
        active = db.query(func.count(func.distinct(MessageLog.user_id))).filter(
            MessageLog.is_ai_triggered == True
        )
        if server_id:
            active = active.filter(MessageLog.server_id == server_id)
        active_count = active.scalar() or 0

        # Estimate tokens (~150 tokens per AI request)
        est_tokens_per_req = 150
        total_tokens = total_ai * est_tokens_per_req
        daily_tokens = daily_ai * est_tokens_per_req

        # Top users by AI request count
        top_q = (
            db.query(
                MessageLog.user_id,
                User.username,
                func.count().label("cnt"),
            )
            .outerjoin(User, MessageLog.user_id == User.id)
            .filter(MessageLog.is_ai_triggered == True)
        )
        if server_id:
            top_q = top_q.filter(MessageLog.server_id == server_id)

        top_q = (
            top_q.group_by(MessageLog.user_id, User.username)
            .order_by(func.count().desc())
            .limit(10)
            .all()
        )

        top_users = [
            TopUser(
                user_id=str(row[0]),
                username=row[1] or "Inconnu",
                requests=row[2],
                tokens=row[2] * est_tokens_per_req,
            )
            for row in top_q
        ]

        return QuotaUsage(
            total_requests=total_ai,
            total_tokens=total_tokens,
            active_users=active_count,
            daily_requests=daily_ai,
            daily_tokens=daily_tokens,
            daily_request_limit=1000,
            daily_token_limit=500000,
            monthly_requests=monthly_ai,
            monthly_request_limit=30000,
            top_users=top_users,
        )
    finally:
        db.close()
