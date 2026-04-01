"""
MessageLog model for logging Discord messages and bot interactions
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Index, func
from datetime import datetime
from app.database import Base


class MessageLog(Base):
    """
    SQLAlchemy model for message logging.
    
    Attributes:
        id: Primary key (auto-increment)
        server_id: Discord server ID (Foreign Key to servers table)
        user_id: Discord user ID (Foreign Key to users table)
        channel_id: Discord channel ID (Foreign Key to channels table)
        timestamp: When the message was sent/received
        is_bot_response: True if this is a bot response, False if user message
        is_ai_triggered: True if the message triggered AI processing
        created_at: When this log entry was created in the database
    """
    __tablename__ = "message_logs"
    __table_args__ = (
        Index('ix_message_logs_server_timestamp', 'server_id', 'timestamp'),
        Index('ix_message_logs_server_user', 'server_id', 'user_id'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True, doc="Primary Key")
    server_id = Column(String(50), ForeignKey("servers.id"), nullable=False, index=True, doc="Discord Server ID")
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True, doc="Discord User ID")
    channel_id = Column(String(50), ForeignKey("channels.id"), nullable=False, index=True, doc="Discord Channel ID")
    timestamp = Column(DateTime, nullable=False, index=True, doc="Message timestamp")
    is_bot_response = Column(Boolean, default=False, nullable=False, doc="Is this a bot response?")
    is_ai_triggered = Column(Boolean, default=False, nullable=False, doc="Did this message trigger AI?")
    created_at = Column(DateTime, default=datetime.utcnow, doc="Database entry creation timestamp")

    def __repr__(self):
        return (
            f"<MessageLog(id={self.id}, server_id={self.server_id}, user_id={self.user_id}, "
            f"channel_id={self.channel_id}, is_bot_response={self.is_bot_response}, "
            f"is_ai_triggered={self.is_ai_triggered})>"
        )
