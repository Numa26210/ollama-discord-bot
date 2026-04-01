"""
Workflows API — list configured workflows.
"""
import json
from pathlib import Path
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

_FILE = Path(__file__).resolve().parent.parent.parent.parent / "workflows.json"

_DEFAULTS = [
    {"id": "welcome", "name": "Accueil nouveaux membres", "description": "Envoie un message de bienvenue et assigne un rôle", "steps": 3, "trigger": "on_member_join", "is_active": True},
    {"id": "moderation", "name": "Auto-modération", "description": "Détecte le spam et les insultes via IA puis mute", "steps": 4, "trigger": "on_message", "is_active": True},
    {"id": "summary", "name": "Résumé quotidien", "description": "Poste un résumé IA du canal chaque soir à 22h", "steps": 2, "trigger": "cron 22:00", "is_active": False},
]


class WorkflowOut(BaseModel):
    id: str
    name: str
    description: str
    steps: int
    trigger: str
    is_active: bool


def _load():
    if _FILE.exists():
        return json.loads(_FILE.read_text(encoding="utf-8"))
    return list(_DEFAULTS)


@router.get("", response_model=List[WorkflowOut])
def list_workflows(server_id: str = Query(default="")):
    return _load()
