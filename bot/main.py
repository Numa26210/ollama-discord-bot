"""
Discord Bot Main Application
Handles Discord events and AI integration
"""
import sys
import io
from pathlib import Path

# Fix Windows CP1252 console: force UTF-8 so emojis in logs don't crash
if sys.stdout and hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Also patch any already-created logging StreamHandlers to use the wrapped streams
import logging as _logging
for _h in _logging.root.handlers:
    if isinstance(_h, _logging.StreamHandler) and not isinstance(_h, _logging.FileHandler):
        _h.setStream(sys.stderr)

# Ensure project root and backend are on sys.path
_project_root = Path(__file__).resolve().parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))
if str(_project_root / "backend") not in sys.path:
    sys.path.insert(0, str(_project_root / "backend"))

import discord
import asyncio
import logging
from datetime import datetime
from discord.ext import commands

from config import BotConfig, split_message, is_mention, extract_mention_context
from ollama_client import OllamaClient
from message_logger import MessageLogger

logger = logging.getLogger(__name__)


def _load_custom_commands() -> dict:
    """Load custom commands from commands.json, returns {name: response}"""
    import json
    cmd_file = Path(__file__).resolve().parent.parent / "commands.json"
    if not cmd_file.exists():
        return {}
    try:
        raw = json.loads(cmd_file.read_text(encoding="utf-8"))
        return {
            c["name"]: c["response"]
            for c in raw
            if c.get("type") == "custom" and c.get("is_enabled", True) and c.get("response")
        }
    except Exception:
        return {}


