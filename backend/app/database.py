"""
Database configuration and session management
"""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database URL configuration — use an absolute path so both bot and backend
# share the same SQLite file regardless of the working directory.
_default_db = "sqlite:///" + str(Path(__file__).resolve().parent.parent / "discord_bot.db")
DATABASE_URL = os.getenv("DATABASE_URL", _default_db)

# Create engine
if DATABASE_URL.startswith("sqlite"):
    # SQLite specific configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=os.getenv("SQL_ECHO", "False") == "True"
    )
else:
    # PostgreSQL or other databases
    engine = create_engine(
        DATABASE_URL,
        echo=os.getenv("SQL_ECHO", "False") == "True"
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()


def get_db():
    """Dependency for FastAPI to inject database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize the database by creating all tables"""
    Base.metadata.create_all(bind=engine)
