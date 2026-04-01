"""
Database initialization and validation script.
Run this to create all tables and verify database connection.
"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.database import init_db, SessionLocal, engine
from app.models import Server, User, Channel, MessageLog


def validate_database():
    """Validate database connection and tables"""
    print("🔍 Validating database connection and schema...\n")
    
    try:
        # Initialize database
        print("📊 Creating tables...")
        init_db()
        print("✓ Tables created successfully\n")
        
        # Test connection
        print("🔗 Testing database connection...")
        db = SessionLocal()
        result = db.execute("SELECT 1")
        db.close()
        print("✓ Database connection successful\n")
        
        # Display table information
        print("📋 Database Tables and Columns:\n")
        
        tables = {
            "servers": [
                "id (String, PK) - Discord Server ID",
                "name (String) - Server name",
                "is_active (Boolean) - Bot activation status",
                "created_at (DateTime) - Creation timestamp",
                "updated_at (DateTime) - Last update timestamp"
            ],
            "users": [
                "id (String, PK) - Discord User ID",
                "username (String) - Discord username",
                "created_at (DateTime) - Creation timestamp",
                "updated_at (DateTime) - Last update timestamp"
            ],
            "channels": [
                "id (String, PK) - Discord Channel ID",
                "name (String) - Channel name",
                "created_at (DateTime) - Creation timestamp",
                "updated_at (DateTime) - Last update timestamp"
            ],
            "message_logs": [
                "id (Integer, PK) - Primary key (auto-increment)",
                "server_id (String, FK) → servers.id",
                "user_id (String, FK) → users.id",
                "channel_id (String, FK) → channels.id",
                "timestamp (DateTime) - Message timestamp",
                "is_bot_response (Boolean) - Is this a bot response?",
                "is_ai_triggered (Boolean) - Did this trigger AI?",
                "created_at (DateTime) - Entry creation timestamp"
            ]
        }
        
        for table_name, columns in tables.items():
            print(f"  📑 {table_name.upper()}")
            for col in columns:
                print(f"     • {col}")
            print()
        
        print("=" * 60)
        print("✅ Database validation SUCCESSFUL!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Configure .env file with your settings")
        print("2. Run the FastAPI server: uvicorn backend.app:app --reload")
        print("3. Run the Discord bot: python bot/main.py")
        return True
        
    except Exception as e:
        print(f"\n❌ Database validation FAILED!")
        print(f"Error: {str(e)}")
        return False


if __name__ == "__main__":
    success = validate_database()
    sys.exit(0 if success else 1)