class DiscordAIBot(commands.Cog):
    """Main bot class with Discord event handlers"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.ollama_client = None
        self.logger = MessageLogger()
    
    @commands.Cog.listener()
    async def on_ready(self):
        """Called when bot is ready and connected"""
        logger.info(f"✅ Bot logged in as {self.bot.user.name}")
        logger.info(f"Bot ID: {self.bot.user.id}")
        logger.info(f"Connected to {len(self.bot.guilds)} server(s)")
        
        # Initialize Ollama client with persistent session
        self.ollama_client = OllamaClient(
            base_url=BotConfig.OLLAMA_API_URL,
            model=BotConfig.OLLAMA_MODEL,
            timeout=BotConfig.OLLAMA_TIMEOUT
        )
        await self.ollama_client.open_session()
        
        # Change bot status
        await self.bot.change_presence(
            activity=discord.Activity(
                type=discord.ActivityType.watching,
                name="Discord messages | !help"
            )
        )
        
        logger.info("🚀 Bot ready to handle messages")

    async def cog_unload(self):
        """Cleanup when cog is unloaded"""
        if self.ollama_client:
            await self.ollama_client.close_session()
            logger.info("Ollama session closed")

    # ==================== COMMANDS ====================

    @commands.command(name="ping")
    async def cmd_ping(self, ctx: commands.Context):
        """Vérifie la latence du bot"""
        latency_ms = round(self.bot.latency * 1000)
        await ctx.reply(f"🏓 Pong ! Latence : **{latency_ms} ms**", mention_author=False)

    @commands.command(name="ask")
    @commands.cooldown(1, 5, commands.BucketType.user)
    async def cmd_ask(self, ctx: commands.Context, *, question: str):
        """Pose une question à l'IA Ollama"""
        if not self.ollama_client or not self.ollama_client.session:
            await ctx.reply("❌ Le client Ollama n'est pas initialisé.", mention_author=False)
            return

        async with ctx.typing():
            response = await self._get_ai_response(question)
            if not response:
                await ctx.reply("❌ Impossible de générer une réponse. Réessaie plus tard.", mention_author=False)
                return

            for part in split_message(response):
                await ctx.reply(part, mention_author=False)

        # Log as AI-triggered
        if ctx.guild:
            await asyncio.to_thread(
                self.logger.log_user_message,
                server_id=str(ctx.guild.id),
                server_name=ctx.guild.name,
                user_id=str(ctx.author.id),
                username=str(ctx.author),
                channel_id=str(ctx.channel.id),
                channel_name=ctx.channel.name,
                timestamp=ctx.message.created_at,
                is_ai_triggered=True,
            )

    @commands.command(name="summarize")
    @commands.cooldown(1, 10, commands.BucketType.user)
    async def cmd_summarize(self, ctx: commands.Context, n: int = 20):
        """Résume les n derniers messages du canal"""
        if not self.ollama_client or not self.ollama_client.session:
            await ctx.reply("❌ Le client Ollama n'est pas initialisé.", mention_author=False)
            return

        n = max(2, min(n, 100))  # clamp between 2 and 100
        async with ctx.typing():
            messages = []
            async for msg in ctx.channel.history(limit=n + 1):  # +1 to skip the command itself
                if msg.id == ctx.message.id:
                    continue
                messages.append(f"{msg.author.display_name}: {msg.content}")
            messages.reverse()

            if not messages:
                await ctx.reply("Aucun message à résumer.", mention_author=False)
                return

            conversation = "\n".join(messages)
            prompt = (
                f"Résume de manière concise la conversation Discord suivante "
                f"({len(messages)} messages). Réponds en français :\n\n{conversation}"
            )
            response = await self._get_ai_response(prompt)
            if not response:
                await ctx.reply("❌ Impossible de générer le résumé.", mention_author=False)
                return

            header = f"📝 **Résumé des {len(messages)} derniers messages :**\n\n"
            for part in split_message(header + response):
                await ctx.reply(part, mention_author=False)

    @commands.command(name="model")
    @commands.cooldown(1, 3, commands.BucketType.user)
    async def cmd_model(self, ctx: commands.Context, *, name: str = ""):
        """Affiche ou change le modèle Ollama actif"""
        if not name:
            await ctx.reply(
                f"🧠 Modèle actif : **{self.ollama_client.model if self.ollama_client else BotConfig.OLLAMA_MODEL}**",
                mention_author=False
            )
            return

        if self.ollama_client:
            old_model = self.ollama_client.model
            self.ollama_client.model = name
            await ctx.reply(
                f"✅ Modèle changé : **{old_model}** → **{name}**",
                mention_author=False
            )
            logger.info(f"Model changed from {old_model} to {name} by {ctx.author}")
        else:
            await ctx.reply("❌ Le client Ollama n'est pas initialisé.", mention_author=False)

    @commands.command(name="clear")
    @commands.has_permissions(manage_messages=True)
    @commands.cooldown(1, 5, commands.BucketType.user)
    async def cmd_clear(self, ctx: commands.Context, n: int = 5):
        """Supprime les n derniers messages (admin)"""
        n = max(1, min(n, 100))
        deleted = await ctx.channel.purge(limit=n + 1)  # +1 for the command message
        confirm = await ctx.send(f"🗑️ {len(deleted) - 1} message(s) supprimé(s).")
        await asyncio.sleep(3)
        await confirm.delete()

    # Global cog error handler for cooldowns, permissions, missing args
    async def cog_command_error(self, ctx: commands.Context, error):
        if isinstance(error, commands.CommandOnCooldown):
            await ctx.reply(
                f"⏳ Cooldown ! Réessaie dans **{error.retry_after:.1f}s**.",
                mention_author=False
            )
        elif isinstance(error, commands.MissingPermissions):
            await ctx.reply("🚫 Tu n'as pas la permission.", mention_author=False)
        elif isinstance(error, commands.MissingRequiredArgument):
            await ctx.reply(f"❌ Argument manquant : `{error.param.name}`", mention_author=False)
        else:
            raise error

    # ==================== EVENT LISTENERS ====================

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        """
        Main message handler
        Processes incoming messages and triggers AI if needed
        """
        # Ignore own messages
        if message.author == self.bot.user:
            return
        
        # Ignore bot messages
        if message.author.bot:
            return

        # Skip messages that are commands (they're handled by command handlers)
        ctx = await self.bot.get_context(message)
        if ctx.valid:
            return

        # Check for custom commands (prefix + name, not registered in discord.py)
        prefix = BotConfig.COMMAND_PREFIX
        if message.content.startswith(prefix):
            cmd_name = message.content[len(prefix):].split()[0].lower() if message.content[len(prefix):].strip() else ""
            if cmd_name:
                custom_cmds = _load_custom_commands()
                if cmd_name in custom_cmds:
                    await message.reply(custom_cmds[cmd_name], mention_author=False)
                    logger.info(f"Custom command !{cmd_name} triggered by {message.author}")
                    return
        
        # Skip if no server context
        if not message.guild:
            logger.warning("Message without guild context received")
            return
        
        try:
            # Extract information
            server_id = str(message.guild.id)
            server_name = message.guild.name
            user_id = str(message.author.id)
            username = str(message.author)
            channel_id = str(message.channel.id)
            channel_name = message.channel.name
            message_timestamp = message.created_at
            
            logger.info(
                f"📨 Message from {username} in #{channel_name}: "
                f"{message.content[:50]}..."
            )
            
            # Check if bot is active on this server
            if not await self._is_bot_active(server_id):
                logger.debug(f"Bot not active on server {server_id}")
                return
            
            # Log the incoming message (offloaded to thread — non-blocking)
            await asyncio.to_thread(
                self.logger.log_user_message,
                server_id=server_id,
                server_name=server_name,
                user_id=user_id,
                username=username,
                channel_id=channel_id,
                channel_name=channel_name,
                timestamp=message_timestamp,
                is_ai_triggered=False,
            )
            
            # Check if message should trigger AI
            should_trigger_ai = await self._should_trigger_ai(message)
            
            if not should_trigger_ai:
                logger.debug("Message doesn't trigger AI")
                return
            
            logger.info(f"🤖 AI triggered for message from {username}")
            
            # Update log to mark as AI-triggered (offloaded to thread)
            await asyncio.to_thread(
                self.logger.mark_as_ai_triggered,
                server_id=server_id,
                user_id=user_id,
                channel_id=channel_id,
                timestamp=message_timestamp,
            )
            
            # Show typing indicator
            async with message.channel.typing():
                # Extract the actual query (remove mention if present)
                query = extract_mention_context(message.content, self.bot.user.name)
                query = query or message.content
                
                logger.debug(f"Query to Ollama: {query[:100]}...")
                
                # Get response from Ollama
                response = await self._get_ai_response(query)
                
                if not response:
                    logger.warning("Ollama returned empty response")
                    await message.reply(
                        "❌ Sorry, I couldn't generate a response. Please try again.",
                        mention_author=False
                    )
                    return
                
                # Log bot response (offloaded to thread)
                response_timestamp = datetime.utcnow()
                await asyncio.to_thread(
                    self.logger.log_bot_response,
                    server_id=server_id,
                    bot_id=str(self.bot.user.id),
                    bot_name=str(self.bot.user),
                    channel_id=channel_id,
                    channel_name=channel_name,
                    timestamp=response_timestamp,
                )
                
                # Split message if too long
                response_parts = split_message(response)
                
                logger.info(
                    f"📤 Sending response ({len(response_parts)} part(s)) "
                    f"to {username}"
                )
                
                # Send response parts
                for i, part in enumerate(response_parts):
                    if i == 0:
                        # First message as reply to original
                        await message.reply(part, mention_author=False)
                    else:
                        # Subsequent parts as regular messages
                        await message.channel.send(part)
                
                logger.info(f"✅ Response sent to {username}")
        
        except discord.Forbidden:
            logger.error("No permission to send message")
        except discord.HTTPException as e:
            logger.error(f"Discord HTTP error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in on_message: {str(e)}", exc_info=True)
    
    async def _should_trigger_ai(self, message: discord.Message) -> bool:
        """
        Determine if message should trigger AI response
        
        Args:
            message: Discord message
        
        Returns:
            True if AI should respond
        """
        # Don't respond to empty messages
        if not message.content or len(message.content.strip()) < 1:
            return False
        
        # Check if bot is mentioned
        if message.mentions and self.bot.user in message.mentions:
            return True
        
        # Check if message starts with mention
        if is_mention(message.content, self.bot.user.name):
            return True
        
        # Check if in allowed channels (if configured)
        if BotConfig.ALLOWED_CHANNEL_IDS:
            if str(message.channel.id) not in BotConfig.ALLOWED_CHANNEL_IDS:
                return False
        
        # Check if user is authorized (if configured)
        if BotConfig.AUTHORIZED_USERS:
            if str(message.author.id) not in BotConfig.AUTHORIZED_USERS:
                return False
        
        return False
    
    @staticmethod
    def _check_bot_active_sync(server_id: str) -> bool:
        """Synchronous DB check — runs in a thread via asyncio.to_thread"""
        from app.models import Server  # noqa: backend is on sys.path
        from app.database import SessionLocal
        db = SessionLocal()
        try:
            server = db.query(Server).filter(Server.id == server_id).first()
            return server.is_active if server else True
        finally:
            db.close()

    async def _is_bot_active(self, server_id: str) -> bool:
        """
        Check if bot is active on server (from database)
        Offloaded to a thread to avoid blocking the event loop.
        """
        try:
            return await asyncio.to_thread(self._check_bot_active_sync, server_id)
        except Exception as e:
            logger.error(f"Error checking bot status: {str(e)}")
            return True  # Default to True on error
    
    async def _get_ai_response(self, prompt: str) -> str:
        """
        Get response from Ollama AI using the persistent session.
        """
        if not self.ollama_client or not self.ollama_client.session:
            logger.error("Ollama client not initialized")
            return ""
        
        try:
            system_prompt = (
                "You are a helpful Discord bot assistant. "
                "Keep responses concise (under 200 words). "
                "Be friendly and conversational."
            )
            full_prompt = f"{system_prompt}\n\nUser: {prompt}"

            response = await self.ollama_client.generate(
                prompt=full_prompt,
                max_tokens=BotConfig.RESPONSE_MAX_TOKENS,
                temperature=BotConfig.RESPONSE_TEMPERATURE
            )
            return response or ""

        except Exception as e:
            logger.error(f"Error getting AI response: {str(e)}")
            return ""


