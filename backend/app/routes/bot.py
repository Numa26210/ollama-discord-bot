"""
FastAPI routes for bot management endpoints
"""
import os
from typing import List
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Server
from app.schemas import BotToggleRequest, BotToggleResponse, ErrorResponse

router = APIRouter(prefix="/api/bot", tags=["bot management"])

# API key for write operations (set via environment variable)
_API_KEY = os.getenv("API_KEY", "")


def verify_api_key(x_api_key: str = Header(default="")):
    """Verify API key header for protected routes."""
    if _API_KEY and x_api_key != _API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key",
        )


@router.post(
    "/toggle",
    response_model=BotToggleResponse,
    responses={404: {"model": ErrorResponse}},
    dependencies=[Depends(verify_api_key)],
)
def toggle_bot(
    request: BotToggleRequest,
    db: Session = Depends(get_db)
):
    """
    Toggle bot activation status on a server.
    
    Activate or deactivate the bot on a specific Discord server.
    
    **Request body:**
    - `server_id`: Discord server ID
    - `is_active`: True to activate, False to deactivate
    """
    # Find or create server
    server = db.query(Server).filter(Server.id == request.server_id).first()
    
    if not server:
        # Create new server if it doesn't exist
        server = Server(
            id=request.server_id,
            name=f"Server {request.server_id}",
            is_active=request.is_active
        )
        db.add(server)
    else:
        # Update existing server
        server.is_active = request.is_active
    
    db.commit()
    db.refresh(server)
    
    # Determine action message
    action = "activated" if request.is_active else "deactivated"
    message = f"Bot {action} on server {request.server_id}"
    
    return BotToggleResponse(
        server_id=request.server_id,
        is_active=request.is_active,
        message=message,
        timestamp=datetime.utcnow()
    )


@router.get(
    "/status/{server_id}",
    response_model=BotToggleResponse,
    responses={404: {"model": ErrorResponse}}
)
def get_bot_status(
    server_id: str,
    db: Session = Depends(get_db)
):
    """
    Get current bot status for a server.
    
    **Parameters:**
    - `server_id`: Discord server ID
    """
    server = db.query(Server).filter(Server.id == server_id).first()
    
    if not server:
        return BotToggleResponse(
            server_id=server_id,
            is_active=False,
            message="Server not yet registered — bot is inactive by default",
            timestamp=datetime.utcnow()
        )
    
    return BotToggleResponse(
        server_id=server.id,
        is_active=server.is_active,
        message=f"Bot is currently {'active' if server.is_active else 'inactive'}",
        timestamp=datetime.utcnow()
    )


@router.get("/servers", tags=["bot management"])
def list_servers(db: Session = Depends(get_db)):
    """
    List all known Discord servers.
    Used by the frontend to auto-detect the server ID on fresh installs.
    """
    servers = db.query(Server).order_by(Server.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "is_active": s.is_active,
        }
        for s in servers
    ]
