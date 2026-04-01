"""
Statistics service for calculating Discord bot statistics
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, case, distinct, desc, Integer
from datetime import datetime, timedelta
from typing import List, Tuple, Optional
from app.models import MessageLog, User, Channel, Server
from app.schemas import (
    OverviewStats, KPICard, DailyVolume, DailyVolumesResponse,
    UserLeaderboard, ChannelLeaderboard, LeaderboardsResponse
)


class StatsService:
    """Service for handling statistics calculations"""

    @staticmethod
    def get_overview_stats(db: Session, server_id: str, days: int = 30) -> OverviewStats:
        """
        Calculate overview statistics (KPIs) for a server
        
        Args:
            db: Database session
            server_id: Discord server ID
            days: Number of days to look back (default 30)
        
        Returns:
            OverviewStats object with KPI data
        """
        # Calculate date cutoffs
        date_limit = datetime.utcnow() - timedelta(days=days)
        date_limit_prev = date_limit - timedelta(days=days)
        
        # SQL aggregation for current period (zero objects loaded in RAM)
        current = db.query(
            func.sum(case((MessageLog.is_bot_response == False, 1), else_=0)).label("total_messages"),
            func.sum(case((MessageLog.is_bot_response == True, 1), else_=0)).label("bot_responses"),
            func.count(distinct(case((MessageLog.is_bot_response == False, MessageLog.user_id)))).label("active_users"),
            func.sum(case((MessageLog.is_ai_triggered == True, 1), else_=0)).label("ai_triggers"),
        ).filter(
            MessageLog.server_id == server_id,
            MessageLog.timestamp >= date_limit
        ).first()
        
        # SQL aggregation for previous period
        previous = db.query(
            func.sum(case((MessageLog.is_bot_response == False, 1), else_=0)).label("total_messages"),
            func.sum(case((MessageLog.is_bot_response == True, 1), else_=0)).label("bot_responses"),
            func.sum(case((MessageLog.is_ai_triggered == True, 1), else_=0)).label("ai_triggers"),
        ).filter(
            MessageLog.server_id == server_id,
            MessageLog.timestamp >= date_limit_prev,
            MessageLog.timestamp < date_limit
        ).first()
        
        # Extract values (handle None from empty result sets)
        total_messages = (current.total_messages or 0) if current else 0
        bot_responses = (current.bot_responses or 0) if current else 0
        active_users = (current.active_users or 0) if current else 0
        ai_triggers = (current.ai_triggers or 0) if current else 0
        
        total_messages_prev = (previous.total_messages or 0) if previous else 0
        bot_responses_prev = (previous.bot_responses or 0) if previous else 0
        ai_triggers_prev = (previous.ai_triggers or 0) if previous else 0
        
        # Calculate percentage changes
        messages_change = StatsService._calc_change(total_messages, total_messages_prev)
        bot_responses_change = StatsService._calc_change(bot_responses, bot_responses_prev)
        ai_triggers_change = StatsService._calc_change(ai_triggers, ai_triggers_prev)
        
        return OverviewStats(
            messages_received=KPICard(
                label="Messages reçus",
                value=total_messages,
                description=f"Nombre total de messages ({days} jours)",
                change_percent=messages_change
            ),
            bot_responses=KPICard(
                label="Réponses du bot",
                value=bot_responses,
                description="Messages envoyés par le bot",
                change_percent=bot_responses_change
            ),
            active_users=KPICard(
                label="Utilisateurs actifs",
                value=active_users,
                description="Utilisateurs uniques ayant envoyé un message"
            ),
            ai_triggers=KPICard(
                label="Déclenchements IA",
                value=ai_triggers,
                description="Requêtes IA traitées",
                change_percent=ai_triggers_change
            ),
            workflows_executed=KPICard(
                label="Workflows exécutés",
                value=0,
                description="Workflows automatisés (À venir)"
            ),
            timestamp=datetime.utcnow(),
            period_days=days
        )

    @staticmethod
    def get_daily_volumes(db: Session, server_id: str, days: int = 30) -> DailyVolumesResponse:
        """
        Get daily message volumes for graphing (stacked bar chart)
        
        Args:
            db: Database session
            server_id: Discord server ID
            days: Number of days to look back (default 30)
        
        Returns:
            DailyVolumesResponse with daily breakdown
        """
        date_limit = datetime.utcnow() - timedelta(days=days)
        
        # Query daily volumes using SQLAlchemy
        daily_stats = db.query(
            func.date(MessageLog.timestamp).label("day"),
            func.count(MessageLog.id).label("total"),
            func.sum(func.cast(MessageLog.is_ai_triggered, Integer)).label("ai_triggered")
        ).filter(
            MessageLog.server_id == server_id,
            MessageLog.timestamp >= date_limit,
            MessageLog.is_bot_response == False  # Only user messages
        ).group_by(
            func.date(MessageLog.timestamp)
        ).order_by("day").all()
        
        # Build response list
        daily_volumes = []
        for day, total, ai_triggered in daily_stats:
            day_str = day.isoformat() if hasattr(day, 'isoformat') else str(day)
            ai_triggered_count = ai_triggered if ai_triggered is not None else 0
            standard_count = total - ai_triggered_count
            
            daily_volumes.append(DailyVolume(
                day=day_str,
                total_messages=total,
                ai_triggered_messages=ai_triggered_count,
                standard_messages=standard_count
            ))
        
        return DailyVolumesResponse(
            data=daily_volumes,
            server_id=server_id,
            period_days=days,
            timestamp=datetime.utcnow()
        )

    @staticmethod
    def get_leaderboards(db: Session, server_id: str, limit: int = 5) -> LeaderboardsResponse:
        """
        Get top users and channels leaderboards
        
        Args:
            db: Database session
            server_id: Discord server ID
            limit: Maximum number of items in each leaderboard (default 5)
        
        Returns:
            LeaderboardsResponse with top users and channels
        """
        # Top users by message count
        top_users_data = db.query(
            User.id,
            User.username,
            func.count(MessageLog.id).label("message_count"),
            func.sum(func.cast(MessageLog.is_ai_triggered, Integer)).label("ai_triggered")
        ).join(
            MessageLog, User.id == MessageLog.user_id
        ).filter(
            MessageLog.server_id == server_id,
            MessageLog.is_bot_response == False  # Exclude bot messages
        ).group_by(
            User.id, User.username
        ).order_by(
            desc("message_count")
        ).limit(limit).all()
        
        # Top channels by message count
        top_channels_data = db.query(
            Channel.id,
            Channel.name,
            func.count(MessageLog.id).label("message_count"),
            func.sum(func.cast(MessageLog.is_ai_triggered, Integer)).label("ai_triggered")
        ).join(
            MessageLog, Channel.id == MessageLog.channel_id
        ).filter(
            MessageLog.server_id == server_id,
            MessageLog.is_bot_response == False
        ).group_by(
            Channel.id, Channel.name
        ).order_by(
            desc("message_count")
        ).limit(limit).all()
        
        # Build users list
        top_users = []
        for rank, (user_id, username, msg_count, ai_count) in enumerate(top_users_data, 1):
            top_users.append(UserLeaderboard(
                rank=rank,
                user_id=user_id,
                username=username,
                message_count=msg_count,
                ai_triggered_count=ai_count if ai_count is not None else 0
            ))
        
        # Build channels list
        top_channels = []
        for rank, (channel_id, name, msg_count, ai_count) in enumerate(top_channels_data, 1):
            top_channels.append(ChannelLeaderboard(
                rank=rank,
                channel_id=channel_id,
                channel_name=name,
                message_count=msg_count,
                ai_triggered_count=ai_count if ai_count is not None else 0
            ))
        
        return LeaderboardsResponse(
            top_users=top_users,
            top_channels=top_channels,
            server_id=server_id,
            timestamp=datetime.utcnow(),
            limit=limit
        )

    @staticmethod
    def _calc_change(current: int, previous: int) -> Optional[float]:
        """
        Calculate percentage change between two periods
        
        Args:
            current: Current period value
            previous: Previous period value
        
        Returns:
            Percentage change or None if previous was 0
        """
        if previous == 0:
            return None if current == 0 else 100.0
        return round(((current - previous) / previous) * 100, 2)