def create_bot() -> commands.Bot:
    """
    Create and configure Discord bot.
    Uses setup_hook to register cogs once the event loop is running.
    """
    intents = discord.Intents.default()
    intents.message_content = True  # Required to read message content
    intents.members = True
    intents.guilds = True
    
    bot = commands.Bot(
        command_prefix=BotConfig.COMMAND_PREFIX,
        intents=intents,
        help_command=commands.DefaultHelpCommand()
    )
    
    @bot.event
    async def setup_hook():
        await bot.add_cog(DiscordAIBot(bot))
        logger.info("DiscordAIBot cog registered via setup_hook")
    
    return bot


def run_bot():
    """
    Main entry point - run the Discord bot
    """
    # Validate configuration
    if not BotConfig.validate():
        logger.error("Configuration validation failed")
        return
    
    # Initialize database tables (create if they don't exist)
    from app.database import init_db
    init_db()
    logger.info("Database initialized")
    
    # Reconfigure all logging StreamHandlers to use UTF-8 wrapped streams
    for h in logging.root.handlers:
        if isinstance(h, logging.StreamHandler) and not isinstance(h, logging.FileHandler):
            h.setStream(sys.stderr)
    
    # Print configuration
    BotConfig.print_config()
    
    # Create bot
    logger.info("Creating bot instance...")
    bot = create_bot()
    
    # Run bot
    logger.info(f"🚀 Starting bot with token: {BotConfig.DISCORD_TOKEN[:4]}***")
    try:
        bot.run(BotConfig.DISCORD_TOKEN)
    except discord.LoginFailure:
        logger.error("❌ Failed to login - check DISCORD_TOKEN in .env")
    except discord.PrivilegedIntentsRequired:
        logger.error(
            "❌ Bot requires privileged intents. "
            "Enable in Discord Developer Portal"
        )
    except Exception as e:
        logger.error(f"❌ Bot error: {str(e)}")


if __name__ == "__main__":
    run_bot()
