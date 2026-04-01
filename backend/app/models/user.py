"""
User model for Discord users
"""
from sqlalchemy import Column, String, DateTime, func
from datetime import datetime
from app.database import Base


class User(Base):
    """
    SQLAlchemy model for Discord users.
    
    Attributes:
        id: Discord user ID (snowflake)
        username: User's Discord username
        created_at: Timestamp when the user was first seen
        updated_at: Timestamp of last update
    """
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True, doc="Discord User ID")
    username = Column(String(255), nullable=False, index=True, doc="Discord username")
    created_at = Column(DateTime, default=datetime.utcnow, doc="Creation timestamp")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, doc="Last update timestamp")

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username})>"
