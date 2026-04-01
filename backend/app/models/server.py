"""
Server model for Discord servers
"""
from sqlalchemy import Column, String, Boolean, DateTime, func
from datetime import datetime
from app.database import Base


class Server(Base):
    """
    SQLAlchemy model for Discord servers.
    
    Attributes:
        id: Discord server ID (snowflake)
        name: Server name
        is_active: Whether the bot is active on this server
        created_at: Timestamp when the server was added to the database
        updated_at: Timestamp of last update
    """
    __tablename__ = "servers"

    id = Column(String(50), primary_key=True, index=True, doc="Discord Server ID")
    name = Column(String(255), nullable=False, doc="Server name")
    is_active = Column(Boolean, default=True, doc="Bot activation status on this server")
    created_at = Column(DateTime, default=datetime.utcnow, doc="Creation timestamp")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, doc="Last update timestamp")

    def __repr__(self):
        return f"<Server(id={self.id}, name={self.name}, is_active={self.is_active})>"
