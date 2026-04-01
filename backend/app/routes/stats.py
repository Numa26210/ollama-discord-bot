"""
FastAPI routes for statistics endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import StatsService
from app.schemas import (
    OverviewStats, DailyVolumesResponse, LeaderboardsResponse
)

router = APIRouter(prefix="/api/servers", tags=["statistics"])


@router.get(
    "/{server_id}/stats/overview",
    response_model=OverviewStats,
)
def get_overview_stats(
    server_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    """
    Get overview statistics (KPIs) for a server.
    
    Returns:
    - Messages received
    - Bot responses
    - Active users
    - AI triggers
    - Percentage changes from previous period
    
    **Parameters:**
    - `server_id`: Discord server ID
    - `days`: Number of days to look back (1-365, default 30)
    """
    # Get statistics (returns zeroed KPIs when the server has no data yet)
    stats = StatsService.get_overview_stats(db, server_id, days)
    return stats


@router.get(
    "/{server_id}/stats/daily-volumes",
    response_model=DailyVolumesResponse,
)
def get_daily_volumes(
    server_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    """
    Get daily message volumes for stacked bar chart visualization.
    
    Returns daily breakdown of:
    - Total messages
    - AI-triggered messages
    - Standard messages
    
    **Parameters:**
    - `server_id`: Discord server ID
    - `days`: Number of days to look back (1-365, default 30)
    """
    # Get daily volumes (returns empty list when the server has no data yet)
    volumes = StatsService.get_daily_volumes(db, server_id, days)
    return volumes


@router.get(
    "/{server_id}/stats/leaderboards",
    response_model=LeaderboardsResponse,
)
def get_leaderboards(
    server_id: str,
    limit: int = Query(5, ge=1, le=50, description="Number of top items to return"),
    db: Session = Depends(get_db)
):
    """
    Get top users and channels leaderboards.
    
    Returns:
    - Top users by message count
    - Top channels by message count
    - Ranked with AI trigger statistics
    
    **Parameters:**
    - `server_id`: Discord server ID
    - `limit`: Number of top items in each leaderboard (1-50, default 5)
    """
    # Get leaderboards (returns empty lists when the server has no data yet)
    leaderboards = StatsService.get_leaderboards(db, server_id, limit)
    return leaderboards
