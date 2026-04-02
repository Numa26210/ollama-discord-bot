"""
Ollama AI Client
Manages asynchronous communication with Ollama API
"""
import aiohttp
import asyncio
import logging
from dataclasses import dataclass
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class OllamaResponse:
    """Holds both the final answer and optional thinking/reasoning."""
    text: str
    thinking: Optional[str] = None


class OllamaClient:
    """Client for communicating with Ollama API"""
    
    def __init__(self, base_url: str, model: str, timeout: int = 60):
        """
        Initialize Ollama client
        
        Args:
            base_url: Ollama API base URL (e.g., http://localhost:11434)
            model: Model name (e.g., 'mistral', 'llama2', 'neural-chat')
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.timeout = timeout
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def open_session(self):
        """Create a persistent aiohttp session (call once at startup)"""
        if not self.session:
            self.session = aiohttp.ClientSession()

    async def close_session(self):
        """Close the persistent aiohttp session (call on shutdown)"""
        if self.session:
            await self.session.close()
            self.session = None

    async def __aenter__(self):
        """Async context manager entry"""
        await self.open_session()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close_session()
    
    async def generate(
        self,
        prompt: str,
        max_tokens: int = 256,
        temperature: float = 0.7,
        top_p: float = 0.9
    ) -> Optional[OllamaResponse]:
        """
        Generate response from Ollama
        
        Returns:
            OllamaResponse with .text (final answer) and .thinking (reasoning, may be None)
        """
        if not self.session:
            logger.error("Session not initialized. Use 'async with OllamaClient(...) as client:'")
            return None
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "think": True,
            "options": {
                "temperature": temperature,
                "top_p": top_p,
                # num_predict caps the TOTAL output (thinking + response).
                # Thinking models need much more room so the actual answer
                # isn't truncated. We multiply by 4 to give headroom.
                "num_predict": max_tokens * 4,
            }
        }
        
        try:
            url = f"{self.base_url}/api/generate"
            
            logger.info(f"Calling Ollama: {url} with model {self.model}")
            
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            async with self.session.post(
                url,
                json=payload,
                timeout=timeout
            ) as response:
                if response.status != 200:
                    body = await response.text()
                    logger.error(
                        f"Ollama API error {response.status}: {body[:500]}"
                    )
                    return None
                
                data = await response.json()
                answer = data.get("response", "").strip()
                thinking = data.get("thinking", "").strip() or None

                # Thinking models: if response is empty, the answer is in thinking
                if not answer and thinking:
                    answer = thinking
                    thinking = None
                    logger.info("Model returned content only in 'thinking' field")

                if not answer:
                    logger.warning(f"Ollama returned empty response. Keys: {list(data.keys())}")
                    if data.get("error"):
                        logger.error(f"Ollama error: {data['error']}")
                    return None

                logger.info(
                    f"Ollama response received: {len(answer)} chars"
                    + (f" + {len(thinking)} chars thinking" if thinking else "")
                )
                return OllamaResponse(text=answer, thinking=thinking)
                
        except asyncio.TimeoutError:
            logger.error(f"Ollama request timeout after {self.timeout}s")
            return None
        except aiohttp.ClientConnectorError as e:
            logger.error(
                f"Ollama connection refused at {self.base_url} — "
                f"is Ollama running? Start it with 'ollama serve'. Detail: {e}"
            )
            return None
        except aiohttp.ClientError as e:
            logger.error(f"Ollama connection error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error calling Ollama: {str(e)}")
            return None
    
    async def health_check(self) -> bool:
        """
        Check if Ollama is running and accessible
        
        Returns:
            True if Ollama is healthy, False otherwise
        """
        if not self.session:
            logger.error("Session not initialized")
            return False
        
        try:
            url = f"{self.base_url}/api/tags"
            timeout = aiohttp.ClientTimeout(total=5)
            
            async with self.session.get(url, timeout=timeout) as response:
                return response.status == 200
                
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return False
    
    async def list_models(self) -> list:
        """
        List available models on Ollama
        
        Returns:
            List of available models or empty list if error
        """
        if not self.session:
            return []
        
        try:
            url = f"{self.base_url}/api/tags"
            async with self.session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    data = await response.json()
                    models = data.get("models", [])
                    return [m.get("name", "") for m in models]
                return []
        except Exception as e:
            logger.error(f"Failed to list models: {str(e)}")
            return []
