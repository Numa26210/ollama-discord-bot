"""
Commands API — list, create, delete bot commands.
Custom commands have type="custom" and a fixed text response.
Built-in commands have type="builtin" and cannot be deleted.
"""
import json
import re
from pathlib import Path
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, field_validator
from typing import List, Optional

router = APIRouter(prefix="/api/commands", tags=["commands"])

_FILE = Path(__file__).resolve().parent.parent.parent.parent / "commands.json"

_BUILTINS = [
    {"id": "ask", "name": "ask", "usage": "!ask <question>", "description": "Pose une question à l'IA Ollama", "is_enabled": True, "cooldown": 5, "type": "builtin"},
    {"id": "summarize", "name": "summarize", "usage": "!summarize [n]", "description": "Résume les n derniers messages du canal", "is_enabled": True, "cooldown": 10, "type": "builtin"},
    {"id": "help", "name": "help", "usage": "!help", "description": "Affiche la liste des commandes disponibles", "is_enabled": True, "cooldown": 0, "type": "builtin"},
    {"id": "ping", "name": "ping", "usage": "!ping", "description": "Vérifie la latence du bot", "is_enabled": True, "cooldown": 0, "type": "builtin"},
    {"id": "model", "name": "model", "usage": "!model [name]", "description": "Affiche ou change le modèle Ollama actif", "is_enabled": True, "cooldown": 3, "type": "builtin"},
    {"id": "clear", "name": "clear", "usage": "!clear <n>", "description": "Supprime les n derniers messages (admin)", "is_enabled": False, "cooldown": 0, "type": "builtin"},
]

# Reserved names that cannot be used for custom commands
_RESERVED = {b["name"] for b in _BUILTINS}


class CommandOut(BaseModel):
    id: str
    name: str
    usage: Optional[str] = None
    description: str
    is_enabled: bool
    cooldown: Optional[int] = 0
    type: str = "builtin"
    response: Optional[str] = None


class CommandCreate(BaseModel):
    name: str
    description: str = ""
    response: str
    cooldown: int = 0

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Le nom est requis")
        if not re.match(r'^[a-z0-9_-]+$', v):
            raise ValueError("Le nom ne peut contenir que des lettres minuscules, chiffres, - et _")
        if len(v) > 32:
            raise ValueError("Le nom doit faire 32 caractères max")
        return v

    @field_validator("response")
    @classmethod
    def validate_response(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("La réponse est requise")
        if len(v) > 2000:
            raise ValueError("La réponse doit faire 2000 caractères max (limite Discord)")
        return v


def _load() -> list:
    custom = []
    if _FILE.exists():
        try:
            raw = json.loads(_FILE.read_text(encoding="utf-8"))
            custom = [c for c in raw if c.get("type") == "custom"]
        except (json.JSONDecodeError, KeyError):
            custom = []
    return list(_BUILTINS) + custom


def _save_custom(custom_list: list):
    _FILE.write_text(json.dumps(custom_list, ensure_ascii=False, indent=2), encoding="utf-8")


def _load_custom() -> list:
    if _FILE.exists():
        try:
            raw = json.loads(_FILE.read_text(encoding="utf-8"))
            return [c for c in raw if c.get("type") == "custom"]
        except (json.JSONDecodeError, KeyError):
            pass
    return []


@router.get("", response_model=List[CommandOut])
def list_commands(server_id: str = Query(default="")):
    return _load()


@router.post("", response_model=CommandOut, status_code=201)
def create_command(body: CommandCreate):
    if body.name in _RESERVED:
        raise HTTPException(400, f"Le nom '{body.name}' est réservé à une commande système")

    custom = _load_custom()
    if any(c["name"] == body.name for c in custom):
        raise HTTPException(409, f"La commande '{body.name}' existe déjà")

    new_cmd = {
        "id": f"custom_{body.name}",
        "name": body.name,
        "usage": f"!{body.name}",
        "description": body.description or f"Commande custom : {body.name}",
        "is_enabled": True,
        "cooldown": max(0, min(body.cooldown, 300)),
        "type": "custom",
        "response": body.response,
    }
    custom.append(new_cmd)
    _save_custom(custom)
    return new_cmd


@router.delete("/{cmd_id}", status_code=204)
def delete_command(cmd_id: str):
    if not cmd_id.startswith("custom_"):
        raise HTTPException(400, "Impossible de supprimer une commande système")

    custom = _load_custom()
    filtered = [c for c in custom if c["id"] != cmd_id]
    if len(filtered) == len(custom):
        raise HTTPException(404, "Commande introuvable")

    _save_custom(filtered)


@router.patch("/{cmd_id}", response_model=CommandOut)
def toggle_command(cmd_id: str, body: dict):
    if not cmd_id.startswith("custom_"):
        raise HTTPException(400, "Impossible de modifier une commande système")

    custom = _load_custom()
    for c in custom:
        if c["id"] == cmd_id:
            if "is_enabled" in body:
                c["is_enabled"] = bool(body["is_enabled"])
            if "response" in body:
                c["response"] = str(body["response"])[:2000]
            if "description" in body:
                c["description"] = str(body["description"])[:200]
            _save_custom(custom)
            return c
    raise HTTPException(404, "Commande introuvable")
