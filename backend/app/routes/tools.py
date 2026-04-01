"""
Tools API — Manage bot tools/plugins.
"""
import json
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/tools", tags=["tools"])

# Store tools in a JSON file next to .env
_TOOLS_FILE = Path(__file__).resolve().parent.parent.parent.parent / "tools.json"

_DEFAULT_TOOLS = [
    {"id": "summarize", "name": "Résumé de conversation", "description": "Résume les derniers messages d'un canal", "icon": "📝", "is_enabled": True},
    {"id": "translate", "name": "Traduction", "description": "Traduit un message dans la langue demandée", "icon": "🌍", "is_enabled": True},
    {"id": "sentiment", "name": "Analyse de sentiment", "description": "Analyse le ton émotionnel d'un message", "icon": "💡", "is_enabled": False},
    {"id": "code_review", "name": "Revue de code", "description": "Analyse et commente un extrait de code", "icon": "🔍", "is_enabled": True},
    {"id": "image_describe", "name": "Description d'image", "description": "Décrit le contenu d'une image partagée", "icon": "🖼️", "is_enabled": False},
    {"id": "tts", "name": "Synthèse vocale", "description": "Convertit du texte en audio dans un salon vocal", "icon": "🔊", "is_enabled": False},
]


class ToolOut(BaseModel):
    id: str
    name: str
    description: str
    icon: Optional[str] = "🔧"
    is_enabled: bool


class ToolPatch(BaseModel):
    is_enabled: bool


def _load_tools() -> list:
    if _TOOLS_FILE.exists():
        return json.loads(_TOOLS_FILE.read_text(encoding="utf-8"))
    return list(_DEFAULT_TOOLS)


def _save_tools(tools: list):
    _TOOLS_FILE.write_text(json.dumps(tools, ensure_ascii=False, indent=2), encoding="utf-8")


@router.get("", response_model=List[ToolOut])
def list_tools():
    return _load_tools()


@router.patch("/{tool_id}", response_model=ToolOut)
def toggle_tool(tool_id: str, patch: ToolPatch):
    tools = _load_tools()
    for t in tools:
        if t["id"] == tool_id:
            t["is_enabled"] = patch.is_enabled
            _save_tools(tools)
            return t
    # Tool not found — create on-the-fly
    new_tool = {"id": tool_id, "name": tool_id, "description": "", "icon": "🔧", "is_enabled": patch.is_enabled}
    tools.append(new_tool)
    _save_tools(tools)
    return new_tool
