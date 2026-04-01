"""
Database logging service for Discord messages
"""
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database import SessionLocal
from app.models import Server, User, Channel, MessageLog

logger = logging.getLogger(__name__)


class MessageLogger:
    """Service for logging Discord messages to database"""
    
    @staticmethod
    def get_session() -> Session:
        """Get a new database session"""
        return SessionLocal()
    
    @staticmethod
    def ensure_server(db: Session, server_id: str, server_name: str) -> Server:
        """
        Ensure server exists in database, create if needed
        
        Args:
            db: Database session
            server_id: Discord server ID
            server_name: Server name from Discord
        
        Returns:
            Server instance
        """
        try:
            server = db.query(Server).filter(Server.id == server_id).first()
            
            if not server:
                server = Server(
                    id=server_id,
                    name=server_name,
                    is_active=True
                )
                db.add(server)
                db.flush()
                logger.info(f"✓ Created server: {server_name} ({server_id})")
            
            return server
        except SQLAlchemyError as e:
            logger.error(f"Error ensuring server: {str(e)}")
            raise
    
    @staticmethod
    def ensure_user(db: Session, user_id: str, username: str) -> User:
        """
        Ensure user exists in database, create if needed
        
        Args:
            db: Database session
            user_id: Discord user ID
            username: Discord username
        
        Returns:
            User instance
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                user = User(
                    id=user_id,
                    username=username
                )
                db.add(user)
                db.flush()
                logger.debug(f"✓ Created user: {username} ({user_id})")
            elif user.username != username:
                # Update username if changed
                user.username = username
                db.flush()
            
            return user
        except SQLAlchemyError as e:
            logger.error(f"Error ensuring user: {str(e)}")
            raise
    
    @staticmethod
    def ensure_channel(db: Session, channel_id: str, channel_name: str) -> Channel:
        """
        Ensure channel exists in database, create if needed
        
        Args:
            db: Database session
            channel_id: Discord channel ID
            channel_name: Channel name from Discord
        
        Returns:
            Channel instance
        """
        try:
            channel = db.query(Channel).filter(Channel.id == channel_id).first()
            
            if not channel:
                channel = Channel(
                    id=channel_id,
                    name=channel_name
                )
                db.add(channel)
                db.flush()
                logger.debug(f"✓ Created channel: {channel_name} ({channel_id})")
            elif channel.name != channel_name:
                # Update channel name if changed
                channel.name = channel_name
                db.flush()
            
            return channel
        except SQLAlchemyError as e:
            logger.error(f"Error ensuring channel: {str(e)}")
            raise
    
    @staticmethod
    def log_user_message(
        server_id: str,
        server_name: str,
        user_id: str,
        username: str,
        channel_id: str,
        channel_name: str,
        timestamp: datetime,
        is_ai_triggered: bool = False
    ) -> bool:
        """
        Log a user message to database
        
        Args:
            server_id: Discord server ID
            server_name: Server name
            user_id: Discord user ID
            username: Discord username
            channel_id: Discord channel ID
            channel_name: Channel name
            timestamp: Message timestamp
            is_ai_triggered: Whether this message triggers AI
        
        Returns:
            True if successful, False otherwise
        """
        db = MessageLogger.get_session()
        
        try:
            # Ensure entities exist
            MessageLogger.ensure_server(db, server_id, server_name)
            MessageLogger.ensure_user(db, user_id, username)
            MessageLogger.ensure_channel(db, channel_id, channel_name)
            
            # Create log entry
            log_entry = MessageLog(
                server_id=server_id,
                user_id=user_id,
                channel_id=channel_id,
                timestamp=timestamp,
                is_bot_response=False,
                is_ai_triggered=is_ai_triggered
            )
            
            db.add(log_entry)
            db.commit()
            
            logger.debug(f"Logged user message from {username} in #{channel_name}")
            return True
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Error logging user message: {str(e)}")
            return False
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error logging user message: {str(e)}")
            return False
        finally:
            db.close()
    
    @staticmethod
    def log_bot_response(
        server_id: str,
        bot_id: str,
        bot_name: str,
        channel_id: str,
        channel_name: str,
        timestamp: datetime
    ) -> bool:
        """
        Log a bot response to database
        
        Args:
            server_id: Discord server ID
            bot_id: Bot user ID
            bot_name: Bot username
            channel_id: Discord channel ID
            channel_name: Channel name
            timestamp: Response timestamp
        
        Returns:
            True if successful, False otherwise
        """
        db = MessageLogger.get_session()
        
        try:
            # Ensure bot user exists
            MessageLogger.ensure_user(db, bot_id, bot_name)
            
            # Create log entry
            log_entry = MessageLog(
                server_id=server_id,
                user_id=bot_id,
                channel_id=channel_id,
                timestamp=timestamp,
                is_bot_response=True,
                is_ai_triggered=True  # Bot responses from AI
            )
            
            db.add(log_entry)
            db.commit()
            
            logger.debug(f"Logged bot response in #{channel_name}")
            return True
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Error logging bot response: {str(e)}")
            return False
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error logging bot response: {str(e)}")
            return False
        finally:
            db.close()
    
    @staticmethod
    def mark_as_ai_triggered(
        server_id: str,
        user_id: str,
        channel_id: str,
        timestamp: datetime
    ) -> bool:
        """
        Mark a message as AI-triggered
        
        Args:
            server_id: Discord server ID
            user_id: Discord user ID
            channel_id: Discord channel ID
            timestamp: Message timestamp
        
        Returns:
            True if successful, False otherwise
        """
        db = MessageLogger.get_session()
        
        try:
            # Find the most recent message from this user
            log_entry = db.query(MessageLog).filter(
                MessageLog.server_id == server_id,
                MessageLog.user_id == user_id,
                MessageLog.channel_id == channel_id,
                MessageLog.is_bot_response == False,
                MessageLog.timestamp == timestamp
            ).first()
            
            if log_entry:
                log_entry.is_ai_triggered = True
                db.commit()
                logger.debug(f"Marked message as AI-triggered")
                return True
            else:
                logger.warning(f"Could not find message to mark as AI-triggered")
                return False
            
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Error marking message as AI-triggered: {str(e)}")
            return False
        finally:
            db.close()
