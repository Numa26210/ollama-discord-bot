"""
Pydantic schemas for API responses
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ==================== STATS SCHEMAS ====================

class KPICard(BaseModel):
    """Single KPI card data"""
    label: str
    value: int
    description: str
    change_percent: Optional[float] = None  # Percentage change from previous period


class OverviewStats(BaseModel):
    """Overview statistics response"""
    messages_received: KPICard
    bot_responses: KPICard
    active_users: KPICard
    ai_triggers: KPICard
    workflows_executed: KPICard
    timestamp: datetime
    period_days: int = 30

    class Config:
        json_schema_extra = {
            "example": {
                "messages_received": {
                    "label": "Messages reçus",
                    "value": 1250,
                    "description": "Nombre total de messages",
                    "change_percent": 12.5
                },
                "bot_responses": {
                    "label": "Réponses du bot",
                    "value": 340,
                    "description": "Messages envoyés par le bot"
                },
                "active_users": {
                    "label": "Utilisateurs actifs",
                    "value": 45,
                    "description": "Utilisateurs uniques"
                },
                "ai_triggers": {
                    "label": "Déclenchements IA",
                    "value": 320,
                    "description": "Requêtes IA traitées"
                },
                "workflows_executed": {
                    "label": "Workflows exécutés",
                    "value": 0,
                    "description": "Workflows automatisés"
                },
                "timestamp": "2026-03-31T12:00:00",
                "period_days": 30
            }
        }


class DailyVolume(BaseModel):
    """Daily volume data for stacked bar chart"""
    day: str  # YYYY-MM-DD format
    total_messages: int
    ai_triggered_messages: int
    standard_messages: int  # total_messages - ai_triggered_messages


class DailyVolumesResponse(BaseModel):
    """Response containing daily volumes for graphing"""
    data: List[DailyVolume]
    server_id: str
    period_days: int = 30
    timestamp: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {
                        "day": "2026-03-01",
                        "total_messages": 50,
                        "ai_triggered_messages": 15,
                        "standard_messages": 35
                    },
                    {
                        "day": "2026-03-02",
                        "total_messages": 65,
                        "ai_triggered_messages": 22,
                        "standard_messages": 43
                    }
                ],
                "server_id": "123456789",
                "period_days": 30,
                "timestamp": "2026-03-31T12:00:00"
            }
        }


class UserLeaderboard(BaseModel):
    """Single user in leaderboard"""
    rank: int
    user_id: str
    username: str
    message_count: int
    ai_triggered_count: int


class ChannelLeaderboard(BaseModel):
    """Single channel in leaderboard"""
    rank: int
    channel_id: str
    channel_name: str
    message_count: int
    ai_triggered_count: int


class LeaderboardsResponse(BaseModel):
    """Response containing user and channel leaderboards"""
    top_users: List[UserLeaderboard]
    top_channels: List[ChannelLeaderboard]
    server_id: str
    timestamp: datetime
    limit: int = 5

    class Config:
        json_schema_extra = {
            "example": {
                "top_users": [
                    {
                        "rank": 1,
                        "user_id": "123456789",
                        "username": "john_doe",
                        "message_count": 250,
                        "ai_triggered_count": 50
                    }
                ],
                "top_channels": [
                    {
                        "rank": 1,
                        "channel_id": "111111111",
                        "channel_name": "general",
                        "message_count": 500,
                        "ai_triggered_count": 150
                    }
                ],
                "server_id": "123456789",
                "timestamp": "2026-03-31T12:00:00",
                "limit": 5
            }
        }


# ==================== BOT SCHEMAS ====================

class BotToggleRequest(BaseModel):
    """Request to toggle bot status"""
    server_id: str
    is_active: bool


class BotToggleResponse(BaseModel):
    """Response after toggling bot status"""
    server_id: str
    is_active: bool
    message: str
    timestamp: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "server_id": "123456789",
                "is_active": True,
                "message": "Bot activated on server",
                "timestamp": "2026-03-31T12:00:00"
            }
        }


# ==================== ERROR SCHEMAS ====================

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: Optional[str] = None
    timestamp: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "error": "Server not found",
                "detail": "Server with ID 123456789 does not exist",
                "timestamp": "2026-03-31T12:00:00"
            }
        }
