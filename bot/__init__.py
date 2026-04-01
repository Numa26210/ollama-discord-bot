"""
Discord Bot Package
Main entry point and utilities
"""
from bot.main import create_bot, run_bot, DiscordAIBot
from bot.ollama_client import OllamaClient
from bot.message_logger import MessageLogger
from bot.config import BotConfig

__all__ = [
    "create_bot",
    "run_bot",
    "DiscordAIBot",
    "OllamaClient",
    "MessageLogger",
    "BotConfig"
]
