"""
Bot runner script
Execute this to start the Discord bot
"""
import os
import sys
import logging
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "backend"))
sys.path.insert(0, str(project_root))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def check_dependencies():
    """Check if all required dependencies are installed"""
    logger.info("✓ Checking dependencies...")
    
    required = ['discord', 'aiohttp', 'sqlalchemy', 'fastapi', 'pydantic']
    missing = []
    
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        logger.error(f"❌ Missing dependencies: {', '.join(missing)}")
        logger.error("Install with: pip install -r requirements.txt")
        return False
    
    logger.info("✓ All dependencies installed")
    return True


def check_configuration():
    """Check if bot is properly configured"""
    from dotenv import load_dotenv
    
    logger.info("✓ Checking configuration...")
    
    load_dotenv()
    
    token = os.getenv("DISCORD_TOKEN")
    ollama_url = os.getenv("OLLAMA_API_URL")
    
    if not token:
        logger.error("❌ Missing DISCORD_TOKEN in .env")
        return False
    
    if not ollama_url:
        logger.error("❌ Missing OLLAMA_API_URL in .env")
        logger.info("   Set it to: http://localhost:11434")
        return False
    
    logger.info("✓ Configuration valid")
    return True


def run():
    """Run the bot"""
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║             🤖 DISCORD AI BOT - STARTING                   ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    # Pre-flight checks
    if not check_dependencies():
        return False
    
    if not check_configuration():
        return False
    
    # Import and run bot
    try:
        from bot.main import run_bot
        
        logger.info("=" * 60)
        logger.info("🚀 Launching bot...")
        logger.info("=" * 60)
        
        run_bot()
        
    except KeyboardInterrupt:
        logger.info("\n⏹️ Bot stopped by user")
    except Exception as e:
        logger.error(f"❌ Error running bot: {str(e)}", exc_info=True)
        return False
    
    return True


if __name__ == "__main__":
    success = run()
    sys.exit(0 if success else 1)
