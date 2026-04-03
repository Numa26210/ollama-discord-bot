"""
Bot Configuration and Utilities
"""
import os
import logging
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ==================== LOGGING CONFIGURATION ====================

# Absolute path to bot.log inside the bot/ directory
_BOT_LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bot.log")


def setup_logging(level: str = "INFO"):
    """Configure logging for the bot"""
    import sys
    log_level = getattr(logging, level.upper(), logging.INFO)
    
    stream_handler = logging.StreamHandler(sys.stderr)
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(_BOT_LOG_PATH, encoding='utf-8'),
            stream_handler
        ],
        force=True,  # override any earlier basicConfig call (e.g. from run_bot.py)
    )


# ==================== BOT CONFIGURATION ====================

class BotConfig:
    """Configuration for Discord bot"""
    
    # Bot credentials
    DISCORD_TOKEN = os.getenv("DISCORD_TOKEN", "")
    
    # Ollama configuration
    OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
    OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "60"))
    
    # Database
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "sqlite:///./discord_bot.db"
    )
    
    # Bot behavior
    COMMAND_PREFIX = os.getenv("COMMAND_PREFIX", "!")
    RESPONSE_MAX_TOKENS = int(os.getenv("RESPONSE_MAX_TOKENS", "512"))
    RESPONSE_TEMPERATURE = float(os.getenv("RESPONSE_TEMPERATURE", "0.7"))
    SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", "Tu es un assistant Discord utile et amical.")
    
    # Channels and features
    ALLOWED_CHANNEL_IDS: List[str] = []  # Empty = all channels
    AUTHORIZED_USERS: List[str] = []     # Empty = all users
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    @classmethod
    def validate(cls) -> bool:
        """Validate configuration"""
        if not cls.DISCORD_TOKEN:
            print("❌ ERROR: DISCORD_TOKEN not set in .env file")
            return False
        
        if not cls.OLLAMA_API_URL:
            print("❌ ERROR: OLLAMA_API_URL not set in .env file")
            return False
        
        return True
    
    @classmethod
    def print_config(cls):
        """Print current configuration"""
        print(f"""
╔════════════════════════════════════════════╗
║        🤖 BOT CONFIGURATION               ║
╠════════════════════════════════════════════╣
║ Discord Token:  {('*' * 20)}
║ Ollama URL:     {cls.OLLAMA_API_URL}
║ Ollama Model:   {cls.OLLAMA_MODEL}
║ Command Prefix: {cls.COMMAND_PREFIX}
║ Log Level:      {cls.LOG_LEVEL}
║ Max Tokens:     {cls.RESPONSE_MAX_TOKENS}
║ Temperature:    {cls.RESPONSE_TEMPERATURE}
╚════════════════════════════════════════════╝
        """)


# ==================== BOT CONSTANTS ====================

# Message length limits
MAX_DISCORD_MESSAGE_LENGTH = 2000
MIN_MESSAGE_LENGTH = 1

# Typing timeout (seconds) - how long to show "typing" indicator
TYPING_TIMEOUT = 0.5

# Mentions and mentions patterns
MENTION_PREFIX = "@"
MENTION_EVERYONE = "@everyone"
MENTION_HERE = "@here"

# Response prefixes (optional)
RESPONSE_PREFIX = ""
RESPONSE_SUFFIX = ""  # Could be something like " 🤖"

# Rate limiting
MAX_REQUESTS_PER_MINUTE = 30
REQUEST_COOLDOWN_SECONDS = 2  # Per user


# ==================== UTILITY FUNCTIONS ====================

def split_message(text: str, max_length: int = MAX_DISCORD_MESSAGE_LENGTH) -> List[str]:
    """
    Split long text into Discord message chunks
    
    Args:
        text: Text to split
        max_length: Maximum length per message (default Discord limit)
    
    Returns:
        List of message chunks
    """
    if len(text) <= max_length:
        return [text]
    
    messages = []
    paragraphs = text.split('\n\n')
    current_msg = ""
    
    for paragraph in paragraphs:
        # If single paragraph is too long, split it
        if len(paragraph) > max_length:
            # Add current message if not empty
            if current_msg:
                messages.append(current_msg)
                current_msg = ""
            
            # Split paragraph by words
            words = paragraph.split()
            temp = ""
            for word in words:
                if len(temp) + len(word) + 1 <= max_length - 10:
                    temp += word + " "
                else:
                    if temp:
                        messages.append(temp.strip())
                    temp = word + " "
            if temp:
                messages.append(temp.strip())
        else:
            # Try to add paragraph to current message
            test_msg = current_msg + "\n\n" + paragraph if current_msg else paragraph
            if len(test_msg) <= max_length:
                current_msg = test_msg
            else:
                if current_msg:
                    messages.append(current_msg)
                current_msg = paragraph
    
    # Add remaining message
    if current_msg:
        messages.append(current_msg)
    
    return messages if messages else [""]


def is_mention(message_content: str, bot_name: str) -> bool:
    """
    Check if message mentions the bot
    
    Args:
        message_content: Message content
        bot_name: Bot username
    
    Returns:
        True if bot is mentioned
    """
    return (
        f"<@bot_id>" in message_content or
        f"@{bot_name}" in message_content or
        message_content.startswith(bot_name)
    )


def extract_mention_context(message_content: str, bot_name: str) -> str:
    """
    Extract the actual query from a mention
    
    Args:
        message_content: Message content
        bot_name: Bot username
    
    Returns:
        Extracted query without mention
    """
    # Remove various mention formats
    content = message_content.replace(f"<@", "").replace(f">", "")
    content = content.replace(f"@{bot_name}", "").strip()
    return content


# ==================== LOGGING SETUP ====================

setup_logging(BotConfig.LOG_LEVEL)
logger = logging.getLogger(__name__)
