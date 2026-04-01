"""
Channel model for Discord channels
"""
from sqlalchemy import Column, String, DateTime, func
from datetime import datetime
from app.database import Base


class Channel(Base):
    """
    SQLAlchemy model for Discord channels.
    
    Attributes:
        id: Discord channel ID (snowflake)
        name: Channel name
        created_at: Timestamp when the channel was first seen
        updated_at: Timestamp of last update
    """
    __tablename__ = "channels"

    id = Column(String(50), primary_key=True, index=True, doc="Discord Channel ID")
    name = Column(String(255), nullable=False, index=True, doc="Channel name")
    created_at = Column(DateTime, default=datetime.utcnow, doc="Creation timestamp")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, doc="Last update timestamp")

    def __repr__(self):
        return f"<Channel(id={self.id}, name={self.name})>"
