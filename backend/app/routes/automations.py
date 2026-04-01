"""
Automations API — manage event-driven automations.
"""
import json
from pathlib import Path
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/automations", tags=["automations"])

_FILE = Path(__file__).resolve().parent.parent.parent.parent / "automations.json"

_DEFAULTS = [
    {"id": "anti_spam", "name": "Anti-Spam", "description": "Mute automatiquement les utilisateurs qui envoient plus de 10 messages/min", "trigger_type": "on_message (rate)", "is_enabled": True, "last_run": None},
    {"id": "welcome_dm", "name": "DM de bienvenue", "description": "Envoie un MP au nouveau membre avec les règles du serveur", "trigger_type": "on_member_join", "is_enabled": True, "last_run": None},
    {"id": "daily_digest", "name": "Digest quotidien", "description": "Résumé IA des discussions posté chaque matin dans #general", "trigger_type": "cron 08:00", "is_enabled": False, "last_run": None},
    {"id": "toxic_filter", "name": "Filtre toxicité", "description": "Analyse le sentiment des messages et supprime les contenus toxiques", "trigger_type": "on_message", "is_enabled": False, "last_run": None},
]


class AutomationOut(BaseModel):
    id: str
    name: str
    description: str
    trigger_type: str
    is_enabled: bool
    last_run: Optional[str] = None


class AutomationPatch(BaseModel):
    is_enabled: bool


def _load():
    if _FILE.exists():
        return json.loads(_FILE.read_text(encoding="utf-8"))
    return list(_DEFAULTS)


def _save(data):
    _FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


@router.get("", response_model=List[AutomationOut])
def list_automations(server_id: str = Query(default="")):
    return _load()


@router.patch("/{auto_id}", response_model=AutomationOut)
def toggle_automation(auto_id: str, patch: AutomationPatch, server_id: str = Query(default="")):
    items = _load()
    for a in items:
        if a["id"] == auto_id:
            a["is_enabled"] = patch.is_enabled
            _save(items)
            return a
    return {"id": auto_id, "name": auto_id, "description": "", "trigger_type": "", "is_enabled": patch.is_enabled, "last_run": None}
